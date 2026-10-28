/*!
 * AkihiroLabs — ShiftPay — Settings layout (v1.9)
 * - Folding sections: only one open at a time (also for browsers without <details name>).
 * - Short values on the folded rows (On / Off, language).
 * - The data status line at the top: "Saved on this device" / "Synced · email · 2 min ago".
 */
(function () {
  const $ = id => document.getElementById(id);
  const t = (k, v) => (typeof I18n !== 'undefined' ? I18n.t(k, v) : k);
  const folds = () => [...document.querySelectorAll('#view-settings details.set-fold')];

  /* ── One open section at a time ── */
  function bindFolds() {
    folds().forEach(d => d.addEventListener('toggle', () => {
      if (d.open) {
        folds().forEach(o => { if (o !== d && o.open) o.open = false; });
        // Keep the opened section's title in view
        const top = d.getBoundingClientRect().top;
        if (top < 60) d.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
      updateValues();
    }));
  }

  /* ── Values on the folded rows ── */
  function updateValues() {
    document.querySelectorAll('[data-val-switch]').forEach(el => {
      const on = $(el.dataset.valSwitch)?.checked;
      el.textContent = on ? t('on') : t('off');
      el.classList.toggle('is-on', !!on);
    });
    const ap = $('appearanceVal');
    if (ap) {
      const lang = typeof I18n !== 'undefined' && I18n.lang === 'ja' ? '日本語' : 'English';
      const dark = document.documentElement.dataset.theme === 'dark';
      ap.textContent = dark ? `${lang} · ${t('set.dark')}` : lang;
    }
  }

  /* ── Data status line ── */
  function ago(iso) {
    const sec = Math.round((Date.now() - Date.parse(iso)) / 1000);
    if (!isFinite(sec) || sec < 45) return t('set.ds.justNow');
    const rtf = new Intl.RelativeTimeFormat(typeof I18n !== 'undefined' ? I18n.locale : 'en-US', { numeric: 'auto' });
    if (sec < 3600) return rtf.format(-Math.round(sec / 60), 'minute');
    if (sec < 86400) return rtf.format(-Math.round(sec / 3600), 'hour');
    return rtf.format(-Math.round(sec / 86400), 'day');
  }

  function updateStatus() {
    const box = $('dataStatus'), text = $('dataStatusText');
    if (!box || !text) return;
    const st = typeof ShiftCloud !== 'undefined' && ShiftCloud.status ? ShiftCloud.status() : null;
    let state = 'local';
    if (st?.signedIn) {
      if (st.error) { state = 'error'; text.textContent = t('set.ds.failed'); }
      else if (st.lastSync) { state = 'synced'; text.textContent = t('set.ds.synced', { email: st.email, when: ago(st.lastSync) }); }
      else { state = 'syncing'; text.textContent = t('set.ds.notYet', { email: st.email }); }
    } else {
      text.textContent = t('set.ds.local');
    }
    box.dataset.state = state;
    box.title = state === 'local' ? t('set.ds.localHint') : '';
  }

  function init() {
    if (!$('view-settings')) return;
    bindFolds();
    // Tapping the status line opens Account & sync
    $('dataStatus')?.addEventListener('click', () => {
      const acc = $('accountBlock');
      if (acc) { acc.open = true; acc.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
    });
    document.addEventListener('change', updateValues);
    document.addEventListener('click', e => { if (e.target.closest('#langSwitch, [data-view="settings"]')) setTimeout(updateValues, 0); });
    window.addEventListener('sp:lang', () => { updateValues(); updateStatus(); });
    window.addEventListener('sp:cloud', updateStatus);
    setInterval(() => { if (document.visibilityState === 'visible') updateStatus(); }, 60 * 1000);
    // Switches can be set by other scripts after load
    setTimeout(() => { updateValues(); updateStatus(); }, 0);
    setTimeout(updateValues, 1500);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
