/**
 * app.js — ShiftPay Application Controller (v1.2 minimalist layout)
 * 4 views: Home · Calendar · Jobs · Settings
 *  - Home:     one big number (Week / Month / Year), take-home, goal + 年収の壁 bars,
 *              recent shifts, folded details (by job + chart)
 *  - Jobs:     jobs list + repeating shifts (templates)
 *  - Settings: profile & goals, tax & fees, report export, data, appearance
 * By AkihiroLabs.
 */

const App = (() => {

  const VIEWS   = ['home', 'calendar', 'jobs', 'settings'];
  /* Old view names (v1.1) → new home */
  const ALIASES = { dashboard: 'home', reports: 'settings', tax: 'settings', profile: 'settings', templates: 'jobs' };
  const TITLES  = { home: 'Home', calendar: 'Calendar', jobs: 'Jobs', settings: 'Settings' };
  const DOW     = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let _view          = 'home';
  let _period        = 'month';
  let _calendarReady = false;

  /* ── Helpers ── */
  const $    = id => document.getElementById(id);
  const yen  = n  => Income.formatCurrency(n);
  const hrs  = n  => Income.formatHours(n);
  const plural = (n, word) => `${n} ${word}${n !== 1 ? 's' : ''}`;

  function _esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function _fmtDate(dateStr, opts = { weekday: 'short', month: 'short', day: 'numeric' }) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', opts);
  }

  function _saveSetting(patch) {
    Storage.saveSettings({ ...Storage.getSettings(), ...patch });
  }

  /* ════════════════════════════════════════════
     NAVIGATION
  ════════════════════════════════════════════ */
  function navigateTo(view) {
    view = ALIASES[view] || view;
    if (!VIEWS.includes(view)) return;
    _view = view;

    document.querySelectorAll('.nav-link, .tab[data-view]').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(el => {
      el.classList.toggle('active', el.id === `view-${view}`);
    });

    _setTitle();

    if (view === 'calendar') {
      if (!_calendarReady) { CalendarView.init(); _calendarReady = true; }
      CalendarView.refresh();
    }
    _renderView(view);
    window.scrollTo({ top: 0 });
  }

  function _setTitle() {
    const name = Storage.getProfile().name;
    $('pageTitle').textContent = _view === 'home' && name ? `Hi, ${name}` : TITLES[_view];
  }

  function _renderView(view) {
    if (view === 'home')     _renderHome();
    if (view === 'jobs')     { _renderJobs(); _renderTemplates(); }
    if (view === 'settings') _renderSettings();
  }

  /* ════════════════════════════════════════════
     HOME
  ════════════════════════════════════════════ */
  function _renderHome() {
    const jobs   = Storage.getJobs();
    const shifts = Storage.getShifts();

    /* ─ Empty state ─ */
    const empty = !jobs.length || !shifts.length;
    $('homeEmpty').hidden = !empty;
    $('homeMain').hidden  = empty;
    if (empty) {
      if (!jobs.length) {
        $('homeEmptyTitle').textContent = 'Welcome to ShiftPay';
        $('homeEmptyText').textContent  = 'Start by adding a job with your hourly wage.';
        $('homeEmptyBtn').textContent   = 'Add a job';
      } else {
        $('homeEmptyTitle').textContent = 'No shifts yet';
        $('homeEmptyText').textContent  = 'Add your first shift and your earnings will show up here.';
        $('homeEmptyBtn').textContent   = 'Add your first shift';
      }
      return;
    }

    document.querySelectorAll('.segmented [data-period]').forEach(b =>
      b.classList.toggle('active', b.dataset.period === _period));

    const tax = Storage.getTaxSettings();
    const p   = _periodData(_period, tax);

    $('heroLabel').textContent  = p.label;
    $('heroAmount').textContent = yen(p.stat.gross);
    $('heroMeta').textContent   = `${plural(p.stat.count, 'shift')} · ${hrs(p.stat.hours)}`;

    /* Take-home (monthly deductions → month view only) */
    const netEl = $('heroNet');
    if (_period === 'month' && tax.enabled && p.stat.deductions > 0) {
      netEl.innerHTML = `Take-home ≈ <strong>${yen(p.stat.net)}</strong> after ${yen(p.stat.deductions)} tax &amp; fees`;
      netEl.hidden = false;
    } else {
      netEl.hidden = true;
    }

    /* Upcoming shifts already counted in this period */
    const today    = Income.todayKey();
    const upcoming = p.shifts.filter(s => s.date > today);
    const noteEl   = $('heroNote');
    if (upcoming.length) {
      const upAgg = Income.calcAggregate(upcoming);
      noteEl.textContent = `Includes ${yen(upAgg.gross)} from ${plural(upcoming.length, 'upcoming shift')}`;
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
    }

    _renderProgress(p);
    _renderRecent(jobs);
    if ($('homeDetails').open) _renderDetails(p);
  }

  /* Build numbers for Week / Month / Year */
  function _periodData(period, tax) {
    const now = new Date();
    const y   = now.getFullYear();
    const m   = now.getMonth();

    if (period === 'week') {
      const dow    = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        return JapaneseHolidays.toKey(d);
      });
      const shifts = Storage.getShiftsInRange(days[0], days[6]);
      return {
        label:  `This week · ${_fmtDate(days[0], { month: 'short', day: 'numeric' })} – ${_fmtDate(days[6], { month: 'short', day: 'numeric' })}`,
        stat:   Income.getThisWeek(tax),
        shifts,
        chartLabels: days.map(k => DOW[new Date(k + 'T12:00:00').getDay()]),
        chartData:   days.map(k => Math.round(Income.calcAggregate(shifts.filter(s => s.date === k)).gross)),
      };
    }

    if (period === 'year') {
      const monthly = Income.getMonthlyBreakdown(y, tax);
      return {
        label:  String(y),
        stat:   Income.getYear(y, tax),
        shifts: Storage.getShiftsForYear(y),
        chartLabels: monthly.map(x => x.label),
        chartData:   monthly.map(x => Math.round(x.gross)),
      };
    }

    /* month (default) */
    const shifts = Storage.getShiftsForMonth(y, m);
    const nDays  = new Date(y, m + 1, 0).getDate();
    const keys   = Array.from({ length: nDays }, (_, i) =>
      `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
    return {
      label:  now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      stat:   Income.getMonth(y, m, tax),
      shifts,
      chartLabels: keys.map((_, i) => String(i + 1)),
      chartData:   keys.map(k => Math.round(Income.calcAggregate(shifts.filter(s => s.date === k)).gross)),
    };
  }

  /* Monthly goal + yearly limit (年収の壁) bars */
  function _renderProgress(p) {
    const el    = $('progressBlock');
    const goals = Storage.getGoals();
    const parts = [];

    if (_period === 'month' && goals.monthlyGross > 0) {
      const gross = p.stat.gross;
      const pct   = Math.min(100, Math.round(gross / goals.monthlyGross * 100));
      const done  = gross >= goals.monthlyGross;
      parts.push(_progressHTML({
        title: 'Monthly goal',
        value: `${yen(gross)} / ${yen(goals.monthlyGross)}`,
        pct,
        cls:   done ? 'is-done' : '',
        foot:  done ? 'Goal reached 🎉' : `${yen(goals.monthlyGross - gross)} to go`,
      }));
    }

    if (goals.yearlyLimit > 0) {
      const year  = new Date().getFullYear();
      const gross = Income.getYear(year, null).gross;
      const ratio = gross / goals.yearlyLimit;
      const pct   = Math.min(100, Math.round(ratio * 100));
      const over  = gross > goals.yearlyLimit;
      parts.push(_progressHTML({
        title: `年収の壁 · ${year}`,
        value: `${yen(gross)} / ${yen(goals.yearlyLimit)}`,
        pct,
        cls:   over ? 'is-over' : ratio >= 0.85 ? 'is-warn' : '',
        foot:  over ? `Over by ${yen(gross - goals.yearlyLimit)}` : `${yen(goals.yearlyLimit - gross)} left this year`,
      }));
    }

    el.innerHTML = parts.join('');
    el.hidden    = !parts.length;
  }

  function _progressHTML({ title, value, pct, cls, foot }) {
    return `
      <div class="progress ${cls}">
        <div class="progress-top"><span>${title}</span><span class="num">${value}</span></div>
        <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
        <p class="progress-foot">${foot}</p>
      </div>`;
  }

  /* Next shift + recent (past) shifts */
  function _renderRecent(jobs) {
    const container = $('recentShiftsList');
    const jobMap    = new Map(jobs.map(j => [j.id, j]));
    const today     = Income.todayKey();
    const all       = Storage.getShifts();

    const next = all.filter(s => s.date >= today && jobMap.has(s.jobId))
                    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
                    .find(s => s.date > today || s.startTime >= new Date().toTimeString().slice(0, 5));

    const recent = all.filter(s => s.date <= today && jobMap.has(s.jobId) && s !== next)
                      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
                      .slice(0, 5);

    let html = '';
    if (next) html += _shiftRowHTML(next, jobMap.get(next.jobId), 'Next');
    html += recent.map(s => _shiftRowHTML(s, jobMap.get(s.jobId))).join('');
    container.innerHTML = html || `<p class="list-empty">No past shifts yet.</p>`;
  }

  function _shiftRowHTML(shift, job, tag) {
    const d  = Income.calcShiftDetails(shift, job, null);
    const ot = d.overtimeDetails;
    const badges = [
      tag             ? `<span class="tag tag-accent">${tag}</span>` : '',
      d.isHoliday     ? `<span class="tag">祝</span>` : '',
      ot?.hasOvertime ? `<span class="tag">OT</span>` : '',
      ot?.hasLateNight ? `<span class="tag">深夜</span>` : '',
    ].join('');
    return `
      <button class="item" data-shift-id="${shift.id}">
        <span class="dot" style="background:${_esc(job.color)}"></span>
        <span class="item-main">
          <span class="item-title">${_esc(job.name)} ${badges}</span>
          <span class="item-sub">${_fmtDate(shift.date)} · ${shift.startTime}–${shift.endTime} · ${hrs(d.workedHours)}</span>
        </span>
        <span class="item-amount">${yen(d.gross)}</span>
      </button>`;
  }

  /* Folded details: by job + income chart */
  function _renderDetails(p) {
    p = p || _periodData(_period, Storage.getTaxSettings());
    const byJob = Income.getIncomeByJob(p.shifts);
    const total = byJob.reduce((sum, j) => sum + j.gross, 0) || 1;

    $('byJobList').innerHTML = byJob.length ? byJob.map(j => `
      <div class="item item-static">
        <span class="dot" style="background:${_esc(j.color)}"></span>
        <span class="item-main">
          <span class="item-title">${_esc(j.jobName)}</span>
          <span class="item-sub">${plural(j.count, 'shift')} · ${hrs(j.hours)} · ${Math.round(j.gross / total * 100)}%</span>
        </span>
        <span class="item-amount">${yen(j.gross)}</span>
      </div>`).join('') : `<p class="list-empty">No shifts in this period.</p>`;

    ChartsView.renderSimpleBar('homeChart', p.chartLabels, p.chartData);
  }

  /* ════════════════════════════════════════════
     JOBS
  ════════════════════════════════════════════ */
  function _renderJobs() {
    const jobs  = Storage.getJobs();
    const list  = $('jobsList');
    $('jobsEmpty').hidden = !!jobs.length;
    $('addJobBtn').hidden = !jobs.length;

    const all = Storage.getShifts();
    list.innerHTML = jobs.map(job => {
      const agg = Income.calcAggregate(all.filter(s => s.jobId === job.id));
      const sub = [job.company, plural(agg.count, 'shift'), `${yen(agg.gross)} earned`].filter(Boolean).map(_esc).join(' · ');
      return `
        <button class="item" data-job-id="${job.id}">
          <span class="dot" style="background:${_esc(job.color)}"></span>
          <span class="item-main">
            <span class="item-title">${_esc(job.name)}</span>
            <span class="item-sub">${sub}</span>
          </span>
          <span class="item-amount">${yen(job.baseWage)}<small>/hr</small></span>
        </button>`;
    }).join('');
  }

  function _renderTemplates() {
    const templates = Storage.getTemplates();
    const jobMap    = new Map(Storage.getJobs().map(j => [j.id, j]));
    const list      = $('templatesList');
    const now       = new Date();

    if (!templates.length) {
      list.innerHTML = `<p class="list-empty">No repeating shifts yet.</p>`;
      return;
    }

    const order = [1, 2, 3, 4, 5, 6, 0];
    const monthOptions = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return `<option value="${d.getFullYear()}-${d.getMonth()}">${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</option>`;
    }).join('');

    list.innerHTML = templates.map(tpl => {
      const job  = jobMap.get(tpl.jobId);
      const days = order.filter(d => (tpl.daysOfWeek || []).includes(d)).map(d => DOW[d]).join(', ') || 'No days';
      return `
        <div class="item item-static item-tpl">
          <span class="dot" style="background:${_esc(job?.color || '#94a3b8')}"></span>
          <span class="item-main">
            <span class="item-title">${_esc(tpl.name)}</span>
            <span class="item-sub">${_esc(job ? job.name : 'Deleted job')} · ${days} · ${tpl.startTime}–${tpl.endTime}</span>
          </span>
          <span class="item-actions">
            <select class="input input-xs tpl-month-sel" data-id="${tpl.id}" aria-label="Month">${monthOptions}</select>
            <button class="btn btn-ghost btn-sm tpl-apply-btn" data-id="${tpl.id}" ${job ? '' : 'disabled'}>Fill</button>
            <button class="icon-btn tpl-delete-btn" data-id="${tpl.id}" aria-label="Delete"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
          </span>
        </div>`;
    }).join('');
  }

  function _bindJobs() {
    $('jobsList').addEventListener('click', e => {
      const row = e.target.closest('[data-job-id]');
      if (row) Modals.openJobModal(row.dataset.jobId);
    });

    $('templatesList').addEventListener('click', e => {
      const del = e.target.closest('.tpl-delete-btn');
      if (del) {
        Modals.showConfirm('Delete repeating shift', 'Remove this pattern? Shifts already added stay on your calendar.').then(ok => {
          if (!ok) return;
          Storage.deleteTemplate(del.dataset.id);
          _renderTemplates();
          Modals.showToast('Deleted.', 'info');
        });
        return;
      }
      const apply = e.target.closest('.tpl-apply-btn');
      if (apply) {
        const sel = $('templatesList').querySelector(`.tpl-month-sel[data-id="${apply.dataset.id}"]`);
        const [yr, mo] = sel.value.split('-').map(Number);
        const count = Storage.applyTemplate(apply.dataset.id, yr, mo);
        refresh();
        Modals.showToast(count ? `${plural(count, 'shift')} added.` : 'Nothing new to add — those days are already filled.', count ? 'success' : 'info');
      }
    });

    $('addJobBtn').addEventListener('click',  () => Modals.openJobModal(null));
    $('addJobBtn2').addEventListener('click', () => Modals.openJobModal(null));
    $('addTemplateBtn').addEventListener('click', () => {
      if (!Storage.getJobs().length) { Modals.showToast('Add a job first.', 'info'); return; }
      Modals.openTemplateModal();
    });
  }

  /* ════════════════════════════════════════════
     SETTINGS
  ════════════════════════════════════════════ */
  function _renderSettings() {
    const profile = Storage.getProfile();
    const goals   = Storage.getGoals();
    $('profileName').value      = profile.name || '';
    $('monthlyGoalInput').value = goals.monthlyGross || '';
    $('yearlyLimitInput').value = goals.yearlyLimit  || '';
    _markLimitPreset(goals.yearlyLimit);

    _renderTax();

    Reports.refreshSelectors();
    Reports.render();

    const jobs = Storage.getJobs().length, shifts = Storage.getShifts().length;
    $('dataStats').textContent = `${plural(jobs, 'job')} · ${plural(shifts, 'shift')} · saved in this browser`;

    $('darkModeToggle').checked = document.documentElement.dataset.theme === 'dark';
    $('aboutLine').textContent  = `ShiftPay v${typeof APP_VERSION !== 'undefined' ? APP_VERSION : ''} · 🦝 AkihiroLabs`;
  }

  function _markLimitPreset(value) {
    document.querySelectorAll('#limitPresets .chip').forEach(c =>
      c.classList.toggle('active', Number(c.dataset.limit) === (Number(value) || 0)));
  }

  function _bindSettings() {
    /* Profile & goals — save on change */
    $('profileName').addEventListener('change', e => {
      Storage.saveProfile({ ...Storage.getProfile(), name: e.target.value.trim() });
      _setTitle();
      Modals.showToast('Saved.', 'success');
    });
    $('monthlyGoalInput').addEventListener('change', e => {
      Storage.saveGoals({ monthlyGross: Math.max(0, parseInt(e.target.value) || 0) });
      Modals.showToast('Goal saved.', 'success');
    });
    $('yearlyLimitInput').addEventListener('change', e => {
      const v = Math.max(0, parseInt(e.target.value) || 0);
      Storage.saveGoals({ yearlyLimit: v });
      _markLimitPreset(v);
      Modals.showToast('Limit saved.', 'success');
    });
    $('limitPresets').addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const v = Number(chip.dataset.limit) || 0;
      Storage.saveGoals({ yearlyLimit: v });
      $('yearlyLimitInput').value = v || '';
      _markLimitPreset(v);
      Modals.showToast(v ? `Limit set to ${yen(v)}.` : 'Limit turned off.', 'success');
    });

    /* Tax master switch */
    $('taxEnabled').addEventListener('change', e => {
      Storage.saveTaxSettings({ ...Storage.getTaxSettings(), enabled: e.target.checked });
      _renderTax();
    });

    /* Tax list — delegated events */
    const list = $('taxItemsList');
    list.addEventListener('change', e => {
      if (e.target.matches('.tax-toggle')) {
        Storage.updateTaxItem(e.target.dataset.id, { enabled: e.target.checked });
        _renderTax();
      }
    });
    list.addEventListener('input', e => {
      if (e.target.matches('.tax-amount-input')) {
        Storage.updateTaxItem(e.target.dataset.id, { monthlyAmount: parseInt(e.target.value) || 0 });
        _updateTaxTotal();
      }
    });
    list.addEventListener('click', e => {
      const rm = e.target.closest('.tax-remove-btn');
      if (rm) { Storage.removeTaxItem(rm.dataset.id); _renderTax(); return; }
      if (e.target.closest('#confirmAddTaxBtn')) {
        const label  = $('newTaxLabel').value.trim();
        const amount = parseInt($('newTaxAmount').value) || 0;
        if (!label) { Modals.showToast('Enter a name for the fee.', 'error'); return; }
        Storage.addTaxItem({ label, category: 'custom', monthlyAmount: amount });
        _renderTax();
        Modals.showToast('Fee added.', 'success');
      }
    });

    /* Data */
    $('exportDataBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(Storage.exportAll(), null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: `shiftpay-backup-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      Modals.showToast('Backup downloaded.', 'success');
    });

    $('importFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try { Storage.importAll(JSON.parse(ev.target.result)); _initTheme(); refresh(); Modals.showToast('Backup restored.', 'success'); }
        catch { Modals.showToast('Import failed — not a ShiftPay backup file.', 'error'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    $('loadSampleBtn').addEventListener('click', () => {
      Modals.showConfirm('Load demo data', 'This replaces your current jobs and shifts with sample data. Continue?').then(ok => {
        if (!ok) return;
        Storage.loadSampleData();
        refresh();
        Modals.showToast('Demo data loaded.', 'success');
      });
    });

    $('clearDataBtn').addEventListener('click', () => {
      Modals.showConfirm('Clear all data', 'Permanently delete all jobs, shifts and fees? This cannot be undone.').then(ok => {
        if (!ok) return;
        Storage.clearAll();
        refresh();
        Modals.showToast('All data cleared.', 'info');
      });
    });

    /* Appearance */
    $('darkModeToggle').addEventListener('change', e => {
      const theme = e.target.checked ? 'dark' : 'light';
      _applyTheme(theme);
      _saveSetting({ theme });
      ChartsView.destroyAll();
      if ($('homeDetails').open && _view === 'home') _renderDetails();
    });
  }

  /* ── Tax & fees list ── */
  function _renderTax() {
    const tax  = Storage.getTaxSettings();
    const on   = !!tax.enabled;
    const list = $('taxItemsList');
    $('taxEnabled').checked = on;
    list.classList.toggle('is-off', !on);

    list.innerHTML = (tax.items || []).map(item => `
      <div class="tax-item">
        <label class="switch switch-sm">
          <input type="checkbox" class="tax-toggle" data-id="${item.id}" ${item.enabled ? 'checked' : ''} ${on ? '' : 'disabled'}>
          <span class="switch-track"></span>
        </label>
        <span class="tax-name">${_esc(item.label)}${item.labelEn ? ` <small>${_esc(item.labelEn)}</small>` : ''}</span>
        <span class="input-yen">
          <input type="number" class="input input-xs tax-amount-input" data-id="${item.id}"
                 value="${item.monthlyAmount || 0}" min="0" step="100" ${on && item.enabled ? '' : 'disabled'} aria-label="${_esc(item.label)} per month">
        </span>
        ${item.removable
          ? `<button class="icon-btn tax-remove-btn" data-id="${item.id}" aria-label="Remove"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`
          : `<span class="icon-spacer"></span>`}
      </div>`).join('') + (on ? `
      <div class="tax-add">
        <input type="text" id="newTaxLabel" class="input" placeholder="Add a fee, e.g. 自転車代">
        <span class="input-yen"><input type="number" id="newTaxAmount" class="input input-xs" placeholder="0" min="0" step="100"></span>
        <button class="btn btn-ghost btn-sm" id="confirmAddTaxBtn">Add</button>
      </div>` : '');

    _updateTaxTotal();
  }

  function _updateTaxTotal() {
    const tax   = Storage.getTaxSettings();
    const total = Income.calcMonthlyDeductions(tax);
    $('taxTotal').textContent = tax.enabled ? `Total ${yen(total)} / month` : '';
  }

  /* ════════════════════════════════════════════
     THEME
  ════════════════════════════════════════════ */
  function _initTheme() {
    _applyTheme(Storage.getSettings().theme || 'light');
  }

  function _applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0F1115' : '#1E3A8A');
  }

  /* ════════════════════════════════════════════
     GLOBAL BINDINGS
  ════════════════════════════════════════════ */
  function _openAddShift() {
    if (!Storage.getJobs().length) {
      Modals.showToast('Add a job first — then you can log shifts.', 'info');
      Modals.openJobModal(null);
      return;
    }
    Modals.openShiftModal(null);
  }

  function _bindNav() {
    document.querySelectorAll('.nav-link, .tab[data-view]').forEach(link => {
      link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.dataset.view); });
    });
    document.querySelector('.tab[data-action="addShift"]').addEventListener('click', e => {
      e.preventDefault(); _openAddShift();
    });
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => navigateTo(el.dataset.nav));
    });
    $('addShiftBtn').addEventListener('click', _openAddShift);

    /* Home */
    document.querySelectorAll('.segmented [data-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        _period = btn.dataset.period;
        _saveSetting({ homePeriod: _period });
        _renderHome();
      });
    });
    $('homeEmptyBtn').addEventListener('click', _openAddShift);
    $('recentShiftsList').addEventListener('click', e => {
      const row = e.target.closest('[data-shift-id]');
      if (row) Modals.openShiftModal(null, row.dataset.shiftId);
    });
    $('homeDetails').addEventListener('toggle', () => {
      if ($('homeDetails').open) _renderDetails();
    });
  }

  /* ════════════════════════════════════════════
     GLOBAL REFRESH
  ════════════════════════════════════════════ */
  function refresh() {
    if (_calendarReady) CalendarView.refresh();
    _setTitle();
    _renderView(_view);
  }

  /* ════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════ */
  function init() {
    _initTheme();
    /* AkihiroLabs Discord links */
    document.querySelectorAll('[data-discord]').forEach(a => {
      a.href = typeof DISCORD_URL !== 'undefined' ? DISCORD_URL : '#';
    });
    const saved = Storage.getSettings().homePeriod;
    if (['week', 'month', 'year'].includes(saved)) _period = saved;

    _bindNav();
    _bindJobs();
    _bindSettings();
    Modals.init();
    Reports.init();
    navigateTo('home');
  }

  return { init, refresh, navigateTo };

})();

document.addEventListener('DOMContentLoaded', () => App.init());
