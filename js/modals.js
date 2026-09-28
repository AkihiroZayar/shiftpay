/**
 * modals.js — Modal & Toast UI layer
 * Manages: Shift modal (add/edit/delete), Job modal (add/edit/delete),
 * Confirm dialog, Toast notifications, and overlay/ESC close behaviour.
 */

const Modals = (() => {

  let _editingShiftId = null;
  let _editingJobId   = null;
  let _confirmResolve = null;

  /* ════════════════════════════════════════════
     TOAST
  ════════════════════════════════════════════ */
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
      error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };

    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    // Animate out and remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  /* ════════════════════════════════════════════
     OVERLAY
  ════════════════════════════════════════════ */
  function _openOverlay() {
    document.getElementById('overlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function _closeOverlay() {
    document.getElementById('overlay')?.classList.remove('active');
    document.body.style.overflow = '';
  }

  function _closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    _closeOverlay();
    _editingShiftId = null;
    _editingJobId   = null;
    if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
  }

  /* ════════════════════════════════════════════
     CONFIRM DIALOG
  ════════════════════════════════════════════ */
  function showConfirm(title, message) {
    return new Promise(resolve => {
      _confirmResolve = resolve;
      const modal = document.getElementById('confirmModal');
      document.getElementById('confirmTitle').textContent   = title;
      document.getElementById('confirmMessage').textContent = message;
      modal.classList.add('active');
      _openOverlay();
    });
  }

  function _bindConfirmModal() {
    document.getElementById('confirmCancel')?.addEventListener('click', () => {
      document.getElementById('confirmModal').classList.remove('active');
      _closeOverlay();
      if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
    });

    document.getElementById('confirmOk')?.addEventListener('click', () => {
      document.getElementById('confirmModal').classList.remove('active');
      _closeOverlay();
      if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
    });
  }

  /* ════════════════════════════════════════════
     SHIFT MODAL
  ════════════════════════════════════════════ */
  function openShiftModal(dateStr, shiftId) {
    _editingShiftId = shiftId || null;

    const modal = document.getElementById('shiftModal');
    if (!modal) return;

    /* Populate job dropdown */
    const jobs = Storage.getJobs();
    const sel  = document.getElementById('shiftJobId');
    sel.innerHTML = '<option value="">Select job…</option>';
    jobs.forEach(j => {
      const opt       = document.createElement('option');
      opt.value       = j.id;
      opt.textContent = j.name + (j.company ? ` — ${j.company}` : '');
      sel.appendChild(opt);
    });

    if (shiftId) {
      /* ─ Edit mode ─ */
      const shift = Storage.getShiftById(shiftId);
      if (!shift) return;

      document.getElementById('shiftModalTitle').textContent = 'Edit Shift';
      document.getElementById('shiftDate').value          = shift.date;
      document.getElementById('shiftJobId').value         = shift.jobId;
      document.getElementById('shiftStart').value         = shift.startTime;
      document.getElementById('shiftEnd').value           = shift.endTime;
      document.getElementById('shiftBreak').value         = shift.breakMinutes;
      document.getElementById('shiftOverrideRate').value  = shift.overrideRate || '';
      document.getElementById('shiftNotes').value         = shift.notes || '';
      const ot = shift.overtimeType || '';
      document.getElementById('shiftIsOvertime').checked  = ot === 'overtime' || ot === 'overtime+latenight';
      document.getElementById('shiftIsLateNight').checked = ot === 'latenight' || ot === 'overtime+latenight';
      document.getElementById('deleteShiftBtn').style.display = '';
    } else {
      /* ─ Add mode ─ */
      document.getElementById('shiftModalTitle').textContent = 'Add Shift';
      document.getElementById('shiftDate').value          = dateStr || Income.todayKey();
      document.getElementById('shiftJobId').value         = jobs.length ? jobs[0].id : '';
      document.getElementById('shiftStart').value         = '09:00';
      document.getElementById('shiftEnd').value           = '17:00';
      document.getElementById('shiftBreak').value         = '60';
      document.getElementById('shiftOverrideRate').value  = '';
      document.getElementById('shiftNotes').value         = '';
      document.getElementById('shiftIsOvertime').checked  = false;
      document.getElementById('shiftIsLateNight').checked = false;
      document.getElementById('deleteShiftBtn').style.display = 'none';
    }

    _updateShiftPreview();
    modal.classList.add('active');
    _openOverlay();

    // Focus first field
    setTimeout(() => document.getElementById('shiftDate')?.focus(), 80);
  }

  function _closeShiftModal() {
    document.getElementById('shiftModal')?.classList.remove('active');
    _closeOverlay();
    _editingShiftId = null;
  }

  function _updateShiftPreview() {
    const dateStr   = document.getElementById('shiftDate')?.value;
    const jobId     = document.getElementById('shiftJobId')?.value;
    const start     = document.getElementById('shiftStart')?.value;
    const end       = document.getElementById('shiftEnd')?.value;
    const breakMin  = parseInt(document.getElementById('shiftBreak')?.value) || 0;
    const override  = document.getElementById('shiftOverrideRate')?.value;
    const previewEl = document.getElementById('shiftPreview');

    if (!previewEl) return;

    if (!dateStr || !jobId || !start || !end) {
      previewEl.style.display = 'none';
      return;
    }

    const job = Storage.getJobById(jobId);
    if (!job) { previewEl.style.display = 'none'; return; }

    const isOT = document.getElementById('shiftIsOvertime')?.checked;
    const isLN = document.getElementById('shiftIsLateNight')?.checked;
    const pseudoShift = {
      date: dateStr,
      jobId,
      startTime:    start,
      endTime:      end,
      breakMinutes: breakMin,
      overrideRate: override ? Number(override) : null,
      overtimeType: isOT && isLN ? 'overtime+latenight' : isOT ? 'overtime' : isLN ? 'latenight' : null,
    };

    const tax     = Storage.getTaxSettings();
    const details = Income.calcShiftDetails(pseudoShift, job, tax);

    const dayLabels = {
      weekday: '平日 Weekday',
      weekend: '週末 Weekend',
      holiday: '祝日 National Holiday',
      custom:  'Custom Rate',
    };

    const multStr = details.multiplier && details.multiplier !== 1
      ? ` (×${details.multiplier})`
      : '';

    document.getElementById('previewDayType').textContent = dayLabels[details.dayType] || '';
    document.getElementById('prevHours').textContent      = Income.formatHours(details.workedHours);
    document.getElementById('prevRate').textContent       = Income.formatCurrency(details.rate) + '/hr' + multStr;
    document.getElementById('prevGross').textContent      = Income.formatCurrency(details.gross);

    const taxRow = document.getElementById('prevTaxRow');
    const netRow = document.getElementById('prevNetRow');

    const monthlyDed = Income.calcMonthlyDeductions(tax);
    if (tax.enabled && monthlyDed > 0) {
      document.getElementById('prevTax').textContent = Income.formatCurrency(monthlyDed) + '/month';
      const taxLabelEl = taxRow?.querySelector('span');
      if (taxLabelEl) taxLabelEl.textContent = 'Monthly deductions';
      if (taxRow) taxRow.style.display = '';
      if (netRow) netRow.style.display = 'none'; // net depends on month total, not per shift
    } else {
      if (taxRow) taxRow.style.display = 'none';
      if (netRow) netRow.style.display = 'none';
    }

    previewEl.style.display = '';
  }

  function _saveShift() {
    const data = {
      date:         document.getElementById('shiftDate')?.value,
      jobId:        document.getElementById('shiftJobId')?.value,
      startTime:    document.getElementById('shiftStart')?.value,
      endTime:      document.getElementById('shiftEnd')?.value,
      breakMinutes: parseInt(document.getElementById('shiftBreak')?.value) || 0,
      overrideRate: document.getElementById('shiftOverrideRate')?.value || null,
      overtimeType: document.getElementById('shiftIsOvertime')?.checked  &&
                    document.getElementById('shiftIsLateNight')?.checked  ? 'overtime+latenight' :
                    document.getElementById('shiftIsOvertime')?.checked   ? 'overtime' :
                    document.getElementById('shiftIsLateNight')?.checked  ? 'latenight' : null,
      notes:        document.getElementById('shiftNotes')?.value || '',
    };

    if (!data.date || !data.jobId || !data.startTime || !data.endTime) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (_editingShiftId) {
      Storage.updateShift(_editingShiftId, data);
      showToast('Shift updated.', 'success');
    } else {
      Storage.addShift(data);
      showToast('Shift saved.', 'success');
    }

    _closeShiftModal();
    App.refresh();
  }

  function _deleteShift() {
    if (!_editingShiftId) return;
    showConfirm('Delete Shift', 'Remove this shift? This cannot be undone.').then(ok => {
      if (!ok) return;
      Storage.deleteShift(_editingShiftId);
      showToast('Shift deleted.', 'info');
      _closeShiftModal();
      App.refresh();
    });
  }

  function _bindShiftModal() {
    document.getElementById('shiftModalClose')?.addEventListener('click', _closeShiftModal);
    document.getElementById('shiftCancelBtn')?.addEventListener('click', _closeShiftModal);
    document.getElementById('saveShiftBtn')?.addEventListener('click', _saveShift);
    document.getElementById('deleteShiftBtn')?.addEventListener('click', _deleteShift);

    /* Live preview on any field change */
    const previewFields = ['shiftDate','shiftJobId','shiftStart','shiftEnd','shiftBreak','shiftOverrideRate','shiftIsOvertime','shiftIsLateNight'];
    previewFields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', _updateShiftPreview);
      el.addEventListener('input',  _updateShiftPreview);
    });
  }

  /* ════════════════════════════════════════════
     JOB MODAL
  ════════════════════════════════════════════ */
  function openJobModal(jobId) {
    _editingJobId = jobId || null;

    const modal = document.getElementById('jobModal');
    if (!modal) return;

    if (jobId) {
      const job = Storage.getJobById(jobId);
      if (!job) return;
      document.getElementById('jobModalTitle').textContent  = 'Edit Job';
      document.getElementById('jobName').value              = job.name;
      document.getElementById('jobCompany').value           = job.company || '';
      document.getElementById('jobWage').value              = job.baseWage;
      document.getElementById('jobColor').value             = job.color;
      document.getElementById('jobWeekendEnabled').checked  = job.weekendEnabled !== false;
      document.getElementById('jobWeekendMult').value       = job.weekendMultiplier || 1.25;
      document.getElementById('jobWeekendFixed').value      = job.weekendFixedRate  || '';
      document.getElementById('jobHolidayEnabled').checked  = job.holidayEnabled !== false;
      document.getElementById('jobHolidayMult').value       = job.holidayMultiplier || 1.5;
      document.getElementById('jobHolidayFixed').value      = job.holidayFixedRate  || '';
      _setRateMode('weekend', job.weekendMode || 'multiplier');
      _setRateMode('holiday', job.holidayMode || 'multiplier');
      document.getElementById('deleteJobBtn').style.display = '';
    } else {
      document.getElementById('jobModalTitle').textContent  = 'Add Job';
      document.getElementById('jobName').value              = '';
      document.getElementById('jobCompany').value           = '';
      document.getElementById('jobWage').value              = '';
      document.getElementById('jobColor').value             = '#3B82F6';
      document.getElementById('jobWeekendEnabled').checked  = true;
      document.getElementById('jobWeekendMult').value       = '1.25';
      document.getElementById('jobWeekendFixed').value      = '';
      document.getElementById('jobHolidayEnabled').checked  = true;
      document.getElementById('jobHolidayMult').value       = '1.5';
      document.getElementById('jobHolidayFixed').value      = '';
      _setRateMode('weekend', 'multiplier');
      _setRateMode('holiday', 'multiplier');
      document.getElementById('deleteJobBtn').style.display = 'none';
    }

    _updateJobPreview();
    modal.classList.add('active');
    _openOverlay();

    setTimeout(() => document.getElementById('jobName')?.focus(), 80);
  }

  function _closeJobModal() {
    document.getElementById('jobModal')?.classList.remove('active');
    _closeOverlay();
    _editingJobId = null;
  }

  /* ── Rate mode switcher helper ── */
  function _setRateMode(target, mode) {
    const multWrap  = document.getElementById(target + 'MultiplierInput');
    const fixedWrap = document.getElementById(target + 'FixedInput');
    const tabs      = document.querySelectorAll(`.rate-mode-tab[data-target="${target}"]`);

    tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    if (multWrap)  multWrap.style.display  = mode === 'multiplier' ? 'flex' : 'none';
    if (fixedWrap) fixedWrap.style.display = mode === 'fixed'      ? 'flex' : 'none';
  }

  function _getRateMode(target) {
    const activeTab = document.querySelector(`.rate-mode-tab.active[data-target="${target}"]`);
    return activeTab?.dataset.mode || 'multiplier';
  }

  function _updateJobPreview() {
    const name           = document.getElementById('jobName')?.value.trim() || 'Job Preview';
    const wage           = parseFloat(document.getElementById('jobWage')?.value) || 0;
    const color          = document.getElementById('jobColor')?.value || '#3B82F6';
    const weekendEnabled = document.getElementById('jobWeekendEnabled')?.checked !== false;
    const holidayEnabled = document.getElementById('jobHolidayEnabled')?.checked !== false;
    const weekendMode    = _getRateMode('weekend');
    const holidayMode    = _getRateMode('holiday');
    const weekendMult    = parseFloat(document.getElementById('jobWeekendMult')?.value) || 1.25;
    const weekendFixed   = parseFloat(document.getElementById('jobWeekendFixed')?.value) || 0;
    const holidayMult    = parseFloat(document.getElementById('jobHolidayMult')?.value) || 1.5;
    const holidayFixed   = parseFloat(document.getElementById('jobHolidayFixed')?.value) || 0;

    /* Effective rates */
    const weekendRate = weekendEnabled
      ? (weekendMode === 'fixed' ? weekendFixed : wage * weekendMult)
      : wage;
    const holidayRate = holidayEnabled
      ? (holidayMode === 'fixed' ? holidayFixed : wage * holidayMult)
      : wage;

    /* Preview card */
    const ph = document.getElementById('jobPreviewColor');
    if (ph) { ph.style.borderLeftColor = color; ph.style.background = color + '18'; }
    const nameEl = document.getElementById('jobPreviewName');
    if (nameEl) nameEl.textContent = name;

    const weekday    = document.getElementById('jpWeekday');
    const weekend    = document.getElementById('jpWeekend');
    const holiday    = document.getElementById('jpHoliday');
    const weekendTag = document.getElementById('jpWeekendTag');
    const holidayTag = document.getElementById('jpHolidayTag');

    if (weekday) weekday.textContent = Income.formatCurrency(wage) + '/hr';

    /* Weekend */
    if (weekendEnabled) {
      const label = weekendMode === 'fixed'
        ? `¥ fixed rate`
        : `×${weekendMult} multiplier`;
      if (weekend)    { weekend.textContent = Income.formatCurrency(weekendRate) + '/hr'; weekend.style.opacity = '1'; }
      if (weekendTag)   weekendTag.style.display = 'none';
      const wHint = document.getElementById('jobWeekendHint');
      if (wHint) wHint.textContent = `Weekend: ${Income.formatCurrency(weekendRate)}/hr (${label})`;
    } else {
      if (weekend)    { weekend.textContent = Income.formatCurrency(wage) + '/hr'; weekend.style.opacity = '0.4'; }
      if (weekendTag)   weekendTag.style.display = '';
      const wHint = document.getElementById('jobWeekendHint');
      if (wHint) wHint.textContent = 'Weekend shifts use the same base rate';
    }

    /* Holiday */
    if (holidayEnabled) {
      const label = holidayMode === 'fixed'
        ? `¥ fixed rate`
        : `×${holidayMult} multiplier`;
      if (holiday)    { holiday.textContent = Income.formatCurrency(holidayRate) + '/hr'; holiday.style.opacity = '1'; }
      if (holidayTag)   holidayTag.style.display = 'none';
      const hHint = document.getElementById('jobHolidayHint');
      if (hHint) hHint.textContent = `Holiday: ${Income.formatCurrency(holidayRate)}/hr (${label})`;
    } else {
      if (holiday)    { holiday.textContent = Income.formatCurrency(wage) + '/hr'; holiday.style.opacity = '0.4'; }
      if (holidayTag)   holidayTag.style.display = '';
      const hHint = document.getElementById('jobHolidayHint');
      if (hHint) hHint.textContent = 'Holiday shifts use the same base rate';
    }

    /* Badges */
    const wBadge = document.getElementById('weekendRatePreview');
    const hBadge = document.getElementById('holidayRatePreview');
    if (wBadge) { wBadge.textContent = weekendEnabled ? Income.formatCurrency(weekendRate) + '/hr' : 'OFF'; wBadge.className = 'rate-preview-badge' + (weekendEnabled ? ' badge-active' : ' badge-off'); }
    if (hBadge) { hBadge.textContent = holidayEnabled ? Income.formatCurrency(holidayRate) + '/hr' : 'OFF'; hBadge.className = 'rate-preview-badge' + (holidayEnabled ? ' badge-active' : ' badge-off'); }
  }

  function _saveJob() {
    const weekendMode  = _getRateMode('weekend');
    const holidayMode  = _getRateMode('holiday');
    const data = {
      name:              document.getElementById('jobName')?.value.trim(),
      company:           document.getElementById('jobCompany')?.value.trim(),
      baseWage:          parseFloat(document.getElementById('jobWage')?.value),
      color:             document.getElementById('jobColor')?.value,
      weekendEnabled:    document.getElementById('jobWeekendEnabled')?.checked !== false,
      weekendMode,
      weekendMultiplier: parseFloat(document.getElementById('jobWeekendMult')?.value) || 1.25,
      weekendFixedRate:  parseFloat(document.getElementById('jobWeekendFixed')?.value) || 0,
      holidayEnabled:    document.getElementById('jobHolidayEnabled')?.checked !== false,
      holidayMode,
      holidayMultiplier: parseFloat(document.getElementById('jobHolidayMult')?.value) || 1.5,
      holidayFixedRate:  parseFloat(document.getElementById('jobHolidayFixed')?.value) || 0,
    };

    if (!data.name) { showToast('Job name is required.', 'error'); document.getElementById('jobName')?.focus(); return; }
    if (!data.baseWage || data.baseWage <= 0) { showToast('Please enter a valid hourly wage.', 'error'); document.getElementById('jobWage')?.focus(); return; }

    if (_editingJobId) {
      Storage.updateJob(_editingJobId, data);
      showToast('Job updated.', 'success');
    } else {
      Storage.addJob(data);
      showToast('Job added.', 'success');
    }

    _closeJobModal();
    App.refresh();
  }

  function _deleteJob() {
    if (!_editingJobId) return;
    const job = Storage.getJobById(_editingJobId);
    const shifts = Storage.getShiftsForJob(_editingJobId);
    const msg = shifts.length
      ? `Delete "${job?.name}"? This will also remove ${shifts.length} associated shift${shifts.length !== 1 ? 's' : ''}. This cannot be undone.`
      : `Delete "${job?.name}"? This cannot be undone.`;

    showConfirm('Delete Job', msg).then(ok => {
      if (!ok) return;
      Storage.deleteJob(_editingJobId);
      showToast('Job deleted.', 'info');
      _closeJobModal();
      App.refresh();
    });
  }

  function _bindJobModal() {
    document.getElementById('jobModalClose')?.addEventListener('click', _closeJobModal);
    document.getElementById('jobCancelBtn')?.addEventListener('click', _closeJobModal);
    document.getElementById('saveJobBtn')?.addEventListener('click', _saveJob);
    document.getElementById('deleteJobBtn')?.addEventListener('click', _deleteJob);

    /* Rate mode tab clicks */
    document.querySelectorAll('.rate-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        _setRateMode(tab.dataset.target, tab.dataset.mode);
        _updateJobPreview();
      });
    });

    /* Live preview */
    ['jobName','jobWage','jobColor','jobWeekendMult','jobWeekendFixed',
     'jobHolidayMult','jobHolidayFixed','jobWeekendEnabled','jobHolidayEnabled'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input',  _updateJobPreview);
      el.addEventListener('change', _updateJobPreview);
    });
  }

  /* ════════════════════════════════════════════
     OVERLAY + ESC CLOSE
  ════════════════════════════════════════════ */
  function _bindGlobalClose() {
    document.getElementById('overlay')?.addEventListener('click', _closeAllModals);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') _closeAllModals();
    });
  }

  /* ════════════════════════════════════════════
     TEMPLATE MODAL
  ════════════════════════════════════════════ */
  function openTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (!modal) return;

    /* Populate job dropdown */
    const jobs = Storage.getJobs();
    const sel  = document.getElementById('tplJobId');
    if (sel) {
      sel.innerHTML = '<option value="">Select job…</option>';
      jobs.forEach(j => {
        const opt = document.createElement('option');
        opt.value = j.id;
        opt.textContent = j.name + (j.company ? ` — ${j.company}` : '');
        sel.appendChild(opt);
      });
    }

    /* Reset form */
    const fields = ['tplName','tplStart','tplEnd','tplBreak'];
    document.getElementById('tplName').value  = '';
    document.getElementById('tplStart').value = '09:00';
    document.getElementById('tplEnd').value   = '17:00';
    document.getElementById('tplBreak').value = '60';
    document.querySelectorAll('#tplDays input[type=checkbox]').forEach(cb => cb.checked = false);

    modal.classList.add('active');
    _openOverlay();
  }

  function _closeTemplateModal() {
    document.getElementById('templateModal')?.classList.remove('active');
    _closeOverlay();
  }

  function _saveTemplate() {
    const name  = document.getElementById('tplName')?.value.trim();
    const jobId = document.getElementById('tplJobId')?.value;
    if (!name || !jobId) { showToast('Template name and job are required.', 'error'); return; }

    const daysOfWeek = [...document.querySelectorAll('#tplDays input:checked')].map(cb => parseInt(cb.value));

    Storage.addTemplate({
      name,
      jobId,
      startTime:    document.getElementById('tplStart')?.value,
      endTime:      document.getElementById('tplEnd')?.value,
      breakMinutes: parseInt(document.getElementById('tplBreak')?.value) || 0,
      daysOfWeek,
    });

    _closeTemplateModal();
    App.refresh();
    showToast('Template saved!', 'success');
  }

  function _bindTemplateModal() {
    document.getElementById('templateModalClose')?.addEventListener('click', _closeTemplateModal);
    document.getElementById('templateCancelBtn')?.addEventListener('click', _closeTemplateModal);
    document.getElementById('saveTemplateBtn')?.addEventListener('click', _saveTemplate);
  }

  /* ════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════ */
  function init() {
    _bindShiftModal();
    _bindJobModal();
    _bindConfirmModal();
    _bindTemplateModal();
    _bindGlobalClose();
  }

  return {
    init,
    openShiftModal,
    openJobModal,
    openTemplateModal,
    showToast,
    showConfirm,
  };

})();
