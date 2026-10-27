/*!
 * AkihiroLabs — ShiftPay — About & How to use (English / 日本語 / မြန်မာ)
 * https://github.com/AkihiroZayar/shiftpay
 * Shown in Settings. The reader picks the language with the tabs; it doesn't change the app language.
 */
const ShiftHelp = (() => {
  const TEXT = {
    en: {
      aboutTitle: 'About',
      about: [
        'ShiftPay is a work income and time management app for part-time workers in Japan, made by AkihiroLabs.',
        'Users’ data is saved only on this phone or computer. If you sign in with an account, your data syncs across all your devices.',
        'Questions or ideas? Tell us on the AkihiroLabs Discord.',
      ],
      howTitle: 'How to use',
      steps: [
        ['Add a job', 'In “Jobs”, enter the job name and hourly wage. You can also set rates for Saturdays, Sundays and national holidays.'],
        ['Add a shift', 'Tap “+” and enter the date, start and end time and break. Late-night pay (+25%, 22:00–05:00) is calculated automatically.'],
        ['Repeating shifts', 'Save a weekly pattern once in “Repeating shifts”, then tap “Fill” to add a whole month at once. Tap a pattern to edit it.'],
        ['See your income', '“Home” shows your income by week, month and year. Set a monthly goal and your 年収の壁 (yearly income limit) in “Settings”.'],
        ['Tax & fees', 'Add monthly tax, insurance and travel costs to see your take-home pay (手取り).'],
        ['Reminders', 'Turn on “Settings → Shift reminders” to get a notification before each shift. On iPhone, add ShiftPay to your Home Screen first (Share → Add to Home Screen).'],
        ['Sync between devices', 'In “Settings → Account & sync”, enter your email and type the 6-digit code you receive.'],
        ['Reports & backup', 'Export to PDF, Excel or CSV, and save a backup of your data.'],
      ],
      note: 'Note: The notification system is still in testing.',
      version: 'Version',
    },
    ja: {
      aboutTitle: 'アプリについて',
      about: [
        'ShiftPayは、日本でアルバイトをする人のための、収入と時間を管理するアプリです。AkihiroLabsが作りました。',
        '利用者のデータは、この端末（スマホ・パソコン）にだけ保存されます。アカウントでサインインすると、すべての端末でデータを同期できます。',
        '質問や要望があれば、AkihiroLabsのDiscordで教えてください。',
      ],
      howTitle: '使い方',
      steps: [
        ['仕事を追加', '「仕事」で仕事名と時給を入力します。土日・祝日の時給も設定できます。'],
        ['シフトを追加', '「＋」をタップして、日付・開始・終了・休憩を入力します。深夜（22:00〜05:00）の+25%は自動で計算されます。'],
        ['繰り返しシフト', '毎週同じシフトを「繰り返しシフト」に一度保存し、「入力」をタップすると1か月分をまとめて追加できます。編集するにはパターンをタップします。'],
        ['収入を見る', '「ホーム」で週・月・年ごとの収入を確認できます。月の目標と年収の壁は「設定」で決められます。'],
        ['税金・費用', '毎月引かれる税金・保険・交通費を入力すると、手取りが表示されます。'],
        ['リマインダー', '「設定 → シフトのリマインダー」をオンにすると、シフトの前に通知が届きます。iPhoneでは、先にShiftPayをホーム画面に追加してください（共有 → ホーム画面に追加）。'],
        ['端末間の同期', '「設定 → アカウントと同期」でメールアドレスを入力し、届いた6桁のコードを入力します。'],
        ['レポートとバックアップ', 'PDF・Excel・CSVで書き出したり、データのバックアップを保存したりできます。'],
      ],
      note: '※ 通知機能はテスト中です。',
      version: 'バージョン',
    },
    my: {
      aboutTitle: 'အကြောင်း',
      about: [
        'ShiftPay သည် ဂျပန်နိုင်ငံရှိ အချိန်ပိုင်း (part-time) အလုပ်လုပ်သူများအတွက် ဝင်ငွေ နဲ့ အချိန် စီမံခန့်ခွဲသည့် app ဖြစ်ပါသည်။ AkihiroLabs မှ ပြုလုပ်ထားပါသည်။',
        'အသုံးပြုသူ၏ ဒေတာများကို ဤဖုန်း သို့မဟုတ် ကွန်ပျူတာထဲတွင်သာ သိမ်းဆည်းထားပါသည်။ အကောင့်ဖြင့် ဝင်ရောက်ပါက စက်အားလုံးတွင် ဒေတာများကို sync လုပ်နိုင်ပါသည်။',
        'မေးခွန်း သို့မဟုတ် အကြံပြုချက်များရှိပါက AkihiroLabs Discord တွင် ပြောပြပေးပါ။',
      ],
      howTitle: 'အသုံးပြုနည်း',
      steps: [
        ['အလုပ်ထည့်ပါ', '“Jobs” တွင် အလုပ်အမည်နှင့် တစ်နာရီလုပ်ခကို ထည့်ပါ။ စနေ၊ တနင်္ဂနွေနှင့် ရုံးပိတ်ရက်များအတွက် လုပ်ခနှုန်းကိုလည်း သတ်မှတ်နိုင်ပါသည်။'],
        ['Shift ထည့်ပါ', '“+” ခလုတ်ကိုနှိပ်ပြီး ရက်စွဲ၊ စချိန်၊ ပြီးချိန်နှင့် နားချိန်ကို ထည့်ပါ။ ညဉ့်နက်ချိန် (22:00–05:00) အတွက် +25% ကို အလိုအလျောက် တွက်ပေးပါသည်။'],
        ['ထပ်ခါထပ်ခါ shift များ', 'အပတ်စဉ် တူညီသော shift များကို “Repeating shifts” တွင် တစ်ကြိမ်သိမ်းထားပြီး “Fill” ကိုနှိပ်ကာ တစ်လစာကို တစ်ခါတည်း ထည့်နိုင်ပါသည်။ ပြင်ဆင်လိုပါက ပုံစံကို နှိပ်ပါ။'],
        ['ဝင်ငွေကြည့်ရန်', '“Home” တွင် အပတ်၊ လ၊ နှစ်အလိုက် ဝင်ငွေကို ကြည့်နိုင်ပါသည်။ လစဉ်ပန်းတိုင်နှင့် 年収の壁 (တစ်နှစ်ဝင်ငွေ ကန့်သတ်ချက်) ကို “Settings” တွင် သတ်မှတ်နိုင်ပါသည်။'],
        ['အခွန်နှင့် ကုန်ကျစရိတ်', 'လစဉ်နုတ်ယူမည့် အခွန်၊ အာမခံ၊ ခရီးစရိတ်များကို ထည့်ပါက လက်ထဲရမည့်ငွေ (手取り) ကို ပြပေးပါသည်။'],
        ['သတိပေးချက်', '“Settings → Shift reminders” ကိုဖွင့်ပါက shift မစမီ အသိပေးချက် ရောက်လာပါမည်။ iPhone တွင် ShiftPay ကို Home Screen သို့ အရင်ထည့်ပါ (Share → Add to Home Screen)။'],
        ['စက်များအကြား Sync', '“Settings → Account & sync” တွင် email ထည့်ပြီး ရရှိလာသော ဂဏန်း ၆ လုံးကုဒ်ကို ရိုက်ထည့်ပါ။'],
        ['Report နှင့် Backup', 'PDF၊ Excel၊ CSV ဖြင့် ထုတ်ယူနိုင်ပြီး ဒေတာ backup ကိုလည်း သိမ်းထားနိုင်ပါသည်။'],
      ],
      note: 'အသိပေးချက်စနစ်သည် စမ်းသပ်ဆဲ စနစ်ဖြစ်သည်။',
      version: 'ဗားရှင်း',
    },
  };

  let current = null;   // null = follow the app language
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function render() {
    const box = document.getElementById('helpBody');
    if (!box) return;
    const lang = current || (typeof I18n !== 'undefined' ? I18n.lang : 'en');
    const t = TEXT[lang] || TEXT.en;
    const ver = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '';

    document.querySelectorAll('#helpLang [data-help-lang]').forEach(b =>
      b.classList.toggle('active', b.dataset.helpLang === lang));
    box.lang = lang === 'my' ? 'my' : lang;
    box.classList.toggle('help-my', lang === 'my');
    box.innerHTML = `
      <h3 class="help-head">${esc(t.aboutTitle)}</h3>
      ${t.about.map(p => `<p class="help-p">${esc(p)}</p>`).join('')}
      <h3 class="help-head">${esc(t.howTitle)}</h3>
      <ol class="help-steps">
        ${t.steps.map(([title, text]) => `<li><strong>${esc(title)}</strong><span>${esc(text)}</span></li>`).join('')}
      </ol>
      <p class="help-note">${esc(t.note)}</p>
      <p class="help-ver">${esc(t.version)} ${esc(ver)} · 🦝 AkihiroLabs</p>`;
  }

  function init() {
    document.querySelectorAll('#helpLang [data-help-lang]').forEach(b =>
      b.addEventListener('click', () => { current = b.dataset.helpLang; render(); }));
    // When the app language changes, the help follows it (until the reader picks a tab again)
    window.addEventListener('sp:lang', () => { current = null; render(); });
    render();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  return { render };
})();
