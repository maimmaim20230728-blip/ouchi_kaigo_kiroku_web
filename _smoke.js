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
const localStorageStub = {
  getItem:k => (k in store ? store[k] : null),
  setItem:(k, v) => { store[k] = String(v); },
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

console.log('');
if(fails.length){ console.log('SMOKE NG: ' + fails.length + '件失敗'); process.exit(1); }
console.log('SMOKE OK: 全チェック通過');
