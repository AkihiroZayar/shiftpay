/*!
 * AkihiroLabs — ShiftPay — account & sync
 * Optional AkihiroLabs account (same account as ByteBell). Sign in with a
 * one-time email link or code; jobs, shifts, templates, fees, profile and goals then
 * sync across devices. Without signing in ShiftPay stays fully local.
 *
 * How sync works: every item is its own row. Each device remembers what it
 * last sent/received ("meta": hash + edit time per item), sends only items that
 * changed, and asks the server for rows received since its last sync.
 * If two devices edit the same item, the newest edit wins. Deletes are synced too.
 */
const ShiftCloud = (() => {
  const SUPABASE_URL = 'https://hweiqfojjyqivcfswqxj.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_RHL9Mv-QucxKU6I3zPusRw_0UCKqU9A';   // publishable key — safe in public code
  const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';
  const SYNC_KEY = 'sp_sync';
  const EPOCH = '1970-01-01T00:00:00.000Z';

  // localStorage key → synced kind. Arrays hold items with an id; singletons use id "main".
  const ARRAYS = { sp_jobs: 'job', sp_shifts: 'shift', sp_templates: 'template' };
  const SINGLES = { sp_tax: 'tax', sp_profile: 'profile', sp_goals: 'goals' };
  const KIND_TO_KEY = Object.fromEntries([...Object.entries(ARRAYS), ...Object.entries(SINGLES)].map(([k, v]) => [v, k]));

  let sb = null;
  let user = null;
  let busy = false, again = false, applying = false;
  let pendingEmail = '';
  let lastError = '';

  const $ = id => document.getElementById(id);
  const toast = (m, t) => (typeof Modals !== 'undefined' && Modals.showToast ? Modals.showToast(m, t) : console.log(m));
  const raw = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const hash = d => JSON.stringify(d);

  const getSync = () => { try { return JSON.parse(localStorage.getItem(SYNC_KEY)) || null; } catch { return null; } };
  const setSync = s => localStorage.setItem(SYNC_KEY, JSON.stringify(s));

  /* ── Local data as a flat map: "kind:id" → { kind, id, data } ── */
  function localItems() {
    const out = new Map();
    for (const [key, kind] of Object.entries(ARRAYS)) {
      for (const item of raw(key) || []) if (item && item.id) out.set(`${kind}:${item.id}`, { kind, id: String(item.id), data: item });
    }
    for (const [key, kind] of Object.entries(SINGLES)) {
      const v = raw(key);
      if (v) out.set(`${kind}:main`, { kind, id: 'main', data: v });
    }
    return out;
  }

  // Write a remote change into localStorage without triggering another upload
  function applyRemote(row) {
    const key = KIND_TO_KEY[row.kind];
    if (!key) return;
    applying = true;
    try {
      if (SINGLES[key]) {
        if (row.deleted) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(row.data));
      } else {
        const list = (raw(key) || []).filter(x => String(x.id) !== row.id);
        if (!row.deleted) list.push(row.data);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } finally { applying = false; }
  }

  /* ── Pull: rows the server received since our last sync ── */
  async function pull(state) {
    let changed = 0;
    let from = 0;
    const firstMerge = !state.lastPull;
    const local = firstMerge ? localItems() : null;
    for (;;) {
      let q = sb.from('shiftpay_items').select('kind,id,data,deleted,updated_at,synced_at')
        .order('synced_at', { ascending: true }).range(from, from + 999);
      // Small overlap so a row saved by a slow transaction isn't missed; duplicates are skipped via meta
      if (state.lastPull) q = q.gt('synced_at', new Date(Date.parse(state.lastPull) - 10000).toISOString());
      const { data, error } = await q;
      if (error) throw error;
      for (const r of data) {
        const k = `${r.kind}:${r.id}`;
        const m = state.meta[k];
        if (m && m.t >= r.updated_at) { /* we already have this or newer */ }
        else if (firstMerge && local.has(k) && !m) {
          // First sign-in on this device: keep whichever copy was edited last
          const d = local.get(k).data;
          const localT = d.updatedAt || d.createdAt || EPOCH;
          if (r.updated_at >= localT) { applyRemote(r); changed++; state.meta[k] = { h: r.deleted ? null : hash(r.data), t: r.updated_at, d: r.deleted }; }
        } else {
          applyRemote(r); changed++;
          state.meta[k] = { h: r.deleted ? null : hash(r.data), t: r.updated_at, d: r.deleted };
        }
        if (!state.lastPull || r.synced_at > state.lastPull) state.lastPull = r.synced_at;
      }
      if (data.length < 1000) break;
      from += 1000;
    }
    if (firstMerge && !state.lastPull) state.lastPull = EPOCH;
    return changed;
  }

  /* ── Push: items added, edited or deleted on this device ── */
  async function push(state) {
    const now = new Date().toISOString();
    const items = localItems();
    const rows = [];
    for (const [k, it] of items) {
      const h = hash(it.data);
      const m = state.meta[k];
      if (!m || m.d || m.h !== h) {
        rows.push({ kind: it.kind, id: it.id, data: it.data, deleted: false, updated_at: now });
        state.meta[k] = { h, t: now, d: false };
      }
    }
    for (const [k, m] of Object.entries(state.meta)) {
      if (!items.has(k) && !m.d) {
        const [kind, ...rest] = k.split(':');
        rows.push({ kind, id: rest.join(':'), data: null, deleted: true, updated_at: now });
        state.meta[k] = { h: null, t: now, d: true };
      }
    }
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await sb.from('shiftpay_items').upsert(rows.slice(i, i + 500), { onConflict: 'user_id,kind,id' });
      if (error) throw error;
    }
    return rows.length;
  }

  async function sync() {
    if (!sb || !user || !navigator.onLine) return;
    if (busy) { again = true; return; }
    busy = true;
    try {
      let state = getSync();
      if (!state || state.userId !== user.id) state = { userId: user.id, lastPull: null, meta: {} };
      const pulled = await pull(state);
      setSync(state);
      await push(state);
      state.lastSync = new Date().toISOString();
      setSync(state);
      lastError = '';
      if (pulled && typeof App !== 'undefined') App.refresh();
      if (pulled && typeof ShiftPush !== 'undefined') ShiftPush.sync().catch(() => {});
    } catch (e) {
      console.error('ShiftPay sync failed:', e);
      lastError = 'Sync failed — will retry.';
    } finally {
      busy = false;
      render();
      if (again) { again = false; syncSoon(); }
    }
  }

  let timer = null;
  const syncSoon = (ms = 1500) => { clearTimeout(timer); timer = setTimeout(sync, ms); };

  /* ── Auth: one-time email code ── */
  async function sendCode(email) {
    const { error } = await sb.auth.signInWithOtp({
      email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + '/' },
    });
    if (error) throw error;
    pendingEmail = email;
  }

  async function verifyCode(code) {
    const { data, error } = await sb.auth.verifyOtp({ email: pendingEmail, token: code, type: 'email' });
    if (error) throw error;
    pendingEmail = '';
    return data.user;
  }

  async function signOut() {
    await sb.auth.signOut().catch(() => {});
    localStorage.removeItem(SYNC_KEY);
    user = null;
    render();
    toast('Signed out. Your data stays on this device.', 'info');
  }

  /* ── Settings → Account block ── */
  function render() {
    const box = $('accountBody');
    if (!box) return;
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    if (!sb) {
      box.innerHTML = `<p class="block-hint">Account sync is unavailable right now (offline?). ShiftPay still works on this device.</p>`;
      return;
    }
    if (user) {
      const st = getSync();
      const when = st?.lastSync ? new Date(st.lastSync).toLocaleString() : 'not yet';
      box.innerHTML = `
        <div class="rows">
          <div class="row">
            <span class="row-label">${esc(user.email)}<small>${lastError ? esc(lastError) : 'Last synced: ' + esc(when)}</small></span>
            <span class="row-actions">
              <button class="btn btn-ghost btn-sm" id="syncNowBtn" type="button">Sync now</button>
              <button class="btn btn-ghost btn-sm" id="signOutBtn" type="button">Sign out</button>
            </span>
          </div>
        </div>`;
      $('syncNowBtn').onclick = () => { sync(); toast('Syncing…', 'info'); };
      $('signOutBtn').onclick = signOut;
      return;
    }
    if (pendingEmail) {
      box.innerHTML = `
        <p class="block-hint">We sent a sign-in email to <strong>${esc(pendingEmail)}</strong> (check spam too). Tap the link in it — or, if the email shows a code, enter it below.</p>
        <form class="rows" id="codeForm">
          <label class="row">
            <span class="row-label">Code</span>
            <input class="input input-w" id="codeInput" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="123456" required>
          </label>
          <div class="row row-wrap">
            <button class="btn btn-sm" type="submit">Sign in</button>
            <button class="btn btn-ghost btn-sm" type="button" id="codeBackBtn">Use another email</button>
          </div>
        </form>`;
      $('codeBackBtn').onclick = () => { pendingEmail = ''; render(); };
      $('codeForm').onsubmit = async e => {
        e.preventDefault();
        const btn = e.submitter; if (btn) btn.disabled = true;
        try {
          await verifyCode($('codeInput').value.replace(/\D/g, ''));
          toast('Signed in. Syncing your data…', 'success');
        } catch (err) {
          console.error(err);
          toast('That code didn’t work. Check it or request a new one.', 'error');
          if (btn) btn.disabled = false;
        }
      };
      $('codeInput').focus();
      return;
    }
    box.innerHTML = `
      <p class="block-hint">Optional. Sign in with your AkihiroLabs account (the same one as ByteBell) to keep your shifts in sync on all your devices. No password — we email you a sign-in link.</p>
      <form class="rows" id="emailForm">
        <label class="row">
          <span class="row-label">Email</span>
          <input class="input input-w" id="emailInput" type="email" autocomplete="email" placeholder="you@example.com" required>
        </label>
        <div class="row"><button class="btn btn-sm" type="submit">Send sign-in email</button></div>
      </form>`;
    $('emailForm').onsubmit = async e => {
      e.preventDefault();
      const btn = e.submitter; if (btn) btn.disabled = true;
      try {
        await sendCode($('emailInput').value.trim());
        render();
      } catch (err) {
        console.error(err);
        toast(/rate|limit|seconds/i.test(err.message || '') ? 'Too many requests — wait a minute and try again.' : 'Could not send the code. Try again.', 'error');
        if (btn) btn.disabled = false;
      }
    };
  }

  async function init() {
    render();
    // Upload after every local change (shift added/edited, template applied, …)
    window.addEventListener('sp:change', e => {
      if (applying || !user) return;
      if (ARRAYS[e.detail] || SINGLES[e.detail] || e.detail === 'all') syncSoon();
    });
    window.addEventListener('online', () => syncSoon(300));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncSoon(300); });

    try {
      const { createClient } = await import(CDN);
      sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    } catch (e) {
      console.warn('Supabase unavailable — ShiftPay runs local-only.', e);
      render();
      return;
    }
    sb.auth.onAuthStateChange((_evt, session) => {
      const next = session?.user || null;
      const changed = (next?.id || null) !== (user?.id || null);
      user = next;
      render();
      if (user && changed) syncSoon(100);
    });
    const { data } = await sb.auth.getSession();
    user = data?.session?.user || null;
    render();
    if (user) syncSoon(100);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  return { sync, get signedIn() { return !!user; } };
})();
