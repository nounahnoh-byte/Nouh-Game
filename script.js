const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlayText");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");

winSound.volume = 0.7;
loseSound.volume = 0.7;

let audioUnlocked = false;

// فتح الصوت بعد أول لمسة (حل مشكلة المتصفح)
document.addEventListener("touchstart", unlockAudio, { once: true });
document.addEventListener("click", unlockAudio, { once: true });

function unlockAudio() {
  winSound.play().then(() => {
    winSound.pause();
    winSound.currentTime = 0;
    audioUnlocked = true;
  }).catch(() => {});
}

let score = 0;
let best = localStorage.getItem("best") || 0;
document.getElementById("best").textContent = best;

let gameRunning = false;
let cameraX = 0;

// الصور
const playerImg = new Image();
playerImg.src = "https://i.imgur.com/3GCz3im.png";

const enemyImg = new Image();
enemyImg.src = "https://i.imgur.com/8Q1ZQ9Z.png";

const bgImg = new Image();
bgImg.src = "https://i.imgur.com/k2mCiEd.png";

// اللاعب
const player = { x: 100, y: 0, w: 40, h: 50, vy: 0, onGround: false };
const gravity = 0.7;
const speed = 4;

// التحكم
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// أزرار الهاتف
leftBtn.ontouchstart = () => keys["ArrowLeft"] = true;
leftBtn.ontouchend = () => keys["ArrowLeft"] = false;
rightBtn.ontouchstart = () => keys["ArrowRight"] = true;
rightBtn.ontouchend = () => keys["ArrowRight"] = false;
jumpBtn.ontouchstart = () => keys["Space"] = true;
jumpBtn.ontouchend = () => keys["Space"] = false;

// العالم
const platforms = [];
const coins = [];
const enemies = [];
const worldLength = 4200;

// منصات (طويلة وعادية)
let x = 0;
while (x < worldLength - 400) {
  const isLong = Math.random() > 0.6;
  const w = isLong ? 260 : 120;
  const y = 300 - Math.random() * 80;

  platforms.push({ x, y, w, h: 20 });

  if (Math.random() > 0.75) {
    enemies.push({
      x: x + w / 2,
      y: y - 30,
      w: 30,
      h: 30,
      alive: true,
      dir: Math.random() > 0.5 ? 1 : -1
    });
  }

  coins.push({ x: x + w / 2, y: y - 25, taken: false });
  x += w + 80;
}

// أرض البداية
platforms.unshift({ x: -200, y: 330, w: 500, h: 30 });

// منصة الباب
const doorPlatform = {
  x: worldLength - 300,
  y: 260,
  w: 220,
  h: 20
};
platforms.push(doorPlatform);

// الباب فوق المنصة
const door = {
  x: doorPlatform.x + doorPlatform.w / 2 - 20,
  y: doorPlatform.y - 60,
  w: 40,
  h: 60
};

// إعادة اللعب بالضغط
overlay.onclick = restart;

function update() {
  if (!gameRunning) return;

  if (keys["ArrowRight"]) player.x += speed;
  if (keys["ArrowLeft"]) player.x -= speed;

  if (keys["Space"] && player.onGround) {
    player.vy = -13;
    player.onGround = false;
  }

  player.vy += gravity;
  player.y += player.vy;
  player.onGround = false;

  platforms.forEach(p => {
    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y + player.h <= p.y + 10 &&
      player.y + player.h + player.vy >= p.y
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  });

  // الأعداء
  enemies.forEach(e => {
    if (!e.alive) return;

    e.x += e.dir * 1.2;
    if (Math.random() < 0.01) e.dir *= -1;

    // قتل بالقفز
    if (
      player.x < e.x + e.w &&
      player.x + player.w > e.x &&
      player.y + player.h <= e.y + 10 &&
      player.vy > 0
    ) {
      e.alive = false;
      player.vy = -8;
      score += 2;
      document.getElementById("score").textContent = score;
    }
    // لمس جانبي = خسارة
    else if (
      player.x < e.x + e.w &&
      player.x + player.w > e.x &&
      player.y < e.y + e.h &&
      player.y + player.h > e.y
    ) {
      if (audioUnlocked) loseSound.play();
      endGame("💀 خسرت!");
    }
  });

  // العملات
  coins.forEach(c => {
    if (!c.taken && Math.abs(player.x - c.x) < 30) {
      c.taken = true;
      score++;
      document.getElementById("score").textContent = score;
    }
  });

  // الفوز
  if (
    player.x < door.x + door.w &&
    player.x + player.w > door.x &&
    player.y < door.y + door.h &&
    player.y + player.h > door.y
  ) {
    if (audioUnlocked) {
      winSound.currentTime = 0;
      winSound.play();
    }
    endGame("🎉 فزت!");
  }

  cameraX = Math.max(0, player.x - 200);

  if (player.y > canvas.height + 60) {
    if (audioUnlocked) loseSound.play();
    endGame("💥 سقطت!");
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for (let x = -cameraX % bgImg.width; x < canvas.width; x += bgImg.width) {
    ctx.drawImage(bgImg, x, 0);
  }

  ctx.save();
  ctx.translate(-cameraX, 0);

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  ctx.fillStyle = "#654321";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  enemies.forEach(e => e.alive && ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h));

  ctx.fillStyle = "gold";
  coins.forEach(c => !c.taken && ctx.fillRect(c.x, c.y, 10, 10));

  ctx.fillStyle = "green";
  ctx.fillRect(door.x, door.y, door.w, door.h);

  ctx.restore();
}

function endGame(text) {
  gameRunning = false;
  overlay.style.display = "flex";
  overlayText.textContent = text;

  if (score > best) {
    best = score;
    localStorage.setItem("best", best);
    document.getElementById("best").textContent = best;
  }
}

function restart() {
  score = 0;
  document.getElementById("score").textContent = 0;
  player.x = 100;
  player.y = 0;
  player.vy = 0;
  enemies.forEach(e => e.alive = true);
  coins.forEach(c => c.taken = false);
  overlay.style.display = "none";
  gameRunning = true;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
