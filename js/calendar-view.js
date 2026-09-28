/**
 * calendar-view.js — FullCalendar v6 integration
 * Handles calendar rendering, shift events, holiday markers, and month stats
 */

const CalendarView = (() => {

  let calendar = null;

  /* ── Initialize ── */
  function init() {
    const el = document.getElementById('fullcalendar');
    if (!el) return;

    calendar = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      headerToolbar: false,        // We use our own toolbar buttons
      firstDay: 0,                 // Sunday first (common in Japan UI)
      height: 'auto',
      selectable: true,
      eventDisplay: 'block',

      /* ─ Date click: open Add Shift modal ─ */
      dateClick(info) {
        Modals.openShiftModal(info.dateStr);
      },

      /* ─ Event click: open Edit Shift modal ─ */
      eventClick(info) {
        const shiftId = info.event.extendedProps.shiftId;
        if (shiftId) Modals.openShiftModal(null, shiftId);
      },

      /* ─ After render: add holiday markers & update stats ─ */
      datesSet(info) {
        _updateTitle();
        _renderHolidayMarkers(info.start, info.end);
        _updateMonthStats();
      },

      /* ─ Day cell rendering: add weekend/holiday class ─ */
      dayCellDidMount(info) {
        const dateStr = _toDateStr(info.date);
        if (JapaneseHolidays.isHoliday(dateStr)) {
          info.el.classList.add('fc-day-holiday');
        }
      },
    });

    calendar.render();
    _bindToolbarButtons();
  }

  /* ── Bind custom toolbar ── */
  function _bindToolbarButtons() {
    document.getElementById('calPrev')?.addEventListener('click', () => {
      calendar.prev(); _updateTitle(); _updateMonthStats();
    });
    document.getElementById('calNext')?.addEventListener('click', () => {
      calendar.next(); _updateTitle(); _updateMonthStats();
    });
    document.getElementById('calToday')?.addEventListener('click', () => {
      calendar.today(); _updateTitle(); _updateMonthStats();
    });

    document.querySelectorAll('.cal-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.calview;
        calendar.changeView(view);
        document.querySelectorAll('.cal-view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _updateTitle();
        _updateMonthStats();
      });
    });
  }

  /* ── Update title display ── */
  function _updateTitle() {
    const titleEl = document.getElementById('calTitle');
    if (!titleEl || !calendar) return;
    const d = calendar.getDate();
    titleEl.textContent = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /* ── Render all shifts as calendar events ── */
  function refresh() {
    if (!calendar) return;
    calendar.removeAllEvents();

    const jobs = Storage.getJobs();
    const shifts = Storage.getShifts();
    const taxSettings = Storage.getTaxSettings();

    shifts.forEach(shift => {
      const job = jobs.find(j => j.id === shift.jobId);
      if (!job) return;

      const details = Income.calcShiftDetails(shift, job, taxSettings);
      const title = `${job.name}  ${Income.formatCurrency(details.gross)}`;

      calendar.addEvent({
        id: shift.id,
        title,
        start: shift.date,
        allDay: true,
        backgroundColor: job.color,
        borderColor: job.color,
        textColor: '#ffffff',
        extendedProps: { shiftId: shift.id },
      });
    });

    _updateMonthStats();
  }

  /* ── Holiday markers on day number cells ── */
  function _renderHolidayMarkers(start, end) {
    // Remove stale markers first
    document.querySelectorAll('.fc-holiday-name').forEach(el => el.remove());

    const cur = new Date(start);
    while (cur < end) {
      const dateStr = _toDateStr(cur);
      const name = JapaneseHolidays.getHolidayName(dateStr);
      if (name) {
        // Find the day cell via FullCalendar's data-date attribute
        const cell = document.querySelector(`.fc-daygrid-day[data-date="${dateStr}"]`);
        if (cell) {
          const frame = cell.querySelector('.fc-daygrid-day-frame');
          if (frame) {
            const marker = document.createElement('div');
            marker.className = 'fc-holiday-name';
            marker.title = name;
            marker.textContent = name.length > 8 ? name.slice(0, 8) + '…' : name;
            frame.appendChild(marker);
          }
        }
      }
      cur.setDate(cur.getDate() + 1);
    }
  }

  /* ── Month stats chips ── */
  function _updateMonthStats() {
    const container = document.getElementById('calMonthStats');
    if (!container || !calendar) return;

    const d = calendar.getDate();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    const shifts = Storage.getShiftsForMonth(year, month);
    const jobs   = Storage.getJobs();
    const tax    = Storage.getTaxSettings();

    const agg = Income.calcAggregate(shifts, tax);

    container.innerHTML = `
      <span class="cal-stat-chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${agg.count} shift${agg.count !== 1 ? 's' : ''}
      </span>
      <span class="cal-stat-chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${Income.formatHours(agg.hours)}
      </span>
      <span class="cal-stat-chip accent">
        ${Income.formatCurrency(agg.gross)}
      </span>
    `;
  }

  /* ── Helpers ── */
  function _toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /* Public API */
  return { init, refresh };

})();
