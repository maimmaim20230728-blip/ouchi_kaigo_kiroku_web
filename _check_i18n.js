'use strict';
/* おうち介護記録・そよぎ i18n機械検証(SPEC_V2_I18N §4)
   ・全言語のキー集合が ja と完全一致(過不足0)か
   ・en 仮値のままの言語(未翻訳=TODO)を列挙
   ・ar にアラビア文字・zh に漢字が含まれるか(翻訳済み言語のみ簡易健全性チェック)
   使い方: node _check_i18n.js  */
const fs = require('fs');
const vm = require('vm');

/* ---- i18n.js を評価して OKIROKU_I18N を取り出す ---- */
const sandbox = { window: {}, globalThis: {} };
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('./i18n.js', 'utf8'), sandbox, { filename:'i18n.js' });
const I18N = sandbox.window.OKIROKU_I18N;

if(!I18N || !I18N.ja){ console.log('CHECK NG: OKIROKU_I18N が読めません'); process.exit(1); }

const ORDER = I18N._order || Object.keys(I18N).filter(k => k[0] !== '_');

/* ---- 葉(string)を path→value のマップに平坦化。_meta は除外 ---- */
function flatten(obj, prefix, out){
  out = out || {};
  Object.keys(obj).forEach(k => {
    if(k === '_meta') return;
    const p = prefix ? (prefix + '.' + k) : k;
    const v = obj[k];
    if(v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out);
    else out[p] = v;
  });
  return out;
}

const jaMap = flatten(I18N.ja);
const jaKeys = Object.keys(jaMap).sort();
const enMap = flatten(I18N.en);

let structFail = 0;
const todo = [];
const sanityWarn = [];

console.log('[i18n] 基準 ja のキー数: ' + jaKeys.length);
console.log('');

ORDER.forEach(code => {
  const langObj = I18N[code];
  if(!langObj){ console.log('  NG  ' + code + ': 言語オブジェクトが無い'); structFail++; return; }
  const map = flatten(langObj);
  const keys = Object.keys(map).sort();

  /* キー過不足 */
  const missing = jaKeys.filter(k => !(k in map));
  const extra = keys.filter(k => !(k in jaMap));
  const meta = langObj._meta || {};
  const nativeName = meta.native || '?';

  if(missing.length || extra.length){
    structFail++;
    console.log('  NG  ' + code + ' (' + nativeName + '): キー不一致  不足' + missing.length + '  余分' + extra.length);
    if(missing.length) console.log('        不足: ' + missing.slice(0, 8).join(', ') + (missing.length > 8 ? ' …' : ''));
    if(extra.length)   console.log('        余分: ' + extra.slice(0, 8).join(', ') + (extra.length > 8 ? ' …' : ''));
    return;
  }

  /* _meta 健全性 */
  if(!meta.native || !meta.dir){
    structFail++;
    console.log('  NG  ' + code + ': _meta(native/dir)が欠けています');
    return;
  }

  /* 未翻訳(TODO)判定: ja/en 以外で、全ての葉が en と同一なら「en仮値のまま」 */
  let isTodo = false;
  if(code !== 'ja' && code !== 'en'){
    isTodo = jaKeys.every(k => map[k] === enMap[k]);
  }

  /* 簡易健全性(翻訳済み言語のみ): ar=アラビア文字 / zh=漢字 */
  const joined = jaKeys.map(k => String(map[k])).join(' ');
  if(!isTodo){
    if(code === 'ar' && !/[؀-ۿ]/.test(joined)) sanityWarn.push('ar: アラビア文字が見当たりません');
    if(code === 'zh' && !/[一-鿿]/.test(joined)) sanityWarn.push('zh: 漢字が見当たりません');
  }

  if(isTodo){
    todo.push(code);
    console.log('  --  ' + code + ' (' + nativeName + '): TODO 未翻訳(en仮値のまま)  キー' + keys.length + ' OK / dir=' + meta.dir);
  } else {
    console.log('  OK  ' + code + ' (' + nativeName + '): 翻訳済み  キー' + keys.length + ' 一致 / dir=' + meta.dir);
  }
});

console.log('');
if(todo.length){
  console.log('TODO(要翻訳・後工程でFableが記入): ' + todo.join(', ') + '  計' + todo.length + '言語');
}
if(sanityWarn.length){
  console.log('健全性の注意:');
  sanityWarn.forEach(w => console.log('  ! ' + w));
}
console.log('');

if(structFail){
  console.log('CHECK NG: 構造エラー ' + structFail + '件(キー不一致/欠落)。翻訳の前に構造をそろえてください。');
  process.exit(1);
}
if(sanityWarn.length){
  console.log('CHECK NG: 翻訳済み言語の健全性チェックに失敗しました。');
  process.exit(1);
}
console.log('CHECK OK: 全' + ORDER.length + '言語のキー構造が ja と一致。ja/en=翻訳済み、残り' + todo.length + '言語=TODOとして正しく検出。');
