<h1 align="center">ShiftPay — Work Income Tracker</h1>

<p align="center">
  A modern, calendar-based income tracker for part-time workers in Japan. Track shifts across multiple jobs, automatically apply weekend/holiday pay rates, and visualise your monthly earnings — all stored locally in your browser.<br>By AkihiroLabs.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0-1E3A8A" alt="version 1.1.0">
  <img src="https://img.shields.io/badge/vanilla-JavaScript-00A8CC" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/storage-localStorage-1E3A8A" alt="localStorage">
</p>

---

## Features

- **Multi-job management** — Create jobs with hourly wages, weekend & holiday multipliers, and colour labels
- **Calendar shift entry** — Click any day to log a shift; edit or delete by clicking the event
- **Automatic calculations** — Weekend and Japanese national holiday rates applied automatically
- **Dashboard** — Today / Week / Month / Year / All-Time income at a glance
- **Projection banner** — Estimates month-end earnings based on scheduled shifts
- **Tax calculator** — Toggle 所得税, 住民税, 健康保険, 年金, and 雇用保険 on/off with custom rates
- **Reports** — Filter by year, month, and job; export to PDF, Excel, or CSV
- **Charts** — Monthly income, job distribution, hours worked, gross vs net
- **Dark / Light mode** — Theme persists across sessions
- **100% local** — All data stored in `localStorage`; no server, no account required

---

## Quick Start

```
shiftpay/
├── index.html
├── css/
│   └── main.css
├── js/
│   ├── version.js       App version (APP_VERSION)
│   ├── holidays.js      Japanese public holiday engine
│   ├── storage.js       LocalStorage CRUD layer
│   ├── income.js        Calculation engine (rates, tax, projections)
│   ├── calendar-view.js FullCalendar v6 integration
│   ├── charts-view.js   Chart.js chart renderers
│   ├── reports.js       Report view + PDF/Excel/CSV export
│   ├── modals.js        Modal dialogs + toast notifications
│   └── app.js           Application controller
├── CHANGELOG.md
└── README.md
```

Open `index.html` in any modern browser — no build step required.

Live: **https://akihirozayar.github.io/shiftpay/**

For demo data, go to **Settings → Load Demo** to populate 90 days of sample shifts across three jobs.

---

## Adding Your First Job

1. Click **Jobs** in the sidebar → **Add Job**
2. Enter a job name, company (optional), and base hourly wage in ¥
3. Set weekend and holiday multipliers (defaults: 1.25× and 1.5×)
4. Pick a colour to identify this job on the calendar
5. Click **Save Job**

## Logging a Shift

- **From the calendar:** Navigate to the right month and click any date
- **From the topbar:** Click **+ Add Shift** (the blue button)
- **Editing:** Click any event on the calendar, or any row in the Dashboard's recent list

The shift form shows a live income preview including tax deductions as you type.

## Tax Settings

Go to **Tax** in the sidebar and flip the master **Enable** toggle. Each deduction line can be turned on or off individually and the rate customised. Changes take effect on all income previews immediately.

Default Japanese rates used as starting points:

| Deduction | Default |
|---|---|
| 所得税 Income Tax | 10.21% |
| 住民税 Resident Tax | 10.0% |
| 健康保険 Health Insurance | 4.99% |
| 年金 Pension | 9.15% |
| 雇用保険 Employment Insurance | 0.6% |

> Note: These are simplified flat-rate estimates for budgeting purposes. Actual deductions depend on income brackets, employer type, age, and prefecture.

## Exporting Reports

1. Go to **Reports**
2. Choose a year and optionally a specific month / job
3. Click **Export** → PDF, Excel, or CSV

PDF is landscape A4 with a summary header and full shift table. Excel includes a Summary sheet and a Shifts sheet. CSV is UTF-8 with BOM for direct Excel opening.

## Data Backup

Go to **Settings → Export JSON** to download a full backup of all your data. Import it later (on the same or a different device) via **Import JSON**.

---

## Libraries Used (CDN)

| Library | Version | Purpose |
|---|---|---|
| FullCalendar | 6.1.11 | Calendar UI |
| Chart.js | 4.4.3 | Charts |
| jsPDF + autotable | 2.5.1 / 3.8.2 | PDF export |
| SheetJS (xlsx) | 0.18.5 | Excel export |
| Google Fonts | — | Inter + JetBrains Mono |

No npm, no build toolchain — all dependencies load from CDN.

---

## Browser Support

Works in any modern browser with ES6+ and `localStorage` support (Chrome, Firefox, Safari, Edge). Tested on desktop and mobile.

---

## 🔖 Versioning

This project uses [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

- The version lives in **`js/version.js`** (`APP_VERSION`) and is shown in **Settings → About**.
- To release: bump the version, add an entry to [`CHANGELOG.md`](CHANGELOG.md), then create a GitHub Release tagged `vX.Y.Z`.

Current version: **v1.1.0** — see the [changelog](CHANGELOG.md).

## 💬 Community

Updates and feedback on the **AkihiroLabs Discord server**.

---

<p align="center">
  Built with 🦝 by <b>AkihiroLabs</b>
</p>
