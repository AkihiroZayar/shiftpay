/*!
 * AkihiroLabs — ShiftPay — UI language (English / 日本語)
 * https://github.com/AkihiroZayar/shiftpay
 *
 * HTML:  data-i18n="key" (text) · data-i18n-html="key" · data-i18n-ph="key" (placeholder)
 *        data-i18n-aria="key" (aria-label) · data-i18n-title="key"
 * JS:    I18n.t('key', { n: 3 })  — values are strings with {placeholders} or functions.
 * The choice is saved per device (localStorage "sp_lang"), first visit follows the browser.
 */
const I18n = (() => {
  const KEY = 'sp_lang';
  const s = (n, one, many) => (n === 1 ? one : many);

  const DICT = {
    en: {
      /* Navigation */
      'nav.home': 'Home', 'nav.calendar': 'Calendar', 'nav.jobs': 'Jobs', 'nav.settings': 'Settings',
      'discord.mini': '💬 Join our Discord',
      'addShift': 'Add shift',
      'hi': 'Hi, {name}',

      /* Common */
      'save': 'Save', 'cancel': 'Cancel', 'delete': 'Delete', 'close': 'Close', 'add': 'Add', 'remove': 'Remove',
      'saved': 'Saved.', 'deleted': 'Deleted.', 'undo': 'Undo', 'optional': '(optional)', 'off': 'Off',
      'perHour': '/hr', 'perMonth': '/month', 'previous': 'Previous', 'next': 'Next', 'confirm.title': 'Are you sure?',
      'shifts': v => `${v.n} ${s(v.n, 'shift', 'shifts')}`,
      'jobsN': v => `${v.n} ${s(v.n, 'job', 'jobs')}`,
      'hours': v => (v.m ? `${v.h}h ${v.m}m` : `${v.h}h`),
      'dow': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

      /* Home */
      'home.welcomeTitle': 'Welcome to ShiftPay',
      'home.welcomeText': 'Start by adding a job with your hourly wage.',
      'home.addJob': 'Add a job',
      'home.noShiftsTitle': 'No shifts yet',
      'home.noShiftsText': 'Add your first shift and your earnings will show up here.',
      'home.addFirstShift': 'Add your first shift',
      'period.label': 'Period', 'period.week': 'Week', 'period.month': 'Month', 'period.year': 'Year',
      'home.thisWeek': 'This week · {a} – {b}',
      'home.takeHome': 'Take-home ≈ <strong>{net}</strong> after {ded} tax &amp; fees',
      'home.includes': v => `Includes ${v.amt} from ${v.n} upcoming ${s(v.n, 'shift', 'shifts')}`,
      'home.recent': 'Recent shifts', 'home.calendarLink': 'Calendar →',
      'home.details': 'Details', 'home.byJob': 'By job', 'home.income': 'Income',
      'home.next': 'Next', 'home.noPast': 'No past shifts yet.', 'home.noPeriod': 'No shifts in this period.',
      'goal.monthly': 'Monthly goal', 'goal.reached': 'Goal reached 🎉', 'goal.toGo': '{amt} to go',
      'limit.over': 'Over by {amt}', 'limit.left': '{amt} left this year',
      'chart.noData': 'No data for this period',

      /* Calendar */
      'cal.today': 'Today', 'cal.month': 'Month', 'cal.list': 'List',
      'cal.noEvents': 'No shifts this month',
      'cal.empty': 'No shifts this month — tap a day to add one.',

      /* Jobs */
      'jobs.title': 'Your jobs', 'jobs.add': '+ Add job',
      'jobs.empty': 'No jobs yet. Add one with your hourly wage to start tracking.',
      'jobs.addFirst': 'Add your first job', 'jobs.earned': '{amt} earned',
      'jobs.addFirstToast': 'Add a job first.',
      'jobs.addFirstShift': 'Add a job first — then you can log shifts.',

      /* Repeating shifts */
      'tpl.title': 'Repeating shifts', 'tpl.new': '+ New',
      'tpl.hint': 'Save a weekly pattern once, then fill a whole month in one tap. Tap a pattern to edit it.',
      'tpl.empty': 'No repeating shifts yet.', 'tpl.noDays': 'No days', 'tpl.deletedJob': 'Deleted job',
      'tpl.fill': 'Fill', 'tpl.month': 'Month', 'tpl.edit': 'Edit',
      'tpl.added': v => `${v.n} ${s(v.n, 'shift', 'shifts')} added.`,
      'tpl.nothing': 'Nothing new to add — those days are already filled.',
      'tpl.undone': v => `Undone — ${v.n} ${s(v.n, 'shift', 'shifts')} removed.`,
      'tpl.deleteTitle': 'Delete repeating shift',
      'tpl.deleteMsg': 'Remove this pattern? Shifts already added stay on your calendar.',
      'tpl.modalNew': 'New repeating shift', 'tpl.modalEdit': 'Edit repeating shift',
      'tpl.name': 'Name', 'tpl.namePh': 'e.g. Weekday evenings', 'tpl.repeatOn': 'Repeat on',
      'tpl.required': 'Name and job are required.',
      'tpl.saved': 'Repeating shift saved.',
      'tpl.updated': 'Updated. The next Fill uses the new times — shifts already added stay as they are.',

      /* Shift modal */
      'shift.addTitle': 'Add shift', 'shift.editTitle': 'Edit shift', 'shift.useSaved': 'Use a saved shift',
      'shift.date': 'Date', 'shift.job': 'Job', 'shift.selectJob': 'Select job…',
      'shift.start': 'Start', 'shift.end': 'End', 'shift.break': 'Break (min)',
      'shift.more': 'More options', 'shift.overtime': 'Overtime ×1.25',
      'shift.lateNight': 'Late night +25%', 'shift.lateMode': 'Late night mode', 'shift.lateHours': 'Late-night hours',
      'shift.auto': 'Auto', 'shift.manual': 'Manual',
      'shift.lateAuto': 'Counted automatically from your start and end time.',
      'shift.lateManual': 'Enter your late-night hours yourself (e.g. 1 or 1.5).',
      'shift.customRate': 'Custom hourly rate (¥)', 'shift.useJobRate': 'Use job rate',
      'shift.notes': 'Notes', 'shift.notesPh': 'Optional',
      'shift.estimated': 'Estimated pay', 'shift.lateLabel': '🌙 Late night',
      'shift.weekday': 'Weekday', 'shift.weekend': 'Weekend rate', 'shift.holiday': 'Holiday rate', 'shift.custom': 'Custom rate',
      'shift.manualSuffix': ' (manual)', 'shift.monthlyDed': 'Monthly deductions',
      'shift.required': 'Please fill in all required fields.',
      'shift.updated': 'Shift updated.', 'shift.saved': 'Shift saved.',
      'shift.deleteTitle': 'Delete shift', 'shift.deleteMsg': 'Remove this shift? This cannot be undone.',
      'shift.deleted': 'Shift deleted.',

      /* Job modal */
      'job.addTitle': 'Add job', 'job.editTitle': 'Edit job',
      'job.name': 'Job name', 'job.namePh': 'e.g. Hall staff',
      'job.company': 'Company', 'job.companyPh': 'e.g. ABC Restaurant',
      'job.wage': 'Hourly wage (¥)', 'job.color': 'Color',
      'job.extraPay': 'Weekend & holiday pay', 'job.weekend': 'Weekend (Sat, Sun)', 'job.holidays': 'National holidays',
      'job.rateMult': '× Rate', 'job.rateFixed': '¥ Fixed',
      'job.fixedLabel': '¥ fixed rate', 'job.multLabel': '×{m} multiplier',
      'job.weekendHint': 'Weekend: {rate}/hr ({label})', 'job.holidayHint': 'Holiday: {rate}/hr ({label})',
      'job.weekendSame': 'Weekend shifts use the same base rate', 'job.holidaySame': 'Holiday shifts use the same base rate',
      'job.off': 'OFF',
      'job.nameReq': 'Job name is required.', 'job.wageReq': 'Please enter a valid hourly wage.',
      'job.updated': 'Job updated.', 'job.added': 'Job added.',
      'job.deleteTitle': 'Delete job',
      'job.deleteMsgShifts': v => `Delete "${v.name}"? This will also remove ${v.n} associated ${s(v.n, 'shift', 'shifts')}. This cannot be undone.`,
      'job.deleteMsg': 'Delete "{name}"? This cannot be undone.',
      'job.deleted': 'Job deleted.',

      /* Settings */
      'set.account': 'Account & sync',
      'set.profile': 'Profile & goals', 'set.name': 'Your name', 'set.namePh': 'e.g. Hiro',
      'set.monthlyGoal': 'Monthly goal', 'set.monthlyGoalHint': 'Shown on Home as a progress bar',
      'set.yearlyLimit': 'Yearly limit (年収の壁)',
      'set.yearlyLimitHint': 'Rules change every year, so check the current limit that applies to you.',
      'set.tax': 'Tax & fees', 'set.taxToggle': 'Enable deductions',
      'set.taxHint': 'Monthly amounts taken from your pay. When on, Home shows your take-home pay.',
      'set.taxAddPh': 'Add a fee, e.g. 自転車代', 'set.taxTotal': 'Total {amt} / month',
      'set.taxPerMonth': '{label} per month',
      'set.feeName': 'Enter a name for the fee.', 'set.feeAdded': 'Fee added.',
      'set.export': 'Export report', 'set.exportHint': 'Reports (PDF, Excel, CSV) are made in English.',
      'set.year': 'Year', 'set.month': 'Month', 'set.wholeYear': 'Whole year', 'set.allJobs': 'All jobs',
      'set.data': 'Data', 'set.backup': 'Backup', 'set.exportBtn': 'Export', 'set.importBtn': 'Import',
      'set.dataStats': '{jobs} · {shifts} · saved in this browser',
      'set.demo': 'Demo data', 'set.demoHint': 'Replaces your data with 90 days of sample shifts', 'set.loadDemo': 'Load demo',
      'set.clear': 'Clear all data', 'set.clearHint': 'Deletes all jobs, shifts and fees', 'set.clearBtn': 'Clear',
      'set.reminders': 'Shift reminders',
      'set.remindHint': 'Get a notification before each upcoming shift — even when ShiftPay is closed.',
      'set.remindMe': 'Remind me',
      'set.lead15': '15 min before', 'set.lead30': '30 min before', 'set.lead60': '1 hour before', 'set.lead120': '2 hours before',
      'set.install': 'Install ShiftPay', 'set.installHint': 'Add it to your home screen like a normal app', 'set.installBtn': 'Install',
      'set.appearance': 'Appearance', 'set.darkMode': 'Dark mode', 'set.language': 'Language',
      'set.discordTitle': 'Join the AkihiroLabs Discord',
      'set.discordSub': 'Updates, feedback and new apps from AkihiroLabs.', 'set.join': 'Join',
      'set.goalSaved': 'Goal saved.', 'set.limitSaved': 'Limit saved.',
      'set.limitSet': 'Limit set to {amt}.', 'set.limitOff': 'Limit turned off.',
      'set.backupDone': 'Backup downloaded.', 'set.restored': 'Backup restored.',
      'set.importFail': 'Import failed — not a ShiftPay backup file.',
      'set.demoSignedIn': 'Sign out first — demo data would replace the shifts in your account.',
      'set.demoTitle': 'Load demo data', 'set.demoMsg': 'This replaces your current jobs and shifts with sample data. Continue?',
      'set.demoLoaded': 'Demo data loaded.',
      'set.clearTitle': 'Clear all data',
      'set.clearMsgSynced': 'Permanently delete all jobs, shifts and fees from your account and ALL your signed-in devices? This cannot be undone.',
      'set.clearMsg': 'Permanently delete all jobs, shifts and fees? This cannot be undone.',
      'set.cleared': 'All data cleared.',

      /* Account & sync */
      'acc.unavailable': 'Account sync is unavailable right now (offline?). ShiftPay still works on this device.',
      'acc.lastSynced': 'Last synced: {when}', 'acc.notYet': 'not yet',
      'acc.syncNow': 'Sync now', 'acc.signOut': 'Sign out', 'acc.syncing': 'Syncing…',
      'acc.signedOut': 'Signed out. Your data stays on this device.', 'acc.syncFailed': 'Sync failed — will retry.',
      'acc.intro': 'Optional. Sign in with your AkihiroLabs account (the same one as ByteBell) to keep your shifts in sync on all your devices. No password — we’ll email you a 6-digit code.',
      'acc.email': 'Email', 'acc.sendCode': 'Send code',
      'acc.codeSent': 'We sent a 6-digit code to <strong>{email}</strong>. Enter it below — check your spam folder if you don’t see it.',
      'acc.code': 'Code', 'acc.signIn': 'Sign in', 'acc.anotherEmail': 'Use another email', 'acc.resend': 'Send a new code',
      'acc.resent': 'New code sent.',
      'acc.signedIn': 'Signed in. Syncing your data…',
      'acc.codeBad': 'That code didn’t work. Check it or send a new one.',
      'acc.tooMany': 'Too many requests — wait a minute and try again.',
      'acc.sendFail': 'Could not send the code. Try again.',

      /* Reminders */
      'push.title': 'Shift in {lead} ⏰', 'push.min': '{n} min',
      'push.hour': v => `${v.n} ${s(v.n, 'hour', 'hours')}`, 'push.shift': 'Shift',
      'push.iosFirst': 'On iPhone, add ShiftPay to your Home Screen first (Share → Add to Home Screen).',
      'push.blocked': 'Notifications are blocked in your browser settings.',
      'push.on': 'Shift reminders on.', 'push.off': 'Shift reminders off.',
      'push.noSupport': 'This browser does not support notifications.',
      'push.iosHint': 'On iPhone: add ShiftPay to your Home Screen (Share → Add to Home Screen), open it from there, then turn this on.',
      'push.blockedHint': 'Notifications are blocked — allow them in your browser settings.',
      'push.fail': 'Could not change reminders. Check your connection.',

      /* Reports */
      'rep.pdfNotReady': 'PDF library not loaded yet, please try again.', 'rep.pdfDone': 'PDF downloaded!',
      'rep.xlsNotReady': 'Excel library not loaded yet, please try again.', 'rep.xlsDone': 'Excel file downloaded!',
      'rep.csvDone': 'CSV downloaded!',
    },

    ja: {
      'nav.home': 'ホーム', 'nav.calendar': 'カレンダー', 'nav.jobs': '仕事', 'nav.settings': '設定',
      'discord.mini': '💬 Discordに参加',
      'addShift': 'シフト追加',
      'hi': 'こんにちは、{name}さん',

      'save': '保存', 'cancel': 'キャンセル', 'delete': '削除', 'close': '閉じる', 'add': '追加', 'remove': '削除',
      'saved': '保存しました。', 'deleted': '削除しました。', 'undo': '元に戻す', 'optional': '（任意）', 'off': 'オフ',
      'perHour': '/時', 'perMonth': '/月', 'previous': '前へ', 'next': '次へ', 'confirm.title': 'よろしいですか？',
      'shifts': 'シフト{n}件',
      'jobsN': '仕事{n}件',
      'hours': v => (v.m ? `${v.h}時間${v.m}分` : `${v.h}時間`),
      'dow': ['日', '月', '火', '水', '木', '金', '土'],

      'home.welcomeTitle': 'ShiftPayへようこそ',
      'home.welcomeText': 'まずは時給を入れて仕事を追加しましょう。',
      'home.addJob': '仕事を追加',
      'home.noShiftsTitle': 'まだシフトがありません',
      'home.noShiftsText': '最初のシフトを追加すると、ここに収入が表示されます。',
      'home.addFirstShift': '最初のシフトを追加',
      'period.label': '期間', 'period.week': '週', 'period.month': '月', 'period.year': '年',
      'home.thisWeek': '今週 · {a}〜{b}',
      'home.takeHome': '手取り ≈ <strong>{net}</strong>（税金・費用 {ded} を引いた額）',
      'home.includes': 'これからのシフト{n}件分（{amt}）を含みます',
      'home.recent': '最近のシフト', 'home.calendarLink': 'カレンダー →',
      'home.details': '詳細', 'home.byJob': '仕事別', 'home.income': '収入',
      'home.next': '次', 'home.noPast': 'まだ過去のシフトはありません。', 'home.noPeriod': 'この期間のシフトはありません。',
      'goal.monthly': '月の目標', 'goal.reached': '目標達成 🎉', 'goal.toGo': 'あと {amt}',
      'limit.over': '{amt} オーバー', 'limit.left': '今年の残り {amt}',
      'chart.noData': 'この期間のデータはありません',

      'cal.today': '今日', 'cal.month': '月', 'cal.list': 'リスト',
      'cal.noEvents': '今月のシフトはありません',
      'cal.empty': '今月のシフトはありません。日付をタップして追加しましょう。',

      'jobs.title': 'あなたの仕事', 'jobs.add': '+ 仕事を追加',
      'jobs.empty': 'まだ仕事がありません。時給を入れて追加しましょう。',
      'jobs.addFirst': '最初の仕事を追加', 'jobs.earned': '収入 {amt}',
      'jobs.addFirstToast': '先に仕事を追加してください。',
      'jobs.addFirstShift': '先に仕事を追加してください。そのあとシフトを記録できます。',

      'tpl.title': '繰り返しシフト', 'tpl.new': '+ 新規',
      'tpl.hint': '週のパターンを一度保存すれば、1タップで1か月分を入力できます。パターンをタップすると編集できます。',
      'tpl.empty': 'まだ繰り返しシフトはありません。', 'tpl.noDays': '曜日なし', 'tpl.deletedJob': '削除された仕事',
      'tpl.fill': '入力', 'tpl.month': '月', 'tpl.edit': '編集',
      'tpl.added': 'シフトを{n}件追加しました。',
      'tpl.nothing': '追加するシフトはありません（その日はすでに入っています）。',
      'tpl.undone': '元に戻しました（シフト{n}件を削除）。',
      'tpl.deleteTitle': '繰り返しシフトを削除',
      'tpl.deleteMsg': 'このパターンを削除しますか？追加済みのシフトはカレンダーに残ります。',
      'tpl.modalNew': '繰り返しシフトを作成', 'tpl.modalEdit': '繰り返しシフトを編集',
      'tpl.name': '名前', 'tpl.namePh': '例：平日の夜', 'tpl.repeatOn': '繰り返す曜日',
      'tpl.required': '名前と仕事を入力してください。',
      'tpl.saved': '繰り返しシフトを保存しました。',
      'tpl.updated': '更新しました。次の「入力」から新しい時間が使われます（追加済みのシフトはそのままです）。',

      'shift.addTitle': 'シフト追加', 'shift.editTitle': 'シフト編集', 'shift.useSaved': '保存したシフトを使う',
      'shift.date': '日付', 'shift.job': '仕事', 'shift.selectJob': '仕事を選択…',
      'shift.start': '開始', 'shift.end': '終了', 'shift.break': '休憩（分）',
      'shift.more': 'その他の設定', 'shift.overtime': '残業 ×1.25',
      'shift.lateNight': '深夜 +25%', 'shift.lateMode': '深夜の計算方法', 'shift.lateHours': '深夜の時間',
      'shift.auto': '自動', 'shift.manual': '手動',
      'shift.lateAuto': '開始・終了時間から自動で計算します。',
      'shift.lateManual': '深夜の時間を自分で入力します（例：1 や 1.5）。',
      'shift.customRate': 'この日の時給（円）', 'shift.useJobRate': '仕事の時給を使う',
      'shift.notes': 'メモ', 'shift.notesPh': '任意',
      'shift.estimated': '見込みの給料', 'shift.lateLabel': '🌙 深夜',
      'shift.weekday': '平日', 'shift.weekend': '土日レート', 'shift.holiday': '祝日レート', 'shift.custom': 'カスタム時給',
      'shift.manualSuffix': '（手動）', 'shift.monthlyDed': '毎月の控除',
      'shift.required': '必須項目を入力してください。',
      'shift.updated': 'シフトを更新しました。', 'shift.saved': 'シフトを保存しました。',
      'shift.deleteTitle': 'シフトを削除', 'shift.deleteMsg': 'このシフトを削除しますか？元に戻せません。',
      'shift.deleted': 'シフトを削除しました。',

      'job.addTitle': '仕事を追加', 'job.editTitle': '仕事を編集',
      'job.name': '仕事名', 'job.namePh': '例：ホールスタッフ',
      'job.company': '会社・お店', 'job.companyPh': '例：ABCレストラン',
      'job.wage': '時給（円）', 'job.color': '色',
      'job.extraPay': '土日・祝日の時給', 'job.weekend': '土日', 'job.holidays': '祝日',
      'job.rateMult': '× 倍率', 'job.rateFixed': '¥ 固定',
      'job.fixedLabel': '固定時給', 'job.multLabel': '×{m}倍',
      'job.weekendHint': '土日：{rate}/時（{label}）', 'job.holidayHint': '祝日：{rate}/時（{label}）',
      'job.weekendSame': '土日も通常の時給で計算します', 'job.holidaySame': '祝日も通常の時給で計算します',
      'job.off': 'オフ',
      'job.nameReq': '仕事名を入力してください。', 'job.wageReq': '正しい時給を入力してください。',
      'job.updated': '仕事を更新しました。', 'job.added': '仕事を追加しました。',
      'job.deleteTitle': '仕事を削除',
      'job.deleteMsgShifts': '「{name}」を削除しますか？関連するシフト{n}件も削除されます。元に戻せません。',
      'job.deleteMsg': '「{name}」を削除しますか？元に戻せません。',
      'job.deleted': '仕事を削除しました。',

      'set.account': 'アカウントと同期',
      'set.profile': 'プロフィールと目標', 'set.name': '名前', 'set.namePh': '例：ヒロ',
      'set.monthlyGoal': '月の目標', 'set.monthlyGoalHint': 'ホームに進み具合のバーで表示されます',
      'set.yearlyLimit': '年収の壁',
      'set.yearlyLimitHint': '制度は毎年変わるので、自分に当てはまる最新の金額を確認してください。',
      'set.tax': '税金・費用', 'set.taxToggle': '控除をオンにする',
      'set.taxHint': '毎月給料から引かれる金額です。オンにすると、ホームに手取りが表示されます。',
      'set.taxAddPh': '費用を追加（例：自転車代）', 'set.taxTotal': '合計 {amt} / 月',
      'set.taxPerMonth': '{label}（月額）',
      'set.feeName': '費用の名前を入力してください。', 'set.feeAdded': '費用を追加しました。',
      'set.export': 'レポートを書き出す', 'set.exportHint': 'レポート（PDF・Excel・CSV）は英語で作成されます。',
      'set.year': '年', 'set.month': '月', 'set.wholeYear': '1年分', 'set.allJobs': 'すべての仕事',
      'set.data': 'データ', 'set.backup': 'バックアップ', 'set.exportBtn': '書き出し', 'set.importBtn': '読み込み',
      'set.dataStats': '{jobs} · {shifts} · このブラウザに保存',
      'set.demo': 'デモデータ', 'set.demoHint': 'データを90日分のサンプルシフトに置き換えます', 'set.loadDemo': 'デモを読み込む',
      'set.clear': 'すべてのデータを削除', 'set.clearHint': '仕事・シフト・費用をすべて削除します', 'set.clearBtn': '削除',
      'set.reminders': 'シフトのリマインダー',
      'set.remindHint': 'シフトの前に通知が届きます（ShiftPayを閉じていても届きます）。',
      'set.remindMe': '通知のタイミング',
      'set.lead15': '15分前', 'set.lead30': '30分前', 'set.lead60': '1時間前', 'set.lead120': '2時間前',
      'set.install': 'ShiftPayをインストール', 'set.installHint': 'ホーム画面に追加して、アプリのように使えます', 'set.installBtn': 'インストール',
      'set.appearance': '表示', 'set.darkMode': 'ダークモード', 'set.language': '言語',
      'set.discordTitle': 'AkihiroLabsのDiscordに参加',
      'set.discordSub': 'AkihiroLabsの最新情報・フィードバック・新しいアプリ', 'set.join': '参加',
      'set.goalSaved': '目標を保存しました。', 'set.limitSaved': '上限を保存しました。',
      'set.limitSet': '上限を{amt}に設定しました。', 'set.limitOff': '上限をオフにしました。',
      'set.backupDone': 'バックアップをダウンロードしました。', 'set.restored': 'バックアップを復元しました。',
      'set.importFail': '読み込めませんでした（ShiftPayのバックアップファイルではありません）。',
      'set.demoSignedIn': '先にサインアウトしてください（デモデータがアカウントのシフトを置き換えてしまいます）。',
      'set.demoTitle': 'デモデータを読み込む', 'set.demoMsg': '今の仕事とシフトがサンプルデータに置き換わります。続けますか？',
      'set.demoLoaded': 'デモデータを読み込みました。',
      'set.clearTitle': 'すべてのデータを削除',
      'set.clearMsgSynced': '仕事・シフト・費用を、アカウントとサインイン中のすべての端末から完全に削除しますか？元に戻せません。',
      'set.clearMsg': '仕事・シフト・費用をすべて完全に削除しますか？元に戻せません。',
      'set.cleared': 'すべてのデータを削除しました。',

      'acc.unavailable': '今はアカウント同期を使えません（オフライン？）。この端末ではそのまま使えます。',
      'acc.lastSynced': '最終同期：{when}', 'acc.notYet': 'まだ',
      'acc.syncNow': '今すぐ同期', 'acc.signOut': 'サインアウト', 'acc.syncing': '同期中…',
      'acc.signedOut': 'サインアウトしました。データはこの端末に残ります。', 'acc.syncFailed': '同期に失敗しました。あとで再試行します。',
      'acc.intro': '任意です。AkihiroLabsアカウント（ByteBellと同じ）でサインインすると、すべての端末でシフトが同期されます。パスワードは不要で、6桁のコードをメールでお送りします。',
      'acc.email': 'メールアドレス', 'acc.sendCode': 'コードを送信',
      'acc.codeSent': '<strong>{email}</strong> に6桁のコードを送りました。下に入力してください。届かない場合は迷惑メールフォルダも確認してください。',
      'acc.code': 'コード', 'acc.signIn': 'サインイン', 'acc.anotherEmail': '別のメールを使う', 'acc.resend': 'コードを再送',
      'acc.resent': '新しいコードを送りました。',
      'acc.signedIn': 'サインインしました。データを同期しています…',
      'acc.codeBad': 'コードが正しくありません。確認するか、新しいコードを送ってください。',
      'acc.tooMany': 'リクエストが多すぎます。1分ほど待ってからもう一度お試しください。',
      'acc.sendFail': 'コードを送信できませんでした。もう一度お試しください。',

      'push.title': '{lead}後にシフト ⏰', 'push.min': '{n}分', 'push.hour': '{n}時間', 'push.shift': 'シフト',
      'push.iosFirst': 'iPhoneでは、先にShiftPayをホーム画面に追加してください（共有 → ホーム画面に追加）。',
      'push.blocked': 'ブラウザの設定で通知がブロックされています。',
      'push.on': 'リマインダーをオンにしました。', 'push.off': 'リマインダーをオフにしました。',
      'push.noSupport': 'このブラウザは通知に対応していません。',
      'push.iosHint': 'iPhoneの場合：ShiftPayをホーム画面に追加し（共有 → ホーム画面に追加）、そこから開いてからオンにしてください。',
      'push.blockedHint': '通知がブロックされています。ブラウザの設定で許可してください。',
      'push.fail': 'リマインダーを変更できませんでした。接続を確認してください。',

      'rep.pdfNotReady': 'PDFの準備ができていません。もう一度お試しください。', 'rep.pdfDone': 'PDFをダウンロードしました。',
      'rep.xlsNotReady': 'Excelの準備ができていません。もう一度お試しください。', 'rep.xlsDone': 'Excelファイルをダウンロードしました。',
      'rep.csvDone': 'CSVをダウンロードしました。',
    },
  };

  let lang = 'en';
  try {
    const saved = localStorage.getItem(KEY);
    lang = saved === 'ja' || saved === 'en' ? saved
      : ((navigator.language || '').toLowerCase().startsWith('ja') ? 'ja' : 'en');
  } catch { /* storage blocked — keep English */ }

  function t(key, vars = {}) {
    let v = DICT[lang][key];
    if (v === undefined) v = DICT.en[key];
    if (v === undefined) return key;
    if (typeof v === 'function') return v(vars);
    if (typeof v !== 'string') return v;
    return v.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  }

  /* Fill every tagged element under root */
  function apply(root = document) {
    document.documentElement.lang = lang;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    root.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  }

  function setLang(next) {
    if (next !== 'en' && next !== 'ja') return;
    lang = next;
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    apply();
    window.dispatchEvent(new CustomEvent('sp:lang', { detail: next }));
  }

  return {
    t, apply, setLang,
    get lang() { return lang; },
    /* Intl locale for dates and month names */
    get locale() { return lang === 'ja' ? 'ja-JP' : 'en-US'; },
  };
})();
