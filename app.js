/* おうち介護記録・そよぎ 試作v1
   ・記録は端末内(localStorage)のみ。追記型 entries=[{t,k,v,...}]
   ・項目はITEMSのデータ定義で完結。専用フロー(水分・トイレ・体温・血圧など)はk別に分岐
   ・全ボタンはTap.bind(clickは使わない)。ユーザー入力のDOM反映はtextContentのみ(innerHTML禁止)
   ・音(タップ音+BGM)は audio.js の Sound に一本化。script読込順: audio.js → tap.js → i18n.js → app.js */

/* ---- しきい値(血圧・脈・BMI)。ヒロさん監修で数値差し替え前提のため1箇所に集約 ----
   血圧/脈: red = val>=rHi または val<yLoLo / yellow = yHi<=val<rHi または yLoLo<=val<=yLoHi */
const THRESHOLDS = {
  bp: {
    s: { rHi:160, yHi:135, yLoHi:89, yLoLo:80 },  // 上(収縮期)
    d: { rHi:100, yHi:85,  yLoHi:59, yLoLo:50 },  // 下(拡張期)
    p: { rHi:120, yHi:101, yLoHi:59, yLoLo:50 },  // 脈拍
  },
  bmi: { r1:18.5, y1:20, y2:25, r2:30 },          // やせすぎ/やせぎみ/ひょうじゅん/おおめ/かなりおおめ
};

/* ---- 小さなDOMヘルパー ---- */
function el(tag, cls, text){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text != null) e.textContent = text;
  return e;
}
function fmtNum(v, dec){
  const n = Number(v);
  if(isNaN(n)) return '';
  return dec ? n.toFixed(dec) : String(Math.round(n));
}

/* ---- 項目定義 ----
   グリッド表示・せってい入切・アイコン/ラベルの元。記録フローはk別にHANDLERSで分岐
   on: 初期ON。offにした項目はせっていで再ONできる(データは消えない) */
const ITEMS = [
  { k:'water', icon:'🥛', label:'水分', on:true },     // 最重要・全幅ウィジェット
  { k:'med',   icon:'💊', label:'おくすり', on:true,
    choices:['のんだ','頓服(とんぷく)','のめなかった'], memoFor:['頓服(とんぷく)'], memoHint:'使った理由(熱・痛みなど)があれば' },
  { k:'meal',  icon:'🍚', label:'食事', on:true, choices:['完食','半分','少し','食べず'] },
  { k:'toilet',icon:'🚻', label:'トイレ', on:true },
  { k:'temp',  icon:'🌡️', label:'体温', on:true },
  { k:'sleep', icon:'🌙', label:'夜間のようす', on:true, sub:'朝に昨晩のことを' },
  { k:'mood',  icon:'🙂', label:'きぶん・ようす', on:true },
  { k:'carer', icon:'🍀', label:'わたしのきぶん', on:true, sub:'介護するあなたの' },   // 介護する人自身の記録(みせるの表には出さない)
  { k:'fall',  icon:'⚠️', label:'転倒・ヒヤリ', on:true, memoHint:'いつ・どこで・どんなふうに(例: 朝、トイレの前でふらついた)' },
  { k:'note',  icon:'📝', label:'メモ', on:true, memoHint:'気づいたこと(例: 咳が出る、かゆがっている)' },
  { k:'bp',    icon:'❤️', label:'血圧・脈', on:false },
  { k:'weight',icon:'⚖️', label:'体重', on:false },
  { k:'bath',  icon:'🛁', label:'おふろ', on:false },
  { k:'skin',  icon:'🩹', label:'皮膚のようす', on:false },
];
const ITEM = {}; ITEMS.forEach(it => ITEM[it.k] = it);
ITEM.wake = { k:'wake', icon:'🌙', label:'中途覚醒' };   // 内部項目(グリッド・トグルには出さない)

/* ---- 保存 ---- */
const LS_EN = 'okiroku.entries', LS_PF = 'okiroku.prefs';
function loadJSON(key, fb){ try{ const v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; }catch(e){ return fb; } }
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
let entries = loadJSON(LS_EN, []);
let prefs = Object.assign({ fs:0, off:null, shownote:'', waterGoal:1200, height:null, showSpan:7, music:'a', sound:true, theme:'green' }, loadJSON(LS_PF, {}));
if(!Array.isArray(prefs.off)) prefs.off = ITEMS.filter(i => !i.on).map(i => i.k);
if(typeof prefs.waterGoal !== 'number') prefs.waterGoal = 1200;
if(prefs.height === undefined) prefs.height = null;
if([7,30,90].indexOf(prefs.showSpan) < 0) prefs.showSpan = 7;   // みせるの表示期間(7=1週間/30=1か月/90=3か月)
if(['a','b','off'].indexOf(prefs.music) < 0) prefs.music = 'a';  // BGM(a=曲1あたたかい/b=曲2すんだ/off=ながさない)
if(typeof prefs.sound !== 'boolean') prefs.sound = true;         // タップ音
if(['green','blue'].indexOf(prefs.theme) < 0) prefs.theme = 'green';  // 画面の色
function saveAll(){ saveJSON(LS_EN, entries); saveJSON(LS_PF, prefs); }

/* ---- i18n(多言語) ----
   ・記録はコードで保存し、表示のたびに現在の言語へ変換する(T())
   ・未対応キーは ja(正)へフォールバック。キー名は絶対に画面へ出さない */
const I18N = (typeof window !== 'undefined' ? window : globalThis).OKIROKU_I18N;
const SUPPORTED = (I18N._order || []).filter(c => I18N[c]);
function detectLang(){
  const nav = (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages && navigator.languages[0]))) || '';
  const code = String(nav).toLowerCase().split('-')[0];
  return SUPPORTED.indexOf(code) >= 0 ? code : 'en';   // 対応外はen・jaはja
}
let lang = prefs.lang || detectLang();
if(SUPPORTED.indexOf(lang) < 0) lang = 'en';
function tget(obj, path){
  if(!obj) return undefined;
  const parts = path.split('.');
  let cur = obj;
  for(let i = 0; i < parts.length; i++){ if(cur == null) return undefined; cur = cur[parts[i]]; }
  return cur;
}
function tpl(s, vars){ return String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null) ? vars[k] : m); }
function T(path, vars){
  let v = tget(I18N[lang], path);
  if(v == null) v = tget(I18N.ja, path);   // ja(正)へフォールバック
  if(v == null) return '';
  return vars ? tpl(v, vars) : v;
}
function labelFor(k){ return T('items.' + k) || (ITEM[k] && ITEM[k].label) || k; }

/* ---- 旧データ移行(v1: 表示文字列v → v2: 言語非依存コードc/a) ----
   起動時に一度だけ(prefs.schema<2)全entryを変換して保存し直す。既知vはコード化・未知vは温存(表示はvのまま)。
   idempotent: 既にコード化済み(c/aあり・数値系はv無し)なら触らない */
function migrateOne(e){
  const k = e.k;
  if(k === 'med'){
    if(e.c != null || typeof e.v !== 'string') return;
    if(e.v.indexOf('頓服') === 0){ e.c = 'prn'; delete e.v; }
    else if(e.v === 'のんだ'){ e.c = 'taken'; delete e.v; }
    else if(e.v === 'のめなかった'){ e.c = 'missed'; delete e.v; }
    return;
  }
  if(k === 'meal'){
    if(e.c != null || typeof e.v !== 'string') return;
    const M = { '完食':'full', '半分':'half', '少し':'little', '食べず':'none' };
    if(M[e.v]){ e.c = M[e.v]; delete e.v; }
    return;
  }
  if(k === 'water'){
    if(e.c != null || typeof e.v !== 'string') return;
    const M = { 'コップ1杯':'cup', '半分':'half', '少し':'sip' };
    if(M[e.v]){ e.c = M[e.v]; delete e.v; }
    return;
  }
  if(k === 'toilet'){
    if(e.c == null && typeof e.v === 'string'){
      const v = e.v;
      if(v.indexOf('おしっこ・ふつう') === 0) e.c = 'u_norm';
      else if(v.indexOf('おしっこ・多い') === 0) e.c = 'u_much';
      else if(v.indexOf('おしっこ・少ない') === 0) e.c = 'u_little';
      else if(v.indexOf('おしっこ・わずか') === 0) e.c = 'u_tiny';
      else if(v.indexOf('おしっこ・') === 0) e.c = 'u_custom';   // 数値入力(ハルンパック等)。mlはe.mlに残る
      else if(v.indexOf('うんち・ふつう') === 0) e.c = 's_norm';
      else if(v.indexOf('うんち・やわらかい') === 0) e.c = 's_soft';
      else if(v.indexOf('うんち・かたい') === 0) e.c = 's_hard';
      else if(v.indexOf('うんち・下痢') === 0) e.c = 's_diar';
      if(e.c != null) delete e.v;
    }
    if(e.obs && !Array.isArray(e.a)){   // ようす(obs) → 付帯コードa
      if(e.obs.indexOf('色') >= 0) e.a = ['obs_color'];
      else if(e.obs.indexOf('血') >= 0) e.a = ['obs_blood'];
      if(Array.isArray(e.a)) delete e.obs;
    }
    return;
  }
  if(k === 'sleep'){
    if(e.c == null && typeof e.q === 'string'){
      const Q = { 'よくねむれた':'q_good', 'ふつう':'q_ok', 'あさかった':'q_poor' };
      if(Q[e.q]){ e.c = Q[e.q]; delete e.q; }
    }
    if(e.v != null && e.sl != null && e.wk != null) delete e.v;   // 再構築可能なら旧v破棄(旧自由記入のみvを温存)
    return;
  }
  if(k === 'mood'){
    if(e.c != null || typeof e.v !== 'string') return;
    const M = { 'おだやか':'calm', 'ふつう':'normal', '元気がない':'down', 'イライラしている':'irritable', '気分の波がはげしい':'waves' };
    if(M[e.v]){ e.c = M[e.v]; delete e.v; }
    return;
  }
  if(k === 'carer'){
    if(e.c != null || typeof e.v !== 'string') return;
    const M = { '良い':'good', 'ふつう':'ok', 'しんどい':'tired', 'かなり苦しい':'verytired', '限界':'limit' };
    if(M[e.v]){ e.c = M[e.v]; delete e.v; }
    return;
  }
  if(k === 'skin'){
    if(e.c != null || typeof e.v !== 'string') return;
    if(e.v === 'いつもどおり'){ e.c = 'normal'; delete e.v; }
    else if(e.v === '気になるところ'){ e.c = 'concern'; delete e.v; }
    return;
  }
  if(k === 'bath'){
    if(Array.isArray(e.a) || typeof e.v !== 'string') return;
    const MAP = { 'よくそうにつかった':'tub', 'からだをあらった':'wash', 'シャワーをあびた':'shower', '清拭(からだをふいた)':'wipe' };
    const parts = e.v.split('・'); const codes = []; let allok = true;
    parts.forEach(p => { if(MAP[p]) codes.push(MAP[p]); else allok = false; });
    if(allok && codes.length){ e.a = codes; delete e.v; }   // 未知片が混じれば温存(vのまま表示)
    return;
  }
  if(k === 'temp'){ if(e.tv == null && e.v != null){ const n = parseFloat(e.v); if(!isNaN(n)) e.tv = n; } if(e.v != null) delete e.v; return; }
  if(k === 'weight'){ if(e.wv == null && e.v != null){ const n = parseFloat(e.v); if(!isNaN(n)) e.wv = n; } if(e.v != null) delete e.v; return; }
  if(k === 'bp'){ if(e.v != null) delete e.v; return; }
  if(k === 'wake' || k === 'fall' || k === 'note'){ if(e.v != null) delete e.v; return; }
  /* 未知k: 何もしない(温存) */
}
function migrateEntries(arr){ arr.forEach(migrateOne); }
if((prefs.schema || 0) < 2){ migrateEntries(entries); prefs.schema = 2; saveAll(); }

/* ---- 表示テキスト生成(記録コード → 現在の言語の文字列) ----
   コードが無い(未知)旧データは e.v をそのまま出すフォールバック(壊さない) */
function isPeeCode(c){ return c && c.indexOf('u_') === 0; }
function toiletFormLabel(e){
  const c = e.c;
  if(c === 'u_custom') return e.ml != null ? (e.ml + 'ml') : '';
  const K = { u_norm:'toilet.u_norm', u_much:'toilet.u_much', u_little:'toilet.u_little', u_tiny:'toilet.u_tiny',
              s_norm:'toilet.s_norm', s_soft:'toilet.s_soft', s_hard:'toilet.s_hard', s_diar:'toilet.s_diar' };
  return K[c] ? T(K[c]) : '';
}
function toiletText(e){
  if(!e.c) return e.v != null ? e.v : '';
  return (isPeeCode(e.c) ? T('toilet.pee') : T('toilet.poo')) + '・' + toiletFormLabel(e);
}
function toiletObsText(e){
  if(Array.isArray(e.a)){
    const O = { obs_color:'toilet.obs_color', obs_blood:'toilet.obs_blood' };
    return e.a.filter(x => O[x]).map(x => T(O[x])).join('・');
  }
  return e.obs != null ? e.obs : '';
}
function bpValueText(e){
  if(e.s == null || e.d == null) return e.v != null ? e.v : '';
  let v = e.s + ' / ' + e.d;
  if(e.pl != null) v += '・' + T('bp.pulsePrefix') + e.pl;
  return v;
}
function sleepText(e){
  if(e.sl == null || e.wk == null) return e.v != null ? e.v : '';
  let s = T('sleep.rowMain', { sl:e.sl, wk:e.wk, hrs:e.hrs });
  const Q = { q_good:'sleep.q_good', q_ok:'sleep.q_ok', q_poor:'sleep.q_poor' };
  if(e.c && Q[e.c]) s += '・' + T(Q[e.c]);
  return s;
}
function bathText(e){
  if(Array.isArray(e.a)){
    const M = { tub:'bath.tub', wash:'bath.wash', shower:'bath.shower', wipe:'bath.wipe' };
    return e.a.map(c => M[c] ? T(M[c]) : c).join('・');
  }
  return e.v != null ? e.v : '';
}
function entryValueText(e){
  const k = e.k, c = e.c;
  if(k === 'med'){ const M = { taken:'med.taken', prn:'med.prn', missed:'med.missed' }; if(M[c]) return T(M[c]); }
  else if(k === 'water'){ const M = { cup:'water.rowCup', half:'water.rowHalf', sip:'water.rowSip' }; if(M[c]) return T(M[c]); }
  else if(k === 'meal'){ const M = { full:'meal.full', half:'meal.half', little:'meal.little', none:'meal.none' }; if(M[c]) return T(M[c]); }
  else if(k === 'toilet') return toiletText(e);
  else if(k === 'temp') return e.tv != null ? fmtNum(e.tv, 1) + T('temp.unit') : (e.v != null ? e.v : '');
  else if(k === 'sleep') return sleepText(e);
  else if(k === 'wake') return T('sleep.wokeAtNight');
  else if(k === 'mood'){ const M = { calm:'mood.calm', normal:'mood.normal', down:'mood.down', irritable:'mood.irritable', waves:'mood.waves' }; if(M[c]) return T(M[c]); }
  else if(k === 'carer'){ const M = { good:'carer.good', ok:'carer.ok', tired:'carer.tired', verytired:'carer.verytired', limit:'carer.limit' }; if(M[c]) return T(M[c]); }
  else if(k === 'bp') return bpValueText(e);
  else if(k === 'weight') return e.wv != null ? fmtNum(e.wv, 1) + T('weight.unit') : (e.v != null ? e.v : '');
  else if(k === 'bath') return bathText(e);
  else if(k === 'skin'){ if(c === 'normal') return T('skin.normal'); if(c === 'concern') return T('skin.concernRow'); }
  if(k === 'fall' || k === 'note') return '';   // メモ(m)のみ・値なし
  return e.v != null ? e.v : '';
}

/* ---- 日付ユーティリティ(曜日・月日は Intl.DateTimeFormat で各言語生成。時刻HH:MMは現行のまま) ---- */
function intlFmt(opts){ try{ return new Intl.DateTimeFormat(lang, opts); }catch(e){ return null; } }
function dayKey(t){ const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function fmtDate(d){ const f = intlFmt({ month:'long', day:'numeric', weekday:'short' }); return f ? f.format(d) : ((d.getMonth()+1) + '/' + d.getDate()); }
function mdShort(d){ const f = intlFmt({ month:'numeric', day:'numeric', weekday:'short' }); return f ? f.format(d) : ((d.getMonth()+1) + '/' + d.getDate()); }
function mdOnly(d){ const f = intlFmt({ month:'numeric', day:'numeric' }); return f ? f.format(d) : ((d.getMonth()+1) + '/' + d.getDate()); }
function fmtTime(t){ const d = new Date(t); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
function sameDay(t, d){ return dayKey(t) === dayKey(d.getTime()); }
function addMin(hhmm, delta){
  const p = hhmm.split(':'); let h = Number(p[0]), m = Number(p[1]);
  let t = (((h*60+m+delta) % 1440) + 1440) % 1440;
  return String(Math.floor(t/60)).padStart(2,'0') + ':' + String(t%60).padStart(2,'0');
}
function sleepHours(sl, wk){
  const a = sl.split(':'), b = wk.split(':');
  let diff = (Number(b[0])*60+Number(b[1])) - (Number(a[0])*60+Number(a[1]));
  if(diff < 0) diff += 1440;
  return Math.round(diff/60*2)/2;   // 30分単位
}

/* ---- 直近の同種記録の値(数値/文字列) ---- */
function lastVal(k, field, fb){
  for(let i = entries.length-1; i >= 0; i--){
    const e = entries[i];
    if(e.k === k && e[field] != null && !isNaN(e[field])) return Number(e[field]);
  }
  return fb;
}
function lastStr(k, field, fb){
  for(let i = entries.length-1; i >= 0; i--){
    const e = entries[i];
    if(e.k === k && typeof e[field] === 'string' && e[field]) return e[field];
  }
  return fb;
}

/* ---- しきい値判定(血圧・脈・BMI) ---- */
function classifyBp(m, v){
  if(v == null || isNaN(v)) return null;
  const Th = THRESHOLDS.bp[m];   // Th=しきい値(グローバルの翻訳関数T()と混同しないよう別名)
  if(v >= Th.rHi) return { lv:'r', dir:'hi' };
  if(v >= Th.yHi) return { lv:'y', dir:'hi' };
  if(v < Th.yLoLo) return { lv:'r', dir:'lo' };
  if(v <= Th.yLoHi) return { lv:'y', dir:'lo' };
  return null;   // ふつう(マーカーなし)
}
function bpChipText(kind, c, isPulse){   // kind: 'sys' / 'dia' / 'pulse'
  const emo = c.lv === 'r' ? '🔴' : '🟡';
  if(isPulse){
    const w = c.dir === 'hi' ? (c.lv === 'r' ? T('chip.pulseFast') : T('chip.pulseFastMild')) : (c.lv === 'r' ? T('chip.pulseSlow') : T('chip.pulseSlowMild'));
    return T('bp.pulseShort') + w + emo;
  }
  const prefix = kind === 'sys' ? T('bp.sysShort') : T('bp.diaShort');
  const w = c.dir === 'hi' ? (c.lv === 'r' ? T('chip.high') : T('chip.highMild')) : (c.lv === 'r' ? T('chip.low') : T('chip.lowMild'));
  return prefix + w + emo;
}
function bpWorstOf(e){
  let worst = null;
  [['s', e.s], ['d', e.d], ['p', e.pl]].forEach(pair => {
    const c = classifyBp(pair[0], pair[1]);
    if(c){ if(c.lv === 'r') worst = 'r'; else if(c.lv === 'y' && worst !== 'r') worst = 'y'; }
  });
  return worst;
}
function bmiOf(wv){
  const h = prefs.height;
  if(!h || !wv || isNaN(wv)) return null;
  const m = h / 100;
  return wv / (m * m);
}
function bmiChip(bmi){
  const B = THRESHOLDS.bmi;
  if(bmi < B.r1) return { lv:'r', label:T('bmi.thin') + '🔴' };
  if(bmi < B.y1) return { lv:'y', label:T('bmi.thinMild') + '🟡' };
  if(bmi < B.y2) return { lv:'',  label:T('bmi.normal') };
  if(bmi < B.r2) return { lv:'y', label:T('bmi.over') + '🟡' };
  return { lv:'r', label:T('bmi.overMuch') + '🔴' };
}

/* ---- 画面切替 ---- */
const SCREENS = ['today','hist','show','set'];
let curScreen = 'today';
function showScreen(name){
  curScreen = name;
  SCREENS.forEach(s => document.getElementById('scr-' + s).classList.toggle('hidden', s !== name));
  document.querySelectorAll('#tabbar .tab').forEach(b => b.classList.toggle('active', b.dataset.scr === name));
  if(name === 'today') renderToday();
  if(name === 'hist') renderHist();
  if(name === 'show') renderShow();
  if(name === 'set') renderSet();
  window.scrollTo(0, 0);
}

/* ---- トースト ---- */
let toastTimer = null;
function toast(msg){
  const el2 = document.getElementById('toast');
  el2.textContent = msg; el2.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el2.classList.add('hidden'), 1500);
}

/* ---- 記録追加 ---- */
function addEntry(obj){
  entries.push(Object.assign({ t: Date.now() }, obj));
  saveAll();
  toast(T('toast.saved'));
  renderToday();
}
/* 写真つき記録は容量超過に配慮して個別保存 */
function saveEntrySafe(e){
  entries.push(Object.assign({ t: Date.now() }, e));
  let msg = T('toast.saved');
  try{
    saveJSON(LS_EN, entries);
  }catch(err){
    if(e.p){
      const rec = entries[entries.length - 1];
      delete rec.p;
      try{ saveJSON(LS_EN, entries); msg = T('toast.savedNoPhoto'); }
      catch(e2){ entries.pop(); toast(T('toast.full')); renderToday(); return; }
    } else {
      entries.pop(); toast(T('toast.full')); return;
    }
  }
  try{ saveJSON(LS_PF, prefs); }catch(e3){}
  toast(msg);
  renderToday();
}

/* ---- 汎用オーバーレイ(動的生成・使い捨て) ---- */
function buildOverlay(){
  const ov = el('div', 'overlay');
  const box = el('div', 'sheet-box');
  ov.appendChild(box);
  document.body.appendChild(ov);
  return { ov, box, close: () => ov.remove() };
}

/* ---- 選択シート(#sheet を使い回し) ---- */
const sheet = document.getElementById('sheet');
function closeSheet(){ sheet.classList.add('hidden'); }
function openChoiceSheet(title, choices){
  document.getElementById('sheet-title').textContent = title;
  const box = document.getElementById('sheet-choices');
  box.textContent = '';
  choices.forEach(c => {
    const b = el('button', 'choice-btn', c.label);
    Tap.bind(b, () => c.on());
    box.appendChild(b);
  });
  sheet.classList.remove('hidden');
}
Tap.bind(document.getElementById('sheet-cancel'), () => sheet.classList.add('hidden'), { silent:true });

/* ---- 入力モーダル(#modal を使い回す。num=数値1つ / memo=自由記述) ---- */
const modal = document.getElementById('modal');
let modalDone = null, modalKind = 'num';
const mNum = document.getElementById('modal-num'), mNum2 = document.getElementById('modal-num2');
const mNumL = document.getElementById('modal-num-label'), mNum2L = document.getElementById('modal-num2-label');
const mText = document.getElementById('modal-text');
function openModal(opt){
  document.getElementById('modal-title').textContent = opt.title;
  modalKind = opt.kind; modalDone = opt.done;
  mNum.classList.toggle('hidden', opt.kind === 'memo');
  mNumL.classList.toggle('hidden', opt.kind === 'memo');
  mNum2.classList.add('hidden'); mNum2L.classList.add('hidden');   // num2は現行フローでは未使用
  mText.classList.toggle('hidden', opt.kind !== 'memo');
  mNum.value = ''; mNum2.value = ''; mText.value = '';
  mNumL.textContent = opt.numHint || '';
  mText.placeholder = opt.hint || '';
  modal.classList.remove('hidden');
  setTimeout(() => (opt.kind === 'memo' ? mText : mNum).focus(), 50);
}
Tap.bind(document.getElementById('modal-ok'), () => {
  if(!modalDone) return;
  if(modalKind === 'memo'){
    modal.classList.add('hidden');
    modalDone(mText.value.trim());
  } else {
    if(!mNum.value) return;
    modal.classList.add('hidden');
    modalDone(mNum.value.trim());
  }
});
Tap.bind(document.getElementById('modal-cancel'), () => modal.classList.add('hidden'), { silent:true });
function openMemoModal(title, hint, done){ openModal({ title, kind:'memo', hint, done }); }

/* ---- 数値ステッパーモーダル(体温・体重・血圧で共用) ----
   rows: [{ key,label,unit,value,step,min,max,dec }]  ※+-はmin/max内でクランプ・自由記入は無制限 */
function openStepModal(opt){
  const ctx = buildOverlay();
  ctx.box.appendChild(el('div', 'sheet-title', opt.title));
  const inputs = {};
  opt.rows.forEach(r => {
    const block = el('div', 'step-block');
    if(r.label) block.appendChild(el('div', 'step-label', r.label));
    const row = el('div', 'step-row');
    const minus = el('button', 'step-btn', '−');
    const inp = document.createElement('input');
    inp.type = 'number'; inp.className = 'step-in'; inp.inputMode = 'decimal';
    inp.step = r.step; inp.value = fmtNum(r.value, r.dec);
    const plus = el('button', 'step-btn', '＋');
    row.appendChild(minus); row.appendChild(inp); row.appendChild(plus);
    if(r.unit) row.appendChild(el('span', 'step-unit', r.unit));
    block.appendChild(row); ctx.box.appendChild(block);
    inputs[r.key] = inp;
    const bump = dir => {
      let cur = parseFloat(inp.value);
      if(isNaN(cur)) cur = r.value;
      cur += dir * r.step;
      if(cur < r.min) cur = r.min;
      if(cur > r.max) cur = r.max;
      inp.value = fmtNum(cur, r.dec);
      updateLive();
    };
    Tap.bind(minus, () => bump(-1));
    Tap.bind(plus, () => bump(1));
    inp.addEventListener('input', updateLive);
  });
  let liveEl = null;
  if(opt.live){ liveEl = el('div', 'step-live', ''); ctx.box.appendChild(liveEl); }
  function getVals(){ const o = {}; for(const k in inputs) o[k] = inputs[k].value.trim(); return o; }
  function updateLive(){ if(liveEl && opt.onLive) liveEl.textContent = opt.onLive(getVals()); }
  updateLive();
  let noteInp = null;
  if(opt.note){
    noteInp = document.createElement('textarea');
    noteInp.rows = 2; noteInp.className = 'text-in';
    noteInp.placeholder = opt.notePlaceholder || '';
    ctx.box.appendChild(noteInp);
  }
  const btnRow = el('div', 'fs-row');
  const ok = el('button', 'ok-btn', T('common.save'));
  const cancel = el('button', 'cancel-btn', T('common.cancel'));
  btnRow.appendChild(ok); btnRow.appendChild(cancel);
  ctx.box.appendChild(btnRow);
  Tap.bind(ok, () => { const vals = getVals(); ctx.close(); opt.onDone(vals, noteInp ? noteInp.value.trim() : ''); });
  Tap.bind(cancel, () => ctx.close(), { silent:true });
}

/* ---- 複数選択シート(おふろ) ----
   opts: [{ code, label }]。done には選択された code の配列(元の並び順)を返す */
function openMultiSelect(title, opts, done){
  const ctx = buildOverlay();
  ctx.box.appendChild(el('div', 'sheet-title', title));
  const sel = {};
  const btnRow = el('div', 'fs-row');
  const ok = el('button', 'ok-btn', T('common.save')); ok.disabled = true;
  const cancel = el('button', 'cancel-btn', T('common.cancel'));
  const list = el('div', 'ms-list');
  opts.forEach(o => {
    const b = el('button', 'ms-btn', o.label);
    Tap.bind(b, () => {
      if(sel[o.code]){ delete sel[o.code]; b.classList.remove('sel'); }
      else { sel[o.code] = true; b.classList.add('sel'); }
      ok.disabled = Object.keys(sel).length === 0;
    });
    list.appendChild(b);
  });
  ctx.box.appendChild(list);
  btnRow.appendChild(ok); btnRow.appendChild(cancel);
  ctx.box.appendChild(btnRow);
  Tap.bind(ok, () => {
    const arr = opts.filter(o => sel[o.code]).map(o => o.code);
    if(!arr.length) return;
    ctx.close(); done(arr);
  });
  Tap.bind(cancel, () => ctx.close(), { silent:true });
}

/* ---- 画像の縮小(長辺640px・JPEG0.72) ---- */
function resizeImage(file, maxEdge, quality, cb){
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    let w = img.naturalWidth, h = img.naturalHeight;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    w = Math.round(w * scale); h = Math.round(h * scale);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(img, 0, 0, w, h);
    let dataUrl = null;
    try{ dataUrl = cv.toDataURL('image/jpeg', quality); }catch(e){ dataUrl = null; }
    URL.revokeObjectURL(url);
    cb(dataUrl);
  };
  img.onerror = () => { URL.revokeObjectURL(url); cb(null); };
  img.src = url;
}
/* 画像 全画面表示(タップで閉じる) */
function openImageFull(src){
  const ov = el('div', 'img-full');
  const img = el('img'); img.src = src;
  ov.appendChild(img);
  document.body.appendChild(ov);
  Tap.bind(ov, () => ov.remove(), { silent:true });
}

/* ================= 各記録フロー ================= */

/* 水分(全幅ウィジェット) */
function waterTodayMl(){
  const today = new Date();
  return entries.filter(e => e.k === 'water' && sameDay(e.t, today))
                .reduce((s, e) => s + (Number(e.ml) || 0), 0);
}
function undoWater(){
  const today = new Date();
  let idx = -1, best = -Infinity;
  entries.forEach((e, i) => { if(e.k === 'water' && sameDay(e.t, today) && e.t >= best){ best = e.t; idx = i; } });
  if(idx < 0){ toast(T('toast.waterNoUndo')); return; }
  entries.splice(idx, 1);
  saveAll();
  toast(T('toast.waterUndone'));
  renderToday();
}
function waterCard(){
  const card = el('div', 'water-card');
  const todayMl = waterTodayMl();
  const goal = prefs.waterGoal;
  card.appendChild(el('div', 'water-head', '🥛 ' + T('water.head') + '　' + T('water.todayLabel') + ' ' + todayMl + ' / ' + goal + T('water.unit')));
  const bar = el('div', 'water-bar');
  const fill = el('div', 'water-fill');
  const pct = goal > 0 ? Math.min(100, Math.round(todayMl / goal * 100)) : 0;
  fill.style.width = pct + '%';
  if(todayMl >= goal && goal > 0) fill.classList.add('full');
  bar.appendChild(fill); card.appendChild(bar);
  const judge = el('div', 'water-judge');
  if(goal > 0 && todayMl >= goal){
    const over = todayMl - goal;
    judge.textContent = over > 0 ? T('water.over', { n:over }) : T('water.reached');
  } else {
    judge.textContent = T('water.remain', { n:Math.max(0, goal - todayMl) });
  }
  card.appendChild(judge);
  const btns = el('div', 'water-btns');
  [['water.btnCup', 'cup', 200], ['water.btnHalf', 'half', 100], ['water.btnSip', 'sip', 50]].forEach(spec => {
    const b = el('button', 'water-btn', T(spec[0]));
    Tap.bind(b, () => addEntry({ k:'water', c:spec[1], ml:spec[2] }));
    btns.appendChild(b);
  });
  card.appendChild(btns);
  const undo = el('button', 'water-undo', T('water.undo'));
  Tap.bind(undo, undoWater, { silent:true });
  card.appendChild(undo);
  return card;
}

/* おくすり */
function openMed(){
  openChoiceSheet(T('med.title'), [
    { label:T('med.taken'),  on:() => { closeSheet(); addEntry({ k:'med', c:'taken' }); } },
    { label:T('med.prn'),    on:() => { closeSheet(); openTonpuku(); } },   // 頓服は専用モーダル(過去の理由+自由記入)
    { label:T('med.missed'), on:() => { closeSheet(); addEntry({ k:'med', c:'missed' }); } },
  ]);
}
/* 頓服(とんぷく)の過去の理由: c==='prn' の記録のm を 重複除去・新しい順・最大6件(理由mは自由記述=言語混在OK) */
function tonpukuReasons(){
  const seen = {}, out = [];
  for(let i = entries.length - 1; i >= 0; i--){   // 末尾=新しい順に走査
    const e = entries[i];
    if(e.k === 'med' && e.c === 'prn' && e.m){
      if(!seen[e.m]){ seen[e.m] = 1; out.push(e.m); if(out.length >= 6) break; }
    }
  }
  return out;
}
/* 頓服の理由モーダル(過去の理由ボタン+自由記入。空でも記録可=急ぐ時に記録を妨げない) */
function openTonpuku(){
  const ctx = buildOverlay();
  ctx.box.appendChild(el('div', 'sheet-title', T('med.tonpukuTitle')));
  const save = m => { ctx.close(); addEntry({ k:'med', c:'prn', m:m || '' }); };
  const reasons = tonpukuReasons();
  if(reasons.length){
    const list = el('div', 'ton-reasons');
    reasons.forEach(r => {
      const b = el('button', 'ton-reason-btn', r);   // タップで即記録
      Tap.bind(b, () => save(r));
      list.appendChild(b);
    });
    ctx.box.appendChild(list);
  }
  const ta = document.createElement('textarea');
  ta.rows = 2; ta.className = 'text-in';
  ta.placeholder = T('med.tonpukuPlaceholder');
  ctx.box.appendChild(ta);
  const btnRow = el('div', 'fs-row');
  const ok = el('button', 'ok-btn', T('common.save'));
  const cancel = el('button', 'cancel-btn', T('common.cancel'));
  btnRow.appendChild(ok); btnRow.appendChild(cancel);
  ctx.box.appendChild(btnRow);
  Tap.bind(ok, () => save(ta.value.trim()));
  Tap.bind(cancel, () => ctx.close(), { silent:true });
}

/* 食事 */
function openMeal(){
  openChoiceSheet(T('meal.title'), [
    ['full','meal.full'], ['half','meal.half'], ['little','meal.little'], ['none','meal.none']
  ].map(o => ({ label:T(o[1]), on:() => { closeSheet(); addEntry({ k:'meal', c:o[0] }); } })));
}

/* トイレ(2〜3段階) */
function openToilet(){
  openChoiceSheet(T('toilet.title'), [
    { label:T('toilet.pee'), on:() => toiletPee() },
    { label:T('toilet.poo'), on:() => toiletPoo() },
  ]);
}
function toiletPee(){
  const opts = [['u_norm','toilet.u_norm',300], ['u_much','toilet.u_much',400], ['u_little','toilet.u_little',200], ['u_tiny','toilet.u_tiny',100]];
  const choices = opts.map(o => ({ label:T(o[1]), on:() => toiletObs({ k:'toilet', c:o[0], ml:o[2] }) }));
  choices.push({ label:T('toilet.numEntry'), on:() => {
    closeSheet();
    openModal({ title:T('toilet.numTitle'), kind:'num', numHint:T('toilet.numHint'), done:(val) => {
      const ml = parseInt(val, 10);
      toiletObs({ k:'toilet', c:'u_custom', ml:isNaN(ml) ? null : ml });
    }});
  }});
  openChoiceSheet(T('toilet.peeTitle'), choices);
}
function toiletPoo(){
  openChoiceSheet(T('toilet.pooTitle'), [
    ['s_norm','toilet.s_norm'], ['s_soft','toilet.s_soft'], ['s_hard','toilet.s_hard'], ['s_diar','toilet.s_diar']
  ].map(o => ({ label:T(o[1]), on:() => toiletObs({ k:'toilet', c:o[0] }) })));
}
function toiletObs(base){
  openChoiceSheet(T('toilet.obsTitle'), [
    { label:T('toilet.obsNormal'), on:() => { closeSheet(); saveToilet(base, null); } },
    { label:T('toilet.obs_color'), on:() => { closeSheet(); saveToilet(base, 'obs_color'); } },
    { label:T('toilet.obs_blood'), on:() => { closeSheet(); saveToilet(base, 'obs_blood'); } },
  ]);
}
function saveToilet(base, obsCode){
  const e = Object.assign({}, base);
  if(e.ml == null) delete e.ml;
  if(obsCode) e.a = [obsCode];
  addEntry(e);
}
function toiletTodaySub(){
  const today = new Date();
  const arr = entries.filter(e => e.k === 'toilet' && sameDay(e.t, today));
  const u = arr.filter(e => isPeeCode(e.c)).length;
  return T('toilet.todaySub', { u:u, s:(arr.length - u) });
}

/* 体温 */
function openTemp(){
  openStepModal({
    title:T('temp.title'),
    rows:[{ key:'tv', unit:T('temp.unit'), value:lastVal('temp','tv',36.5), step:0.1, min:35.0, max:41.0, dec:1 }],
    note:true, notePlaceholder:T('temp.notePlaceholder'),
    onDone:(vals, note) => {
      const tv = parseFloat(vals.tv);
      if(isNaN(tv)) return;
      addEntry({ k:'temp', tv, m:note || '' });
    }
  });
}

/* 夜間のようす(睡眠) */
function openSleep(){
  openChoiceSheet(T('sleep.title'), [
    { label:T('sleep.wakeNow'), on:() => { closeSheet(); addEntry({ k:'wake' }); } },
    { label:T('sleep.morning'), on:() => { closeSheet(); openSleepSummary(); } },
  ]);
}
function openSleepSummary(){
  const ctx = buildOverlay();
  ctx.box.appendChild(el('div', 'sheet-title', T('sleep.summaryTitle')));
  let sl = lastStr('sleep', 'sl', '22:00');
  let wk = lastStr('sleep', 'wk', '06:00');
  let q = 'q_ok';
  function timeRow(labelText, get, set){
    ctx.box.appendChild(el('div', 'step-label', labelText));
    const row = el('div', 'step-row');
    const minus = el('button', 'step-btn', T('sleep.minus30'));
    const disp = el('div', 'time-disp', get());
    const plus = el('button', 'step-btn', T('sleep.plus30'));
    row.appendChild(minus); row.appendChild(disp); row.appendChild(plus);
    ctx.box.appendChild(row);
    Tap.bind(minus, () => { set(addMin(get(), -30)); disp.textContent = get(); updateHrs(); });
    Tap.bind(plus,  () => { set(addMin(get(),  30)); disp.textContent = get(); updateHrs(); });
  }
  timeRow(T('sleep.sleptTime'), () => sl, v => sl = v);
  timeRow(T('sleep.wokeTime'),  () => wk, v => wk = v);
  const live = el('div', 'step-live', '');
  ctx.box.appendChild(live);
  function updateHrs(){ live.textContent = T('sleep.hoursLive', { n:sleepHours(sl, wk) }); }
  updateHrs();
  ctx.box.appendChild(el('div', 'step-label', T('sleep.qualityLabel')));
  const seg = el('div', 'seg');
  const QS = [['q_good','sleep.q_good'], ['q_ok','sleep.q_ok'], ['q_poor','sleep.q_poor']];
  const segBtns = {};
  QS.forEach(qq => {
    const b = el('button', 'seg-btn' + (qq[0] === q ? ' sel' : ''), T(qq[1]));
    Tap.bind(b, () => { q = qq[0]; QS.forEach(x => segBtns[x[0]].classList.toggle('sel', x[0] === q)); });
    segBtns[qq[0]] = b; seg.appendChild(b);
  });
  ctx.box.appendChild(seg);
  const btnRow = el('div', 'fs-row');
  const ok = el('button', 'ok-btn', T('common.save'));
  const cancel = el('button', 'cancel-btn', T('common.cancel'));
  btnRow.appendChild(ok); btnRow.appendChild(cancel);
  ctx.box.appendChild(btnRow);
  Tap.bind(ok, () => {
    const hrs = sleepHours(sl, wk);
    ctx.close();
    addEntry({ k:'sleep', c:q, sl, wk, hrs });
  });
  Tap.bind(cancel, () => ctx.close(), { silent:true });
}

/* きぶん・ようす(5択+備考) */
function openMood(){
  const CH = [['calm','mood.calm'], ['normal','mood.normal'], ['down','mood.down'], ['irritable','mood.irritable'], ['waves','mood.waves']];
  openChoiceSheet(T('mood.title'), CH.map(o => ({
    label:T(o[1]), on:() => {
      closeSheet();
      openMemoModal('🙂 ' + T(o[1]), T('mood.memoHint'), memo => addEntry({ k:'mood', c:o[0], m:memo || '' }));
    }
  })));
}

/* わたしのきぶん(介護する人自身・5択+備考) */
function openCarer(){
  const CH = [['good','carer.good'], ['ok','carer.ok'], ['tired','carer.tired'], ['verytired','carer.verytired'], ['limit','carer.limit']];
  openChoiceSheet(T('carer.title'), CH.map(o => ({
    label:T(o[1]), on:() => {
      closeSheet();
      openMemoModal('🍀 ' + T(o[1]), T('carer.memoHint'), memo => addEntry({ k:'carer', c:o[0], m:memo || '' }));
    }
  })));
}

/* 転倒・ヒヤリ / メモ(自由記述) */
function openFall(){ openMemoModal(T('fall.title'), T('items.fallHint'), m => { if(m) addEntry({ k:'fall', m }); }); }
function openNote(){ openMemoModal(T('note.title'), T('items.noteHint'), m => { if(m) addEntry({ k:'note', m }); }); }

/* 血圧・脈 */
function openBp(){
  openStepModal({
    title:T('bp.title'),
    rows:[
      { key:'s', label:T('bp.sysLabel'),   value:lastVal('bp','s',120), step:5, min:50, max:250, dec:0 },
      { key:'d', label:T('bp.diaLabel'),   value:lastVal('bp','d',70),  step:5, min:30, max:150, dec:0 },
      { key:'p', label:T('bp.pulseLabel'), value:lastVal('bp','pl',70), step:5, min:30, max:200, dec:0 },
    ],
    onDone:(vals) => {
      const s = parseInt(vals.s, 10), d = parseInt(vals.d, 10), p = parseInt(vals.p, 10);
      if(isNaN(s) || isNaN(d)) return;
      const e = { k:'bp', s, d };
      if(!isNaN(p)) e.pl = p;
      addEntry(e);
    }
  });
}

/* 体重(BMI) */
function openWeight(){
  openStepModal({
    title:T('weight.title'),
    rows:[{ key:'wv', unit:T('weight.unit'), value:lastVal('weight','wv',50), step:0.5, min:20, max:150, dec:1 }],
    live: !!prefs.height,
    onLive:(vals) => {
      const b = bmiOf(parseFloat(vals.wv));
      if(b == null) return '';
      return T('bmi.label') + ' ' + b.toFixed(1) + '　' + bmiChip(b).label;
    },
    onDone:(vals) => {
      const wv = parseFloat(vals.wv);
      if(isNaN(wv)) return;
      addEntry({ k:'weight', wv });
    }
  });
}

/* おふろ(複数選択) */
function openBath(){
  openMultiSelect(T('bath.title'), [
    { code:'tub',    label:T('bath.tub') },
    { code:'wash',   label:T('bath.wash') },
    { code:'shower', label:T('bath.shower') },
    { code:'wipe',   label:T('bath.wipe') },
  ], sel => addEntry({ k:'bath', a:sel }));
}

/* 皮膚のようす(自由記入+写真) */
function openSkin(){
  openChoiceSheet(T('skin.title'), [
    { label:T('skin.normal'),  on:() => { closeSheet(); addEntry({ k:'skin', c:'normal' }); } },
    { label:T('skin.concern'), on:() => { closeSheet(); openSkinConcern(); } },
  ]);
}
function openSkinConcern(){
  const ctx = buildOverlay();
  ctx.box.appendChild(el('div', 'sheet-title', T('skin.concernTitle')));
  const ta = document.createElement('textarea');
  ta.rows = 3; ta.className = 'text-in';
  ta.placeholder = T('skin.concernPlaceholder');
  ctx.box.appendChild(ta);
  let photoData = null;
  /* 📷カメラ直接起動(capture) と 🖼アルバム選択(captureなし) の2経路 */
  const photoRow = el('div', 'fs-row');
  const camBtn = el('button', 'photo-btn', T('skin.photoCamera'));
  const albBtn = el('button', 'photo-btn', T('skin.photoAlbum'));
  photoRow.appendChild(camBtn); photoRow.appendChild(albBtn);
  const preview = el('img', 'skin-preview'); preview.style.display = 'none';
  const fileCam = document.createElement('input');
  fileCam.type = 'file'; fileCam.accept = 'image/*'; fileCam.capture = 'environment'; fileCam.hidden = true;
  const fileAlb = document.createElement('input');
  fileAlb.type = 'file'; fileAlb.accept = 'image/*'; fileAlb.hidden = true;
  ctx.box.appendChild(photoRow); ctx.box.appendChild(preview);
  ctx.box.appendChild(fileCam); ctx.box.appendChild(fileAlb);
  Tap.bind(camBtn, () => fileCam.click());
  Tap.bind(albBtn, () => fileAlb.click());
  const onPickPhoto = ev => {
    const f = ev.target.files[0]; if(!f) return;
    resizeImage(f, 640, 0.72, dataUrl => {
      if(dataUrl){ photoData = dataUrl; preview.src = dataUrl; preview.style.display = 'block'; }
      else toast(T('toast.photoFail'));
    });
    ev.target.value = '';
  };
  fileCam.addEventListener('change', onPickPhoto);
  fileAlb.addEventListener('change', onPickPhoto);
  const btnRow = el('div', 'fs-row');
  const ok = el('button', 'ok-btn', T('common.save')); ok.disabled = true;
  const cancel = el('button', 'cancel-btn', T('common.cancel'));
  btnRow.appendChild(ok); btnRow.appendChild(cancel);
  ctx.box.appendChild(btnRow);
  ta.addEventListener('input', () => { ok.disabled = ta.value.trim() === ''; });
  Tap.bind(ok, () => {
    const txt = ta.value.trim();
    if(!txt) return;
    const e = { k:'skin', c:'concern', m:txt };
    if(photoData) e.p = photoData;
    ctx.close();
    saveEntrySafe(e);
  });
  Tap.bind(cancel, () => ctx.close(), { silent:true });
}

/* ---- 項目タップの振り分け ---- */
const HANDLERS = {
  med:openMed, meal:openMeal, toilet:openToilet, temp:openTemp, sleep:openSleep,
  mood:openMood, carer:openCarer, fall:openFall, note:openNote, bp:openBp, weight:openWeight, bath:openBath, skin:openSkin,
};
function onItemTap(item){ const h = HANDLERS[item.k]; if(h) h(); }

/* ---- きょう ---- */
function activeItems(){ return ITEMS.filter(i => !prefs.off.includes(i.k)); }
function renderGrid(){
  const grid = document.getElementById('item-grid');
  grid.textContent = '';
  activeItems().forEach(item => {
    if(item.k === 'water'){ grid.appendChild(waterCard()); return; }   // 全幅ウィジェット
    const c = el('div', 'item-card');
    c.appendChild(el('span', 'ic', item.icon));
    c.appendChild(el('span', 'lb', labelFor(item.k)));
    let subText = '';
    if(item.k === 'toilet') subText = toiletTodaySub();
    else if(item.k === 'sleep') subText = T('items.sleepSub');
    else if(item.k === 'carer') subText = T('items.carerSub');
    if(subText) c.appendChild(el('span', 'sub', subText));
    Tap.bind(c, () => onItemTap(item));
    grid.appendChild(c);
  });
}
function appendBpChips(body, e){
  const wrap = el('span', 'mk-wrap');
  [['sys', e.s, 's', false], ['dia', e.d, 'd', false], ['pulse', e.pl, 'p', true]].forEach(row => {
    const c = classifyBp(row[2], row[1]);
    if(!c) return;
    wrap.appendChild(el('span', 'mk mk-' + c.lv, bpChipText(row[0], c, row[3])));
  });
  if(wrap.childNodes.length) body.appendChild(wrap);
}
function weightChip(e){
  const b = bmiOf(e.wv);
  if(b == null) return null;
  const c = bmiChip(b);
  return el('span', 'mk' + (c.lv ? ' mk-' + c.lv : ''), 'BMI ' + b.toFixed(1) + ' ' + c.label);
}
function entryRow(e, allowDelete){
  const row = el('div', 'log-row');
  const tm = el('span', 'log-time editable', fmtTime(e.t));
  Tap.bind(tm, () => openTimeEdit(e), { silent:true });
  const body = el('span', 'log-body');
  const it = ITEM[e.k] || { icon:'❓' };
  const val = entryValueText(e);
  body.appendChild(el('span', 'log-main', it.icon + ' ' + labelFor(e.k) + (val ? ': ' + val : '')));
  if(e.k === 'bp') appendBpChips(body, e);
  if(e.k === 'weight'){ const chip = weightChip(e); if(chip){ const w = el('span', 'mk-wrap'); w.appendChild(chip); body.appendChild(w); } }
  if(e.m){ body.appendChild(el('span', 'log-memo', e.m)); }
  if(e.k === 'toilet'){ const obs = toiletObsText(e); if(obs) body.appendChild(el('span', 'log-obs', obs)); }
  if(e.p){
    const img = el('img', 'log-thumb'); img.src = e.p;
    Tap.bind(img, () => openImageFull(e.p), { silent:true });
    body.appendChild(img);
  }
  row.appendChild(tm); row.appendChild(body);
  if(allowDelete){
    const del = el('button', 'del-btn', '🗑');
    let armed = false;
    Tap.bind(del, () => {
      if(!armed){
        armed = true; del.textContent = T('common.delConfirm'); del.classList.add('arm');
        setTimeout(() => { armed = false; del.textContent = '🗑'; del.classList.remove('arm'); }, 2500);
      } else {
        entries = entries.filter(x => x !== e); saveAll(); renderToday(); renderHist();
      }
    }, { silent:true });
    row.appendChild(del);
  }
  return row;
}
function renderList(elm, list, allowDelete){
  elm.textContent = '';
  if(!list.length){
    elm.appendChild(el('div', 'empty', T('common.empty')));
    return;
  }
  list.slice().sort((a, b) => b.t - a.t).forEach(e => elm.appendChild(entryRow(e, allowDelete)));
}
function renderToday(){
  document.getElementById('today-date').textContent = T('today.datePrefix') + ' ' + fmtDate(new Date());
  renderGrid();
  updateGotoSet();
  renderList(document.getElementById('today-list'), entries.filter(e => sameDay(e.t, new Date())), true);
}
/* せってい誘導ヒント: OFF中の項目名を動的表示して「増やせるもの」を見せる */
function updateGotoSet(){
  const box = document.getElementById('goto-set');
  const hidden = ITEMS.filter(i => prefs.off.includes(i.k)).map(i => i.icon + ' ' + labelFor(i.k));
  box.textContent = hidden.length
    ? T('today.gotoSetOff', { list:hidden.join('・') })
    : T('today.gotoSet');
}

/* ---- 1日の集計(りれきで使用) ---- */
const MEAL_MARK = { full:'○', half:'△', little:'▽', none:'×' };   // 食事の粒度記号(言語非依存)
function daySummary(dayEntries){
  const c = {};
  dayEntries.forEach(e => { (c[e.k] = c[e.k] || []).push(e); });
  const parts = [];
  if(c.med){
    const ok = c.med.filter(e => e.c === 'taken').length;
    const ton = c.med.filter(e => e.c === 'prn').length;
    const ng = c.med.filter(e => e.c === 'missed').length;
    parts.push('💊 ' + T('sum.takenTimes', { n:ok }) + (ton ? '・' + T('sum.prn', { n:ton }) : '') + (ng ? '・' + T('sum.missed', { n:ng }) : ''));
  }
  if(c.water){
    const ml = c.water.reduce((s, e) => s + (Number(e.ml) || 0), 0);
    parts.push('🥛 ' + T('sum.waterGoal', { ml, goal:prefs.waterGoal }));
  }
  if(c.meal){
    parts.push('🍚 ' + c.meal.slice().sort((a, b) => a.t - b.t).map(e => MEAL_MARK[e.c] || '?').join(''));
  }
  if(c.toilet){
    const pee = c.toilet.filter(e => isPeeCode(e.c));
    const poo = c.toilet.filter(e => e.c && e.c.indexOf('s_') === 0);
    const ml = pee.reduce((s, e) => s + (Number(e.ml) || 0), 0);
    const geri = poo.filter(e => e.c === 's_diar').length;
    parts.push('🚻 ' + T('sum.urineTimes', { n:pee.length }) + (ml ? T('sum.mlApprox', { ml }) : '') + '・' + T('sum.stoolTimes', { n:poo.length }) + (geri ? '・' + T('sum.diar', { n:geri }) : ''));
  }
  if(c.temp){
    const vals = c.temp.map(e => e.tv != null ? e.tv : parseFloat(e.v)).filter(v => !isNaN(v));
    if(vals.length) parts.push('🌡️ ' + T('sum.tempMax', { v:Math.max.apply(null, vals) }));
  }
  if(c.bp){
    const last = c.bp[c.bp.length - 1];
    const w = bpWorstOf(last);
    parts.push('❤️ ' + bpValueText(last) + (w === 'r' ? ' 🔴' : (w === 'y' ? ' 🟡' : '')));
  }
  if(c.sleep){
    const last = c.sleep[c.sleep.length - 1];
    const wake = (c.wake || []).length;
    if(last.hrs != null || last.c){
      const bits = [];
      if(last.hrs != null) bits.push(T('sum.hoursDay', { n:last.hrs }));
      const Q = { q_good:'sleep.q_good', q_ok:'sleep.q_ok', q_poor:'sleep.q_poor' };
      if(last.c && Q[last.c]) bits.push(T(Q[last.c]));
      if(wake) bits.push(T('sum.wakeDay', { n:wake }));
      parts.push('🌙 ' + bits.join('・'));
    } else {
      parts.push('🌙 ' + sleepText(last) + (wake ? '・' + T('sum.wakeDay', { n:wake }) : ''));
    }
  } else if(c.wake){
    parts.push('🌙 ' + T('sum.wakeDay', { n:c.wake.length }));
  }
  if(c.mood) parts.push('🙂 ' + entryValueText(c.mood[c.mood.length - 1]));
  if(c.carer) parts.push('🍀 ' + entryValueText(c.carer[c.carer.length - 1]));   // 介護者自身(きょう・りれきのみ・みせるの表には出さない)
  if(c.weight) parts.push('⚖️ ' + entryValueText(c.weight[c.weight.length - 1]));
  if(c.bath) parts.push('🛁 ' + T('sum.timesN', { n:c.bath.length }));
  if(c.skin) parts.push('🩹 ' + T('sum.casesN', { n:c.skin.length }));
  if(c.fall) parts.push('⚠️ ' + T('sum.casesN', { n:c.fall.length }));
  return parts;
}

/* ---- りれき ---- */
let histDate = new Date();
function renderHist(){
  const isToday = dayKey(histDate.getTime()) === dayKey(Date.now());
  document.getElementById('hist-date').textContent = fmtDate(histDate) + (isToday ? T('hist.todayMark') : '');
  document.getElementById('hist-next').disabled = isToday;
  const list = entries.filter(e => sameDay(e.t, histDate));
  const parts = daySummary(list);
  document.getElementById('hist-sum').textContent = parts.length ? parts.join('　') : T('hist.noRecord');
  renderList(document.getElementById('hist-list'), list, true);
}
Tap.bind(document.getElementById('hist-prev'), () => { histDate.setDate(histDate.getDate() - 1); renderHist(); });
Tap.bind(document.getElementById('hist-next'), () => { histDate.setDate(histDate.getDate() + 1); renderHist(); });

/* ---- みせる(直近7日表) ---- */
const SHOW_COLS = [
  { k:'med', hKey:'col.med' }, { k:'water', hKey:'col.water' }, { k:'meal', hKey:'col.meal' },
  { k:'toilet', hKey:'col.toilet' }, { k:'temp', hKey:'col.temp' }, { k:'bp', hKey:'col.bp' },
  { k:'sleep', hKey:'col.sleep' }, { k:'fall', hKey:'col.fall' },
];
function showCell(k, arr, c){
  const dash = T('sum.dash');
  if(k === 'med'){
    if(!arr) return dash;
    const ok = arr.filter(e => e.c === 'taken').length;
    const ton = arr.filter(e => e.c === 'prn').length;
    const ng = arr.filter(e => e.c === 'missed').length;
    return T('sum.timesN', { n:ok }) + (ton ? ' ' + T('sum.prnShort', { n:ton }) : '') + (ng ? ' ' + T('sum.missed', { n:ng }) : '');
  }
  if(k === 'water'){
    if(!arr) return dash;
    return T('sum.waterGoal', { ml:arr.reduce((s, e) => s + (Number(e.ml) || 0), 0), goal:prefs.waterGoal });
  }
  if(k === 'meal'){
    if(!arr) return dash;
    return arr.slice().sort((a, b) => a.t - b.t).map(e => MEAL_MARK[e.c] || '?').join('');
  }
  if(k === 'toilet'){
    if(!arr) return dash;
    const pee = arr.filter(e => isPeeCode(e.c));
    const poo = arr.filter(e => e.c && e.c.indexOf('s_') === 0);
    const ml = pee.reduce((s, e) => s + (Number(e.ml) || 0), 0);
    const geri = poo.filter(e => e.c === 's_diar').length;
    return T('sum.urineN', { n:pee.length }) + (ml ? T('sum.mlApproxShort', { ml }) : '') + ' ' + T('sum.stoolN', { n:poo.length }) + (geri ? ' ' + T('sum.diarShort', { n:geri }) : '');
  }
  if(k === 'temp'){
    if(!arr) return dash;
    const vals = arr.map(e => e.tv != null ? e.tv : parseFloat(e.v)).filter(v => !isNaN(v));
    return vals.length ? T('sum.tempMaxCell', { v:Math.max.apply(null, vals) }) : dash;
  }
  if(k === 'bp'){
    if(!arr) return dash;
    const last = arr[arr.length - 1];
    const s = (last.s != null && last.d != null) ? (last.s + '/' + last.d) : bpValueText(last);
    const w = bpWorstOf(last);
    return s + (w === 'r' ? ' 🔴' : (w === 'y' ? ' 🟡' : ''));
  }
  if(k === 'sleep'){
    const wake = (c.wake || []).length;
    if(!arr) return wake ? T('sum.wakeShort', { n:wake }) : dash;
    const last = arr[arr.length - 1];
    if(last.hrs != null || last.c){
      const bits = [];
      if(last.hrs != null) bits.push(T('sum.hoursCell', { n:last.hrs }));
      const Q = { q_good:'sleep.q_good', q_ok:'sleep.q_ok', q_poor:'sleep.q_poor' };
      if(last.c && Q[last.c]) bits.push(T(Q[last.c]));
      if(wake) bits.push(T('sum.wakeShort', { n:wake }));
      return bits.join(' ');
    }
    return sleepText(last) + (wake ? ' ' + T('sum.wakeShort', { n:wake }) : '');
  }
  if(k === 'fall'){ return arr ? T('sum.fallCell', { n:arr.length }) : dash; }
  return arr ? String(arr.length) : dash;
}
/* 1週間・1か月 = 日ごと表(現行形式をそのまま日数パラメータ化) */
function buildDayTable(days){
  const table = el('table', 'show-table');
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  hr.appendChild(el('th', null, T('show.colDay')));
  SHOW_COLS.forEach(cd => hr.appendChild(el('th', null, T(cd.hKey))));
  thead.appendChild(hr); table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for(let i = days - 1; i >= 0; i--){
    const d = new Date(); d.setDate(d.getDate() - i);
    const list = entries.filter(e => sameDay(e.t, d));
    const c = {};
    list.forEach(e => { (c[e.k] = c[e.k] || []).push(e); });
    const tr = document.createElement('tr');
    tr.appendChild(el('td', null, mdShort(d) + (i === 0 ? ' ' + T('show.todayMark') : '')));
    SHOW_COLS.forEach(cd => tr.appendChild(el('td', null, showCell(cd.k, c[cd.k], c))));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

/* ---- 3か月 = 週ごと要約表(13週) ----
   列は推移・パターンが見えるものだけに絞る。集計はすべて「記録がある日/件」基準
   (記録のない日を0として平均に混ぜない=嘘の数字を作らない) */
const SHOW_WEEK_COLS = [
  { k:'med', hKey:'col.med' }, { k:'water', hKey:'col.water' }, { k:'meal', hKey:'col.mealWeek' },
  { k:'toilet', hKey:'col.toilet' }, { k:'temp', hKey:'col.temp' }, { k:'bp', hKey:'col.bp' },
  { k:'sleep', hKey:'col.sleep' }, { k:'fall', hKey:'col.fall' },
];
function distinctDayCount(arr){   // 記録がある日数(記録日基準の分母)
  const s = {};
  arr.forEach(e => { s[dayKey(e.t)] = 1; });
  return Object.keys(s).length;
}
function bpWorstDetail(e){   // その記録の中で最悪1マーカーのチップ文言(なければnull)
  let best = null;
  [['sys', e.s, 's', false], ['dia', e.d, 'd', false], ['pulse', e.pl, 'p', true]].forEach(row => {
    const c = classifyBp(row[2], row[1]);
    if(!c) return;
    const rank = c.lv === 'r' ? 2 : 1;
    if(!best || rank > best.rank) best = { rank, label:bpChipText(row[0], c, row[3]) };
  });
  return best;
}
function weekCell(k, list){
  const dash = T('sum.dash');
  if(k === 'med'){
    const arr = list.filter(e => e.k === 'med');
    if(!arr.length) return dash;
    const ok = arr.filter(e => e.c === 'taken').length;
    const ng = arr.filter(e => e.c === 'missed').length;
    return T('sum.takenTimes', { n:ok }) + (ng ? ' ' + T('sum.missed', { n:ng }) : '');
  }
  if(k === 'water'){
    const arr = list.filter(e => e.k === 'water');
    if(!arr.length) return dash;
    const byDay = {};
    arr.forEach(e => { const d = dayKey(e.t); byDay[d] = (byDay[d] || 0) + (Number(e.ml) || 0); });
    const days = Object.keys(byDay);
    const avg = days.reduce((s, d) => s + byDay[d], 0) / days.length;
    return T('sum.waterAvg', { ml:Math.round(avg), days:days.length });
  }
  if(k === 'meal'){   // 異常シグナルのみ=「食べず」の回数(0なら−)
    const n = list.filter(e => e.k === 'meal' && e.c === 'none').length;
    return n ? T('sum.timesN', { n }) : dash;
  }
  if(k === 'toilet'){
    const arr = list.filter(e => e.k === 'toilet');
    if(!arr.length) return dash;
    const pee = arr.filter(e => isPeeCode(e.c));
    const poo = arr.filter(e => e.c && e.c.indexOf('s_') === 0);
    const geri = poo.filter(e => e.c === 's_diar').length;
    const bits = [];
    if(pee.length){
      const days = distinctDayCount(pee);   // 尿は記録がある日数を分母に平均
      bits.push(T('sum.urineRate', { n:(Math.round(pee.length / days * 10) / 10) }));
    }
    bits.push(T('sum.stoolN', { n:poo.length }) + (geri ? ' ' + T('sum.diarShort', { n:geri }) : ''));
    return bits.join(' ');
  }
  if(k === 'temp'){   // 期間内の最高
    const vals = list.filter(e => e.k === 'temp').map(e => e.tv != null ? e.tv : parseFloat(e.v)).filter(v => !isNaN(v));
    return vals.length ? T('sum.tempMaxCell', { v:Math.max.apply(null, vals) }) : dash;
  }
  if(k === 'bp'){   // 最悪マーカーの記録1件の値+そのチップ(なければ最新値・マーカーなしは値のみ)
    const arr = list.filter(e => e.k === 'bp');
    if(!arr.length) return dash;
    let pick = null, pickRank = -1;
    arr.forEach(e => {
      const w = bpWorstOf(e);
      const rank = w === 'r' ? 2 : (w === 'y' ? 1 : 0);
      if(rank >= pickRank){ pickRank = rank; pick = e; }   // 同順位は新しい方(=最新)を採用
    });
    const val = (pick.s != null && pick.d != null) ? (pick.s + '/' + pick.d) : bpValueText(pick);
    if(pickRank > 0){
      const det = bpWorstDetail(pick);
      if(det) return val + ' ' + det.label;
    }
    return val;
  }
  if(k === 'sleep'){   // 朝のまとめの平均時間(記録がある日数を括弧)・中途覚醒の計
    const arr = list.filter(e => e.k === 'sleep' && e.hrs != null);
    const wake = list.filter(e => e.k === 'wake').length;
    const bits = [];
    if(arr.length){
      const byDay = {};
      arr.forEach(e => { byDay[dayKey(e.t)] = e.hrs; });   // 同日は最後のまとめを採用
      const days = Object.keys(byDay);
      const avg = days.reduce((s, d) => s + byDay[d], 0) / days.length;
      bits.push(T('sum.hoursAvgCell', { n:(Math.round(avg * 10) / 10), days:days.length }));
    }
    if(wake) bits.push(T('sum.wakeShort', { n:wake }));
    return bits.length ? bits.join(' ') : dash;
  }
  if(k === 'fall'){
    const n = list.filter(e => e.k === 'fall').length;
    return n ? T('sum.casesN', { n }) : dash;
  }
  return dash;
}
function buildWeekTable(){
  const table = el('table', 'show-table');
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  hr.appendChild(el('th', null, T('show.colWeek')));
  SHOW_WEEK_COLS.forEach(cd => hr.appendChild(el('th', null, T(cd.hKey))));
  thead.appendChild(hr); table.appendChild(thead);
  const tbody = document.createElement('tbody');
  const base = new Date(); base.setHours(0, 0, 0, 0);
  for(let w = 12; w >= 0; w--){   // 新しい週が下(今日を末尾に7日ずつ13週)
    const end = new Date(base); end.setDate(end.getDate() - w * 7);
    const start = new Date(end); start.setDate(start.getDate() - 6);
    const endNext = new Date(end); endNext.setDate(endNext.getDate() + 1);
    const startT = start.getTime(), endT = endNext.getTime();
    const list = entries.filter(e => e.t >= startT && e.t < endT);
    const tr = document.createElement('tr');
    const label = mdOnly(start) + '〜' + mdOnly(end) + (w === 0 ? ' ' + T('show.thisWeek') : '');
    tr.appendChild(el('td', null, label));
    SHOW_WEEK_COLS.forEach(cd => tr.appendChild(el('td', null, weekCell(cd.k, list))));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}
function renderShow(){
  document.getElementById('show-note').value = prefs.shownote || '';
  const TITLES = { 7:'show.span7title', 30:'show.span30title', 90:'show.span90title' };
  document.getElementById('show-span-title').textContent = T(TITLES[prefs.showSpan] || 'show.span7title');
  document.querySelectorAll('.span-btn').forEach(b => b.classList.toggle('active', Number(b.dataset.span) === prefs.showSpan));
  const wrap = document.getElementById('show-table-wrap');
  wrap.textContent = '';
  wrap.appendChild(prefs.showSpan === 90 ? buildWeekTable() : buildDayTable(prefs.showSpan));
}
document.getElementById('show-note').addEventListener('input', e => { prefs.shownote = e.target.value; saveAll(); });

/* ---- 時刻編集(共通) ---- */
function openTimeEdit(e){
  const ctx = buildOverlay();
  ctx.box.appendChild(el('div', 'sheet-title', T('timeEdit.title')));
  const inp = document.createElement('input');
  inp.type = 'time'; inp.className = 'time-in';
  const d = new Date(e.t);
  inp.value = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  ctx.box.appendChild(inp);
  const btnRow = el('div', 'fs-row');
  const ok = el('button', 'ok-btn', T('timeEdit.ok'));
  const cancel = el('button', 'cancel-btn', T('common.cancel'));
  btnRow.appendChild(ok); btnRow.appendChild(cancel);
  ctx.box.appendChild(btnRow);
  Tap.bind(ok, () => {
    const val = inp.value;
    if(val && /^\d{1,2}:\d{2}$/.test(val)){
      const p = val.split(':');
      const nd = new Date(e.t);
      nd.setHours(Number(p[0]), Number(p[1]), 0, 0);   // 日付は不変・時分のみ変更
      e.t = nd.getTime();
      saveAll();
    }
    ctx.close();
    renderToday(); renderHist();
  });
  Tap.bind(cancel, () => ctx.close(), { silent:true });
}

/* ---- せってい ---- */
function renderWaterGoalBox(){
  const box = document.getElementById('water-goal-box');
  box.textContent = '';
  const row = el('div', 'step-row');
  const minus = el('button', 'step-btn', '−100');
  const inp = document.createElement('input');
  inp.type = 'number'; inp.className = 'step-in'; inp.inputMode = 'numeric'; inp.step = 100;
  inp.value = prefs.waterGoal;
  const plus = el('button', 'step-btn', '＋100');
  row.appendChild(minus); row.appendChild(inp); row.appendChild(plus); row.appendChild(el('span', 'step-unit', 'ml'));
  box.appendChild(row);
  Tap.bind(minus, () => { let n = (parseInt(inp.value, 10) || 0) - 100; if(n < 100) n = 100; prefs.waterGoal = n; inp.value = n; saveAll(); });
  Tap.bind(plus,  () => { let n = (parseInt(inp.value, 10) || 0) + 100; prefs.waterGoal = n; inp.value = n; saveAll(); });
  inp.addEventListener('change', () => { let n = parseInt(inp.value, 10); if(isNaN(n) || n < 0) n = 0; prefs.waterGoal = n; inp.value = n; saveAll(); });
}
function renderHeightBox(){
  const box = document.getElementById('height-box');
  box.textContent = '';
  const row = el('div', 'step-row');
  const minus = el('button', 'step-btn', '−1');
  const inp = document.createElement('input');
  inp.type = 'number'; inp.className = 'step-in'; inp.inputMode = 'numeric'; inp.step = 1; inp.placeholder = T('set.heightPlaceholder');
  if(prefs.height != null) inp.value = prefs.height;
  const plus = el('button', 'step-btn', '＋1');
  row.appendChild(minus); row.appendChild(inp); row.appendChild(plus); row.appendChild(el('span', 'step-unit', 'cm'));
  box.appendChild(row);
  Tap.bind(minus, () => { let n = (prefs.height != null ? prefs.height : 150) - 1; if(n < 50) n = 50; prefs.height = n; inp.value = n; saveAll(); });
  Tap.bind(plus,  () => { let n = (prefs.height != null ? prefs.height : 150) + 1; if(n > 250) n = 250; prefs.height = n; inp.value = n; saveAll(); });
  inp.addEventListener('change', () => {
    const t = inp.value.trim();
    if(t === ''){ prefs.height = null; }
    else { let n = parseInt(t, 10); prefs.height = isNaN(n) ? null : n; }
    saveAll();
  });
}
/* 言語ボタン(各言語の自称表記・現在の言語をハイライト) */
function renderLangBox(){
  const box = document.getElementById('lang-box');
  if(!box) return;
  box.textContent = '';
  SUPPORTED.forEach(code => {
    const meta = (I18N[code] && I18N[code]._meta) || {};
    const b = el('button', 'lang-btn' + (code === lang ? ' active' : ''), meta.native || code);
    Tap.bind(b, () => setLang(code));
    box.appendChild(b);
  });
}
function renderSet(){
  renderLangBox();
  document.querySelectorAll('.fs-btn[data-fs]').forEach(b => b.classList.toggle('active', Number(b.dataset.fs) === prefs.fs));
  renderWaterGoalBox();
  renderHeightBox();
  const box = document.getElementById('item-toggles');
  box.textContent = '';
  ITEMS.forEach(item => {
    const row = el('div', 'tgl-row' + (!prefs.off.includes(item.k) ? ' on' : ''));
    const on = !prefs.off.includes(item.k);
    row.appendChild(el('span', 'lb', item.icon + ' ' + labelFor(item.k)));
    row.appendChild(el('span', 'tgl-pill', on ? T('set.on') : T('set.off')));
    Tap.bind(row, () => {
      if(prefs.off.includes(item.k)) prefs.off = prefs.off.filter(x => x !== item.k);
      else prefs.off.push(item.k);
      saveAll(); renderSet(); renderGrid();
    });
    box.appendChild(row);
  });
}
document.querySelectorAll('.fs-btn[data-fs]').forEach(b => Tap.bind(b, () => {
  prefs.fs = Number(b.dataset.fs); saveAll(); applyFs(); renderSet();
}));
/* fs のclassNameを丸ごと書くため、画面の色(theme-blue)も必ず一緒に付け直す */
function applyFs(){ document.body.className = 'fs' + prefs.fs + (prefs.theme === 'blue' ? ' theme-blue' : ''); }

/* ---- おんがく(BGM)/タップ音/がめんの色 ---- */
function applyMusic(){
  if(prefs.music === 'off'){
    Sound.setBgmEnabled(false);
  }else{
    Sound.setBgmMode(prefs.music === 'b' ? 'disability' : 'elder');  // a=elder(あたたかい)/b=disability(すんだ)
    Sound.setBgmEnabled(true);
  }
  const a = document.getElementById('musicBtnA'), b = document.getElementById('musicBtnB'), off = document.getElementById('musicBtnOff');
  if(a) a.classList.toggle('active', prefs.music === 'a');
  if(b) b.classList.toggle('active', prefs.music === 'b');
  if(off) off.classList.toggle('active', prefs.music === 'off');
}
function applySound(){
  Sound.setEnabled(prefs.sound);
  const on = document.getElementById('soundBtnOn'), off = document.getElementById('soundBtnOff');
  if(on) on.classList.toggle('active', prefs.sound);
  if(off) off.classList.toggle('active', !prefs.sound);
}
function applyTheme(){
  const blue = (prefs.theme === 'blue');
  document.body.classList.toggle('theme-blue', blue);
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta && meta.setAttribute) meta.setAttribute('content', blue ? '#5581bd' : '#4a9d7f');
  const g = document.getElementById('themeBtnG'), b = document.getElementById('themeBtnB');
  if(g) g.classList.toggle('active', !blue);
  if(b) b.classList.toggle('active', blue);
}
Tap.bind(document.getElementById('musicBtnA'),   () => { prefs.music = 'a';   saveAll(); applyMusic(); });
Tap.bind(document.getElementById('musicBtnB'),   () => { prefs.music = 'b';   saveAll(); applyMusic(); });
Tap.bind(document.getElementById('musicBtnOff'), () => { prefs.music = 'off'; saveAll(); applyMusic(); });
Tap.bind(document.getElementById('soundBtnOn'),  () => { prefs.sound = true;  saveAll(); applySound(); });
Tap.bind(document.getElementById('soundBtnOff'), () => { prefs.sound = false; saveAll(); applySound(); });
Tap.bind(document.getElementById('themeBtnG'),   () => { prefs.theme = 'green'; saveAll(); applyTheme(); });
Tap.bind(document.getElementById('themeBtnB'),   () => { prefs.theme = 'blue';  saveAll(); applyTheme(); });

/* ---- バックアップ(ver2でエクスポート・ver1/2両対応でインポート) ---- */
Tap.bind(document.getElementById('bk-export'), () => {
  const data = { app:'ouchi_kaigo_kiroku', ver:2, entries, prefs };
  const blob = new Blob([JSON.stringify(data)], { type:'application/json' });
  const a = document.createElement('a');
  const d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = 'okiroku-backup-' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast(T('toast.exported'));
});
Tap.bind(document.getElementById('bk-import'), () => document.getElementById('bk-file').click());
document.getElementById('bk-file').addEventListener('change', e => {
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const d = JSON.parse(r.result);
      if(d.app !== 'ouchi_kaigo_kiroku') throw new Error('different app');
      entries = Array.isArray(d.entries) ? d.entries : [];
      prefs = Object.assign({ fs:0, off:[], shownote:'', waterGoal:1200, height:null, showSpan:7, music:'a', sound:true, theme:'green' }, d.prefs || {});
      if(!Array.isArray(prefs.off)) prefs.off = ITEMS.filter(i => !i.on).map(i => i.k);
      if(typeof prefs.waterGoal !== 'number') prefs.waterGoal = 1200;
      if(prefs.height === undefined) prefs.height = null;
      if([7,30,90].indexOf(prefs.showSpan) < 0) prefs.showSpan = 7;
      if(['a','b','off'].indexOf(prefs.music) < 0) prefs.music = 'a';
      if(typeof prefs.sound !== 'boolean') prefs.sound = true;
      if(['green','blue'].indexOf(prefs.theme) < 0) prefs.theme = 'green';
      migrateEntries(entries);   // ver1バックアップ(v文字列)ならコード化。v2は無変換で安全
      prefs.schema = 2;
      if(prefs.lang && SUPPORTED.indexOf(prefs.lang) >= 0) lang = prefs.lang;   // バックアップの言語設定を反映
      saveAll(); applyFs(); applyTheme(); applySound(); applyMusic(); applyLang();
      toast(T('toast.imported'));
    }catch(err){ toast(T('toast.importFail')); }
  };
  r.readAsText(f);
  e.target.value = '';
});

/* ---- タブ ---- */
document.querySelectorAll('#tabbar .tab').forEach(b => Tap.bind(b, () => showScreen(b.dataset.scr)));
Tap.bind(document.getElementById('goto-set'), () => showScreen('set'));

/* ---- みせる 期間切替(1週間/1か月/3か月) ---- */
document.querySelectorAll('.span-btn').forEach(b => Tap.bind(b, () => {
  prefs.showSpan = Number(b.dataset.span); saveAll(); renderShow();
}));

/* ---- 言語適用(静的文言・html lang/dir・タイトル・再描画) ---- */
function applyStaticI18n(){
  document.querySelectorAll('[data-i18n]').forEach(elm => { elm.textContent = T(elm.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-ph]').forEach(elm => { elm.placeholder = T(elm.getAttribute('data-i18n-ph')); });
}
function applyLang(){
  const meta = (I18N[lang] && I18N[lang]._meta) || {};
  const root = document.documentElement;
  if(root){ root.lang = lang; root.dir = meta.dir || 'ltr'; }
  document.title = T('app.title');
  applyStaticI18n();
  showScreen(curScreen);   // 動的部分(グリッド・記録・表)も現在の言語で再描画
}
function setLang(code){
  if(SUPPORTED.indexOf(code) < 0) return;
  lang = code; prefs.lang = code; saveAll();
  applyLang();
}

/* ---- 起動 ---- */
applyFs();
applyTheme();     // 画面の色(meta theme-color連動・ボタン状態)
applySound();     // タップ音ON/OFF
applyMusic();     // BGM(実際の再生開始は最初のタップから=自動再生制限対応)
applyLang();

/* ---- Service Worker 登録(https / localhost のみ・オフライン対応。姉妹アプリouchi_kaigo_webと同方式) ---- */
if(navigator.serviceWorker && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')){
  try{ navigator.serviceWorker.register('sw.js'); }catch(_){}
}
