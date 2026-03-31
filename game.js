const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const overlay = document.getElementById('overlay');
const overlayMessage = document.getElementById('overlay-message');
const bestScoreEl = document.getElementById('best-score');
const startBtn = document.getElementById('start-btn');

const W = canvas.width;
const H = canvas.height;

// --- Game constants ---
const GRAVITY = 0.45;
const FLAP_FORCE = -8.5;
const PIPE_WIDTH = 70;
const PIPE_GAP = 160;
const PIPE_SPEED = 2.8;
const PIPE_INTERVAL = 90; // frames between pipes
const BIRD_X = 100;
const BIRD_RADIUS = 20;

// --- Game state ---
let bird, pipes, score, bestScore, frame, gameState, animId;

// gameState: 'idle' | 'playing' | 'dead'

function initGame() {
  bird = { y: H / 2, vy: 0, angle: 0 };
  pipes = [];
  score = 0;
  frame = 0;
  gameState = 'playing';
  scoreDisplay.textContent = '0';
}

function flap() {
  if (gameState === 'playing') {
    bird.vy = FLAP_FORCE;
  }
}

// --- Input ---
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    flap();
  }
});
canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });

startBtn.addEventListener('click', () => {
  overlay.classList.remove('active');
  startBtn.textContent = 'Rejouer';
  initGame();
  if (animId) cancelAnimationFrame(animId);
  gameLoop();
});

// --- Pipe generation ---
function spawnPipe() {
  const minTop = 80;
  const maxTop = H - PIPE_GAP - 80;
  const topH = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
  pipes.push({ x: W + 10, topH, passed: false });
}

// --- Collision detection ---
function circleRect(cx, cy, r, rx, ry, rw, rh) {
  const nearX = Math.max(rx, Math.min(cx, rx + rw));
  const nearY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearX;
  const dy = cy - nearY;
  return dx * dx + dy * dy < r * r;
}

function checkCollisions() {
  // Ground / ceiling
  if (bird.y + BIRD_RADIUS >= H - 60 || bird.y - BIRD_RADIUS <= 0) return true;
  // Pipes
  for (const p of pipes) {
    if (
      circleRect(BIRD_X, bird.y, BIRD_RADIUS - 3, p.x, 0, PIPE_WIDTH, p.topH) ||
      circleRect(BIRD_X, bird.y, BIRD_RADIUS - 3, p.x, p.topH + PIPE_GAP, PIPE_WIDTH, H)
    ) {
      return true;
    }
  }
  return false;
}

// --- Drawing helpers ---
function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, H - 60);
  grad.addColorStop(0, '#70c5ce');
  grad.addColorStop(1, '#a8d8ea');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H - 60);
}

function drawGround() {
  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, H - 60, W, 30);
  ctx.fillStyle = '#5d9b3a';
  ctx.fillRect(0, H - 60, W, 10);
}

function drawClouds(offset) {
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  const cloudData = [
    { x: 60, y: 80, r: 30 },
    { x: 220, y: 50, r: 25 },
    { x: 340, y: 100, r: 20 },
    { x: 130, y: 140, r: 18 },
  ];
  for (const c of cloudData) {
    const cx = ((c.x - offset * 0.3) % (W + 80) + W + 80) % (W + 80) - 40;
    ctx.beginPath();
    ctx.arc(cx, c.y, c.r, 0, Math.PI * 2);
    ctx.arc(cx + c.r * 0.8, c.y - c.r * 0.4, c.r * 0.7, 0, Math.PI * 2);
    ctx.arc(cx - c.r * 0.8, c.y - c.r * 0.2, c.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPipe(p) {
  // Top pipe
  const capH = 20;
  const capW = PIPE_WIDTH + 8;

  // Top body
  const topGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
  topGrad.addColorStop(0, '#4cbb2c');
  topGrad.addColorStop(0.4, '#73d94c');
  topGrad.addColorStop(1, '#2e8c18');
  ctx.fillStyle = topGrad;
  ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topH - capH);

  // Top cap
  const capGrad = ctx.createLinearGradient(p.x - 4, 0, p.x + capW, 0);
  capGrad.addColorStop(0, '#3eaa20');
  capGrad.addColorStop(0.4, '#6ecf3e');
  capGrad.addColorStop(1, '#267a10');
  ctx.fillStyle = capGrad;
  ctx.fillRect(p.x - 4, p.topH - capH, capW, capH);

  // Bottom body
  ctx.fillStyle = topGrad;
  ctx.fillRect(p.x, p.topH + PIPE_GAP + capH, PIPE_WIDTH, H);

  // Bottom cap
  ctx.fillStyle = capGrad;
  ctx.fillRect(p.x - 4, p.topH + PIPE_GAP, capW, capH);

  // Pipe border shading
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.topH - capH);
  ctx.strokeRect(p.x - 4, p.topH - capH, capW, capH);
  ctx.strokeRect(p.x, p.topH + PIPE_GAP + capH, PIPE_WIDTH, H - p.topH - PIPE_GAP - capH);
  ctx.strokeRect(p.x - 4, p.topH + PIPE_GAP, capW, capH);
}

function drawBird(y, angle) {
  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(angle);

  // Body
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  const bodyGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, BIRD_RADIUS);
  bodyGrad.addColorStop(0, '#ffe95c');
  bodyGrad.addColorStop(1, '#f5a623');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = '#c97d00';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Wing
  ctx.beginPath();
  ctx.ellipse(-4, 6, 12, 7, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#f5c842';
  ctx.fill();

  // Eye white
  ctx.beginPath();
  ctx.arc(9, -6, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Pupil
  ctx.beginPath();
  ctx.arc(11, -6, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  // Eye shine
  ctx.beginPath();
  ctx.arc(12, -7.5, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Beak
  ctx.beginPath();
  ctx.moveTo(14, -1);
  ctx.lineTo(22, 1);
  ctx.lineTo(14, 4);
  ctx.closePath();
  ctx.fillStyle = '#ff6b35';
  ctx.fill();
  ctx.strokeStyle = '#cc4400';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawScore() {
  scoreDisplay.textContent = score;
}

// --- Update ---
function update() {
  frame++;

  // Spawn pipes
  if (frame % PIPE_INTERVAL === 0) spawnPipe();

  // Bird physics
  bird.vy += GRAVITY;
  bird.y += bird.vy;
  bird.angle = Math.min(Math.PI / 3, Math.max(-Math.PI / 4, bird.vy * 0.06));

  // Move pipes
  for (const p of pipes) {
    p.x -= PIPE_SPEED;
    if (!p.passed && p.x + PIPE_WIDTH < BIRD_X) {
      p.passed = true;
      score++;
      drawScore();
    }
  }

  // Remove off-screen pipes
  pipes = pipes.filter(p => p.x + PIPE_WIDTH + 10 > 0);

  // Collision
  if (checkCollisions()) {
    gameState = 'dead';
  }
}

// --- Render ---
function render() {
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawClouds(frame);
  for (const p of pipes) drawPipe(p);
  drawGround();
  drawBird(bird.y, bird.angle);
}

// --- Death handling ---
function onDeath() {
  if (bestScore === undefined) bestScore = parseInt(localStorage.getItem('flappy_best') || '0');
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('flappy_best', bestScore);
  }
  overlayMessage.textContent = `Score : ${score}`;
  bestScoreEl.textContent = `Meilleur score : ${bestScore}`;
  overlay.classList.add('active');
}

// --- Game loop ---
function gameLoop() {
  if (gameState === 'playing') {
    update();
    render();
    animId = requestAnimationFrame(gameLoop);
  } else if (gameState === 'dead') {
    render();
    onDeath();
  }
}

// --- Init display ---
(function setup() {
  bestScore = parseInt(localStorage.getItem('flappy_best') || '0');
  if (bestScore > 0) bestScoreEl.textContent = `Meilleur score : ${bestScore}`;

  // Draw a static preview
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawGround();
  drawBird(H / 2, 0);
})();
