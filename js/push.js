/*!
 * AkihiroLabs — ShiftPay — shift reminders (Web Push)
 * Sends your upcoming shifts to the AkihiroLabs push server so a reminder
 * arrives before each one, even when ShiftPay is closed. No login needed:
 * the device's push subscription is the only identifier.
 */
const ShiftPush = (() => {
  const API   = 'https://hweiqfojjyqivcfswqxj.supabase.co/functions/v1/app-push';
  const VAPID = 'BNckc5DCi6wpWbYV44DLaiJP1rULRwg4wq5JhmJKzP2cINsrhJaDLcMJSA-H1S1f7fLL9DMZyPx84YeQn1l_Ia0';
  const KEY   = 'sp_push';
  const DAYS_AHEAD = 60;

  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

  const $ = id => document.getElementById(id);
  const getPrefs  = () => { try { return { on: false, lead: 30, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return { on: false, lead: 30 }; } };
  const savePrefs = p => localStorage.setItem(KEY, JSON.stringify(p));
  const t = (k, v) => I18n.t(k, v);
  const toast = (m, ty) => (typeof Modals !== 'undefined' && Modals.showToast ? Modals.showToast(m, ty) : console.log(m));

  function b64ToUint8(b64) {
    const pad = '='.repeat((4 - b64.length % 4) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }

  /* Upcoming shifts → reminder events (times in UTC) */
  function buildEvents(lead) {
    const now = Date.now();
    const until = now + DAYS_AHEAD * 86400000;
    const jobs = new Map(Storage.getJobs().map(j => [j.id, j]));
    return Storage.getShifts()
      .map(s => {
        const start = new Date(`${s.date}T${s.startTime}:00`);
        const at = start.getTime() - lead * 60000;
        const job = jobs.get(s.jobId);
        const leadText = lead >= 60 ? t('push.hour', { n: lead / 60 }) : t('push.min', { n: lead });
        return {
          at: new Date(at).toISOString(),
          title: t('push.title', { lead: leadText }),
          body: `${job ? job.name : t('push.shift')} · ${s.startTime}–${s.endTime}`,
          tag: `shift-${s.id}`,
          _t: at,
        };
      })
      .filter(e => !Number.isNaN(e._t) && e._t > now && e._t < until)
      .sort((a, b) => a._t - b._t)
      .slice(0, 120)
      .map(({ _t, ...e }) => e);
  }

  async function post(body) {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`push server ${r.status}`);
    return r.json();
  }

  async function currentSub() {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  }

  async function sync() {
    const p = getPrefs();
    if (!p.on || !supported) return;
    const sub = await currentSub();
    if (!sub) { savePrefs({ ...p, on: false }); render(); return; }
    await post({
      action: 'subscribe', app: 'shiftpay', sub: sub.toJSON(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone, events: buildEvents(p.lead),
    });
  }

  let timer = null;
  const syncSoon = () => { clearTimeout(timer); timer = setTimeout(() => sync().catch(console.error), 1500); };

  async function enable() {
    if (isIos && !standalone) { toast(t('push.iosFirst'), 'info'); return false; }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast(t('push.blocked'), 'error'); return false; }
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ||
      await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(VAPID) });
    savePrefs({ ...getPrefs(), on: true });
    await sync();
    toast(t('push.on'), 'success');
    return true;
  }

  async function disable() {
    savePrefs({ ...getPrefs(), on: false });
    const sub = await currentSub().catch(() => null);
    if (sub) {
      await post({ action: 'unsubscribe', endpoint: sub.endpoint }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
    toast(t('push.off'), 'info');
  }

  function render() {
    const block = $('notifyBlock');
    if (!block) return;
    const p = getPrefs();
    const toggle = $('pushToggle');
    const hint = $('pushHint');
    $('pushLead').value = String(p.lead);
    $('pushLead').disabled = !p.on;
    toggle.checked = p.on;
    toggle.disabled = !supported && !isIos;
    if (!supported && !isIos) hint.textContent = t('push.noSupport');
    else if (isIos && !standalone) hint.textContent = t('push.iosHint');
    else if ('Notification' in window && Notification.permission === 'denied') hint.textContent = t('push.blockedHint');
    else hint.textContent = t('set.remindHint');
  }

  function init() {
    if (!$('notifyBlock')) return;
    render();
    $('pushToggle').addEventListener('change', async e => {
      e.target.disabled = true;
      try {
        if (e.target.checked) { if (!(await enable())) e.target.checked = false; }
        else await disable();
      } catch (err) {
        console.error(err);
        toast(t('push.fail'), 'error');
        e.target.checked = getPrefs().on;
      }
      render();
    });
    $('pushLead').addEventListener('change', e => {
      savePrefs({ ...getPrefs(), lead: Number(e.target.value) || 30 });
      syncSoon();
      toast(t('saved'), 'success');
    });
    // Re-send reminders whenever shifts or jobs change, and on every app open
    // New language → re-send reminder texts in that language, and refresh the hint
    window.addEventListener('sp:lang', () => { render(); syncSoon(); });
    window.addEventListener('sp:change', e => { if (e.detail === 'sp_shifts' || e.detail === 'sp_jobs') syncSoon(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncSoon(); });
    syncSoon();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  return { sync, enable, disable };
})();
