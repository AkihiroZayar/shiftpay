/**
 * app.js — ShiftPay Application Controller
 * Handles navigation, all view rendering, profile, goals,
 * templates, Tax & Fees (items array), theme, and data management.
 */

const App = (() => {

  const VIEWS = ['dashboard','calendar','jobs','templates','reports','tax','settings','profile'];
  let _view          = 'dashboard';
  let _calendarReady = false;

  /* ════════════════════════════════════════════
     NAVIGATION
  ════════════════════════════════════════════ */
  function navigateTo(view) {
    if (!VIEWS.includes(view)) return;
    _view = view;

    document.querySelectorAll('.nav-link, .mbn-item[data-view]').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });

    document.querySelectorAll('.view').forEach(el => {
      el.classList.toggle('active', el.id === `view-${view}`);
    });

    const titles = {
      dashboard: 'Dashboard', calendar: 'Calendar', jobs: 'Jobs',
      templates: 'Templates', reports: 'Reports',
      tax: 'Tax & Fees', settings: 'Settings', profile: 'Profile',
    };
    document.getElementById('pageTitle').textContent = titles[view] || view;

    if (view === 'calendar') {
      if (!_calendarReady) { CalendarView.init(); _calendarReady = true; }
      CalendarView.refresh();
    }

    if (view === 'dashboard') _renderDashboard();
    if (view === 'jobs')      _renderJobs();
    if (view === 'templates') _renderTemplates();
    if (view === 'reports')   { Reports.refreshSelectors(); Reports.render(); }
    if (view === 'tax')       _renderTax();
    if (view === 'settings')  _renderSettings();
    if (view === 'profile')   _renderProfile();

    if (window.innerWidth < 900) {
      document.getElementById('sidebar')?.classList.remove('open');
    }
  }

  /* ════════════════════════════════════════════
     DASHBOARD
  ════════════════════════════════════════════ */
  function _renderDashboard() {
    const tax = Storage.getTaxSettings();
    const now = new Date();
    const y   = now.getFullYear();
    const m   = now.getMonth();

    const todayStat = Income.getToday(tax);
    const weekStat  = Income.getThisWeek(tax);
    const monthStat = Income.getMonth(y, m, tax);
    const yearStat  = Income.getYear(y, tax);
    const allStat   = Income.getAll(tax);

    const grid = document.getElementById('statsGrid');
    if (grid) {
      grid.innerHTML = [
        { label:'Today',      ...todayStat },
        { label:'This Week',  ...weekStat  },
        { label:'This Month', ...monthStat },
        { label:'This Year',  ...yearStat  },
        { label:'All Time',   ...allStat   },
      ].map(c => `
        <div class="stat-card">
          <span class="stat-label">${c.label}</span>
          <span class="stat-value">${Income.formatCurrency(c.gross)}</span>
          ${tax.enabled && c.deductions > 0 ? `<span class="stat-net">Net ${Income.formatCurrency(c.net)}</span>` : ''}
          <span class="stat-meta">${c.count} shift${c.count !== 1 ? 's' : ''} · ${Income.formatHours(c.hours)}</span>
        </div>`).join('');
    }

    _renderProjection(y, m, tax);
    _renderGoalProgress(monthStat.gross);
    _renderRecentShifts(tax);
    _renderMonthSummary(y, m, tax);
  }

  function _renderMonthSummary(year, month, tax) {
    const el = document.getElementById('monthSummaryContent');
    if (!el) return;
    const now        = new Date();
    const monthData  = Income.getMonth(year, month, tax);
    const jobs       = Storage.getJobs();
    const allShifts  = Storage.getShiftsForMonth(year, month);
    const jobMap     = new Map(jobs.map(j => [j.id, j]));

    if (!allShifts.length) {
      el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:20px 0">No shifts this month yet.</p>`;
      return;
    }

    /* Income per job this month */
    const byJob = {};
    allShifts.forEach(s => {
      const job = jobMap.get(s.jobId);
      if (!job) return;
      const d = Income.calcShiftDetails(s, job, tax);
      if (!byJob[s.jobId]) byJob[s.jobId] = { name: job.name, color: job.color, gross: 0, hours: 0 };
      byJob[s.jobId].gross += d.gross;
      byJob[s.jobId].hours += d.workedHours;
    });

    const rows = Object.values(byJob).sort((a,b) => b.gross - a.gross).map(j => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:10px;height:10px;border-radius:50%;background:${j.color};display:inline-block;flex-shrink:0"></span>
          <span style="font-size:13px;font-weight:500">${j.name}</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:700;font-family:var(--font-mono);color:var(--accent-gold)">${Income.formatCurrency(j.gross)}</div>
          <div style="font-size:11px;color:var(--text-muted)">${Income.formatHours(j.hours)}</div>
        </div>
      </div>`).join('');

    el.innerHTML = rows + `
      <div style="display:flex;justify-content:space-between;padding:12px 0;font-weight:700">
        <span>Total</span>
        <span style="font-family:var(--font-mono);color:var(--accent-green)">${Income.formatCurrency(monthData.gross)}</span>
      </div>`;
  }

  function _renderProjection(year, month, tax) {
    const banner = document.getElementById('projectionBanner');
    if (!banner) return;
    const proj = Income.getProjected(year, month, tax);
    if (proj.total.count === 0) { banner.innerHTML = ''; return; }
    const pct = proj.completionPct;
    banner.innerHTML = `
      <div class="proj-content">
        <div class="proj-left">
          <div class="proj-title">Month Projection</div>
          <div class="proj-amount">${Income.formatCurrency(proj.total.gross)}</div>
          ${tax.enabled ? `<div class="proj-net-label">Net ${Income.formatCurrency(proj.total.net)}</div>` : ''}
        </div>
        <div class="proj-right">
          <div class="proj-meta">
            <span>Earned: ${Income.formatCurrency(proj.earned.gross)}</span>
            <span>${proj.daysRemaining} day${proj.daysRemaining !== 1 ? 's' : ''} left</span>
          </div>
          <div class="proj-bar"><div class="proj-bar-fill" style="width:${pct}%"></div></div>
          <div class="proj-shifts-meta">${proj.earned.count} done · ${proj.projected.count} upcoming</div>
        </div>
      </div>`;
  }

  function _renderGoalProgress(monthGross) {
    const goals = Storage.getGoals();
    const goal  = goals.monthlyGross || 0;
    const el    = document.getElementById('goalProgressBanner');
    if (!el) return;
    if (goal <= 0) { el.innerHTML = ''; return; }
    const pct  = Math.min(100, Math.round((monthGross / goal) * 100));
    const over = monthGross >= goal;
    el.innerHTML = `
      <div class="goal-banner${over ? ' goal-achieved' : ''}">
        <div class="goal-label">
          <span>Monthly Goal</span>
          <span class="goal-pct">${pct}%</span>
        </div>
        <div class="goal-bar">
          <div class="goal-bar-fill" style="width:${pct}%;background:${over ? 'var(--accent-green)' : 'var(--accent-blue)'}"></div>
        </div>
        <div class="goal-detail">
          ${Income.formatCurrency(monthGross)} of ${Income.formatCurrency(goal)}
          ${over ? ' 🎉 Goal reached!' : ' remaining: ' + Income.formatCurrency(goal - monthGross)}
        </div>
      </div>`;
  }

  function _renderRecentShifts(tax) {
    const container = document.getElementById('recentShiftsList');
    if (!container) return;
    const shifts = Storage.getShifts().sort((a,b) => b.date.localeCompare(a.date)).slice(0, 8);
    if (!shifts.length) {
      container.innerHTML = `<div class="empty-mini">No shifts yet — tap <strong>+</strong> or click a calendar day to add one.</div>`;
      return;
    }
    const jobs   = Storage.getJobs();
    const jobMap = new Map(jobs.map(j => [j.id, j]));
    const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    container.innerHTML = shifts.map(shift => {
      const job = jobMap.get(shift.jobId);
      if (!job) return '';
      const d   = Income.calcShiftDetails(shift, job, tax);
      const dt  = new Date(shift.date + 'T12:00:00');
      const ot  = d.overtimeDetails;
      const otBadge = ot?.hasOvertime ? `<span class="ot-badge">OT</span>` : '';
      const lnBadge = ot?.hasLateNight ? `<span class="ln-badge">深夜</span>` : '';
      return `
        <div class="shift-row" role="button" tabindex="0"
             onclick="Modals.openShiftModal(null,'${shift.id}')"
             onkeydown="if(event.key==='Enter')Modals.openShiftModal(null,'${shift.id}')">
          <div class="shift-date-col">
            <span class="shift-day">${DOW[dt.getDay()]}</span>
            <span class="shift-date-num">${dt.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
          </div>
          <div class="shift-job-col">
            <span class="job-color-dot" style="background:${job.color}"></span>
            <span class="shift-job-name">${job.name}</span>
            ${otBadge}${lnBadge}
          </div>
          <div class="shift-time-col">${shift.startTime}–${shift.endTime}</div>
          <div class="shift-hours-col">${Income.formatHours(d.workedHours)}</div>
          <div class="shift-earn-col">${Income.formatCurrency(d.gross)}</div>
        </div>`;
    }).join('');
  }

  /* ════════════════════════════════════════════
     JOBS VIEW
  ════════════════════════════════════════════ */
  function _renderJobs() {
    const jobs   = Storage.getJobs();
    const grid   = document.getElementById('jobsGrid');
    const empty  = document.getElementById('jobsEmpty');
    if (!grid) return;
    if (!jobs.length) {
      grid.style.display = 'none';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    grid.style.display = '';
    const tax       = Storage.getTaxSettings();
    const allShifts = Storage.getShifts();
    grid.innerHTML = jobs.map(job => {
      const agg = Income.calcAggregate(allShifts.filter(s => s.jobId === job.id));
      return `
        <div class="job-card" role="button" tabindex="0" style="border-top:3px solid ${job.color}"
             onclick="Modals.openJobModal('${job.id}')"
             onkeydown="if(event.key==='Enter')Modals.openJobModal('${job.id}')">
          <div class="job-card-header">
            <div class="job-color-swatch" style="background:${job.color}"></div>
            <div>
              <h3 class="job-card-name">${job.name}</h3>
              ${job.company ? `<p class="job-card-company">${job.company}</p>` : ''}
            </div>
          </div>
          <div class="job-card-rates">
            <div class="rate-row"><span class="rate-label">Weekday</span><span class="rate-val">${Income.formatCurrency(job.baseWage)}<small>/hr</small></span></div>
            <div class="rate-row">
              <span class="rate-label">Weekend</span>
              ${job.weekendEnabled !== false
                ? `<span class="rate-val">${Income.formatCurrency(job.baseWage * job.weekendMultiplier)}<small>/hr ×${job.weekendMultiplier}</small></span>`
                : `<span class="rate-val-off">Same as weekday</span>`}
            </div>
            <div class="rate-row">
              <span class="rate-label">Holiday</span>
              ${job.holidayEnabled !== false
                ? `<span class="rate-val">${Income.formatCurrency(job.baseWage * job.holidayMultiplier)}<small>/hr ×${job.holidayMultiplier}</small></span>`
                : `<span class="rate-val-off">Same as weekday</span>`}
            </div>
          </div>
          <div class="job-card-stats">
            <span>${agg.count} shifts</span>
            <span>${Income.formatHours(agg.hours)}</span>
            <span class="accent-gold">${Income.formatCurrency(agg.gross)}</span>
          </div>
        </div>`;
    }).join('');
  }

  /* ════════════════════════════════════════════
     TEMPLATES VIEW
  ════════════════════════════════════════════ */
  function _renderTemplates() {
    const templates = Storage.getTemplates();
    const jobs      = Storage.getJobs();
    const jobMap    = new Map(jobs.map(j => [j.id, j]));
    const list      = document.getElementById('templatesList');
    const empty     = document.getElementById('templatesEmpty');

    if (!list) return;

    if (!templates.length) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    const DOW_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const now = new Date();

    list.innerHTML = `<div class="templates-grid">` + templates.map(tpl => {
      const job      = jobMap.get(tpl.jobId);
      const dayNames = (tpl.daysOfWeek || []).map(d => DOW_NAMES[d]).join(', ') || 'No days set';
      return `
        <div class="tpl-card">
          <div class="tpl-card-header" style="border-left:4px solid ${job?.color || '#3B82F6'}">
            <div>
              <h3 class="tpl-name">${tpl.name}</h3>
              <p class="tpl-job">${job ? job.name : 'Unknown job'}</p>
            </div>
            <button class="btn btn-sm btn-danger tpl-delete-btn" data-id="${tpl.id}">×</button>
          </div>
          <div class="tpl-details">
            <span>${tpl.startTime} – ${tpl.endTime}</span>
            <span>Break ${tpl.breakMinutes}min</span>
            <span>${dayNames}</span>
          </div>
          <div class="tpl-apply-row">
            <select class="sel-sm tpl-month-sel" data-id="${tpl.id}">
              ${Array.from({length:3},(_,i) => {
                const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                const label = d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
                return `<option value="${d.getFullYear()}-${d.getMonth()}">${label}</option>`;
              }).join('')}
            </select>
            <button class="btn btn-sm btn-secondary tpl-apply-btn" data-id="${tpl.id}">Apply to Month</button>
          </div>
        </div>`;
    }).join('') + `</div>`;

    /* Bind delete and apply buttons */
    list.querySelectorAll('.tpl-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.id;
        Modals.showConfirm('Delete Template', 'Remove this template?').then(ok => {
          if (!ok) return;
          Storage.deleteTemplate(id);
          _renderTemplates();
          Modals.showToast('Template deleted.', 'info');
        });
      });
    });

    list.querySelectorAll('.tpl-apply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = btn.dataset.id;
        const sel = list.querySelector(`.tpl-month-sel[data-id="${id}"]`);
        const [yr, mo] = sel.value.split('-').map(Number);
        const count = Storage.applyTemplate(id, yr, mo);
        refresh();
        Modals.showToast(`${count} shift${count !== 1 ? 's' : ''} added to calendar.`, 'success');
      });
    });
  }

  /* ════════════════════════════════════════════
     TAX & FEES VIEW
  ════════════════════════════════════════════ */
  const CATEGORY_LABELS = {
    tax:       { icon: '🧾', label: 'Income Tax'   },
    insurance: { icon: '🏥', label: 'Insurance'    },
    transport: { icon: '🚃', label: 'Transport'    },
    custom:    { icon: '➕', label: 'Custom Fees'  },
  };

  function _renderTax() {
    const tax = Storage.getTaxSettings();

    const master = document.getElementById('taxEnabled');
    if (master) master.checked = tax.enabled;

    const list = document.getElementById('taxItemsList');
    if (!list) return;

    /* Group items by category */
    const grouped = {};
    (tax.items || []).forEach(item => {
      const cat = item.category || 'custom';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    const catOrder = ['tax','insurance','transport','custom'];
    const disabled = !tax.enabled;

    list.innerHTML = catOrder
      .filter(cat => grouped[cat]?.length)
      .map(cat => {
        const catInfo = CATEGORY_LABELS[cat] || { icon:'•', label: cat };
        return `
          <div class="tax-category">
            <div class="tax-cat-header">${catInfo.icon} ${catInfo.label}</div>
            ${grouped[cat].map(item => _renderTaxItem(item, disabled)).join('')}
          </div>`;
      }).join('') + `
      <div class="tax-add-row">
        <button class="btn btn-sm btn-ghost" id="addTaxItemBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Custom Fee
        </button>
      </div>
      <div class="add-tax-form" id="addTaxForm" style="display:none">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name (Japanese)</label>
            <input type="text" id="newTaxLabel" class="form-control" placeholder="e.g. 自転車代">
          </div>
          <div class="form-group">
            <label class="form-label">Name (English)</label>
            <input type="text" id="newTaxLabelEn" class="form-control" placeholder="e.g. Bicycle Fee">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="newTaxCategory" class="form-control">
              <option value="transport">Transport</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Amount (¥)</label>
            <input type="number" id="newTaxAmount" class="form-control" placeholder="0" min="0" step="100">
          </div>
        </div>
        <div style="display:flex;gap:8px;padding:0 20px 16px">
          <button class="btn btn-sm btn-ghost" id="cancelAddTaxBtn">Cancel</button>
          <button class="btn btn-sm btn-primary" id="confirmAddTaxBtn">Add Fee</button>
        </div>
      </div>`;

    _updateTaxPreview(tax);
    _bindTaxItemEvents();
  }

  function _renderTaxItem(item, masterDisabled) {
    const dis = masterDisabled || !item.enabled;
    const displayLabel = item.label + (item.labelEn ? ` <small>(${item.labelEn})</small>` : '');
    return `
      <div class="tax-item${masterDisabled ? ' disabled' : ''}">
        <div class="tax-item-left">
          <label class="toggle">
            <input type="checkbox" class="tax-toggle" data-id="${item.id}"
                   ${item.enabled ? 'checked' : ''} ${masterDisabled ? 'disabled' : ''}>
            <span class="toggle-slider"></span>
          </label>
          <span class="tax-item-label">${displayLabel}</span>
        </div>
        <div class="tax-item-right">
          <span class="input-prefix-yen">¥</span>
          <input type="number" class="form-control tax-amount-input" data-id="${item.id}"
                 value="${item.monthlyAmount || 0}" min="0" step="100"
                 ${dis ? 'disabled' : ''}>
          <span class="rate-pct">/mo</span>
          ${item.removable ? `<button class="tax-remove-btn" data-id="${item.id}" title="Remove">×</button>` : ''}
        </div>
      </div>`;
  }

  function _bindTaxItemEvents() {
    const list = document.getElementById('taxItemsList');
    if (!list) return;

    /* Toggle individual item */
    list.querySelectorAll('.tax-toggle').forEach(cb => {
      cb.addEventListener('change', () => {
        Storage.updateTaxItem(cb.dataset.id, { enabled: cb.checked });
        const amtEl = list.querySelector(`.tax-amount-input[data-id="${cb.dataset.id}"]`);
        if (amtEl) amtEl.disabled = !cb.checked;
        _updateTaxPreview();
      });
    });

    /* Edit amount */
    list.querySelectorAll('.tax-amount-input').forEach(inp => {
      inp.addEventListener('input', () => {
        Storage.updateTaxItem(inp.dataset.id, { monthlyAmount: parseInt(inp.value) || 0 });
        _updateTaxPreview();
      });
    });

    /* Remove item */
    list.querySelectorAll('.tax-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.removeTaxItem(btn.dataset.id);
        _renderTax();
      });
    });

    /* Add custom fee toggle */
    document.getElementById('addTaxItemBtn')?.addEventListener('click', () => {
      const form = document.getElementById('addTaxForm');
      if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
    });
    document.getElementById('cancelAddTaxBtn')?.addEventListener('click', () => {
      document.getElementById('addTaxForm').style.display = 'none';
    });
    document.getElementById('confirmAddTaxBtn')?.addEventListener('click', () => {
      const label   = document.getElementById('newTaxLabel')?.value.trim();
      const labelEn = document.getElementById('newTaxLabelEn')?.value.trim();
      const cat     = document.getElementById('newTaxCategory')?.value || 'custom';
      const amount  = parseInt(document.getElementById('newTaxAmount')?.value) || 0;
      if (!label) { Modals.showToast('Please enter a name.', 'error'); return; }
      Storage.addTaxItem({ label, labelEn, category: cat, monthlyAmount: amount });
      _renderTax();
      Modals.showToast('Fee added!', 'success');
    });
  }

  function _updateTaxPreview(tax) {
    tax = tax || Storage.getTaxSettings();
    const now   = new Date();
    const month = Income.getMonth(now.getFullYear(), now.getMonth(), tax);
    const bd    = Income.calcTaxBreakdown(tax);

    const previewEl = document.getElementById('taxPreview');
    if (!previewEl) return;

    const catIcons = { tax:'🧾', insurance:'🏥', transport:'🚃', custom:'➕' };

    previewEl.innerHTML = `
      <div class="tax-preview-rows">
        <div class="tax-preview-row">
          <span>Gross (this month)</span>
          <strong>${Income.formatCurrency(month.gross)}</strong>
        </div>
        ${bd.lines.map(l => `
          <div class="tax-preview-row deduction">
            <span>${catIcons[l.category] || '•'} ${l.label}</span>
            <strong>−${Income.formatCurrency(l.amount)}</strong>
          </div>`).join('')}
        ${bd.lines.length === 0 && tax.enabled ? `
          <div class="tax-preview-hint">Enable items above and enter monthly amounts</div>` : ''}
        <div class="tax-preview-divider"></div>
        <div class="tax-preview-row total">
          <span>Net Income</span>
          <strong class="accent-green">${Income.formatCurrency(month.net)}</strong>
        </div>
      </div>`;

    if (bd.lines.length) ChartsView.renderTaxDonut('taxDonut', bd);
  }

  /* ════════════════════════════════════════════
     PROFILE VIEW
  ════════════════════════════════════════════ */
  function _renderProfile() {
    const p     = Storage.getProfile();
    const goals = Storage.getGoals();

    const nameEl     = document.getElementById('profileName');
    const colorEl    = document.getElementById('profileAvatarColor');
    const goalEl     = document.getElementById('monthlyGoalInput');
    const avatarEl   = document.getElementById('profileAvatarLarge');
    const dispNameEl = document.getElementById('profileDisplayName');
    const dispAppEl  = document.getElementById('profileAppNameDisplay');

    if (nameEl)     nameEl.value       = p.name || '';
    if (colorEl)    colorEl.value      = p.avatarColor || '#3B82F6';
    if (goalEl)     goalEl.value       = goals.monthlyGross || '';
    if (avatarEl)   {
      avatarEl.textContent  = p.name ? p.name[0].toUpperCase() : '?';
      avatarEl.style.background = p.name
        ? `linear-gradient(135deg, ${p.avatarColor || '#3B82F6'}, #6366f1)`
        : 'linear-gradient(135deg, #3B82F6, #6366f1)';
    }
    if (dispNameEl) dispNameEl.textContent = p.name || 'Your Profile';
    if (dispAppEl)  dispAppEl.textContent  = 'ShiftPay — Income Tracker';

    const now     = new Date();
    const month   = Income.getMonth(now.getFullYear(), now.getMonth(), Storage.getTaxSettings());
    const goalAmt = goals.monthlyGross || 0;
    const prevEl  = document.getElementById('goalPreview');
    if (prevEl && goalAmt > 0) {
      const pct = Math.min(100, Math.round((month.gross / goalAmt) * 100));
      prevEl.innerHTML = `
        <div class="goal-mini-preview">
          <div class="goal-mini-bar"><div style="width:${pct}%;background:var(--accent-blue);height:100%;border-radius:3px;transition:width .6s ease"></div></div>
          <p style="font-size:12px;color:var(--text-muted);margin-top:6px">${Income.formatCurrency(month.gross)} of ${Income.formatCurrency(goalAmt)} this month (${pct}%)</p>
        </div>`;
    } else if (prevEl) {
      prevEl.innerHTML = '';
    }
  }

  function _bindProfileEvents() {
    document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
      const p = {
        name:        document.getElementById('profileName')?.value.trim() || '',
        avatarColor: document.getElementById('profileAvatarColor')?.value || '#3B82F6',
      };
      Storage.saveProfile(p);
      _updateAppBranding();
      _renderProfile();
      Modals.showToast('Profile saved!', 'success');
    });

    document.getElementById('saveGoalBtn')?.addEventListener('click', () => {
      const goal = parseInt(document.getElementById('monthlyGoalInput')?.value) || 0;
      Storage.saveGoals({ monthlyGross: goal });
      _renderProfile();
      Modals.showToast('Goal saved!', 'success');
    });

    /* Live avatar preview */
    document.getElementById('profileAvatarColor')?.addEventListener('input', e => {
      const av = document.getElementById('profileAvatarLarge');
      if (av) av.style.background = e.target.value;
    });
    document.getElementById('profileName')?.addEventListener('input', e => {
      const av = document.getElementById('profileAvatarLarge');
      if (av) av.textContent = e.target.value ? e.target.value[0].toUpperCase() : '?';
    });
  }

  /* ════════════════════════════════════════════
     APP BRANDING (sidebar)
  ════════════════════════════════════════════ */
  function _updateAppBranding() {
    const p = Storage.getProfile();
    const avatarEl = document.getElementById('sidebarAvatar');
    const spNameEl = document.getElementById('sidebarProfileName');

    if (avatarEl) {
      if (p.name) {
        avatarEl.textContent   = p.name[0].toUpperCase();
        avatarEl.style.background = `linear-gradient(135deg, ${p.avatarColor || '#3B82F6'}, #6366f1)`;
      } else {
        avatarEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        avatarEl.style.background = 'linear-gradient(135deg, #3B82F6, #6366f1)';
      }
    }
    if (spNameEl) spNameEl.textContent = p.name || 'My Profile';
  }

  /* ════════════════════════════════════════════
     SETTINGS VIEW
  ════════════════════════════════════════════ */
  function _renderSettings() {
    const jobs   = Storage.getJobs();
    const shifts = Storage.getShifts();
    const el     = document.getElementById('dataStats');
    if (el) el.textContent = `${jobs.length} job${jobs.length !== 1 ? 's' : ''} · ${shifts.length} shift${shifts.length !== 1 ? 's' : ''}`;
  }

  function _bindSettings() {
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(Storage.exportAll(), null, 2)], { type:'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href:url, download:`shiftpay-backup-${new Date().toISOString().slice(0,10)}.json` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Modals.showToast('Backup exported!', 'success');
    });

    document.getElementById('importFile')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try { Storage.importAll(JSON.parse(ev.target.result)); refresh(); Modals.showToast('Data imported!', 'success'); }
        catch { Modals.showToast('Import failed — invalid file.', 'error'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    document.getElementById('loadSampleBtn')?.addEventListener('click', () => {
      Modals.showConfirm('Load Sample Data', 'This will overwrite your current data. Continue?').then(ok => {
        if (!ok) return;
        Storage.loadSampleData();
        refresh();
        Modals.showToast('Sample data loaded!', 'success');
      });
    });

    document.getElementById('clearDataBtn')?.addEventListener('click', () => {
      Modals.showConfirm('Clear All Data', 'Permanently delete all shifts, jobs, and settings?').then(ok => {
        if (!ok) return;
        Storage.clearAll();
        refresh();
        Modals.showToast('All data cleared.', 'info');
      });
    });
  }

  /* ════════════════════════════════════════════
     THEME
  ════════════════════════════════════════════ */
  function _initTheme() {
    _applyTheme(Storage.getSettings().theme || 'dark');
  }

  function _applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const sun  = document.getElementById('iconSun');
    const moon = document.getElementById('iconMoon');
    const lbl  = document.getElementById('themeLabel');
    if (theme === 'dark') {
      if (sun)  sun.style.display  = '';
      if (moon) moon.style.display = 'none';
      if (lbl)  lbl.textContent    = 'Light Mode';
    } else {
      if (sun)  sun.style.display  = 'none';
      if (moon) moon.style.display = '';
      if (lbl)  lbl.textContent    = 'Dark Mode';
    }
  }

  function _toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    _applyTheme(next);
    Storage.saveSettings({ theme: next });
    ChartsView.destroyAll();
    setTimeout(() => {
      if (_view === 'dashboard') _renderDashboard();
      if (_view === 'reports')   Reports.render();
      if (_view === 'tax')       _renderTax();
    }, 30);
  }

  /* ════════════════════════════════════════════
     YEAR SELECTORS
  ════════════════════════════════════════════ */
  function _initYearSelectors() {
    // Charts removed — nothing to initialise
  }

  /* ════════════════════════════════════════════
     NAV + GLOBAL BINDINGS
  ════════════════════════════════════════════ */
  function _bindNav() {
    /* Sidebar links */
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.dataset.view); });
    });

    /* Mobile bottom nav */
    document.querySelectorAll('.mbn-item[data-view]').forEach(link => {
      link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.dataset.view); });
    });
    document.querySelector('.mbn-item[data-action="addShift"]')?.addEventListener('click', e => {
      e.preventDefault(); Modals.openShiftModal(null);
    });

    /* Profile chip in sidebar */
    document.getElementById('sidebarProfileChip')?.addEventListener('click', e => {
      e.preventDefault(); navigateTo('profile');
    });

    /* Card quick-nav links */
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => navigateTo(el.dataset.nav));
    });

    /* Hamburger */
    document.getElementById('hamburger')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    /* Add Shift button */
    document.getElementById('addShiftBtn')?.addEventListener('click', () => Modals.openShiftModal(null));

    /* Add Job buttons */
    document.getElementById('addJobBtn')?.addEventListener('click',  () => Modals.openJobModal(null));
    document.getElementById('addJobBtn2')?.addEventListener('click', () => Modals.openJobModal(null));

    /* Template buttons */
    document.getElementById('addTemplateBtn')?.addEventListener('click',  () => Modals.openTemplateModal());
    document.getElementById('addTemplateBtn2')?.addEventListener('click', () => Modals.openTemplateModal());

    /* Theme toggles */
    document.getElementById('themeToggle')?.addEventListener('click',      _toggleTheme);
    document.getElementById('settingsThemeBtn')?.addEventListener('click', _toggleTheme);

    /* Tax master enable */
    document.getElementById('taxEnabled')?.addEventListener('change', e => {
      const tax   = Storage.getTaxSettings();
      tax.enabled = e.target.checked;
      Storage.saveTaxSettings(tax);
      _renderTax();
    });

    /* Topbar date */
    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  }

  /* ════════════════════════════════════════════
     GLOBAL REFRESH
  ════════════════════════════════════════════ */
  function refresh() {
    _updateAppBranding();
    _initYearSelectors();
    if (_calendarReady) CalendarView.refresh();
    if (_view === 'dashboard') _renderDashboard();
    if (_view === 'jobs')      _renderJobs();
    if (_view === 'templates') _renderTemplates();
    if (_view === 'reports')   { Reports.refreshSelectors(); Reports.render(); }
    if (_view === 'tax')       _renderTax();
    if (_view === 'settings')  _renderSettings();
    if (_view === 'profile')   _renderProfile();
  }

  /* ════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════ */
  function init() {
    _initTheme();
    _updateAppBranding();
    _bindNav();
    _bindProfileEvents();
    _bindSettings();
    _initYearSelectors();
    Modals.init();
    Reports.init();
    _renderDashboard();
  }

  return { init, refresh, navigateTo };

})();

document.addEventListener('DOMContentLoaded', () => App.init());
