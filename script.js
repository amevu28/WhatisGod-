// =====================================================
// LANDING PAGE DRAG TRANSITION
// kéo từ trái sang phải như lật / kéo một trang sách
// không fade opacity
// =====================================================

let landingPage;
let isLandingDragging = false;
let landingStartX = 0;
let landingCurrentX = 0;
let landingPassed = false;

// số lớn hơn = phải kéo xa hơn, chuyển chậm hơn
let landingDragDistance = 1000;

// số lớn hơn = phải kéo xa hơn mới thật sự vào page
let landingTriggerDistance = 420;

window.addEventListener("load", function () {
  landingPage = document.getElementById("landing-page");

  if (!landingPage) {
    return;
  }

  landingPage.style.opacity = "1";

  landingPage.addEventListener("mousedown", startLandingDrag);
  window.addEventListener("mousemove", moveLandingDrag);
  window.addEventListener("mouseup", endLandingDrag);

  landingPage.addEventListener("touchstart", startLandingTouch, {
    passive: false
  });

  window.addEventListener("touchmove", moveLandingTouch, {
    passive: false
  });

  window.addEventListener("touchend", endLandingDrag);
});

function startLandingDrag(event) {
  if (landingPassed) {
    return;
  }

  isLandingDragging = true;
  landingStartX = event.clientX;
  landingCurrentX = event.clientX;

  landingPage.style.transition = "";
  landingPage.style.opacity = "1";
  landingPage.classList.add("dragging");
}

function moveLandingDrag(event) {
  if (!isLandingDragging || landingPassed) {
    return;
  }

  landingCurrentX = event.clientX;
  updateLandingDrag();
}

function startLandingTouch(event) {
  if (landingPassed) {
    return;
  }

  event.preventDefault();

  const touch = event.touches[0];

  if (!touch) {
    return;
  }

  isLandingDragging = true;
  landingStartX = touch.clientX;
  landingCurrentX = touch.clientX;

  landingPage.style.transition = "";
  landingPage.style.opacity = "1";
  landingPage.classList.add("dragging");
}

function moveLandingTouch(event) {
  if (!isLandingDragging || landingPassed) {
    return;
  }

  event.preventDefault();

  const touch = event.touches[0];

  if (!touch) {
    return;
  }

  landingCurrentX = touch.clientX;
  updateLandingDrag();
}

function updateLandingDrag() {
  const dragDistance = Math.max(
    0,
    landingCurrentX - landingStartX
  );

  const progress = Math.min(
    dragDistance / landingDragDistance,
    1
  );

  // chỉ trượt ngang, không fade
  landingPage.style.transform =
    `translateX(${progress * 100}vw)`;

  landingPage.style.opacity = "1";

  if (progress >= 1) {
    enterMainPage();
  }
}

function endLandingDrag() {
  if (!isLandingDragging || landingPassed) {
    return;
  }

  isLandingDragging = false;
  landingPage.classList.remove("dragging");

  const dragDistance = Math.max(
    0,
    landingCurrentX - landingStartX
  );

  if (dragDistance > landingTriggerDistance) {
    enterMainPage();
  } else {
    // chưa kéo đủ xa → trang trượt về lại như trang sách đóng lại
    landingPage.style.transition =
      "transform 1.2s cubic-bezier(.16,.84,.24,1)";

    landingPage.style.transform = "translateX(0)";
    landingPage.style.opacity = "1";

    setTimeout(function () {
      landingPage.style.transition = "";
    }, 1200);
  }
}

function enterMainPage() {
  if (landingPassed) {
    return;
  }

  landingPassed = true;
  isLandingDragging = false;

  // trượt ra ngoài như một trang được kéo sang phải
  landingPage.style.transition =
    "transform 2.4s cubic-bezier(.16,.84,.24,1)";

  landingPage.style.transform = "translateX(100vw)";
  landingPage.style.opacity = "1";

  setTimeout(function () {
    landingPage.style.display = "none";
  }, 2400);
}
const qualities = [
  "peace",
  "love",
  "joy",
  "healing",
  "truth",
  "presence",
  "stillness",
  "the holy spirit",
  "wholeness",
  "forgiveness",
  "new perception",
  "awakening"
];

const userWords = [];


// =====================================================
// 2. COLOR PALETTE
// =====================================================

const palette = [
  "#D49E9C",
  "#C9A7BC",
  "#A4B1C8",
  "#DCC7B6",
  "#D576B5",
  "#C3A9A1",
  "#7F8E78",
  "#8A756B",
  "#E787C8",
  "#B68F78",
  "#C46F73",
  "#B6C267"
];


// =====================================================
// 3. SOUND NOTES
// Silent Night inspired note pattern.
// =====================================================

const wordNotes = {
  "peace": "G5",
  "love": "A5",
  "joy": "G5",
  "healing": "E5",
  "truth": "G5",
  "presence": "A5",
  "stillness": "G5",
  "the holy spirit": "E5",
  "wholeness": "D5",
  "forgiveness": "D5",
  "new perception": "B4",
  "awakening": "C5"
};

const fallbackNotes = [
  "G5",
  "A5",
  "G5",
  "E5",
  "D5",
  "D5",
  "B4",
  "C5"
];


// =====================================================
// 4. CANVAS + STATE
// =====================================================

let canvas;
let ctx;

let effects = [];
let points = [];

let lastSpawnTime = 0;
let lastSpawnX = 0;
let lastSpawnY = 0;

let currentFontSize = 24;

let audioContext = null;


// =====================================================
// 5. SETTINGS YOU CAN MANUALLY CHANGE
// =====================================================

// lớn hơn = chữ hiện thưa hơn
let triggerDelay = 220;

// lớn hơn = phải drag xa hơn mới hiện chữ mới
let minDragDistance = 90;

// số điểm line được lưu
let maxPoints = 10;

// 0.5 = 50% word user, 50% word bank
// 1 = nếu user đã nhập, chỉ dùng word user
let userWordChance = 0.5;

// nhỏ hơn = vệt lưu lâu hơn
// lớn hơn = vệt tan nhanh hơn
let fadeAlpha = 0.0055;


// =====================================================
// 6. SETUP
// =====================================================

window.addEventListener("load", setup);

function setup() {
  canvas = document.createElement("canvas");
  canvas.id = "effect-canvas";
  ctx = canvas.getContext("2d");

  document.body.appendChild(canvas);

  resizeCanvas();

  const input = document.getElementById("god-input");
  const button = document.getElementById("submit-button");

  button.addEventListener("click", submitWord);

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      submitWord();
    }
  });

  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);

  canvas.addEventListener("touchstart", handleTouchStart, {
    passive: false
  });

  canvas.addEventListener("touchmove", handleTouchMove, {
    passive: false
  });

  animate();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}


// =====================================================
// 7. INPUT
// =====================================================

function submitWord() {
  const input = document.getElementById("god-input");
  const value = input.value.trim().toLowerCase();

  if (value === "") {
    return;
  }

  userWords.push(value);
  input.value = "";
}


// =====================================================
// 8. MOUSE + TOUCH INTERACTION
// =====================================================

function handleMouseDown(event) {
  if (isClickingInputPanel(event.clientY)) {
    return;
  }

  startAudio();

  currentFontSize = 24;

  spawn(event.clientX, event.clientY);

  lastSpawnTime = performance.now();
  lastSpawnX = event.clientX;
  lastSpawnY = event.clientY;
}

function handleMouseMove(event) {
  if (event.buttons !== 1) {
    return;
  }

  if (isClickingInputPanel(event.clientY)) {
    return;
  }

  handleDrag(
    event.clientX,
    event.clientY,
    event.movementX,
    event.movementY
  );
}

function handleTouchStart(event) {
  event.preventDefault();

  const touch = event.touches[0];

  if (!touch) {
    return;
  }

  if (isClickingInputPanel(touch.clientY)) {
    return;
  }

  startAudio();

  currentFontSize = 24;

  spawn(touch.clientX, touch.clientY);

  lastSpawnTime = performance.now();
  lastSpawnX = touch.clientX;
  lastSpawnY = touch.clientY;
}

function handleTouchMove(event) {
  event.preventDefault();

  const touch = event.touches[0];

  if (!touch) {
    return;
  }

  if (isClickingInputPanel(touch.clientY)) {
    return;
  }

  const dx = touch.clientX - lastSpawnX;
  const dy = touch.clientY - lastSpawnY;

  handleDrag(touch.clientX, touch.clientY, dx, dy);
}

function handleDrag(x, y, dx, dy) {
  const now = performance.now();

  const distance = getDistance(x, y, lastSpawnX, lastSpawnY);
  const speed = Math.sqrt(dx * dx + dy * dy);

  // drag nhẹ = chữ nhỏ
  // drag mạnh = chữ lớn hơn
  currentFontSize = mapValue(
    speed,
    0,
    22,
    22,
    30,
    true
  );

  if (now - lastSpawnTime > triggerDelay && distance > minDragDistance) {
    spawn(x, y);

    lastSpawnTime = now;
    lastSpawnX = x;
    lastSpawnY = y;
  }
}

function isClickingInputPanel(y) {
  return y < 190;
}


// =====================================================
// 9. SPAWN EFFECT
// =====================================================

function spawn(x, y) {
  const circleColor = randomFromArray(palette);

  let word;

  if (userWords.length > 0 && Math.random() < userWordChance) {
    word = randomFromArray(userWords);
  } else {
    word = randomFromArray(qualities);
  }

  playWordSound(word);

  effects.push(new BlurCircle(x, y, circleColor));
  effects.push(new GodWord(x, y, word, currentFontSize));

  points.push({
    x: x,
    y: y,
    color: circleColor,
    alpha: 150
  });

  if (points.length > maxPoints) {
    points.shift();
  }
}


// =====================================================
// 10. SOUND — WEB AUDIO API
// No external library.
// =====================================================

function startAudio() {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playWordSound(word) {
  if (!audioContext) {
    return;
  }

  const note = wordNotes[word] || getNoteFromUserWord(word);
  const frequency = noteToFrequency(note);

  const now = audioContext.currentTime;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);

  // lowpass filter làm âm mềm hơn
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);

  const volume = mapValue(
    currentFontSize,
    22,
    30,
    0.04,
    0.12,
    true
  );

  const duration = mapValue(
    currentFontSize,
    22,
    30,
    0.8,
    1.8,
    true
  );

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.1);
}

function getNoteFromUserWord(word) {
  let total = 0;

  for (let i = 0; i < word.length; i++) {
    total += word.charCodeAt(i);
  }

  return fallbackNotes[total % fallbackNotes.length];
}

function noteToFrequency(note) {
  const noteMap = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11
  };

  const match = note.match(/^([A-G]#?)(\d)$/);

  if (!match) {
    return 440;
  }

  const noteName = match[1];
  const octave = Number(match[2]);

  const midi = (octave + 1) * 12 + noteMap[noteName];

  return 440 * Math.pow(2, (midi - 69) / 12);
}


// =====================================================
// 11. ANIMATION LOOP
// =====================================================

function animate() {
  fadeCanvas();

  drawConnections();

  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].update();
    effects[i].draw(ctx);

    if (effects[i].isDead()) {
      effects.splice(i, 1);
    }
  }

  drawInstruction();

  requestAnimationFrame(animate);
}

function fadeCanvas() {
  // destination-out làm effect mờ dần
  // background CSS không bị ảnh hưởng
  ctx.save();

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();

  ctx.globalCompositeOperation = "source-over";
}

function drawInstruction() {
  ctx.save();

  ctx.fillStyle = "rgba(138,127,124,0.7)";
  ctx.font = "14px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "drag to reveal",
    canvas.width / 2,
    canvas.height - 40
  );

  ctx.restore();
}


// =====================================================
// 12. CONNECTION LINE
// =====================================================

function drawConnections() {
  if (points.length < 2) {
    return;
  }

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];

    ctx.save();

    ctx.strokeStyle = hexToRGBA(p2.color, p2.alpha / 255);
    ctx.lineWidth = 0.2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p2.color;

    ctx.beginPath();

    for (let t = 0; t <= 1; t += 0.1) {
      let x = lerp(p1.x, p2.x, t);
      let y = lerp(p1.y, p2.y, t);

      x += random(-2, 2);
      y += random(-2, 2);

      if (t === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    ctx.restore();

    p1.alpha -= 0.4;
  }

  points[points.length - 1].alpha -= 0.7;

  points = points.filter(function (point) {
    return point.alpha > 0;
  });
}


// =====================================================
// 13. CLASSES
// =====================================================

class BlurCircle {
  constructor(x, y, colorValue) {
    this.x = x;
    this.y = y;
    this.colorValue = colorValue;

    this.radius = 14;
    this.alpha = 100;
  }

  update() {
    this.radius += 1;
    this.alpha -= 2;
  }

  draw(ctx) {
    ctx.save();

    ctx.shadowBlur = 90;
    ctx.shadowColor = this.colorValue;

    ctx.strokeStyle = hexToRGBA(
      this.colorValue,
      this.alpha / 255
    );

    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      this.radius,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.strokeStyle = hexToRGBA(
      this.colorValue,
      (this.alpha * 0.22) / 255
    );

    ctx.lineWidth = 14;

    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      this.radius + 18,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.restore();
  }

  isDead() {
    return this.alpha <= 12;
  }
}

class GodWord {
  constructor(x, y, word, fontSize) {
    this.x = x;
    this.y = y;
    this.word = word;

    this.size = fontSize;
    this.alpha = 255;
    this.angle = random(-0.08, 0.08);
  }

  update() {
    this.y -= 0.1;
    this.alpha -= 1.7;
  }

  draw(ctx) {
    ctx.save();

    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = `rgba(45,30,20,${this.alpha / 255})`;
    ctx.shadowBlur = 1;
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.font = `${this.size}px Georgia`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(this.word, 0, 0);

    ctx.restore();
  }

  isDead() {
    return this.alpha <= 0;
  }
}


// =====================================================
// 14. HELPERS
// =====================================================

function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getDistance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;

  return Math.sqrt(dx * dx + dy * dy);
}

function mapValue(
  value,
  inMin,
  inMax,
  outMin,
  outMax,
  shouldClamp
) {
  let mapped =
    ((value - inMin) * (outMax - outMin)) /
      (inMax - inMin) +
    outMin;

  if (shouldClamp) {
    mapped = Math.max(
      outMin,
      Math.min(outMax, mapped)
    );
  }

  return mapped;
}

function hexToRGBA(hex, alpha) {
  const cleanHex = hex.replace("#", "");

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

// =====================================================
// ADD-ON: ERASE SLIDER
// Paste nguyên block này xuống cuối script.js
// Không cần sửa các effect cũ.
// =====================================================

let eraseProgress = 0;

window.addEventListener("load", function () {
  const eraseSlider = document.getElementById("erase-slider");

  if (!eraseSlider) {
    console.warn("Không tìm thấy #erase-slider trong HTML.");
    return;
  }

  eraseSlider.addEventListener("input", function () {
    eraseProgress = Number(eraseSlider.value) / 100;

    const eraseX = canvas.width * eraseProgress;

    // xoá object nằm trong vùng đã bị wipe
    effects = effects.filter(function (effect) {
      return effect.x > eraseX;
    });

    points = points.filter(function (point) {
      return point.x > eraseX;
    });

    wipeCanvasFromLeft();
  });

  eraseSlider.addEventListener("change", function () {
    if (eraseProgress >= 1) {
      effects = [];
      points = [];

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      eraseProgress = 0;
      eraseSlider.value = 0;
    }
  });

  function wipeCanvasFromLeft() {
  if (!canvas || !ctx) {
    return;
  }

  const eraseX = canvas.width * eraseProgress;

  // độ mềm của mép xoá
  // tăng số này = mép xoá mềm hơn
  const softEdge = 140;

  ctx.save();

  ctx.globalCompositeOperation = "destination-out";

  // 1. xoá sạch vùng bên trái
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(
    0,
    0,
    Math.max(0, eraseX - softEdge),
    canvas.height
  );

  // 2. xoá mềm vùng rìa
  const gradient = ctx.createLinearGradient(
    eraseX - softEdge,
    0,
    eraseX,
    0
  );

  gradient.addColorStop(0, "rgba(0,0,0,1)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(
    eraseX - softEdge,
    0,
    softEdge,
    canvas.height
  );

  ctx.restore();

  ctx.globalCompositeOperation = "source-over";
}});