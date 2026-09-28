/**
 * holidays.js — Japanese National Holiday Calculator
 * Covers 2020–2030 with fixed, Happy Monday, and substitute holidays
 */

const JapaneseHolidays = (() => {

  /* Fixed holidays (month is 0-indexed) */
  const FIXED = [
    { m: 0,  d: 1,  name: '元日 (New Year\'s Day)' },
    { m: 1,  d: 11, name: '建国記念の日 (National Foundation Day)' },
    { m: 1,  d: 23, name: '天皇誕生日 (Emperor\'s Birthday)' },
    { m: 3,  d: 29, name: '昭和の日 (Showa Day)' },
    { m: 4,  d: 3,  name: '憲法記念日 (Constitution Memorial Day)' },
    { m: 4,  d: 4,  name: 'みどりの日 (Greenery Day)' },
    { m: 4,  d: 5,  name: 'こどもの日 (Children\'s Day)' },
    { m: 7,  d: 11, name: '山の日 (Mountain Day)' },
    { m: 10, d: 3,  name: '文化の日 (Culture Day)' },
    { m: 10, d: 23, name: '勤労感謝の日 (Labor Thanksgiving Day)' },
  ];

  /* Vernal and autumnal equinox days by year */
  const EQUINOX = {
    2020: { v: [2, 20], a: [8, 22] },
    2021: { v: [2, 20], a: [8, 23] },
    2022: { v: [2, 21], a: [8, 23] },
    2023: { v: [2, 21], a: [8, 23] },
    2024: { v: [2, 20], a: [8, 22] },
    2025: { v: [2, 20], a: [8, 23] },
    2026: { v: [2, 20], a: [8, 23] },
    2027: { v: [2, 21], a: [8, 23] },
    2028: { v: [2, 20], a: [8, 22] },
    2029: { v: [2, 20], a: [8, 23] },
    2030: { v: [2, 20], a: [8, 23] },
  };

  /* Get the nth weekday (0=Sun..6=Sat) in a given month */
  function nthWeekday(year, month, weekday, n) {
    let count = 0;
    for (let d = 1; d <= 31; d++) {
      const dt = new Date(year, month, d);
      if (dt.getMonth() !== month) break;
      if (dt.getDay() === weekday) {
        count++;
        if (count === n) return d;
      }
    }
    return null;
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function toKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function fromKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /* Build holiday map for a given year → Map<'YYYY-MM-DD', string> */
  function buildYear(year) {
    const map = new Map();

    /* Fixed */
    FIXED.forEach(h => map.set(`${year}-${pad(h.m + 1)}-${pad(h.d)}`, h.name));

    /* Equinox */
    const eq = EQUINOX[year];
    if (eq) {
      map.set(`${year}-${pad(eq.v[0] + 1)}-${pad(eq.v[1])}`, '春分の日 (Vernal Equinox)');
      map.set(`${year}-${pad(eq.a[0] + 1)}-${pad(eq.a[1])}`, '秋分の日 (Autumnal Equinox)');
    }

    /* Happy Monday system */
    const comingOfAge = nthWeekday(year, 0, 1, 2);
    if (comingOfAge) map.set(`${year}-01-${pad(comingOfAge)}`, '成人の日 (Coming of Age Day)');

    const marineDay = nthWeekday(year, 6, 1, 3);
    if (marineDay) map.set(`${year}-07-${pad(marineDay)}`, '海の日 (Marine Day)');

    const agedDay = nthWeekday(year, 8, 1, 3);
    if (agedDay) map.set(`${year}-09-${pad(agedDay)}`, '敬老の日 (Respect for Aged Day)');

    const sportsDay = nthWeekday(year, 9, 1, 2);
    if (sportsDay) map.set(`${year}-10-${pad(sportsDay)}`, 'スポーツの日 (Sports Day)');

    /* Substitute holidays (振替休日): holiday on Sunday → next Monday is off */
    const keys = [...map.keys()].sort();
    const subs = new Map();
    keys.forEach(key => {
      const dt = fromKey(key);
      if (dt.getDay() === 0) { // Sunday
        const next = new Date(dt);
        next.setDate(next.getDate() + 1);
        while (map.has(toKey(next)) || subs.has(toKey(next))) {
          next.setDate(next.getDate() + 1);
        }
        subs.set(toKey(next), '振替休日 (Substitute Holiday)');
      }
    });
    subs.forEach((v, k) => map.set(k, v));

    /* 国民の休日: non-holiday between two holidays */
    const allKeys = [...map.keys()].sort();
    allKeys.forEach(key => {
      const dt = fromKey(key);
      const prev = new Date(dt); prev.setDate(dt.getDate() - 2);
      const mid  = new Date(dt); mid.setDate(dt.getDate() - 1);
      if (map.has(toKey(prev)) && !map.has(toKey(mid)) && mid.getDay() !== 0) {
        map.set(toKey(mid), '国民の休日 (Citizens\' Holiday)');
      }
    });

    return map;
  }

  /* Cache per year */
  const cache = new Map();
  function getYear(year) {
    if (!cache.has(year)) cache.set(year, buildYear(year));
    return cache.get(year);
  }

  /* Public API */
  function isHoliday(dateStr) {
    const year = parseInt(dateStr.slice(0, 4));
    return getYear(year).has(dateStr);
  }

  function getHolidayName(dateStr) {
    const year = parseInt(dateStr.slice(0, 4));
    return getYear(year).get(dateStr) || null;
  }

  function isWeekend(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
  }

  function isWeekday(dateStr) {
    return !isWeekend(dateStr) && !isHoliday(dateStr);
  }

  /* Get all holidays for a month as an array of { date, name } */
  function getMonthHolidays(year, month) {
    const all = getYear(year);
    const results = [];
    all.forEach((name, key) => {
      const [y, m] = key.split('-').map(Number);
      if (y === year && m === month + 1) results.push({ date: key, name });
    });
    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  /* Get all holiday dates for a year as Set */
  function getYearHolidaySet(year) {
    return new Set(getYear(year).keys());
  }

  return {
    isHoliday,
    isWeekend,
    isWeekday,
    getHolidayName,
    getMonthHolidays,
    getYearHolidaySet,
    toKey,
  };
})();
