import './style.css';

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const scroller = byId('scroller');
const scenes = Array.from(document.querySelectorAll<HTMLElement>('.scene'));
const hudFill = byId('hudFill');
const hudTime = byId('hudTime');
const hudSwipe = byId('hudSwipe');
const hudState = byId('hudState');

let swipes = 0, seconds = 0, active = -1, slotPresses = 0, slotHits = 0;
let trigger: string | null = null, cntTouched = false, triggerTouched = false;
const dwell: Record<string, number> = {};
/* 영수증이 초기 onScroll 시점에 이미 슬라이더 값을 읽으므로 여기서 먼저 잡는다 */
const cnt = byId<HTMLInputElement>('cnt');
let yearHours = 0;
const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fmt(s: number): string {
  const m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
}

/* ---- timer (pauses when hidden) ---- */
setInterval(function () {
  if (document.hidden) return;
  seconds++;
  hudTime.textContent = fmt(seconds);
  if (active >= 0) {
    const k = scenes[active].dataset.label!;
    dwell[k] = (dwell[k] || 0) + 1;
  }
  paintReceipt();
}, 1000);

/* ---- progress + swipe counting ---- */
const loopSwipe = byId('loopSwipe');
const closeFill = byId('closeFill');
const chainLive = byId('chainLive');

function paintLive(): void {
  loopSwipe.textContent = '이 페이지에서 ' + swipes + '회 스와이프';
  chainLive.innerHTML =
    '지금 이 페이지에서도 같은 게 돌아가는 중입니다.<br>' +
    '문단이 끝난다 → 스와이프한다 · <b>' + swipes + '회</b> 반복';
}

function onScroll(): void {
  const max = scroller.scrollHeight - scroller.clientHeight;
  const p = max > 0 ? (scroller.scrollTop / max) * 100 : 0;
  const pct = Math.min(100, p);
  hudFill.style.width = pct.toFixed(1) + '%';
  closeFill.textContent = Math.round(pct) + '%';

  const mid = scroller.scrollTop + scroller.clientHeight / 2;
  let idx = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (scenes[i].offsetTop <= mid) idx = i;
  }
  if (idx !== active) {
    if (active !== -1) { swipes++; hudSwipe.textContent = String(swipes); }
    active = idx;
    document.body.classList.toggle('daylight', scenes[idx].classList.contains('light'));
    if (idx === scenes.length - 1) {
      hudState.textContent = '기록 완료';
      hudState.classList.add('stopped');
    } else {
      hudState.textContent = '기록 중';
      hudState.classList.remove('stopped');
    }
    paintLive();
    paintReceipt();
  }
}
scroller.addEventListener('scroll', onScroll, { passive: true });
onScroll();
paintLive();

/* ---- 06 회수: HUD를 한 번 깜빡여 시선을 올린다 (1회만) ---- */
if (!calm) {
  const hud = byId('hud');
  const flashIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      flashIO.disconnect();
      setTimeout(function () {
        hud.classList.add('flash');
        setTimeout(function () { hud.classList.remove('flash'); }, 3400);
      }, 900);
    });
  }, { threshold: .55 });
  flashIO.observe(byId('sceneStop'));
}

/* ---- 06 끝나지 않는 피드 (자동 반복) ---- */
(function () {
  const wrapEl = document.getElementById('feedLoop');
  if (!wrapEl) return;
  const slides = Array.from(wrapEl.querySelectorAll<HTMLElement>('.fl-slide'));
  const n = slides.length;
  if (n < 2) return;
  let idx = 0, cur = slides[0], z = 1, onScreen = false;
  const EASE = 'transform .58s cubic-bezier(.22,.61,.36,1)';
  const DWELL = calm ? 4200 : 2250;
  slides.forEach(function (s) {
    s.style.transition = 'none';
    s.style.transform = calm ? 'translate3d(0,0,0)' : 'translate3d(0,100%,0)';
    s.style.opacity = calm ? '0' : '1';
  });
  cur.style.transform = 'translate3d(0,0,0)';
  cur.style.opacity = '1';
  cur.style.zIndex = String(z);
  function step(): void {
    const next = slides[(idx + 1) % n];
    next.style.transition = 'none';
    next.style.zIndex = String(++z);
    if (calm) {
      next.style.transform = 'translate3d(0,0,0)';
      next.style.opacity = '0';
      void next.offsetWidth;
      next.style.transition = 'opacity .7s ease';
      cur.style.transition = 'opacity .7s ease';
      next.style.opacity = '1';
      cur.style.opacity = '0';
    } else {
      next.style.transform = 'translate3d(0,100%,0)';
      void next.offsetWidth;
      next.style.transition = EASE;
      cur.style.transition = EASE;
      next.style.transform = 'translate3d(0,0,0)';
      cur.style.transform = 'translate3d(0,-100%,0)';
    }
    idx = (idx + 1) % n;
    cur = next;
  }
  function tick(): void {
    setTimeout(function () {
      if (onScreen && !document.hidden) step();
      tick();
    }, DWELL);
  }
  const loopIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { onScreen = e.isIntersecting; });
  }, { threshold: .25 });
  loopIO.observe(wrapEl);
  tick();
})();

/* ---- reveal ---- */
const io = new IntersectionObserver(function (es) {
  es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('on'); });
}, { threshold: .18 });
document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

const io2 = new IntersectionObserver(function (es) {
  es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('on'); });
}, { threshold: .35 });
io2.observe(byId('chart'));
io2.observe(byId('grid'));

/* ---- 01 trigger chips ---- */
const chipOut = byId('chipOut');
const recallLine = byId('recallLine');
const chainRows = Array.from(document.querySelectorAll<HTMLElement>('#chain div'));
const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.chip'));

/* 하나를 미리 켜둔다 — 아무것도 선택돼 있지 않으면 누를 수 있다는 걸 모른다.
   대신 직접 고르기 전까지는 영수증에 "(기본값)"으로 표기해 기록을 속이지 않는다. */
function applyTrigger(btn: HTMLButtonElement, byUser: boolean): void {
  if (byUser) triggerTouched = true;
  chips.forEach(function (b) { b.classList.remove('sel'); });
  btn.classList.add('sel');
  trigger = btn.dataset.k as string;
  chainRows.forEach(function (row) {
    const hit = row.dataset.k === trigger;
    row.classList.toggle('sel', hit);
    (row.querySelector('s') as HTMLElement).textContent = hit ? '← 당신이 고른 것' : '';
  });
  chipOut.innerHTML =
    '<b>' + btn.dataset.from + '</b> &nbsp;→&nbsp; <b>' + btn.dataset.to + '</b><br>' +
    '불편한 상태가 사라진 게 아니라, 몇 초 만에 가려진 것입니다. 그래서 다시 돌아옵니다.' +
    (triggerTouched ? '' : '<br><span style="color:#6E6880">↑ 본인에게 맞는 상황으로 바꿔보세요</span>');
  recallLine.innerHTML =
    '그래서 다음에 <strong>' + trigger + '</strong>가 찾아오면 "쇼츠나 볼까"가 자연스럽게 떠오릅니다. ' +
    '01에서 고른 그 상황이, 이제는 내가 고르는 게 아니라 나를 부르는 쪽이 됩니다.';
  paintReceipt();
}
chips.forEach(function (btn) {
  btn.addEventListener('click', function () { applyTrigger(btn, true); });
});
applyTrigger(chips[0], false);

/* ---- 03 slot machine ---- */
interface SlotItem {
  w: number;
  e: string;
  v: string;
  d: string;
  hit: boolean;
}
const pool: SlotItem[] = [
  { w: 60, e: '💬 😔 🌀', v: '시시해. 다음 영상 ㄱㄱ', d: '3초 보고 넘겼습니다. 남는 게 없습니다.', hit: false },
  { w: 30, e: '👍 🙂 💡', v: '괜찮음. 재밌네요.', d: '끝까지 봤습니다. 나쁘지 않았습니다.', hit: false },
  { w: 10, e: '🎉 🤩 🎉', v: '대박!!!! 도파민 터진다!!!!', d: '두 번 봤습니다. 저장했습니다. 친구한테 보냈습니다.', hit: true }
];
const card = byId('slotCard');
const reel = byId('slotReel');
const log = byId('slotLog');
const slotBtn = byId<HTMLButtonElement>('slotBtn');
let spinning = false;
const SPIN_MS = 1250, FILLERS = 9;

function drawPick(): SlotItem {
  const r = Math.random() * 100;
  let acc = 0;
  for (let i = 0; i < pool.length; i++) { acc += pool[i].w; if (r < acc) return pool[i]; }
  return pool[0];
}
function itemHTML(p: SlotItem): string {
  return '<div class="slot-item"><div class="emoji">' + p.e + '</div>' +
    '<div class="verdict">' + p.v + '</div>' +
    '<div class="desc">' + p.d + '</div></div>';
}
function settle(res: SlotItem): void {
  card.classList.toggle('hit', res.hit);
  let msg = '<b>' + slotPresses + '번</b> 눌렀고 대박은 <b>' + slotHits + '번</b>이었습니다.';
  if (slotPresses >= 4 && slotHits === 0) msg += ' 아직 안 나왔으니 다음엔 나올 것 같죠. 그 느낌이 설계입니다.';
  else if (slotPresses >= 4) msg += ' 그 몇 번이 나머지 전부를 견디게 만듭니다.';
  log.innerHTML = msg;
}

/* 릴을 돌린다. 누른 순간 결과는 이미 정해져 있고, 회전은 그걸 늦게 알려줄 뿐이다 —
   슬롯머신이 실제로 하는 일이 이것이라 인터랙션 자체가 03의 주장을 수행한다. */
slotBtn.addEventListener('click', function () {
  if (spinning) return;
  const res = drawPick();
  slotPresses++;
  if (res.hit) slotHits++;
  paintReceipt();

  if (calm) {                     /* 모션 최소화: 회전 없이 결과만 */
    reel.style.transition = 'none';
    reel.style.transform = 'translateY(0)';
    reel.innerHTML = itemHTML(res);
    settle(res);
    return;
  }

  spinning = true;
  slotBtn.disabled = true;
  card.classList.remove('hit', 'stop');
  card.classList.add('spinning');

  /* 현재 칸 → 필러 → 결과 순으로 띠를 만들고 끝까지 밀어 올린다 */
  let strip = reel.children[0] ? (reel.children[0] as HTMLElement).outerHTML : itemHTML(pool[0]);
  for (let i = 0; i < FILLERS; i++) strip += itemHTML(pool[Math.floor(Math.random() * pool.length)]);
  strip += itemHTML(res);
  reel.innerHTML = strip;
  reel.style.transition = 'none';
  reel.style.transform = 'translateY(0)';
  void reel.offsetHeight;        /* 리플로우 — 없으면 트랜지션이 안 걸린다 */

  const dist = (reel.children.length - 1) * card.clientHeight;
  reel.style.transition = 'transform ' + SPIN_MS + 'ms cubic-bezier(.16,.72,.16,1)';
  reel.style.transform = 'translateY(-' + dist + 'px)';

  setTimeout(function () { card.classList.remove('spinning'); }, SPIN_MS - 280);
  setTimeout(function () {
    /* 결과 칸만 남기고 위치를 0으로 되돌린다 — 다음 회전이 늘 같은 조건에서 시작 */
    reel.style.transition = 'none';
    reel.style.transform = 'translateY(0)';
    reel.innerHTML = itemHTML(res);
    card.classList.add('stop');
    settle(res);
    spinning = false;
    slotBtn.disabled = false;
  }, SPIN_MS + 20);
});

/* ---- 05 counter ----
   기본값 110개 = 20대 하루 평균 55분(메조미디어 2024) ÷ 개당 30초.
   개당 30초는 쇼츠 길이 분포(20~40초)를 쓴 추정치이며 조사값이 아니다. */
const AVG = 30;
const presetBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('#presets button'));
const presetNote = byId('presetNote');

function calc(): void {
  const n = parseInt(cnt.value, 10);
  const day = n * AVG;
  byId('cntOut').textContent = String(n);
  byId('perDay').innerHTML = Math.round(day / 60) + '<em>분</em>';
  const mo = day * 30 / 3600;
  byId('perMonth').innerHTML = (mo < 10 ? mo.toFixed(1) : String(Math.round(mo))) + '<em>시간</em>';
  const yrH = day * 365 / 3600, yrD = yrH / 24;
  byId('perYear').innerHTML = yrD.toFixed(1) + '<em>일</em>';
  const cmp = yrH < 40 ? '드라마 시즌 두세 개'
    : yrH < 100 ? '자격증 하나 딸 만한 시간'
    : yrH < 200 ? '악기를 어설프게라도 배울 시간'
    : '새 언어를 입문 단계까지 끝낼 시간';
  byId('kicker').innerHTML =
    '1년에 <b>' + Math.round(yrH) + '시간</b>. 잠도 안 자고 ' + yrD.toFixed(1) + '일 연속으로 이것만 한 셈이고, ' + cmp + '입니다.';
  yearHours = yrH;
  paintReceipt();
}
cnt.addEventListener('input', function () {
  cntTouched = true;
  presetBtns.forEach(function (b) { b.classList.remove('sel'); });
  presetNote.innerHTML = '조사마다 숫자가 다릅니다. 눌러서 각 기준에 맞춰볼 수 있습니다.';
  calc();
});

presetBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    cntTouched = true;
    presetBtns.forEach(function (b) { b.classList.remove('sel'); });
    btn.classList.add('sel');
    cnt.value = String(Math.round(parseFloat(btn.dataset.min as string) * 60 / AVG));
    presetNote.innerHTML = '기준 &nbsp;·&nbsp; <b>' + btn.dataset.src + '</b>';
    calc();
  });
});
calc();

/* ---- 08 개인화 그리드 ----
   열 수를 폭에서 계산하고 셀 수를 열×행으로 맞춘다.
   auto-fill에 고정 개수(96)를 쓰면 마지막 줄이 중간에 끊겨 구간이 덜 찬 것처럼 보인다.
   무늬는 한 번만 뽑아 두고 잘라 쓴다 — 리사이즈할 때마다 라벨이 새로 그려지면
   "쌓인 기록"이라는 08의 의미가 깨진다. */
const grid = byId('grid');
const GRID_ROWS = 4, GRID_MAX = 520;
let gridCols = 0;
const gridSeed: { c: string; d: string }[] = [];
for (let gi = 0; gi < GRID_MAX; gi++) {
  const gr = Math.random();
  gridSeed.push({
    c: gr < .55 ? 'a' : (gr < .8 ? 'b' : 'c'),
    d: (Math.random() * 0.9).toFixed(2)
  });
}
function buildGrid(): void {
  const w = grid.clientWidth;
  if (!w) return;
  const gap = parseFloat(getComputedStyle(grid).gap) || 5;
  const min = window.innerWidth <= 420 ? 20 : 24;
  const cols = Math.max(6, Math.floor((w + gap) / (min + gap)));
  if (cols === gridCols) return;          /* 열 수가 그대로면 다시 그리지 않는다 */
  gridCols = cols;
  const total = Math.min(cols * GRID_ROWS, GRID_MAX);
  grid.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
  let html = '';
  for (let i = 0; i < total; i++) {
    html += '<i class="' + gridSeed[i].c + '" style="transition-delay:' + gridSeed[i].d + 's"></i>';
  }
  grid.innerHTML = html;
}
buildGrid();
let gridTimer: ReturnType<typeof setTimeout>;
function regrid(): void { clearTimeout(gridTimer); gridTimer = setTimeout(buildGrid, 120); }
if (window.ResizeObserver) new ResizeObserver(regrid).observe(grid);
else window.addEventListener('resize', regrid);

/* ---- 10 receipt ---- */
function topLabel(): string {
  let top = '—', best = 0;
  for (const k in dwell) { if (dwell[k] > best) { best = dwell[k]; top = k; } }
  return top === '—' ? '—' : top + ' (' + best + '초)';
}
function closeLabel(): string {
  return seconds < 60
    ? '1분도 안 되는 시간에 여기까지'
    : Math.floor(seconds / 60) + '분 넘게 스크롤해서 여기까지';
}
function triggerLabel(): string {
  if (!trigger) return '고르지 않음';
  return trigger + (triggerTouched ? '' : ' (기본값)');
}
function countLabel(): string {
  return cnt.value + '개' + (cntTouched ? ' · 1년 ' + Math.round(yearHours) + '시간' : ' (기본값)');
}
function rows(): [string, string][] {
  return [
    ['체류 시간', fmt(seconds)],
    ['스와이프', swipes + '회'],
    ['가장 오래 머문 구간', topLabel()],
    ['"다음 영상" 누른 횟수', slotPresses + '회'],
    ['본인이 고른 방아쇠', triggerLabel()],
    ['본인이 잡은 하루 개수', countLabel()]
  ];
}
function paintReceipt(): void {
  byId('rTime').textContent = fmt(seconds);
  byId('rSwipe').textContent = swipes + '회';
  byId('rSlot').textContent = slotPresses + '회';
  byId('rTrigger').textContent = triggerLabel();
  byId('rCount').textContent = countLabel();
  byId('rTop').textContent = topLabel();
  byId('rClose').textContent = closeLabel();
}
paintReceipt();

/* ---- 10 receipt → PNG (전부 로컬. 서버 왕복 없음) ---- */
const MONO = '"IBM Plex Mono","IBM Plex Sans KR","Malgun Gothic",monospace';
const saveBtn = byId<HTMLButtonElement>('saveBtn');
const shareBtn = byId<HTMLButtonElement>('shareBtn');
const rcHint = byId('rcHint');

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\n') { out.push(line); line = ''; continue; }
    if (line && ctx.measureText(line + ch).width > maxW) {
      /* 화면과 동일하게 어절 단위로 끊는다(keep-all). 공백이 없으면 글자 단위로 폴백 */
      const cut = line.lastIndexOf(' ');
      if (cut > 0) { out.push(line.slice(0, cut)); line = line.slice(cut + 1); }
      else { out.push(line); line = ''; }
    }
    if (!line && ch === ' ') continue;   /* 줄 첫머리 공백 제거 */
    line += ch;
  }
  if (line) out.push(line);
  return out;
}
/* 문단별로 나누되, 마지막 줄에 한두 글자만 떨어지면 폭을 줄여 다시 나눈다 */
function wrapTidy(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  let out: string[] = [];
  text.split('\n').forEach(function (para) {
    let lines = wrap(ctx, para, maxW);
    [.93, .86].forEach(function (f) {
      if (lines.length > 1 && lines[lines.length - 1].length <= 2) lines = wrap(ctx, para, maxW * f);
    });
    out = out.concat(lines);
  });
  return out;
}
function dashed(ctx: CanvasRenderingContext2D, y: number, x1: number, x2: number): void {
  ctx.save();
  ctx.setLineDash([5, 5]); ctx.strokeStyle = '#CFC9BC'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x1, y + .5); ctx.lineTo(x2, y + .5); ctx.stroke();
  ctx.restore();
}
function buildCanvas(): HTMLCanvasElement {
  const S = 2, W = 760, PAD = 56, INNER = W - PAD * 2;
  const data = rows();
  const tail = '이 페이지는 당신을 붙잡을 이유가 없고, 개인화도 안 하고, 다음 콘텐츠를 예측해 넣지도 않습니다. 그런데도 ' +
    closeLabel() + ' 오셨습니다.\n실제 쇼츠는 여기서 멈추지 않습니다.';

  const probe = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  probe.font = '400 19px ' + MONO;
  const tailLines = wrapTidy(probe, tail, INNER);

  const H = PAD + 30 + 34 + data.length * 40 + 30 + tailLines.length * 30 + 40 + PAD;
  const c = document.createElement('canvas');
  c.width = W * S; c.height = H * S;
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  ctx.scale(S, S);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#F2EFE8'; ctx.fillRect(0, 0, W, H);

  let y = PAD + 20;
  ctx.fillStyle = '#100E17';
  ctx.font = '600 17px ' + MONO;
  ctx.fillText('SESSION RECORD', PAD, y);
  y += 22; dashed(ctx, y, PAD, W - PAD); y += 34;

  data.forEach(function (r) {
    ctx.font = '400 19px ' + MONO;
    ctx.fillStyle = '#4A4456';
    ctx.textAlign = 'left';
    ctx.fillText(r[0], PAD, y);
    ctx.font = '600 19px ' + MONO;
    ctx.fillStyle = '#100E17';
    ctx.textAlign = 'right';
    ctx.fillText(r[1], W - PAD, y);
    y += 40;
  });

  ctx.textAlign = 'left';
  y += 2; dashed(ctx, y, PAD, W - PAD); y += 30;
  ctx.font = '400 19px ' + MONO;
  ctx.fillStyle = '#4A4456';
  tailLines.forEach(function (l) { ctx.fillText(l, PAD, y); y += 30; });

  y += 18;
  ctx.font = '400 15px ' + MONO;
  ctx.fillStyle = '#8A8296';
  ctx.fillText('왜 못 끊는가 — 켤 때, 볼 때, 다시 켤 때', PAD, y);
  return c;
}
function toBlob(): Promise<Blob> {
  return document.fonts.ready.then(function () {
    return new Promise<Blob>(function (res) {
      buildCanvas().toBlob(function (b) { res(b as Blob); }, 'image/png');
    });
  });
}

saveBtn.addEventListener('click', function () {
  saveBtn.disabled = true;
  toBlob().then(function (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'shorts-session-record.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    rcHint.textContent = '저장했습니다. 이미지는 이 브라우저에서 그려졌고 서버를 거치지 않았습니다.';
    saveBtn.disabled = false;
  }).catch(function () {
    rcHint.textContent = '이미지를 만들지 못했습니다. 화면을 캡처해 주세요.';
    saveBtn.disabled = false;
  });
});

try {
  const probeFile = new File([new Blob()], 'r.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [probeFile] })) shareBtn.hidden = false;
} catch (e) { /* noop */ }

shareBtn.addEventListener('click', function () {
  shareBtn.disabled = true;
  toBlob().then(function (blob) {
    return navigator.share({
      files: [new File([blob], 'shorts-session-record.png', { type: 'image/png' })],
      title: '내 세션 기록'
    });
  }).catch(function () { }).then(function () { shareBtn.disabled = false; });
});
