// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let selectedCount = null;
let masterMode = false;
let queue = [];
let masterPool = [];       // questions not yet correctly answered
let masterSolved = 0;      // how many uniquely solved
let masterTotal = 0;       // total unique questions
let current = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let answered = false;

// Per-question state
let selectedSingle = null;
let selectedMulti = new Set();
let tfAnswers = {};
let selectedAnalysis = null;

const ANALYSIS_OPTS = [
  {k:'A', desc:'Mindkét állítás igaz, és van összefüggés közöttük'},
  {k:'B', desc:'Mindkét állítás igaz, de nincs összefüggés közöttük'},
  {k:'C', desc:'Az első igaz, a második hamis'},
  {k:'D', desc:'Az első hamis, a második igaz'},
  {k:'E', desc:'Mindkét állítás hamis'},
];

// ═══════════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════════
function selectCount(n) {
  selectedCount = n;
  masterMode = false;
  document.querySelectorAll('.mode-card').forEach(b => b.className = 'mode-card');
  const colorMap = {30:'sel-blue', 100:'sel-green'};
  event.currentTarget.className = 'mode-card ' + (colorMap[n] || 'sel-blue');
  const sb = document.getElementById('startBtn');
  sb.className = 'cta-btn on';
  sb.style.cssText = 'background:#2563EB;color:#ffffff;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,0.4);';
}

function selectMaster() {
  masterMode = true;
  selectedCount = null;
  document.querySelectorAll('.mode-card').forEach(b => b.className = 'mode-card');
  document.getElementById('masterModeBtn').className = 'mode-card sel-amber';
  const sb = document.getElementById('startBtn');
    sb.className = 'cta-btn on';
  sb.style.cssText = 'background:#2563EB;color:#ffffff;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,0.4);';
}

function shuffle(arr) {
  let a = [...arr];
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function startQuiz() {
  if (!selectedCount && !masterMode) return;
  current = 0; score = 0; correctCount = 0; wrongCount = 0;
  if (masterMode) {
    masterPool = shuffle(QUESTIONS);
    masterTotal = masterPool.length;
    masterSolved = 0;
    queue = [masterPool[0]];
    current = 0;
  } else {
    queue = shuffle(QUESTIONS).slice(0, selectedCount);
  }
  showScreen('quiz');
  renderQuestion();
}

function goHome() {
  showScreen('home');
  document.querySelectorAll('.mode-card').forEach(b => b.className = 'mode-card');
  selectedCount = null;
  masterMode = false;
  const sb = document.getElementById('startBtn');
  sb.className = 'cta-btn';
  sb.style.cssText = 'background:#E2E8F0;color:#94A3B8;cursor:not-allowed;box-shadow:none;';
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════
function renderQuestion() {
  answered = false;
  selectedSingle = null;
  const qs = document.getElementById('quizScroll'); if(qs) qs.scrollTop = 0;
  selectedMulti = new Set();
  tfAnswers = {};
  selectedAnalysis = null;

  const q = queue[current];
  const total = queue.length;

  // Header
  const mb = document.getElementById('masterBar');
  if (masterMode) {
    const pct2 = Math.round(masterSolved/masterTotal*100);
    mb.className = 'master-bar show';
    mb.textContent = `♾️ Teljesítve: ${masterSolved} / ${masterTotal} kérdés (${pct2}%) — Visszamaradt: ${masterPool.length}`;
    document.getElementById('progressBar').style.width = (masterSolved/masterTotal*100)+'%'; document.getElementById('progressBar').className = 'prog-fill amber';
    document.getElementById('progressText').textContent = `${masterSolved}/${masterTotal} teljesítve`; document.getElementById('progressRight').textContent = '';
  } else {
    mb.className = 'master-bar'; document.getElementById('progressBar').className = 'prog-fill';
    const pct = ((current)/total*100);
    document.getElementById('progressBar').style.width = pct+'%';
    document.getElementById('progressText').textContent = `${current+1} / ${total} kérdés`; document.getElementById('progressRight').textContent = '';
  }
  document.getElementById('scoreChip').textContent = `${score} pt`;

  // Question card
  const badges = {single:'type-pill tp-single',multi:'type-pill tp-multi',truefalse:'type-pill tp-tf',analysis:'type-pill tp-analysis'};
  const labels = {single:'Egy helyes válasz',multi:'Több helyes válasz',truefalse:'Igaz / Hamis',analysis:'Összefüggés elemzés'};
  document.getElementById('typeBadge').className = 'question-type-badge '+badges[q.type];
  document.getElementById('typeBadge').textContent = labels[q.type];
  document.getElementById('questionNum').textContent = `#${q.id}`;
  document.getElementById('questionText').textContent = q.q;

  // Feedback
  const fb = document.getElementById('feedbackBar');
  fb.className = 'feedback';

  // Next btn
  const nb = document.getElementById('nextBtn');
  nb.className = 'go-btn';
  nb.style.cssText = 'background:#E2E8F0;color:#94A3B8;cursor:not-allowed;box-shadow:none;';
  nb.textContent = 'Válassz egy választ';

  // Render answers
  const area = document.getElementById('answersArea');
  area.innerHTML = '';

  if (q.type === 'single') renderSingle(q, area);
  else if (q.type === 'multi') renderMulti(q, area);
  else if (q.type === 'truefalse') renderTrueFalse(q, area);
  else if (q.type === 'analysis') renderAnalysis(q, area);
}

function styleBtn(btn, state) {
  const dot = btn.querySelector('.opt-dot');
  if (state === 'default') {
    btn.style.cssText = 'background:#fff;border:2px solid #E2E8F0;box-shadow:none;';
    if (dot) dot.style.cssText = 'background:#F1F5F9;border:2px solid #CBD5E1;color:#475569;';
  } else if (state === 'picked') {
    btn.style.cssText = 'background:#DBEAFE;border:2px solid #2563EB;box-shadow:0 0 0 2px #2563EB;';
    if (dot) dot.style.cssText = 'background:#2563EB;border:2px solid #2563EB;color:#fff;';
  } else if (state === 'ok') {
    btn.style.cssText = 'background:#DCFCE7;border:2px solid #16A34A;box-shadow:0 0 0 2px #16A34A;';
    if (dot) dot.style.cssText = 'background:#16A34A;border:2px solid #16A34A;color:#fff;';
  } else if (state === 'bad') {
    btn.style.cssText = 'background:#FEE2E2;border:2px solid #DC2626;box-shadow:0 0 0 2px #DC2626;';
    if (dot) dot.style.cssText = 'background:#DC2626;border:2px solid #DC2626;color:#fff;';
  }
}

function renderSingle(q, area) {
  const wrap = document.createElement('div');
  wrap.className = 'opts-list';
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.innerHTML = `<span class=\"opt-dot\">${String.fromCharCode(65+i)}</span><span>${opt}</span>`;
    styleBtn(btn, 'default');
    btn.onclick = () => {
      if (answered) return;
      document.querySelectorAll('.opt-btn').forEach(b => styleBtn(b, 'default'));
      styleBtn(btn, 'picked');
      selectedSingle = i;
      enableNext();
    };
    wrap.appendChild(btn);
  });
  area.appendChild(wrap);
}

function renderMulti(q, area) {
  const instr = document.createElement('div');
  instr.className = 'multi-hint';
  instr.innerHTML = '☑ Jelöld meg az összes helyes választ!';
  area.appendChild(instr);
  const wrap = document.createElement('div');
  wrap.className = 'opts-list';
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn cb';
    btn.innerHTML = `<span class=\"opt-dot\">${String.fromCharCode(65+i)}</span><span>${opt}</span>`;
    styleBtn(btn, 'default');
    btn.onclick = () => {
      if (answered) return;
      if (selectedMulti.has(i)) { selectedMulti.delete(i); styleBtn(btn, 'default'); btn.querySelector('.opt-dot').textContent = String.fromCharCode(65+i); }
      else { selectedMulti.add(i); styleBtn(btn, 'picked'); btn.querySelector('.opt-dot').textContent = '✓'; }
      selectedMulti.size > 0 ? enableNext() : disableNext();
    };
    wrap.appendChild(btn);
  });
  area.appendChild(wrap);
}

function renderTrueFalse(q, area) {
  const list = document.createElement('div');
  list.className = 'tf-list';
  q.stmts.forEach((stmt, i) => {
    const card = document.createElement('div');
    card.className = 'tf-card';
    card.innerHTML = `<div class=\"tf-stmt\">${i+1}. ${stmt.t}</div><div class=\"tf-row\"><button class=\"tf-btn\" onclick=\"selectTF(${i},'I',this)\">✓ Igaz</button><button class=\"tf-btn\" onclick=\"selectTF(${i},'H',this)\">✗ Hamis</button></div>`;
    list.appendChild(card);
  });
  area.appendChild(list);
}

window.selectTF = function(idx, val, btn) {
  if (answered) return;
  const card = btn.closest('.tf-card');
  card.querySelectorAll('.tf-btn').forEach(b => {
    b.style.cssText = 'background:transparent;color:#475569;font-weight:600;';
  });
  if (val === 'I') btn.style.cssText = 'background:#DCFCE7;color:#16A34A;font-weight:700;';
  else             btn.style.cssText = 'background:#FEE2E2;color:#DC2626;font-weight:700;';
  tfAnswers[idx] = val;
  if (Object.keys(tfAnswers).length === queue[current].stmts.length) enableNext();
};

function renderAnalysis(q, area) {
  const stmtsDiv = document.createElement('div');
  stmtsDiv.className = 'an-stmts';
  stmtsDiv.innerHTML = `<div class=\"an-stmt\"><span class=\"an-lbl l1\">1</span><span>${q.stmt1}</span></div><div class=\"an-stmt\"><span class=\"an-lbl l2\">2</span><span>${q.stmt2}</span></div>`;
  area.appendChild(stmtsDiv);
  const grid = document.createElement('div');
  grid.className = 'an-opts';
  ANALYSIS_OPTS.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'an-opt';
    btn.dataset.key = opt.k;
    btn.innerHTML = `<span class=\"an-key\">${opt.k}</span><span class=\"an-desc\">${opt.desc}</span>`;
    btn.onclick = () => {
      if (answered) return;
      document.querySelectorAll('.an-opt').forEach(b => {
        b.style.cssText = 'background:#fff;border:2px solid #E2E8F0;box-shadow:none;';
        const k = b.querySelector('.an-key');
        if(k) k.style.cssText = 'background:#F1F5F9;border:2px solid #CBD5E1;color:#D97706;';
      });
      btn.style.cssText = 'background:#FEF3C7;border:2px solid #D97706;box-shadow:0 0 0 2px #D97706;';
      const bk = btn.querySelector('.an-key');
      if(bk) bk.style.cssText = 'background:#D97706;border:2px solid #D97706;color:#fff;';
      selectedAnalysis = opt.k;
      enableNext();
    };
    grid.appendChild(btn);
  });
  area.appendChild(grid);
}

function enableNext() {
  const nb = document.getElementById('nextBtn');
  nb.className = 'go-btn on';
  nb.style.cssText = 'background:#2563EB;color:#ffffff;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,0.4);';
  nb.textContent = 'Válasz ellenőrzése →';
}
function disableNext() {
  const nb = document.getElementById('nextBtn');
  nb.className = 'go-btn';
  nb.style.cssText = 'background:#E2E8F0;color:#94A3B8;cursor:not-allowed;box-shadow:none;';
}

function nextQuestion() {
  if (!document.getElementById('nextBtn').className.includes('on')) return;
  if (!answered) { checkAnswer(); return; }
  if (masterMode) {
    // masterPool is updated in checkAnswer; if empty we're done
    if (masterPool.length === 0) { showResults(); return; }
    queue = [masterPool[0]];
    current = 0;
    renderQuestion();
  } else {
    current++;
    if (current >= queue.length) { showResults(); return; }
    renderQuestion();
  }
}

function checkAnswer() {
  answered = true;
  const q = queue[current];
  let isCorrect = false;

  if (q.type === 'single') {
    isCorrect = selectedSingle === q.ans;
    document.querySelectorAll('.opt-btn').forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.ans) styleBtn(btn, 'ok');
      else if (i === selectedSingle && !isCorrect) styleBtn(btn, 'bad');
    });
  } else if (q.type === 'multi') {
    const correctSet = new Set(q.ans);
    const userSet = selectedMulti;
    isCorrect = q.ans.every(a => userSet.has(a)) && userSet.size === q.ans.length;
    document.querySelectorAll('.opt-btn').forEach((btn, i) => {
      btn.disabled = true;
      if (correctSet.has(i)) styleBtn(btn, 'ok');
      else if (userSet.has(i)) styleBtn(btn, 'bad');
    });
  } else if (q.type === 'truefalse') {
    let allRight = true;
    q.stmts.forEach((stmt, i) => {
      const userAns = tfAnswers[i];
      const card = document.querySelectorAll('.tf-card')[i];
      const btns = card.querySelectorAll('.tf-btn');
      btns.forEach(b => b.disabled = true);
      const isI = stmt.ans === 'I';
      const trueBtn = btns[0], falseBtn = btns[1];
      if (stmt.ans === 'I') { trueBtn.classList.add('ok-t'); } else { falseBtn.classList.add('ok-f'); }
      if (userAns !== stmt.ans) {
        allRight = false;
        if (userAns === 'I') trueBtn.classList.add('bad-v');
        else falseBtn.classList.add('bad-v');
      }
    });
    isCorrect = allRight;
  } else if (q.type === 'analysis') {
    isCorrect = selectedAnalysis === q.ans;
    document.querySelectorAll('.an-opt').forEach(btn => {
      btn.disabled = true;
      const k = btn.querySelector('.an-key');
      if (btn.dataset.key === q.ans) {
        btn.style.cssText = 'background:#DCFCE7;border:2px solid #16A34A;box-shadow:0 0 0 2px #16A34A;';
        if(k) k.style.cssText = 'background:#16A34A;border:2px solid #16A34A;color:#fff;';
      } else if (btn.dataset.key === selectedAnalysis && !isCorrect) {
        btn.style.cssText = 'background:#FEE2E2;border:2px solid #DC2626;box-shadow:0 0 0 2px #DC2626;';
        if(k) k.style.cssText = 'background:#DC2626;border:2px solid #DC2626;color:#fff;';
      }
    });
  }

  // Feedback
  const fb = document.getElementById('feedbackBar');
  const fbIcon = document.getElementById('fbIcon');
  const fbMsg = document.getElementById('fbMsg');
  if (isCorrect) {
    score += 10;
    correctCount++;
    fb.className = 'feedback ok-fb show';
    fbIcon.textContent = '✅';
    if (masterMode) {
      // Remove this question from the pool (it was at index 0)
      masterPool.shift();
      masterSolved++;
      const remaining = masterPool.length;
      fbMsg.textContent = remaining === 0
        ? 'Helyes! 🏆 Minden kérdést teljesítettél!'
        : `Helyes! +10 pont — Még ${remaining} kérdés van hátra`;
    } else {
      fbMsg.textContent = 'Helyes! +10 pont';
    }
  } else {
    wrongCount++;
    fb.className = 'feedback bad-fb show';
    fbIcon.textContent = '❌';
    if (q.type === 'single') fbMsg.textContent = `Helytelen. Helyes: ${q.opts[q.ans]}`;
    else if (q.type === 'multi') fbMsg.textContent = `Helytelen. Helyes: ${q.ans.map(a=>String.fromCharCode(65+a)).join(', ')}`;
    else if (q.type === 'truefalse') fbMsg.textContent = 'Helytelen. A helyes válaszok zöldek.';
    else fbMsg.textContent = `Helytelen. Helyes: ${q.ans}`;
    if (masterMode) {
      // Move this question to a random position later in the pool (not first)
      masterPool.shift();
      const insertAt = masterPool.length === 0 ? 0 : Math.floor(Math.random() * Math.max(1, Math.min(masterPool.length, 5))) + 1;
      masterPool.splice(insertAt, 0, q);
    }
  }

  document.getElementById('scoreChip').textContent = `${score} pt`;

  const nb = document.getElementById('nextBtn');
  nb.className = 'go-btn on';
  nb.style.cssText = 'background:#2563EB;color:#ffffff;cursor:pointer;box-shadow:0 4px 16px rgba(37,99,235,0.4);';
  if (masterMode) {
    nb.textContent = masterPool.length === 0 ? 'Eredmény 🏆' : 'Következő →';
  } else {
    nb.textContent = current < queue.length-1 ? 'Következő →' : 'Eredmény →';
  }
}

// ═══════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════
function showResults() {
  showScreen('results');
  let total, pct;
  if (masterMode) {
    total = masterTotal;
    pct = 100; // completed all
  } else {
    total = queue.length;
    pct = Math.round(correctCount/total*100);
  }

  document.getElementById('resultPct').textContent = pct+'%';
  document.getElementById('statCorrect').textContent = masterMode ? masterTotal : correctCount;
  document.getElementById('statWrong').textContent = wrongCount;
  document.getElementById('statTotal').textContent = total;

  // Ring animation
  const circumference = 2 * Math.PI * 62;
  const offset = circumference * (1 - pct/100);
  setTimeout(() => {
    document.getElementById('resultCircle').style.strokeDashoffset = offset;
    document.getElementById('resultCircle').style.transition = 'stroke-dashoffset 1s ease';
  }, 100);

  // Medal & title
  let medal, title, sub;
  if (masterMode) {
    medal='♾️'; title='Végtelen Mód befejezve!'; sub=`Minden ${total} kérdést helyesen megválaszoltál!`;
  } else if (pct >= 90) { medal='🏆'; title='Kiváló!'; sub='Mesteri teljesítmény!'; }
  else if (pct >= 75) { medal='🥇'; title='Nagyon jó!'; sub='Gratulálunk!'; }
  else if (pct >= 60) { medal='🥈'; title='Jó teljesítmény'; sub='Még egy kis gyakorlás!'; }
  else if (pct >= 40) { medal='🥉'; title='Haladás!'; sub='Érdemes újra próbálni.'; }
  else { medal='📚'; title='Tanulj tovább!'; sub='Olvasd át az anyagot.'; }

  document.getElementById('medal').textContent = medal;
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultSub').textContent = `${sub} Pontszám: ${score} | Kísérletek: ${correctCount+wrongCount}`;
}

function restartQuiz() {
  current = 0; score = 0; correctCount = 0; wrongCount = 0;
  if (masterMode) {
    masterPool = shuffle(QUESTIONS);
    masterTotal = masterPool.length;
    masterSolved = 0;
    queue = [masterPool[0]];
  } else {
    queue = shuffle(QUESTIONS).slice(0, selectedCount);
  }
  showScreen('quiz');
  renderQuestion();
}
