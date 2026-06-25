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
// This part creates a temporary ink trail that follows the cursor. Each mark is stored
//  with a short life value, then redrawn and faded inside animateInk().
//
// I developed this effect after researching interaction patterns commonly
// used in drawing and generative web experiences, where movement itself is
// treated as an invitation to start dragging and creating.

//// The hover trail works as a continuous loop: mousemove first records
// the cursor movement inside handleInkMove(), then stores each segment
// as data inside inkMarks[]. animateInk() continuously redraws those
// stored marks using requestAnimationFrame(), while reducing mark.life
// every frame to lower opacity over time. Once life reaches 0, the mark
// is removed using splice(). I used quadraticCurveTo() instead of a
// straight line and added small random offsets through inkJitter to make
// the trace feel softer and more organic.

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
// This is my original interpretation of Dear God such as peace, love, forgiveness,
//  truth, and the Holy  Spirit. I also keep a separate userWords array because the
//  project is not only about my definition. As the user submits their own words, the
// system can begin choosing from their vocabulary too, allowing my version
// of Dear God to slowly make space for theirs.

// Technically, I learned that storing content inside arrays allows the
// system to randomly select and generate different outcomes without
// manually assigning each interaction. qualities acts as the initial word
// pool, userWords stores audience contributions, and palette controls the
// visual variation of generated nodes. This part was influenced by
// generative interaction design and variable-based systems I observed in
// Patatap and learned to implement through JavaScript arrays and random
// selection:
//
// Patatap
// https://patatap.com/
//
// MDN JavaScript Arrays
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
//
// MDN Math.random()
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random

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
// I also learned this idea from Patatap, where each user action produces both
// a visual response and a sound. In my project, I adapted that logic by
// mapping each default word to a specific note, while user-submitted words
// use fallbackNotes through a simple text-to-note function. I intentionally
// selected notes that sit within the same harmonic space as the background
// music, so when users interact while the music is turned on, the generated
// sounds can blend together and feel harmonious rather than competing for
// attention.
//
// To build this system, I learned how sound can be generated from data
// instead of being manually attached to each interaction. In this code,
// wordNotes stores predefined note mappings for my original word set,
// while fallbackNotes allows user-generated words to still produce sound
// through getNoteFromUserWord(), which converts text into a note choice.
// Later in playWordSound(), noteToFrequency() transforms that musical note
// into an actual frequency that can be played through the browser. I
// researched how browser-generated sound works through the Web Audio API
// and looked at interaction references that combine visual and audio
// feedback:
//
// MDN Web Audio API
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
//
// MDN OscillatorNode
// https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode

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
// This section controls how the user physically enters the canvas through
// mouse and touch movement. I learned that mouse and touch use similar
// logic, but their event data is accessed differently: mouse interaction
// uses clientX/clientY directly, while touch interaction needs touches[0].
// This section decides whether the user is creating a new word or picking
// up an existing faded word and moving it again.
//
// In the design, this matters because I did not want the canvas to behave
// like a fixed drawing. When users drag on an empty area, spawn() creates
// a new visual and sonic mark. When users drag an existing node, the word
// becomes movable again. This makes the map feel editable and alive, as if
// the meaning of Dear God can still be rearranged after it appears.

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
// I learned that canvas drawings are not automatically interactive after
// they are drawn. They become pixels, so the code needs its own method to
// check whether the pointer is close enough to a saved node. In this part,
// findVisualNodeAt() loops through visualNodes[] and uses getDistance() to
// compare the pointer position with each word's stored x/y position.
//
// This is related to the design because I wanted faded words to remain
// touchable. The user can return to a word, pick it up, and rearrange it.
// That makes the canvas feel more like a living map than a one-time visual
// effect.

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
// can create a complete event: it chooses a word, chooses a colour, plays
// a sound, stores the word as a node, creates the expanding circle, creates
// the fading word, and adds the node into the connection map. This is the
// clearest place where the Patatap-inspired idea becomes my own version:
// one gesture produces a visual response, a sonic response, and a stored
// piece of meaning.
//
// The most important line for the circular spawn is:
//
// effects.push(new BlurCircle(node));
//
// This line does not draw the circle immediately. It creates a BlurCircle
// object and stores it inside effects[]. Later, animate() loops through
// effects and calls update() and draw() on each effect. The actual circle
// is drawn inside the BlurCircle class using ctx.arc(). This separation
// helped me understand that interaction, data storage, and drawing can be
// separated: spawn() creates the event, while BlurCircle.draw() renders the
// soft expanding circle on screen.

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
// This section turns each spawned word into a small sound. I learned that
// the browser can generate sound directly using AudioContext. In this
// code, playWordSound() first finds the note for the word, then
// noteToFrequency() converts that note into a frequency. OscillatorNode
// creates the tone, GainNode controls how the sound fades in and out, and
// BiquadFilterNode softens the tone so it does not feel too sharp.
//
// This is related to the design because the spawned sound should feel like
// a quiet response to the word, not like a loud button effect. The volume
// and duration are also connected to currentFontSize, so faster movement
// can create slightly larger words and more present sounds.

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
// The animation loop is where the canvas stays alive. I learned that
// requestAnimationFrame() allows the browser to redraw the scene
// continuously. In this project, animate() fades the canvas, redraws the
// connection lines, updates every active effect, removes effects that have
// finished, and then calls itself again.
//
// This matters for the design because Dear God is not meant to create
// fixed objects. The words, circles, and lines should appear, connect,
// drift, and disappear over time. The loop is what gives the work that
// temporary and breathing quality.

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
// This section draws the connected map between words. I learned that the
// lines should not be separate HTML elements; they can be drawn directly
// from the stored node positions inside points[]. drawConnections() loops
// through each pair of points, draws a thin line between them, and slowly
// reduces lineAlpha so the connection fades over time.
//
// This supports the concept because the words are not isolated. Each new
// word becomes part of a temporary constellation. The slight random offset
// in the line points makes the connection feel more organic and handmade
// rather than like a rigid diagram.

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
// This function controls what the user sees while holding and moving an
// existing node. I learned that if a dragged word is drawn too strongly on
// the canvas, it can leave repeated dark marks and make the interaction
// look messy. To avoid that, drawDraggedNodeOnly() draws a very transparent
// version of the word only while it is being dragged.
//
// This is intentionally different from the normal GodWord effect. It gives
// the user a visual clue that they are holding a word, but it does not
// create a heavy permanent trail. This keeps the rearranging interaction
// lighter and cleaner.

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
// I learned to use small classes for repeated visual effects instead of
// placing all drawing logic inside spawn(). Each class has its own update(),
// draw(), and isDead() method. This makes the visual system easier to
// control because the expanding circle and the fading word can have
// different timing and behaviour.
//
// The most important class for the circle is BlurCircle. The circle begins
// with a radius and alpha value in constructor(). update() makes the circle
// expand by increasing radius and fade by decreasing alpha. draw() then
// uses ctx.arc() to draw the circular form around the node position. This
// is the exact section where the visible spawn circle is rendered.

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
// This section turns the erase slider into a gradual clearing tool. I
// learned that a range input can control a value from 0 to 1, and that
// value can then be used to decide how much of the canvas should be erased.
// Here, eraseProgress becomes a percentage of the canvas width. Effects,
// visualNodes, and points on the erased side are removed from their arrays.
//
// The wipe itself happens inside wipeCanvasFromLeft(). Instead of clearing
// the whole canvas at once, it uses destination-out and a horizontal
// gradient to create a softer edge. This supports the design because erase
// feels like releasing or making space, not simply deleting.

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
// This section connects the designed interface buttons to JavaScript. I
// learned to keep these controls separate from the canvas drawing system
// because they are interface actions, not generative marks. The sound
// button controls background music, while the information panel can open
// and close without affecting the canvas state.
//
// This supports the experience because explanation and sound remain
// optional. The user can choose whether to add background music or read
// more information, instead of being forced into those layers before
// interacting.

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
// This part uses the same open and close logic as the information panel.
// I separated the instruction panel from the information panel because
// they serve different purposes: the information panel explains the
// concept, while the instruction panel explains how to interact.
//
// This keeps the interface clearer and gives users control over how much
// guidance they need. It also keeps the first experience more open, because
// users can explore first and read instructions only when they need them.

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
// interaction code. I learned that separating small reusable logic makes
// the project easier to tune and prevents rewriting the same calculations
// across multiple interactions. randomFromArray() is used to select words
// and colours for generation, getDistance() measures cursor movement and
// supports node dragging behaviour, mapValue() converts one range into
// another such as speed into font size or sound volume, and hexToRGBA()
// allows solid colours to become transparent so visual elements can fade
// smoothly over time.
//
// This section became useful because many parts of the project respond to
// movement, timing, opacity, and randomness at the same time. Organising
// these calculations into helper functions made it easier to adjust the
// feeling of the interaction without changing the main drawing logic.

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