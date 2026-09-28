/**
 * income.js — Core income calculation engine
 * Handles worked hours, rate multipliers, tax deductions, and projections
 */

const Income = (() => {

  /* ── Formatters ── */
  function formatCurrency(amount) {
    return '¥' + Math.floor(Math.max(0, amount)).toLocaleString('ja-JP');
  }

  function formatCurrencyFull(amount) {
    return '¥' + amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatHours(hoursDecimal) {
    const h = Math.floor(hoursDecimal);
    const m = Math.round((hoursDecimal - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  /* ── Time helpers ── */
  function timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  function calcWorkedMinutes(startTime, endTime, breakMinutes = 0) {
    let diff = timeToMinutes(endTime) - timeToMinutes(startTime);
    if (diff < 0) diff += 24 * 60; // overnight shift
    return Math.max(0, diff - breakMinutes);
  }

  /* ── Rate determination ── */
  function getDayType(dateStr) {
    if (JapaneseHolidays.isHoliday(dateStr)) return 'holiday';
    if (JapaneseHolidays.isWeekend(dateStr)) return 'weekend';
    return 'weekday';
  }

  function getEffectiveRate(shift, job) {
    if (shift.overrideRate && shift.overrideRate > 0) {
      return { rate: shift.overrideRate, multiplier: null, dayType: 'custom', overtimeType: null, rateMode: 'override' };
    }

    const dayType = getDayType(shift.date);
    let rate       = job.baseWage;
    let multiplier = 1;
    let rateMode   = 'base';

    if (dayType === 'holiday' && job.holidayEnabled !== false) {
      if (job.holidayMode === 'fixed' && job.holidayFixedRate > 0) {
        rate       = job.holidayFixedRate;
        multiplier = null;
        rateMode   = 'fixed';
      } else {
        multiplier = job.holidayMultiplier || 1.5;
        rate       = job.baseWage * multiplier;
        rateMode   = 'multiplier';
      }
    } else if (dayType === 'weekend' && job.weekendEnabled !== false) {
      if (job.weekendMode === 'fixed' && job.weekendFixedRate > 0) {
        rate       = job.weekendFixedRate;
        multiplier = null;
        rateMode   = 'fixed';
      } else {
        multiplier = job.weekendMultiplier || 1.25;
        rate       = job.baseWage * multiplier;
        rateMode   = 'multiplier';
      }
    }

    /* Japanese overtime stacked on top — only applies in multiplier/base mode */
    const ot = shift.overtimeType || null;
    if (ot && rateMode !== 'fixed') {
      const base = job.baseWage;
      if (ot === 'overtime')           multiplier = Math.max(multiplier || 1, 1.25);
      if (ot === 'latenight')          multiplier = (multiplier || 1) + 0.25;
      if (ot === 'overtime+latenight') { multiplier = Math.max(multiplier || 1, 1.25); multiplier += 0.25; }
      rate = base * multiplier;
      rateMode = 'multiplier';
    }

    return {
      rate,
      multiplier: multiplier !== null ? parseFloat((multiplier).toFixed(2)) : null,
      dayType,
      overtimeType: ot,
      rateMode,
    };
  }

  /* ── Overtime segment calculation ── */
  function calcOvertimeSegments(shift, job) {
    const startMin = timeToMinutes(shift.startTime);
    let endMin     = timeToMinutes(shift.endTime);
    if (endMin <= startMin) endMin += 24 * 60; // overnight shift
    const breakMin  = Number(shift.breakMinutes) || 0;
    const workedMin = Math.max(0, endMin - startMin - breakMin);

    const OVERTIME_LIMIT = 8 * 60;   // 480 min = 8 h
    const LATE_START     = 22 * 60;  // 22:00
    const LATE_END       = 29 * 60;  // 05:00 next day

    // Late-night overlap (before break for simplicity)
    const rawEnd            = endMin;
    const lateOverlapStart  = Math.max(startMin, LATE_START);
    const lateOverlapEnd    = Math.min(rawEnd, LATE_END);
    const lateNightMin      = Math.max(0, lateOverlapEnd - lateOverlapStart);

    // Regular vs overtime
    const regularMin  = Math.min(workedMin, OVERTIME_LIMIT);
    const overtimeMin = Math.max(0, workedMin - OVERTIME_LIMIT);

    const dayType  = getDayType(shift.date);
    const baseWage = shift.overrideRate > 0 ? Number(shift.overrideRate) : job.baseWage;

    let baseMult = 1;
    if (dayType === 'holiday') baseMult = job.holidayMultiplier || 1.5;
    else if (dayType === 'weekend') baseMult = job.weekendMultiplier || 1.25;

    const regularRate  = baseWage * baseMult;
    // Overtime: +25% on top of whatever day type applies
    const overtimeRate = baseWage * Math.max(baseMult + 0.25, 1.25);
    // Late-night premium: +25% additional per hour (Japanese 深夜手当)
    const lateNightPremiumRate = baseWage * 0.25;

    const regularGross   = (regularMin / 60)   * regularRate;
    const overtimeGross  = (overtimeMin / 60)  * overtimeRate;
    const lateNightExtra = (lateNightMin / 60) * lateNightPremiumRate;
    const gross          = regularGross + overtimeGross + lateNightExtra;

    return {
      workedMinutes: workedMin,
      workedHours:   workedMin / 60,
      regularMinutes:   regularMin,
      overtimeMinutes:  overtimeMin,
      lateNightMinutes: lateNightMin,
      regularRate,
      overtimeRate,
      lateNightPremiumRate,
      regularGross,
      overtimeGross,
      lateNightExtra,
      gross,
      dayType,
      hasOvertime:  overtimeMin > 0,
      hasLateNight: lateNightMin > 0,
    };
  }

  /* ── Shift details — respects user's manual overtimeType only ── */
  function calcShiftDetails(shift, job, _taxSettings) {
    const startMin   = timeToMinutes(shift.startTime);
    let   endMin     = timeToMinutes(shift.endTime);
    if (endMin <= startMin) endMin += 24 * 60;
    const breakMin   = Number(shift.breakMinutes) || 0;
    const workedMin  = Math.max(0, endMin - startMin - breakMin);
    const workedHours = workedMin / 60;

    const dayType    = getDayType(shift.date);
    const baseWage   = shift.overrideRate > 0 ? Number(shift.overrideRate) : job.baseWage;

    /* Day-type multiplier */
    let mult = 1;
    if (dayType === 'holiday' && job.holidayEnabled !== false) {
      mult = job.holidayMode === 'fixed' ? 1 : (job.holidayMultiplier || 1.5);
    } else if (dayType === 'weekend' && job.weekendEnabled !== false) {
      mult = job.weekendMode === 'fixed' ? 1 : (job.weekendMultiplier || 1.25);
    }

    /* Fixed yen rate overrides multiplier */
    let rate = baseWage * mult;
    if (dayType === 'holiday' && job.holidayEnabled !== false && job.holidayMode === 'fixed' && job.holidayFixedRate > 0) {
      rate = job.holidayFixedRate;
    } else if (dayType === 'weekend' && job.weekendEnabled !== false && job.weekendMode === 'fixed' && job.weekendFixedRate > 0) {
      rate = job.weekendFixedRate;
    }

    /* User-selected overtime / late night ONLY — no auto-detection */
    const ot = shift.overtimeType || null;
    if (ot === 'overtime')           rate = Math.max(rate, baseWage * 1.25);
    if (ot === 'latenight')          rate = rate + baseWage * 0.25;
    if (ot === 'overtime+latenight') rate = Math.max(rate, baseWage * 1.25) + baseWage * 0.25;

    const gross = workedHours * rate;

    return {
      workedMinutes: workedMin,
      workedHours,
      rate,
      multiplier: mult,
      dayType,
      gross,
      deductions: 0,
      net: gross,
      overtimeDetails: {
        hasOvertime:  ot === 'overtime' || ot === 'overtime+latenight',
        hasLateNight: ot === 'latenight' || ot === 'overtime+latenight',
      },
      isHoliday: dayType === 'holiday',
      isWeekend:  dayType === 'weekend',
    };
  }

  /* ── Aggregate over a list of shifts (gross only; no per-shift tax) ── */
  function calcAggregate(shifts) {
    const jobs    = Storage.getJobs();
    const jobMap  = new Map(jobs.map(j => [j.id, j]));
    let minutes = 0, gross = 0, count = 0;

    shifts.forEach(shift => {
      const job = jobMap.get(shift.jobId);
      if (!job) return;
      const d = calcShiftDetails(shift, job, null);
      minutes += d.workedMinutes;
      gross   += d.gross;
      count++;
    });

    return { hours: minutes / 60, gross, deductions: 0, net: gross, count };
  }

  /* ── Monthly fixed deduction total (items array) ── */
  function calcMonthlyDeductions(taxSettings) {
    if (!taxSettings?.enabled) return 0;
    return (taxSettings.items || []).reduce((sum, item) => {
      return sum + (item.enabled ? (Number(item.monthlyAmount) || 0) : 0);
    }, 0);
  }

  /* ── Period helpers ── */
  function todayKey() { return JapaneseHolidays.toKey(new Date()); }

  function getWeekRange() {
    const today = new Date();
    const dow   = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: JapaneseHolidays.toKey(monday), end: JapaneseHolidays.toKey(sunday) };
  }

  /* ── Public period calculators ── */
  function getToday(_taxSettings) {
    return calcAggregate(Storage.getShiftsForDate(todayKey()));
  }

  function getThisWeek(_taxSettings) {
    const { start, end } = getWeekRange();
    return calcAggregate(Storage.getShiftsInRange(start, end));
  }

  function getMonth(year, month, taxSettings) {
    const agg = calcAggregate(Storage.getShiftsForMonth(year, month));
    const deductions = calcMonthlyDeductions(taxSettings);
    return { ...agg, deductions, net: agg.gross - deductions };
  }

  function getYear(year, taxSettings) {
    const agg        = calcAggregate(Storage.getShiftsForYear(year));
    const deductions = calcMonthlyDeductions(taxSettings) * 12;
    return { ...agg, deductions, net: agg.gross - deductions };
  }

  function getAll(taxSettings) {
    const shifts = Storage.getShifts();
    const agg    = calcAggregate(shifts);
    if (!shifts.length) return agg;
    /* Count distinct months in the data */
    const months     = new Set(shifts.map(s => s.date.slice(0, 7)));
    const deductions = calcMonthlyDeductions(taxSettings) * months.size;
    return { ...agg, deductions, net: agg.gross - deductions };
  }

  /* ── Projected salary estimator ── */
  function getProjected(year, month, taxSettings) {
    const shifts   = Storage.getShiftsForMonth(year, month);
    const today    = todayKey();
    const past     = shifts.filter(s => s.date <= today);
    const upcoming = shifts.filter(s => s.date >  today);

    const earned    = calcAggregate(past);
    const projected = calcAggregate(upcoming);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayOfMonth  = new Date().getMonth() === month && new Date().getFullYear() === year
      ? new Date().getDate() : daysInMonth;

    const totalGross = earned.gross + projected.gross;
    const deductions = calcMonthlyDeductions(taxSettings);

    const pct = totalGross > 0 ? earned.gross / totalGross : 0;

    return {
      earned,
      projected,
      total: {
        hours:      earned.hours + projected.hours,
        gross:      totalGross,
        deductions,
        net:        totalGross - deductions,
        count:      earned.count + projected.count,
      },
      completionPct: Math.min(100, Math.round(pct * 100)),
      daysRemaining: daysInMonth - dayOfMonth,
      daysInMonth,
    };
  }

  /* ── Monthly breakdown for chart ── */
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function getMonthlyBreakdown(year, taxSettings) {
    const deductions = calcMonthlyDeductions(taxSettings);
    return Array.from({ length: 12 }, (_, m) => {
      const agg = calcAggregate(Storage.getShiftsForMonth(year, m));
      return {
        month: m,
        label: MONTH_LABELS[m],
        ...agg,
        deductions,
        net: agg.gross - deductions,
      };
    });
  }

  /* ── Income by job ── */
  function getIncomeByJob(shifts, _taxSettings) {
    const jobs   = Storage.getJobs();
    const jobMap = new Map(jobs.map(j => [j.id, j]));
    const result = new Map();

    shifts.forEach(shift => {
      const job = jobMap.get(shift.jobId);
      if (!job) return;
      const d = calcShiftDetails(shift, job, null);
      if (!result.has(shift.jobId)) {
        result.set(shift.jobId, {
          job,
          jobName: job.name,
          color:   job.color,
          hours: 0, gross: 0, net: 0, count: 0,
        });
      }
      const r = result.get(shift.jobId);
      r.hours += d.workedHours;
      r.gross += d.gross;
      r.net   += d.gross;   // per-job net = gross (deductions applied monthly, not per-job)
      r.count++;
    });

    return [...result.values()].sort((a, b) => b.gross - a.gross);
  }

  /* ── Tax & Fees breakdown (items array) ── */
  function calcTaxBreakdown(taxSettings) {
    const lines = [];
    let total   = 0;

    if (taxSettings?.enabled) {
      (taxSettings.items || []).forEach(item => {
        if (item.enabled) {
          const amt = Number(item.monthlyAmount) || 0;
          total += amt;
          lines.push({
            id:       item.id,
            label:    item.label + (item.labelEn ? ' (' + item.labelEn + ')' : ''),
            category: item.category,
            amount:   amt,
          });
        }
      });
    }
    return { lines, total };
  }

  return {
    formatCurrency,
    formatCurrencyFull,
    formatHours,
    calcWorkedMinutes,
    getDayType,
    getEffectiveRate,
    calcShiftDetails,
    calcOvertimeSegments,
    calcAggregate,
    calcMonthlyDeductions,
    getToday,
    getThisWeek,
    getMonth,
    getYear,
    getAll,
    getProjected,
    getMonthlyBreakdown,
    getIncomeByJob,
    calcTaxBreakdown,
    todayKey,
  };
})();
