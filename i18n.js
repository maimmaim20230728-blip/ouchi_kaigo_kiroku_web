/* おうち介護記録・そよぎ 多言語テーブル(v2)
   ・window.OKIROKU_I18N = { ja, en, de, ... } の12言語。キー構造は全言語で完全一致
   ・記録は言語非依存コードで保存し、表示時にこのテーブルで各言語に変換する(app.jsのT())
   ・クレジット(set.credit)は全言語で「そよぎ / SOYOGI」の名前を必ず残す
   ・{n} {ml} {u} などは app.js の tpl() が実値に差し替えるプレースホルダ(訳文でも記号のまま残す)

   🔴翻訳の進め方(builder→Fable引き継ぎ):
     今回 builder が用意したのは ja(正)と en(下書き)の2言語。
     残り10言語(de/fr/es/it/pt/nl/sv/ko/zh/ar)は、このファイル末尾で en を複製した
     「仮値(英語のまま)」を置いてある(構造は必ず ja と一致)。
     Fable は各言語ごとに、en 複製を差し替える形で訳文を記入する。
     未翻訳(=en と中身が同一)の言語は _check_i18n.js が「TODO」として検出する。 */

(function(){
  'use strict';

  /* ============ ja(正) ============ */
  var ja = {
    app: { title:'おうち介護記録・そよぎ', name:'おうち介護記録・そよぎ', ver:'1.0' },

    tab: { today:'きょう', hist:'りれき', show:'みせる', set:'せってい' },

    common: { save:'きろくする', cancel:'やめる', empty:'まだ記録はありません', delConfirm:'けす?' },

    toast: {
      saved:'きろくしました ✓',
      savedNoPhoto:'写真は容量のため保存できませんでした',
      full:'容量がいっぱいで保存できませんでした',
      exported:'書き出しました ✓',
      imported:'読み込みました ✓',
      importFail:'読み込めませんでした',
      waterNoUndo:'もどす水分がありません',
      waterUndone:'1つもどしました ✓',
      photoFail:'写真を読み込めませんでした'
    },

    today: {
      records:'きょうの記録',
      datePrefix:'きょう',
      gotoSet:'⚙️ 記録するこうもくは「せってい」で ふやす・へらす ができます',
      gotoSetOff:'⚙️ 記録するこうもくは「せってい」で ふやす・へらす ができます(いまOFF: {list})'
    },

    hist: { prev:'◀ 前の日', next:'次の日 ▶', todayMark:'(きょう)', noRecord:'この日の記録はありません' },

    show: {
      noteHead:'つたえたいこと・心配なこと',
      notePlaceholder:'受診や面談で伝えたいことを、ここにメモしておけます',
      span7title:'この1週間', span30title:'この1か月', span90title:'この3か月',
      span7btn:'1週間', span30btn:'1か月', span90btn:'3か月',
      hint:'この画面をそのまま、お医者さん・看護師さん・ケアマネさんに見せてください。上の表は記録から自動で作られます。 記録じたいはずっと残ります。むかしの日は「りれき」でさかのぼれます。',
      colDay:'日', colWeek:'週', todayMark:'きょう', thisWeek:'今週'
    },

    set: {
      langHead:'🌐 ことば / Language',
      fontHead:'文字の大きさ', fsNormal:'ふつう', fsLarge:'大きい', fsXL:'とくだい',
      waterHead:'水分の目標量(1日)',
      waterHint:'はじめの1200mlは、厚生労働省の目安(1日に必要な水分2.5L=食事から約1.0L+体内で作られる約0.3L+飲み水約1.2L)のうち「飲み水」の量です。食事にふくまれる水分は入れずに、飲み物だけを数えてください。心臓や腎臓の病気などで水分の制限がある方は、お医者さん・看護師さんから言われた量に合わせて変えてください。',
      heightHead:'身長(体重のBMI計算に使います)',
      heightHint:'身長を入れると、体重の記録にBMIのめやすが出ます。空欄にすると判定は出ません。',
      heightPlaceholder:'未設定',
      itemsHead:'記録するこうもく',
      backupHead:'バックアップ', export:'記録を書き出す', import:'記録を読み込む',
      backupHint:'記録はこの端末の中だけに保存されます。どこにも送信されません。機種変更のときは「書き出す」で保存したファイルを新しい端末で「読み込む」してください。',
      credit:'アプリ開発：介護と支援の相談どころ　そよぎ',
      ver:'バージョン 1.0',
      on:'ON', off:'OFF'
    },

    items: {
      water:'水分', med:'おくすり', meal:'食事', toilet:'トイレ', temp:'体温', sleep:'夜間のようす',
      mood:'きぶん・ようす', carer:'わたしのきぶん', fall:'転倒・ヒヤリ', note:'メモ',
      bp:'血圧・脈', weight:'体重', bath:'おふろ', skin:'皮膚のようす', wake:'中途覚醒',
      sleepSub:'朝に昨晩のことを', carerSub:'介護するあなたの',
      medHint:'使った理由(熱・痛みなど)があれば',
      fallHint:'いつ・どこで・どんなふうに(例: 朝、トイレの前でふらついた)',
      noteHint:'気づいたこと(例: 咳が出る、かゆがっている)'
    },

    med: {
      title:'💊 おくすり', taken:'のんだ', prn:'頓服(とんぷく)', missed:'のめなかった',
      tonpukuTitle:'💊 頓服(とんぷく)の理由', tonpukuPlaceholder:'理由(熱・痛み・ねむれない など)'
    },

    meal: { title:'🍚 食事', full:'完食', half:'半分', little:'少し', none:'食べず' },

    water: {
      title:'🥛 水分', head:'水分', todayLabel:'きょう', unit:'ml',
      over:'目標を{n}ml超えています', reached:'目標達成 ◎', remain:'目標まであと{n}ml',
      btnCup:'コップ1杯 200ml', btnHalf:'半分 100ml', btnSip:'少し 50ml',
      rowCup:'コップ1杯', rowHalf:'半分', rowSip:'少し', undo:'⤺ 1つもどす'
    },

    toilet: {
      title:'🚻 トイレ', pee:'おしっこ', poo:'うんち', peeTitle:'🚻 おしっこ', pooTitle:'🚻 うんち',
      u_norm:'ふつう(約300ml)', u_much:'多い(約400ml)', u_little:'少ない(約200ml)', u_tiny:'わずか(約100ml)',
      numEntry:'数値でいれる(ハルンパック等)', numTitle:'🚻 おしっこ(ml)', numHint:'量(ml)',
      s_norm:'ふつう', s_soft:'やわらかい', s_hard:'かたい', s_diar:'下痢',
      obsTitle:'🚻 ようす', obsNormal:'いつもどおり', obs_color:'色がいつもとちがう', obs_blood:'血がまじっているかも',
      todaySub:'きょう 尿{u}回・便{s}回'
    },

    temp: { title:'🌡️ 体温', notePlaceholder:'クーリングをした、など', unit:'℃' },

    sleep: {
      title:'🌙 夜間のようす', wakeNow:'いま目がさめた(夜中用)', morning:'朝のまとめをつける', wokeAtNight:'夜中に目がさめた',
      summaryTitle:'🌙 朝のまとめ', sleptTime:'ねむった時刻', wokeTime:'おきた時刻', minus30:'−30分', plus30:'＋30分',
      hoursLive:'ねむった時間　約{n}時間', qualityLabel:'ねむり',
      q_good:'よくねむれた', q_ok:'ふつう', q_poor:'あさかった',
      rowMain:'入眠{sl} 起床{wk}(約{hrs}時間)'
    },

    mood: {
      title:'🙂 きぶん・ようす', calm:'おだやか', normal:'ふつう', down:'元気がない', irritable:'イライラしている', waves:'気分の波がはげしい',
      memoHint:'ようす・気づいたこと(任意)'
    },

    carer: {
      title:'🍀 わたしのきぶん', good:'良い', ok:'ふつう', tired:'しんどい', verytired:'かなり苦しい', limit:'限界',
      memoHint:'ようす・気づいたこと(任意)'
    },

    fall: { title:'⚠️ 転倒・ヒヤリ' },
    note: { title:'📝 メモ' },

    bp: {
      title:'❤️ 血圧・脈', sysLabel:'上(収縮期)', diaLabel:'下(拡張期)', pulseLabel:'脈(はかった場合・任意)',
      pulsePrefix:'脈', sysShort:'上', diaShort:'下', pulseShort:'脈'
    },

    weight: { title:'⚖️ 体重', unit:'kg' },

    bath: { title:'🛁 おふろ', tub:'よくそうにつかった', wash:'からだをあらった', shower:'シャワーをあびた', wipe:'清拭(からだをふいた)' },

    skin: {
      title:'🩹 皮膚のようす', normal:'いつもどおり', concern:'気になるところがある', concernRow:'気になるところ',
      concernTitle:'🩹 気になるところ', concernPlaceholder:'場所とようす(例: おしりの右側が赤い)', photoCamera:'📷 カメラでとる(任意)', photoAlbum:'🖼 アルバムから(任意)'
    },

    timeEdit: { title:'時刻をなおす', ok:'なおす' },

    /* 血圧・脈のチップ(判定マーカー) */
    chip: {
      pulseFast:'はやい', pulseFastMild:'やや速め', pulseSlow:'おそい', pulseSlowMild:'やや遅め',
      high:'たかい', highMild:'やや高め', low:'ひくい', lowMild:'やや低め'
    },

    /* BMIチップ */
    bmi: { thin:'やせすぎ', thinMild:'やせぎみ', normal:'ひょうじゅん', over:'おおめ', overMuch:'かなりおおめ', label:'BMI' },

    /* 集計の断片(daySummary/showCell/weekCell)。数は{n}等に入る */
    sum: {
      takenTimes:'のんだ{n}回', timesN:'{n}回', prn:'頓服{n}', prnShort:'頓{n}', missed:'✕{n}',
      urineTimes:'尿{n}回', urineN:'尿{n}', urineRate:'尿{n}回/日', stoolTimes:'便{n}回', stoolN:'便{n}',
      diar:'下痢{n}', diarShort:'下{n}', mlApprox:'(約{ml}ml)', mlApproxShort:'(約{ml})',
      tempMax:'最高{v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal}ml', waterAvg:'{ml}ml({days}日)',
      hoursDay:'約{n}時間', hoursCell:'約{n}h', hoursAvgCell:'約{n}h({days}日)',
      wakeDay:'覚醒{n}', wakeShort:'覚{n}', casesN:'{n}件', fallCell:'⚠️{n}', dash:'−'
    },

    /* みせる表の見出し(絵文字はそのまま・語だけ訳す) */
    col: {
      med:'💊くすり', water:'🥛水分', meal:'🍚食事', mealWeek:'🍚食べず', toilet:'🚻トイレ',
      temp:'🌡体温', bp:'❤️血圧', sleep:'🌙ねむり', fall:'⚠転倒等'
    }
  };

  /* ============ en(下書き・Fableが後で磨く前提) ============ */
  var en = {
    app: { title:'Home Care Log - SOYOGI', name:'Home Care Log - SOYOGI', ver:'1.0' },

    tab: { today:'Today', hist:'History', show:'Show', set:'Settings' },

    common: { save:'Save', cancel:'Cancel', empty:'No records yet', delConfirm:'Delete?' },

    toast: {
      saved:'Saved ✓',
      savedNoPhoto:'The photo could not be saved due to the storage limit',
      full:'Could not save: storage is full',
      exported:'Exported ✓',
      imported:'Imported ✓',
      importFail:'Could not read the file',
      waterNoUndo:'No water intake to undo',
      waterUndone:'Removed one ✓',
      photoFail:'Could not load the photo'
    },

    today: {
      records:'Today’s records',
      datePrefix:'Today',
      gotoSet:'⚙️ You can add or remove items to record in "Settings"',
      gotoSetOff:'⚙️ You can add or remove items to record in "Settings" (now OFF: {list})'
    },

    hist: { prev:'◀ Prev day', next:'Next day ▶', todayMark:'(today)', noRecord:'No records for this day' },

    show: {
      noteHead:'Things to tell / concerns',
      notePlaceholder:'Note here what you want to tell at a visit or meeting',
      span7title:'This week', span30title:'This month', span90title:'Last 3 months',
      span7btn:'1 week', span30btn:'1 month', span90btn:'3 months',
      hint:'Show this screen as it is to the doctor, nurse, or care manager. The table above is made automatically from your records. The records themselves are kept. You can go back to older days in "History".',
      colDay:'Day', colWeek:'Week', todayMark:'today', thisWeek:'this week'
    },

    set: {
      langHead:'🌐 ことば / Language',
      fontHead:'Text size', fsNormal:'Normal', fsLarge:'Large', fsXL:'Extra large',
      waterHead:'Daily water goal',
      waterHint:'The initial 1200 ml is the "drinking water" portion of the guideline from Japan’s Ministry of Health, Labour and Welfare (about 2.5 L of water is needed per day = about 1.0 L from food + about 0.3 L made in the body + about 1.2 L of drinking water). Count only drinks, not the water contained in food. If water intake is restricted due to heart or kidney disease, change it to the amount your doctor or nurse told you.',
      heightHead:'Height (used to calculate BMI from weight)',
      heightHint:'If you enter your height, a BMI guide appears on weight records. Leave it blank to hide the judgment.',
      heightPlaceholder:'not set',
      itemsHead:'Items to record',
      backupHead:'Backup', export:'Export records', import:'Import records',
      backupHint:'Records are stored only on this device. Nothing is sent anywhere. When you change devices, use "Export" to save a file, then "Import" it on the new device.',
      credit:'App development: SOYOGI - Care & Support Consultation',
      ver:'Version 1.0',
      on:'ON', off:'OFF'
    },

    items: {
      water:'Water', med:'Medicine', meal:'Meals', toilet:'Toilet', temp:'Temperature', sleep:'Night',
      mood:'Mood & state', carer:'My mood', fall:'Fall / near-miss', note:'Note',
      bp:'Blood pressure & pulse', weight:'Weight', bath:'Bath', skin:'Skin', wake:'Night waking',
      sleepSub:'Record last night in the morning', carerSub:'For you, the caregiver',
      medHint:'If there is a reason (fever, pain, etc.)',
      fallHint:'When, where, and how (e.g., wobbled in front of the toilet in the morning)',
      noteHint:'Anything you noticed (e.g., coughing, itching)'
    },

    med: {
      title:'💊 Medicine', taken:'Took it', prn:'As-needed (PRN)', missed:'Could not take',
      tonpukuTitle:'💊 Reason for the as-needed dose', tonpukuPlaceholder:'Reason (fever, pain, can’t sleep, etc.)'
    },

    meal: { title:'🍚 Meals', full:'Ate all', half:'Half', little:'A little', none:'Did not eat' },

    water: {
      title:'🥛 Water', head:'Water', todayLabel:'Today', unit:'ml',
      over:'{n} ml over the goal', reached:'Goal reached ◎', remain:'{n} ml to go',
      btnCup:'1 cup 200 ml', btnHalf:'Half 100 ml', btnSip:'A little 50 ml',
      rowCup:'1 cup', rowHalf:'Half', rowSip:'A little', undo:'⤺ Undo one'
    },

    toilet: {
      title:'🚻 Toilet', pee:'Urine', poo:'Stool', peeTitle:'🚻 Urine', pooTitle:'🚻 Stool',
      u_norm:'Normal (about 300 ml)', u_much:'A lot (about 400 ml)', u_little:'Little (about 200 ml)', u_tiny:'Very little (about 100 ml)',
      numEntry:'Enter a number (urine bag, etc.)', numTitle:'🚻 Urine (ml)', numHint:'Amount (ml)',
      s_norm:'Normal', s_soft:'Soft', s_hard:'Hard', s_diar:'Diarrhea',
      obsTitle:'🚻 Condition', obsNormal:'As usual', obs_color:'The color looks different', obs_blood:'Possibly some blood',
      todaySub:'Today: urine {u}, stool {s}'
    },

    temp: { title:'🌡️ Temperature', notePlaceholder:'e.g., applied cooling', unit:'℃' },

    sleep: {
      title:'🌙 Night', wakeNow:'Just woke up (for night use)', morning:'Add the morning summary', wokeAtNight:'Woke during the night',
      summaryTitle:'🌙 Morning summary', sleptTime:'Fell asleep', wokeTime:'Woke up', minus30:'−30 min', plus30:'＋30 min',
      hoursLive:'Time asleep: about {n} h', qualityLabel:'Sleep',
      q_good:'Slept well', q_ok:'Normal', q_poor:'Slept lightly',
      rowMain:'Asleep {sl}, awake {wk} (about {hrs} h)'
    },

    mood: {
      title:'🙂 Mood & state', calm:'Calm', normal:'Normal', down:'Low energy', irritable:'Irritable', waves:'Big mood swings',
      memoHint:'State or notes (optional)'
    },

    carer: {
      title:'🍀 My mood', good:'Good', ok:'Normal', tired:'Hard', verytired:'Very hard', limit:'At my limit',
      memoHint:'State or notes (optional)'
    },

    fall: { title:'⚠️ Fall / near-miss' },
    note: { title:'📝 Note' },

    bp: {
      title:'❤️ Blood pressure & pulse', sysLabel:'Systolic (upper)', diaLabel:'Diastolic (lower)', pulseLabel:'Pulse (if measured, optional)',
      pulsePrefix:'pulse ', sysShort:'Sys', diaShort:'Dia', pulseShort:'P'
    },

    weight: { title:'⚖️ Weight', unit:'kg' },

    bath: { title:'🛁 Bath', tub:'Soaked in the tub', wash:'Washed the body', shower:'Took a shower', wipe:'Wiped the body' },

    skin: {
      title:'🩹 Skin', normal:'As usual', concern:'Something is bothering me', concernRow:'Concern',
      concernTitle:'🩹 Area of concern', concernPlaceholder:'Place and condition (e.g., red on the right hip)', photoCamera:'📷 Take a photo (optional)', photoAlbum:'🖼 From the album (optional)'
    },

    timeEdit: { title:'Fix the time', ok:'Fix' },

    chip: {
      pulseFast:'fast', pulseFastMild:'a bit fast', pulseSlow:'slow', pulseSlowMild:'a bit slow',
      high:'high', highMild:'a bit high', low:'low', lowMild:'a bit low'
    },

    bmi: { thin:'underweight', thinMild:'slightly thin', normal:'standard', over:'overweight', overMuch:'very overweight', label:'BMI' },

    sum: {
      takenTimes:'took {n}', timesN:'{n}', prn:'PRN {n}', prnShort:'PRN{n}', missed:'✕{n}',
      urineTimes:'urine {n}', urineN:'U{n}', urineRate:'urine {n}/day', stoolTimes:'stool {n}', stoolN:'S{n}',
      diar:'diarrhea {n}', diarShort:'dia{n}', mlApprox:' (~{ml} ml)', mlApproxShort:'(~{ml})',
      tempMax:'max {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal} ml', waterAvg:'{ml} ml ({days} d)',
      hoursDay:'about {n} h', hoursCell:'~{n}h', hoursAvgCell:'~{n}h ({days}d)',
      wakeDay:'waking {n}', wakeShort:'wake {n}', casesN:'{n}', fallCell:'⚠️{n}', dash:'−'
    },

    col: {
      med:'💊 Med', water:'🥛 Water', meal:'🍚 Meal', mealWeek:'🍚 Skipped', toilet:'🚻 Toilet',
      temp:'🌡 Temp', bp:'❤️ BP', sleep:'🌙 Sleep', fall:'⚠ Fall'
    }
  };

  /* ============ de ============ */
  var de = {
    app: { title:'Pflegetagebuch Zuhause - SOYOGI', name:'Pflegetagebuch Zuhause - SOYOGI', ver:'1.0' },
    tab: { today:'Heute', hist:'Verlauf', show:'Bericht', set:'Einstellungen' },
    common: { save:'Speichern', cancel:'Abbrechen', empty:'Noch keine Einträge', delConfirm:'Löschen?' },
    toast: {
      saved:'Gespeichert ✓',
      savedNoPhoto:'Das Foto konnte wegen des Speicherlimits nicht gespeichert werden',
      full:'Speichern nicht möglich: der Speicher ist voll',
      exported:'Exportiert ✓',
      imported:'Importiert ✓',
      importFail:'Die Datei konnte nicht gelesen werden',
      waterNoUndo:'Kein Eintrag zum Zurücknehmen',
      waterUndone:'Einen Eintrag zurückgenommen ✓',
      photoFail:'Das Foto konnte nicht geladen werden'
    },
    today: {
      records:'Einträge von heute',
      datePrefix:'Heute',
      gotoSet:'⚙️ In den „Einstellungen“ können Sie Punkte hinzufügen oder entfernen',
      gotoSetOff:'⚙️ In den „Einstellungen“ können Sie Punkte hinzufügen oder entfernen (jetzt AUS: {list})'
    },
    hist: { prev:'◀ Vortag', next:'Nächster Tag ▶', todayMark:'(heute)', noRecord:'Keine Einträge an diesem Tag' },
    show: {
      noteHead:'Mitteilungen / Sorgen',
      notePlaceholder:'Notieren Sie hier, was Sie beim Arztbesuch oder Gespräch mitteilen möchten',
      span7title:'Diese Woche', span30title:'Dieser Monat', span90title:'Letzte 3 Monate',
      span7btn:'1 Woche', span30btn:'1 Monat', span90btn:'3 Monate',
      hint:'Zeigen Sie diesen Bildschirm einfach dem Arzt, der Pflegekraft oder der Beratungsstelle. Die Tabelle oben entsteht automatisch aus den Einträgen. Die Einträge selbst bleiben erhalten. Ältere Tage finden Sie im „Verlauf“.',
      colDay:'Tag', colWeek:'Woche', todayMark:'heute', thisWeek:'diese Woche'
    },
    set: {
      langHead:'🌐 Sprache / Language',
      fontHead:'Schriftgröße', fsNormal:'Normal', fsLarge:'Groß', fsXL:'Sehr groß',
      waterHead:'Tagesziel Trinkmenge',
      waterHint:'Die anfänglichen 1200 ml sind der „Trinkwasser“-Anteil der Richtwerte des japanischen Gesundheitsministeriums (ca. 2,5 L Wasser pro Tag = ca. 1,0 L aus dem Essen + ca. 0,3 L körpereigen gebildet + ca. 1,2 L Getränke). Zählen Sie nur Getränke, nicht das Wasser im Essen. Bei ärztlich begrenzter Trinkmenge (z. B. Herz- oder Nierenerkrankung) stellen Sie bitte die vom Arzt genannte Menge ein.',
      heightHead:'Größe (für die BMI-Berechnung aus dem Gewicht)',
      heightHint:'Mit eingetragener Größe erscheint beim Gewicht ein BMI-Hinweis. Leer lassen, um keine Bewertung zu zeigen.',
      heightPlaceholder:'nicht gesetzt',
      itemsHead:'Punkte zum Aufzeichnen',
      backupHead:'Sicherung', export:'Einträge exportieren', import:'Einträge importieren',
      backupHint:'Die Einträge werden nur auf diesem Gerät gespeichert. Nichts wird gesendet. Beim Gerätewechsel mit „Exportieren“ eine Datei sichern und auf dem neuen Gerät „Importieren“.',
      credit:'App-Entwicklung: SOYOGI - Beratungsstelle für Pflege und Unterstützung',
      ver:'Version 1.0',
      on:'AN', off:'AUS'
    },
    items: {
      water:'Trinken', med:'Medikamente', meal:'Essen', toilet:'Toilette', temp:'Temperatur', sleep:'Nacht',
      mood:'Stimmung', carer:'Meine Stimmung', fall:'Sturz / Beinahe-Sturz', note:'Notiz',
      bp:'Blutdruck & Puls', weight:'Gewicht', bath:'Baden', skin:'Haut', wake:'Nächtliches Erwachen',
      sleepSub:'Morgens die letzte Nacht eintragen', carerSub:'Für Sie als pflegende Person',
      medHint:'Falls es einen Grund gibt (Fieber, Schmerzen usw.)',
      fallHint:'Wann, wo und wie (z. B. morgens vor der Toilette geschwankt)',
      noteHint:'Beobachtungen (z. B. Husten, Juckreiz)'
    },
    med: {
      title:'💊 Medikamente', taken:'Eingenommen', prn:'Bedarfsmedikament', missed:'Nicht eingenommen',
      tonpukuTitle:'💊 Grund für das Bedarfsmedikament', tonpukuPlaceholder:'Grund (Fieber, Schmerzen, Schlaflosigkeit usw.)'
    },
    meal: { title:'🍚 Essen', full:'Alles gegessen', half:'Die Hälfte', little:'Wenig', none:'Nichts gegessen' },
    water: {
      title:'🥛 Trinken', head:'Trinken', todayLabel:'Heute', unit:'ml',
      over:'{n} ml über dem Ziel', reached:'Ziel erreicht ◎', remain:'Noch {n} ml bis zum Ziel',
      btnCup:'1 Glas 200 ml', btnHalf:'Halb 100 ml', btnSip:'Wenig 50 ml',
      rowCup:'1 Glas', rowHalf:'Halb', rowSip:'Wenig', undo:'⤺ Eins zurück'
    },
    toilet: {
      title:'🚻 Toilette', pee:'Urin', poo:'Stuhl', peeTitle:'🚻 Urin', pooTitle:'🚻 Stuhl',
      u_norm:'Normal (ca. 300 ml)', u_much:'Viel (ca. 400 ml)', u_little:'Wenig (ca. 200 ml)', u_tiny:'Sehr wenig (ca. 100 ml)',
      numEntry:'Zahl eingeben (Urinbeutel usw.)', numTitle:'🚻 Urin (ml)', numHint:'Menge (ml)',
      s_norm:'Normal', s_soft:'Weich', s_hard:'Hart', s_diar:'Durchfall',
      obsTitle:'🚻 Auffälligkeiten', obsNormal:'Wie immer', obs_color:'Farbe wirkt anders', obs_blood:'Möglicherweise Blut',
      todaySub:'Heute: Urin {u}, Stuhl {s}'
    },
    temp: { title:'🌡️ Temperatur', notePlaceholder:'z. B. gekühlt', unit:'℃' },
    sleep: {
      title:'🌙 Nacht', wakeNow:'Gerade aufgewacht (für nachts)', morning:'Morgen-Zusammenfassung eintragen', wokeAtNight:'Nachts aufgewacht',
      summaryTitle:'🌙 Morgen-Zusammenfassung', sleptTime:'Eingeschlafen um', wokeTime:'Aufgewacht um', minus30:'−30 Min.', plus30:'＋30 Min.',
      hoursLive:'Schlafdauer: ca. {n} Std.', qualityLabel:'Schlaf',
      q_good:'Gut geschlafen', q_ok:'Normal', q_poor:'Leicht geschlafen',
      rowMain:'Eingeschlafen {sl}, aufgewacht {wk} (ca. {hrs} Std.)'
    },
    mood: {
      title:'🙂 Stimmung', calm:'Ruhig', normal:'Normal', down:'Antriebslos', irritable:'Gereizt', waves:'Starke Schwankungen',
      memoHint:'Zustand oder Notizen (optional)'
    },
    carer: {
      title:'🍀 Meine Stimmung', good:'Gut', ok:'Normal', tired:'Anstrengend', verytired:'Sehr belastend', limit:'Am Limit',
      memoHint:'Zustand oder Notizen (optional)'
    },
    fall: { title:'⚠️ Sturz / Beinahe-Sturz' },
    note: { title:'📝 Notiz' },
    bp: {
      title:'❤️ Blutdruck & Puls', sysLabel:'Oberer Wert (systolisch)', diaLabel:'Unterer Wert (diastolisch)', pulseLabel:'Puls (falls gemessen, optional)',
      pulsePrefix:'Puls ', sysShort:'Sys', diaShort:'Dia', pulseShort:'P'
    },
    weight: { title:'⚖️ Gewicht', unit:'kg' },
    bath: { title:'🛁 Baden', tub:'In der Wanne gebadet', wash:'Körper gewaschen', shower:'Geduscht', wipe:'Körper abgewischt' },
    skin: {
      title:'🩹 Haut', normal:'Wie immer', concern:'Etwas fällt auf', concernRow:'Auffälligkeit',
      concernTitle:'🩹 Auffällige Stelle', concernPlaceholder:'Stelle und Zustand (z. B. rechte Hüfte gerötet)', photoCamera:'📷 Foto aufnehmen (optional)', photoAlbum:'🖼 Aus dem Album (optional)'
    },
    timeEdit: { title:'Uhrzeit korrigieren', ok:'Korrigieren' },
    chip: {
      pulseFast:'schnell', pulseFastMild:'etwas schnell', pulseSlow:'langsam', pulseSlowMild:'etwas langsam',
      high:'hoch', highMild:'etwas hoch', low:'niedrig', lowMild:'etwas niedrig'
    },
    bmi: { thin:'Untergewicht', thinMild:'eher schlank', normal:'normal', over:'erhöht', overMuch:'stark erhöht', label:'BMI' },
    sum: {
      takenTimes:'{n}× eingenommen', timesN:'{n}×', prn:'Bedarf {n}', prnShort:'B{n}', missed:'✕{n}',
      urineTimes:'Urin {n}', urineN:'U{n}', urineRate:'Urin {n}/Tag', stoolTimes:'Stuhl {n}', stoolN:'St{n}',
      diar:'Durchfall {n}', diarShort:'Df{n}', mlApprox:' (ca. {ml} ml)', mlApproxShort:'(ca. {ml})',
      tempMax:'max. {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal} ml', waterAvg:'{ml} ml ({days} T.)',
      hoursDay:'ca. {n} Std.', hoursCell:'~{n}h', hoursAvgCell:'~{n}h ({days}T)',
      wakeDay:'Erwachen {n}', wakeShort:'Erw. {n}', casesN:'{n}', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊 Medik.', water:'🥛 Trinken', meal:'🍚 Essen', mealWeek:'🍚 Nichts geg.', toilet:'🚻 Toilette',
      temp:'🌡 Temp.', bp:'❤️ RR', sleep:'🌙 Schlaf', fall:'⚠ Sturz'
    }
  };

  /* ============ fr ============ */
  var fr = {
    app: { title:'Journal de soins à domicile - SOYOGI', name:'Journal de soins à domicile - SOYOGI', ver:'1.0' },
    tab: { today:'Aujourd’hui', hist:'Historique', show:'Rapport', set:'Réglages' },
    common: { save:'Enregistrer', cancel:'Annuler', empty:'Pas encore d’enregistrement', delConfirm:'Effacer ?' },
    toast: {
      saved:'Enregistré ✓',
      savedNoPhoto:'La photo n’a pas pu être gardée (limite de stockage)',
      full:'Enregistrement impossible : stockage plein',
      exported:'Exporté ✓',
      imported:'Importé ✓',
      importFail:'Impossible de lire le fichier',
      waterNoUndo:'Aucune prise d’eau à annuler',
      waterUndone:'Une prise annulée ✓',
      photoFail:'Impossible de charger la photo'
    },
    today: {
      records:'Enregistrements du jour',
      datePrefix:'Aujourd’hui',
      gotoSet:'⚙️ Dans « Réglages », vous pouvez ajouter ou retirer des éléments à suivre',
      gotoSetOff:'⚙️ Dans « Réglages », vous pouvez ajouter ou retirer des éléments à suivre (désactivés : {list})'
    },
    hist: { prev:'◀ Jour précédent', next:'Jour suivant ▶', todayMark:'(aujourd’hui)', noRecord:'Aucun enregistrement ce jour-là' },
    show: {
      noteHead:'À transmettre / inquiétudes',
      notePlaceholder:'Notez ici ce que vous voulez dire lors de la consultation ou de la réunion',
      span7title:'Cette semaine', span30title:'Ce mois-ci', span90title:'Ces 3 derniers mois',
      span7btn:'1 semaine', span30btn:'1 mois', span90btn:'3 mois',
      hint:'Montrez cet écran tel quel au médecin, à l’infirmière ou au gestionnaire de soins. Le tableau ci-dessus est créé automatiquement à partir des enregistrements. Les enregistrements eux-mêmes sont conservés. Les jours plus anciens sont dans « Historique ».',
      colDay:'Jour', colWeek:'Semaine', todayMark:'aujourd’hui', thisWeek:'cette semaine'
    },
    set: {
      langHead:'🌐 Langue / Language',
      fontHead:'Taille du texte', fsNormal:'Normale', fsLarge:'Grande', fsXL:'Très grande',
      waterHead:'Objectif d’hydratation (par jour)',
      waterHint:'Les 1200 ml initiaux correspondent à la part « boissons » du repère du ministère japonais de la Santé (environ 2,5 L d’eau par jour = env. 1,0 L venant des repas + env. 0,3 L produit par le corps + env. 1,2 L de boissons). Ne comptez que les boissons, pas l’eau contenue dans les repas. En cas de restriction hydrique (maladie cardiaque ou rénale), réglez la quantité indiquée par le médecin ou l’infirmière.',
      heightHead:'Taille (pour calculer l’IMC à partir du poids)',
      heightHint:'Si vous saisissez la taille, un repère d’IMC apparaît sur les pesées. Laissez vide pour ne rien afficher.',
      heightPlaceholder:'non renseignée',
      itemsHead:'Éléments à suivre',
      backupHead:'Sauvegarde', export:'Exporter les données', import:'Importer les données',
      backupHint:'Les enregistrements restent uniquement sur cet appareil. Rien n’est envoyé. En cas de changement d’appareil, « Exporter » un fichier puis « Importer » sur le nouvel appareil.',
      credit:'Développement de l’application : SOYOGI - Lieu de conseil en soins et soutien',
      ver:'Version 1.0',
      on:'ON', off:'OFF'
    },
    items: {
      water:'Hydratation', med:'Médicaments', meal:'Repas', toilet:'Toilettes', temp:'Température', sleep:'Nuit',
      mood:'Humeur & état', carer:'Mon moral', fall:'Chute / presque-chute', note:'Note',
      bp:'Tension & pouls', weight:'Poids', bath:'Bain', skin:'Peau', wake:'Réveil nocturne',
      sleepSub:'Le matin, notez la nuit passée', carerSub:'Pour vous, l’aidant(e)',
      medHint:'S’il y a une raison (fièvre, douleur, etc.)',
      fallHint:'Quand, où et comment (ex. : a vacillé devant les toilettes le matin)',
      noteHint:'Ce que vous avez remarqué (ex. : toux, démangeaisons)'
    },
    med: {
      title:'💊 Médicaments', taken:'Pris', prn:'Si besoin', missed:'Non pris',
      tonpukuTitle:'💊 Raison de la prise « si besoin »', tonpukuPlaceholder:'Raison (fièvre, douleur, insomnie, etc.)'
    },
    meal: { title:'🍚 Repas', full:'Tout mangé', half:'La moitié', little:'Un peu', none:'Rien mangé' },
    water: {
      title:'🥛 Hydratation', head:'Hydratation', todayLabel:'Aujourd’hui', unit:'ml',
      over:'{n} ml au-dessus de l’objectif', reached:'Objectif atteint ◎', remain:'Encore {n} ml avant l’objectif',
      btnCup:'1 verre 200 ml', btnHalf:'Moitié 100 ml', btnSip:'Un peu 50 ml',
      rowCup:'1 verre', rowHalf:'Moitié', rowSip:'Un peu', undo:'⤺ Annuler une prise'
    },
    toilet: {
      title:'🚻 Toilettes', pee:'Urine', poo:'Selles', peeTitle:'🚻 Urine', pooTitle:'🚻 Selles',
      u_norm:'Normal (env. 300 ml)', u_much:'Beaucoup (env. 400 ml)', u_little:'Peu (env. 200 ml)', u_tiny:'Très peu (env. 100 ml)',
      numEntry:'Saisir un nombre (poche à urine, etc.)', numTitle:'🚻 Urine (ml)', numHint:'Quantité (ml)',
      s_norm:'Normales', s_soft:'Molles', s_hard:'Dures', s_diar:'Diarrhée',
      obsTitle:'🚻 Aspect', obsNormal:'Comme d’habitude', obs_color:'Couleur inhabituelle', obs_blood:'Peut-être du sang',
      todaySub:'Aujourd’hui : urine {u}, selles {s}'
    },
    temp: { title:'🌡️ Température', notePlaceholder:'ex. : a été rafraîchi(e)', unit:'℃' },
    sleep: {
      title:'🌙 Nuit', wakeNow:'Réveil à l’instant (pour la nuit)', morning:'Ajouter le bilan du matin', wokeAtNight:'Réveillé(e) pendant la nuit',
      summaryTitle:'🌙 Bilan du matin', sleptTime:'Endormi(e) à', wokeTime:'Réveillé(e) à', minus30:'−30 min', plus30:'＋30 min',
      hoursLive:'Durée de sommeil : env. {n} h', qualityLabel:'Sommeil',
      q_good:'A bien dormi', q_ok:'Normal', q_poor:'Sommeil léger',
      rowMain:'Endormi(e) {sl}, réveil {wk} (env. {hrs} h)'
    },
    mood: {
      title:'🙂 Humeur & état', calm:'Paisible', normal:'Normal', down:'Sans entrain', irritable:'Irritable', waves:'Grandes variations d’humeur',
      memoHint:'État ou remarques (facultatif)'
    },
    carer: {
      title:'🍀 Mon moral', good:'Bien', ok:'Normal', tired:'Difficile', verytired:'Très difficile', limit:'À bout',
      memoHint:'État ou remarques (facultatif)'
    },
    fall: { title:'⚠️ Chute / presque-chute' },
    note: { title:'📝 Note' },
    bp: {
      title:'❤️ Tension & pouls', sysLabel:'Systolique (haut)', diaLabel:'Diastolique (bas)', pulseLabel:'Pouls (si mesuré, facultatif)',
      pulsePrefix:'pouls ', sysShort:'Sys', diaShort:'Dia', pulseShort:'P'
    },
    weight: { title:'⚖️ Poids', unit:'kg' },
    bath: { title:'🛁 Bain', tub:'Bain dans la baignoire', wash:'Corps lavé', shower:'Douche prise', wipe:'Toilette au gant (essuyé)' },
    skin: {
      title:'🩹 Peau', normal:'Comme d’habitude', concern:'Quelque chose m’inquiète', concernRow:'Zone à surveiller',
      concernTitle:'🩹 Zone à surveiller', concernPlaceholder:'Endroit et aspect (ex. : rougeur sur la hanche droite)', photoCamera:'📷 Prendre une photo (facultatif)', photoAlbum:'🖼 Depuis l’album (facultatif)'
    },
    timeEdit: { title:'Corriger l’heure', ok:'Corriger' },
    chip: {
      pulseFast:'rapide', pulseFastMild:'un peu rapide', pulseSlow:'lent', pulseSlowMild:'un peu lent',
      high:'élevée', highMild:'un peu élevée', low:'basse', lowMild:'un peu basse'
    },
    bmi: { thin:'maigreur', thinMild:'plutôt mince', normal:'normal', over:'surpoids', overMuch:'fort surpoids', label:'IMC' },
    sum: {
      takenTimes:'pris {n} fois', timesN:'{n} fois', prn:'si besoin {n}', prnShort:'SB{n}', missed:'✕{n}',
      urineTimes:'urine {n}', urineN:'U{n}', urineRate:'urine {n}/j', stoolTimes:'selles {n}', stoolN:'S{n}',
      diar:'diarrhée {n}', diarShort:'diar. {n}', mlApprox:' (env. {ml} ml)', mlApproxShort:'(env. {ml})',
      tempMax:'max {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal} ml', waterAvg:'{ml} ml ({days} j)',
      hoursDay:'env. {n} h', hoursCell:'~{n}h', hoursAvgCell:'~{n}h ({days}j)',
      wakeDay:'réveils {n}', wakeShort:'rév. {n}', casesN:'{n}', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊 Médic.', water:'🥛 Hydrat.', meal:'🍚 Repas', mealWeek:'🍚 Rien mangé', toilet:'🚻 Toilettes',
      temp:'🌡 Temp.', bp:'❤️ Tension', sleep:'🌙 Sommeil', fall:'⚠ Chute'
    }
  };

  /* ============ es ============ */
  var es = {
    app: { title:'Diario de cuidados en casa - SOYOGI', name:'Diario de cuidados en casa - SOYOGI', ver:'1.0' },
    tab: { today:'Hoy', hist:'Historial', show:'Informe', set:'Ajustes' },
    common: { save:'Guardar', cancel:'Cancelar', empty:'Aún no hay registros', delConfirm:'¿Borrar?' },
    toast: {
      saved:'Guardado ✓',
      savedNoPhoto:'La foto no se pudo guardar por el límite de almacenamiento',
      full:'No se pudo guardar: almacenamiento lleno',
      exported:'Exportado ✓',
      imported:'Importado ✓',
      importFail:'No se pudo leer el archivo',
      waterNoUndo:'No hay tomas de agua que deshacer',
      waterUndone:'Una toma deshecha ✓',
      photoFail:'No se pudo cargar la foto'
    },
    today: {
      records:'Registros de hoy',
      datePrefix:'Hoy',
      gotoSet:'⚙️ En «Ajustes» puede añadir o quitar elementos para registrar',
      gotoSetOff:'⚙️ En «Ajustes» puede añadir o quitar elementos para registrar (ahora OFF: {list})'
    },
    hist: { prev:'◀ Día anterior', next:'Día siguiente ▶', todayMark:'(hoy)', noRecord:'No hay registros de este día' },
    show: {
      noteHead:'Cosas que contar / preocupaciones',
      notePlaceholder:'Anote aquí lo que quiera contar en la consulta o reunión',
      span7title:'Esta semana', span30title:'Este mes', span90title:'Últimos 3 meses',
      span7btn:'1 semana', span30btn:'1 mes', span90btn:'3 meses',
      hint:'Muestre esta pantalla tal cual al médico, a la enfermera o al coordinador de cuidados. La tabla de arriba se crea automáticamente con los registros. Los registros se conservan siempre. Los días anteriores están en «Historial».',
      colDay:'Día', colWeek:'Semana', todayMark:'hoy', thisWeek:'esta semana'
    },
    set: {
      langHead:'🌐 Idioma / Language',
      fontHead:'Tamaño del texto', fsNormal:'Normal', fsLarge:'Grande', fsXL:'Muy grande',
      waterHead:'Objetivo diario de líquidos',
      waterHint:'Los 1200 ml iniciales son la parte de «bebidas» de la referencia del Ministerio de Salud de Japón (unos 2,5 L de agua al día = aprox. 1,0 L de las comidas + aprox. 0,3 L que produce el cuerpo + aprox. 1,2 L de bebidas). Cuente solo las bebidas, no el agua de las comidas. Si hay restricción de líquidos (enfermedad cardíaca o renal), ajuste la cantidad indicada por el médico o la enfermera.',
      heightHead:'Estatura (para calcular el IMC con el peso)',
      heightHint:'Si introduce la estatura, aparecerá una referencia de IMC en los registros de peso. Déjela vacía para no mostrar la valoración.',
      heightPlaceholder:'sin definir',
      itemsHead:'Elementos para registrar',
      backupHead:'Copia de seguridad', export:'Exportar registros', import:'Importar registros',
      backupHint:'Los registros se guardan solo en este dispositivo. No se envía nada. Al cambiar de dispositivo, use «Exportar» para guardar un archivo e «Importar» en el nuevo.',
      credit:'Desarrollo de la aplicación: SOYOGI - Centro de consultas de cuidados y apoyo',
      ver:'Versión 1.0',
      on:'ON', off:'OFF'
    },
    items: {
      water:'Líquidos', med:'Medicación', meal:'Comidas', toilet:'Baño', temp:'Temperatura', sleep:'Noche',
      mood:'Ánimo y estado', carer:'Mi ánimo', fall:'Caída / casi caída', note:'Nota',
      bp:'Tensión y pulso', weight:'Peso', bath:'Baño e higiene', skin:'Piel', wake:'Despertar nocturno',
      sleepSub:'Por la mañana, anote la noche anterior', carerSub:'Para usted, que cuida',
      medHint:'Si hay un motivo (fiebre, dolor, etc.)',
      fallHint:'Cuándo, dónde y cómo (ej.: se tambaleó ante el baño por la mañana)',
      noteHint:'Lo que haya notado (ej.: tos, picores)'
    },
    med: {
      title:'💊 Medicación', taken:'Tomada', prn:'Si es necesario', missed:'No pudo tomarla',
      tonpukuTitle:'💊 Motivo de la dosis «si es necesario»', tonpukuPlaceholder:'Motivo (fiebre, dolor, insomnio, etc.)'
    },
    meal: { title:'🍚 Comidas', full:'Comió todo', half:'La mitad', little:'Un poco', none:'No comió' },
    water: {
      title:'🥛 Líquidos', head:'Líquidos', todayLabel:'Hoy', unit:'ml',
      over:'{n} ml por encima del objetivo', reached:'Objetivo cumplido ◎', remain:'Faltan {n} ml para el objetivo',
      btnCup:'1 vaso 200 ml', btnHalf:'Medio 100 ml', btnSip:'Un poco 50 ml',
      rowCup:'1 vaso', rowHalf:'Medio', rowSip:'Un poco', undo:'⤺ Deshacer una'
    },
    toilet: {
      title:'🚻 Baño', pee:'Orina', poo:'Deposición', peeTitle:'🚻 Orina', pooTitle:'🚻 Deposición',
      u_norm:'Normal (unos 300 ml)', u_much:'Mucha (unos 400 ml)', u_little:'Poca (unos 200 ml)', u_tiny:'Muy poca (unos 100 ml)',
      numEntry:'Introducir un número (bolsa de orina, etc.)', numTitle:'🚻 Orina (ml)', numHint:'Cantidad (ml)',
      s_norm:'Normal', s_soft:'Blanda', s_hard:'Dura', s_diar:'Diarrea',
      obsTitle:'🚻 Aspecto', obsNormal:'Como siempre', obs_color:'El color es distinto', obs_blood:'Puede que haya sangre',
      todaySub:'Hoy: orina {u}, deposiciones {s}'
    },
    temp: { title:'🌡️ Temperatura', notePlaceholder:'ej.: se aplicó frío', unit:'℃' },
    sleep: {
      title:'🌙 Noche', wakeNow:'Se despertó ahora (para la noche)', morning:'Añadir el resumen de la mañana', wokeAtNight:'Se despertó durante la noche',
      summaryTitle:'🌙 Resumen de la mañana', sleptTime:'Se durmió a las', wokeTime:'Se despertó a las', minus30:'−30 min', plus30:'＋30 min',
      hoursLive:'Tiempo dormido: aprox. {n} h', qualityLabel:'Sueño',
      q_good:'Durmió bien', q_ok:'Normal', q_poor:'Sueño ligero',
      rowMain:'Se durmió {sl}, despertó {wk} (aprox. {hrs} h)'
    },
    mood: {
      title:'🙂 Ánimo y estado', calm:'Tranquilo', normal:'Normal', down:'Decaído', irritable:'Irritable', waves:'Grandes altibajos',
      memoHint:'Estado u observaciones (opcional)'
    },
    carer: {
      title:'🍀 Mi ánimo', good:'Bien', ok:'Normal', tired:'Cuesta', verytired:'Cuesta mucho', limit:'Al límite',
      memoHint:'Estado u observaciones (opcional)'
    },
    fall: { title:'⚠️ Caída / casi caída' },
    note: { title:'📝 Nota' },
    bp: {
      title:'❤️ Tensión y pulso', sysLabel:'Alta (sistólica)', diaLabel:'Baja (diastólica)', pulseLabel:'Pulso (si se midió, opcional)',
      pulsePrefix:'pulso ', sysShort:'Sis', diaShort:'Dia', pulseShort:'P'
    },
    weight: { title:'⚖️ Peso', unit:'kg' },
    bath: { title:'🛁 Baño e higiene', tub:'Se bañó en la bañera', wash:'Se lavó el cuerpo', shower:'Se duchó', wipe:'Se le aseó con toalla' },
    skin: {
      title:'🩹 Piel', normal:'Como siempre', concern:'Hay algo que preocupa', concernRow:'Zona a vigilar',
      concernTitle:'🩹 Zona a vigilar', concernPlaceholder:'Lugar y aspecto (ej.: rojez en la cadera derecha)', photoCamera:'📷 Hacer una foto (opcional)', photoAlbum:'🖼 Del álbum (opcional)'
    },
    timeEdit: { title:'Corregir la hora', ok:'Corregir' },
    chip: {
      pulseFast:'rápido', pulseFastMild:'algo rápido', pulseSlow:'lento', pulseSlowMild:'algo lento',
      high:'alta', highMild:'algo alta', low:'baja', lowMild:'algo baja'
    },
    bmi: { thin:'peso bajo', thinMild:'algo delgado', normal:'normal', over:'sobrepeso', overMuch:'sobrepeso alto', label:'IMC' },
    sum: {
      takenTimes:'tomada {n}', timesN:'{n}', prn:'si nec. {n}', prnShort:'SN{n}', missed:'✕{n}',
      urineTimes:'orina {n}', urineN:'O{n}', urineRate:'orina {n}/día', stoolTimes:'depos. {n}', stoolN:'D{n}',
      diar:'diarrea {n}', diarShort:'diar. {n}', mlApprox:' (unos {ml} ml)', mlApproxShort:'(~{ml})',
      tempMax:'máx. {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal} ml', waterAvg:'{ml} ml ({days} d)',
      hoursDay:'aprox. {n} h', hoursCell:'~{n}h', hoursAvgCell:'~{n}h ({days}d)',
      wakeDay:'despertares {n}', wakeShort:'desp. {n}', casesN:'{n}', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊 Medic.', water:'🥛 Líquidos', meal:'🍚 Comidas', mealWeek:'🍚 No comió', toilet:'🚻 Baño',
      temp:'🌡 Temp.', bp:'❤️ Tensión', sleep:'🌙 Sueño', fall:'⚠ Caída'
    }
  };

  /* ============ it ============ */
  var it = {
    app: { title:'Diario di cura a casa - SOYOGI', name:'Diario di cura a casa - SOYOGI', ver:'1.0' },
    tab: { today:'Oggi', hist:'Cronologia', show:'Riepilogo', set:'Impostazioni' },
    common: { save:'Salva', cancel:'Annulla', empty:'Ancora nessuna registrazione', delConfirm:'Eliminare?' },
    toast: {
      saved:'Salvato ✓',
      savedNoPhoto:'La foto non è stata salvata per il limite di spazio',
      full:'Impossibile salvare: spazio pieno',
      exported:'Esportato ✓',
      imported:'Importato ✓',
      importFail:'Impossibile leggere il file',
      waterNoUndo:'Nessuna assunzione da annullare',
      waterUndone:'Una annullata ✓',
      photoFail:'Impossibile caricare la foto'
    },
    today: {
      records:'Registrazioni di oggi',
      datePrefix:'Oggi',
      gotoSet:'⚙️ In «Impostazioni» puoi aggiungere o togliere le voci da registrare',
      gotoSetOff:'⚙️ In «Impostazioni» puoi aggiungere o togliere le voci da registrare (ora OFF: {list})'
    },
    hist: { prev:'◀ Giorno prima', next:'Giorno dopo ▶', todayMark:'(oggi)', noRecord:'Nessuna registrazione in questo giorno' },
    show: {
      noteHead:'Cose da riferire / preoccupazioni',
      notePlaceholder:'Annota qui ciò che vuoi riferire alla visita o al colloquio',
      span7title:'Questa settimana', span30title:'Questo mese', span90title:'Ultimi 3 mesi',
      span7btn:'1 settimana', span30btn:'1 mese', span90btn:'3 mesi',
      hint:'Mostra questa schermata così com’è al medico, all’infermiere o al responsabile dell’assistenza. La tabella qui sopra si crea automaticamente dalle registrazioni. Le registrazioni restano sempre. I giorni passati sono in «Cronologia».',
      colDay:'Giorno', colWeek:'Settimana', todayMark:'oggi', thisWeek:'questa settimana'
    },
    set: {
      langHead:'🌐 Lingua / Language',
      fontHead:'Dimensione del testo', fsNormal:'Normale', fsLarge:'Grande', fsXL:'Molto grande',
      waterHead:'Obiettivo giornaliero di liquidi',
      waterHint:'I 1200 ml iniziali sono la parte di «bevande» del riferimento del Ministero della Salute giapponese (circa 2,5 L di acqua al giorno = ca. 1,0 L dai pasti + ca. 0,3 L prodotti dal corpo + ca. 1,2 L di bevande). Conta solo le bevande, non l’acqua contenuta nei pasti. In caso di restrizione dei liquidi (malattie cardiache o renali), imposta la quantità indicata dal medico o dall’infermiere.',
      heightHead:'Altezza (per calcolare il BMI dal peso)',
      heightHint:'Inserendo l’altezza, sulle pesate compare un riferimento BMI. Lascia vuoto per non mostrare la valutazione.',
      heightPlaceholder:'non impostata',
      itemsHead:'Voci da registrare',
      backupHead:'Backup', export:'Esporta registrazioni', import:'Importa registrazioni',
      backupHint:'Le registrazioni restano solo su questo dispositivo. Non viene inviato nulla. Cambiando dispositivo, usa «Esporta» per salvare un file e «Importa» sul nuovo.',
      credit:'Sviluppo dell’app: SOYOGI - Sportello di consulenza per cura e sostegno',
      ver:'Versione 1.0',
      on:'ON', off:'OFF'
    },
    items: {
      water:'Liquidi', med:'Farmaci', meal:'Pasti', toilet:'Bagno', temp:'Temperatura', sleep:'Notte',
      mood:'Umore e stato', carer:'Il mio umore', fall:'Caduta / quasi caduta', note:'Nota',
      bp:'Pressione e polso', weight:'Peso', bath:'Bagno e igiene', skin:'Pelle', wake:'Risveglio notturno',
      sleepSub:'Al mattino, annota la notte passata', carerSub:'Per te che assisti',
      medHint:'Se c’è un motivo (febbre, dolore, ecc.)',
      fallHint:'Quando, dove e come (es.: ha vacillato davanti al bagno al mattino)',
      noteHint:'Cosa hai notato (es.: tosse, prurito)'
    },
    med: {
      title:'💊 Farmaci', taken:'Assunto', prn:'Al bisogno', missed:'Non assunto',
      tonpukuTitle:'💊 Motivo della dose «al bisogno»', tonpukuPlaceholder:'Motivo (febbre, dolore, insonnia, ecc.)'
    },
    meal: { title:'🍚 Pasti', full:'Ha mangiato tutto', half:'Metà', little:'Poco', none:'Non ha mangiato' },
    water: {
      title:'🥛 Liquidi', head:'Liquidi', todayLabel:'Oggi', unit:'ml',
      over:'{n} ml oltre l’obiettivo', reached:'Obiettivo raggiunto ◎', remain:'Mancano {n} ml all’obiettivo',
      btnCup:'1 bicchiere 200 ml', btnHalf:'Metà 100 ml', btnSip:'Un po’ 50 ml',
      rowCup:'1 bicchiere', rowHalf:'Metà', rowSip:'Un po’', undo:'⤺ Annulla una'
    },
    toilet: {
      title:'🚻 Bagno', pee:'Urina', poo:'Feci', peeTitle:'🚻 Urina', pooTitle:'🚻 Feci',
      u_norm:'Normale (circa 300 ml)', u_much:'Molta (circa 400 ml)', u_little:'Poca (circa 200 ml)', u_tiny:'Pochissima (circa 100 ml)',
      numEntry:'Inserisci un numero (sacca urine, ecc.)', numTitle:'🚻 Urina (ml)', numHint:'Quantità (ml)',
      s_norm:'Normali', s_soft:'Morbide', s_hard:'Dure', s_diar:'Diarrea',
      obsTitle:'🚻 Aspetto', obsNormal:'Come al solito', obs_color:'Colore insolito', obs_blood:'Forse c’è sangue',
      todaySub:'Oggi: urina {u}, feci {s}'
    },
    temp: { title:'🌡️ Temperatura', notePlaceholder:'es.: applicato impacco freddo', unit:'℃' },
    sleep: {
      title:'🌙 Notte', wakeNow:'Sveglio adesso (per la notte)', morning:'Aggiungi il riepilogo del mattino', wokeAtNight:'Sveglio durante la notte',
      summaryTitle:'🌙 Riepilogo del mattino', sleptTime:'Addormentato alle', wokeTime:'Sveglio alle', minus30:'−30 min', plus30:'＋30 min',
      hoursLive:'Tempo di sonno: circa {n} ore', qualityLabel:'Sonno',
      q_good:'Ha dormito bene', q_ok:'Normale', q_poor:'Sonno leggero',
      rowMain:'Addormentato {sl}, sveglio {wk} (circa {hrs} ore)'
    },
    mood: {
      title:'🙂 Umore e stato', calm:'Sereno', normal:'Normale', down:'Giù di tono', irritable:'Irritabile', waves:'Forti sbalzi d’umore',
      memoHint:'Stato o note (facoltativo)'
    },
    carer: {
      title:'🍀 Il mio umore', good:'Bene', ok:'Normale', tired:'Faticoso', verytired:'Molto faticoso', limit:'Al limite',
      memoHint:'Stato o note (facoltativo)'
    },
    fall: { title:'⚠️ Caduta / quasi caduta' },
    note: { title:'📝 Nota' },
    bp: {
      title:'❤️ Pressione e polso', sysLabel:'Massima (sistolica)', diaLabel:'Minima (diastolica)', pulseLabel:'Polso (se misurato, facoltativo)',
      pulsePrefix:'polso ', sysShort:'Max', diaShort:'Min', pulseShort:'P',
    },
    weight: { title:'⚖️ Peso', unit:'kg' },
    bath: { title:'🛁 Bagno e igiene', tub:'Bagno nella vasca', wash:'Corpo lavato', shower:'Doccia fatta', wipe:'Spugnatura (pulito con panno)' },
    skin: {
      title:'🩹 Pelle', normal:'Come al solito', concern:'C’è qualcosa che preoccupa', concernRow:'Zona da osservare',
      concernTitle:'🩹 Zona da osservare', concernPlaceholder:'Punto e aspetto (es.: rossore sull’anca destra)', photoCamera:'📷 Scatta una foto (facoltativo)', photoAlbum:'🖼 Dall’album (facoltativo)'
    },
    timeEdit: { title:'Correggi l’orario', ok:'Correggi' },
    chip: {
      pulseFast:'veloce', pulseFastMild:'un po’ veloce', pulseSlow:'lento', pulseSlowMild:'un po’ lento',
      high:'alta', highMild:'un po’ alta', low:'bassa', lowMild:'un po’ bassa'
    },
    bmi: { thin:'sottopeso', thinMild:'piuttosto magro', normal:'normale', over:'sovrappeso', overMuch:'sovrappeso marcato', label:'BMI' },
    sum: {
      takenTimes:'assunto {n}', timesN:'{n}', prn:'al bisogno {n}', prnShort:'AB{n}', missed:'✕{n}',
      urineTimes:'urina {n}', urineN:'U{n}', urineRate:'urina {n}/g', stoolTimes:'feci {n}', stoolN:'F{n}',
      diar:'diarrea {n}', diarShort:'diar. {n}', mlApprox:' (circa {ml} ml)', mlApproxShort:'(~{ml})',
      tempMax:'max {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal} ml', waterAvg:'{ml} ml ({days} g)',
      hoursDay:'circa {n} ore', hoursCell:'~{n}h', hoursAvgCell:'~{n}h ({days}g)',
      wakeDay:'risvegli {n}', wakeShort:'risv. {n}', casesN:'{n}', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊 Farmaci', water:'🥛 Liquidi', meal:'🍚 Pasti', mealWeek:'🍚 Non mangiato', toilet:'🚻 Bagno',
      temp:'🌡 Temp.', bp:'❤️ Press.', sleep:'🌙 Sonno', fall:'⚠ Caduta'
    }
  };

  /* ============ pt ============ */
  var pt = {
    app: { title:'Diário de cuidados em casa - SOYOGI', name:'Diário de cuidados em casa - SOYOGI', ver:'1.0' },
    tab: { today:'Hoje', hist:'Histórico', show:'Relatório', set:'Configurações' },
    common: { save:'Salvar', cancel:'Cancelar', empty:'Ainda não há registros', delConfirm:'Apagar?' },
    toast: {
      saved:'Salvo ✓',
      savedNoPhoto:'A foto não pôde ser salva pelo limite de armazenamento',
      full:'Não foi possível salvar: armazenamento cheio',
      exported:'Exportado ✓',
      imported:'Importado ✓',
      importFail:'Não foi possível ler o arquivo',
      waterNoUndo:'Nenhuma ingestão para desfazer',
      waterUndone:'Uma desfeita ✓',
      photoFail:'Não foi possível carregar a foto'
    },
    today: {
      records:'Registros de hoje',
      datePrefix:'Hoje',
      gotoSet:'⚙️ Em «Configurações» você pode adicionar ou remover itens para registrar',
      gotoSetOff:'⚙️ Em «Configurações» você pode adicionar ou remover itens para registrar (agora OFF: {list})'
    },
    hist: { prev:'◀ Dia anterior', next:'Dia seguinte ▶', todayMark:'(hoje)', noRecord:'Não há registros neste dia' },
    show: {
      noteHead:'O que contar / preocupações',
      notePlaceholder:'Anote aqui o que quer contar na consulta ou reunião',
      span7title:'Esta semana', span30title:'Este mês', span90title:'Últimos 3 meses',
      span7btn:'1 semana', span30btn:'1 mês', span90btn:'3 meses',
      hint:'Mostre esta tela como está ao médico, à enfermeira ou ao coordenador de cuidados. A tabela acima é criada automaticamente a partir dos registros. Os registros ficam guardados para sempre. Os dias antigos estão em «Histórico».',
      colDay:'Dia', colWeek:'Semana', todayMark:'hoje', thisWeek:'esta semana'
    },
    set: {
      langHead:'🌐 Idioma / Language',
      fontHead:'Tamanho do texto', fsNormal:'Normal', fsLarge:'Grande', fsXL:'Muito grande',
      waterHead:'Meta diária de líquidos',
      waterHint:'Os 1200 ml iniciais são a parte de «bebidas» da referência do Ministério da Saúde do Japão (cerca de 2,5 L de água por dia = aprox. 1,0 L das refeições + aprox. 0,3 L produzidos pelo corpo + aprox. 1,2 L de bebidas). Conte apenas as bebidas, não a água das refeições. Se houver restrição de líquidos (doença cardíaca ou renal), ajuste para a quantidade indicada pelo médico ou enfermeira.',
      heightHead:'Altura (para calcular o IMC com o peso)',
      heightHint:'Com a altura preenchida, uma referência de IMC aparece nos registros de peso. Deixe em branco para não mostrar a avaliação.',
      heightPlaceholder:'não definida',
      itemsHead:'Itens para registrar',
      backupHead:'Backup', export:'Exportar registros', import:'Importar registros',
      backupHint:'Os registros ficam apenas neste aparelho. Nada é enviado. Ao trocar de aparelho, use «Exportar» para salvar um arquivo e «Importar» no novo.',
      credit:'Desenvolvimento do app: SOYOGI - Centro de consultas de cuidado e apoio',
      ver:'Versão 1.0',
      on:'ON', off:'OFF'
    },
    items: {
      water:'Líquidos', med:'Medicamentos', meal:'Refeições', toilet:'Banheiro', temp:'Temperatura', sleep:'Noite',
      mood:'Humor e estado', carer:'Meu ânimo', fall:'Queda / quase queda', note:'Nota',
      bp:'Pressão e pulso', weight:'Peso', bath:'Banho e higiene', skin:'Pele', wake:'Despertar noturno',
      sleepSub:'De manhã, registre a noite anterior', carerSub:'Para você, que cuida',
      medHint:'Se houver um motivo (febre, dor, etc.)',
      fallHint:'Quando, onde e como (ex.: cambaleou diante do banheiro de manhã)',
      noteHint:'O que você notou (ex.: tosse, coceira)'
    },
    med: {
      title:'💊 Medicamentos', taken:'Tomou', prn:'Se necessário', missed:'Não conseguiu tomar',
      tonpukuTitle:'💊 Motivo da dose «se necessário»', tonpukuPlaceholder:'Motivo (febre, dor, insônia, etc.)'
    },
    meal: { title:'🍚 Refeições', full:'Comeu tudo', half:'Metade', little:'Um pouco', none:'Não comeu' },
    water: {
      title:'🥛 Líquidos', head:'Líquidos', todayLabel:'Hoje', unit:'ml',
      over:'{n} ml acima da meta', reached:'Meta atingida ◎', remain:'Faltam {n} ml para a meta',
      btnCup:'1 copo 200 ml', btnHalf:'Metade 100 ml', btnSip:'Um pouco 50 ml',
      rowCup:'1 copo', rowHalf:'Metade', rowSip:'Um pouco', undo:'⤺ Desfazer uma'
    },
    toilet: {
      title:'🚻 Banheiro', pee:'Urina', poo:'Fezes', peeTitle:'🚻 Urina', pooTitle:'🚻 Fezes',
      u_norm:'Normal (cerca de 300 ml)', u_much:'Muita (cerca de 400 ml)', u_little:'Pouca (cerca de 200 ml)', u_tiny:'Muito pouca (cerca de 100 ml)',
      numEntry:'Inserir um número (bolsa coletora, etc.)', numTitle:'🚻 Urina (ml)', numHint:'Quantidade (ml)',
      s_norm:'Normais', s_soft:'Moles', s_hard:'Duras', s_diar:'Diarreia',
      obsTitle:'🚻 Aspecto', obsNormal:'Como sempre', obs_color:'Cor diferente do habitual', obs_blood:'Talvez com sangue',
      todaySub:'Hoje: urina {u}, fezes {s}'
    },
    temp: { title:'🌡️ Temperatura', notePlaceholder:'ex.: fez compressa fria', unit:'℃' },
    sleep: {
      title:'🌙 Noite', wakeNow:'Acordou agora (para a madrugada)', morning:'Adicionar o resumo da manhã', wokeAtNight:'Acordou durante a noite',
      summaryTitle:'🌙 Resumo da manhã', sleptTime:'Dormiu às', wokeTime:'Acordou às', minus30:'−30 min', plus30:'＋30 min',
      hoursLive:'Tempo de sono: cerca de {n} h', qualityLabel:'Sono',
      q_good:'Dormiu bem', q_ok:'Normal', q_poor:'Sono leve',
      rowMain:'Dormiu {sl}, acordou {wk} (cerca de {hrs} h)'
    },
    mood: {
      title:'🙂 Humor e estado', calm:'Tranquilo', normal:'Normal', down:'Desanimado', irritable:'Irritado', waves:'Grandes oscilações',
      memoHint:'Estado ou observações (opcional)'
    },
    carer: {
      title:'🍀 Meu ânimo', good:'Bem', ok:'Normal', tired:'Difícil', verytired:'Muito difícil', limit:'No limite',
      memoHint:'Estado ou observações (opcional)'
    },
    fall: { title:'⚠️ Queda / quase queda' },
    note: { title:'📝 Nota' },
    bp: {
      title:'❤️ Pressão e pulso', sysLabel:'Máxima (sistólica)', diaLabel:'Mínima (diastólica)', pulseLabel:'Pulso (se medido, opcional)',
      pulsePrefix:'pulso ', sysShort:'Máx', diaShort:'Mín', pulseShort:'P'
    },
    weight: { title:'⚖️ Peso', unit:'kg' },
    bath: { title:'🛁 Banho e higiene', tub:'Banho de banheira', wash:'Lavou o corpo', shower:'Tomou ducha', wipe:'Corpo limpo com pano' },
    skin: {
      title:'🩹 Pele', normal:'Como sempre', concern:'Algo preocupa', concernRow:'Área a observar',
      concernTitle:'🩹 Área a observar', concernPlaceholder:'Local e aspecto (ex.: vermelhidão no quadril direito)', photoCamera:'📷 Tirar uma foto (opcional)', photoAlbum:'🖼 Do álbum (opcional)'
    },
    timeEdit: { title:'Corrigir o horário', ok:'Corrigir' },
    chip: {
      pulseFast:'rápido', pulseFastMild:'um pouco rápido', pulseSlow:'lento', pulseSlowMild:'um pouco lento',
      high:'alta', highMild:'um pouco alta', low:'baixa', lowMild:'um pouco baixa'
    },
    bmi: { thin:'abaixo do peso', thinMild:'um pouco magro', normal:'normal', over:'acima do peso', overMuch:'bem acima do peso', label:'IMC' },
    sum: {
      takenTimes:'tomou {n}', timesN:'{n}', prn:'se nec. {n}', prnShort:'SN{n}', missed:'✕{n}',
      urineTimes:'urina {n}', urineN:'U{n}', urineRate:'urina {n}/dia', stoolTimes:'fezes {n}', stoolN:'F{n}',
      diar:'diarreia {n}', diarShort:'diar. {n}', mlApprox:' (cerca de {ml} ml)', mlApproxShort:'(~{ml})',
      tempMax:'máx. {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal} ml', waterAvg:'{ml} ml ({days} d)',
      hoursDay:'cerca de {n} h', hoursCell:'~{n}h', hoursAvgCell:'~{n}h ({days}d)',
      wakeDay:'despertares {n}', wakeShort:'desp. {n}', casesN:'{n}', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊 Medic.', water:'🥛 Líquidos', meal:'🍚 Refeições', mealWeek:'🍚 Não comeu', toilet:'🚻 Banheiro',
      temp:'🌡 Temp.', bp:'❤️ Pressão', sleep:'🌙 Sono', fall:'⚠ Queda'
    }
  };

  /* ============ nl ============ */
  var nl = {
    app: { title:'Zorgdagboek thuis - SOYOGI', name:'Zorgdagboek thuis - SOYOGI', ver:'1.0' },
    tab: { today:'Vandaag', hist:'Overzicht', show:'Rapport', set:'Instellingen' },
    common: { save:'Opslaan', cancel:'Annuleren', empty:'Nog geen registraties', delConfirm:'Wissen?' },
    toast: {
      saved:'Opgeslagen ✓',
      savedNoPhoto:'De foto kon niet worden bewaard (opslaglimiet)',
      full:'Opslaan niet mogelijk: opslag is vol',
      exported:'Geëxporteerd ✓',
      imported:'Geïmporteerd ✓',
      importFail:'Het bestand kon niet worden gelezen',
      waterNoUndo:'Geen inname om ongedaan te maken',
      waterUndone:'Eén ongedaan gemaakt ✓',
      photoFail:'De foto kon niet worden geladen'
    },
    today: {
      records:'Registraties van vandaag',
      datePrefix:'Vandaag',
      gotoSet:'⚙️ Bij "Instellingen" kunt u onderdelen toevoegen of weghalen',
      gotoSetOff:'⚙️ Bij "Instellingen" kunt u onderdelen toevoegen of weghalen (nu UIT: {list})'
    },
    hist: { prev:'◀ Vorige dag', next:'Volgende dag ▶', todayMark:'(vandaag)', noRecord:'Geen registraties op deze dag' },
    show: {
      noteHead:'Door te geven / zorgen',
      notePlaceholder:'Noteer hier wat u bij het bezoek of gesprek wilt vertellen',
      span7title:'Deze week', span30title:'Deze maand', span90title:'Afgelopen 3 maanden',
      span7btn:'1 week', span30btn:'1 maand', span90btn:'3 maanden',
      hint:'Laat dit scherm zo zien aan de arts, verpleegkundige of zorgcoördinator. De tabel hierboven wordt automatisch gemaakt uit de registraties. De registraties zelf blijven bewaard. Oudere dagen vindt u bij "Overzicht".',
      colDay:'Dag', colWeek:'Week', todayMark:'vandaag', thisWeek:'deze week'
    },
    set: {
      langHead:'🌐 Taal / Language',
      fontHead:'Tekstgrootte', fsNormal:'Normaal', fsLarge:'Groot', fsXL:'Extra groot',
      waterHead:'Dagelijks vochtdoel',
      waterHint:'De eerste 1200 ml is het "drinkvocht"-deel van de richtlijn van het Japanse ministerie van Volksgezondheid (ongeveer 2,5 L water per dag = ca. 1,0 L uit maaltijden + ca. 0,3 L door het lichaam aangemaakt + ca. 1,2 L drinken). Tel alleen drinken mee, niet het vocht in maaltijden. Bij vochtbeperking (hart- of nierziekte) stelt u de hoeveelheid in die de arts of verpleegkundige heeft genoemd.',
      heightHead:'Lengte (voor de BMI-berekening bij gewicht)',
      heightHint:'Met een ingevulde lengte verschijnt bij het gewicht een BMI-indicatie. Laat leeg om geen beoordeling te tonen.',
      heightPlaceholder:'niet ingesteld',
      itemsHead:'Onderdelen om te registreren',
      backupHead:'Back-up', export:'Registraties exporteren', import:'Registraties importeren',
      backupHint:'Registraties staan alleen op dit apparaat. Er wordt niets verzonden. Bij een nieuw apparaat: "Exporteren" naar een bestand en op het nieuwe apparaat "Importeren".',
      credit:'App-ontwikkeling: SOYOGI - Adviespunt voor zorg en ondersteuning',
      ver:'Versie 1.0',
      on:'AAN', off:'UIT'
    },
    items: {
      water:'Vocht', med:'Medicijnen', meal:'Maaltijden', toilet:'Toilet', temp:'Temperatuur', sleep:'Nacht',
      mood:'Stemming', carer:'Mijn stemming', fall:'Val / bijna-val', note:'Notitie',
      bp:'Bloeddruk & pols', weight:'Gewicht', bath:'Wassen', skin:'Huid', wake:'Nachtelijk ontwaken',
      sleepSub:'Noteer ’s ochtends de afgelopen nacht', carerSub:'Voor u als mantelzorger',
      medHint:'Als er een reden is (koorts, pijn, enz.)',
      fallHint:'Wanneer, waar en hoe (bijv. ’s ochtends gewankeld voor het toilet)',
      noteHint:'Wat u opviel (bijv. hoesten, jeuk)'
    },
    med: {
      title:'💊 Medicijnen', taken:'Ingenomen', prn:'Zo nodig', missed:'Niet ingenomen',
      tonpukuTitle:'💊 Reden voor de "zo nodig"-dosis', tonpukuPlaceholder:'Reden (koorts, pijn, slapeloosheid, enz.)'
    },
    meal: { title:'🍚 Maaltijden', full:'Alles opgegeten', half:'De helft', little:'Een beetje', none:'Niet gegeten' },
    water: {
      title:'🥛 Vocht', head:'Vocht', todayLabel:'Vandaag', unit:'ml',
      over:'{n} ml boven het doel', reached:'Doel gehaald ◎', remain:'Nog {n} ml tot het doel',
      btnCup:'1 glas 200 ml', btnHalf:'Half 100 ml', btnSip:'Beetje 50 ml',
      rowCup:'1 glas', rowHalf:'Half', rowSip:'Beetje', undo:'⤺ Eén terug'
    },
    toilet: {
      title:'🚻 Toilet', pee:'Urine', poo:'Ontlasting', peeTitle:'🚻 Urine', pooTitle:'🚻 Ontlasting',
      u_norm:'Normaal (ca. 300 ml)', u_much:'Veel (ca. 400 ml)', u_little:'Weinig (ca. 200 ml)', u_tiny:'Heel weinig (ca. 100 ml)',
      numEntry:'Getal invoeren (urinezak enz.)', numTitle:'🚻 Urine (ml)', numHint:'Hoeveelheid (ml)',
      s_norm:'Normaal', s_soft:'Zacht', s_hard:'Hard', s_diar:'Diarree',
      obsTitle:'🚻 Bijzonderheden', obsNormal:'Zoals altijd', obs_color:'Kleur wijkt af', obs_blood:'Mogelijk wat bloed',
      todaySub:'Vandaag: urine {u}, ontlasting {s}'
    },
    temp: { title:'🌡️ Temperatuur', notePlaceholder:'bijv. gekoeld', unit:'℃' },
    sleep: {
      title:'🌙 Nacht', wakeNow:'Nu wakker geworden (voor ’s nachts)', morning:'Ochtendsamenvatting toevoegen', wokeAtNight:'’s Nachts wakker geworden',
      summaryTitle:'🌙 Ochtendsamenvatting', sleptTime:'In slaap om', wokeTime:'Wakker om', minus30:'−30 min', plus30:'＋30 min',
      hoursLive:'Slaapduur: ca. {n} uur', qualityLabel:'Slaap',
      q_good:'Goed geslapen', q_ok:'Normaal', q_poor:'Licht geslapen',
      rowMain:'In slaap {sl}, wakker {wk} (ca. {hrs} uur)'
    },
    mood: {
      title:'🙂 Stemming', calm:'Rustig', normal:'Normaal', down:'Lusteloos', irritable:'Prikkelbaar', waves:'Sterke schommelingen',
      memoHint:'Toestand of opmerkingen (optioneel)'
    },
    carer: {
      title:'🍀 Mijn stemming', good:'Goed', ok:'Normaal', tired:'Zwaar', verytired:'Erg zwaar', limit:'Op mijn grens',
      memoHint:'Toestand of opmerkingen (optioneel)'
    },
    fall: { title:'⚠️ Val / bijna-val' },
    note: { title:'📝 Notitie' },
    bp: {
      title:'❤️ Bloeddruk & pols', sysLabel:'Bovendruk (systolisch)', diaLabel:'Onderdruk (diastolisch)', pulseLabel:'Pols (indien gemeten, optioneel)',
      pulsePrefix:'pols ', sysShort:'Boven', diaShort:'Onder', pulseShort:'P'
    },
    weight: { title:'⚖️ Gewicht', unit:'kg' },
    bath: { title:'🛁 Wassen', tub:'In bad geweest', wash:'Lichaam gewassen', shower:'Gedoucht', wipe:'Lichaam afgesponsd' },
    skin: {
      title:'🩹 Huid', normal:'Zoals altijd', concern:'Er valt iets op', concernRow:'Aandachtsplek',
      concernTitle:'🩹 Aandachtsplek', concernPlaceholder:'Plek en toestand (bijv. roodheid op de rechterheup)', photoCamera:'📷 Foto maken (optioneel)', photoAlbum:'🖼 Uit het album (optioneel)'
    },
    timeEdit: { title:'Tijd aanpassen', ok:'Aanpassen' },
    chip: {
      pulseFast:'snel', pulseFastMild:'wat snel', pulseSlow:'traag', pulseSlowMild:'wat traag',
      high:'hoog', highMild:'wat hoog', low:'laag', lowMild:'wat laag'
    },
    bmi: { thin:'ondergewicht', thinMild:'aan de magere kant', normal:'normaal', over:'overgewicht', overMuch:'fors overgewicht', label:'BMI' },
    sum: {
      takenTimes:'{n}× ingenomen', timesN:'{n}×', prn:'zo nodig {n}', prnShort:'ZN{n}', missed:'✕{n}',
      urineTimes:'urine {n}', urineN:'U{n}', urineRate:'urine {n}/dag', stoolTimes:'ontlasting {n}', stoolN:'O{n}',
      diar:'diarree {n}', diarShort:'diar. {n}', mlApprox:' (ca. {ml} ml)', mlApproxShort:'(ca. {ml})',
      tempMax:'max. {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal} ml', waterAvg:'{ml} ml ({days} d)',
      hoursDay:'ca. {n} uur', hoursCell:'~{n}u', hoursAvgCell:'~{n}u ({days}d)',
      wakeDay:'ontwaken {n}', wakeShort:'ontw. {n}', casesN:'{n}', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊 Medic.', water:'🥛 Vocht', meal:'🍚 Eten', mealWeek:'🍚 Niet gegeten', toilet:'🚻 Toilet',
      temp:'🌡 Temp.', bp:'❤️ Bloeddruk', sleep:'🌙 Slaap', fall:'⚠ Val'
    }
  };

  /* ============ sv ============ */
  var sv = {
    app: { title:'Omsorgsdagbok hemma - SOYOGI', name:'Omsorgsdagbok hemma - SOYOGI', ver:'1.0' },
    tab: { today:'Idag', hist:'Historik', show:'Rapport', set:'Inställningar' },
    common: { save:'Spara', cancel:'Avbryt', empty:'Inga anteckningar ännu', delConfirm:'Radera?' },
    toast: {
      saved:'Sparat ✓',
      savedNoPhoto:'Fotot kunde inte sparas på grund av lagringsgränsen',
      full:'Kunde inte spara: lagringen är full',
      exported:'Exporterat ✓',
      imported:'Importerat ✓',
      importFail:'Filen kunde inte läsas',
      waterNoUndo:'Inget vattenintag att ångra',
      waterUndone:'Ett ångrat ✓',
      photoFail:'Fotot kunde inte laddas'
    },
    today: {
      records:'Dagens anteckningar',
      datePrefix:'Idag',
      gotoSet:'⚙️ Under "Inställningar" kan du lägga till eller ta bort punkter att anteckna',
      gotoSetOff:'⚙️ Under "Inställningar" kan du lägga till eller ta bort punkter att anteckna (nu AV: {list})'
    },
    hist: { prev:'◀ Föregående dag', next:'Nästa dag ▶', todayMark:'(idag)', noRecord:'Inga anteckningar den här dagen' },
    show: {
      noteHead:'Att berätta / oro',
      notePlaceholder:'Skriv här vad du vill berätta vid besöket eller mötet',
      span7title:'Denna vecka', span30title:'Denna månad', span90title:'Senaste 3 månaderna',
      span7btn:'1 vecka', span30btn:'1 månad', span90btn:'3 månader',
      hint:'Visa den här skärmen som den är för läkaren, sjuksköterskan eller omsorgssamordnaren. Tabellen ovan skapas automatiskt av anteckningarna. Anteckningarna finns alltid kvar. Äldre dagar hittar du under "Historik".',
      colDay:'Dag', colWeek:'Vecka', todayMark:'idag', thisWeek:'denna vecka'
    },
    set: {
      langHead:'🌐 Språk / Language',
      fontHead:'Textstorlek', fsNormal:'Normal', fsLarge:'Stor', fsXL:'Extra stor',
      waterHead:'Dagligt vätskemål',
      waterHint:'De första 1200 ml är "dryckesdelen" av riktvärdet från Japans hälsoministerium (cirka 2,5 L vatten per dag = ca 1,0 L från maten + ca 0,3 L som kroppen bildar + ca 1,2 L dryck). Räkna bara dryck, inte vattnet i maten. Vid vätskerestriktion (hjärt- eller njursjukdom) ställer du in den mängd som läkaren eller sjuksköterskan angett.',
      heightHead:'Längd (används för BMI-beräkning vid vikt)',
      heightHint:'Med längden ifylld visas en BMI-vägledning vid viktanteckningar. Lämna tomt för att inte visa bedömningen.',
      heightPlaceholder:'ej angiven',
      itemsHead:'Punkter att anteckna',
      backupHead:'Säkerhetskopia', export:'Exportera anteckningar', import:'Importera anteckningar',
      backupHint:'Anteckningarna sparas bara på den här enheten. Inget skickas någonstans. Vid byte av enhet: "Exportera" till en fil och "Importera" på den nya enheten.',
      credit:'Apputveckling: SOYOGI - Rådgivning för omsorg och stöd',
      ver:'Version 1.0',
      on:'PÅ', off:'AV'
    },
    items: {
      water:'Vätska', med:'Läkemedel', meal:'Måltider', toilet:'Toalett', temp:'Temperatur', sleep:'Natt',
      mood:'Humör & tillstånd', carer:'Mitt mående', fall:'Fall / nära fall', note:'Anteckning',
      bp:'Blodtryck & puls', weight:'Vikt', bath:'Bad & hygien', skin:'Hud', wake:'Nattligt uppvaknande',
      sleepSub:'Anteckna natten på morgonen', carerSub:'För dig som vårdar',
      medHint:'Om det finns en orsak (feber, smärta osv.)',
      fallHint:'När, var och hur (t.ex. vinglade framför toaletten på morgonen)',
      noteHint:'Det du lagt märke till (t.ex. hosta, klåda)'
    },
    med: {
      title:'💊 Läkemedel', taken:'Tagit', prn:'Vid behov', missed:'Kunde inte ta',
      tonpukuTitle:'💊 Orsak till vid behov-dosen', tonpukuPlaceholder:'Orsak (feber, smärta, sömnlöshet osv.)'
    },
    meal: { title:'🍚 Måltider', full:'Åt allt', half:'Hälften', little:'Lite', none:'Åt inget' },
    water: {
      title:'🥛 Vätska', head:'Vätska', todayLabel:'Idag', unit:'ml',
      over:'{n} ml över målet', reached:'Målet nått ◎', remain:'{n} ml kvar till målet',
      btnCup:'1 glas 200 ml', btnHalf:'Halvt 100 ml', btnSip:'Lite 50 ml',
      rowCup:'1 glas', rowHalf:'Halvt', rowSip:'Lite', undo:'⤺ Ångra ett'
    },
    toilet: {
      title:'🚻 Toalett', pee:'Urin', poo:'Avföring', peeTitle:'🚻 Urin', pooTitle:'🚻 Avföring',
      u_norm:'Normal (ca 300 ml)', u_much:'Mycket (ca 400 ml)', u_little:'Lite (ca 200 ml)', u_tiny:'Mycket lite (ca 100 ml)',
      numEntry:'Ange en siffra (urinpåse osv.)', numTitle:'🚻 Urin (ml)', numHint:'Mängd (ml)',
      s_norm:'Normal', s_soft:'Lös', s_hard:'Hård', s_diar:'Diarré',
      obsTitle:'🚻 Utseende', obsNormal:'Som vanligt', obs_color:'Färgen ser annorlunda ut', obs_blood:'Möjligen lite blod',
      todaySub:'Idag: urin {u}, avföring {s}'
    },
    temp: { title:'🌡️ Temperatur', notePlaceholder:'t.ex. kylde ner', unit:'℃' },
    sleep: {
      title:'🌙 Natt', wakeNow:'Vaknade just nu (för natten)', morning:'Lägg till morgonsammanfattning', wokeAtNight:'Vaknade under natten',
      summaryTitle:'🌙 Morgonsammanfattning', sleptTime:'Somnade kl.', wokeTime:'Vaknade kl.', minus30:'−30 min', plus30:'＋30 min',
      hoursLive:'Sömntid: ca {n} tim', qualityLabel:'Sömn',
      q_good:'Sov gott', q_ok:'Normalt', q_poor:'Sov lätt',
      rowMain:'Somnade {sl}, vaknade {wk} (ca {hrs} tim)'
    },
    mood: {
      title:'🙂 Humör & tillstånd', calm:'Lugn', normal:'Normal', down:'Håglös', irritable:'Irriterad', waves:'Stora svängningar',
      memoHint:'Tillstånd eller anteckningar (valfritt)'
    },
    carer: {
      title:'🍀 Mitt mående', good:'Bra', ok:'Normalt', tired:'Tungt', verytired:'Mycket tungt', limit:'Vid min gräns',
      memoHint:'Tillstånd eller anteckningar (valfritt)'
    },
    fall: { title:'⚠️ Fall / nära fall' },
    note: { title:'📝 Anteckning' },
    bp: {
      title:'❤️ Blodtryck & puls', sysLabel:'Övertryck (systoliskt)', diaLabel:'Undertryck (diastoliskt)', pulseLabel:'Puls (om uppmätt, valfritt)',
      pulsePrefix:'puls ', sysShort:'Öv', diaShort:'Un', pulseShort:'P'
    },
    weight: { title:'⚖️ Vikt', unit:'kg' },
    bath: { title:'🛁 Bad & hygien', tub:'Badade i badkar', wash:'Tvättade kroppen', shower:'Duschade', wipe:'Torkade av kroppen' },
    skin: {
      title:'🩹 Hud', normal:'Som vanligt', concern:'Något ser annorlunda ut', concernRow:'Ställe att bevaka',
      concernTitle:'🩹 Ställe att bevaka', concernPlaceholder:'Plats och utseende (t.ex. rodnad på höger höft)', photoCamera:'📷 Ta ett foto (valfritt)', photoAlbum:'🖼 Från albumet (valfritt)'
    },
    timeEdit: { title:'Ändra tiden', ok:'Ändra' },
    chip: {
      pulseFast:'snabb', pulseFastMild:'lite snabb', pulseSlow:'långsam', pulseSlowMild:'lite långsam',
      high:'högt', highMild:'lite högt', low:'lågt', lowMild:'lite lågt'
    },
    bmi: { thin:'undervikt', thinMild:'något smal', normal:'normal', over:'övervikt', overMuch:'kraftig övervikt', label:'BMI' },
    sum: {
      takenTimes:'tagit {n}', timesN:'{n}', prn:'v.b. {n}', prnShort:'VB{n}', missed:'✕{n}',
      urineTimes:'urin {n}', urineN:'U{n}', urineRate:'urin {n}/dag', stoolTimes:'avföring {n}', stoolN:'A{n}',
      diar:'diarré {n}', diarShort:'diar. {n}', mlApprox:' (ca {ml} ml)', mlApproxShort:'(ca {ml})',
      tempMax:'max {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal} ml', waterAvg:'{ml} ml ({days} d)',
      hoursDay:'ca {n} tim', hoursCell:'~{n}h', hoursAvgCell:'~{n}h ({days}d)',
      wakeDay:'uppvaknanden {n}', wakeShort:'uppv. {n}', casesN:'{n}', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊 Läkem.', water:'🥛 Vätska', meal:'🍚 Mat', mealWeek:'🍚 Åt inget', toilet:'🚻 Toalett',
      temp:'🌡 Temp.', bp:'❤️ Blodtryck', sleep:'🌙 Sömn', fall:'⚠ Fall'
    }
  };

  /* ============ ko ============ */
  var ko = {
    app: { title:'우리집 돌봄 기록 - SOYOGI', name:'우리집 돌봄 기록 - SOYOGI', ver:'1.0' },
    tab: { today:'오늘', hist:'지난 기록', show:'보여주기', set:'설정' },
    common: { save:'기록하기', cancel:'취소', empty:'아직 기록이 없습니다', delConfirm:'지울까요?' },
    toast: {
      saved:'기록했습니다 ✓',
      savedNoPhoto:'저장 공간이 부족해 사진은 저장하지 못했습니다',
      full:'저장 공간이 가득 차서 저장하지 못했습니다',
      exported:'내보냈습니다 ✓',
      imported:'불러왔습니다 ✓',
      importFail:'파일을 읽을 수 없습니다',
      waterNoUndo:'되돌릴 수분 기록이 없습니다',
      waterUndone:'하나 되돌렸습니다 ✓',
      photoFail:'사진을 불러올 수 없습니다'
    },
    today: {
      records:'오늘의 기록',
      datePrefix:'오늘',
      gotoSet:'⚙️ 기록할 항목은 「설정」에서 늘리거나 줄일 수 있습니다',
      gotoSetOff:'⚙️ 기록할 항목은 「설정」에서 늘리거나 줄일 수 있습니다 (지금 OFF: {list})'
    },
    hist: { prev:'◀ 전날', next:'다음날 ▶', todayMark:'(오늘)', noRecord:'이 날의 기록이 없습니다' },
    show: {
      noteHead:'전하고 싶은 것 · 걱정되는 것',
      notePlaceholder:'진료나 상담 때 전하고 싶은 내용을 여기에 메모해 두세요',
      span7title:'최근 1주일', span30title:'최근 1개월', span90title:'최근 3개월',
      span7btn:'1주일', span30btn:'1개월', span90btn:'3개월',
      hint:'이 화면을 그대로 의사·간호사·케어매니저에게 보여주세요. 위의 표는 기록에서 자동으로 만들어집니다. 기록 자체는 계속 남습니다. 지난 날짜는 「지난 기록」에서 볼 수 있습니다.',
      colDay:'날짜', colWeek:'주', todayMark:'오늘', thisWeek:'이번 주'
    },
    set: {
      langHead:'🌐 언어 / Language',
      fontHead:'글자 크기', fsNormal:'보통', fsLarge:'크게', fsXL:'아주 크게',
      waterHead:'하루 수분 목표량',
      waterHint:'처음 설정된 1200ml는 일본 후생노동성 기준(하루에 필요한 수분 약 2.5L = 식사에서 약 1.0L + 몸에서 만들어지는 약 0.3L + 마시는 물 약 1.2L) 중 「마시는 물」의 양입니다. 식사에 포함된 수분은 빼고, 마신 것만 세어 주세요. 심장·신장 질환 등으로 수분 제한이 있는 분은 의사·간호사가 알려준 양으로 바꿔 주세요.',
      heightHead:'키 (체중의 BMI 계산에 사용)',
      heightHint:'키를 입력하면 체중 기록에 BMI 기준이 표시됩니다. 비워 두면 판정이 나오지 않습니다.',
      heightPlaceholder:'미설정',
      itemsHead:'기록할 항목',
      backupHead:'백업', export:'기록 내보내기', import:'기록 불러오기',
      backupHint:'기록은 이 기기 안에만 저장됩니다. 어디에도 전송되지 않습니다. 기기를 바꿀 때는 「내보내기」로 파일을 저장한 뒤 새 기기에서 「불러오기」 해 주세요.',
      credit:'앱 개발: SOYOGI - 돌봄과 지원 상담소',
      ver:'버전 1.0',
      on:'ON', off:'OFF'
    },
    items: {
      water:'수분', med:'약', meal:'식사', toilet:'화장실', temp:'체온', sleep:'밤사이',
      mood:'기분·상태', carer:'나의 기분', fall:'넘어짐·아차사고', note:'메모',
      bp:'혈압·맥박', weight:'체중', bath:'목욕', skin:'피부 상태', wake:'밤중에 깸',
      sleepSub:'아침에 어젯밤 일을 기록', carerSub:'돌보는 나 자신의',
      medHint:'이유가 있으면 (열·통증 등)',
      fallHint:'언제·어디서·어떻게 (예: 아침에 화장실 앞에서 휘청거림)',
      noteHint:'알아차린 것 (예: 기침, 가려움)'
    },
    med: {
      title:'💊 약', taken:'먹었어요', prn:'필요시 약', missed:'못 먹었어요',
      tonpukuTitle:'💊 필요시 약을 쓴 이유', tonpukuPlaceholder:'이유 (열·통증·잠이 안 옴 등)'
    },
    meal: { title:'🍚 식사', full:'다 먹음', half:'절반', little:'조금', none:'못 먹음' },
    water: {
      title:'🥛 수분', head:'수분', todayLabel:'오늘', unit:'ml',
      over:'목표보다 {n}ml 많아요', reached:'목표 달성 ◎', remain:'목표까지 {n}ml',
      btnCup:'한 컵 200ml', btnHalf:'반 컵 100ml', btnSip:'조금 50ml',
      rowCup:'한 컵', rowHalf:'반 컵', rowSip:'조금', undo:'⤺ 하나 되돌리기'
    },
    toilet: {
      title:'🚻 화장실', pee:'소변', poo:'대변', peeTitle:'🚻 소변', pooTitle:'🚻 대변',
      u_norm:'보통 (약 300ml)', u_much:'많음 (약 400ml)', u_little:'적음 (약 200ml)', u_tiny:'아주 적음 (약 100ml)',
      numEntry:'숫자로 입력 (소변주머니 등)', numTitle:'🚻 소변 (ml)', numHint:'양 (ml)',
      s_norm:'보통', s_soft:'무름', s_hard:'딱딱함', s_diar:'설사',
      obsTitle:'🚻 상태', obsNormal:'평소와 같음', obs_color:'색이 평소와 다름', obs_blood:'피가 섞였을지도',
      todaySub:'오늘 소변 {u}회 · 대변 {s}회'
    },
    temp: { title:'🌡️ 체온', notePlaceholder:'예: 몸을 식혀 줌', unit:'℃' },
    sleep: {
      title:'🌙 밤사이', wakeNow:'지금 잠에서 깼어요 (밤중용)', morning:'아침 정리 기록하기', wokeAtNight:'밤중에 잠에서 깸',
      summaryTitle:'🌙 아침 정리', sleptTime:'잠든 시각', wokeTime:'일어난 시각', minus30:'−30분', plus30:'＋30분',
      hoursLive:'잔 시간 약 {n}시간', qualityLabel:'잠',
      q_good:'푹 잤어요', q_ok:'보통', q_poor:'얕게 잤어요',
      rowMain:'취침 {sl} 기상 {wk} (약 {hrs}시간)'
    },
    mood: {
      title:'🙂 기분·상태', calm:'온화함', normal:'보통', down:'기운 없음', irritable:'짜증·예민함', waves:'기복이 심함',
      memoHint:'상태나 메모 (선택)'
    },
    carer: {
      title:'🍀 나의 기분', good:'좋음', ok:'보통', tired:'힘듦', verytired:'많이 힘듦', limit:'한계',
      memoHint:'상태나 메모 (선택)'
    },
    fall: { title:'⚠️ 넘어짐·아차사고' },
    note: { title:'📝 메모' },
    bp: {
      title:'❤️ 혈압·맥박', sysLabel:'위 (수축기)', diaLabel:'아래 (이완기)', pulseLabel:'맥박 (측정했다면, 선택)',
      pulsePrefix:'맥박 ', sysShort:'위', diaShort:'아래', pulseShort:'맥'
    },
    weight: { title:'⚖️ 체중', unit:'kg' },
    bath: { title:'🛁 목욕', tub:'욕조에 몸을 담갔다', wash:'몸을 씻었다', shower:'샤워를 했다', wipe:'몸을 닦았다(청식)' },
    skin: {
      title:'🩹 피부 상태', normal:'평소와 같음', concern:'신경 쓰이는 곳이 있음', concernRow:'신경 쓰이는 곳',
      concernTitle:'🩹 신경 쓰이는 곳', concernPlaceholder:'부위와 상태 (예: 오른쪽 엉덩이가 빨갛다)', photoCamera:'📷 카메라로 찍기 (선택)', photoAlbum:'🖼 앨범에서 (선택)'
    },
    timeEdit: { title:'시각 고치기', ok:'고치기' },
    chip: {
      pulseFast:'빠름', pulseFastMild:'조금 빠름', pulseSlow:'느림', pulseSlowMild:'조금 느림',
      high:'높음', highMild:'조금 높음', low:'낮음', lowMild:'조금 낮음'
    },
    bmi: { thin:'저체중', thinMild:'마른 편', normal:'표준', over:'과체중', overMuch:'비만', label:'BMI' },
    sum: {
      takenTimes:'복용 {n}회', timesN:'{n}회', prn:'필요시 {n}', prnShort:'필{n}', missed:'✕{n}',
      urineTimes:'소변 {n}회', urineN:'소{n}', urineRate:'소변 {n}회/일', stoolTimes:'대변 {n}회', stoolN:'대{n}',
      diar:'설사 {n}', diarShort:'설{n}', mlApprox:' (약 {ml}ml)', mlApproxShort:'(약 {ml})',
      tempMax:'최고 {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal}ml', waterAvg:'{ml}ml ({days}일)',
      hoursDay:'약 {n}시간', hoursCell:'약{n}h', hoursAvgCell:'약{n}h ({days}일)',
      wakeDay:'깸 {n}', wakeShort:'깸{n}', casesN:'{n}건', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊약', water:'🥛수분', meal:'🍚식사', mealWeek:'🍚결식', toilet:'🚻화장실',
      temp:'🌡체온', bp:'❤️혈압', sleep:'🌙수면', fall:'⚠낙상'
    }
  };

  /* ============ zh(簡体字) ============ */
  var zh = {
    app: { title:'居家照护记录 - SOYOGI', name:'居家照护记录 - SOYOGI', ver:'1.0' },
    tab: { today:'今天', hist:'历史', show:'报告', set:'设置' },
    common: { save:'记录', cancel:'取消', empty:'还没有记录', delConfirm:'删除?' },
    toast: {
      saved:'已记录 ✓',
      savedNoPhoto:'因存储空间不足,照片未能保存',
      full:'存储空间已满,无法保存',
      exported:'已导出 ✓',
      imported:'已导入 ✓',
      importFail:'无法读取文件',
      waterNoUndo:'没有可撤销的饮水记录',
      waterUndone:'已撤销一条 ✓',
      photoFail:'无法加载照片'
    },
    today: {
      records:'今天的记录',
      datePrefix:'今天',
      gotoSet:'⚙️ 记录项目可以在「设置」里增加或减少',
      gotoSetOff:'⚙️ 记录项目可以在「设置」里增加或减少 (当前关闭: {list})'
    },
    hist: { prev:'◀ 前一天', next:'后一天 ▶', todayMark:'(今天)', noRecord:'这一天没有记录' },
    show: {
      noteHead:'想转达的事 · 担心的事',
      notePlaceholder:'把就诊或面谈时想说的内容记在这里',
      span7title:'最近1周', span30title:'最近1个月', span90title:'最近3个月',
      span7btn:'1周', span30btn:'1个月', span90btn:'3个月',
      hint:'请把这个画面直接给医生、护士或护理经理看。上面的表格会根据记录自动生成。记录本身会一直保留。以前的日期可以在「历史」里查看。',
      colDay:'日期', colWeek:'周', todayMark:'今天', thisWeek:'本周'
    },
    set: {
      langHead:'🌐 语言 / Language',
      fontHead:'文字大小', fsNormal:'普通', fsLarge:'大', fsXL:'特大',
      waterHead:'每日饮水目标量',
      waterHint:'初始的1200ml是日本厚生劳动省参考值(每天需要约2.5L水分 = 饮食约1.0L + 体内生成约0.3L + 饮水约1.2L)中「饮水」的部分。请只计算喝下的饮品,不包括饮食中的水分。因心脏、肾脏疾病等需要限制水分的,请改成医生或护士告知的量。',
      heightHead:'身高 (用于根据体重计算BMI)',
      heightHint:'输入身高后,体重记录会显示BMI参考。留空则不显示判定。',
      heightPlaceholder:'未设置',
      itemsHead:'记录项目',
      backupHead:'备份', export:'导出记录', import:'导入记录',
      backupHint:'记录只保存在这台设备里,不会发送到任何地方。换设备时,请用「导出」保存文件,再在新设备上「导入」。',
      credit:'应用开发: SOYOGI - 照护与支援咨询处',
      ver:'版本 1.0',
      on:'开', off:'关'
    },
    items: {
      water:'水分', med:'吃药', meal:'饮食', toilet:'如厕', temp:'体温', sleep:'夜间情况',
      mood:'心情·状态', carer:'我的心情', fall:'跌倒·险情', note:'备忘',
      bp:'血压·脉搏', weight:'体重', bath:'洗澡', skin:'皮肤状态', wake:'夜间醒来',
      sleepSub:'早上记录昨晚的情况', carerSub:'照护者本人的',
      medHint:'如有原因请写 (发热、疼痛等)',
      fallHint:'何时、何地、怎样 (例: 早上在厕所前晃了一下)',
      noteHint:'注意到的事 (例: 咳嗽、发痒)'
    },
    med: {
      title:'💊 吃药', taken:'吃了', prn:'临时用药(顿服)', missed:'没能吃',
      tonpukuTitle:'💊 临时用药的原因', tonpukuPlaceholder:'原因 (发热、疼痛、睡不着等)'
    },
    meal: { title:'🍚 饮食', full:'吃完了', half:'吃了一半', little:'吃了一点', none:'没有吃' },
    water: {
      title:'🥛 水分', head:'水分', todayLabel:'今天', unit:'ml',
      over:'超过目标{n}ml', reached:'达到目标 ◎', remain:'离目标还差{n}ml',
      btnCup:'一杯 200ml', btnHalf:'半杯 100ml', btnSip:'一点 50ml',
      rowCup:'一杯', rowHalf:'半杯', rowSip:'一点', undo:'⤺ 撤销一条'
    },
    toilet: {
      title:'🚻 如厕', pee:'小便', poo:'大便', peeTitle:'🚻 小便', pooTitle:'🚻 大便',
      u_norm:'正常 (约300ml)', u_much:'偏多 (约400ml)', u_little:'偏少 (约200ml)', u_tiny:'很少 (约100ml)',
      numEntry:'输入数值 (集尿袋等)', numTitle:'🚻 小便 (ml)', numHint:'量 (ml)',
      s_norm:'正常', s_soft:'偏软', s_hard:'偏硬', s_diar:'腹泻',
      obsTitle:'🚻 状态', obsNormal:'和平时一样', obs_color:'颜色和平时不同', obs_blood:'可能带血',
      todaySub:'今天 小便{u}次 · 大便{s}次'
    },
    temp: { title:'🌡️ 体温', notePlaceholder:'例: 做了物理降温', unit:'℃' },
    sleep: {
      title:'🌙 夜间情况', wakeNow:'刚刚醒了 (夜间用)', morning:'补记早晨小结', wokeAtNight:'夜里醒来',
      summaryTitle:'🌙 早晨小结', sleptTime:'入睡时刻', wokeTime:'起床时刻', minus30:'−30分', plus30:'＋30分',
      hoursLive:'睡眠时间 约{n}小时', qualityLabel:'睡眠',
      q_good:'睡得好', q_ok:'一般', q_poor:'睡得浅',
      rowMain:'入睡{sl} 起床{wk} (约{hrs}小时)'
    },
    mood: {
      title:'🙂 心情·状态', calm:'平稳', normal:'一般', down:'没精神', irritable:'烦躁易怒', waves:'情绪起伏大',
      memoHint:'状态或备注 (可不填)'
    },
    carer: {
      title:'🍀 我的心情', good:'好', ok:'一般', tired:'吃力', verytired:'非常吃力', limit:'到极限了',
      memoHint:'状态或备注 (可不填)'
    },
    fall: { title:'⚠️ 跌倒·险情' },
    note: { title:'📝 备忘' },
    bp: {
      title:'❤️ 血压·脉搏', sysLabel:'高压 (收缩压)', diaLabel:'低压 (舒张压)', pulseLabel:'脉搏 (若测了,可不填)',
      pulsePrefix:'脉搏 ', sysShort:'高压', diaShort:'低压', pulseShort:'脉'
    },
    weight: { title:'⚖️ 体重', unit:'kg' },
    bath: { title:'🛁 洗澡', tub:'泡了浴缸', wash:'洗了身体', shower:'冲了淋浴', wipe:'擦了身体(擦浴)' },
    skin: {
      title:'🩹 皮肤状态', normal:'和平时一样', concern:'有让人在意的地方', concernRow:'需要留意的部位',
      concernTitle:'🩹 需要留意的部位', concernPlaceholder:'部位和状态 (例: 右侧臀部发红)', photoCamera:'📷 拍照 (可选)', photoAlbum:'🖼 从相册选择 (可选)'
    },
    timeEdit: { title:'修改时刻', ok:'修改' },
    chip: {
      pulseFast:'偏快', pulseFastMild:'稍快', pulseSlow:'偏慢', pulseSlowMild:'稍慢',
      high:'偏高', highMild:'稍高', low:'偏低', lowMild:'稍低'
    },
    bmi: { thin:'偏瘦', thinMild:'略瘦', normal:'标准', over:'偏胖', overMuch:'明显偏胖', label:'BMI' },
    sum: {
      takenTimes:'服药{n}次', timesN:'{n}次', prn:'临时{n}', prnShort:'临{n}', missed:'✕{n}',
      urineTimes:'小便{n}次', urineN:'尿{n}', urineRate:'小便{n}次/日', stoolTimes:'大便{n}次', stoolN:'便{n}',
      diar:'腹泻{n}', diarShort:'泻{n}', mlApprox:' (约{ml}ml)', mlApproxShort:'(约{ml})',
      tempMax:'最高{v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal}ml', waterAvg:'{ml}ml ({days}天)',
      hoursDay:'约{n}小时', hoursCell:'约{n}h', hoursAvgCell:'约{n}h ({days}天)',
      wakeDay:'夜醒{n}', wakeShort:'醒{n}', casesN:'{n}件', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊药', water:'🥛水分', meal:'🍚饮食', mealWeek:'🍚未进食', toilet:'🚻如厕',
      temp:'🌡体温', bp:'❤️血压', sleep:'🌙睡眠', fall:'⚠跌倒'
    }
  };

  /* ============ ar ============ */
  var ar = {
    app: { title:'سجل الرعاية المنزلية - SOYOGI', name:'سجل الرعاية المنزلية - SOYOGI', ver:'1.0' },
    tab: { today:'اليوم', hist:'السجل', show:'تقرير', set:'الإعدادات' },
    common: { save:'تسجيل', cancel:'إلغاء', empty:'لا توجد تسجيلات بعد', delConfirm:'حذف؟' },
    toast: {
      saved:'تم التسجيل ✓',
      savedNoPhoto:'تعذّر حفظ الصورة بسبب حد التخزين',
      full:'تعذّر الحفظ: مساحة التخزين ممتلئة',
      exported:'تم التصدير ✓',
      imported:'تم الاستيراد ✓',
      importFail:'تعذّر قراءة الملف',
      waterNoUndo:'لا يوجد تسجيل شرب للتراجع عنه',
      waterUndone:'تم التراجع عن واحد ✓',
      photoFail:'تعذّر تحميل الصورة'
    },
    today: {
      records:'تسجيلات اليوم',
      datePrefix:'اليوم',
      gotoSet:'⚙️ يمكنك إضافة بنود التسجيل أو إزالتها من «الإعدادات»',
      gotoSetOff:'⚙️ يمكنك إضافة بنود التسجيل أو إزالتها من «الإعدادات» (متوقف الآن: {list})'
    },
    hist: { prev:'◀ اليوم السابق', next:'اليوم التالي ▶', todayMark:'(اليوم)', noRecord:'لا توجد تسجيلات في هذا اليوم' },
    show: {
      noteHead:'أمور تريد قولها / مخاوف',
      notePlaceholder:'اكتب هنا ما تريد قوله في زيارة الطبيب أو الاجتماع',
      span7title:'هذا الأسبوع', span30title:'هذا الشهر', span90title:'آخر 3 أشهر',
      span7btn:'أسبوع', span30btn:'شهر', span90btn:'3 أشهر',
      hint:'أرِ هذه الشاشة كما هي للطبيب أو الممرضة أو منسق الرعاية. يُنشأ الجدول أعلاه تلقائيًا من التسجيلات. التسجيلات نفسها تبقى محفوظة دائمًا. الأيام السابقة تجدها في «السجل».',
      colDay:'اليوم', colWeek:'الأسبوع', todayMark:'اليوم', thisWeek:'هذا الأسبوع'
    },
    set: {
      langHead:'🌐 اللغة / Language',
      fontHead:'حجم الخط', fsNormal:'عادي', fsLarge:'كبير', fsXL:'كبير جدًا',
      waterHead:'هدف الشرب اليومي',
      waterHint:'قيمة 1200 مل الأولية هي حصة «الشرب» من المرجع الصادر عن وزارة الصحة اليابانية (نحو 2.5 لتر ماء يوميًا = نحو 1.0 لتر من الطعام + نحو 0.3 لتر يصنعه الجسم + نحو 1.2 لتر شرب). احسب المشروبات فقط، من دون الماء الموجود في الطعام. إذا كان هناك تقييد للسوائل (مرض قلبي أو كلوي) فاضبط الكمية التي حددها الطبيب أو الممرضة.',
      heightHead:'الطول (لحساب مؤشر كتلة الجسم من الوزن)',
      heightHint:'عند إدخال الطول يظهر مؤشر BMI مع تسجيلات الوزن. اتركه فارغًا لعدم إظهار التقييم.',
      heightPlaceholder:'غير محدد',
      itemsHead:'بنود التسجيل',
      backupHead:'نسخة احتياطية', export:'تصدير التسجيلات', import:'استيراد التسجيلات',
      backupHint:'تُحفظ التسجيلات على هذا الجهاز فقط ولا يُرسل أي شيء إلى أي مكان. عند تغيير الجهاز استخدم «تصدير» لحفظ ملف ثم «استيراد» على الجهاز الجديد.',
      credit:'تطوير التطبيق: SOYOGI - مركز استشارات الرعاية والدعم',
      ver:'الإصدار 1.0',
      on:'تشغيل', off:'إيقاف'
    },
    items: {
      water:'السوائل', med:'الدواء', meal:'الوجبات', toilet:'الحمّام', temp:'الحرارة', sleep:'الليل',
      mood:'المزاج والحالة', carer:'مزاجي أنا', fall:'سقوط / كاد يسقط', note:'ملاحظة',
      bp:'الضغط والنبض', weight:'الوزن', bath:'الاستحمام', skin:'الجلد', wake:'استيقاظ ليلي',
      sleepSub:'سجّل ليلة أمس في الصباح', carerSub:'لك أنت، مقدم الرعاية',
      medHint:'إن كان هناك سبب (حمّى، ألم، إلخ)',
      fallHint:'متى وأين وكيف (مثال: ترنّح أمام الحمّام صباحًا)',
      noteHint:'ما لاحظته (مثال: سعال، حكّة)'
    },
    med: {
      title:'💊 الدواء', taken:'تم تناوله', prn:'دواء عند الحاجة', missed:'تعذّر تناوله',
      tonpukuTitle:'💊 سبب جرعة «عند الحاجة»', tonpukuPlaceholder:'السبب (حمّى، ألم، أرق، إلخ)'
    },
    meal: { title:'🍚 الوجبات', full:'أكل كل الطعام', half:'النصف', little:'قليلًا', none:'لم يأكل' },
    water: {
      title:'🥛 السوائل', head:'السوائل', todayLabel:'اليوم', unit:'مل',
      over:'فوق الهدف بـ {n} مل', reached:'تحقق الهدف ◎', remain:'بقي {n} مل للهدف',
      btnCup:'كوب واحد 200 مل', btnHalf:'نصف كوب 100 مل', btnSip:'قليل 50 مل',
      rowCup:'كوب واحد', rowHalf:'نصف كوب', rowSip:'قليل', undo:'⤺ تراجع عن واحد'
    },
    toilet: {
      title:'🚻 الحمّام', pee:'البول', poo:'البراز', peeTitle:'🚻 البول', pooTitle:'🚻 البراز',
      u_norm:'عادي (نحو 300 مل)', u_much:'كثير (نحو 400 مل)', u_little:'قليل (نحو 200 مل)', u_tiny:'قليل جدًا (نحو 100 مل)',
      numEntry:'إدخال رقم (كيس البول، إلخ)', numTitle:'🚻 البول (مل)', numHint:'الكمية (مل)',
      s_norm:'عادي', s_soft:'لين', s_hard:'قاسٍ', s_diar:'إسهال',
      obsTitle:'🚻 الحالة', obsNormal:'كالمعتاد', obs_color:'اللون مختلف عن المعتاد', obs_blood:'ربما فيه دم',
      todaySub:'اليوم: بول {u} · براز {s}'
    },
    temp: { title:'🌡️ الحرارة', notePlaceholder:'مثال: وُضعت كمّادات باردة', unit:'℃' },
    sleep: {
      title:'🌙 الليل', wakeNow:'استيقظ الآن (لليل)', morning:'إضافة ملخّص الصباح', wokeAtNight:'استيقظ أثناء الليل',
      summaryTitle:'🌙 ملخّص الصباح', sleptTime:'وقت النوم', wokeTime:'وقت الاستيقاظ', minus30:'−30 دقيقة', plus30:'＋30 دقيقة',
      hoursLive:'مدة النوم: نحو {n} ساعة', qualityLabel:'النوم',
      q_good:'نام جيدًا', q_ok:'عادي', q_poor:'نوم خفيف',
      rowMain:'نام {sl}، استيقظ {wk} (نحو {hrs} ساعة)'
    },
    mood: {
      title:'🙂 المزاج والحالة', calm:'هادئ', normal:'عادي', down:'خامل', irritable:'سريع الانفعال', waves:'تقلبات شديدة',
      memoHint:'الحالة أو ملاحظات (اختياري)'
    },
    carer: {
      title:'🍀 مزاجي أنا', good:'جيد', ok:'عادي', tired:'مرهق', verytired:'مرهق جدًا', limit:'بلغت حدّي',
      memoHint:'الحالة أو ملاحظات (اختياري)'
    },
    fall: { title:'⚠️ سقوط / كاد يسقط' },
    note: { title:'📝 ملاحظة' },
    bp: {
      title:'❤️ الضغط والنبض', sysLabel:'الانقباضي (العلوي)', diaLabel:'الانبساطي (السفلي)', pulseLabel:'النبض (إن قيس، اختياري)',
      pulsePrefix:'النبض ', sysShort:'علوي', diaShort:'سفلي', pulseShort:'ن'
    },
    weight: { title:'⚖️ الوزن', unit:'كغ' },
    bath: { title:'🛁 الاستحمام', tub:'استحم في حوض', wash:'غُسل الجسم', shower:'أخذ دُشًّا', wipe:'مُسح الجسم بمنشفة' },
    skin: {
      title:'🩹 الجلد', normal:'كالمعتاد', concern:'هناك ما يقلق', concernRow:'موضع يحتاج متابعة',
      concernTitle:'🩹 موضع يحتاج متابعة', concernPlaceholder:'المكان والحالة (مثال: احمرار في الورك الأيمن)', photoCamera:'📷 التقاط صورة (اختياري)', photoAlbum:'🖼 من الألبوم (اختياري)'
    },
    timeEdit: { title:'تصحيح الوقت', ok:'تصحيح' },
    chip: {
      pulseFast:'سريع', pulseFastMild:'سريع قليلًا', pulseSlow:'بطيء', pulseSlowMild:'بطيء قليلًا',
      high:'مرتفع', highMild:'مرتفع قليلًا', low:'منخفض', lowMild:'منخفض قليلًا'
    },
    bmi: { thin:'نحافة', thinMild:'نحيف قليلًا', normal:'طبيعي', over:'زيادة وزن', overMuch:'زيادة كبيرة', label:'BMI' },
    sum: {
      takenTimes:'تناول {n}', timesN:'{n}', prn:'عند الحاجة {n}', prnShort:'ح{n}', missed:'✕{n}',
      urineTimes:'بول {n}', urineN:'بول {n}', urineRate:'بول {n}/يوم', stoolTimes:'براز {n}', stoolN:'براز {n}',
      diar:'إسهال {n}', diarShort:'إسهال {n}', mlApprox:' (نحو {ml} مل)', mlApproxShort:'(نحو {ml})',
      tempMax:'أقصى {v}℃', tempMaxCell:'{v}℃', waterGoal:'{ml}/{goal} مل', waterAvg:'{ml} مل ({days} يوم)',
      hoursDay:'نحو {n} ساعة', hoursCell:'~{n}س', hoursAvgCell:'~{n}س ({days}ي)',
      wakeDay:'استيقاظ {n}', wakeShort:'است. {n}', casesN:'{n}', fallCell:'⚠️{n}', dash:'−'
    },
    col: {
      med:'💊 دواء', water:'🥛 سوائل', meal:'🍚 طعام', mealWeek:'🍚 لم يأكل', toilet:'🚻 حمّام',
      temp:'🌡 حرارة', bp:'❤️ ضغط', sleep:'🌙 نوم', fall:'⚠ سقوط'
    }
  };

  /* ============ 言語メタ(表示名・自称・文字方向) ============ */
  var META = {
    ja:{ name:'Japanese',   native:'日本語',        dir:'ltr' },
    en:{ name:'English',    native:'English',                    dir:'ltr' },
    de:{ name:'German',     native:'Deutsch',                    dir:'ltr' },
    fr:{ name:'French',     native:'Français',              dir:'ltr' },
    es:{ name:'Spanish',    native:'Español',               dir:'ltr' },
    it:{ name:'Italian',    native:'Italiano',                   dir:'ltr' },
    pt:{ name:'Portuguese', native:'Português',             dir:'ltr' },
    nl:{ name:'Dutch',      native:'Nederlands',                 dir:'ltr' },
    sv:{ name:'Swedish',    native:'Svenska',                    dir:'ltr' },
    ko:{ name:'Korean',     native:'한국어',         dir:'ltr' },
    zh:{ name:'Chinese',    native:'中文',               dir:'ltr' },
    ar:{ name:'Arabic',     native:'العربية', dir:'rtl' }
  };

  /* ✅ 全12言語 実翻訳済み(2026-07-19 Fable記入)。キー構造の一致は _check_i18n.js で機械検証 */
  var I18N = { ja:ja, en:en, de:de, fr:fr, es:es, it:it, pt:pt, nl:nl, sv:sv, ko:ko, zh:zh, ar:ar };

  /* 各言語に _meta(表示名・方向)を付与。中身の比較(TODO判定)では _meta は除外する */
  Object.keys(META).forEach(function(code){
    if(I18N[code]) I18N[code]._meta = META[code];
  });

  /* 言語の並び順(せっていの言語ボタン・自称表記はMETA.native) */
  I18N._order = ['ja','en','de','fr','es','it','pt','nl','sv','ko','zh','ar'];

  var g = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  g.OKIROKU_I18N = I18N;
})();
