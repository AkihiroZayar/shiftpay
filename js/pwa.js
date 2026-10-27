/*!
 * AkihiroLabs — ShiftPay — PWA helper
 * - Registers the service worker and shows any [data-install] button when the
 *   browser offers "Add to Home Screen".
 * - Looks for a new version when the app opens, when it comes back to the
 *   front, and every 30 minutes. When one is installed, shows the
 *   "New update released — Restart now" card (#updateCard).
 */
(function () {
  const CHECK_EVERY = 30 * 60 * 1000;
  const $ = id => document.getElementById(id);
  const t = (k, v) => (typeof I18n !== 'undefined' ? I18n.t(k, v) : k);

  /* ── Update card ── */
  async function newVersion() {
    // The new service worker has just cached the new files, so this reads the new version number
    try {
      const txt = await (await fetch('js/version.js', { cache: 'no-store' })).text();
      return (txt.match(/APP_VERSION\s*=\s*'([^']+)'/) || [])[1] || '';
    } catch { return ''; }
  }

  let shownVersion = '';
  // Language switched while the card is open → keep the version number in the title
  window.addEventListener('sp:lang', () => {
    if (shownVersion && !$('updateCard')?.hidden) $('updateTitle').textContent = t('upd.titleV', { v: shownVersion });
  });

  async function showUpdate() {
    const card = $('updateCard');
    if (!card || !card.hidden) return;
    const current = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '';
    let v = await newVersion();
    if (v && v === current) {                             // the old cache may answer for a moment — ask again
      await new Promise(r => setTimeout(r, 2000));
      v = await newVersion();
      if (v && v === current) return;                     // already running the newest files
    }
    shownVersion = v;
    $('updateTitle').textContent = v ? t('upd.titleV', { v }) : t('upd.title');
    card.hidden = false;
    requestAnimationFrame(() => card.classList.add('show'));
  }

  function bindCard() {
    $('updateRestart')?.addEventListener('click', () => {
      $('updateRestart').disabled = true;
      location.reload();
    });
    $('updateLater')?.addEventListener('click', () => {
      const card = $('updateCard');
      card.classList.remove('show');
      setTimeout(() => { card.hidden = true; }, 250);
      // The new version loads by itself the next time ShiftPay is opened
    });
  }

  /* ── Service worker + update checks ── */
  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;   // false on the very first visit

    // A new service worker took over this page → new files are ready
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) showUpdate();
    });

    window.addEventListener('load', async () => {
      bindCard();
      let reg;
      try { reg = await navigator.serviceWorker.register('sw.js'); } catch { return; }
      const check = () => reg.update().catch(() => {});
      setInterval(check, CHECK_EVERY);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
      // If an update was already installed while the app was in the background
      if (reg.waiting) { reg.waiting.postMessage('skipWaiting'); }
    });
  } else {
    window.addEventListener('load', bindCard);
  }

  /* ── Install button ── */
  let deferred = null;
  const buttons = () => document.querySelectorAll('[data-install]');
  const show = on => buttons().forEach(b => { b.hidden = !on; });

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e;
    show(true);
  });
  window.addEventListener('appinstalled', () => { deferred = null; show(false); });

  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-install]');
    if (!btn || !deferred) return;
    e.preventDefault();
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    deferred = null;
    show(false);
  });
})();
