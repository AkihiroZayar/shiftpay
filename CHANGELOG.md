# Changelog

All notable changes to **ShiftPay** are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [1.4.0] — 2026-09-30

- **Late night (深夜手当) is now counted by the hour.** Only the time between 22:00 and 05:00 gets +25%. Example: 18:00–24:00 → 4h normal + 2h late night (before, the whole shift got +25%).
- **Late night: Auto / Manual.** Auto (default) works it out from your start and end time. Manual lets you type the late-night hours yourself.
- Breaks come out of normal hours first. Late-night hours are only reduced if the break is longer than the normal part of the shift.
- The Add shift preview now shows the late-night hours and the extra pay (🌙).
- **Break now defaults to 0 min** (was 60) for new shifts and repeating shifts. You can still change it anytime.
- Added a **Join our Discord** banner (Settings) and link (sidebar) for the AkihiroLabs Discord server. The link is set in `js/version.js` (`DISCORD_URL`).
- Note: shifts saved before v1.4 are recalculated with Auto late night. Shifts that crossed 22:00 now get late-night pay for those hours only.

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
