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
      dayMaxEvents: 2,
      fixedWeekCount: false,
      noEventsContent: 'No shifts this month',
      height: 'auto',
      selectable: true,
      eventDisplay: 'block',

      /* ─ Compact event label: "¥8,400 Job" (desktop) / "¥8.4k" (phone) ─ */
      eventContent(arg) {
        const { gross, jobName } = arg.event.extendedProps;
        if (gross == null) return true;
        const el = document.createElement('span');
        el.className = 'ev';
        el.textContent = window.innerWidth < 600
          ? '¥' + (gross >= 10000 ? Math.round(gross / 1000) + 'k' : gross >= 1000 ? (Math.round(gross / 100) / 10) + 'k' : Math.round(gross))
          : `${Income.formatCurrency(gross)} ${jobName}`;
        return { domNodes: [el] };
      },

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
      const title = `${Income.formatCurrency(details.gross)} ${job.name}`;

      calendar.addEvent({
        id: shift.id,
        title,
        start: shift.date,
        allDay: true,
        backgroundColor: job.color,
        borderColor: job.color,
        textColor: '#ffffff',
        extendedProps: { shiftId: shift.id, gross: details.gross, jobName: job.name },
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
            marker.textContent = name.split(' (')[0];
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
    const shifts = Storage.getShiftsForMonth(d.getFullYear(), d.getMonth()); // month is 0-based
    const agg    = Income.calcAggregate(shifts);

    container.textContent = agg.count
      ? `${agg.count} shift${agg.count !== 1 ? 's' : ''} · ${Income.formatHours(agg.hours)} · ${Income.formatCurrency(agg.gross)}`
      : 'No shifts this month — tap a day to add one.';
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
