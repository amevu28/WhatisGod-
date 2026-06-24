// =====================================================
// DEAR GOD — SCRIPT DOCUMENTATION
// =====================================================
//
// My main interaction reference for this project was Patatap,
// an interactive animation and sound kit where a user action creates
// both a visual response and a sound. I was interested in how Patatap
// makes interaction feel immediate and sensory, but I changed the main
// action from pressing/tapping into dragging because I wanted Dear God
// to feel slower, more reflective, and more connected to the idea of
// revealing a personal interpretation.
//
// In this script, the main things I learned are how to use the Canvas API
// to draw temporary visual marks, how to store drawn objects as data so
// they can be moved again, how to use mouse and touch events for drag
// interaction, and how to use the Web Audio API to generate small notes.
// The main references I used were:
// - Patatap: https://patatap.com/
// - MDN Canvas API / fillText(): https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
// - MDN Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
// - MDN Touch Events: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events


// =====================================================
// LANDING PAGE DRAG TRANSITION
// =====================================================
//
// I learned that a page transition can be built by storing the first
// pointer position, comparing it with the current pointer position, and
// translating the whole landing section with CSS transform. This is the
// first interaction in the project, so I wanted it to work like opening
// a page rather than pressing a normal web button. The variables below
// store whether the landing page is being dragged, where the drag starts,
// where the pointer currently is, and whether the page has already been
// entered.

let landingPage;
let isLandingDragging = false;
let landingStartX = 0;
let landingCurrentX = 0;
let landingPassed = false;

let landingDragDistance = 1000;
let landingTriggerDistance = 420;

window.addEventListener("load", function () {
  landingPage = document.getElementById("landing-page");

  if (!landingPage) return;

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
  if (landingPassed) return;

  isLandingDragging = true;
  landingStartX = event.clientX;
  landingCurrentX = event.clientX;

  landingPage.style.transition = "";
  landingPage.style.opacity = "1";
  landingPage.classList.add("dragging");
}

function moveLandingDrag(event) {
  if (!isLandingDragging || landingPassed) return;

  landingCurrentX = event.clientX;
  updateLandingDrag();
}

function startLandingTouch(event) {
  if (landingPassed) return;

  event.preventDefault();

  const touch = event.touches[0];
  if (!touch) return;

  isLandingDragging = true;
  landingStartX = touch.clientX;
  landingCurrentX = touch.clientX;

  landingPage.style.transition = "";
  landingPage.style.opacity = "1";
  landingPage.classList.add("dragging");
}

function moveLandingTouch(event) {
  if (!isLandingDragging || landingPassed) return;

  event.preventDefault();

  const touch = event.touches[0];
  if (!touch) return;

  landingCurrentX = touch.clientX;
  updateLandingDrag();
}

function updateLandingDrag() {
  const dragDistance = Math.max(0, landingCurrentX - landingStartX);

  const progress = Math.min(
    dragDistance / landingDragDistance,
    1
  );

  landingPage.style.transform = `translateX(${progress * 100}vw)`;
  landingPage.style.opacity = "1";

  if (progress >= 1) {
    enterMainPage();
  }
}

function endLandingDrag() {
  if (!isLandingDragging || landingPassed) return;

  isLandingDragging = false;
  landingPage.classList.remove("dragging");

  const dragDistance = Math.max(0, landingCurrentX - landingStartX);

  if (dragDistance > landingTriggerDistance) {
    enterMainPage();
  } else {
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
  if (landingPassed) return;

  landingPassed = true;
  isLandingDragging = false;

  landingPage.style.transition =
    "transform 2.4s cubic-bezier(.16,.84,.24,1)";

  landingPage.style.transform = "translateX(100vw)";
  landingPage.style.opacity = "1";

  setTimeout(function () {
    landingPage.style.display = "none";
  }, 2400);
}


// =====================================================
// HOVER INK TRAIL
// =====================================================
//
// I learned that a second canvas can be used as a separate visual layer.
// This part creates a temporary ink trail that follows the cursor. It is
// not the main word-spawning canvas; it is a light atmospheric layer for
// the landing page. Each mark is stored with a short life value, then
// redrawn and faded inside animateInk(). This supports the design because
// the project begins with the feeling of soft traces before the user
// enters the main word canvas.

let inkCanvas;
let inkCtx;
let inkMarks = [];

let lastInkX = null;
let lastInkY = null;

let inkColor = "#acbf4eff";
let inkLineWidth = 3;
let inkLife = 18;
let inkMinDistance = 6;
let inkJitter = 1.6;

window.addEventListener("load", function () {
  createInkCanvas();

  window.addEventListener("resize", resizeInkCanvas);
  window.addEventListener("mousemove", handleInkMove);

  animateInk();
});

function createInkCanvas() {
  inkCanvas = document.createElement("canvas");
  inkCanvas.id = "ink-canvas";

  inkCtx = inkCanvas.getContext("2d");

  document.body.appendChild(inkCanvas);

  inkCanvas.style.position = "fixed";
  inkCanvas.style.top = "0";
  inkCanvas.style.left = "0";
  inkCanvas.style.width = "100vw";
  inkCanvas.style.height = "100vh";
  inkCanvas.style.zIndex = "1201";
  inkCanvas.style.pointerEvents = "none";

  resizeInkCanvas();
}

function resizeInkCanvas() {
  if (!inkCanvas) return;

  inkCanvas.width = window.innerWidth;
  inkCanvas.height = window.innerHeight;
}

function handleInkMove(event) {
  const x = event.clientX;
  const y = event.clientY;

  if (lastInkX === null || lastInkY === null) {
    lastInkX = x;
    lastInkY = y;
    return;
  }

  const d = getDistance(x, y, lastInkX, lastInkY);

  if (d < inkMinDistance) return;

  inkMarks.push({
    x1: lastInkX + random(-inkJitter, inkJitter),
    y1: lastInkY + random(-inkJitter, inkJitter),
    x2: x + random(-inkJitter, inkJitter),
    y2: y + random(-inkJitter, inkJitter),
    life: inkLife
  });

  lastInkX = x;
  lastInkY = y;
}

function animateInk() {
  if (!inkCtx || !inkCanvas) {
    requestAnimationFrame(animateInk);
    return;
  }

  inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);

  for (let i = inkMarks.length - 1; i >= 0; i--) {
    const mark = inkMarks[i];
    const alpha = mark.life / inkLife;

    inkCtx.save();

    inkCtx.strokeStyle = hexToRGBA(inkColor, alpha * 0.65);
    inkCtx.lineWidth = inkLineWidth;
    inkCtx.lineCap = "round";
    inkCtx.lineJoin = "round";

    inkCtx.beginPath();
    inkCtx.moveTo(mark.x1, mark.y1);

    const midX = (mark.x1 + mark.x2) / 2 + random(-2, 2);
    const midY = (mark.y1 + mark.y2) / 2 + random(-2, 2);

    inkCtx.quadraticCurveTo(
      midX,
      midY,
      mark.x2,
      mark.y2
    );

    inkCtx.stroke();

    inkCtx.restore();

    mark.life -= 1;

    if (mark.life <= 0) {
      inkMarks.splice(i, 1);
    }
  }

  requestAnimationFrame(animateInk);
}


// =====================================================
// WORD BANK
// =====================================================
//
// This is my original interpretation of Dear God. I used words connected
// to my own faith, such as peace, love, forgiveness, truth, and the Holy
// Spirit. I also keep a separate userWords array because the project is
// not only about my definition. As the user submits their own words, the
// system can begin choosing from their vocabulary too, allowing my version
// of Dear God to slowly make space for theirs.

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

const palette = [
  "#D49E9C",
  "#C9A7BC",
  "#A4B1C8",
  "#9fb454ff",
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
// SOUND NOTES
// =====================================================
//
// I learned this idea from Patatap, where each user action produces both
// a visual response and a sound. In my project, I adapted that logic by
// mapping each default word to a specific note, while user-submitted words
// use fallbackNotes through a simple text-to-note function. I intentionally
// selected notes that sit within the same harmonic space as the background
// music, so when users interact while the music is turned on, the generated
// sounds can blend together and feel harmonious rather than competing for
// attention.

const wordNotes = {
  "peace": "D5",
  "love": "F5",
  "joy": "A5",
  "healing": "G5",
  "truth": "C5",
  "presence": "Bb5",
  "stillness": "E5",
  "the holy spirit": "D6",
  "wholeness": "A4",
  "forgiveness": "F4",
  "new perception": "C6",
  "awakening": "G4"
};

const fallbackNotes = [
  "D5",
  "F5",
  "G5",
  "A5",
  "Bb5",
  "E5",
  "C6",
  "A4",
  "F4",
  "G4"
];


// =====================================================
// CANVAS + STATE
// =====================================================
//
// I learned that canvas drawings are not automatically interactive like
// HTML elements. Once text is drawn with fillText(), it becomes pixels.
// To make old words draggable again, I needed to store each generated word
// as a node object inside arrays. effects controls temporary animations,
// points controls connection lines, and visualNodes stores faded objects
// so they can still be clicked and moved.g

let canvas;
let ctx;

let effects = [];

let points = [];
let visualNodes = [];

let draggedVisualNode = null;
let nodeDragOffsetX = 0;
let nodeDragOffsetY = 0;

let lastSpawnTime = 0;
let lastSpawnX = 0;
let lastSpawnY = 0;

let currentFontSize = 24;

let audioContext = null;


// =====================================================
// SETTINGS
// =====================================================
//
// These settings are the main tuning points for the interaction. I kept
// them together because I learned that interactive work often needs many
// small adjustments rather than one fixed value. triggerDelay and
// minDragDistance control how often words spawn during dragging, fadeAlpha
// controls how slowly the canvas disappears, and nodeHitRadius controls
// how easy it is to click a faded word again.

let triggerDelay = 220;
let minDragDistance = 90;
let maxPoints = 10;
let userWordChance = 0.5;
let fadeAlpha = 0.0055;

let nodeHitRadius = 72;
let maxVisualNodes = 42;


// =====================================================
// SETUP
// =====================================================
//
// I learned that setup code should create the canvas, connect HTML buttons
// to JavaScript, prepare mouse/touch interaction, and then start the
// animation loop. This part is the technical foundation of the project.
// It connects the designed interface in HTML with the generative canvas
// system in JavaScript.

window.addEventListener("load", setup);

function setup() {
  canvas = document.createElement("canvas");
  canvas.id = "effect-canvas";
  ctx = canvas.getContext("2d");

  document.body.appendChild(canvas);

  resizeCanvas();

  const input = document.getElementById("god-input");
  const button = document.getElementById("submit-button");

  if (button) {
    button.addEventListener("click", submitWord);
  }

  if (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        submitWord();
      }
    });
  }

  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", stopDraggingNode);

  canvas.addEventListener("touchstart", handleTouchStart, {
    passive: false
  });

  canvas.addEventListener("touchmove", handleTouchMove, {
    passive: false
  });

  window.addEventListener("touchend", stopDraggingNode);

  animate();
}

function resizeCanvas() {
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}


// =====================================================
// INPUT
// =====================================================
//
// I learned how to take text from an HTML input, clean it with trim(),
// convert it to lowercase, and store it in an array. This is where the
// audience's own Dear God begins to enter the system. Their words do not
// replace my word bank immediately, but they become part of the pool that
// can appear on the canvas.

function submitWord() {
  const input = document.getElementById("god-input");

  if (!input) return;

  const value = input.value.trim().toLowerCase();

  if (value === "") return;

  userWords.push(value);
  input.value = "";
}


// =====================================================
// MOUSE + TOUCH INTERACTION
// =====================================================
//
// I learned that mouse and touch interaction need similar logic but use
// different event properties. Mouse uses clientX/clientY directly, while
// touch uses touches[0]. This part decides whether the user is dragging an
// existing node or creating new words. This matters for the design because
// the canvas should not only generate meaning; it should let the user
// return to old words and rearrange them.

function handleMouseDown(event) {
  if (isClickingInputPanel(event.clientY)) return;

  const node = findVisualNodeAt(event.clientX, event.clientY);

  if (node) {
    removeActiveGodWordForNode(node);

    draggedVisualNode = node;

    nodeDragOffsetX = node.x - event.clientX;
    nodeDragOffsetY = node.y - event.clientY;

    brightenNodeLinks(node);

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
  if (draggedVisualNode) {
    draggedVisualNode.x = event.clientX + nodeDragOffsetX;
    draggedVisualNode.y = event.clientY + nodeDragOffsetY;

    brightenNodeLinks(draggedVisualNode);

    return;
  }

  if (event.buttons !== 1) return;

  if (isClickingInputPanel(event.clientY)) return;

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

  if (!touch) return;
  if (isClickingInputPanel(touch.clientY)) return;

  const node = findVisualNodeAt(touch.clientX, touch.clientY);

  if (node) {
    removeActiveGodWordForNode(node);

    draggedVisualNode = node;

    nodeDragOffsetX = node.x - touch.clientX;
    nodeDragOffsetY = node.y - touch.clientY;

    brightenNodeLinks(node);

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

  if (!touch) return;

  if (draggedVisualNode) {
    draggedVisualNode.x = touch.clientX + nodeDragOffsetX;
    draggedVisualNode.y = touch.clientY + nodeDragOffsetY;

    brightenNodeLinks(draggedVisualNode);

    return;
  }

  if (isClickingInputPanel(touch.clientY)) return;

  const dx = touch.clientX - lastSpawnX;
  const dy = touch.clientY - lastSpawnY;

  handleDrag(touch.clientX, touch.clientY, dx, dy);
}

function stopDraggingNode() {
  if (draggedVisualNode) {
    effects.push(new BlurCircle(draggedVisualNode));
    effects.push(new GodWord(draggedVisualNode));
  }

  draggedVisualNode = null;
}

function handleDrag(x, y, dx, dy) {
  const now = performance.now();

  const distance = getDistance(x, y, lastSpawnX, lastSpawnY);
  const speed = Math.sqrt(dx * dx + dy * dy);

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
// NODE HIT TEST
// =====================================================
//
// I learned that because canvas objects are just pixels, I need my own hit
// test to detect whether the pointer is close enough to a stored node.
// findVisualNodeAt() measures the distance between the pointer and each
// saved word. This is the part that makes faded words draggable again,
// which supports my intention of letting meanings be rearranged after
// they appear.

function findVisualNodeAt(x, y) {
  for (let i = visualNodes.length - 1; i >= 0; i--) {
    const node = visualNodes[i];

    const d = getDistance(x, y, node.x, node.y);

    if (d <= nodeHitRadius) {
      return node;
    }
  }

  return null;
}

function removeActiveGodWordForNode(node) {
  effects = effects.filter(function (effect) {
    return !(
      effect instanceof GodWord &&
      effect.node === node
    );
  });
}

function brightenNodeLinks(node) {
  node.lineAlpha = 150;

  const index = points.indexOf(node);

  if (index > 0) {
    points[index - 1].lineAlpha = 150;
  }

  if (index < points.length - 1) {
    points[index + 1].lineAlpha = 150;
  }
}


// =====================================================
// SPAWN EFFECT
// =====================================================
//
// This is the main interaction of the work. I learned that one function
// can create a complete event: choose a word, choose a colour, play a
// sound, store the word as a node, draw a blur circle, draw the word, and
// add it to the connection map. This is the part most directly inspired
// by Patatap's relationship between action, sound, and visual feedback,
// but here it becomes slower and more personal through dragging.

function spawn(x, y) {
  const circleColor = randomFromArray(palette);

  let word;

  if (userWords.length > 0 && Math.random() < userWordChance) {
    word = randomFromArray(userWords);
  } else {
    word = randomFromArray(qualities);
  }

  playWordSound(word);

  const node = {
    x: x,
    y: y,
    word: word,
    color: circleColor,
    fontSize: currentFontSize,
    angle: random(-0.08, 0.08),
    lineAlpha: 150
  };

  visualNodes.push(node);

  if (visualNodes.length > maxVisualNodes) {
    const removedNode = visualNodes.shift();

    points = points.filter(function (point) {
      return point !== removedNode;
    });
  }

  effects.push(new BlurCircle(node));
  effects.push(new GodWord(node));

  points.push(node);

  if (points.length > maxPoints) {
    points.shift();
  }
}


// =====================================================
// SOUND
// =====================================================
//
// I learned from the Web Audio API that sound can be generated in the
// browser through an AudioContext. In this section, OscillatorNode creates
// a sine tone, GainNode controls the volume envelope, and BiquadFilterNode
// softens the sound. This relates to the design because each word should
// feel like a small sonic trace rather than a loud interface effect.

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
  if (!audioContext) return;

  const note = wordNotes[word] || getNoteFromUserWord(word);
  const frequency = noteToFrequency(note);

  const now = audioContext.currentTime;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, now);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, now);

  const volume = mapValue(
    currentFontSize,
    22,
    30,
    0.018,
    0.042,
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

  const match = note.match(/^([A-G]#?)(b?)(\d)$/);

  if (!match) return 440;

  let noteName = match[1];
  const flat = match[2];
  const octave = Number(match[3]);

  if (flat === "b") {
    const flatMap = {
      Db: "C#",
      Eb: "D#",
      Gb: "F#",
      Ab: "G#",
      Bb: "A#"
    };

    noteName = flatMap[noteName + "b"] || noteName;
  }

  const midi = (octave + 1) * 12 + noteMap[noteName];

  return 440 * Math.pow(2, (midi - 69) / 12);
}


// =====================================================
// ANIMATION LOOP
// =====================================================
//
// requestAnimationFrame() is the main way to create a
// continuous animation loop in the browser. In this project, animate()
// fades the canvas, redraws the connection lines, updates active effects,
// and keeps checking whether each effect is finished. This is important
// because Dear God should not feel static; the words should appear, drift,
// connect, and slowly disappear.

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

  drawDraggedNodeOnly();

  drawInstruction();

  requestAnimationFrame(animate);
}

function fadeCanvas() {
  ctx.save();

  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.restore();

  ctx.globalCompositeOperation = "source-over";
}

function drawInstruction() {
  return;
}


// =====================================================
// CONNECTION LINE
// =====================================================
//
// I learned that a line can connect stored points rather than fixed DOM
// elements. The code loops through the points array and draws a slightly
// irregular line between each pair. This supports the concept of a
// connected map: each word is separate, but the lines make them feel like
// parts of one personal interpretation.

function drawConnections() {
  if (points.length < 2) return;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];

    if (!p1 || !p2) continue;

    ctx.save();

    ctx.strokeStyle = hexToRGBA(
      p2.color,
      p2.lineAlpha / 255
    );

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

    p1.lineAlpha -= 0.4;
  }

  const lastPoint = points[points.length - 1];

  if (lastPoint) {
    lastPoint.lineAlpha -= 0.7;
  }
}


// =====================================================
// DRAW ONLY WHEN DRAGGING
// =====================================================
//
// I learned that dragging a canvas object can accidentally leave repeated
// text marks because canvas keeps redrawing pixels. This function draws a
// very light version of the dragged word only while it is being moved. It
// is intentionally different from the normal GodWord effect, so the user
// can see what they are holding without creating a dark, heavy trail.

function drawDraggedNodeOnly() {
  if (!draggedVisualNode) return;

  const node = draggedVisualNode;

  ctx.save();

  ctx.translate(node.x, node.y);
  ctx.rotate(node.angle);

  ctx.fillStyle = "hsla(72, 100%, 69%, 0.85)";
  ctx.font = `${node.fontSize}px Georgia`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.2;

  ctx.fillText(node.word, 0, 0);

  ctx.restore();
}


// =====================================================
// CLASSES
// =====================================================
//
// I learned to use small classes for repeated effects. Instead of writing
// the drawing logic directly inside spawn(), each effect has its own
// update(), draw(), and isDead() methods. This structure makes the code
// easier to control because the circle and the word fade independently.

class BlurCircle {
  constructor(node) {
    this.node = node;

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
    ctx.shadowColor = this.node.color;

    ctx.strokeStyle = hexToRGBA(
      this.node.color,
      this.alpha / 255
    );

    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(
      this.node.x,
      this.node.y,
      this.radius,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.strokeStyle = hexToRGBA(
      this.node.color,
      (this.alpha * 0.22) / 255
    );

    ctx.lineWidth = 14;

    ctx.beginPath();

    ctx.arc(
      this.node.x,
      this.node.y,
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
  constructor(node) {
    this.node = node;

    this.alpha = 255;
    this.offsetY = 0;
  }

  update() {
    this.offsetY -= 0.1;
    this.alpha -= 2.7;
  }

  draw(ctx) {
    ctx.save();

    ctx.translate(
      this.node.x,
      this.node.y + this.offsetY
    );

    ctx.rotate(this.node.angle);

    ctx.fillStyle =
      `rgba(45,30,20,${this.alpha / 255})`;

    ctx.shadowBlur = 1;
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.font = `${this.node.fontSize}px Georgia`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(this.node.word, 0, 0);

    ctx.restore();
  }

  isDead() {
    return this.alpha <= 0;
  }
}


// =====================================================
// ERASE SLIDER
// =====================================================
//
// I learned that a range input can control more than a visual slider. Here
// the slider value becomes an erase progress value from 0 to 1. The code
// removes effects and saved nodes on the left side, then wipes the canvas
// with a soft edge. This connects to the design because erasing is not
// just clearing the screen; it becomes a way to release and make space.

let eraseProgress = 0;

window.addEventListener("load", function () {
  const eraseSlider = document.getElementById("erase-slider");

  if (!eraseSlider) return;

  eraseSlider.addEventListener("input", function () {
    eraseProgress = Number(eraseSlider.value) / 100;

    const eraseX = canvas.width * eraseProgress;

    effects = effects.filter(function (effect) {
      if (!effect.node) return true;
      return effect.node.x > eraseX;
    });

    visualNodes = visualNodes.filter(function (node) {
      return node.x > eraseX;
    });

    points = points.filter(function (node) {
      return node.x > eraseX;
    });

    wipeCanvasFromLeft();
  });

  eraseSlider.addEventListener("change", function () {
    if (eraseProgress >= 1) {
      effects = [];
      points = [];
      visualNodes = [];

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      eraseProgress = 0;
      eraseSlider.value = 0;
    }
  });
});

function wipeCanvasFromLeft() {
  if (!canvas || !ctx) return;

  const eraseX = canvas.width * eraseProgress;
  const softEdge = 140;

  ctx.save();

  ctx.globalCompositeOperation = "destination-out";

  ctx.fillStyle = "rgba(172, 223, 53, 1)";

  ctx.fillRect(
    0,
    0,
    Math.max(0, eraseX - softEdge),
    canvas.height
  );

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
}


// =====================================================
// LANDING BUTTONS
// =====================================================
//
// I learned to keep interface controls separate from the canvas drawing.
// This section connects the designed sound, information, and instruction
// buttons to JavaScript. The background music starts off, because I want
// the user to choose whether sound enters the space. The panels also keep
// explanation optional instead of forcing the user to read everything first.

window.addEventListener("load", function () {
  const soundToggle = document.getElementById("sound-toggle");
  const soundImage = document.getElementById("sound-toggle-image");

  const infoButton = document.getElementById("info-button");
  const infoPanel = document.getElementById("info-panel");
  const closeInfo = document.getElementById("close-info");

  const bgMusic = document.getElementById("bg-music");

  let musicPlaying = false;

  if (soundToggle && soundImage && bgMusic) {
    bgMusic.pause();
    bgMusic.volume = 0.06;

    soundImage.src = "assets/sound-off-btn.png";
    soundImage.alt = "sound off";

    soundToggle.addEventListener("click", function () {
      if (!musicPlaying) {
        bgMusic.play();

        musicPlaying = true;

        soundImage.src = "assets/sound-on-btn.png";
        soundImage.alt = "sound on";
      } else {
        bgMusic.pause();
        bgMusic.currentTime = 0;

        musicPlaying = false;

        soundImage.src = "assets/sound-off-btn.png";
        soundImage.alt = "sound off";
      }
    });
  }

  if (infoButton && infoPanel) {
    infoButton.addEventListener("click", function () {
      infoPanel.classList.add("show");
    });
  }

  if (closeInfo && infoPanel) {
    closeInfo.addEventListener("click", function () {
      infoPanel.classList.remove("show");
    });
  }
});


// =====================================================
// INSTRUCTION PANEL
// =====================================================
//
// This part uses the same open/close logic as the information panel. I
// separated it because the information panel explains the concept, while
// the instruction panel explains how to interact. This keeps the interface
// clearer and gives the audience control over how much guidance they need.

const instructionButton =
  document.getElementById("instruction-button");

const instructionPanel =
  document.getElementById("instruction-panel");

const closeInstruction =
  document.getElementById("close-instruction");


if (instructionButton && instructionPanel) {
  instructionButton.addEventListener("click", function () {
    instructionPanel.classList.add("show");
  });
}


if (closeInstruction && instructionPanel) {
  closeInstruction.addEventListener("click", function () {
    instructionPanel.classList.remove("show");
  });
}


// =====================================================
// HELPERS
// =====================================================
//
// These helper functions keep repeated calculations outside the main
// interaction code. I learned that this makes the project easier to tune:
// randomFromArray chooses words and colours, getDistance supports drag and
// hit detection, mapValue converts speed into font size and sound volume,
// and hexToRGBA lets colour values fade smoothly.

function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function random(min, max) {
  if (max === undefined) {
    return Math.random() * min;
  }

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
  const cleanHex = hex.replace("#", "").substring(0, 6);

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}