# Changelog

All notable changes to **ShiftPay** are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [1.7.0] — 2026-10-26

- **English / 日本語.** Settings → *Appearance* → *Language*. The whole app (menus, forms, messages, calendar, reminders) switches instantly; your choice is saved on this device, and the first visit follows your phone's language. Exported reports (PDF, Excel, CSV) stay in English.
- **Edit repeating shifts.** Tap a pattern in *Jobs → Repeating shifts* to change its name, job, times, break or days. *Delete* is now inside that form. Editing a pattern does not change shifts already on your calendar — the next *Fill* uses the new times.
- **Undo after Fill.** The "13 shifts added" message has an *Undo* button that removes exactly the shifts that Fill just added.
- Filled shifts no longer get the automatic "(from template: …)" note.
- **Sign-in with a 6-digit code.** The sign-in email now always contains a code (sent from byte@akihirolabs.com). Settings → *Account & sync* explains the code step, and you can send a new code if the first one doesn't arrive.
- Service worker cache bumped to `shiftpay-v4` so installed apps update.

## [1.6.0] — 2026-10-26

- **Optional account & sync.** Settings → *Account & sync*: sign in with your AkihiroLabs account (same as ByteBell) using a one-time email link (or code) — no password. Jobs, shifts, templates, fees, profile and goals then sync across all your devices.
- Your existing data is uploaded on first sign-in; if the same item exists on two devices, the most recently edited copy wins. Deletes sync too.
- Works offline — changes sync when you're back online, when you open the app, and a moment after each edit.
- Without signing in, ShiftPay works exactly as before (data stays on this device). Signing out keeps your data on the device.
- Demo data can't be loaded while signed in (it would replace the shifts in your account).

## [1.5.0] — 2026-10-26

- **Shift reminders (Web Push).** Settings → *Shift reminders*: get a notification 15 min – 2 hours before each upcoming shift, even when ShiftPay is closed. No account needed. On iPhone, add ShiftPay to the Home Screen first.
- Reminders re-sync automatically whenever you add, edit or delete a shift.
- **Installable app (PWA)** with offline support; an *Install* row appears in Settings when your browser supports it.
- Now hosted on Cloudflare at **https://pay.akihirolabs.com** (moved from GitHub Pages).

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
