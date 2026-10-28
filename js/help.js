/*!
 * AkihiroLabs — ShiftPay — About & How to use (English / 日本語 / မြန်မာ)
 * https://github.com/AkihiroZayar/shiftpay
 * Opens from Settings → About & how to use as its own window, with About / How to use / What's new tabs.
 * The reader picks the language with the tabs; it doesn't change the app language.
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
      tabs: { about: 'About', how: 'How to use', new: 'What’s new' },
      news: [
        ['1.9.0', [
          'Settings is shorter — each section opens with a tap.',
          'About & how to use opens in its own window, with this What’s new tab.',
          'The top of Settings shows where your data is saved.',
          'The real AkihiroLabs Byte raccoon logo.',
        ]],
        ['1.8.0', [
          'When a new version is ready, a card with a “Restart now” button appears.',
          'About & how to use in English, 日本語 and မြန်မာ.',
        ]],
        ['1.7.0', [
          'The app can be used in English or 日本語.',
          'Repeating shifts can be edited.',
          'Undo right after “Fill”.',
          'Sign in with a 6-digit code.',
        ]],
      ],
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
      tabs: { about: 'アプリについて', how: '使い方', new: '新機能' },
      news: [
        ['1.9.0', [
          '設定画面を短くしました。各項目はタップすると開きます。',
          '「アプリについて・使い方」が別ウィンドウで開き、この「新機能」タブを追加しました。',
          '設定の一番上に、データの保存場所を表示します。',
          'AkihiroLabsのアライグマ「Byte」のロゴを使うようにしました。',
        ]],
        ['1.8.0', [
          '新しいバージョンが出ると、「今すぐ再起動」ボタン付きのお知らせが表示されます。',
          '「アプリについて・使い方」を英語・日本語・ミャンマー語で追加しました。',
        ]],
        ['1.7.0', [
          'アプリを英語と日本語で使えるようになりました。',
          '繰り返しシフトを編集できるようになりました。',
          '「入力」のすぐ後に「元に戻す」ができます。',
          '6桁のコードでサインインできます。',
        ]],
      ],
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
      tabs: { about: 'အကြောင်း', how: 'အသုံးပြုနည်း', new: 'အပ်ဒိတ်အသစ်များ' },
      news: [
        ['1.9.0', [
          'Settings စာမျက်နှာကို တိုစေထားပါသည်။ အပိုင်းတစ်ခုချင်းစီကို နှိပ်မှ ဖွင့်ပြပါသည်။',
          '“အကြောင်းနှင့် အသုံးပြုနည်း” ကို သီးသန့် window ဖြင့် ဖွင့်ပြပြီး “အပ်ဒိတ်အသစ်များ” tab ကို ထည့်ထားပါသည်။',
          'Settings အပေါ်ဆုံးတွင် ဒေတာကို ဘယ်နေရာတွင် သိမ်းထားသည်ကို ပြပါသည်။',
          'AkihiroLabs ၏ Byte ရက်ကွန်း logo အစစ်ကို သုံးထားပါသည်။',
        ]],
        ['1.8.0', [
          'App update အသစ်ထွက်ပါက “Restart now” ခလုတ်ပါသော အသိပေးကတ်ကို ပြပါသည်။',
          'Settings တွင် English / 日本語 / မြန်မာ ဘာသာဖြင့် အကြောင်းနှင့် အသုံးပြုနည်းကို ထည့်ထားပါသည်။',
        ]],
        ['1.7.0', [
          'App ဘာသာစကားကို English / 日本語 သို့ ပြောင်းနိုင်ပါပြီ။',
          'ထပ်ခါထပ်ခါ shift များကို ပြင်ဆင်နိုင်ပါပြီ။',
          '“Fill” လုပ်ပြီးနောက် “Undo” ဖြင့် ပြန်ဖျက်နိုင်ပါသည်။',
          'ဂဏန်း ၆ လုံးကုဒ်ဖြင့် sign in ဝင်နိုင်ပါသည်။',
        ]],
      ],
      version: 'ဗားရှင်း',
    },
  };

  let current = null;   // null = follow the app language
  let tab = 'about';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = id => document.getElementById(id);
  const SEEN_KEY = 'sp_seen_version';

  function render() {
    const box = $('helpBody');
    if (!box) return;
    const lang = current || (typeof I18n !== 'undefined' ? I18n.lang : 'en');
    const t = TEXT[lang] || TEXT.en;
    const ver = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '';

    document.querySelectorAll('#helpLang [data-help-lang]').forEach(b =>
      b.classList.toggle('active', b.dataset.helpLang === lang));
    document.querySelectorAll('#helpTabs [data-help-tab]').forEach(b => {
      b.textContent = t.tabs[b.dataset.helpTab];
      b.classList.toggle('active', b.dataset.helpTab === tab);
      b.setAttribute('aria-selected', b.dataset.helpTab === tab);
    });
    const my = lang === 'my';
    ['helpBody', 'helpTabs'].forEach(id => { $(id).lang = lang; $(id).classList.toggle('help-my', my); });

    if (tab === 'about') {
      box.innerHTML = `
        <div class="help-hero"><img class="byte-logo" src="byte.svg" alt="" width="56" height="56">
          <div><strong>ShiftPay</strong><span>${esc(t.version)} ${esc(ver)}</span></div></div>
        ${t.about.map(p => `<p class="help-p">${esc(p)}</p>`).join('')}
        <p class="help-note">${esc(t.note)}</p>`;
    } else if (tab === 'how') {
      box.innerHTML = `
        <ol class="help-steps">
          ${t.steps.map(([title, text]) => `<li><strong>${esc(title)}</strong><span>${esc(text)}</span></li>`).join('')}
        </ol>`;
    } else {
      box.innerHTML = t.news.map(([v, items], i) => `
        <section class="help-news">
          <h3 class="help-head">v${esc(v)}${i === 0 ? ' <span class="tag tag-accent">NEW</span>' : ''}</h3>
          <ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        </section>`).join('');
    }
    box.scrollTop = 0;
    $('helpFoot').innerHTML = `<img class="byte-logo byte-xs" src="byte.svg" alt="" width="16" height="16"> ShiftPay ${esc(ver)} · AkihiroLabs`;
  }

  function open(which) {
    const m = $('helpModal');
    if (!m) return;
    tab = which || 'about';
    current = null;
    render();
    m.classList.add('active');
    $('overlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
    try { localStorage.setItem(SEEN_KEY, APP_VERSION); } catch {}
  }

  function close() {
    $('helpModal')?.classList.remove('active');
    if (!document.querySelector('.modal.active')) {
      $('overlay')?.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // After an update: a short "Updated to vX — What's new" message, once per version
  function announceUpdate() {
    if (typeof APP_VERSION === 'undefined') return;
    let seen = null;
    try {
      seen = localStorage.getItem(SEEN_KEY);
      // Versions before 1.9 didn't save this — if there's already data, this is an update
      if (!seen && (localStorage.getItem('sp_jobs') || localStorage.getItem('sp_shifts'))) seen = 'old';
      localStorage.setItem(SEEN_KEY, APP_VERSION);
    } catch { return; }
    if (!seen || seen === APP_VERSION) return;          // first visit, or nothing new
    setTimeout(() => {
      if (typeof Modals === 'undefined' || typeof I18n === 'undefined') return;
      Modals.showToast(esc(I18n.t('help.updated', { v: APP_VERSION })), 'success',
        { label: I18n.t('help.seeNew'), onClick: () => open('new') });
    }, 800);
  }

  function init() {
    document.querySelectorAll('#helpLang [data-help-lang]').forEach(b =>
      b.addEventListener('click', () => { current = b.dataset.helpLang; render(); }));
    document.querySelectorAll('#helpTabs [data-help-tab]').forEach(b =>
      b.addEventListener('click', () => { tab = b.dataset.helpTab; render(); }));
    $('helpOpen')?.addEventListener('click', () => open('about'));
    $('helpModalClose')?.addEventListener('click', close);
    // When the app language changes, the help follows it (until the reader picks a tab again)
    window.addEventListener('sp:lang', () => { current = null; render(); });
    render();
    announceUpdate();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  return { render, open, close };
})();
