'use strict';
/* 音まわり: タップ音 + 生成BGM(2パターン)
   ・BGMはWeb Audioでその場で生成（音源ファイル無し＝軽量・完全オフライン）
   ・ねらい: 家族が穏やかに、冷静に、ゆとりをもって記録・介助できる音
     ＝ゆっくり・穏やか・でも暗くない（長調ペンタトニック）
   ・elder(緑・あたたかい木の音色) / disability(青・澄んだ音色)
   ・ブラウザの自動再生制限があるため、最初のタップで自然に始まる作り
   ・tap.js が Sound.tap() を参照する（音はこの1本に集約） */
const Sound = (() => {
  let ctx = null;
  let enabled = true;          // タップ音
  let bgmEnabled = true;       // BGM設定
  let mode = 'elder';
  let playing = false;
  let master = null, filter = null;
  let timer = 0, nextBar = 0, chordIdx = 0;

  const PATTERNS = {
    elder: {      // 緑: あたたかく、ゆったり（ハ長調ペンタ系）
      bar: 4.6, vol: 0.042, lp: 750, type: 'triangle',
      chords: [[131, 196, 262], [110, 165, 220], [175, 220, 262], [98, 196, 294]],
      scale: [523, 587, 659, 784, 880]
    },
    disability: { // 青: 澄んで、静かに（ト長調ペンタ系）
      bar: 5.2, vol: 0.038, lp: 620, type: 'sine',
      chords: [[98, 196, 247], [82.4, 165, 247], [131, 196, 330], [147, 196, 294]],
      scale: [587, 659, 784, 880, 988]
    }
  };

  function ensure(){
    if(!ctx){
      try{ ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(_){ ctx = null; }
    }
    if(ctx && ctx.state === 'suspended'){ try{ ctx.resume(); }catch(_){} }
  }

  function click(){
    try{
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 830;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.09);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.1);
    }catch(_){}
  }

  function scheduleBar(t){
    const p = PATTERNS[mode];
    const chord = p.chords[chordIdx % p.chords.length];
    chordIdx++;
    // パッド(和音・ゆっくり膨らんでゆっくり消える)
    chord.forEach(f => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = p.type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(p.vol, t + p.bar * 0.35);
      g.gain.linearRampToValueAtTime(0.0001, t + p.bar * 1.35);
      o.connect(g); g.connect(filter);
      o.start(t); o.stop(t + p.bar * 1.4);
    });
    // まばらな単音(1〜2音・オルゴールのように)
    const n = 1 + (Math.random() < 0.5 ? 1 : 0);
    for(let i = 0; i < n; i++){
      const nt = t + p.bar * (0.15 + Math.random() * 0.7);
      const f = p.scale[Math.floor(Math.random() * p.scale.length)];
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, nt);
      g.gain.linearRampToValueAtTime(p.vol * 0.55, nt + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, nt + 2.2);
      o.connect(g); g.connect(filter);
      o.start(nt); o.stop(nt + 2.3);
    }
  }

  function startBgm(){
    ensure();
    if(!ctx || playing) return;
    if(ctx.state === 'suspended') return;   // まだ操作前→次のタップで始まる
    master = ctx.createGain(); master.gain.value = 1;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = PATTERNS[mode].lp;
    filter.connect(master); master.connect(ctx.destination);
    playing = true; chordIdx = 0;
    nextBar = ctx.currentTime + 0.1;
    scheduleBar(nextBar); nextBar += PATTERNS[mode].bar;
    timer = setInterval(() => {
      if(!playing || !ctx) return;
      if(ctx.currentTime > nextBar - 1.2){
        scheduleBar(nextBar);
        nextBar += PATTERNS[mode].bar;
      }
    }, 400);
  }

  function stopBgm(){
    if(!playing) return;
    playing = false;
    clearInterval(timer);
    if(master && ctx){
      try{
        master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
        const m = master;
        setTimeout(() => { try{ m.disconnect(); }catch(_){} }, 1600);
      }catch(_){}
    }
    master = null; filter = null;
  }

  function maybeStartBgm(){ if(bgmEnabled && !playing) startBgm(); }

  function tap(){
    ensure();
    if(enabled && ctx) click();
    maybeStartBgm();          // 最初のタップ＝ブラウザが音を許可する瞬間
  }

  return {
    tap,
    setEnabled(v){ enabled = !!v; },
    get enabled(){ return enabled; },
    setBgmEnabled(v){ bgmEnabled = !!v; if(bgmEnabled) maybeStartBgm(); else stopBgm(); },
    get bgmEnabled(){ return bgmEnabled; },
    get bgmPlaying(){ return playing; },
    setBgmMode(m){
      if(!PATTERNS[m] || mode === m) return;
      mode = m;
      if(playing){ stopBgm(); maybeStartBgm(); }
    }
  };
})();
