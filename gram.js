/* Pierożek – grammar module (map, concept cards, practice, diagnostic, wrong notes) */
(function () {
  'use strict';
  const G = window.GRAMMAR;
  if (!G) return;

  /* ---- function words join the word deck as their own level (appended, so existing card ids stay the same) ---- */
  const V = window.VOCAB;
  const normW = s => s.toLowerCase().replace(/\([^)]*\)/g, '').split(/[,/]/)[0].trim();
  const have = new Set(V.words.map(w => normW(w[0])));
  const lvF = V.levels.length;
  V.levels.push('기능어');
  V.first = lvF;
  G.ftopics.forEach(t => {
    const ti = V.topics.length;
    V.topics.push(t);
    for (const [pl, ko] of G.fwords[t]) if (!have.has(normW(pl))) { V.words.push([pl, ko, lvF, ti]); have.add(normW(pl)); }
  });

  const UNITS = G.units;
  const U = Object.fromEntries(UNITS.map(u => [u.id, u]));
  const REC = ['g01', 'g02', 'g03', 'g04', 'g12', 'g13', 'g1t', 'g05', 'g06', 'g08', 'g19', 'g18', 'g09', 'g15', 'g07', 'g10', 'g11', 'g14', 'g16', 'g17',
    'g20', 'g29', 'g21', 'g22', 'g25', 'g23', 'g26', 'g28', 'g24', 'g27',
    'g37', 'g30', 'g31', 'g36', 'g38', 'g39', 'g32', 'g40', 'g33', 'g34', 'g35'];
  const INT = [1, 3, 7, 16, 35, 90];        // review intervals (days) after good sessions
  const PASS = 0.8;
  const DIA = ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'];
  let P, S;                                   // core API, state
  let run = null;                             // current practice run

  const esc = s => P.esc(s);
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>';

  /* ---------------- state ---------------- */
  function g() {
    const s = P.S;
    if (!s.g) s.g = { u: {}, d: null, w: {}, rep: {}, r: {}, day: { k: '', n: 0, ok: 0 } };
    if (!s.g.r) s.g.r = {};
    const k = P.dayKey(Date.now());
    if (s.g.day.k !== k) s.g.day = { k, n: 0, ok: 0 };
    return s.g;
  }
  const ust = id => (g().u[id] = g().u[id] || { n: 0, ok: 0, sess: 0, step: -1, due: 0, rec: [], last: 0 });
  const ready = u => u.n > 0;                 // unit has exercises
  function unitAcc(id) { const r = (g().u[id] || {}).rec || []; return r.length ? r.filter(Boolean).length / r.length : null; }
  function unitState(id) {
    const s = g().u[id];
    if (s && s.sess) return s.step >= 2 ? 'good' : 'learn';
    if (g().d && g().d[id] === 1) return 'known';
    if (g().d && g().d[id] === 0) return 'weak';
    return 'new';
  }
  const STATE = { good: ['mint', '익숙해요'], learn: ['butter', '연습 중'], known: ['sky', '진단: 알아요'], weak: ['coral', '진단: 연습 필요'], new: ['', '아직 안 함'] };
  const dueUnits = () => UNITS.filter(u => ready(u) && g().u[u.id] && g().u[u.id].sess && g().u[u.id].due <= Date.now()).map(u => u.id);
  const nextUnit = () => REC.find(id => !['good', 'known'].includes(unitState(id)) && !(g().u[id] && g().u[id].sess)) || REC.find(id => unitState(id) !== 'good');
  const wrongKeys = () => Object.keys(g().w);
  const getItem = key => { const [u, i] = key.split(':'); return key.endsWith(':d') ? U[u].diag : (G.items[u] || [])[+i]; };

  /* ---------------- choosing items (weak rules come up more often) ---------------- */
  const typeOf = it => it.t || 'gap';
  function ruleAcc(r) { const a = g().r[r]; return a && a.length >= 3 ? a.filter(Boolean).length / a.length : null; }
  function pick(uid, n, exclude, types) {
    const all = G.items[uid] || [];
    const recent = new Set(ust(uid).seen || []);
    let idx = all.map((_, i) => i).filter(i => !exclude.has(`${uid}:${i}`));
    if (types) idx = idx.filter(i => types.includes(typeOf(all[i])));
    const score = i => { const acc = ruleAcc(all[i].r); return Math.random() * (1 + 2 * (acc === null ? 0.4 : 1 - acc)) - (recent.has(i) ? 1 : 0); };
    return idx.map(i => [score(i), i]).sort((a, b) => b[0] - a[0]).slice(0, n).map(x => `${uid}:${x[1]}`);
  }
  function build(kind, arg, gm) {
    const keys = [], ex = new Set();
    const add = list => list.forEach(k => { if (!ex.has(k)) { ex.add(k); keys.push(k); } });
    let label = '', mode = gm || 'mix', n = 12;
    if (kind === 'unit') {
      label = U[arg].t;
      add(pick(arg, mode === 'mix' ? 2 : 0, ex, ['tr', 'err']));
      add(pick(arg, n - keys.length, ex, ['gap']));
    }
    else if (kind === 'quick') { label = U[arg].t + ' · 확인'; mode = 'choice'; add(pick(arg, 3, ex, ['gap'])); }
    else if (kind === 'wrong') { label = '오답노트'; add(P.shuffle(wrongKeys().filter(k => !arg || k.startsWith(arg + ':'))).slice(0, 15)); mode = 'choice'; }
    else if (kind === 'mixed') {
      label = '섞어 풀기';
      const started = UNITS.filter(u => ready(u) && g().u[u.id] && g().u[u.id].sess).map(u => u.id);
      for (let k = 0; k < 15; k++) add(pick(started[k % started.length], 1, ex));
    } else if (kind === 'today') {
      label = '오늘의 문법';
      add(P.shuffle(wrongKeys()).slice(0, 4));
      const due = dueUnits();
      due.forEach(id => add(pick(id, Math.max(2, Math.ceil(7 / due.length)), ex)));
      const nu = nextUnit();
      if (nu) add(pick(nu, Math.max(4, 15 - keys.length), ex));
    } else if (kind === 'diag') {
      label = '진단 테스트'; mode = 'choice';
      UNITS.forEach(u => { if (ready(u)) add(pick(u.id, 2, ex, ['gap'])); else if (u.diag) add([`${u.id}:d`]); });
    }
    let list = kind === 'diag' ? keys : P.shuffle(keys.slice(0, kind === 'today' ? 15 : keys.length));
    if (kind === 'unit' && mode === 'mix') {  // choices first, then typing, rewrite / find-the-error items at the end
      const sp = list.filter(k => typeOf(getItem(k)) !== 'gap');
      list = [...list.filter(k => typeOf(getItem(k)) === 'gap'), ...sp];
    }
    return { kind, arg, gm: mode, label, keys: list, at: 0, mode, res: [], picked: null, typed: '', state: 'ask' };
  }
  function modeOf(r, i) {
    const t = typeOf(getItem(r.keys[i]));
    if (t !== 'gap') return t;
    if (r.mode !== 'mix') return r.mode;
    const gaps = r.keys.filter(k => typeOf(getItem(k)) === 'gap').length;
    return i < Math.ceil(gaps / 2) ? 'choice' : 'input';
  }

  /* ---------------- answer checking ---------------- */
  const clean = s => s.normalize('NFC').toLowerCase().replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim();
  const strip = s => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
  const cleanS = s => clean(s).replace(/[.!?,;:–—"„”]/g, ' ').replace(/\s+/g, ' ').trim();
  function judge(it, ans) {
    if (it.t === 'tr') {
      const ok = [it.a, ...(it.alt || [])].some(a => cleanS(a) === cleanS(ans));
      const near = !ok && [it.a, ...(it.alt || [])].some(a => strip(cleanS(a)) === strip(cleanS(ans)));
      return { ok, near };
    }
    const ok = [it.a, ...(it.alt || [])].some(a => clean(a) === clean(ans));
    const near = !ok && [it.a, ...(it.alt || [])].some(a => strip(a) === strip(ans));
    return { ok, near };
  }

  /* ---------------- recording ---------------- */
  function record(key, ok) {
    const st = g(), [uid, i] = key.split(':');
    st.day.n++; if (ok) st.day.ok++;
    const it = getItem(key);
    if (it && it.r) st.r[it.r] = [...(st.r[it.r] || []), ok ? 1 : 0].slice(-20);
    if (i !== 'd') {
      const u = ust(uid);
      u.n++; if (ok) u.ok++;
      u.rec = [...(u.rec || []), ok ? 1 : 0].slice(-30);
      u.seen = [...(u.seen || []), +i].slice(-40);
      u.last = Date.now();
    }
    if (run.kind === 'diag') return;
    if (ok) {
      if (key in st.w) { st.w[key]++; if (st.w[key] >= 2) delete st.w[key]; }
    } else st.w[key] = 0;
  }
  function finishRun() {
    const st = g();
    const per = {};
    run.res.forEach(([key, ok]) => { const u = key.split(':')[0]; (per[u] = per[u] || [0, 0])[0] += ok; per[u][1]++; });
    if (run.kind === 'diag') {
      // "알아요" needs every answer right and at least 2 answers (1 for units with a single hand-written check)
      st.d = st.d || {};
      for (const u in per) {
        const need = ready(U[u]) ? 2 : 1;
        if (per[u][0] < per[u][1]) st.d[u] = 0;
        else if (per[u][1] >= need) st.d[u] = 1;
      }
    } else if (run.kind !== 'quick' && run.kind !== 'wrong') {
      for (const u in per) {
        if (per[u][1] < 3) continue;
        const s = ust(u), acc = per[u][0] / per[u][1];
        s.sess++;
        if (acc >= PASS) s.step = Math.min(s.step + 1, INT.length - 1); else s.step = Math.max(-1, Math.min(s.step, 0) - 0);
        s.due = P.dayStart(P.dayKey(Date.now()), acc >= PASS ? INT[Math.max(0, s.step)] : 1);
      }
    }
    P.save();
  }

  /* ---------------- screens ---------------- */
  function chip(id) { const [c, t] = STATE[unitState(id)]; return `<span class="tag ${c}">${t}</span>`; }
  function renderMap() {
    P.setNav('grammar');
    const st = g(), due = dueUnits(), w = wrongKeys().length, nu = nextUnit();
    const stages = G.stages.map(([sn, name]) => {
      const us = UNITS.filter(u => u.st === sn);
      const live = us.some(ready);
      return `<section class="card">
        <h2>${sn}단계 · ${esc(name)} ${live ? '' : '<span class="tag">준비 중</span>'}</h2>
        <div class="glist">${us.map(u => {
          const acc = unitAcc(u.id);
          return `<button class="gunit ${ready(u) ? '' : 'off'}" ${ready(u) ? `data-go="gunit/${u.id}"` : 'disabled'}>
            <span class="glv">${u.lv}</span>
            <span class="gt"><b>${esc(u.t)}</b><span>${esc(u.d)}</span>${acc !== null ? `<i class="gbar"><i style="width:${Math.round(acc * 100)}%"></i></i>` : ''}</span>
            ${ready(u) ? chip(u.id) : ''}</button>`;
        }).join('')}</div></section>`;
    }).join('');
    P.app.innerHTML = `
      <div class="top"><h1>문법</h1></div>
      <section class="card">
        <div class="stats3">
          <div class="stat lilac"><b>${due.length}</b><span>복습할 단원</span></div>
          <div class="stat coral"><b>${w}</b><span>오답노트</span></div>
          <div class="stat mint"><b>${st.day.n}</b><span>오늘 푼 문제</span></div>
        </div>
        <button class="btn lilac" data-gs="today">오늘의 문법 15문제</button>
        <div class="row2" style="margin-top:10px">
          <button class="btn ghost" data-gs="diag">${st.d ? '진단 다시 하기' : '진단 테스트'}</button>
          <button class="btn ghost" data-gs="mixed" ${UNITS.filter(u => g().u[u.id] && g().u[u.id].sess).length >= 2 ? '' : 'disabled'}>섞어 풀기</button>
        </div>
        <button class="btn ghost" data-gact="cmp" style="margin-top:10px">헷갈리는 쌍 모아 보기</button>
        ${!st.d ? '<p class="small muted" style="margin:12px 2px 0">처음이라면 진단 테스트로 아는 단원과 약한 단원을 먼저 확인해 보세요. 약 70문제이고, 중간에 그만둬도 푼 만큼 저장돼요.</p>' : nu ? `<p class="small muted" style="margin:12px 2px 0">다음 추천 단원: <b>${esc(U[nu].t)}</b></p>` : ''}
      </section>
      ${stages}`;
  }

  function cardHtml(u, compact) {
    const c = u.card;
    if (!c) return '<p class="muted">이 단원은 준비 중이에요.</p>';
    const tbl = t => `<div class="gtw"><table class="gtab ${t[0].length >= 4 ? 'wide' : ''}"><tr>${t[0].map(h => `<th>${md(h)}</th>`).join('')}</tr>${t[1].map(r => `<tr>${r.map(x => `<td>${md(x)}</td>`).join('')}</tr>`).join('')}</table></div>`;
    return `
      ${compact ? '' : `<div class="gsec"><span class="glab">쉽게 말하면</span>${c.easy.map(p => `<p>${md(p)}</p>`).join('')}</div>`}
      <div class="gsec"><span class="glab">한눈에 보기</span>${tbl(c.table)}${c.cmp ? tbl(c.cmp) : ''}</div>
      ${compact ? '' : `<div class="gsec"><span class="glab">예문 · 눌러서 듣기</span>${c.ex.map(([pl, ko]) => `<button class="gex" data-gsay="${esc(pl)}"><b class="pl">${esc(pl)}</b><span>${esc(ko)}</span></button>`).join('')}</div>`}
      <div class="gsec gpts"><span class="glab">포인트</span><ul>${c.pts.map(p => `<li>${md(p)}</li>`).join('')}</ul></div>`;
  }
  function renderUnit(args) {
    P.setNav(null);
    const u = U[args[0]];
    if (!u) return P.go('grammar');
    const s = g().u[u.id], acc = unitAcc(u.id), wn = wrongKeys().filter(k => k.startsWith(u.id + ':')).length;
    const rules = [...new Set((G.items[u.id] || []).map(it => it.r))]
      .map(r => [r, ruleAcc(r), (g().r[r] || []).length]).filter(x => x[1] !== null).sort((a, b) => a[1] - b[1]);
    const weak = rules.filter(x => x[1] < 0.7).slice(0, 3);
    P.app.innerHTML = `
      <div class="sbar"><button class="iconbtn" data-go="grammar" aria-label="문법 지도로">${P.I.x}</button><h2 style="flex:1">${esc(u.t)}</h2><span class="tag">${u.lv}</span></div>
      <div class="card gcard">${cardHtml(u)}</div>
      <section class="card">
        <h2>연습</h2>
        <p class="small muted" style="margin:0 0 12px">${s && s.sess ? `지금까지 ${s.n}문제 · 최근 정답률 ${Math.round(acc * 100)}%${s.step >= 0 ? ` · 다음 복습 ${new Date(s.due).getMonth() + 1}/${new Date(s.due).getDate()}` : ''}` : `문제 ${P.fmtN(u.n)}개 · '섞어서'는 고르기 다음에 직접 쓰기가 나오고, 문장 바꾸기 · 틀린 곳 찾기도 섞여요.`}</p>
        ${weak.length ? `<div class="gweak"><span class="glab">약한 규칙</span>${weak.map(([r, a, n]) => `<div><b>${esc(G.rl[r] || r)}</b><span>${Math.round(a * 100)}% · ${n}문제</span></div>`).join('')}<p class="small muted" style="margin:4px 0 0">약한 규칙의 문제가 더 자주 나와요.</p></div>` : ''}
        <div style="display:grid;gap:10px">
          <button class="btn lilac" data-gs="unit" data-ga="${u.id}" data-gm="mix">연습 12문제 (섞어서)</button>
          <div class="row2"><button class="btn ghost" data-gs="unit" data-ga="${u.id}" data-gm="choice">고르기만</button><button class="btn ghost" data-gs="unit" data-ga="${u.id}" data-gm="input">직접 쓰기만</button></div>
          <div class="row2"><button class="btn ghost" data-gs="quick" data-ga="${u.id}">바로 확인 3문제</button><button class="btn ghost" data-gs="wrong" data-ga="${u.id}" ${wn ? '' : 'disabled'}>이 단원 오답 ${wn}</button></div>
        </div>
      </section>`;
  }

  function sentenceHtml(it, filled, cls) {
    if (it.t === 'tr') return `<span class="gfill ok">${esc(it.a)}</span>`;
    if (it.t === 'err') return esc(it.full);
    const blank = filled ? `<span class="gfill ${cls}">${esc(filled)}</span>` : '<span class="gblank">&nbsp;</span>';
    return esc(it.s).replace('___', blank) + (it.h ? ` <span class="ghint">${esc(it.h)}</span>` : '');
  }
  const fullText = it => it.t === 'tr' ? it.a : it.t === 'err' ? it.full : it.s.replace('___', it.a);
  const tokens = s => s.split(' ');
  const bare = t => t.replace(/[.,!?;:]/g, '');
  function renderRun() {
    P.setNav(null);
    if (!run) return P.go('grammar');
    if (run.at >= run.keys.length) return renderResult();
    const key = run.keys[run.at], it = getItem(key), u = U[key.split(':')[0]];
    const m = modeOf(run, run.at);
    if (!run.opts || run.optsFor !== key) { run.opts = P.shuffle([it.a, ...it.o]); run.optsFor = key; }
    const done = run.state !== 'ask';
    const last = run.res[run.res.length - 1];
    const ok = done && last && last[1];
    let body, top;
    if (m === 'err') {
      const toks = tokens(it.s);
      top = `<div class="gq-ins">틀린 단어 하나를 누르세요</div>
        <div class="gtoks">${toks.map((t, k) => {
          let cls = '';
          if (done) cls = bare(t) === it.x ? 'ok' : (k === run.picked ? 'no' : '');
          return `<button class="gtok ${cls}" data-gtok="${k}" ${done ? 'disabled' : ''}>${esc(t)}</button>`;
        }).join('')}</div><div class="gko">${esc(it.ko)}</div>`;
      body = done ? `<div class="card gq" style="margin-top:12px"><div class="small muted">고친 문장</div><div class="gs" style="font-size:20px">${esc(it.full)}</div><div class="small muted">${esc(it.x)} → <b>${esc(it.a)}</b></div></div>` : '';
    } else if (m === 'tr') {
      top = `<div class="gq-ins">${esc(it.q)}</div><div class="gs">${esc(it.s)}</div>`;
      body = `<div class="ginput ${done ? (ok ? 'ok' : 'no') : ''}">
          <textarea id="gans" rows="2" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="바꾼 문장 전체를 써 주세요" ${done ? 'disabled' : ''}>${esc(run.typed)}</textarea>
        </div>
        ${done ? '' : `<div class="gdia">${DIA.map(c => `<button data-gch="${c}">${c}</button>`).join('')}</div>
        <div style="margin-top:12px"><button class="btn lilac" data-gact="check">확인</button></div>`}`;
    } else if (m === 'choice') {
      body = `<div class="choices">${run.opts.map((o, k) => {
        let cls = '';
        if (done) cls = o === it.a ? 'ok' : (k === run.picked ? 'no' : 'dim');
        return `<button class="choice ${cls}" data-gp="${k}" ${done ? 'disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>`;
    } else {
      body = `<div class="ginput ${done ? (ok ? 'ok' : 'no') : ''}">
          <input id="gans" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="빈칸에 들어갈 말" value="${esc(run.typed)}" ${done ? 'disabled' : ''}>
        </div>
        ${done ? '' : `<div class="gdia">${DIA.map(c => `<button data-gch="${c}">${c}</button>`).join('')}</div>
        <div style="margin-top:12px"><button class="btn lilac" data-gact="check">확인</button></div>`}`;
    }
    const fb = done ? `<div class="gfb ${ok ? 'ok' : 'no'}">
        <b>${ok ? '정답! 🥟' : run.near ? '거의 맞았어요. 특수문자를 확인하세요' : '아쉬워요'}</b>
        ${ok || m === 'err' ? '' : `<div>정답: <b class="pl">${esc(it.a)}</b></div>`}
        <div class="gwhy">${md(it.w)}</div>
        <div class="gfbtn">
          <button class="link" data-gsay="${esc(fullText(it))}">${P.I.speak}문장 듣기</button>
          ${u.card ? `<button class="link" data-gcard="${u.id}">개념 카드</button>` : ''}
          <button class="link" data-grep="${key}">오류 신고</button>
        </div></div>
        <div style="margin-top:12px"><button class="btn lilac" data-gact="next">${run.at + 1 >= run.keys.length ? '결과 보기' : '다음'}</button></div>` : '';
    P.app.innerHTML = `
      <div class="sbar"><button class="iconbtn" data-gact="quit" aria-label="그만하기">${P.I.x}</button><div class="prog"><i style="width:${run.at / run.keys.length * 100}%"></i></div><span class="tag">${run.at + 1}/${run.keys.length}</span></div>
      <div class="qcounts"><span class="tag lilac">${esc(run.label)}</span>${run.kind === 'unit' || run.kind === 'quick' ? '' : `<span class="tag">${esc(u.t)}</span>`}${{ input: '<span class="tag butter">직접 쓰기</span>', tr: '<span class="tag sky">문장 바꾸기</span>', err: '<span class="tag coral">틀린 곳 찾기</span>' }[m] || ''}</div>
      <div class="card gq">
        ${top || `<div class="gs">${sentenceHtml(it, done ? (m === 'input' && !ok ? run.typed || '—' : it.a) : '', done ? (m === 'input' && !ok ? 'no' : 'ok') : '')}</div>
        <div class="gko">${esc(it.ko)}</div>`}
        ${m === 'tr' && done ? `<div class="gko">${esc(it.ko)}</div>` : ''}
        ${u.card ? `<button class="link ghelp" data-gcard="${u.id}">힌트: 표 보기</button>` : ''}
      </div>
      ${body}${fb}`;
    if ((m === 'input' || m === 'tr') && !done) { const el = document.getElementById('gans'); if (el) el.focus({ preventScroll: true }); }
  }
  function answer(given) {
    if (run.state !== 'ask') return;
    const key = run.keys[run.at], it = getItem(key);
    const j = it.t === 'err' ? { ok: bare(given) === it.x, near: false } : judge(it, given);
    run.near = j.near;
    run.res.push([key, j.ok ? 1 : 0]);
    record(key, j.ok);
    run.state = 'shown';
    P.save();
    if (P.S.set.auto) P.speak(fullText(it), true);
    renderRun();
  }
  function renderResult() {
    finishRun();
    const r = run, right = r.res.filter(x => x[1]).length, tot = r.res.length, pct = tot ? Math.round(right / tot * 100) : 0;
    const wrong = r.res.filter(x => !x[1]).map(x => x[0]);
    let extra = '';
    if (r.kind === 'diag') {
      const weak = REC.filter(u => g().d[u] === 0).concat(Object.keys(g().d).filter(u => g().d[u] === 0 && !REC.includes(u)));
      extra = `<section class="card"><h2>진단 결과</h2>
        <p class="small muted" style="margin:0 0 8px">틀린 문제가 있었던 단원이에요. 위에서부터 차례로 연습해 보세요.</p>
        <div class="glist">${weak.length ? weak.map(u => `<button class="gunit" data-go="gunit/${u}"><span class="glv">${U[u].lv}</span><span class="gt"><b>${esc(U[u].t)}</b><span>${esc(U[u].d)}</span></span>${chip(u)}</button>`).join('') : '<p class="muted">푼 단원은 모두 맞혔어요!</p>'}</div>
        <p class="small muted" style="margin:10px 0 0">결과는 문법 지도의 각 단원에도 표시돼요.</p></section>`;
    }
    P.app.innerHTML = `
      <div class="done">${P.pierog(110, pct >= 80 ? 'joy' : 'happy')}<h2>${right} / ${tot}</h2>
        <p class="muted">${pct >= 90 ? 'Doskonale! 완벽해요' : pct >= 80 ? 'Dobrze! 잘했어요' : r.kind === 'diag' ? '어디부터 연습할지 알았어요' : '틀린 문제는 오답노트에 담겼어요'}</p></div>
      ${extra}
      ${wrong.length ? `<div class="list" style="margin-top:8px">${wrong.map(k => { const it = getItem(k); return `<div class="item" data-gsay="${esc(fullText(it))}"><div class="t"><span class="pl">${sentenceHtml(it, it.a, 'ok')}</span><span class="k">${esc(it.ko)}</span></div><span class="say">${P.I.speak}</span></div>`; }).join('')}</div>` : ''}
      <div style="display:grid;gap:10px;margin-top:18px">
        ${wrong.length && r.kind !== 'diag' ? '<button class="btn lilac" data-gs="wrong">틀린 문제 다시 풀기</button>' : ''}
        ${r.kind === 'unit' ? `<button class="btn ghost" data-gs="unit" data-ga="${r.arg}">12문제 더</button>` : ''}
        <button class="btn ghost" data-go="${r.kind === 'unit' || r.kind === 'quick' ? 'gunit/' + r.arg : 'grammar'}">${r.kind === 'unit' || r.kind === 'quick' ? '단원으로' : '문법 지도로'}</button>
      </div>`;
    run = null;
  }

  /* ---------------- sheets ---------------- */
  function sheet(html) {
    P.closeSheet();
    const el = document.createElement('div');
    el.id = 'sheet';
    el.innerHTML = `<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}
      <button class="btn ghost" data-act="close" style="margin-top:14px">닫기</button></div>`;
    document.body.appendChild(el);
  }
  function reportSheet(key) {
    const it = getItem(key), prev = (g().rep[key] || {}).t || '';
    sheet(`<h2 style="font-size:21px;margin:4px 0 6px">오류 신고</h2>
      <p class="small muted" style="margin:0 0 10px">이상한 문장, 틀린 정답, 어색한 번역을 적어 두면 나중에 모아서 고칠게요.</p>
      <div class="card" style="padding:12px 14px;margin-bottom:10px"><div class="pl">${sentenceHtml(it, it.a, 'ok')}</div><div class="small muted">${esc(it.ko)}</div></div>
      <textarea id="grepnote" class="gnote" rows="3" placeholder="무엇이 이상한가요? (비워 둬도 돼요)">${esc(prev)}</textarea>
      <div style="margin-top:10px"><button class="btn lilac" data-grepsave="${key}">신고 저장</button></div>`);
  }
  function reportList() {
    const rep = g().rep, keys = Object.keys(rep);
    sheet(`<h2 style="font-size:21px;margin:4px 0 10px">신고한 문제 ${keys.length}개</h2>
      ${keys.length ? `<div class="list">${keys.map(k => { const it = getItem(k); return it ? `<div class="item"><div class="t"><span class="pl">${sentenceHtml(it, it.a, 'ok')}</span><span class="k">${esc(rep[k].t || '(메모 없음)')} · ${esc(k)}</span></div><button class="star" data-grepdel="${k}" aria-label="삭제">${P.I.x}</button></div>` : ''; }).join('')}</div>` : '<p class="muted">아직 신고한 문제가 없어요.</p>'}
      <p class="small muted" style="margin:10px 0 0">설정의 '내보내기' 파일에 함께 저장돼요. 파일을 보내 주시면 반영할게요.</p>`);
  }

  /* ---------------- hooks into the core ---------------- */
  function homeCard() {
    const st = g(), due = dueUnits(), w = wrongKeys().length, nu = nextUnit();
    const fresh = !Object.keys(st.u).length && !st.d;
    return `<section class="card">
      <h2>오늘의 문법 <span class="tag lilac">${fresh ? '처음이에요' : `오늘 ${st.day.n}문제`}</span></h2>
      <div class="stats3">
        <div class="stat lilac"><b>${due.length}</b><span>복습할 단원</span></div>
        <div class="stat coral"><b>${w}</b><span>오답노트</span></div>
        <div class="stat butter"><b>${st.day.ok}</b><span>오늘 맞힌 문제</span></div>
      </div>
      ${fresh ? '<div class="row2"><button class="btn lilac" data-gs="diag">진단 테스트</button><button class="btn ghost" data-go="gunit/g01">첫 단원 보기</button></div>'
        : `<div class="row2"><button class="btn lilac" data-gs="today">15문제 풀기</button><button class="btn ghost" data-go="grammar">문법 지도</button></div>${nu ? `<p class="small muted" style="margin:10px 2px 0">다음 추천: ${esc(U[nu].t)}</p>` : ''}`}
    </section>`;
  }
  function boxCard() {
    const n = wrongKeys().length;
    return `<button class="card" data-gs="wrong" style="display:flex;align-items:center;gap:14px;width:100%;text-align:left" ${n ? '' : 'disabled'}>
      <span class="emoji">✏️</span><span style="flex:1"><b style="font-family:var(--fk);font-weight:400;font-size:18px;display:block">문법 오답노트</b><span class="small muted">틀린 문법 문제 · 두 번 연속 맞히면 졸업</span></span>
      <span class="stat ${n ? 'coral' : ''}" style="min-width:56px;padding:6px"><b style="font-size:22px">${n}</b></span></button>`;
  }
  function settingsCard() {
    const n = Object.keys(g().rep).length;
    return `<section class="card">
      <h2 style="margin-bottom:6px">문법</h2>
      <div class="set"><div class="t"><b>오류 신고한 문제</b><span>문제를 풀다가 신고한 목록이에요</span></div><button class="chip" data-gact="replist">${n}개 보기</button></div>
      <div class="set"><div class="t"><b>문법 기록 지우기</b><span>진단 결과, 단원 진도, 오답노트를 지워요. 단어 기록은 그대로예요</span></div><button class="chip" data-gact="greset">지우기</button></div>
    </section>`;
  }

  /* ---------------- events ---------------- */
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-gs],[data-gp],[data-gtok],[data-gact],[data-gch],[data-gsay],[data-gcard],[data-grep],[data-grepsave],[data-grepdel]');
    if (!t || t.disabled) return;
    const d = t.dataset;
    if (d.gsay !== undefined) { e.stopPropagation(); return P.speak(d.gsay, true); }
    if (d.gs) {
      run = build(d.gs, d.ga, d.gm);
      if (!run.keys.length) { run = null; return P.toast('풀 문제가 없어요'); }
      P.closeSheet();
      return P.go('gq');
    }
    if (d.gp !== undefined) { run.picked = +d.gp; return answer(run.opts[+d.gp]); }
    if (d.gtok !== undefined) { const it = getItem(run.keys[run.at]); run.picked = +d.gtok; return answer(tokens(it.s)[+d.gtok]); }
    if (d.gch) {
      const el = document.getElementById('gans');
      if (!el) return;
      const a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a;
      el.value = el.value.slice(0, a) + d.gch + el.value.slice(b);
      run.typed = el.value; el.focus(); el.setSelectionRange(a + 1, a + 1);
      return;
    }
    if (d.gcard) { const u = U[d.gcard]; return sheet(`<h2 style="font-size:21px;margin:4px 0 8px">${esc(u.t)}</h2>${cardHtml(u, true)}`); }
    if (d.grep) return reportSheet(d.grep);
    if (d.grepsave) { g().rep[d.grepsave] = { t: (document.getElementById('grepnote') || {}).value || '', at: Date.now() }; P.save(); P.closeSheet(); return P.toast('신고를 저장했어요'); }
    if (d.grepdel) { delete g().rep[d.grepdel]; P.save(); return reportList(); }
    switch (d.gact) {
      case 'check': { const el = document.getElementById('gans'); const v = el ? el.value.trim() : ''; if (!v) return P.toast('답을 입력해 주세요'); run.typed = v; return answer(v); }
      case 'next': run.at++; run.state = 'ask'; run.picked = null; run.typed = ''; run.near = false; return renderRun();
      case 'quit':
        if (run && run.res.length) { const r = run; r.keys = r.keys.slice(0, r.at + (r.state === 'ask' ? 0 : 1)); return renderResult(); }
        run = null; return P.go('grammar');
      case 'replist': return reportList();
      case 'cmp': return sheet(`<h2 style="font-size:21px;margin:4px 0 10px">헷갈리는 쌍</h2>${G.cmp.map(c => `<div class="gsec"><span class="glab">${esc(c.t)}</span><div class="gtw"><table class="gtab"><tr>${c.h.map(h => `<th>${md(h)}</th>`).join('')}</tr>${c.rows.map(r => `<tr>${r.map(x => `<td>${md(x)}</td>`).join('')}</tr>`).join('')}</table></div></div>`).join('')}`);
      case 'greset':
        if (!await P.ask('문법 기록을 지울까요?', '진단 결과, 단원 진도, 오답노트가 처음으로 돌아가요.', '지우기', true)) return;
        delete P.S.g; P.save(); P.toast('문법 기록을 지웠어요'); return P.render();
    }
  });
  document.addEventListener('input', e => { if (e.target.id === 'gans' && run) run.typed = e.target.value; });
  document.addEventListener('keydown', e => {
    if (!run || P.route().name !== 'gq') return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (run.state === 'ask' && ['input', 'tr'].includes(modeOf(run, run.at)) && !e.shiftKey) { const v = (document.getElementById('gans') || {}).value || ''; if (v.trim()) { run.typed = v.trim(); answer(run.typed); } }
      else if (run.state !== 'ask') { run.at++; run.state = 'ask'; run.picked = null; run.typed = ''; run.near = false; renderRun(); }
    } else if (run.state === 'ask' && modeOf(run, run.at) === 'choice' && '1234'.includes(e.key) && e.key && !e.target.matches('input, textarea')) {
      const k = +e.key - 1; if (run.opts[k] !== undefined) { run.picked = k; answer(run.opts[k]); }
    }
  });

  (window.PZ_PLUGINS = window.PZ_PLUGINS || []).push({
    nav: [['grammar', 'grammar', ICON, '문법']],
    routes: { grammar: renderMap, gunit: renderUnit, gq: renderRun },
    home: () => homeCard(),
    box: () => boxCard(),
    settings: () => settingsCard(),
    init(core) { P = core; S = core.S; window.__gram = { get run() { return run; }, build, judge, getItem, g }; },
  });
})();
