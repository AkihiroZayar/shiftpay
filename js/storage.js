/**
 * storage.js — LocalStorage data layer
 * Manages Jobs, Shifts, Tax Settings, and App Settings
 */

const Storage = (() => {

  const K = {
    JOBS:      'sp_jobs',
    SHIFTS:    'sp_shifts',
    TAX:       'sp_tax',
    SETTINGS:  'sp_settings',
    PROFILE:   'sp_profile',
    GOALS:     'sp_goals',
    TEMPLATES: 'sp_templates',
  };

  /* ── Helpers ── */
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ══════════════════════════════════════════
     JOBS
  ══════════════════════════════════════════ */
  function getJobs()       { return read(K.JOBS, []); }
  function saveJobs(jobs)  { write(K.JOBS, jobs); }
  function getJobById(id)  { return getJobs().find(j => j.id === id) || null; }

  function addJob(data) {
    const job = {
      id: uid(),
      createdAt: new Date().toISOString(),
      name:    data.name,
      company: data.company || '',
      baseWage: Number(data.baseWage),

      weekendEnabled:    data.weekendEnabled  !== false,
      weekendMode:       data.weekendMode       || 'multiplier',   // 'multiplier' | 'fixed'
      weekendMultiplier: Number(data.weekendMultiplier) || 1.25,
      weekendFixedRate:  Number(data.weekendFixedRate)  || 0,

      holidayEnabled:    data.holidayEnabled  !== false,
      holidayMode:       data.holidayMode       || 'multiplier',
      holidayMultiplier: Number(data.holidayMultiplier) || 1.5,
      holidayFixedRate:  Number(data.holidayFixedRate)  || 0,

      color: data.color || '#3B82F6',
    };
    const jobs = getJobs();
    jobs.push(job);
    saveJobs(jobs);
    return job;
  }

  function updateJob(id, data) {
    const jobs = getJobs();
    const idx  = jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    jobs[idx] = { ...jobs[idx], ...data, id, updatedAt: new Date().toISOString() };
    saveJobs(jobs);
    return jobs[idx];
  }

  function deleteJob(id) {
    saveJobs(getJobs().filter(j => j.id !== id));
    /* Cascade: remove shifts that reference this job */
    saveShifts(getShifts().filter(s => s.jobId !== id));
  }

  /* ══════════════════════════════════════════
     SHIFTS
  ══════════════════════════════════════════ */
  function getShifts()        { return read(K.SHIFTS, []); }
  function saveShifts(shifts) { write(K.SHIFTS, shifts); }
  function getShiftById(id)   { return getShifts().find(s => s.id === id) || null; }

  function addShift(data) {
    const shift = {
      id: uid(),
      createdAt: new Date().toISOString(),
      date: data.date,              // 'YYYY-MM-DD'
      jobId: data.jobId,
      startTime: data.startTime,    // 'HH:MM'
      endTime: data.endTime,        // 'HH:MM'
      breakMinutes: Number(data.breakMinutes) || 0,
      overrideRate: data.overrideRate ? Number(data.overrideRate) : null,
      notes: data.notes || '',
    };
    const shifts = getShifts();
    shifts.push(shift);
    saveShifts(shifts);
    return shift;
  }

  function updateShift(id, data) {
    const shifts = getShifts();
    const idx    = shifts.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const updated = {
      ...shifts[idx],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
      breakMinutes: Number(data.breakMinutes ?? shifts[idx].breakMinutes) || 0,
      overrideRate: data.overrideRate ? Number(data.overrideRate) : null,
    };
    shifts[idx] = updated;
    saveShifts(shifts);
    return updated;
  }

  function deleteShift(id) {
    saveShifts(getShifts().filter(s => s.id !== id));
  }

  /* Query helpers */
  function getShiftsForDate(dateStr) {
    return getShifts().filter(s => s.date === dateStr);
  }

  function getShiftsForMonth(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return getShifts().filter(s => s.date.startsWith(prefix));
  }

  function getShiftsForYear(year) {
    return getShifts().filter(s => s.date.startsWith(String(year)));
  }

  function getShiftsInRange(startDate, endDate) {
    return getShifts().filter(s => s.date >= startDate && s.date <= endDate);
  }

  function getShiftsForJob(jobId) {
    return getShifts().filter(s => s.jobId === jobId);
  }

  /* ══════════════════════════════════════════
     TAX & FEES SETTINGS
  ══════════════════════════════════════════ */
  const DEFAULT_TAX = {
    enabled: false,
    items: [
      { id: 'income-tax',           label: '所得税',  labelEn: 'Income Tax',          category: 'tax',       monthlyAmount: 0, enabled: false, removable: false },
      { id: 'resident-tax',         label: '住民税',  labelEn: 'Resident Tax',         category: 'tax',       monthlyAmount: 0, enabled: false, removable: false },
      { id: 'health-insurance',     label: '健康保険', labelEn: 'Health Insurance',    category: 'insurance', monthlyAmount: 0, enabled: false, removable: false },
      { id: 'pension',              label: '年金',    labelEn: 'Pension',              category: 'insurance', monthlyAmount: 0, enabled: false, removable: false },
      { id: 'employment-insurance', label: '雇用保険', labelEn: 'Employment Insurance', category: 'insurance', monthlyAmount: 0, enabled: false, removable: false },
      { id: 'train-pass',           label: '電車代',  labelEn: 'Train Pass',           category: 'transport', monthlyAmount: 0, enabled: false, removable: true  },
      { id: 'bus-pass',             label: 'バス代',  labelEn: 'Bus Pass',             category: 'transport', monthlyAmount: 0, enabled: false, removable: true  },
    ],
  };

  function getTaxSettings() {
    const saved = read(K.TAX, null);
    if (!saved) return DEFAULT_TAX;
    /* Migrate old key-based format to items array */
    if (!Array.isArray(saved.items)) {
      return { ...DEFAULT_TAX, enabled: saved.enabled || false };
    }
    return saved;
  }

  function saveTaxSettings(ts) { write(K.TAX, ts); }

  function addTaxItem(data) {
    const ts = getTaxSettings();
    ts.items.push({
      id:            'custom-' + uid(),
      label:         data.label,
      labelEn:       data.labelEn || '',
      category:      data.category || 'custom',
      monthlyAmount: Number(data.monthlyAmount) || 0,
      enabled:       true,
      removable:     true,
    });
    saveTaxSettings(ts);
    return ts;
  }

  function removeTaxItem(itemId) {
    const ts  = getTaxSettings();
    ts.items  = ts.items.filter(i => i.id !== itemId || !i.removable);
    saveTaxSettings(ts);
    return ts;
  }

  function updateTaxItem(itemId, patch) {
    const ts = getTaxSettings();
    const idx = ts.items.findIndex(i => i.id === itemId);
    if (idx !== -1) ts.items[idx] = { ...ts.items[idx], ...patch };
    saveTaxSettings(ts);
    return ts;
  }

  /* ══════════════════════════════════════════
     APP SETTINGS
  ══════════════════════════════════════════ */
  const DEFAULT_SETTINGS = { theme: 'dark' };

  function getSettings()    { return read(K.SETTINGS, DEFAULT_SETTINGS); }
  function saveSettings(s)  { write(K.SETTINGS, s); }

  /* ══════════════════════════════════════════
     DATA BACKUP / RESTORE
  ══════════════════════════════════════════ */
  function exportAll() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      jobs:     getJobs(),
      shifts:   getShifts(),
      tax:      getTaxSettings(),
      settings: getSettings(),
    };
  }

  function importAll(data) {
    if (!data || data.version !== '1.0') throw new Error('Invalid backup format');
    if (Array.isArray(data.jobs))   saveJobs(data.jobs);
    if (Array.isArray(data.shifts)) saveShifts(data.shifts);
    if (data.tax)      saveTaxSettings(data.tax);
    if (data.settings) saveSettings(data.settings);
  }

  function clearAll() {
    [K.JOBS, K.SHIFTS, K.TAX].forEach(k => localStorage.removeItem(k));
    /* Keep settings (theme preference) */
  }

  /* ── Sample demo data ── */
  function loadSampleData() {
    clearAll();

    const jobs = [
      { name: 'Restaurant Staff', company: 'Sakura Diner',   baseWage: 1200, weekendMultiplier: 1.25, holidayMultiplier: 1.5,  color: '#EF4444' },
      { name: 'Convenience Store', company: 'Family Mart',    baseWage: 1050, weekendMultiplier: 1.25, holidayMultiplier: 1.5,  color: '#3B82F6' },
      { name: 'Tutoring',          company: 'Self-employed',  baseWage: 2500, weekendMultiplier: 1.0,  holidayMultiplier: 1.0,  color: '#10B981' },
    ];
    const savedJobs = jobs.map(j => addJob(j));

    /* Build ~3 months of sample shifts */
    const today = new Date();
    const sampleShifts = [];

    for (let i = -90; i <= 14; i++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() + i);
      const dateStr = JapaneseHolidays.toKey(dt);
      const dow = dt.getDay();

      if (i % 3 === 0 || (dow === 6 || dow === 0)) {
        const jobIdx = Math.floor(Math.random() * savedJobs.length);
        const job = savedJobs[jobIdx];
        const startH = 9 + Math.floor(Math.random() * 4);
        const dur    = 4 + Math.floor(Math.random() * 5);
        const endH   = Math.min(startH + dur, 22);
        sampleShifts.push({
          date: dateStr,
          jobId: job.id,
          startTime: `${String(startH).padStart(2,'0')}:00`,
          endTime:   `${String(endH).padStart(2,'0')}:00`,
          breakMinutes: dur >= 6 ? 60 : 0,
          notes: '',
        });
      }
    }
    sampleShifts.forEach(s => addShift(s));
  }

  /* ══════════════════════════════════════════
     PROFILE
  ══════════════════════════════════════════ */
  const DEFAULT_PROFILE = {
    name:        '',
    appName:     'ShiftPay',
    appSubtitle: 'Income Tracker',
    avatarColor: '#3B82F6',
  };
  function getProfile()    { return read(K.PROFILE, DEFAULT_PROFILE); }
  function saveProfile(p)  { write(K.PROFILE, { ...DEFAULT_PROFILE, ...p }); }

  /* ══════════════════════════════════════════
     GOALS
  ══════════════════════════════════════════ */
  const DEFAULT_GOALS = { monthlyGross: 0 };
  function getGoals()    { return read(K.GOALS, DEFAULT_GOALS); }
  function saveGoals(g)  { write(K.GOALS, g); }

  /* ══════════════════════════════════════════
     SHIFT TEMPLATES
  ══════════════════════════════════════════ */
  function getTemplates()        { return read(K.TEMPLATES, []); }
  function saveTemplates(list)   { write(K.TEMPLATES, list); }

  function addTemplate(data) {
    const tpl = {
      id:           uid(),
      createdAt:    new Date().toISOString(),
      name:         data.name,
      jobId:        data.jobId,
      startTime:    data.startTime,
      endTime:      data.endTime,
      breakMinutes: Number(data.breakMinutes) || 0,
      daysOfWeek:   data.daysOfWeek || [],   // [0,1,...6] where 0=Sun
    };
    const list = getTemplates();
    list.push(tpl);
    saveTemplates(list);
    return tpl;
  }

  function deleteTemplate(id) {
    saveTemplates(getTemplates().filter(t => t.id !== id));
  }

  /* Apply a template to a given month: creates shifts for each matching day */
  function applyTemplate(tplId, year, month) {
    const tpl = getTemplates().find(t => t.id === tplId);
    if (!tpl) return 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dt  = new Date(year, month, d);
      const dow = dt.getDay();
      if (!tpl.daysOfWeek.includes(dow)) continue;
      const dateStr = JapaneseHolidays.toKey(dt);
      /* Skip if a shift for this job already exists on this date */
      const exists = getShifts().some(s => s.date === dateStr && s.jobId === tpl.jobId);
      if (exists) continue;
      addShift({
        date:         dateStr,
        jobId:        tpl.jobId,
        startTime:    tpl.startTime,
        endTime:      tpl.endTime,
        breakMinutes: tpl.breakMinutes,
        notes:        `(from template: ${tpl.name})`,
      });
      count++;
    }
    return count;
  }

  return {
    /* Jobs */
    getJobs, saveJobs, getJobById, addJob, updateJob, deleteJob,
    /* Shifts */
    getShifts, saveShifts, getShiftById, addShift, updateShift, deleteShift,
    getShiftsForDate, getShiftsForMonth, getShiftsForYear,
    getShiftsInRange, getShiftsForJob,
    /* Tax */
    getTaxSettings, saveTaxSettings, addTaxItem, removeTaxItem, updateTaxItem,
    /* Settings */
    getSettings, saveSettings,
    /* Profile */
    getProfile, saveProfile,
    /* Goals */
    getGoals, saveGoals,
    /* Templates */
    getTemplates, addTemplate, deleteTemplate, applyTemplate,
    /* Backup */
    exportAll, importAll, clearAll, loadSampleData,
    uid,
  };

})();
