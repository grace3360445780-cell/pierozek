/* Pierożek 단어장 – 폴란드어 A1–B2 간격 반복 학습 앱 */
(function () {
  'use strict';

  /* ---------- data ---------- */
  const V = window.VOCAB;
  const W = V.words;   // [pl, ko, levelIdx, topicIdx]
  const VB = V.verbs;  // {f, ko, lv, tp, irr, pair, mot, c, r, g, ex, exKo, n}
  const LV = V.levels;
  const TP = V.topics;
  const VERSION = '1.0.0';

  /* ---------- utils ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');
  const nav = $('#nav');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MIN = 60000, DAY = 86400000, ROLL = 4;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmtN = n => n.toLocaleString('ko-KR');
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');

  const I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6H5A1.5 1.5 0 0 1 3.5 19z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7M9 11.5h5"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  };

  /* little pierogi mascot */
  function pierog(size = 76, mood = 'happy') {
    const eyes = mood === 'joy'
      ? '<path d="M35 47q4-5 8 0M57 47q4-5 8 0" stroke="#4A3A2E" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : mood === 'sleep'
        ? '<path d="M35 48h8M57 48h8" stroke="#4A3A2E" stroke-width="3" stroke-linecap="round"/>'
        : '<ellipse cx="39" cy="47" rx="3.6" ry="4.6" fill="#4A3A2E"/><ellipse cx="61" cy="47" rx="3.6" ry="4.6" fill="#4A3A2E"/><circle cx="40.3" cy="45.4" r="1.3" fill="#fff"/><circle cx="62.3" cy="45.4" r="1.3" fill="#fff"/>';
    const mouth = mood === 'joy'
      ? '<path d="M44 55q6 8 12 0z" fill="#E86A6A" stroke="#4A3A2E" stroke-width="2.4" stroke-linejoin="round"/>'
      : '<path d="M45 55q5 5 10 0" stroke="#4A3A2E" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    let crimp = '';
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (1 - k / 12);
      crimp += `<circle cx="${(50 + 43 * Math.cos(a)).toFixed(1)}" cy="${(64 - 44 * Math.sin(a)).toFixed(1)}" r="5.2" fill="#F6D7A6" stroke="#E2B676" stroke-width="2"/>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 90" aria-hidden="true">
      <ellipse cx="50" cy="80" rx="34" ry="5" fill="rgba(61,51,64,.10)"/>
      ${crimp}
      <path d="M8 64C8 38 27 21 50 21s42 17 42 43c0 6-4 10-10 10H18C12 74 8 70 8 64z" fill="#FFE8C4" stroke="#E2B676" stroke-width="2.4"/>
      <ellipse cx="29" cy="56" rx="6" ry="3.6" fill="#FFB3B3" opacity=".75"/>
      <ellipse cx="71" cy="56" rx="6" ry="3.6" fill="#FFB3B3" opacity=".75"/>
      ${eyes}${mouth}
    </svg>`;
  }

  function toast(msg, ms = 2200) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  /* ---------- state ---------- */
  const KEY = 'pierozek.v1';
  const DEF_SET = { nw: 30, nv: 10, nr: 20, rev: true, lv: [1, 1, 1, 1], order: 'level', auto: true, rate: 0.9, voice: '', theme: 'auto' };
  let S;
  // epoch: id of this learning history (changes on reset/import); updated: last change to star/vm/set
  function freshState() { return { v: 1, epoch: null, reset: 0, updated: 0, c: {}, day: { k: '', nw: 0, nr: 0, nv: 0, rv: 0 }, hist: {}, star: {}, vm: {}, set: { ...DEF_SET } }; }
  const newEpoch = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      S = raw ? JSON.parse(raw) : freshState();
    } catch (e) { S = freshState(); }
    const f = freshState();
    for (const k of Object.keys(f)) if (S[k] === undefined) S[k] = f[k];
    S.set = { ...DEF_SET, ...S.set };
  }
  let warned = false;
  function save(metaChanged) {
    if (metaChanged) S.updated = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { if (!warned && !SYNC.on) { warned = true; toast('기록을 저장하지 못했어요. 저장 공간을 확인해 주세요.', 4000); } }
    queueSync();
  }

  /* ---------- cloud sync (only when opened inside claude.ai) ----------
     The history is split into one meta document and 16 card shards under the viewer's
     private data/users/<id>/ collection, so every document stays far below 256 KiB. */
  const SYNC = { on: false, col: null, last: {}, timer: null, busy: false, again: false, status: 'local', at: 0 };
  const NSH = 16;
  const shardName = k => 'c' + String(k).padStart(2, '0');
  function shardOf(id) { let h = 0; for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) >>> 0; return shardName(h % NSH); }
  function wantDocs() {
    const out = { meta: { epoch: S.epoch, reset: S.reset, updated: S.updated, day: S.day, hist: S.hist, star: S.star, vm: S.vm, set: S.set } };
    for (let k = 0; k < NSH; k++) out[shardName(k)] = {};
    for (const id in S.c) out[shardOf(id)][id] = S.c[id];
    return out;
  }
  function queueSync(now) {
    if (!SYNC.on) return;
    if (SYNC.busy) { SYNC.again = true; return; }
    clearTimeout(SYNC.timer);
    SYNC.timer = setTimeout(flush, now ? 0 : 2500);
  }
  async function flush() {
    if (!SYNC.on || SYNC.busy) return;
    SYNC.busy = true;
    try {
      if (!S.epoch) { S.epoch = newEpoch(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
      const want = wantDocs();
      for (const k of Object.keys(want)) {
        const js = JSON.stringify(want[k]);
        if (SYNC.last[k] === js) continue;
        if (k !== 'meta' && js === '{}' && SYNC.last[k] === undefined) continue;
        await SYNC.col.doc(k).set(want[k]);
        SYNC.last[k] = js;
      }
      SYNC.status = 'ok'; SYNC.at = Date.now();
    } catch (e) {
      SYNC.status = 'err';
      if (!e || e.code === 'unavailable' || e.code === 'resource_exhausted') setTimeout(() => queueSync(), 8000 + Math.random() * 4000);
    } finally {
      SYNC.busy = false;
      if (SYNC.again) { SYNC.again = false; queueSync(); }
      showSync();
    }
  }
  function mergeRemote(docs) {
    const m = docs.meta;
    const remote = {};
    for (const k in docs) if (k !== 'meta') Object.assign(remote, docs[k]);
    if (m.epoch && S.epoch && m.epoch !== S.epoch && (m.reset || 0) > (S.reset || 0)) {
      // the other device reset or imported its history more recently: take it as a whole
      S = { ...freshState(), epoch: m.epoch, reset: m.reset || 0, updated: m.updated || 0, c: remote, day: m.day || S.day, hist: m.hist || {}, star: m.star || {}, vm: m.vm || {}, set: { ...DEF_SET, ...m.set } };
      return;
    }
    if (m.epoch && S.epoch && m.epoch !== S.epoch) return; // this device reset more recently; it overwrites the cloud
    if (!S.epoch) S.epoch = m.epoch;
    for (const id in remote) { const r = remote[id], l = S.c[id]; if (!l || (r.t || 0) > (l.t || 0)) S.c[id] = r; }
    for (const k in (m.hist || {})) S.hist[k] = Math.max(S.hist[k] || 0, m.hist[k]);
    if (m.day && m.day.k === S.day.k) for (const f of ['nw', 'nr', 'nv', 'rv']) S.day[f] = Math.max(S.day[f] || 0, m.day[f] || 0);
    else if (m.day && m.day.k > S.day.k) S.day = { ...m.day };
    if ((m.updated || 0) > (S.updated || 0)) { S.star = m.star || {}; S.vm = m.vm || {}; S.set = { ...DEF_SET, ...m.set }; S.updated = m.updated; }
  }
  async function pull() {
    if (!SYNC.on || SYNC.busy) return;
    SYNC.busy = true;
    try {
      const snap = await SYNC.col.get();
      const docs = {};
      snap.docs.forEach(d => { if (d.exists) docs[d.id] = JSON.parse(JSON.stringify(d.data())); });
      SYNC.last = {};
      for (const k in docs) SYNC.last[k] = JSON.stringify(docs[k]);
      if (docs.meta) { mergeRemote(docs); orderCache = null; }
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
      SYNC.status = 'ok'; SYNC.at = Date.now();
    } catch (e) { SYNC.status = 'err'; }
    finally { SYNC.busy = false; }
    queueSync(true);
    if (['home', 'settings', 'browse', 'box'].includes(R.name)) render();
  }
  async function initSync() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const [user, db] = await Promise.all([window.claude.use('user'), window.claude.use('db')]);
      if (!user || !db) return;
      const uid = await user.id();
      if (!uid) return;
      SYNC.col = db.collection('data/users/' + uid);
      SYNC.on = true; SYNC.status = 'sync';
      await pull();
    } catch (e) { SYNC.on = false; SYNC.status = 'local'; }
  }
  function syncText() {
    if (!SYNC.on) return '학습 기록은 이 기기에만 저장돼요.';
    if (SYNC.status === 'err') return '지금은 동기화하지 못했어요. 인터넷에 연결되면 다시 시도해요.';
    if (SYNC.status === 'sync') return '기록을 불러오는 중이에요…';
    const t = new Date(SYNC.at);
    return `자동 동기화 켜짐 · 마지막 동기화 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }
  function showSync() { const el = document.getElementById('syncline'); if (el) el.textContent = syncText(); }

  /* ---------- time ---------- */
  function dayKey(ts) {
    const d = new Date(ts - ROLL * 3600000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dayStart(key, plus = 0) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d + plus, ROLL).getTime();
  }
  const nextDayStart = now => dayStart(dayKey(now), 1);
  function today() {
    const k = dayKey(Date.now());
    if (S.day.k !== k) S.day = { k, nw: 0, nr: 0, nv: 0, rv: 0 };
    return S.day;
  }
  function streak() {
    let k = dayKey(Date.now()), n = 0;
    if (!S.hist[k]) k = dayKey(dayStart(k, -1) + 3600000);
    while (S.hist[k]) { n++; k = dayKey(dayStart(k, -1) + 3600000); }
    return n;
  }

  /* ---------- spaced repetition (Anki-style SM-2) ---------- */
  const STEPS = [1, 10];   // learning steps (minutes)
  const RSTEP = 10;        // relearning step (minutes)
  function schedule(c, r, now, fuzz) {
    const o = c ? { ...c } : { q: 0, s: 0, i: 0, e: 2.5, d: now, n: 0, l: 0 };
    o.n = (o.n || 0) + 1; o.t = now;
    if (r === 1) o.a = now;
    const grad = ivl => { o.q = 2; o.s = 0; o.i = ivl; o.d = dayStart(dayKey(now), ivl); };
    if (o.q === 0 || o.q === 1) {
      if (r === 1) { o.q = 1; o.s = 0; o.d = now + STEPS[0] * MIN; }
      else if (r === 2) { o.q = 1; o.d = now + (o.s === 0 ? (STEPS[0] + STEPS[1]) / 2 : STEPS[o.s]) * MIN; }
      else if (r === 3) { if (o.s + 1 < STEPS.length) { o.q = 1; o.s += 1; o.d = now + STEPS[o.s] * MIN; } else grad(1); }
      else grad(4);
    } else if (o.q === 2) {
      const late = Math.max(0, (now - c.d) / DAY);
      const i = o.i;
      const hard = Math.max(i + 1, Math.round((i + late / 4) * 1.2));
      const good = Math.max(hard + 1, Math.round((i + late / 2) * o.e));
      const easy = Math.max(good + 1, Math.round((i + late) * o.e * 1.3));
      if (r === 1) {
        o.l = (o.l || 0) + 1; o.e = Math.max(1.3, o.e - 0.2); o.q = 3; o.s = 0;
        o.i = Math.max(1, Math.round(i * 0.3)); o.d = now + RSTEP * MIN;
      } else {
        let ni = r === 2 ? hard : r === 3 ? good : easy;
        if (r === 2) o.e = Math.max(1.3, o.e - 0.15);
        if (r === 4) o.e += 0.15;
        if (fuzz && ni >= 3) ni = Math.max(i + 1, Math.round(ni * (0.95 + Math.random() * 0.1)));
        grad(Math.min(ni, 3650));
      }
    } else { // relearning
      if (r === 1) { o.s = 0; o.d = now + RSTEP * MIN; }
      else if (r === 2) { o.d = now + RSTEP * 1.5 * MIN; }
      else if (r === 3) grad(o.i || 1);
      else grad((o.i || 1) + 1);
    }
    o.e = Math.round(o.e * 100) / 100;
    return o;
  }
  function ivlLabel(c, r, now) {
    const n = schedule(c, r, now, false);
    if (n.q === 2) {
      const d = n.i;
      if (d < 30) return `${d}일`;
      if (d < 365) return `${Math.round(d / 30)}개월`;
      return `${(d / 365).toFixed(1)}년`;
    }
    const m = Math.round((n.d - now) / MIN);
    return m < 1 ? '<1분' : `${m}분`;
  }
  const isLearn = c => c && (c.q === 1 || c.q === 3);

  /* ---------- queues ---------- */
  let orderCache = null;
  function wordOrder() {
    const key = S.set.order;
    if (orderCache && orderCache.key === key) return orderCache.list;
    const idx = W.map((_, i) => i);
    let list;
    if (key === 'shuffle') {
      // stable shuffle inside each level (seeded so the order never jumps around)
      let seed = 20240917;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      list = [];
      for (let l = 0; l < LV.length; l++) {
        const part = idx.filter(i => W[i][2] === l);
        for (let a = part.length - 1; a > 0; a--) { const b = Math.floor(rnd() * (a + 1)); [part[a], part[b]] = [part[b], part[a]]; }
        list.push(...part);
      }
    } else list = idx;
    orderCache = { key, list };
    return list;
  }
  function newWords(limit, filter) {
    const out = [];
    if (limit <= 0) return out;
    for (const i of wordOrder()) {
      if (!S.set.lv[W[i][2]] && !filter) continue;
      if (filter && !filter(i)) continue;
      if (!S.c['w' + i]) { out.push('w' + i); if (out.length >= limit) break; }
    }
    return out;
  }
  function newReverse(limit, filter) {
    const out = [];
    if (limit <= 0 || !S.set.rev) return out;
    for (const i of wordOrder()) {
      if (filter && !filter(i)) continue;
      const c = S.c['w' + i];
      if (c && c.q === 2 && c.i >= 3 && !S.c['r' + i]) { out.push('r' + i); if (out.length >= limit) break; }
    }
    return out;
  }
  function newVerbs(limit) {
    const out = [];
    for (let i = 0; i < VB.length && out.length < limit; i++) {
      if (!S.set.lv[VB[i].lv]) continue;
      if (!S.c['v' + i]) out.push('v' + i);
    }
    return out;
  }
  function dueIds(prefixes, filter) {
    const nds = nextDayStart(Date.now());
    const learn = [], rev = [];
    for (const id in S.c) {
      const p = id[0];
      if (!prefixes.includes(p)) continue;
      if (p === 'r' && !S.set.rev) continue;
      if (filter && !filter(+id.slice(1))) continue;
      const c = S.c[id];
      if (isLearn(c)) learn.push(id);
      else if (c.q === 2 && c.d < nds) rev.push(id);
    }
    return { learn, rev };
  }
  function wordPlan() {
    const d = today();
    const { learn, rev } = dueIds(['w', 'r']);
    return { learn, rev, nf: newWords(S.set.nw - d.nw), nr: newReverse(S.set.nr - d.nr) };
  }
  function verbPlan() {
    const d = today();
    const { learn, rev } = dueIds(['v']);
    return { learn, rev, nf: newVerbs(S.set.nv - d.nv), nr: [] };
  }
  function interleave(rev, news) {
    const out = [], total = rev.length + news.length;
    let a = 0, b = 0;
    while (a + b < total) {
      const wantNew = b < news.length && (a >= rev.length || (b + 1) / (a + b + 1) <= news.length / total + 1e-9);
      out.push(wantNew ? news[b++] : rev[a++]);
    }
    return out;
  }

  /* ---------- speech ---------- */
  let voices = [];
  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    voices = speechSynthesis.getVoices().filter(v => /^pl/i.test(v.lang));
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = () => { loadVoices(); if (route().name === 'settings') render(); };
  }
  function ttsText(pl) {
    return pl
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\bnp\..*$/i, ' ')
      .replace(/\b(itd|itp|tzn)\.?/gi, ' ')
      .replace(/,\s*-\s?[a-ząćęłńóśźż]+/gi, ' ')
      .replace(/\s+-\s+/g, ', ')
      .replace(/[\/;]/g, ', ')
      .replace(/[※…]|\.\.\./g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/(\s*,\s*)+/g, ', ')
      .replace(/^[\s,]+|[\s,]+$/g, '')
      .trim();
  }
  let warnedVoice = false;
  function speak(text, raw) {
    if (!('speechSynthesis' in window)) { toast('이 브라우저는 발음 듣기를 지원하지 않아요'); return; }
    const t = raw ? text : ttsText(text);
    if (!t) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'pl-PL';
    const v = voices.find(x => x.name === S.set.voice) || voices[0];
    if (v) u.voice = v;
    else if (!warnedVoice) { warnedVoice = true; toast('폴란드어 음성이 없을 수 있어요. 설정에서 확인해 주세요.', 3200); }
    u.rate = S.set.rate;
    speechSynthesis.speak(u);
  }

  /* ---------- formatting ---------- */
  const fmtPl = s => esc(s).replace(/\([^)]*\)/g, m => `<span class="paren">${m}</span>`);
  const ASP = { ndk: '불완료상', dk: '완료상', 'ndk/dk': '양쪽 상' };
  function verbHead(v) {
    return v.f.map(([n, a]) => `<span class="pl">${esc(n)}${a ? `<span class="asp">${esc(a)}</span>` : ''}</span>`).join('<span class="sl">/</span>');
  }
  function verbTags(v) {
    return (v.irr ? '<span class="tag coral">불규칙</span>' : '') + (v.mot ? '<span class="tag sky">이동 동사</span>' : '') + (v.pair ? '<span class="tag lilac">짝 추가</span>' : '');
  }
  function verbTable(v) {
    const rows = [['pres', '현재'], ['fut', '미래'], ['past', '과거'], ['imp', '명령']];
    const n = v.c.length;
    let h = '<table class="vt"><tr><th></th>' + v.c.map(c => `<th>${esc(ASP[c] || c)} · ${esc(c)}</th>`).join('') + '</tr>';
    for (const [k, lab] of rows) {
      const cells = v.r[k];
      if (!cells) continue;
      h += `<tr><td>${lab}</td>`;
      for (let j = 0; j < n; j++) {
        const c = cells[j] || [];
        const txt = c.length ? `${esc(c[0])}${c[1] ? `<span class="on">${esc(c[1])}</span>` : ''}` : '<span class="muted">—</span>';
        h += `<td class="${n === 1 ? 'only' : ''}">${txt}</td>`;
      }
      h += '</tr>';
    }
    return h + '</table>';
  }
  function verbBack(v, vi) {
    return `<div class="vback">
      <div class="mean">${esc(v.ko)}</div>
      ${verbTable(v)}
      ${v.g ? `<div class="box gov"><span class="lab">격 지배</span>${esc(v.g)}</div>` : ''}
      ${v.ex ? `<div class="box ex" data-say-ex="${vi}"><span class="lab">예문 · 눌러서 듣기</span><div class="plx">${esc(v.ex)}</div><div class="muted">${esc(v.exKo)}</div></div>` : ''}
      ${v.n ? `<div class="box note"><span class="lab">메모</span>${esc(v.n.replace(/^※\s*/, ''))}</div>` : ''}
    </div>`;
  }
  const verbSay = v => v.f.map(x => x[0]).join(', ');

  /* status of a word / verb for lists */
  function status(id) {
    const c = S.c[id];
    if (!c) return 0;
    if (c.q === 2) return c.i >= 21 ? 3 : 2;
    return 1;
  }
  const STATUS_TXT = ['아직 안 배움', '배우는 중', '익히는 중', '장기 기억'];
  function nextTxt(id) {
    const c = S.c[id];
    if (!c) return '';
    if (isLearn(c)) return '오늘 다시 나와요';
    const days = Math.round((c.d - dayStart(dayKey(Date.now()))) / DAY);
    return days <= 0 ? '오늘 복습할 차례예요' : `${days}일 뒤 복습`;
  }

  /* ---------- router (in memory: the page may run inside a frame that owns the URL) ---------- */
  let R = { name: 'home', args: [] };
  const route = () => R;
  function go(h) {
    const [name, ...args] = h.split('/');
    R = { name: name || 'home', args };
    closeSheet(); render(); window.scrollTo(0, 0);
  }

  function setNav(active) {
    if (!active) { nav.classList.add('hide'); app.classList.add('full'); return; }
    nav.classList.remove('hide'); app.classList.remove('full');
    const items = [['home', '', I.home, '홈'], ['browse', 'browse', I.book, '단어장'], ['box', 'box', I.heart, '복습함'], ['settings', 'settings', I.gear, '설정']];
    nav.innerHTML = items.map(([k, h, ic, t]) => `<button data-go="${h}" class="ni ${k === active ? 'on' : ''}" ${k === active ? 'aria-current="page"' : ''}>${ic}<span>${t}</span></button>`).join('');
  }

  let session = null;
  function render() {
    const r = route();
    if (r.name !== 'study' && r.name !== 'cram') session = null;
    if (r.name !== 'quiz') quiz = null;
    applyTheme();
    switch (r.name) {
      case 'study': return renderStudy(r.args);
      case 'cram': return renderCram(r.args);
      case 'quiz': return renderQuiz();
      case 'browse': return renderBrowse();
      case 'box': return renderBox();
      case 'settings': return renderSettings();
      default: return renderHome();
    }
  }

  /* ---------- home ---------- */
  function renderHome() {
    setNav('home');
    const d = today();
    const wp = wordPlan(), vp = verbPlan();
    const wDue = wp.learn.length + wp.rev.length, vDue = vp.learn.length + vp.rev.length;
    const wTotal = wDue + wp.nf.length + wp.nr.length, vTotal = vDue + vp.nf.length;
    const st = streak();
    const started = d.rv > 0;
    const msg = wTotal + vTotal === 0
      ? (started ? 'Brawo! 오늘 분량을 다 끝냈어요 🎉' : '오늘은 쉬어 가는 날이에요. 단어장을 구경해 볼까요?')
      : started ? `Super! 오늘 ${fmtN(d.rv)}장 했어요. 조금만 더!` : 'Cześć! 오늘도 같이 외워 볼까요?';
    const known = W.filter((_, i) => status('w' + i) >= 2).length;

    let lvHtml = '';
    for (let l = 0; l < LV.length; l++) {
      const ids = []; W.forEach((w, i) => { if (w[2] === l) ids.push(i); });
      let s1 = 0, s2 = 0, s3 = 0;
      for (const i of ids) { const s = status('w' + i); if (s === 3) s1++; else if (s === 2) s2++; else if (s === 1) s3++; }
      const t = ids.length, p = x => (x / t * 100).toFixed(2) + '%';
      lvHtml += `<div class="lvrow"><span class="lv">${LV[l]}</span><div class="bar"><i class="b1" style="width:${p(s1)}"></i><i class="b2" style="width:${p(s2)}"></i><i class="b3" style="width:${p(s3)}"></i></div><span class="num">${fmtN(s1 + s2)} / ${fmtN(t)}</span></div>`;
    }

    app.innerHTML = `
      <div class="top"><div class="hello">${pierog(72, wTotal + vTotal === 0 && started ? 'joy' : 'happy')}<div class="bubble">${esc(msg)}</div></div></div>
      <div class="home-grid">
        <section class="card">
          <h2>오늘의 단어 <span class="tag coral">하루 ${S.set.nw}개</span></h2>
          <div class="stats3">
            <div class="stat coral"><b>${wp.nf.length}</b><span>새 단어</span></div>
            <div class="stat lilac"><b>${wp.nr.length}</b><span>말하기 연습</span></div>
            <div class="stat mint"><b>${wDue}</b><span>복습</span></div>
          </div>
          <button class="btn" data-go="study/words" ${wTotal ? '' : 'disabled'}>${wTotal ? '학습 시작' : '오늘 분량 끝!'}</button>
        </section>
        <section class="card">
          <h2>동사 <span class="tag sky">하루 ${S.set.nv}개</span></h2>
          <div class="stats3">
            <div class="stat sky"><b>${vp.nf.length}</b><span>새 동사</span></div>
            <div class="stat mint"><b>${vDue}</b><span>복습</span></div>
            <div class="stat butter"><b>${fmtN(VB.filter((_, i) => S.c['v' + i]).length)}</b><span>배운 동사</span></div>
          </div>
          <div class="row2">
            <button class="btn sky" data-go="study/verbs" ${vTotal ? '' : 'disabled'}>${vTotal ? '동사 카드' : '오늘 끝!'}</button>
            <button class="btn lilac" data-go="quiz">활용 퀴즈</button>
          </div>
        </section>
      </div>
      <div class="streak" style="margin-top:16px">
        <div class="card"><span class="emoji">🔥</span><div><div class="big">${st}<span class="small muted"> 일</span></div><div class="small muted">연속 학습</div></div></div>
        <div class="card"><span class="emoji">🥟</span><div><div class="big">${fmtN(known)}</div><div class="small muted">익힌 단어</div></div></div>
      </div>
      <section class="card">
        <h2>레벨별 진도</h2>
        ${lvHtml}
        <div class="legend"><span><i style="background:var(--mint)"></i>장기 기억</span><span><i style="background:#A9E5CB"></i>익히는 중</span><span><i style="background:var(--butter)"></i>배우는 중</span></div>
      </section>`;
  }

  /* ---------- study session (spaced repetition) ---------- */
  function buildSession(kind, args) {
    let plan, filter = null, label;
    if (kind === 'verbs') { plan = verbPlan(); label = '동사'; }
    else if (kind === 'topic') {
      const lv = +args[0], tp = +args[1];
      filter = i => W[i][2] === lv && W[i][3] === tp;
      const { learn, rev } = dueIds(['w', 'r'], filter);
      plan = { learn, rev, nf: newWords(10, filter), nr: newReverse(10, filter) };
      label = `${LV[lv]} · ${TP[tp]}`;
    } else { plan = wordPlan(); label = '오늘의 단어'; }
    const main = interleave(shuffle(plan.rev.slice()), interleave(plan.nf, plan.nr));
    return { kind, label, main, learn: plan.learn.slice(), cur: null, shown: false, done: 0, undo: [], last: null, startNew: plan.nf.length + plan.nr.length };
  }
  function nextCard(s) {
    const now = Date.now();
    const learnDue = s.learn.filter(id => S.c[id].d <= now).sort((a, b) => S.c[a].d - S.c[b].d);
    let id = learnDue.find(x => x !== s.last) || null;
    if (!id && s.main.length) id = s.main.shift();
    if (!id && learnDue.length) id = learnDue[0];
    if (!id && s.learn.length) id = s.learn.slice().sort((a, b) => S.c[a].d - S.c[b].d)[0];
    s.cur = id; s.shown = false;
  }
  function renderStudy(args) {
    setNav(null);
    const kind = args[0] || 'words';
    if (!session || session.kind !== kind || session.key !== args.join('/')) {
      session = buildSession(kind, args.slice(1)); session.key = args.join('/');
      nextCard(session);
    }
    drawStudy();
  }
  function drawStudy() {
    const s = session;
    if (!s.cur) return drawDone(s);
    const id = s.cur, p = id[0], i = +id.slice(1), c = S.c[id];
    const remain = s.main.length + s.learn.length + (s.learn.includes(id) ? 0 : 1);
    const pct = s.done / (s.done + remain) * 100;
    const nNew = s.main.filter(x => !S.c[x]).length + (!c ? 1 : 0);
    const nLearn = s.learn.length;
    const nRev = remain - nNew - nLearn;
    const starKey = p === 'v' ? id : 'w' + i;
    let meta = '', front = '', back = '';
    if (p === 'v') {
      const v = VB[i];
      meta = `<span class="tag">${LV[v.lv]}</span><span class="tag">${esc(TP[v.tp])}</span>${!c ? '<span class="tag coral">새 동사</span>' : ''}`;
      front = `<div class="vhead word ${v.f.length > 1 ? 'long' : ''}">${verbHead(v)}</div><div>${verbTags(v)}</div>
        <button class="say" data-say="${esc(verbSay(v))}">${I.speak}발음</button><div class="ask">뜻과 활용을 떠올려 보세요</div>`;
      back = verbBack(v, i);
    } else {
      const w = W[i];
      meta = `<span class="tag">${LV[w[2]]}</span><span class="tag">${esc(TP[w[3]])}</span>${!c ? `<span class="tag ${p === 'r' ? 'lilac' : 'coral'}">${p === 'r' ? '말하기 연습' : '새 단어'}</span>` : ''}`;
      if (p === 'w') {
        front = `<div class="word pl ${w[0].length > 26 ? 'long' : ''}">${fmtPl(w[0])}</div>
          <button class="say" data-say="${esc(w[0])}">${I.speak}발음</button><div class="ask">무슨 뜻일까요?</div>`;
        back = `<div class="mean">${esc(w[1])}</div>`;
      } else {
        front = `<div class="kword">${esc(w[1])}</div><div class="ask">폴란드어로 말해 보세요</div>`;
        back = `<div class="word pl ${w[0].length > 26 ? 'long' : ''}">${fmtPl(w[0])}</div>
          <div style="margin-top:10px"><button class="say" data-say="${esc(w[0])}">${I.speak}다시 듣기</button></div>`;
      }
    }
    const now = Date.now();
    app.innerHTML = `
      <div class="sbar">
        <button class="iconbtn" data-act="quit" aria-label="그만하기">${I.x}</button>
        <div class="prog"><i style="width:${pct.toFixed(1)}%"></i></div>
        <button class="iconbtn ${S.star[starKey] ? 'on' : ''}" data-star="${starKey}" aria-label="별표">${I.star}</button>
      </div>
      <div class="qcounts"><span class="tag coral">새 <b>${nNew}</b></span><span class="tag butter">학습 중 <b>${nLearn}</b></span><span class="tag mint">복습 <b>${Math.max(0, nRev)}</b></span></div>
      <div class="flash" data-act="flip">
        <div class="meta">${meta}</div>
        <div class="front">${front}</div>
        ${s.shown ? `<div class="back">${back}</div>` : ''}
      </div>
      ${s.shown
        ? `<div class="rates">${[1, 2, 3, 4].map(r => `<button class="rate r${r}" data-rate="${r}">${['다시', '어려움', '알맞음', '쉬움'][r - 1]}<small>${ivlLabel(c, r, now)}</small></button>`).join('')}</div>`
        : `<div class="tap">카드를 눌러 정답 보기</div><div style="margin-top:12px"><button class="btn ghost" data-act="flip">정답 보기</button></div>`}
      <div class="under">${s.undo.length ? `<button class="link" data-act="undo">${I.undo}되돌리기</button>` : ''}</div>`;
    if (!s.shown && S.set.auto && p !== 'r' && s.spoken !== id) { s.spoken = id; speak(p === 'v' ? verbSay(VB[i]) : W[i][0]); }
  }
  function flip() {
    const s = session;
    if (!s || !s.cur || s.shown) return;
    s.shown = true;
    drawStudy();
    const p = s.cur[0], i = +s.cur.slice(1);
    if (p === 'r' && S.set.auto) speak(W[i][0]);
  }
  function rate(r) {
    const s = session;
    if (!s || !s.cur || !s.shown) return;
    const id = s.cur, now = Date.now(), d = today(), hk = dayKey(now);
    s.undo.push(JSON.stringify({ id, card: S.c[id] || null, day: d, hist: S.hist[hk] || 0, main: s.main, learn: s.learn, done: s.done, last: s.last }));
    if (s.undo.length > 20) s.undo.shift();
    const was = S.c[id];
    const nc = schedule(was, r, now, true);
    if (!was) { if (id[0] === 'w') d.nw++; else if (id[0] === 'r') d.nr++; else d.nv++; }
    d.rv++;
    S.c[id] = nc;
    S.hist[hk] = (S.hist[hk] || 0) + 1;
    s.learn = s.learn.filter(x => x !== id);
    if (isLearn(nc)) s.learn.push(id); else s.done++;
    s.last = id;
    save();
    nextCard(s);
    drawStudy();
  }
  function undo() {
    const s = session;
    if (!s || !s.undo.length) return;
    const u = JSON.parse(s.undo.pop());
    if (u.card) S.c[u.id] = u.card; else delete S.c[u.id];
    S.day = u.day; S.hist[dayKey(Date.now())] = u.hist;
    s.main = u.main; s.learn = u.learn; s.done = u.done; s.last = u.last;
    s.cur = u.id; s.shown = true; s.spoken = u.id;
    save();
    drawStudy();
  }
  function drawDone(s) {
    const wp = wordPlan();
    const more = s.kind === 'words' && wp.nf.length === 0 && wp.learn.length + wp.rev.length === 0;
    app.innerHTML = `
      <div class="done">
        ${pierog(120, 'joy')}
        <h2>${s.done ? 'Świetnie! 다 했어요' : '지금은 볼 카드가 없어요'}</h2>
        <p class="muted">${s.done ? `${esc(s.label)} · ${s.done}장을 마쳤어요.<br>내일 또 만나요!` : '새 단어는 내일 다시 채워져요.'}</p>
        <div style="display:grid;gap:10px;margin-top:22px">
          ${more ? `<button class="btn ghost" data-act="extra">새 단어 10개 더 하기</button>` : ''}
          <button class="btn" data-go="">홈으로</button>
        </div>
      </div>`;
  }

  /* ---------- cram (review box, schedule untouched) ---------- */
  function cramIds(kind) {
    const out = [];
    const hk = dayStart(dayKey(Date.now()));
    if (kind === 'star') { for (const k in S.star) if (S.star[k]) out.push(k); }
    else if (kind === 'leech') {
      W.forEach((_, i) => { const a = S.c['w' + i], b = S.c['r' + i]; if ((a && a.l >= 2) || (b && b.l >= 2)) out.push('w' + i); });
      VB.forEach((_, i) => { const a = S.c['v' + i]; if ((a && a.l >= 2) || (S.vm[i] || 0) >= 2) out.push('v' + i); });
    } else if (kind === 'today') {
      W.forEach((_, i) => { const a = S.c['w' + i], b = S.c['r' + i]; if ((a && a.a >= hk) || (b && b.a >= hk)) out.push('w' + i); });
      VB.forEach((_, i) => { const a = S.c['v' + i]; if (a && a.a >= hk) out.push('v' + i); });
    }
    return out;
  }
  const CRAM_NAME = { star: '별표 단어', leech: '자주 틀린 단어', today: '오늘 틀린 단어' };
  function renderCram(args) {
    setNav(null);
    const kind = args[0];
    if (!session || session.kind !== 'cram-' + kind) {
      const ids = shuffle(cramIds(kind));
      session = { kind: 'cram-' + kind, label: CRAM_NAME[kind], main: ids, total: ids.length, done: 0, cur: ids.shift() || null, shown: false };
      session.main = ids;
    }
    drawCram();
  }
  function drawCram() {
    const s = session;
    if (!s.cur) {
      app.innerHTML = `<div class="done">${pierog(120, 'joy')}<h2>${s.total ? '한 바퀴 끝!' : '아직 모인 단어가 없어요'}</h2>
        <p class="muted">${s.total ? `${esc(s.label)} ${s.total}개를 모두 확인했어요.` : '공부하다 보면 여기에 차곡차곡 모여요.'}</p>
        <div style="display:grid;gap:10px;margin-top:22px"><button class="btn" data-go="box">복습함으로</button></div></div>`;
      return;
    }
    const id = s.cur, p = id[0], i = +id.slice(1);
    let front, back, meta;
    if (p === 'v') {
      const v = VB[i];
      meta = `<span class="tag">${LV[v.lv]}</span><span class="tag">동사</span>`;
      front = `<div class="vhead word ${v.f.length > 1 ? 'long' : ''}">${verbHead(v)}</div><button class="say" data-say="${esc(verbSay(v))}">${I.speak}발음</button>`;
      back = verbBack(v, i);
    } else {
      const w = W[i];
      meta = `<span class="tag">${LV[w[2]]}</span><span class="tag">${esc(TP[w[3]])}</span>`;
      front = `<div class="word pl ${w[0].length > 26 ? 'long' : ''}">${fmtPl(w[0])}</div><button class="say" data-say="${esc(w[0])}">${I.speak}발음</button>`;
      back = `<div class="mean">${esc(w[1])}</div>`;
    }
    const pct = s.done / Math.max(1, s.total) * 100;
    app.innerHTML = `
      <div class="sbar"><button class="iconbtn" data-go="box" aria-label="그만하기">${I.x}</button><div class="prog"><i style="width:${pct}%"></i></div>
        <button class="iconbtn ${S.star[id] ? 'on' : ''}" data-star="${id}" aria-label="별표">${I.star}</button></div>
      <div class="qcounts"><span class="tag butter">${esc(s.label)}</span><span class="tag">${s.done} / ${s.total}</span></div>
      <div class="flash" data-act="cflip"><div class="meta">${meta}</div><div class="front">${front}</div>${s.shown ? `<div class="back">${back}</div>` : ''}</div>
      ${s.shown
        ? `<div class="row2" style="margin-top:16px"><button class="btn" data-cram="0">또 볼래요</button><button class="btn mint" data-cram="1">알았어요</button></div>`
        : `<div class="tap">카드를 눌러 정답 보기</div><div style="margin-top:12px"><button class="btn ghost" data-act="cflip">정답 보기</button></div>`}
      <p class="small muted" style="text-align:center;margin-top:14px">여기서는 복습 일정이 바뀌지 않아요</p>`;
  }
  function cramAnswer(ok) {
    const s = session;
    if (ok) s.done++; else s.main.splice(Math.min(s.main.length, 3 + Math.floor(Math.random() * 3)), 0, s.cur);
    s.cur = s.main.shift() || null; s.shown = false;
    drawCram();
  }

  /* ---------- verb conjugation quiz ---------- */
  const PERS = { ja: 'ja · 나', ty: 'ty · 너', oni: 'oni · 그들', on: 'on · 그', ona: 'ona · 그녀' };
  function verbForms(vi) {
    const v = VB[vi], out = [];
    v.c.forEach((asp, k) => {
      const inf = (v.f[k] || v.f[0])[0];
      const add = (tense, person, ans) => { if (ans && ans !== '—') out.push({ vi, k, asp, inf, tense, person, ans: ans.trim() }); };
      const pr = (v.r.pres || [])[k] || [];
      if (pr.length === 2 && pr[0].includes(',')) {
        const [a, b] = pr[0].split(/,\s*/); add('현재', 'ja', a); add('현재', 'ty', b); add('현재', 'oni', pr[1].replace(/^oni\s+/, ''));
      }
      const fu = (v.r.fut || [])[k] || [];
      if (fu.length === 2 && fu[0].includes(',') && !/^będę/.test(fu[0])) {
        const [a, b] = fu[0].split(/,\s*/); add('미래', 'ja', a); add('미래', 'ty', b); add('미래', 'oni', fu[1].replace(/^oni\s+/, ''));
      }
      const pa = (v.r.past || [])[k] || [];
      if (pa.length === 2 && pa[0].includes('/')) {
        const [a, b] = pa[0].split(/\s*\/\s*/); add('과거', 'on', a); add('과거', 'ona', b); add('과거', 'oni', pa[1].replace(/^oni\s+/, ''));
      }
      const im = (v.r.imp || [])[k] || [];
      if (im.length === 1 && /!$/.test(im[0])) add('명령', 'ty', im[0]);
    });
    return out;
  }
  let quiz = null;
  function quizPool(sel) {
    const out = [];
    VB.forEach((v, i) => { if (sel === 'learned' ? !!S.c['v' + i] : v.lv === +sel) out.push(i); });
    return out;
  }
  function makeQuiz(sel) {
    const pool = quizPool(sel);
    const all = [];
    for (const vi of pool) all.push(...verbForms(vi));
    const qs = [];
    const usedVerb = {};
    for (const f of shuffle(all)) {
      if (qs.length >= 15) break;
      if ((usedVerb[f.vi] || 0) >= 2) continue;
      usedVerb[f.vi] = (usedVerb[f.vi] || 0) + 1;
      // distractors: other forms of the same verb first, then same tense/person from other verbs
      const own = shuffle(verbForms(f.vi).filter(x => x.ans !== f.ans).map(x => x.ans));
      const ch = [];
      for (const a of own) if (!ch.includes(a)) { ch.push(a); if (ch.length === 3) break; }
      if (ch.length < 3) {
        for (const x of shuffle(all.filter(x => x.tense === f.tense && x.person === f.person && x.vi !== f.vi))) {
          if (!ch.includes(x.ans) && x.ans !== f.ans) ch.push(x.ans);
          if (ch.length === 3) break;
        }
      }
      if (ch.length < 2) continue;
      qs.push({ ...f, choices: shuffle([f.ans, ...ch]) });
    }
    return { sel, qs, at: 0, picked: null, right: 0, miss: [] };
  }
  function renderQuiz() {
    setNav(null);
    if (!quiz || !quiz.qs) return drawQuizStart();
    drawQuiz();
  }
  function drawQuizStart() {
    const learned = quizPool('learned').length;
    quiz = {};
    app.innerHTML = `
      <div class="sbar"><button class="iconbtn" data-go="" aria-label="닫기">${I.x}</button><h2 style="flex:1">활용 퀴즈</h2></div>
      <div class="card" style="text-align:center">
        ${pierog(84)}
        <p style="margin:6px 0 2px">동사의 알맞은 형태를 골라 보세요.</p>
        <p class="small muted" style="margin:0">현재 · 미래 · 과거 · 명령형에서 15문제</p>
      </div>
      <div style="display:grid;gap:10px">
        <button class="btn lilac" data-quiz="learned" ${learned >= 4 ? '' : 'disabled'}>배운 동사 (${learned}개)</button>
        ${learned < 4 ? '<p class="small muted" style="text-align:center;margin:0">동사 카드로 4개 이상 배우면 열려요</p>' : ''}
        <div class="row2">${LV.map((l, i) => `<button class="btn ghost" data-quiz="${i}">${l} 동사</button>`).join('')}</div>
      </div>`;
  }
  function drawQuiz() {
    const q = quiz;
    if (q.at >= q.qs.length) {
      const pct = q.qs.length ? Math.round(q.right / q.qs.length * 100) : 0;
      app.innerHTML = `
        <div class="done">${pierog(110, pct >= 70 ? 'joy' : 'happy')}<h2>${q.right} / ${q.qs.length}</h2>
          <p class="muted">${pct >= 90 ? 'Doskonale! 완벽해요' : pct >= 70 ? 'Dobrze! 잘했어요' : '틀린 형태를 한 번 더 볼까요?'}</p></div>
        ${q.miss.length ? `<div class="list" style="margin-top:8px">${q.miss.map(m => `<div class="item" data-say="${esc(m.ans)}"><div class="t"><span class="pl">${esc(m.ans)}</span><span class="k">${esc(m.inf)} · ${m.tense} · ${esc(PERS[m.person])}</span></div><span class="say">${I.speak}</span></div>`).join('')}</div>` : ''}
        <div style="display:grid;gap:10px;margin-top:18px"><button class="btn lilac" data-quiz="${q.sel}">다시 하기</button><button class="btn ghost" data-go="">홈으로</button></div>`;
      return;
    }
    const x = q.qs[q.at];
    const v = VB[x.vi];
    app.innerHTML = `
      <div class="sbar"><button class="iconbtn" data-go="" aria-label="그만하기">${I.x}</button><div class="prog"><i style="width:${q.at / q.qs.length * 100}%"></i></div><span class="tag">${q.at + 1}/${q.qs.length}</span></div>
      <div class="card qprompt">
        <div class="inf pl">${esc(x.inf)}<span class="asp" style="font-size:13px;vertical-align:10px;margin-left:4px;color:var(--coral-d)">${esc(x.asp)}</span></div>
        <div class="muted">${esc(v.ko)}</div>
        <div class="what"><span class="tag sky">${x.tense}</span><span class="tag lilac">${esc(PERS[x.person])}</span></div>
      </div>
      <div class="choices">${x.choices.map((c, k) => {
        let cls = '';
        if (q.picked !== null) cls = c === x.ans ? 'ok' : (k === q.picked ? 'no' : 'dim');
        return `<button class="choice ${cls}" data-pick="${k}" ${q.picked !== null ? 'disabled' : ''}>${esc(c)}</button>`;
      }).join('')}</div>
      <div class="fb">${q.picked === null ? '' : (x.choices[q.picked] === x.ans ? '정답! 🥟' : `정답은 <b class="pl">${esc(x.ans)}</b>`)}</div>
      ${q.picked !== null ? '<div style="margin-top:8px"><button class="btn lilac" data-act="qnext">다음</button></div>' : ''}`;
  }
  function pick(k) {
    const q = quiz, x = q.qs[q.at];
    if (q.picked !== null) return;
    q.picked = k;
    if (x.choices[k] === x.ans) q.right++;
    else { q.miss.push(x); S.vm[x.vi] = (S.vm[x.vi] || 0) + 1; save(true); }
    if (S.set.auto) speak(x.ans, true);
    drawQuiz();
  }

  /* ---------- browse ---------- */
  const ui = { tab: 'w', lv: 0, tp: -1, q: '', lim: 120 };
  function browseList() {
    const q = norm(ui.q.trim());
    const res = [];
    if (ui.tab === 'w') {
      W.forEach((w, i) => {
        if (q) { if (!norm(w[0]).includes(q) && !w[1].includes(ui.q.trim())) return; }
        else { if (w[2] !== ui.lv) return; if (ui.tp >= 0 && w[3] !== ui.tp) return; }
        res.push(i);
      });
    } else {
      VB.forEach((v, i) => {
        if (q) { if (!v.f.some(f => norm(f[0]).includes(q)) && !v.ko.includes(ui.q.trim())) return; }
        else { if (v.lv !== ui.lv) return; if (ui.tp >= 0 && v.tp !== ui.tp) return; }
        res.push(i);
      });
    }
    return res;
  }
  function renderBrowse() {
    setNav('browse');
    app.innerHTML = `
      <div class="top"><h1>단어장</h1></div>
      <label class="search">${I.search}<input id="q" type="search" placeholder="폴란드어나 한국어로 찾기" value="${esc(ui.q)}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"></label>
      <div id="bbody"></div>`;
    updateBrowse();
  }
  // re-renders everything below the search box, so typing (incl. Korean IME) is never interrupted
  function updateBrowse() {
    const box = $('#bbody');
    if (!box) return;
    const res = browseList();
    const searching = !!ui.q.trim();
    const tps = [];
    (ui.tab === 'w' ? W.map(w => [w[2], w[3]]) : VB.map(v => [v.lv, v.tp])).forEach(([l, t]) => { if (l === ui.lv && !tps.includes(t)) tps.push(t); });
    const rows = res.slice(0, ui.lim).map(i => {
      if (ui.tab === 'w') {
        const w = W[i];
        return `<div class="item" data-open="w${i}"><span class="dot s${status('w' + i)}"></span><div class="t"><span class="pl">${fmtPl(w[0])}</span><span class="k">${esc(w[1])}</span></div><button class="star ${S.star['w' + i] ? 'on' : ''}" data-star="w${i}" aria-label="별표">${I.star}</button></div>`;
      }
      const v = VB[i];
      return `<div class="item" data-open="v${i}"><span class="dot s${status('v' + i)}"></span><div class="t"><span class="pl">${esc(v.f.map(f => f[0]).join(' / '))}</span><span class="k">${esc(v.ko)}</span></div><button class="star ${S.star['v' + i] ? 'on' : ''}" data-star="v${i}" aria-label="별표">${I.star}</button></div>`;
    }).join('');
    box.innerHTML = `
      <div class="seg"><button class="${ui.tab === 'w' ? 'on' : ''}" data-tab="w">단어 ${fmtN(W.length)}</button><button class="${ui.tab === 'v' ? 'on' : ''}" data-tab="v">동사 ${fmtN(VB.length)}</button></div>
      ${searching ? '' : `
        <div class="seg">${LV.map((l, i) => `<button class="${ui.lv === i ? 'on' : ''}" data-lv="${i}">${l}</button>`).join('')}</div>
        <div class="chips"><button class="chip ${ui.tp < 0 ? 'on' : ''}" data-tp="-1">전체</button>${tps.map(t => `<button class="chip ${ui.tp === t ? 'on' : ''}" data-tp="${t}">${esc(TP[t])}</button>`).join('')}</div>`}
      <div class="listhead"><span class="muted">${searching ? `검색 결과 ${fmtN(res.length)}개` : `${fmtN(res.length)}개`}</span>
        ${!searching && ui.tab === 'w' && ui.tp >= 0 ? `<button class="tag coral" data-go="study/topic/${ui.lv}/${ui.tp}" style="padding:7px 14px;font-size:14px">이 주제 학습하기</button>` : ''}</div>
      ${res.length ? `<div class="list">${rows}</div>` : `<div class="empty">${pierog(70, 'sleep')}<p>찾는 단어가 없어요</p></div>`}
      ${res.length > ui.lim ? `<button class="more" data-act="more" style="width:100%">더 보기 (${fmtN(res.length - ui.lim)}개 남음)</button>` : ''}`;
  }

  /* ---------- detail sheet ---------- */
  function openSheet(id) {
    closeSheet();
    const p = id[0], i = +id.slice(1);
    let body;
    if (p === 'v') {
      const v = VB[i];
      body = `<div style="text-align:center;margin-bottom:10px"><div class="vhead word long">${verbHead(v)}</div>
        <div style="margin:8px 0">${verbTags(v)}</div><button class="say" data-say="${esc(verbSay(v))}">${I.speak}발음</button></div>${verbBack(v, i)}`;
    } else {
      const w = W[i];
      body = `<div style="text-align:center"><div class="word pl ${w[0].length > 26 ? 'long' : ''}">${fmtPl(w[0])}</div>
        <div style="margin:12px 0"><button class="say" data-say="${esc(w[0])}">${I.speak}발음</button></div>
        <div class="mean" style="font-family:var(--fk);font-size:24px">${esc(w[1])}</div></div>`;
    }
    const lvl = p === 'v' ? VB[i].lv : W[i][2], tpi = p === 'v' ? VB[i].tp : W[i][3];
    const key = p === 'v' ? id : 'w' + i;
    const st = status(key);
    const el = document.createElement('div');
    el.innerHTML = `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog"><div class="grab"></div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:12px"><span class="tag">${LV[lvl]}</span><span class="tag">${esc(TP[tpi])}</span>
        <span class="tag ${['', 'butter', 'mint', 'mint'][st]}">${STATUS_TXT[st]}</span><span style="flex:1"></span>
        <button class="star ${S.star[key] ? 'on' : ''}" data-star="${key}" aria-label="별표">${I.star}</button></div>
      ${body}
      <p class="small muted" style="text-align:center;margin:14px 0 4px">${esc(nextTxt(key))}</p>
      <button class="btn ghost" data-act="close" style="margin-top:8px">닫기</button></div>`;
    el.id = 'sheet';
    document.body.appendChild(el);
    if (S.set.auto) speak(p === 'v' ? verbSay(VB[i]) : W[i][0]);
  }
  function closeSheet() { const s = $('#sheet'); if (s) s.remove(); }

  /* ---------- review box ---------- */
  function renderBox() {
    setNav('box');
    const items = [['star', '⭐', '별표 단어', '직접 별표한 단어와 동사'], ['leech', '🌀', '자주 틀린 단어', '두 번 이상 틀린 단어 · 퀴즈에서 자주 틀린 동사'], ['today', '📌', '오늘 틀린 단어', "오늘 '다시'를 누른 단어"]];
    app.innerHTML = `
      <div class="top"><h1>복습함</h1></div>
      <p class="muted" style="margin:-8px 4px 16px">따로 모아서 한 번 더 보는 곳이에요. 여기서 보는 건 복습 일정에 영향을 주지 않아요.</p>
      ${items.map(([k, e, t, d]) => {
        const n = cramIds(k).length;
        return `<button class="card" data-go="cram/${k}" style="display:flex;align-items:center;gap:14px;width:100%;text-align:left" ${n ? '' : 'disabled'}>
          <span class="emoji">${e}</span><span style="flex:1"><b style="font-family:var(--fk);font-weight:400;font-size:18px;display:block">${t}</b><span class="small muted">${d}</span></span>
          <span class="stat ${n ? 'coral' : ''}" style="min-width:56px;padding:6px"><b style="font-size:22px">${n}</b></span></button>`;
      }).join('')}`;
  }

  /* ---------- settings ---------- */
  function stepper(key, step, min, max) {
    return `<div class="stepper"><button data-step="${key}" data-d="${-step}" data-min="${min}" data-max="${max}" aria-label="줄이기">−</button><b>${S.set[key]}</b><button data-step="${key}" data-d="${step}" data-min="${min}" data-max="${max}" aria-label="늘리기">+</button></div>`;
  }
  const toggle = (key, on) => `<button class="toggle ${on ? 'on' : ''}" data-tog="${key}" role="switch" aria-checked="${on}"></button>`;
  function renderSettings() {
    setNav('settings');
    const total = Object.keys(S.c).length;
    app.innerHTML = `
      <div class="top"><h1>설정</h1></div>
      <section class="card">
        <h2 style="margin-bottom:6px">하루 학습량</h2>
        <div class="set"><div class="t"><b>새 단어</b><span>하루에 새로 배울 단어 수</span></div>${stepper('nw', 5, 0, 200)}</div>
        <div class="set"><div class="t"><b>새 동사</b><span>동사 카드로 새로 배울 동사 수</span></div>${stepper('nv', 1, 0, 50)}</div>
        <div class="set"><div class="t"><b>말하기 연습</b><span>익숙해진 단어를 한국어 → 폴란드어로 떠올리는 카드</span></div>${toggle('rev', S.set.rev)}</div>
        ${S.set.rev ? `<div class="set"><div class="t"><b>말하기 연습 새 카드</b><span>하루에 새로 추가할 말하기 카드 수</span></div>${stepper('nr', 5, 0, 200)}</div>` : ''}
      </section>
      <section class="card">
        <h2 style="margin-bottom:6px">학습 범위</h2>
        <div class="set"><div class="t"><b>레벨</b><span>새 단어와 새 동사를 꺼낼 레벨</span></div>
          <div style="display:flex;gap:6px">${LV.map((l, i) => `<button class="chip ${S.set.lv[i] ? 'on' : ''}" data-lvl="${i}">${l}</button>`).join('')}</div></div>
        <div class="set"><div class="t"><b>새 단어 순서</b><span>레벨 안에서 주제 순서대로, 또는 섞어서</span></div>
          <select class="sel" data-sel="order"><option value="level" ${S.set.order === 'level' ? 'selected' : ''}>주제 순서</option><option value="shuffle" ${S.set.order === 'shuffle' ? 'selected' : ''}>섞어서</option></select></div>
      </section>
      <section class="card">
        <h2 style="margin-bottom:6px">발음</h2>
        <div class="set"><div class="t"><b>자동으로 읽어 주기</b><span>카드가 나오면 폴란드어를 바로 들려줘요</span></div>${toggle('auto', S.set.auto)}</div>
        <div class="set"><div class="t"><b>말하기 속도</b></div>
          <select class="sel" data-sel="rate">${[[0.7, '천천히'], [0.9, '조금 천천히'], [1, '보통']].map(([v, t]) => `<option value="${v}" ${S.set.rate === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="set"><div class="t"><b>음성</b><span>${voices.length ? `폴란드어 음성 ${voices.length}개를 찾았어요` : '폴란드어 음성을 찾지 못했어요. 기기 설정의 텍스트 음성 변환(TTS)에서 폴란드어를 추가해 주세요.'}</span></div>
          ${voices.length ? `<select class="sel" data-sel="voice"><option value="">기본</option>${voices.map(v => `<option value="${esc(v.name)}" ${S.set.voice === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>` : ''}</div>
        <div style="margin-top:12px"><button class="btn ghost" data-say="Dzień dobry! Miło mi cię poznać.">${I.speak}들어 보기</button></div>
      </section>
      <section class="card">
        <h2 style="margin-bottom:6px">화면</h2>
        <div class="set"><div class="t"><b>테마</b></div>
          <select class="sel" data-sel="theme"><option value="auto" ${S.set.theme === 'auto' ? 'selected' : ''}>기기 설정 따라가기</option><option value="light" ${S.set.theme === 'light' ? 'selected' : ''}>밝게</option><option value="dark" ${S.set.theme === 'dark' ? 'selected' : ''}>어둡게</option></select></div>
      </section>
      <section class="card">
        <h2 style="margin-bottom:6px">기록</h2>
        <p class="small" style="margin:0 0 6px"><b id="syncline" style="font-family:var(--fk);font-weight:400;color:${SYNC.on ? '#2E9C73' : 'var(--ink2)'}">${esc(syncText())}</b></p>
        <p class="small muted" style="margin:0 0 12px">${SYNC.on ? '휴대폰과 아이패드에서 같은 계정으로 열면 기록이 이어져요. 파일로 백업해 둘 수도 있어요.' : '다른 기기로 옮기려면 여기서 내보낸 파일을 다른 기기에서 불러오세요.'} (지금까지 ${fmtN(total)}장)</p>
        <div class="row2"><button class="btn mint" data-act="export">내보내기</button><button class="btn sky" data-act="import">불러오기</button></div>
        <input id="file" type="file" accept="application/json,.json" class="hide">
      </section>
      <section class="card">
        <h2 style="margin-bottom:6px">정보</h2>
        <p class="small muted" style="margin:0">단어 ${fmtN(W.length)}개 · 동사 ${fmtN(VB.length)}개 (A1–B2)<br>한국어 뜻과 동사 예문은 AI가 작성한 것이라 사전과 함께 확인해 주세요.<br>버전 ${VERSION}</p>
        <button class="link" data-act="reset" style="margin-top:10px;color:var(--coral-d)">학습 기록 모두 지우기</button>
      </section>`;
  }
  let themed = false;
  function applyTheme() {
    const t = S.set.theme;
    if (t === 'auto') { if (themed) { document.documentElement.removeAttribute('data-theme'); themed = false; } }
    else { document.documentElement.setAttribute('data-theme', t); themed = true; }
  }

  /* in-page confirmation (native confirm() is not available everywhere) */
  let askDone = null;
  function ask(title, msg, ok, danger) {
    return new Promise(res => {
      closeSheet();
      const el = document.createElement('div');
      el.id = 'sheet';
      el.innerHTML = `<div class="scrim" data-ask="0"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>
        <div style="text-align:center">${pierog(70, danger ? 'sleep' : 'happy')}</div>
        <h2 style="font-size:22px;margin:6px 0 8px;text-align:center">${esc(title)}</h2>
        <p class="muted" style="margin:0 0 18px;text-align:center">${esc(msg)}</p>
        <div class="row2"><button class="btn ghost" data-ask="0">취소</button><button class="btn ${danger ? '' : 'mint'}" data-ask="1">${esc(ok)}</button></div></div>`;
      document.body.appendChild(el);
      askDone = res;
    });
  }

  async function exportData() {
    const json = JSON.stringify({ app: 'pierozek', v: 1, at: new Date().toISOString(), state: S });
    const filename = `pierozek-${dayKey(Date.now()).replace(/-/g, '')}.json`;
    let dl = null;
    if (window.claude && typeof window.claude.use === 'function') { try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; } }
    if (dl) {
      try { await dl.save({ filename, data: json }); toast('기록 파일을 저장했어요'); }
      catch (e) { if (e && e.code !== 'declined') toast('파일을 저장하지 못했어요'); }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('기록 파일을 저장했어요');
  }
  function importData(file) {
    const rd = new FileReader();
    rd.onload = async () => {
      let j;
      try { j = JSON.parse(rd.result); } catch (e) { j = null; }
      if (!j || j.app !== 'pierozek' || !j.state || !j.state.c) { toast('이 파일은 불러올 수 없어요'); return; }
      const n = Object.keys(j.state.c).length;
      if (!await ask('기록을 불러올까요?', `이 파일의 기록(${fmtN(n)}장)으로 지금 기록을 바꿔요.`, '불러오기')) return;
      const now = Date.now();
      S = { ...freshState(), ...j.state, set: { ...DEF_SET, ...j.state.set }, epoch: newEpoch(), reset: now };
      orderCache = null; save(true); toast('기록을 불러왔어요'); render();
    };
    rd.readAsText(file);
  }
  async function resetAll() {
    if (!await ask('기록을 모두 지울까요?', '외운 단어와 복습 일정이 처음으로 돌아가요. 되돌릴 수 없어요.', '모두 지우기', true)) return;
    const set = S.set, now = Date.now();
    S = freshState(); S.set = set; S.epoch = newEpoch(); S.reset = now;
    orderCache = null; save(true); toast('기록을 지웠어요'); render();
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-ask],[data-say],[data-say-ex],[data-star],[data-go],[data-act],[data-rate],[data-cram],[data-quiz],[data-pick],[data-tab],[data-lv],[data-tp],[data-open],[data-step],[data-tog],[data-lvl]');
    if (!t) return;
    const ds = t.dataset;
    if (ds.ask !== undefined) { closeSheet(); if (askDone) { const f = askDone; askDone = null; f(ds.ask === '1'); } return; }
    if (ds.say !== undefined) { e.stopPropagation(); speak(ds.say, t.closest('.list') && route().name === 'quiz'); return; }
    if (ds.sayEx !== undefined) { e.stopPropagation(); speak(VB[+ds.sayEx].ex, true); return; }
    if (ds.star !== undefined) {
      e.stopPropagation();
      const k = ds.star;
      if (S.star[k]) delete S.star[k]; else S.star[k] = 1;
      save(true); t.classList.toggle('on', !!S.star[k]);
      toast(S.star[k] ? '별표에 담았어요 ⭐' : '별표를 뺐어요', 1200);
      return;
    }
    if (ds.go !== undefined) { if (t.disabled) return; if (ds.go.startsWith('study') || ds.go.startsWith('cram')) session = null; go(ds.go); return; }
    if (ds.rate) return rate(+ds.rate);
    if (ds.cram) return cramAnswer(ds.cram === '1');
    if (ds.quiz !== undefined) { if (t.disabled) return; quiz = makeQuiz(ds.quiz); if (!quiz.qs.length) { toast('문제를 만들 동사가 부족해요'); quiz = null; return drawQuizStart(); } return drawQuiz(); }
    if (ds.pick) return pick(+ds.pick);
    if (ds.tab) { ui.tab = ds.tab; ui.tp = -1; ui.lim = 120; return updateBrowse(); }
    if (ds.lv) { ui.lv = +ds.lv; ui.tp = -1; ui.lim = 120; return updateBrowse(); }
    if (ds.tp) { ui.tp = +ds.tp; ui.lim = 120; return updateBrowse(); }
    if (ds.open) return openSheet(ds.open);
    if (ds.step) {
      const k = ds.step; S.set[k] = clamp(S.set[k] + +ds.d, +ds.min, +ds.max); save(true); return renderSettings();
    }
    if (ds.tog) { S.set[ds.tog] = !S.set[ds.tog]; save(true); return renderSettings(); }
    if (ds.lvl) {
      const i = +ds.lvl; S.set.lv[i] = S.set.lv[i] ? 0 : 1;
      if (!S.set.lv.some(Boolean)) { S.set.lv[i] = 1; toast('레벨을 하나 이상 골라 주세요'); }
      save(true); return renderSettings();
    }
    switch (ds.act) {
      case 'flip': return flip();
      case 'cflip': if (!session.shown) { session.shown = true; drawCram(); } return;
      case 'undo': return undo();
      case 'quit': return go('');
      case 'qnext': quiz.at++; quiz.picked = null; return drawQuiz();
      case 'more': ui.lim += 200; return updateBrowse();
      case 'close': return closeSheet();
      case 'export': return exportData();
      case 'import': return $('#file').click();
      case 'extra': S.day.nw = Math.max(0, S.day.nw - 10); save(); session = null; return go('study/words');
      case 'reset': return resetAll();
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'file' && t.files[0]) return importData(t.files[0]);
    if (t.dataset.sel) {
      const k = t.dataset.sel;
      S.set[k] = k === 'rate' ? +t.value : t.value;
      if (k === 'order') orderCache = null;
      save(true); render();
    }
  });
  let qTimer;
  document.addEventListener('input', e => {
    if (e.target.id !== 'q') return;
    ui.q = e.target.value; ui.lim = 120;
    clearTimeout(qTimer); qTimer = setTimeout(updateBrowse, 180);
  });
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, select, textarea')) return;
    const r = route().name;
    if (r === 'study' && session) {
      if ((e.key === ' ' || e.key === 'Enter') && !session.shown) { e.preventDefault(); flip(); }
      else if (session.shown && '1234'.includes(e.key) && e.key) rate(+e.key);
      else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) undo();
    } else if (r === 'cram' && session) {
      if ((e.key === ' ' || e.key === 'Enter') && !session.shown) { e.preventDefault(); session.shown = true; drawCram(); }
      else if (session.shown && (e.key === '1' || e.key === '2')) cramAnswer(e.key === '2');
    } else if (e.key === 'Escape') closeSheet();
  });
  // leaving: push pending changes; returning: pick up what the other device did, refresh counters
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (SYNC.on) { clearTimeout(SYNC.timer); flush(); } return; }
    if (SYNC.on) pull(); else if (route().name === 'home') render();
  });

  /* ---------- boot ---------- */
  load();
  today();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const framed = (() => { try { return window.top !== window; } catch (e) { return true; } })();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !framed && !window.claude) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  render();
  initSync();

  // hooks for automated checks
  window.__pz = { get S() { return S; }, schedule, ivlLabel, wordPlan, verbPlan, verbForms, ttsText, interleave, dayKey, dayStart, streak, makeQuiz, get session() { return session; } };
})();
