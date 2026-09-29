# Changelog

All notable changes to **ShiftPay** are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [1.3.0] — 2026-09-29

- New app logo in the AkihiroLabs family style (navy base, white symbol, green accent): `app-icon.png`, `favicon.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`.
- The page now has a favicon and a home-screen icon.

## [1.2.0] — 2026-09-28

Minimalist redesign — same data, cleaner layout.

- **Navigation:** 7 pages → 4 (Home, Calendar, Jobs, Settings). On phones, a bottom tab bar with a big **+** button replaces the sidebar.
- **Home:** one big number with a Week / Month / Year switch, take-home pay (when tax & fees are on), monthly goal bar, and a new **年収の壁 (yearly limit)** bar. Recent shifts are a plain list with the next shift on top. Charts and per-job totals are folded under **Details**.
- **Settings:** now holds Profile & goals, Tax & fees, report export (PDF / Excel / CSV), backup, and dark mode.
- **Jobs:** job list plus **Repeating shifts** (formerly Templates). Saved patterns can also be picked in the Add shift form.
- **Add shift form:** only date, job and times up front; overtime, late night, custom rate and notes moved under "More options".
- **Look:** AkihiroLabs light theme by default (white, navy #1E3A8A, charcoal text), one font, no heavy cards. Dark mode still available.
- **Fixed:** calendar month summary showed next month's numbers.
- **Fixed:** Overtime / Late night was not saved on newly added shifts.
- Removed the unused 給与明細 button (it had no function yet).
- Your saved data (`localStorage`) is untouched. If you had chosen dark mode, it stays dark.

## [1.1.0] — 2026-09-28

- Moved styles into `css/` and scripts into `js/` (matches the structure in the README).
- Added `js/version.js`, `CHANGELOG.md` and AkihiroLabs branding to the README.
- Repository renamed from `ShiftPay` to `shiftpay`.
- No feature or behavior changes. Your saved data (`localStorage`) is untouched.

## [1.0.0]

- First release: multi-job shifts, calendar, weekend/holiday rates, dashboard, tax calculator, reports with PDF/Excel/CSV export, charts, dark/light mode, JSON backup.
