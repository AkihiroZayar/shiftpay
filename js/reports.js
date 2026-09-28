/**
 * reports.js — Report view logic
 * Handles period filtering, stats rendering, chart data, and PDF/Excel/CSV export.
 */

const Reports = (() => {

  /* ── State ── */
  let _shifts   = [];
  let _year     = new Date().getFullYear();
  let _month    = null;   // null = full year
  let _jobId    = '';

  /* ════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════ */
  function init() {
    _populateYearSelect();
    _populateJobSelect();
    _bindFilterEvents();
    render();
  }

  /* ── Year dropdown ── */
  function _populateYearSelect() {
    const sel = document.getElementById('reportYear');
    if (!sel) return;

    const years = _availableYears();
    sel.innerHTML = '';
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === _year) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function _availableYears() {
    const shifts = Storage.getShifts();
    const set    = new Set(shifts.map(s => parseInt(s.date.slice(0, 4))));
    set.add(new Date().getFullYear());
    return [...set].sort((a, b) => b - a);
  }

  /* ── Job dropdown ── */
  function _populateJobSelect() {
    const sel = document.getElementById('reportJob');
    if (!sel) return;

    const jobs = Storage.getJobs();
    // Keep the first "All Jobs" option from HTML
    sel.innerHTML = '<option value="">All Jobs</option>';
    jobs.forEach(j => {
      const opt       = document.createElement('option');
      opt.value       = j.id;
      opt.textContent = j.name;
      sel.appendChild(opt);
    });
  }

  /* ── Event bindings ── */
  function _bindFilterEvents() {
    document.getElementById('applyFilter')?.addEventListener('click',  render);
    document.getElementById('reportYear')?.addEventListener('change',  render);
    document.getElementById('reportMonth')?.addEventListener('change', render);
    document.getElementById('reportJob')?.addEventListener('change',   render);

    document.getElementById('exportPDF')?.addEventListener('click',   exportPDF);
    document.getElementById('exportExcel')?.addEventListener('click', exportExcel);
    document.getElementById('exportCSV')?.addEventListener('click',   exportCSV);
  }

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  function render() {
    /* Read filter state */
    _year  = parseInt(document.getElementById('reportYear')?.value)  || new Date().getFullYear();
    const mv  = document.getElementById('reportMonth')?.value;
    _month = mv !== '' && mv != null ? parseInt(mv) : null;
    _jobId = document.getElementById('reportJob')?.value || '';

    /* Fetch shifts */
    let shifts = _month !== null
      ? Storage.getShiftsForMonth(_year, _month)
      : Storage.getShiftsForYear(_year);

    if (_jobId) shifts = shifts.filter(s => s.jobId === _jobId);
    _shifts = shifts;

    const tax = Storage.getTaxSettings();
    _renderStats(shifts, tax);
    _renderTable(shifts, tax);
    _renderCharts(shifts, tax);
  }

  /* ── Summary stat cards ── */
  function _renderStats(shifts, tax) {
    const container = document.getElementById('reportStatsGrid');
    if (!container) return;

    const agg = Income.calcAggregate(shifts, tax);
    const avgPerShift = agg.count > 0 ? agg.gross / agg.count : 0;
    const avgPerHour  = agg.hours > 0 ? agg.gross / agg.hours : 0;

    container.innerHTML = [
      { label: 'Total Shifts',  value: agg.count + '',                              sub: null,                               cls: '' },
      { label: 'Total Hours',   value: Income.formatHours(agg.hours),               sub: null,                               cls: '' },
      { label: 'Gross Income',  value: Income.formatCurrency(agg.gross),            sub: `Avg ${Income.formatCurrency(avgPerShift)}/shift`, cls: 'accent-gold' },
      { label: 'Net Income',    value: Income.formatCurrency(agg.net),              sub: tax.enabled ? `Deducted ${Income.formatCurrency(agg.deductions)}` : 'Tax not enabled', cls: 'accent-green' },
      { label: 'Avg Hourly',    value: Income.formatCurrency(avgPerHour) + '/hr',   sub: null,                               cls: '' },
    ].map(s => `
      <div class="stat-card">
        <span class="stat-label">${s.label}</span>
        <span class="stat-value ${s.cls}">${s.value}</span>
        ${s.sub ? `<span class="stat-meta">${s.sub}</span>` : ''}
      </div>
    `).join('');
  }

  /* ── Shift detail table ── */
  function _renderTable(shifts, tax) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

    if (!shifts.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;color:var(--text-muted);padding:40px 20px">
            No shifts found for this period.
          </td>
        </tr>`;
      return;
    }

    const jobs   = Storage.getJobs();
    const jobMap = new Map(jobs.map(j => [j.id, j]));
    const sorted = [...shifts].sort((a, b) => b.date.localeCompare(a.date));
    const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    tbody.innerHTML = sorted.map(shift => {
      const job = jobMap.get(shift.jobId);
      if (!job) return '';

      const d       = Income.calcShiftDetails(shift, job, tax);
      const dt      = new Date(shift.date + 'T12:00:00');
      const dayName = DOW[dt.getDay()];

      const dayBadge = d.isHoliday
        ? `<span class="badge-holiday">祝</span>`
        : (d.isWeekend ? `<span class="badge-weekend">休</span>` : '');

      return `
        <tr>
          <td>${shift.date}</td>
          <td>${dayName} ${dayBadge}</td>
          <td>
            <span class="job-dot" style="background:${job.color}"></span>
            ${job.name}
          </td>
          <td>${Income.formatHours(d.workedHours)}</td>
          <td>${Income.formatCurrency(d.rate)}</td>
          <td class="accent-gold">${Income.formatCurrency(d.gross)}</td>
          <td style="color:var(--accent-red)">${d.deductions > 0 ? '−' + Income.formatCurrency(d.deductions) : '—'}</td>
          <td class="accent-green">${Income.formatCurrency(d.net)}</td>
          <td class="notes-cell">${shift.notes || '—'}</td>
        </tr>`;
    }).join('');
  }

  /* ── Charts ── */
  function _renderCharts(shifts, tax) {
    const jobs   = Storage.getJobs();
    const jobMap = new Map(jobs.map(j => [j.id, j]));

    /* ─ Timeline and Hours chart data ─ */
    let labels = [], grossData = [], netData = [], hoursData = [];

    if (_month !== null) {
      /* Month view: daily breakdown */
      const daysInMonth = new Date(_year, _month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr   = `${_year}-${String(_month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayShifts = shifts.filter(s => s.date === dateStr);
        const agg       = Income.calcAggregate(dayShifts, tax);
        labels.push(String(d));
        grossData.push(Math.round(agg.gross));
        netData.push(Math.round(agg.net));
        hoursData.push(parseFloat(agg.hours.toFixed(1)));
      }
    } else {
      /* Year view: monthly breakdown */
      const monthly = Income.getMonthlyBreakdown(_year, tax);
      labels    = monthly.map(m => m.label);
      grossData = monthly.map(m => Math.round(m.gross));
      netData   = monthly.map(m => Math.round(m.net));
      hoursData = monthly.map(m => parseFloat(m.hours.toFixed(1)));
    }

    /* ─ Job breakdown ─ */
    const byJob = Income.getIncomeByJob(shifts, tax);

    /* ─ Render charts ─ */
    ChartsView.renderReportTimeline('rptChart1', labels, grossData, netData);
    ChartsView.renderReportJobBar('rptChart2', byJob);
    ChartsView.renderReportHoursBar('rptChart3', labels, hoursData);
    ChartsView.renderGrossNetBar('rptChart4', labels, grossData, netData);
  }

  /* ════════════════════════════════════════════
     EXPORT: PDF
  ════════════════════════════════════════════ */
  function exportPDF() {
    if (!window.jspdf) {
      Modals.showToast('PDF library not loaded yet, please try again.', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc       = new jsPDF({ orientation: 'landscape' });
    const tax       = Storage.getTaxSettings();
    const agg       = Income.calcAggregate(_shifts, tax);
    const jobs      = Storage.getJobs();
    const jobMap    = new Map(jobs.map(j => [j.id, j]));
    const DOW       = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const periodLabel = _month !== null
      ? new Date(_year, _month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : String(_year);

    /* ─ Header ─ */
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text('ShiftPay — Income Report', 14, 18);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${periodLabel}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);

    /* ─ Summary box ─ */
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const summaryLines = [
      `Total Shifts: ${agg.count}    Total Hours: ${Income.formatHours(agg.hours)}`,
      `Gross Income: ${Income.formatCurrency(agg.gross)}    Net Income: ${Income.formatCurrency(agg.net)}`,
    ];
    doc.text(summaryLines, 14, 42);

    /* ─ Table ─ */
    const sorted = [..._shifts].sort((a, b) => b.date.localeCompare(a.date));
    const rows   = sorted.map(shift => {
      const job = jobMap.get(shift.jobId);
      if (!job) return null;
      const d   = Income.calcShiftDetails(shift, job, tax);
      const dt  = new Date(shift.date + 'T12:00:00');
      return [
        shift.date,
        DOW[dt.getDay()],
        job.name,
        Income.formatHours(d.workedHours),
        Income.formatCurrency(d.rate) + '/hr',
        Income.formatCurrency(d.gross),
        d.deductions > 0 ? '−' + Income.formatCurrency(d.deductions) : '—',
        Income.formatCurrency(d.net),
        shift.notes || '',
      ];
    }).filter(Boolean);

    doc.autoTable({
      head: [['Date','Day','Job','Hours','Rate','Gross','Tax','Net','Notes']],
      body: rows,
      startY: 54,
      styles:     { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 252] },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
    });

    /* ─ Footer ─ */
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160);
      doc.text(`ShiftPay · Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    }

    const filename = `shiftpay-${_year}${_month !== null ? `-${String(_month + 1).padStart(2,'0')}` : ''}.pdf`;
    doc.save(filename);
    Modals.showToast('PDF downloaded!', 'success');
  }

  /* ════════════════════════════════════════════
     EXPORT: Excel
  ════════════════════════════════════════════ */
  function exportExcel() {
    if (!window.XLSX) {
      Modals.showToast('Excel library not loaded yet, please try again.', 'error');
      return;
    }

    const tax    = Storage.getTaxSettings();
    const jobs   = Storage.getJobs();
    const jobMap = new Map(jobs.map(j => [j.id, j]));
    const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const sorted = [..._shifts].sort((a, b) => b.date.localeCompare(a.date));

    /* ─ Summary sheet ─ */
    const agg = Income.calcAggregate(_shifts, tax);
    const summaryData = [
      ['ShiftPay Income Report'],
      ['Period', _month !== null
        ? new Date(_year, _month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : String(_year)],
      ['Generated', new Date().toLocaleDateString()],
      [],
      ['Total Shifts', agg.count],
      ['Total Hours',  parseFloat(agg.hours.toFixed(2))],
      ['Gross Income', Math.round(agg.gross)],
      ['Tax Deductions', Math.round(agg.deductions)],
      ['Net Income',   Math.round(agg.net)],
    ];

    /* ─ Detail sheet ─ */
    const detailRows = [
      ['Date','Day','Job','Company','Hours','Rate (¥/hr)','Gross (¥)','Tax (¥)','Net (¥)','Notes'],
    ];

    sorted.forEach(shift => {
      const job = jobMap.get(shift.jobId);
      if (!job) return;
      const d  = Income.calcShiftDetails(shift, job, tax);
      const dt = new Date(shift.date + 'T12:00:00');
      detailRows.push([
        shift.date,
        DOW[dt.getDay()],
        job.name,
        job.company || '',
        parseFloat(d.workedHours.toFixed(2)),
        Math.round(d.rate),
        Math.round(d.gross),
        Math.round(d.deductions),
        Math.round(d.net),
        shift.notes || '',
      ]);
    });

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 18 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
    wsDetail['!cols'] = [
      { wch: 12 }, { wch: 6 }, { wch: 18 }, { wch: 16 },
      { wch: 8 },  { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Shifts');

    const filename = `shiftpay-${_year}${_month !== null ? `-${String(_month + 1).padStart(2,'0')}` : ''}.xlsx`;
    XLSX.writeFile(wb, filename);
    Modals.showToast('Excel file downloaded!', 'success');
  }

  /* ════════════════════════════════════════════
     EXPORT: CSV
  ════════════════════════════════════════════ */
  function exportCSV() {
    const tax    = Storage.getTaxSettings();
    const jobs   = Storage.getJobs();
    const jobMap = new Map(jobs.map(j => [j.id, j]));
    const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const sorted = [..._shifts].sort((a, b) => b.date.localeCompare(a.date));

    const escape = v => `"${String(v).replace(/"/g, '""')}"`;

    const header = 'Date,Day,Job,Company,Hours,Rate,Gross,Tax,Net,Notes';
    const rows   = sorted.map(shift => {
      const job = jobMap.get(shift.jobId);
      if (!job) return null;
      const d  = Income.calcShiftDetails(shift, job, tax);
      const dt = new Date(shift.date + 'T12:00:00');
      return [
        shift.date,
        DOW[dt.getDay()],
        escape(job.name),
        escape(job.company || ''),
        parseFloat(d.workedHours.toFixed(2)),
        Math.round(d.rate),
        Math.round(d.gross),
        Math.round(d.deductions),
        Math.round(d.net),
        escape(shift.notes || ''),
      ].join(',');
    }).filter(Boolean);

    /* BOM for Excel-compatible UTF-8 */
    const csv  = '\uFEFF' + [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `shiftpay-${_year}${_month !== null ? `-${String(_month + 1).padStart(2,'0')}` : ''}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Modals.showToast('CSV downloaded!', 'success');
  }

  /* ── Refresh year/job dropdowns when data changes ── */
  function refreshSelectors() {
    _populateYearSelect();
    _populateJobSelect();
  }

  return { init, render, refreshSelectors };

})();
