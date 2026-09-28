/**
 * charts-view.js — Chart.js chart renderers
 * All charts are destroyed before re-creating to avoid canvas conflicts.
 * Colors are pulled from CSS custom properties for theme-awareness.
 */

const ChartsView = (() => {

  /* ── Chart instance registry (destroy before re-render) ── */
  const _charts = {};

  function _destroy(id) {
    if (_charts[id]) {
      _charts[id].destroy();
      delete _charts[id];
    }
  }

  /* ── Theme-aware color helpers ── */
  function _css(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  function _getThemeColors() {
    return {
      text:        _css('--text-primary')   || '#e8eaf0',
      muted:       _css('--text-muted')     || '#5a6480',
      gridLine:    _css('--border')         || '#1e2a45',
      surface:     _css('--surface')        || '#131e35',
      gold:        _css('--accent-gold')    || '#e9a84c',
      green:       _css('--accent-green')   || '#4ade80',
      red:         _css('--accent-red')     || '#f87171',
      blue:        _css('--accent-blue')    || '#60a5fa',
      purple:      _css('--accent-purple')  || '#a78bfa',
    };
  }

  function _applyGlobalDefaults() {
    const c = _getThemeColors();
    Chart.defaults.color = c.muted;
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 12;
  }

  /* ─────────────────────────────────────────────
     DASHBOARD: Monthly Income Bar
  ───────────────────────────────────────────── */
  function renderMonthlyBar(canvasId, year, taxSettings) {
    _destroy(canvasId);
    _applyGlobalDefaults();

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const c      = _getThemeColors();
    const data   = Income.getMonthlyBreakdown(year, taxSettings);
    const labels = data.map(m => m.label);
    const gross  = data.map(m => m.gross);
    const net    = data.map(m => m.net);
    const now    = new Date();

    _charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Gross',
            data: gross,
            backgroundColor: data.map((m, i) =>
              i === now.getMonth() && year === now.getFullYear()
                ? c.gold : c.gold + '99'
            ),
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Net',
            data: net,
            backgroundColor: data.map((m, i) =>
              i === now.getMonth() && year === now.getFullYear()
                ? c.green : c.green + '66'
            ),
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: c.muted, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            backgroundColor: c.surface,
            titleColor: c.text,
            bodyColor: c.muted,
            borderColor: c.gridLine,
            borderWidth: 1,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${Income.formatCurrency(ctx.raw)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: c.gridLine + '44' },
            ticks: { color: c.muted },
          },
          y: {
            grid: { color: c.gridLine + '44' },
            ticks: {
              color: c.muted,
              callback: v => Income.formatCurrency(v),
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  /* ─────────────────────────────────────────────
     DASHBOARD: Income by Job Donut
  ───────────────────────────────────────────── */
  function renderJobDonut(canvasId, shifts, taxSettings) {
    _destroy(canvasId);
    _applyGlobalDefaults();

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const c      = _getThemeColors();
    const byJob  = Income.getIncomeByJob(shifts, taxSettings);
    if (!byJob.length) { _renderEmpty(canvas, c); return; }

    _charts[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: byJob.map(j => j.jobName),
        datasets: [{
          data: byJob.map(j => Math.round(j.gross)),
          backgroundColor: byJob.map(j => j.color || c.blue),
          hoverOffset: 8,
          borderWidth: 2,
          borderColor: c.surface,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: c.muted, boxWidth: 10, padding: 12 },
          },
          tooltip: {
            backgroundColor: c.surface,
            titleColor: c.text,
            bodyColor: c.muted,
            borderColor: c.gridLine,
            borderWidth: 1,
            callbacks: {
              label: ctx => ` ${Income.formatCurrency(ctx.raw)}`,
            },
          },
        },
      },
    });
  }

  /* ─────────────────────────────────────────────
     DASHBOARD: Monthly Hours Bar
  ───────────────────────────────────────────── */
  function renderHoursBar(canvasId, year) {
    _destroy(canvasId);
    _applyGlobalDefaults();

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const c    = _getThemeColors();
    const data = Income.getMonthlyBreakdown(year, Storage.getTaxSettings());

    _charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.map(m => m.label),
        datasets: [{
          label: 'Hours',
          data: data.map(m => +m.hours.toFixed(1)),
          backgroundColor: c.blue + 'aa',
          hoverBackgroundColor: c.blue,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: c.surface,
            titleColor: c.text,
            bodyColor: c.muted,
            borderColor: c.gridLine,
            borderWidth: 1,
            callbacks: { label: ctx => ` ${Income.formatHours(ctx.raw)}` },
          },
        },
        scales: {
          x: { grid: { color: c.gridLine + '44' }, ticks: { color: c.muted } },
          y: { grid: { color: c.gridLine + '44' }, ticks: { color: c.muted }, beginAtZero: true },
        },
      },
    });
  }

  /* ─────────────────────────────────────────────
     REPORTS: Income timeline (line chart)
  ───────────────────────────────────────────── */
  function renderReportTimeline(canvasId, labels, grossData, netData) {
    _destroy(canvasId);
    _applyGlobalDefaults();

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const c = _getThemeColors();

    _charts[canvasId] = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Gross',
            data: grossData,
            borderColor: c.gold,
            backgroundColor: c.gold + '22',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: c.gold,
          },
          {
            label: 'Net',
            data: netData,
            borderColor: c.green,
            backgroundColor: c.green + '11',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: c.green,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: c.muted, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            backgroundColor: c.surface,
            titleColor: c.text,
            bodyColor: c.muted,
            borderColor: c.gridLine,
            borderWidth: 1,
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ${Income.formatCurrency(ctx.raw)}` },
          },
        },
        scales: {
          x: { grid: { color: c.gridLine + '44' }, ticks: { color: c.muted } },
          y: {
            grid: { color: c.gridLine + '44' },
            ticks: { color: c.muted, callback: v => Income.formatCurrency(v) },
            beginAtZero: true,
          },
        },
      },
    });
  }

  /* ─────────────────────────────────────────────
     REPORTS: Income by job bar
  ───────────────────────────────────────────── */
  function renderReportJobBar(canvasId, byJob) {
    _destroy(canvasId);
    _applyGlobalDefaults();

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const c = _getThemeColors();
    if (!byJob || !byJob.length) { _renderEmpty(canvas, c); return; }

    _charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: byJob.map(j => j.jobName),
        datasets: [{
          label: 'Gross Income',
          data: byJob.map(j => Math.round(j.gross)),
          backgroundColor: byJob.map(j => j.color || c.blue),
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: c.surface,
            titleColor: c.text,
            bodyColor: c.muted,
            borderColor: c.gridLine,
            borderWidth: 1,
            callbacks: { label: ctx => ` ${Income.formatCurrency(ctx.raw)}` },
          },
        },
        scales: {
          x: {
            grid: { color: c.gridLine + '44' },
            ticks: { color: c.muted, callback: v => Income.formatCurrency(v) },
            beginAtZero: true,
          },
          y: { grid: { display: false }, ticks: { color: c.muted } },
        },
      },
    });
  }

  /* ─────────────────────────────────────────────
     REPORTS: Hours bar
  ───────────────────────────────────────────── */
  function renderReportHoursBar(canvasId, labels, hoursData) {
    _destroy(canvasId);
    _applyGlobalDefaults();

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const c = _getThemeColors();

    _charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Hours',
          data: hoursData,
          backgroundColor: c.purple + 'aa',
          hoverBackgroundColor: c.purple,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: c.surface,
            titleColor: c.text,
            bodyColor: c.muted,
            borderColor: c.gridLine,
            borderWidth: 1,
            callbacks: { label: ctx => ` ${Income.formatHours(ctx.raw)}` },
          },
        },
        scales: {
          x: { grid: { color: c.gridLine + '44' }, ticks: { color: c.muted } },
          y: { grid: { color: c.gridLine + '44' }, ticks: { color: c.muted }, beginAtZero: true },
        },
      },
    });
  }

  /* ─────────────────────────────────────────────
     REPORTS: Gross vs Net stacked bar
  ───────────────────────────────────────────── */
  function renderGrossNetBar(canvasId, labels, grossData, netData) {
    _destroy(canvasId);
    _applyGlobalDefaults();

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const c = _getThemeColors();
    const deductions = grossData.map((g, i) => Math.round(g - netData[i]));

    _charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Net',
            data: netData,
            backgroundColor: c.green + 'bb',
            borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 },
            borderSkipped: false,
            stack: 'stack0',
          },
          {
            label: 'Deductions',
            data: deductions,
            backgroundColor: c.red + '99',
            borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            stack: 'stack0',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: c.muted, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            backgroundColor: c.surface,
            titleColor: c.text,
            bodyColor: c.muted,
            borderColor: c.gridLine,
            borderWidth: 1,
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ${Income.formatCurrency(ctx.raw)}` },
          },
        },
        scales: {
          x: { stacked: true, grid: { color: c.gridLine + '44' }, ticks: { color: c.muted } },
          y: {
            stacked: true,
            grid: { color: c.gridLine + '44' },
            ticks: { color: c.muted, callback: v => Income.formatCurrency(v) },
            beginAtZero: true,
          },
        },
      },
    });
  }

  /* ─────────────────────────────────────────────
     TAX VIEW: Deduction Breakdown Donut
  ───────────────────────────────────────────── */
  function renderTaxDonut(canvasId, taxBreakdown) {
    _destroy(canvasId);
    _applyGlobalDefaults();

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const c = _getThemeColors();
    if (!taxBreakdown || !taxBreakdown.lines || !taxBreakdown.lines.length) {
      _renderEmpty(canvas, c); return;
    }

    const paletteColors = [c.red, c.gold, c.blue, c.purple, c.green];

    _charts[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: taxBreakdown.lines.map(l => l.label),
        datasets: [{
          data: taxBreakdown.lines.map(l => Math.round(l.amount)),
          backgroundColor: taxBreakdown.lines.map((_, i) => paletteColors[i % paletteColors.length]),
          hoverOffset: 8,
          borderWidth: 2,
          borderColor: c.surface,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: c.muted, boxWidth: 10, padding: 12, font: { size: 11 } },
          },
          tooltip: {
            backgroundColor: c.surface,
            titleColor: c.text,
            bodyColor: c.muted,
            borderColor: c.gridLine,
            borderWidth: 1,
            callbacks: { label: ctx => ` ${Income.formatCurrency(ctx.raw)}` },
          },
        },
      },
    });
  }

  /* ── Empty state placeholder ── */
  function _renderEmpty(canvas, c) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = c.muted;
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data for this period', canvas.width / 2, canvas.height / 2);
  }

  /* ── Destroy all charts (e.g. before theme switch) ── */
  function destroyAll() {
    Object.keys(_charts).forEach(id => {
      _charts[id].destroy();
      delete _charts[id];
    });
  }

  return {
    renderMonthlyBar,
    renderJobDonut,
    renderHoursBar,
    renderReportTimeline,
    renderReportJobBar,
    renderReportHoursBar,
    renderGrossNetBar,
    renderTaxDonut,
    destroyAll,
  };

})();
