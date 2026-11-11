'use strict';
/* おうち介護記録・そよぎ 起動スモークテスト(疑似DOM・v2)
   実在idだけ返す疑似DOMで tap.js + i18n.js + app.js を起動し、SPEC_V2_I18N §6の受け入れ条件を検証する。
   ・旧v文字列 → コード(c/a)への移行/未知の温存
   ・コード保存の言語非依存(言語を切り替えると過去の記録が新しい言語で表示される)
   ・ja以外(en)で起動→記録→日計→みせる を1周
   ・ar で dir=rtl
   使い方: node _smoke.js  */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('./index.html', 'utf8');
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));

/* ---- 疑似DOM要素(textContent設定で子をクリア/イベントは_evに保持) ---- */
function makeEl(tag){
  const node = {
    tagName:(tag || 'div').toUpperCase(),
    children:[], style:{}, dataset:{}, _ev:{}, _attr:{},
    className:'', value:'', placeholder:'', src:'', href:'', rows:0,
    type:'', accept:'', capture:'', hidden:false, disabled:false, step:'', inputMode:'', lang:'', dir:'',
    appendChild(c){ this.children.push(c); return c; },
    get childNodes(){ return this.children; },
    setAttribute(k, v){ this._attr[k] = v; }, getAttribute(k){ return (k in this._attr) ? this._attr[k] : null; },
    addEventListener(t, h){ (this._ev[t] = this._ev[t] || []).push(h); },
    removeEventListener(){},
    focus(){}, click(){}, scrollIntoView(){}, scrollTo(){}, remove(){},
    getBoundingClientRect(){ return { top:0, left:0, width:100, height:50, bottom:50, right:100 }; },
    classList:{
      _s:new Set(),
      add(...c){ c.forEach(x => this._s.add(x)); },
      remove(...c){ c.forEach(x => this._s.delete(x)); },
      toggle(c, f){ if(f === undefined) f = !this._s.has(c); if(f) this._s.add(c); else this._s.delete(c); return f; },
      contains(c){ return this._s.has(c); }
    },
    querySelector(){ return makeEl(); },
    querySelectorAll(){ return []; }
  };
  let _text = '';
  Object.defineProperty(node, 'textContent', {
    get(){ return _text; },
    set(v){ _text = (v == null ? '' : String(v)); node.children.length = 0; }
  });
  return node;
}

const created = {};
function byId(id){
  if(!ids.has(id)) return null;
  if(!created[id]) created[id] = makeEl();
  return created[id];
}

/* ---- タップ発火(pointerdown→pointerup) ---- */
function tap(elm){
  const d = { pointerId:1, isPrimary:true, clientX:0, clientY:0, preventDefault(){} };
  (elm._ev.pointerdown || []).forEach(h => h(d));
  (elm._ev.pointerup   || []).forEach(h => h({ pointerId:1, clientX:0, clientY:0 }));
}
function allText(node){
  let s = (node && node.textContent) || '';
  (node && node.children || []).forEach(c => { s += ' ' + allText(c); });
  return s;
}

/* ---- localStorage ---- */
const store = {};
let quotaFull = false;   // true の間は setItem が容量いっぱいの例外を投げる(保存失敗の試し用・[v1.7])
const localStorageStub = {
  getItem:k => (k in store ? store[k] : null),
  setItem:(k, v) => { if(quotaFull){ const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; } store[k] = String(v); },
  removeItem:k => { delete store[k]; }
};

/* ---- 旧shape(v1・v文字列)を仕込む: 移行の実証用 ----
   全て「きょう」内の連番タイムスタンプ */
const now = Date.now();
let seq = 0;
const T = () => now - 100000 + (seq++);
const preload = [
  { k:'med', v:'のんだ', t:T() },
  { k:'med', v:'頓服', m:'むかしの理由', t:T() },                 // 接尾語なし旧shape → prn
  { k:'med', v:'頓服(とんぷく)', m:'痛み', t:T() },               // → prn(理由mは温存)
  { k:'med', v:'のめなかった', t:T() },
  { k:'water', v:'コップ1杯', ml:200, t:T() },
  { k:'water', v:'半分', ml:100, t:T() },
  { k:'meal', v:'完食', t:T() },
  { k:'meal', v:'食べず', t:T() },
  { k:'toilet', v:'おしっこ・ふつう(約300ml)', ml:300, obs:'色がいつもとちがう', t:T() },   // → u_norm + a:['obs_color']
  { k:'toilet', v:'うんち・下痢', t:T() },                        // → s_diar
  { k:'temp', v:'37.2℃', tv:37.2, m:'クーリング', t:T() },
  { k:'temp', v:'38.0℃', t:T() },                                 // tv欠落 → parseFloatで補完
  { k:'sleep', v:'入眠22:00 起床06:00(約8時間)・ふつう', sl:'22:00', wk:'06:00', hrs:8, q:'ふつう', t:T() },   // q → q_ok
  { k:'sleep', v:'むかしの自由記入', t:T() },                     // sl/wk無し → v温存(fallback)
  { k:'wake', v:'夜中に目がさめた', t:T() },
  { k:'mood', v:'おだやか', m:'', t:T() },
  { k:'carer', v:'しんどい', m:'ねむれない', t:T() },
  { k:'bp', s:150, d:95, pl:80, v:'150 / 95・脈80', t:T() },
  { k:'weight', v:'52kg', wv:52, t:T() },
  { k:'bath', v:'よくそうにつかった・からだをあらった', t:T() },   // → a:['tub','wash']
  { k:'skin', v:'いつもどおり', t:T() },
  { k:'skin', v:'気になるところ', m:'おしりが赤い', t:T() },       // → concern(m温存)
  { k:'fall', v:'', m:'トイレ前でふらついた', t:T() },
  { k:'note', v:'', m:'咳が出る', t:T() },
  { k:'xxx', v:'なぞの旧項目', t:T() }                            // 未知k → 温存
];
store['okiroku.entries'] = JSON.stringify(preload);
/* はじめての つかいかた(2026-09-30)は読み終えた扱いで始める(案内そのものは store/_back_check.js で本物のChromeで試す) */
store['okiroku.guide.v1'] = 'true';

/* ---- sandbox ---- */
const documentStub = {
  documentElement:Object.assign(makeEl('html'), { lang:'', dir:'' }),
  head:makeEl('head'), body:makeEl('body'), title:'',
  createElement:t => makeEl(t),
  getElementById:id => byId(id),
  addEventListener(){},
  querySelector(sel){
    const m = /^#([A-Za-z0-9_-]+)$/.exec(String(sel).trim());
    return m ? byId(m[1]) : makeEl();
  },
  querySelectorAll(){ return []; }
};
const sandbox = {
  console, document:documentStub,
  navigator:{ language:'en-US' },   // 自動判定 → en(ja以外で起動)
  localStorage:localStorageStub,
  location:{ hostname:'smoke.test', protocol:'https:' },
  Intl,   // Intl.DateTimeFormat を保証
  scrollTo(){},
  addEventListener(){},
  setTimeout:() => 0, setInterval:() => 0, clearInterval(){}, clearTimeout(){},
  URL:{ createObjectURL:() => 'blob:', revokeObjectURL(){} },
  Image:function(){ return {}; },
  FileReader:function(){ return { readAsText(){}, onload:null }; },
  Blob:function(){ return {}; }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

/* ---- 起動 ---- */
const src = ['./audio.js', './tap.js', './i18n.js', './app.js'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
vm.createContext(sandbox);
const fails = [];
function check(name, cond){ if(cond) console.log('  OK  ' + name); else { console.log('  NG  ' + name); fails.push(name); } }
function ents(){ return JSON.parse(store['okiroku.entries']); }

try{
  vm.runInContext(src, sandbox, { filename:'app-bundle.js' });
}catch(e){
  console.log('SMOKE NG: 起動時に例外');
  console.log(e.stack.split('\n').slice(0, 8).join('\n'));
  process.exit(1);
}
console.log('[条件1] 起動時に例外なし + navigator=en-US 自動判定で起動');
check('起動完了(applyFs+applyLang)', true);
check('起動言語が en(自動判定)= document.documentElement.lang', documentStub.documentElement.lang === 'en');

/* ---- [移行/条件6] 旧v文字列 → コード(c/a)。未知は温存 ---- */
console.log('[移行] 旧データがコード化される・未知は温存');
const A = ents();
const med  = A.filter(e => e.k === 'med');
const prn  = med.filter(e => e.c === 'prn');
check('med 頓服(2件)→ c:prn へ変換・vは消える', prn.length === 2 && prn.every(e => e.v === undefined));
check('med のんだ→ c:taken', med.some(e => e.c === 'taken' && e.v === undefined));
check('med のめなかった→ c:missed', med.some(e => e.c === 'missed'));
check('med 頓服の理由(m)は温存(言語混在OK)', prn.some(e => e.m === '痛み'));
const toi = A.filter(e => e.k === 'toilet');
const uNorm = toi.find(e => e.c === 'u_norm');
check('toilet おしっこ・ふつう→ c:u_norm・ml温存・v消える', !!uNorm && uNorm.ml === 300 && uNorm.v === undefined);
check('toilet ようす(obs)→ a:[obs_color]・obs消える', !!uNorm && Array.isArray(uNorm.a) && uNorm.a[0] === 'obs_color' && uNorm.obs === undefined);
check('toilet うんち・下痢→ c:s_diar', toi.some(e => e.c === 's_diar'));
const water = A.filter(e => e.k === 'water');
check('water コップ1杯→ c:cup / 半分→ c:half・ml温存', water.some(e => e.c === 'cup' && e.ml === 200) && water.some(e => e.c === 'half' && e.ml === 100));
check('meal 完食→ c:full / 食べず→ c:none', A.some(e => e.k === 'meal' && e.c === 'full') && A.some(e => e.k === 'meal' && e.c === 'none'));
const temp = A.filter(e => e.k === 'temp');
check('temp v消える・tv温存/補完(37.2 と 38.0)', temp.every(e => e.v === undefined) && temp.some(e => e.tv === 37.2) && temp.some(e => e.tv === 38));
const sleep = A.filter(e => e.k === 'sleep');
check('sleep q:ふつう→ c:q_ok・再構築可能なら旧v破棄', sleep.some(e => e.c === 'q_ok' && e.sl === '22:00' && e.v === undefined));
check('sleep 旧自由記入(sl/wk無し)は v温存(フォールバック)', sleep.some(e => e.v === 'むかしの自由記入' && e.c === undefined));
check('wake v消える(コード無し項目)', A.some(e => e.k === 'wake' && e.v === undefined));
check('mood おだやか→ c:calm', A.some(e => e.k === 'mood' && e.c === 'calm'));
check('carer しんどい→ c:tired・m温存', A.some(e => e.k === 'carer' && e.c === 'tired' && e.m === 'ねむれない'));
check('bp v消える・s/d/pl温存', A.some(e => e.k === 'bp' && e.v === undefined && e.s === 150 && e.pl === 80));
check('weight v消える・wv温存', A.some(e => e.k === 'weight' && e.v === undefined && e.wv === 52));
const bath = A.find(e => e.k === 'bath');
check('bath ・区切り→ a:[tub,wash]・v消える', !!bath && Array.isArray(bath.a) && bath.a.join(',') === 'tub,wash' && bath.v === undefined);
check('skin いつもどおり→ c:normal / 気になるところ→ c:concern(m温存)', A.some(e => e.k === 'skin' && e.c === 'normal') && A.some(e => e.k === 'skin' && e.c === 'concern' && e.m === 'おしりが赤い'));
check('fall/note は m温存・v消える', A.some(e => e.k === 'fall' && e.v === undefined && e.m) && A.some(e => e.k === 'note' && e.v === undefined && e.m));
check('未知k(xxx)は温存(vそのまま)', A.some(e => e.k === 'xxx' && e.v === 'なぞの旧項目'));
check('prefs.schema が 2 に更新される', JSON.parse(store['okiroku.prefs']).schema === 2);

/* ---- [条件3] コード保存の言語非依存(切替前の記録が新しい言語で出る) ---- */
console.log('[条件3] 言語を切り替えると過去の記録がその言語で表示される');
sandbox.setLang('ja');
sandbox.renderToday();
let jaTxt = allText(byId('today-list'));
check('ja表示: おくすり/のんだ が出る', jaTxt.includes('のんだ'));
check('ja表示: トイレ/おしっこ が出る', jaTxt.includes('おしっこ'));
check('ja表示: 皮膚/いつもどおり が出る', jaTxt.includes('いつもどおり'));

sandbox.setLang('en');
sandbox.renderToday();
let enTxt = allText(byId('today-list'));
check('en表示: 同じ記録が Took it で出る', enTxt.includes('Took it'));
check('en表示: 同じ記録が Urine で出る', enTxt.includes('Urine'));
check('en表示に 日本語「のんだ」が混ざらない(言語非依存の証明)', !enTxt.includes('のんだ'));

/* 日計(みせる/りれきのdaySummary)も言語連動 */
sandbox.setLang('ja'); sandbox.renderHist();
check('ja日計に 💊 のんだ が出る', byId('hist-sum').textContent.includes('のんだ'));
sandbox.setLang('en'); sandbox.renderHist();
const enSum = byId('hist-sum').textContent;
check('en日計に took / urine が出る', enSum.includes('took') && enSum.includes('urine'));

/* ---- [条件2] en で 記録→日計→みせる を1周 ---- */
console.log('[条件2] en で記録→日計→みせる を1周');
sandbox.setLang('en');
sandbox.openMed();
const takenBtn = byId('sheet-choices').children.find(b => b.textContent === 'Took it');
check('en おくすりシートに Took it がある', !!takenBtn);
const n0 = ents().length;
tap(takenBtn);
const rec = ents()[ents().length - 1];
check('enで記録 → コード保存 {k:med, c:taken}(v無し)', ents().length === n0 + 1 && rec.k === 'med' && rec.c === 'taken' && rec.v === undefined);
let ok2 = true;
try{ sandbox.renderToday(); sandbox.renderHist(); sandbox.renderShow(); allText(sandbox.buildDayTable(7)); allText(sandbox.buildDayTable(30)); allText(sandbox.buildWeekTable()); }
catch(e){ ok2 = false; console.log('    ' + e.message); }
check('en で 今日/りれき/みせる(7日/30日/3か月)描画が例外なし', ok2);
check('en みせる表に英語見出し(Water)が出る', allText(sandbox.buildDayTable(7)).includes('Water'));

/* ---- [条件4] ar で dir=rtl ---- */
console.log('[条件4] ar で dir=rtl・戻すと ltr');
sandbox.setLang('ar');
check('ar: document.documentElement.dir === rtl', documentStub.documentElement.dir === 'rtl');
check('ar: lang === ar', documentStub.documentElement.lang === 'ar');
let ok4 = true;
try{ sandbox.renderToday(); sandbox.renderHist(); sandbox.renderShow(); }catch(e){ ok4 = false; console.log('    ' + e.message); }
check('ar でも主要画面の描画が例外なし', ok4);
sandbox.setLang('en');
check('en に戻すと dir === ltr', documentStub.documentElement.dir === 'ltr');

/* ---- 回帰: carer(わたしのきぶん)は みせるの表に出さない ---- */
console.log('[回帰] わたしのきぶん(carer)は みせる表に出さない');
sandbox.setLang('ja');
const t7  = allText(sandbox.buildDayTable(7));
const t30 = allText(sandbox.buildDayTable(30));
const tw  = allText(sandbox.buildWeekTable());
check('みせる7日表に 🍀/わたしのきぶん が無い', !t7.includes('🍀') && !t7.includes('わたしのきぶん'));
check('みせる30日表に 🍀/わたしのきぶん が無い', !t30.includes('🍀') && !t30.includes('わたしのきぶん'));
check('みせる週表(3か月)に 🍀/わたしのきぶん が無い', !tw.includes('🍀') && !tw.includes('わたしのきぶん'));
check('りれき日計には 🍀 が出る(こちらは表示する)', byId('hist-sum').textContent.length >= 0 && (sandbox.renderHist(), byId('hist-sum').textContent.includes('🍀')));

/* ---- [v3.1] Sound一本化 / 画面の色 / おんがく / タップ音 ---- */
console.log('[v3.1] Sound一本化・画面の色・おんがく・タップ音');
sandbox.setLang('ja');

/* Sound一本化: audio.js の Sound がタップ音+BGM APIを持ち、メトロノームは除去されている */
let soundProbe = null;
try{ soundProbe = vm.runInContext('typeof Sound!=="undefined" ? {tap:typeof Sound.tap, mode:typeof Sound.setBgmMode, en:typeof Sound.setBgmEnabled, playing:typeof Sound.bgmPlaying, metro:typeof Sound.metroStart} : null', sandbox); }catch(_){}
check('Sound一本化: audio.js の Sound(tap+BGM API)有効', !!soundProbe && soundProbe.tap === 'function' && soundProbe.mode === 'function' && soundProbe.en === 'function');
check('Sound一本化: メトロノーム(metro)は除去済み', !!soundProbe && soundProbe.metro === 'undefined');

/* 画面の色: あお→body.theme-blue付与+prefs保存 / みどり→解除 */
const body = documentStub.body;
check('初期テーマは みどり(theme-blue が付かない)', !body.classList.contains('theme-blue'));
tap(byId('themeBtnB'));
check('がめんの色=あお タップで body に theme-blue', body.classList.contains('theme-blue'));
check('あお選択で prefs.theme=blue が保存される', JSON.parse(store['okiroku.prefs']).theme === 'blue');
check('themeBtnB が active・themeBtnG が非active', byId('themeBtnB').classList.contains('active') && !byId('themeBtnG').classList.contains('active'));
tap(byId('themeBtnG'));
check('がめんの色=みどり タップで theme-blue が外れる', !body.classList.contains('theme-blue'));
check('みどり選択で prefs.theme=green が保存される', JSON.parse(store['okiroku.prefs']).theme === 'green');

/* おんがく(BGM): 曲2→b / ながさない→off / 曲1→a が prefs とボタンに反映 */
tap(byId('musicBtnB'));
check('おんがく=曲2 で prefs.music=b・musicBtnB が active', JSON.parse(store['okiroku.prefs']).music === 'b' && byId('musicBtnB').classList.contains('active'));
tap(byId('musicBtnOff'));
check('おんがく=ながさない で prefs.music=off・musicBtnOff が active', JSON.parse(store['okiroku.prefs']).music === 'off' && byId('musicBtnOff').classList.contains('active'));
tap(byId('musicBtnA'));
check('おんがく=曲1 で prefs.music=a・他ボタンは非active', JSON.parse(store['okiroku.prefs']).music === 'a' && byId('musicBtnA').classList.contains('active') && !byId('musicBtnOff').classList.contains('active'));

/* タップ音 ON/OFF */
tap(byId('soundBtnOff'));
check('タップ音OFF で prefs.sound=false・soundBtnOff が active', JSON.parse(store['okiroku.prefs']).sound === false && byId('soundBtnOff').classList.contains('active'));
tap(byId('soundBtnOn'));
check('タップ音ON で prefs.sound=true・soundBtnOn が active', JSON.parse(store['okiroku.prefs']).sound === true && byId('soundBtnOn').classList.contains('active'));

/* 新i18nキーが引ける(欠けるとキー名が画面に出る) */
const I18Nsm = sandbox.OKIROKU_I18N;
check('新i18n set.bgmHead/themeBlue/tapSound が ja/en/ar で引ける', !!(I18Nsm && I18Nsm.ja.set.bgmHead && I18Nsm.en.set.themeBlue && I18Nsm.ar.set.tapSound));

/* ---- [v1.1] 記録するこうもくのならびかえ(△▽ / ドラッグ) ---- */
console.log('[v1.1] こうもくのならびかえ');
sandbox.setLang('ja');
const ORD = () => JSON.parse(store['okiroku.prefs']).order;
const gridKeys = () => sandbox.activeItems().map(i => i.k);

sandbox.resetOrder();
const base = ORD().slice();
const N = base.length;   // 項目の総数(ITEMS の件数)
check('初期のならび順は ITEMS の定義順(先頭=water・2番目=med)', base[0] === 'water' && base[1] === 'med');
check('ならび順に全項目が重複なく入る', N > 0 && N === new Set(base).size);

/* △で上へ */
check('2番目の項目を△で上へ → 先頭と入れ替わる',
  sandbox.moveItem(base[1], -1) && ORD()[0] === base[1] && ORD()[1] === base[0]);
/* ▽で下へ(元に戻る) */
check('▽で下へ → 元の並びに戻る',
  sandbox.moveItem(base[1], +1) && ORD().join(',') === base.join(','));
/* 端では動かない */
check('先頭の項目は△を押しても動かない(falseで壊れない)',
  sandbox.moveItem(base[0], -1) === false && ORD().join(',') === base.join(','));
check('末尾の項目は▽を押しても動かない',
  sandbox.moveItem(base[base.length-1], +1) === false && ORD().join(',') === base.join(','));

/* きょう画面のグリッドが並び順に従う(OFFの項目は出さない) */
sandbox.moveItem(base[base.length-1], -1);   // 最後の項目を1つ上へ
sandbox.moveItem(base[base.length-1], -1);
const gk = gridKeys();
const pk = ORD().filter(k => gk.indexOf(k) >= 0);
check('きょうのグリッドがならび順どおりに並ぶ', gk.join(',') === pk.join(','));
check('OFFの項目はグリッドに出ない(ならびかえても変わらず)',
  gk.every(k => !JSON.parse(store['okiroku.prefs']).off.includes(k)));

sandbox.resetOrder();
check('「ならび順をもとにもどす」で定義順に戻る', ORD().join(',') === base.join(','));

/* ドラッグ(≡)で移動。疑似DOMは全行が同じ矩形(top0/bottom50)を返すので、
   clientY=10 は「一番上の行」に落ちる = 先頭へ動かす操作になる */
const target = ORD()[5];
sandbox.onDragStart({ isPrimary:true, preventDefault(){} }, target);
sandbox.onDragMove({ clientY:10, preventDefault(){} });
sandbox.onDragEnd();
check('≡ドラッグで6番目の項目を先頭へ動かせる', ORD()[0] === target);
check('ドラッグ後も全項目が重複なく残る', ORD().length === N && ORD().length === new Set(ORD()).size);
/* 取っ手を押しただけ(動かさず離す)で並びが変わらない */
sandbox.resetOrder();
const beforeTapOnly = ORD().join(',');
sandbox.onDragStart({ isPrimary:true, preventDefault(){} }, ORD()[3]);
sandbox.onDragEnd();
check('≡を押して動かさず離しただけでは並びが変わらない', ORD().join(',') === beforeTapOnly);
sandbox.resetOrder();

/* i18n 5キーが12言語で引ける */
const I18Nord = sandbox.OKIROKU_I18N;
check('新i18n set.orderHint/moveUp/moveDown/orderReset + toast.orderReset が全12言語で引ける',
  I18Nord._order.every(c => I18Nord[c].set.orderHint && I18Nord[c].set.moveUp &&
    I18Nord[c].set.moveDown && I18Nord[c].set.orderReset && I18Nord[c].toast.orderReset));

/* ---- [v1.1] 下タブ/ステータスバーに隠れない(セーフエリア対応) ----
   Android15+(targetSdk36)はエッジtoエッジ強制で、WebViewがナビゲーションバーの
   下まで描画される。CSSの固定余白だと「みせる」の説明文がタブバーに隠れて
   最後まで読めなくなるため、下記が消えていないことを機械で見張る。 */
console.log('[v1.1] セーフエリア(上のステータスバー/下のタブバー)');
const css = fs.readFileSync('./style.css', 'utf8');
const cssFlat = css.replace(/\s+/g, ' ');
check('body の下余白が max(CSS下限, 実測+10px)になっている',
  /body\{[^}]*padding-bottom:max\(calc\(84px\+env\(safe-area-inset-bottom\)\),calc\(var\(--tabbar-h\)\+10px\)\)/.test(cssFlat.replace(/ /g, '')));
check('--tabbar-h のフォールバックに env(safe-area-inset-bottom) が入る',
  /--tabbar-h:calc\(84px\+env\(safe-area-inset-bottom\)\)/.test(cssFlat.replace(/ /g, '')));
check('#hd の上余白に env(safe-area-inset-top) が入る(時計と重ならない)',
  /#hd\{[^}]*padding:calc\(20px\+env\(safe-area-inset-top\)\)/.test(cssFlat.replace(/ /g, '')));
check('#tabbar 自身の下余白に env(safe-area-inset-bottom) が残っている',
  /#tabbar\{[^}]*env\(safe-area-inset-bottom\)/.test(cssFlat.replace(/ /g, '')));
check('トーストの位置も max(CSS下限, 実測+12px)(タブに重ならない)',
  /\.toast\{[^}]*bottom:max\(calc\(96px\+env\(safe-area-inset-bottom\)\),calc\(var\(--tabbar-h\)\+12px\)\)/.test(cssFlat.replace(/ /g, '')));
check('ResizeObserver でタブバーの箱を見張っている', typeof sandbox.watchTabbarSpace === 'function');
check('シートに max-height + overflow-y(選択肢が多い時に下が押せる)',
  /\.sheet-box\{[^}]*max-height:[^}]*overflow-y:auto/.test(cssFlat.replace(/ /g, '')));
check('△▽のタップ域が44px以上・文字が大きくても潰れない(flex-shrink:0)',
  /\.ord-btn\{[^}]*flex-shrink:0;min-width:44px;min-height:44px/.test(cssFlat.replace(/ /g, '')));

/* applyTabbarSpace が実測値を CSS変数に書き込む(style.setProperty が有る環境) */
check('applyTabbarSpace が定義されている', typeof sandbox.applyTabbarSpace === 'function');
const setProps = {};
documentStub.documentElement.style.setProperty = (k, v) => { setProps[k] = v; };
let okTb = true;
try{ sandbox.applyTabbarSpace(); }catch(e){ okTb = false; console.log('    ' + e.message); }
check('applyTabbarSpace が例外なく動く', okTb);
check('タブバーの実測高さが --tabbar-h に入る(疑似DOMは50px)', setProps['--tabbar-h'] === '50px');
delete documentStub.documentElement.style.setProperty;
let okTb2 = true;
try{ sandbox.applyTabbarSpace(); }catch(e){ okTb2 = false; }
check('setProperty が無い環境でも例外を出さない(安全側に無視)', okTb2);

/* ---- [v1.1] 壊れた/古いならび順の保存値からの自動復旧 ----
   別コンテキストで「未知キー・重複・大量欠落」を含む order を仕込んで起動し、
   normalizeOrder が必ず全項目1回ずつに整えることを実証する。 */
console.log('[v1.1] 壊れた/古い ならび順 保存値からの自動復旧');
{
  const created2 = {};
  const byId2 = id => ids.has(id) ? (created2[id] || (created2[id] = makeEl())) : null;
  const store2 = {
    'okiroku.entries':'[]',
    'okiroku.prefs':JSON.stringify({ schema:2, order:['note','xxx_未知の項目','note','med'] }),
    'okiroku.guide.v1':'true'
  };
  const doc2 = {
    documentElement:Object.assign(makeEl('html'), { lang:'', dir:'' }),
    head:makeEl('head'), body:makeEl('body'), title:'',
    createElement:t => makeEl(t), getElementById:byId2, addEventListener(){},
    querySelector(sel){ const m = /^#([A-Za-z0-9_-]+)$/.exec(String(sel).trim()); return m ? byId2(m[1]) : makeEl(); },
    querySelectorAll(){ return []; }
  };
  const sb2 = {
    console:{ log(){}, warn(){}, error(){} }, document:doc2, navigator:{ language:'ja-JP' },
    localStorage:{ getItem:k => (k in store2 ? store2[k] : null), setItem:(k, v) => { store2[k] = String(v); }, removeItem:k => { delete store2[k]; } },
    location:{ hostname:'smoke.test', protocol:'https:' }, Intl, scrollTo(){}, addEventListener(){},
    setTimeout:() => 0, setInterval:() => 0, clearInterval(){}, clearTimeout(){},
    URL:{ createObjectURL:() => 'blob:', revokeObjectURL(){} },
    Image:function(){ return {}; }, FileReader:function(){ return { readAsText(){}, onload:null }; }, Blob:function(){ return {}; }
  };
  sb2.window = sb2; sb2.globalThis = sb2;
  vm.createContext(sb2);
  let boot2 = true;
  try{ vm.runInContext(src, sb2, { filename:'app-bundle-2.js' }); }
  catch(e){ boot2 = false; console.log('    ' + e.message); }
  check('壊れたならび順でも起動時に例外が出ない', boot2);
  if(boot2){
    /* ≡を押して離すだけ(並びは変えない)で保存させ、正規化後の値を取り出す */
    sb2.onDragStart({ isPrimary:true, preventDefault(){} }, 'med');
    sb2.onDragEnd();
    const fixed = JSON.parse(store2['okiroku.prefs']).order;
    check('保存されていた順(note→med)は先頭に保たれる', fixed[0] === 'note' && fixed[1] === 'med');
    check('未知キーは捨てられる', fixed.indexOf('xxx_未知の項目') < 0);
    check('重複が取り除かれる', fixed.length === new Set(fixed).size);
    check('欠けていた項目が末尾に補われ、全項目そろう', fixed.length === N);
    check('きょうのグリッドも復旧後の順で出る',
      sb2.activeItems().map(i => i.k).join(',') === fixed.filter(k => !JSON.parse(store2['okiroku.prefs']).off.includes(k)).join(','));
  }
}

/* ---- [v1.7] 保存の失敗(容量いっぱい)と、バックアップ読み込みの確かめ ----
   quotaFull=true で setItem が例外を投げる状態にして、記録・取り消し・削除・時刻・せっていが
   「例外で止まらない・画面(メモリ)と保存がずれない・容量いっぱいを知らせる」ことと、
   バックアップ読み込みが 確かめ(はい/いいえ)→形の検査→保存失敗で元に戻す になっていることを確かめる */
console.log('[v1.7] 保存失敗(容量いっぱい)・バックアップ読み込みの確かめ');
{
  const inCtx = code => vm.runInContext(code, sandbox);
  const memEntries = () => inCtx('entries');
  const memPrefs = () => inCtx('prefs');
  const toastText = () => byId('toast').textContent;
  const FULL = () => sandbox.T('toast.full');
  const stored = () => store['okiroku.entries'];
  const noThrow = (fn) => { try{ fn(); return true; }catch(e){ console.log('    例外: ' + e.message); return false; } };
  const snap = () => ({ mem: JSON.stringify(memEntries()), st: stored(), pm: JSON.stringify(memPrefs()), ps: store['okiroku.prefs'] });
  const same = (a, b) => a.mem === b.mem && a.st === b.st && a.pm === b.pm && a.ps === b.ps;
  const clearToast = () => { byId('toast').textContent = ''; };

  /* saveJSON / saveAll の戻り値 */
  check('saveJSON は書けたら true・容量いっぱいなら例外を出さず false', (() => {
    const ok1 = inCtx("saveJSON('okiroku.smoke', {a:1})") === true;
    quotaFull = true;
    let r; const ok2 = noThrow(() => { r = inCtx("saveJSON('okiroku.smoke', {a:2})"); });
    quotaFull = false;
    delete store['okiroku.smoke'];
    return ok1 && ok2 && r === false;
  })());
  check('saveAll は両方書けたとき true・容量いっぱいなら false', (() => {
    const t = inCtx('saveAll()') === true;
    quotaFull = true; const f = inCtx('saveAll()') === false; quotaFull = false;
    return t && f;
  })());

  /* きょうの記録(addEntry) */
  const A0 = snap(); const n0 = memEntries().length;
  quotaFull = true; clearToast();
  check('容量いっぱいで addEntry しても例外で止まらない', noThrow(() => sandbox.addEntry({ k:'note', m:'容量いっぱいの試し' })));
  quotaFull = false;
  check('addEntry が書けなかったら押した記録を取り消す(メモリ・保存とも元のまま)', memEntries().length === n0 && same(A0, snap()));
  check('addEntry が書けなかったら「容量がいっぱい」を出し、「保存しました」は出さない', toastText() === FULL() && toastText() !== sandbox.T('toast.saved'));
  clearToast(); sandbox.addEntry({ k:'note', m:'書ける' });
  check('容量が空けば addEntry は保存されて「保存しました」', memEntries().length === n0 + 1 && ents().length === n0 + 1 && toastText() === sandbox.T('toast.saved'));

  /* 写真つき(saveEntrySafe)は今までどおり: 容量いっぱいなら取り消して知らせる */
  const B0 = snap();
  quotaFull = true; clearToast();
  check('容量いっぱいで saveEntrySafe(写真つき)しても例外で止まらず、取り消して知らせる', noThrow(() => sandbox.saveEntrySafe({ k:'skin', c:'concern', m:'試し', p:'data:image/jpeg;base64,AAAA' })) && same(B0, snap()) && toastText() === FULL());
  quotaFull = false;

  /* 水分を1つもどす(undoWater) */
  clearToast(); sandbox.addEntry({ k:'water', c:'cup', ml:200 });
  const W0 = snap(); const nw = memEntries().length;
  quotaFull = true; clearToast();
  check('容量いっぱいで undoWater しても例外で止まらず、水分は消えず(メモリ・保存とも)、知らせる', noThrow(() => sandbox.undoWater()) && memEntries().length === nw && same(W0, snap()) && toastText() === FULL());
  quotaFull = false; clearToast();
  sandbox.undoWater();
  check('容量が空けば undoWater は1つもどして保存する', memEntries().length === nw - 1 && ents().length === nw - 1 && toastText() === sandbox.T('toast.waterUndone'));

  /* 削除(🗑 2回タップ) */
  sandbox.addEntry({ k:'note', m:'けす試し' });
  const target = memEntries()[memEntries().length - 1];
  const row = sandbox.entryRow(target, true);
  const delBtn = row.children[row.children.length - 1];
  const D0 = snap(); const nd = memEntries().length;
  quotaFull = true; clearToast();
  check('容量いっぱいで削除しても例外で止まらず、記録は消えず(メモリ・保存とも)、知らせる', noThrow(() => { tap(delBtn); tap(delBtn); }) && memEntries().length === nd && memEntries().indexOf(target) >= 0 && same(D0, snap()) && toastText() === FULL());
  quotaFull = false;
  const row2 = sandbox.entryRow(target, true); const del2 = row2.children[row2.children.length - 1];
  tap(del2); tap(del2);
  check('容量が空けば削除は消えて保存される', memEntries().length === nd - 1 && memEntries().indexOf(target) < 0 && ents().length === nd - 1);

  /* 時刻の直し */
  sandbox.addEntry({ k:'note', m:'時刻試し' });
  const te = memEntries()[memEntries().length - 1]; const t0 = te.t;
  const bodyKids0 = documentStub.body.children.length;
  sandbox.openTimeEdit(te);
  const ov = documentStub.body.children[documentStub.body.children.length - 1];
  const tbox = ov.children[0]; const tinp = tbox.children[1]; const tok = tbox.children[2].children[0];
  const wantH = (new Date(t0).getHours() + 1) % 24;
  tinp.value = String(wantH).padStart(2, '0') + ':07';
  const E0 = snap();
  quotaFull = true; clearToast();
  check('容量いっぱいで時刻を直しても例外で止まらず、時刻は元のまま(メモリ・保存とも)、知らせる', noThrow(() => tap(tok)) && te.t === t0 && same(E0, snap()) && toastText() === FULL());
  quotaFull = false;
  sandbox.openTimeEdit(te);
  const ov2 = documentStub.body.children[documentStub.body.children.length - 1];
  const tb2 = ov2.children[0]; tb2.children[1].value = String(wantH).padStart(2, '0') + ':07';
  tap(tb2.children[2].children[0]);
  check('容量が空けば時刻は直って保存される', te.t !== t0 && new Date(te.t).getMinutes() === 7 && ents().some(x => x.t === te.t));

  /* せってい: 保存できなければ元の値に戻る */
  const P0 = snap(); const themeBefore = memPrefs().theme;
  quotaFull = true; clearToast();
  check('容量いっぱいで「がめんの色=あお」を押しても例外で止まらず、色は元のまま・知らせる', noThrow(() => tap(byId('themeBtnB'))) && memPrefs().theme === themeBefore && !documentStub.body.classList.contains('theme-blue') && same(P0, snap()) && toastText() === FULL());
  clearToast();
  const ordBefore = JSON.stringify(memPrefs().order);
  let mv; noThrow(() => { mv = sandbox.moveItem(memPrefs().order[1], -1); });
  check('容量いっぱいでならび順を変えても元の並びのまま・false・知らせる', mv === false && JSON.stringify(memPrefs().order) === ordBefore && same(P0, snap()) && toastText() === FULL());
  clearToast();
  const offBefore = JSON.stringify(memPrefs().off); const langBefore = inCtx('lang');
  noThrow(() => sandbox.setLang(langBefore === 'ja' ? 'en' : 'ja'));
  check('容量いっぱいでことばを変えても元のことばのまま・設定も保存も変わらない・知らせる', inCtx('lang') === langBefore && JSON.stringify(memPrefs().off) === offBefore && same(P0, snap()) && toastText() === FULL());
  clearToast();
  const noteBox = byId('show-note'); noteBox.value = '書いた文';
  const noteBefore = memPrefs().shownote;
  noThrow(() => (noteBox._ev.input || []).forEach(h => h({ target:noteBox })));
  /* [v1.8] 打つたびには保存しない(少し待つか、欄を離れたときに保存)。ここでは欄を離れたこと(blur)で保存を走らせる */
  check('[v1.8]「つたえたいこと」は打っただけでは保存しない(待ち)', memPrefs().shownote === noteBefore && toastText() !== FULL());
  noThrow(() => (noteBox._ev.blur || []).forEach(h => h({ target:noteBox })));
  check('容量いっぱいで「つたえたいこと」を書いても保存されている文に戻り・知らせる', memPrefs().shownote === noteBefore && noteBox.value === (noteBefore || '') && toastText() === FULL());
  quotaFull = false;
  clearToast(); tap(byId('themeBtnB'));
  check('容量が空けば「がめんの色=あお」は反映されて保存される', memPrefs().theme === 'blue' && JSON.parse(store['okiroku.prefs']).theme === 'blue');
  tap(byId('themeBtnG'));

  /* バックアップ読み込み */
  const goodEntries = [ { k:'med', c:'taken', t:Date.now() - 5000 }, { k:'meal', c:'full', t:Date.now() - 4000 }, { k:'note', m:'ファイルの記録', t:Date.now() - 3000 } ];
  const good = JSON.stringify({ app:'ouchi_kaigo_kiroku', ver:2, entries:goodEntries, prefs:{ waterGoal:1700, theme:'green', schema:2 } });
  let asked = [], answer = false;
  sandbox.confirm = m => { asked.push(m); return answer; };
  sandbox.FileReader = function(){ const o = { onload:null, result:'', readAsText(f){ o.result = f._text; if(o.onload) o.onload(); } }; return o; };
  const importFile = text => { const fl = byId('bk-file'); (fl._ev.change || []).forEach(h => h({ target:{ files:[{ _text:text }], value:'' } })); };

  const I0 = snap(); const nBefore = memEntries().length;
  /* 形の合わないファイルは、聞かずに「読み込めませんでした」・何も変えない */
  const bads = {
    'JSONでない': 'これはJSONではない',
    '別のアプリ': JSON.stringify({ app:'other', entries:goodEntries }),
    'entries が無い': JSON.stringify({ app:'ouchi_kaigo_kiroku', ver:2, prefs:{} }),
    'entries が配列でない': JSON.stringify({ app:'ouchi_kaigo_kiroku', ver:2, entries:{ a:1 } }),
    '要素が文字': JSON.stringify({ app:'ouchi_kaigo_kiroku', ver:2, entries:[ 'x' ] }),
    '要素が null': JSON.stringify({ app:'ouchi_kaigo_kiroku', ver:2, entries:[ null ] }),
    '要素に k が無い': JSON.stringify({ app:'ouchi_kaigo_kiroku', ver:2, entries:[ { t:1 } ] }),
    '要素に t が無い': JSON.stringify({ app:'ouchi_kaigo_kiroku', ver:2, entries:[ { k:'note' } ] }),
    '要素の配列': JSON.stringify({ app:'ouchi_kaigo_kiroku', ver:2, entries:[ [ 1, 2 ] ] }),
    'prefs が配列': JSON.stringify({ app:'ouchi_kaigo_kiroku', ver:2, entries:goodEntries, prefs:[ 1 ] }),
    'null': 'null'
  };
  Object.keys(bads).forEach(name => {
    asked = []; clearToast(); answer = true;
    const okNoThrow = noThrow(() => importFile(bads[name]));
    check('読み込み: ' + name + ' は聞かずに「読み込めませんでした」・今の記録も設定も変わらない', okNoThrow && asked.length === 0 && same(I0, snap()) && toastText() === sandbox.T('toast.importFail'));
  });
  /* 確かめ: 「いいえ」なら何も変えない・聞く文に今の件数が入る */
  asked = []; answer = false; clearToast();
  importFile(good);
  check('読み込み: 確かめを1回出し、文に いまの記録の件数(' + nBefore + ')が入る', asked.length === 1 && asked[0].indexOf(String(nBefore)) >= 0 && asked[0] === sandbox.T('toast.importConfirm', { n:nBefore }));
  check('読み込み: 「いいえ」なら今の記録も設定も何も変わらない', same(I0, snap()) && toastText() === '');
  /* 「はい」でも保存に失敗したら、元に戻して失敗と出す */
  asked = []; answer = true; clearToast(); quotaFull = true;
  check('読み込み: 「はい」でも容量いっぱいなら例外で止まらない', noThrow(() => importFile(good)));
  quotaFull = false;
  check('読み込み: 保存に失敗したら元の記録・設定に戻り(メモリ・保存とも)、失敗と出す', same(I0, snap()) && toastText() === FULL());
  /* 「はい」→ 置き換わる */
  asked = []; answer = true; clearToast();
  importFile(good);
  check('読み込み: 「はい」なら ファイルの内容に置きかわり(記録3件・目標1700)、保存され、「読み込みました」', asked.length === 1 && memEntries().length === 3 && ents().length === 3 && memPrefs().waterGoal === 1700 && JSON.parse(store['okiroku.prefs']).waterGoal === 1700 && toastText() === sandbox.T('toast.imported'));
  check('読み込み: 12言語すべてに importConfirm({n}入り)がある', ['ja','en','de','fr','es','it','pt','nl','sv','ko','zh','ar'].every(l => { const v = I18Nsm[l].toast.importConfirm; return typeof v === 'string' && v.indexOf('{n}') >= 0 && !/[—―]/.test(v); }));
}

/* v1.11: 体温・体重を空にして「ほぞん」→ 窓を閉じず知らせる / 日付をまたいだら「きょう」を描き直す / 押す場所 44px */
console.log('[v1.11] 空の保存は窓を閉じず知らせる・日付またぎの描き直し・押す場所');
{
  const inCtx = code => vm.runInContext(code, sandbox);
  const made = [];
  const origCreate = documentStub.createElement;
  documentStub.createElement = t => { const n = origCreate(t); made.push(n); return n; };
  const runModal = (open, val) => {
    made.length = 0;
    const n0 = inCtx('entries').length;
    open();
    const ov = made.find(n => n.className === 'overlay');
    let closed = false; ov.remove = () => { closed = true; };
    const inp = made.find(n => n.tagName === 'INPUT' && n.className === 'step-in');
    const msg = made.find(n => n.className === 'step-range hidden');
    const ok = made.find(n => n.className === 'ok-btn');
    inp.value = val;
    tap(ok);
    return { closed, msg:msg.textContent, added:inCtx('entries').length - n0 };
  };
  const TEMP_MSG = () => sandbox.T('toast.range', { min:'32.0', max:'42.0' });
  const r1 = runModal(() => sandbox.openTemp(), '');
  check('体温を空で「ほぞん」: 窓は閉じず・範囲の知らせが出る・記録は増えない', !r1.closed && r1.msg === TEMP_MSG() && r1.added === 0);
  const r2 = runModal(() => sandbox.openTemp(), '36.8');
  check('体温 36.8 は今までどおり保存され窓が閉じる', r2.closed && r2.added === 1);
  const r3 = runModal(() => sandbox.openWeight(), '');
  check('体重を空で「ほぞん」: 窓は閉じず・知らせが出る・記録は増えない', !r3.closed && r3.msg !== '' && r3.added === 0);
  const r4 = runModal(() => sandbox.openWeight(), '52.5');
  check('体重 52.5 は今までどおり保存され窓が閉じる', r4.closed && r4.added === 1);
  made.length = 0;
  {
    const n0 = inCtx('entries').length;
    sandbox.openBp();
    const ov = made.find(n => n.className === 'overlay'); let closed = false; ov.remove = () => { closed = true; };
    const ins = made.filter(n => n.tagName === 'INPUT' && n.className === 'step-in');
    ins[2].value = '';
    tap(made.find(n => n.className === 'ok-btn'));
    check('血圧は脈が空でも保存される(任意の欄は止めない)', closed && inCtx('entries').length === n0 + 1);
  }
  documentStub.createElement = origCreate;

  inCtx("lastRenderedDay = '2000-01-01'; histDate = new Date(2000, 0, 1); curScreen = 'today';");
  inCtx('refreshIfDayChanged()');
  check('日付をまたいだら、戻ったときに lastRenderedDay と histDate が今日になる', inCtx('lastRenderedDay') === inCtx('dayKey(Date.now())') && inCtx('dayKey(histDate.getTime())') === inCtx('dayKey(Date.now())'));
  inCtx("lastRenderedDay = '2000-01-01'; histDate = new Date(2001, 5, 5);");
  inCtx('refreshIfDayChanged()');
  check('りれきで別の日を見ていたら、その日は動かさない', inCtx('dayKey(histDate.getTime())') === '2001-06-05');

  const css = fs.readFileSync('./style.css', 'utf8').replace(/ /g, '');
  check('🗑のけすボタン・時刻・≡の取っ手は 44px 以上', /\.del-btn\{[^}]*min-height:44px;min-width:44px/.test(css) && /\.log-time\{[^}]*min-height:44px/.test(css) && /\.ord-grip\{[^}]*min-width:44px;min-height:44px/.test(css));
}

/* v1.12: とりけす/もとにもどす・決まった時間のおくすり・体温の目印・血圧の上下の確かめ・バックアップの声かけ・BGMの裏止め・版の一元化 */
console.log('[v1.12] とりけす・決まった時間のおくすり・体温の目印・血圧の確かめ・バックアップの声かけ・BGM裏止め・版の一元化');
{
  const inCtx = code => vm.runInContext(code, sandbox);
  const toastEl = byId('toast');
  const toastActBtn = () => toastEl.children.find(c => c.className === 'toast-act');
  sandbox.setLang('en');

  /* 1) 直前の記録を「とりけす」(水分は付けない) */
  sandbox.addEntry({ k:'water', c:'sip', ml:50 });
  check('水分の記録には「とりけす」を付けない(専用の ⤺ がある)', !toastActBtn() && !toastEl.classList.contains('has-act'));
  const nA = inCtx('entries').length;
  sandbox.addEntry({ k:'meal', c:'full' });
  const ub = toastActBtn();
  check('食事を記録すると、知らせに「とりけす」のボタンが付く', !!ub && ub.textContent === sandbox.T('undo.cancelAdd') && toastEl.classList.contains('has-act') && toastEl.getAttribute('aria-hidden') === 'false' && inCtx('entries').length === nA + 1);
  tap(ub);
  check('「とりけす」を押すと、その1件だけ消えて「とりけしました」・保存も合う', inCtx('entries').length === nA && ents().length === nA && toastEl.textContent === sandbox.T('undo.cancelled') && !toastEl.classList.contains('has-act'));
  sandbox.addEntry({ k:'med', c:'taken' });
  const ub2 = toastActBtn();
  quotaFull = true; tap(ub2); quotaFull = false;
  check('「とりけす」で書けなければ消さずに、容量の知らせ', inCtx('entries').length === nA + 1 && toastEl.textContent === sandbox.T('toast.full'));
  inCtx('entries.pop()'); inCtx("saveJSON(LS_EN, entries)");

  /* 2) いま消した記録を「もとにもどす」 */
  sandbox.addEntry({ k:'note', m:'もどす試し' });
  const rec = inCtx('entries[entries.length - 1]');
  inCtx('entries.push({ k:"note", m:"あと", t:Date.now() })');   // 戻す先が末尾でないことを確かめる
  const at0 = inCtx('entries').indexOf(rec);
  const row = sandbox.entryRow(rec, true);
  const delBtn = row.children[row.children.length - 1];
  const nB = inCtx('entries').length;
  tap(delBtn); tap(delBtn);
  const rb = toastActBtn();
  check('🗑を2回押して消すと、「もとにもどす」のボタンが付く', inCtx('entries').length === nB - 1 && !!rb && rb.textContent === sandbox.T('undo.restore') && toastEl.textContent === sandbox.T('undo.deleted'));
  tap(rb);
  const after = inCtx('entries');
  check('「もとにもどす」で、消す前の位置に戻り・保存も合う・「もとにもどしました」', after.length === nB && after.indexOf(rec) === at0 && ents().length === nB && toastEl.textContent === sandbox.T('undo.restored'));
  inCtx('entries = entries.filter(x => x.m !== "もどす試し" && x.m !== "あと")'); inCtx('saveJSON(LS_EN, entries)');

  /* 3) 決まった時間のおくすり */
  const extra = byId('sheet-extra');
  sandbox.openMed();
  check('おくすりのシートの上に、朝・昼・夕・ねる前の4行が出る', extra.children.length === 5 && extra.children.slice(1).every(r => r.className === 'slot-row' && r.children.length === 3));
  const nC = inCtx('entries').length;
  const morningBtn = extra.children[1].children[1];
  tap(morningBtn);
  const slotRec = inCtx('entries').filter(e => e.k === 'med' && e.slot === 'morning')[0];
  check('朝の「のんだ」を押すと slot:morning つきで1件入り、取り消しの知らせは付かない', inCtx('entries').length === nC + 1 && slotRec && slotRec.c === 'taken' && !toastActBtn());
  check('記録した朝の行は、ボタンの代わりに「のんだ」の表示になる(二重に数えない)', extra.children[1].children.length === 2 && extra.children[1].children[1].className.indexOf('slot-done') === 0 && extra.children[2].children.length === 3);
  check('記録の行は「のんだ・朝」と出る', sandbox.entryValueText(slotRec) === sandbox.T('med.taken') + '・' + sandbox.T('slot.morning'));
  tap(extra.children[4].children[2]);
  check('ねる前の「のめなかった」は slot:bed・c:missed で入る', inCtx('entries').some(e => e.k === 'med' && e.slot === 'bed' && e.c === 'missed'));
  sandbox.openToilet();
  check('ほかのシートを開いたら、決まった時間の欄は空になる', extra.children.length === 0);
  inCtx('entries = entries.filter(e => !e.slot)'); inCtx('saveJSON(LS_EN, entries)');
  sandbox.closeSheet();

  /* 4) 体温の目印(一般的な目安) */
  const cls = v => inCtx('classifyTemp(' + v + ')');
  check('体温 37.4=目印なし / 37.5=黄 / 37.9=黄 / 38.0=赤 / 41=赤 / 数でない=なし', cls(37.4) === null && cls(37.5).lv === 'y' && cls(37.9).lv === 'y' && cls(38.0).lv === 'r' && cls(41).lv === 'r' && cls(NaN) === null);
  check('しきい値は THRESHOLDS.temp に集約(黄37.5・赤38.0)', inCtx('THRESHOLDS.temp.y') === 37.5 && inCtx('THRESHOLDS.temp.r') === 38.0);
  const trow = sandbox.entryRow({ k:'temp', tv:38.2, t:Date.now() }, false);
  check('体温38.2の記録の行に 🔴 の目印が出る', allText(trow).indexOf('🔴') >= 0);
  const trow2 = sandbox.entryRow({ k:'temp', tv:36.5, t:Date.now() }, false);
  check('体温36.5の記録の行には目印が出ない', allText(trow2).indexOf('🔴') < 0 && allText(trow2).indexOf('🟡') < 0);
  check('みせる表の体温の欄も 37.6 は 🟡 が付く', sandbox.showCell('temp', [{ k:'temp', tv:37.6, t:Date.now() }], {}).indexOf('🟡') >= 0 && sandbox.showCell('temp', [{ k:'temp', tv:36.6, t:Date.now() }], {}).indexOf('🟡') < 0);
  check('3か月の週の表の体温にも目印が出る(38.1=🔴・37.7=🟡・36.8=なし)', sandbox.weekCell('temp', [{ k:'temp', tv:38.1, t:Date.now() }]).indexOf('🔴') >= 0 && sandbox.weekCell('temp', [{ k:'temp', tv:37.7, t:Date.now() }]).indexOf('🟡') >= 0 && !/[🔴🟡]/u.test(sandbox.weekCell('temp', [{ k:'temp', tv:36.8, t:Date.now() }])));
  check('日ごとのまとめ(りれき)にも体温の目印が出る',sandbox.daySummary([{ k:'temp', tv:38.4, t:Date.now() }]).join('').indexOf('🔴') >= 0);
  {
    const made = []; const oc = documentStub.createElement;
    documentStub.createElement = t => { const n = oc(t); made.push(n); return n; };
    sandbox.openTemp();
    documentStub.createElement = oc;
    const inp = made.find(n => n.tagName === 'INPUT' && n.className === 'step-in');
    const live = made.find(n => n.className === 'step-live');
    inp.value = '38.1'; (inp._ev.input || []).forEach(h => h({}));
    check('体温の窓で 38.1 を入れると、目印と「一般的な目安」の一言が出る', live.textContent.indexOf('🔴') >= 0 && live.textContent.indexOf(sandbox.T('check.tempLive')) >= 0);
    inp.value = '36.5'; (inp._ev.input || []).forEach(h => h({}));
    check('36.5 では何も出ない', live.textContent === '');
    made.find(n => n.className === 'overlay').remove = () => {};
  }
  const htmlSrc = fs.readFileSync('./index.html', 'utf8');
  check('みせるの下に、体温の目印は一般的な目安で診断ではない、の一文がある(受診の指示は書かない)', htmlSrc.indexOf('data-i18n="check.tempNote"') > 0 && !/受診/.test(I18Nsm.ja.check.tempNote));

  /* 5) 血圧: 上 < 下 のとき確かめる(保存は止めない) */
  {
    const made = []; const oc = documentStub.createElement;
    const runBp = (s, d, answer) => {
      made.length = 0;
      documentStub.createElement = t => { const n = oc(t); made.push(n); return n; };
      sandbox.openBp();
      documentStub.createElement = oc;
      const ov = made.find(n => n.className === 'overlay'); let closed = false; ov.remove = () => { closed = true; };
      const ins = made.filter(n => n.tagName === 'INPUT' && n.className === 'step-in');
      ins[0].value = String(s); ins[1].value = String(d);
      let asked = 0;
      sandbox.confirm = msg => { asked++; sandbox._askMsg = msg; return answer; };
      const n0 = inCtx('entries').length;
      tap(made.find(n => n.className === 'ok-btn'));
      return { asked, closed, added:inCtx('entries').length - n0 };
    };
    const a1 = runBp(120, 70, true);
    check('血圧 120/70 は確かめなしでそのまま保存', a1.asked === 0 && a1.closed && a1.added === 1);
    const a2 = runBp(80, 120, false);
    check('血圧 上80・下120 で確かめが出て、「いいえ」なら窓に戻る(記録は増えない)', a2.asked === 1 && sandbox._askMsg === sandbox.T('check.bpReversed') && !a2.closed && a2.added === 0);
    const a3 = runBp(80, 120, true);
    check('「はい」ならそのまま保存される(保存は止めない)', a3.asked === 1 && a3.closed && a3.added === 1);
    const a4 = runBp(100, 100, true);
    check('上=下 は取り違えとは見ない(確かめなし)', a4.asked === 0 && a4.added === 1);
    delete sandbox.confirm;
    inCtx('entries = entries.filter(e => e.k !== "bp" || e.s === 150)'); inCtx('saveJSON(LS_EN, entries)');
  }

  /* 6) バックアップの声かけ(30日以上・あとで7日・通知ではなく画面の中だけ) */
  {
    const D = 86400000, now0 = Date.now();
    const keepE = inCtx('entries'), keepP = JSON.parse(JSON.stringify(inCtx('prefs')));
    const due = (ents2, pf) => { inCtx('entries = ' + JSON.stringify(ents2)); inCtx('prefs.lastBackup = ' + JSON.stringify(pf.lastBackup === undefined ? null : pf.lastBackup) + '; prefs.backupSnooze = ' + JSON.stringify(pf.backupSnooze === undefined ? null : pf.backupSnooze)); return inCtx('backupNagDue(' + now0 + ')'); };
    check('記録が1件もなければ出さない', due([], {}) === false);
    check('書き出したことが無く、いちばん古い記録が29日前なら出さない', due([{ k:'note', t:now0 - 29 * D }], {}) === false);
    check('書き出したことが無く、いちばん古い記録が31日前なら出す', due([{ k:'note', t:now0 - 31 * D }], {}) === true);
    check('最後の書き出しが10日前なら出さない(記録が古くても)', due([{ k:'note', t:now0 - 90 * D }], { lastBackup:now0 - 10 * D }) === false);
    check('最後の書き出しが31日前なら出す', due([{ k:'note', t:now0 - 90 * D }], { lastBackup:now0 - 31 * D }) === true);
    check('「あとで」から3日なら出さない・8日なら出す', due([{ k:'note', t:now0 - 90 * D }], { backupSnooze:now0 - 3 * D }) === false && due([{ k:'note', t:now0 - 90 * D }], { backupSnooze:now0 - 8 * D }) === true);
    due([{ k:'note', t:now0 - 90 * D }], {});
    inCtx('updateBackupNag()');
    const nag = byId('bk-nag');
    check('声かけの欄が表に出て、文言が入る', !nag.classList.contains('hidden') && byId('bk-nag-go').textContent === sandbox.T('bk.nag') && byId('bk-nag-later').textContent === sandbox.T('bk.later'));
    tap(byId('bk-nag-later'));
    check('「あとで」を押すと隠れ、保存される(7日)', nag.classList.contains('hidden') && typeof JSON.parse(store['okiroku.prefs']).backupSnooze === 'number');
    inCtx("prefs.backupSnooze = null; showScreen('today')");
    tap(byId('bk-nag-go'));
    check('声かけを押すと「せってい」へ移る', inCtx('curScreen') === 'set');
    inCtx("showScreen('today')");
    inCtx('prefs.lastBackup = null'); inCtx('noteBackupDone()');
    check('書き出せたら、その日を覚えて声かけを消す', typeof JSON.parse(store['okiroku.prefs']).lastBackup === 'number' && byId('bk-nag').classList.contains('hidden'));
    inCtx('entries = ' + JSON.stringify(keepE)); inCtx('prefs = ' + JSON.stringify(keepP)); inCtx('saveAll()');
  }

  /* 7) BGM: 裏に回ったら止め、戻ったら続ける */
  {
    const handlers = {};
    const states = [];
    class FakeCtx { constructor(){ this.state = 'running'; this.currentTime = 0; this.destination = {}; FakeCtx.last = this; } suspend(){ this.state = 'suspended'; states.push('suspend'); } resume(){ this.state = 'running'; states.push('resume'); } }
    const doc = { hidden:false, addEventListener:(t, h) => { handlers[t] = h; } };
    const sb = { console, document:doc, window:{ AudioContext:FakeCtx }, setInterval:() => 0, clearInterval(){}, setTimeout:() => 0 };
    sb.window.window = sb.window; vm.createContext(sb);
    vm.runInContext(fs.readFileSync('./audio.js', 'utf8') + '\nglobalThis.Sound = Sound;', sb);
    check('audio.js が visibilitychange を見ている', typeof handlers.visibilitychange === 'function');
    sb.Sound.setBgmEnabled(false);
    handlers.visibilitychange();
    check('まだ音を使っていないとき(AudioContext なし)に裏に回っても何も起きない', states.length === 0);
    sb.Sound.tap();
    doc.hidden = true; handlers.visibilitychange();
    check('裏に回ったら suspend する', states.join() === 'suspend' && FakeCtx.last.state === 'suspended');
    doc.hidden = true; handlers.visibilitychange();
    check('裏のままもう一度イベントが来ても二重に止めない', states.join() === 'suspend');
    doc.hidden = false; handlers.visibilitychange();
    check('戻ったら resume する', states.join() === 'suspend,resume' && FakeCtx.last.state === 'running');
    doc.hidden = false; handlers.visibilitychange();
    check('止めていないのに戻る合図が来ても resume しない', states.join() === 'suspend,resume');
  }

  /* 8) 新しい訳文・版の一元化 */
  const NEW = [['undo','cancelAdd'],['undo','cancelled'],['undo','deleted'],['undo','restore'],['undo','restored'],['slot','head'],['slot','morning'],['slot','noon'],['slot','evening'],['slot','bed'],['bk','nag'],['bk','later'],['check','bpReversed'],['check','tempNote'],['check','tempLive']];
  check('新しい15キーが12言語すべてにあり・空でなく・ダッシュ(— –)が無い', ['ja','en','de','fr','es','it','pt','nl','sv','ko','zh','ar'].every(l => NEW.every(k => { const v = I18Nsm[l][k[0]] && I18Nsm[l][k[0]][k[1]]; return typeof v === 'string' && v.length > 0 && !/[—–]/.test(v); })));
  check('ja の tempNote は index.html の初期文と同じ', htmlSrc.indexOf('data-i18n="check.tempNote">' + I18Nsm.ja.check.tempNote + '</p>') > 0);
  check('使われていない古い app.ver(1.1)は12言語から消えている', ['ja','en','de','fr','es','it','pt','nl','sv','ko','zh','ar'].every(l => I18Nsm[l].app.ver === undefined));
  const css2 = fs.readFileSync('./style.css', 'utf8').replace(/ /g, '');
  check('「とりけす」ボタン・声かけの2つのボタン・時刻の行のボタンは 44px 以上', /\.toast-act\{[^}]*min-height:44px;min-width:44px/.test(css2) && /\.bk-nag-msg\{[^}]*min-height:44px/.test(css2) && /\.bk-nag-later\{[^}]*min-height:44px;min-width:44px/.test(css2) && /\.slot-btn\{[^}]*min-height:48px/.test(css2));
  if(fs.existsSync('./bump-version.js')){   // 本体(Play 私有 repo)だけ。Web repo には android/ も bump-version.js も無い
    let verOut = '';
    try{ verOut = require('child_process').execFileSync(process.execPath, ['bump-version.js', '--check'], { encoding:'utf8' }); }catch(e){ verOut = 'NG ' + (e.stdout || e.message); }
    check('bump-version.js --check: 画面・i18n12言語・build.gradle・package.json・SW の版がそろっている', /OK: 版はそろっています/.test(verOut));
    const gr = fs.readFileSync('./android/app/build.gradle', 'utf8');
    check('v1.12: versionCode 12・versionName 1.12', /versionCode 12\b/.test(gr) && /versionName "1\.12"/.test(gr));
  }
  const swVer = fs.readFileSync('./sw.js', 'utf8').match(/okiroku-v(\d+)/);
  check('v1.12: 画面の版 1.12・SW okiroku-v14', /1\.12/.test(I18Nsm.ja.set.ver) && swVer && swVer[1] === '14');
}

console.log('');
if(fails.length){ console.log('SMOKE NG: ' + fails.length + '件失敗'); process.exit(1); }
console.log('SMOKE OK: 全チェック通過');
