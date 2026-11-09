import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import { formatTime } from "./system/utils.js";
import { demoNotes } from "./data/demoNotes.js";
import { NoteManager } from "./system/noteManager.js";
import { disposeNoteCaches } from "./models/note.js";
import { DrumKit } from "./drums/drumKit.js";
import { PlaybackManager } from "./system/playbackManager.js";
import { ButtonManager } from "./system/buttonManager.js";
import { MidiManager } from "./system/midiManager.js";
import { AudioManager } from "./system/audioManager.js";
import { songCatalog } from "./data/songCatalog.js";
import { Stage } from "./system/stage.js";
import { EffectManager } from "./system/effectManager.js";
import { UIManager } from "./system/uiManager.js";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const DEMO_DURATION = 60;
const NOTE_TRAVEL_TIME = 3;
const FLOOR_Y = -1;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarseQuery = window.matchMedia("(pointer: coarse)");

let reducedMotion = motionQuery.matches;
const isCoarse = coarseQuery.matches;

/* =========================================================
   HTML
   ========================================================= */

const visualizer = document.getElementById("visualizer");
const timeline = document.getElementById("timeline");
const currentTimeElement = document.getElementById("current-time");
const durationElement = document.getElementById("duration");
const statusElement = document.getElementById("status");
const playButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const stopButton = document.getElementById("stop");
const backwardButton = document.getElementById("backward");
const forwardButton = document.getElementById("forward");
const midiFileInput = document.getElementById("midi-file");
const audioFileInput = document.getElementById("audio-file");
const controls = document.getElementById("controls");

const speedControl = document.getElementById("speed-control");
const speedValue = document.getElementById("speed-value");
const tempoValue = document.getElementById("tempo-value");
const decreaseSpeedButton = document.getElementById("decrease-speed");
const increaseSpeedButton = document.getElementById("increase-speed");

const songSelect = document.getElementById("song-select");
const loadSongButton = document.getElementById("load-song");

/* =========================================================
   THREE.JS
   ========================================================= */

const scene = new THREE.Scene();

const stage = new Stage(scene, {
  reducedMotion,
  floorY: FLOOR_Y,
  isCoarse,
});

const camera = stage.camera;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
  alpha: false,
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, isCoarse ? 1.75 : 2),
);

renderer.setSize(
  visualizer.clientWidth,
  visualizer.clientHeight,
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.setClearColor(0x050506, 1);

visualizer.appendChild(renderer.domElement);

stage.setViewport(
  visualizer.clientWidth,
  visualizer.clientHeight,
);

/* =========================================================
   BATERÍA
   ========================================================= */

const drumKit = new DrumKit(scene, {
  reducedMotion,
  floorY: FLOOR_Y,
});

/* =========================================================
   EFECTOS
   ========================================================= */

const effectManager = new EffectManager(scene, {
  reducedMotion,
  floorY: FLOOR_Y,
});

/* =========================================================
   NOTAS
   ========================================================= */

const noteManager = new NoteManager(
  scene,
  drumKit,
  NOTE_TRAVEL_TIME,
);

/* =========================================================
   MIDI / AUDIO / REPRODUCCIÓN
   ========================================================= */

const midiManager = new MidiManager();
const audioManager = new AudioManager();
const playback = new PlaybackManager(audioManager);

/* =========================================================
   UI
   ========================================================= */

const ui = new UIManager({
  playback,
  reducedMotion,
});

ui.onPointerMove = (x, y) => {
  stage.setPointer(x, y);
};

noteManager.onHit = ({ type, color, velocity, position }) => {
  drumKit.hit(type, 0.65 + velocity * 0.65);

  effectManager.impact(position, color, velocity);

  stage.pulse(0.22 + velocity * 0.3);
};

/* =========================================================
   DEMO
   ========================================================= */

noteManager.loadNotes(demoNotes);

playback.setDuration(DEMO_DURATION);

/* =========================================================
   BOTONES
   ========================================================= */

const buttonManager = new ButtonManager(playback, {
  playButton,
  pauseButton,
  stopButton,
  backwardButton,
  forwardButton,
  timeline,
});

/* =========================================================
   CONFIGURACIÓN INICIAL
   ========================================================= */

timeline.min = 0;
timeline.max = DEMO_DURATION;
timeline.step = 0.01;
timeline.value = 0;

durationElement.textContent = formatTime(DEMO_DURATION);
currentTimeElement.textContent = formatTime(0);
statusElement.textContent = "Detenido";

/* =========================================================
   CARGAR MIDI
   ========================================================= */

midiFileInput.addEventListener("change", async () => {
  const file = midiFileInput.files[0];

  if (!file) {
    return;
  }

  try {
    ui.setBusy(true, "Cargando MIDI...");

    const result = await midiManager.load(file);

    noteManager.loadMidiNotes(result.notes);

    updateTempoDisplay();

    playback.stop();

    playback.setDuration(result.duration);

    timeline.max = result.duration;
    timeline.value = 0;

    durationElement.textContent = formatTime(result.duration);
    currentTimeElement.textContent = formatTime(0);

    const title = file.name.replace(/\.[^.]+$/, "");

    ui.setNowPlaying(title);
    ui.transitionReveal(title);
    ui.setStatus("MIDI cargado");
  } catch (error) {
    console.error("Error cargando MIDI:", error);

    ui.setStatus("Error cargando MIDI");
  } finally {
    ui.setBusy(false);
  }
});

/* =========================================================
   CARGAR AUDIO
   ========================================================= */

audioFileInput.addEventListener("change", () => {
  const file = audioFileInput.files[0];

  if (!file) {
    return;
  }

  audioManager.load(file);

  ui.setStatus("Audio cargado");
});

/* =========================================================
   RESIZE
   ========================================================= */

let resizeFrame = null;
let visualizerObserver = null;

function resize() {
  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame);
  }

  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;

    const width = visualizer.clientWidth;
    const height = visualizer.clientHeight;

    if (width === 0 || height === 0) {
      return;
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, isCoarse ? 1.75 : 2),
    );

    renderer.setSize(width, height);
    stage.resize(width, height);
  });
}

window.addEventListener("resize", resize);

if (typeof ResizeObserver !== "undefined") {
  visualizerObserver = new ResizeObserver(resize);
  visualizerObserver.observe(visualizer);
}

/* =========================================================
   VELOCIDAD / TEMPO
   ========================================================= */

function changeSpeed(rate) {
  const min = Number(speedControl.min);
  const max = Number(speedControl.max);

  rate = Math.max(min, Math.min(max, rate));

  playback.setPlaybackRate(rate);

  speedControl.value = rate;

  speedValue.textContent = `${rate.toFixed(2)}×`;

  ui.setSpeedDisplay(rate);

  updateTempoDisplay();
}

speedControl.addEventListener("input", () => {
  changeSpeed(Number(speedControl.value));
});

decreaseSpeedButton.addEventListener("click", () => {
  changeSpeed(Number(speedControl.value) - 0.05);
});

increaseSpeedButton.addEventListener("click", () => {
  changeSpeed(Number(speedControl.value) + 0.05);
});

function updateTempoDisplay() {
  const originalBpm = midiManager.getBpmAtTime(playback.currentTime);

  const effectiveBpm = originalBpm * playback.playbackRate;

  tempoValue.textContent = Math.round(effectiveBpm);
}

/* =========================================================
   BIBLIOTECA
   ========================================================= */

for (const song of songCatalog) {
  const option = document.createElement("option");

  option.value = song.id;
  option.textContent = song.title;

  songSelect.appendChild(option);
}

loadSongButton.addEventListener("click", async () => {
  const selectedSong = songCatalog.find(
    (song) => song.id === songSelect.value,
  );

  if (!selectedSong) {
    ui.setStatus("Selecciona una canción");
    return;
  }

  try {
    playback.pause();

    ui.setBusy(true, "Cargando canción...");

    const result = await midiManager.loadFromUrl(selectedSong.midi);

    noteManager.loadMidiNotes(result.notes);

    playback.setDuration(result.duration);
    playback.stop();

    timeline.max = result.duration;
    timeline.value = 0;

    durationElement.textContent = formatTime(result.duration);
    currentTimeElement.textContent = formatTime(0);

    audioManager.loadFromUrl(selectedSong.audio);

    updateTempoDisplay();

    ui.setNowPlaying(selectedSong.title);
    ui.transitionReveal(selectedSong.title);
    ui.setStatus(`Canción cargada: ${selectedSong.title}`);
  } catch (error) {
    console.error("Error cargando canción:", error);

    ui.setStatus("Error cargando canción. Revisa las rutas.");
  } finally {
    ui.setBusy(false);
  }
});

/* =========================================================
   INICIALIZAR UI
   ========================================================= */

ui.initLibraryCards();
ui.init();

/* =========================================================
   PREFERENCIAS DE MOVIMIENTO
   ========================================================= */

function applyReducedMotion(matches) {
  reducedMotion = matches;

  stage.reducedMotion = matches;
  effectManager.reducedMotion = matches;
  noteManager.reducedMotion = matches;

  for (const element of Object.values(drumKit.elements)) {
    element.reducedMotion = matches;
  }

  if (matches) {
    stage.setPointer(0, 0);
    document.documentElement.style.setProperty("--px", "0");
    document.documentElement.style.setProperty("--py", "0");
  }
}

ui.onReducedMotionChange = applyReducedMotion;

function handleMotionChange(event) {
  applyReducedMotion(event.matches);
}

if (motionQuery.addEventListener) {
  motionQuery.addEventListener("change", handleMotionChange);
}

/* =========================================================
   ANIMACIÓN
   ========================================================= */

const clock = new THREE.Clock();

let frameId = null;
let lastStatus = "";

function getStatusText(currentTime) {
  if (playback.playing) {
    return "Reproduciendo";
  }

  if (currentTime >= playback.duration && playback.duration > 0) {
    return "Finalizado";
  }

  if (currentTime > 0) {
    return "En pausa";
  }

  return "Detenido";
}

function animate() {
  frameId = requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  // Reproducción
  playback.update(delta);

  const currentTime = playback.currentTime;

  // Notas + animaciones 3D
  noteManager.update(currentTime, delta);
  drumKit.update(delta);
  effectManager.update(delta);

  // Tempo
  const originalBpm = midiManager.getBpmAtTime(currentTime);
  const effectiveBpm = originalBpm * playback.playbackRate;

  // Estado
  const status = getStatusText(currentTime);

  if (status !== lastStatus) {
    lastStatus = status;

    statusElement.textContent = status;
  }

  // UI sincronizada
  ui.updatePlayback({
    currentTime,
    duration: playback.duration || DEMO_DURATION,
    playing: playback.playing,
    status,
    tempo: effectiveBpm,
    rate: playback.playbackRate,
  });

  // Escenario
  stage.update(delta, elapsed, playback.playing);

  // Render
  renderer.render(scene, camera);
}

animate();

/* =========================================================
   LIMPIEZA AL SALIR
   ========================================================= */

let cleanedUp = false;

function cleanup(event) {
  // No destruir la escena si el navegador la conserva en bfcache.
  if (cleanedUp || event?.persisted) {
    return;
  }

  cleanedUp = true;

  if (frameId) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }

  if (resizeFrame) {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
  }

  window.removeEventListener("resize", resize);

  visualizerObserver?.disconnect();
  visualizerObserver = null;

  if (motionQuery.removeEventListener) {
    motionQuery.removeEventListener("change", handleMotionChange);
  }

  ui.dispose();

  noteManager.dispose();
  effectManager.dispose();
  drumKit.dispose();
  stage.dispose();
  disposeNoteCaches();

  renderer.dispose();
}

window.addEventListener("pagehide", cleanup);
