<p align="center">
  <img src="app-icon.png" alt="ShiftPay logo" width="112">
</p>

<h1 align="center">ShiftPay — Work Income Tracker</h1>

<p align="center">
  A minimalist, calendar-based income tracker for part-time workers in Japan. Track shifts across multiple jobs, automatically apply weekend/holiday pay rates, and visualise your monthly earnings — all stored locally in your browser.<br>By AkihiroLabs.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0-1E3A8A" alt="version 1.3.0">
  <img src="https://img.shields.io/badge/vanilla-JavaScript-00A8CC" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/storage-localStorage-1E3A8A" alt="localStorage">
</p>

---

## Features

- **Multi-job management** — Create jobs with hourly wages, weekend & holiday multipliers, and colour labels
- **Calendar shift entry** — Click any day to log a shift; edit or delete by clicking the event
- **Automatic calculations** — Weekend and Japanese national holiday rates applied automatically
- **Home** — One big number for this Week / Month / Year, take-home pay, monthly goal and 年収の壁 (yearly limit) progress
- **Repeating shifts** — Save a weekly pattern and fill a whole month in one tap
- **Tax & fees** — Monthly amounts for 所得税, 住民税, 健康保険, 年金, 雇用保険, transport and custom fees
- **Export** — Filter by year, month, and job; export to PDF, Excel, or CSV
- **Details** — Income by job and an income chart, folded away until you need them
- **Light / Dark mode** — AkihiroLabs light theme by default; dark mode in Settings
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
├── app-icon.png        # App logo (README, 512px)
├── favicon.png · apple-touch-icon.png · icon-192.png · icon-512.png
├── CHANGELOG.md
└── README.md
```

Open `index.html` in any modern browser — no build step required.

Live: **https://akihirozayar.github.io/shiftpay/**

For demo data, go to **Settings → Data → Load demo** to populate 90 days of sample shifts across three jobs.

---

## Adding Your First Job

1. Open **Jobs** → **+ Add job**
2. Enter a job name, company (optional), and base hourly wage in ¥
3. Optional: open **Weekend & holiday pay** to change the multipliers (defaults: 1.25× and 1.5×)
4. Pick a colour to identify this job on the calendar
5. Click **Save**

## Logging a Shift

- **From the calendar:** Navigate to the right month and click any date
- **Anywhere:** Click **+ Add shift** (top right on desktop, the round **+** on phones)
- **Saved pattern:** Pick one under **Use a saved shift** to fill job and times
- **Editing:** Click any event on the calendar, or any row in Home's recent list

The shift form shows the estimated pay as you type. Overtime, late night, custom rate and notes are under **More options**.

**Late night (深夜手当):** by default ShiftPay adds +25% only for the hours between 22:00 and 05:00 (e.g. 18:00–24:00 → 2h late night). Switch to **Manual** under More options to type the late-night hours yourself. Break defaults to 0 min.

## Tax Settings

Go to **Settings → Tax & fees** and turn on the switch. Turn on each line you pay and enter the monthly amount (check your 給与明細). Home then shows your take-home pay for the month.

> Note: These are simple monthly estimates for budgeting. Actual deductions depend on income, employer, age, and prefecture.

## Yearly Limit (年収の壁)

Go to **Settings → Profile & goals** and set your yearly limit, or tap a preset (123万 / 130万 / 150万 / 160万). Home shows how much of it you have used this calendar year and warns you as you get close. The rules change often, so check the limit that applies to you.

## Exporting Reports

1. Go to **Settings → Export report**
2. Choose a year and optionally a specific month / job
3. Click **PDF**, **Excel**, or **CSV**

PDF is landscape A4 with a summary header and full shift table. Excel includes a Summary sheet and a Shifts sheet. CSV is UTF-8 with BOM for direct Excel opening.

## Data Backup

Go to **Settings → Data → Export** to download a backup of your jobs, shifts and fees. Restore it later (on the same or a different device) with **Import**.

---

## Libraries Used (CDN)

| Library | Version | Purpose |
|---|---|---|
| FullCalendar | 6.1.11 | Calendar UI |
| Chart.js | 4.4.3 | Charts |
| jsPDF + autotable | 2.5.1 / 3.8.2 | PDF export |
| SheetJS (xlsx) | 0.18.5 | Excel export |
| Google Fonts | — | Inter |

No npm, no build toolchain — all dependencies load from CDN.

---

## Browser Support

Works in any modern browser with ES6+ and `localStorage` support (Chrome, Firefox, Safari, Edge). Tested on desktop and mobile.

---

## 🔖 Versioning

This project uses [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`).

- The version lives in **`js/version.js`** (`APP_VERSION`) and is shown in **Settings → About**.
- To release: bump the version, add an entry to [`CHANGELOG.md`](CHANGELOG.md), then create a GitHub Release tagged `vX.Y.Z`.

Current version: **v1.3.0** — see the [changelog](CHANGELOG.md).

## 💬 Community

Updates and feedback on the **AkihiroLabs Discord server**.

---

<p align="center">
  Built with 🦝 by <b>AkihiroLabs</b>
</p>
