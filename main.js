import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { formatTime } from "./system/utils.js";
import { demoNotes } from "./data/demoNotes.js";
import { NoteManager } from "./system/noteManager.js";
import { DrumKit } from "./drums/drumKit.js";
import { PlaybackManager } from "./system/playbackManager.js";
import { ButtonManager } from "./system/buttonManager.js";
import { MidiManager } from "./system/midiManager.js";
import { AudioManager } from "./system/audioManager.js";
import { songCatalog } from "./data/songCatalog.js";

// CONFIGURACIÓN

const DEMO_DURATION = 60;
const NOTE_TRAVEL_TIME = 3;

// HTML

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

// MOSTRAR / OCULTAR CONTROLES

let controlsHideTimeout = null;

// MOSTRAR

function showControls() {
  clearTimeout(controlsHideTimeout);

  controls.classList.add("controls-visible");
}

// OCULTAR

function hideControls() {
  controlsHideTimeout = setTimeout(() => {
    controls.classList.remove("controls-visible");
  }, 800);
}

// MOUSE SOBRE LOS CONTROLES

controls.addEventListener("mouseenter", () => {
  showControls();
});

controls.addEventListener("mouseleave", () => {
  hideControls();
});

// THREE.JS - ESCENA

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x080808);

// CÁMARA

const camera = new THREE.PerspectiveCamera(
  13,
  visualizer.clientWidth / visualizer.clientHeight,
  0.1,
  200,
);

camera.position.set(0, 15, 35);
camera.lookAt(0, 5, 0);

// RENDERER

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 5));

renderer.setSize(visualizer.clientWidth, visualizer.clientHeight);

visualizer.appendChild(renderer.domElement);

// ILUMINACIÓN

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 10);
scene.add(directionalLight);

// PISO

const floorGeometry = new THREE.PlaneGeometry(30, 40);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x111111,
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

// BATERÍA

const drumKit = new DrumKit(scene);

// NOTAS

const noteManager = new NoteManager(scene, drumKit, NOTE_TRAVEL_TIME);

// MIDI

const midiManager = new MidiManager();

// AUDIO

const audioManager = new AudioManager();

// REPRODUCCIÓN

const playback = new PlaybackManager(audioManager);

// CARGAR DEMO

noteManager.loadNotes(demoNotes);
playback.setDuration(DEMO_DURATION);

// BOTONES

const buttonManager = new ButtonManager(
  playback,

  {
    playButton,
    pauseButton,
    stopButton,
    backwardButton,
    forwardButton,
    timeline,
  },
);

// CONFIGURACIÓN INICIAL DE LA UI

timeline.min = 0;
timeline.max = DEMO_DURATION;
timeline.step = 0.01;
timeline.value = 0;

durationElement.textContent = formatTime(DEMO_DURATION);
currentTimeElement.textContent = formatTime(0);
statusElement.textContent = "Detenido";

// CARGAR MIDI

midiFileInput.addEventListener("change", async () => {
  const file = midiFileInput.files[0];

  if (!file) {
    return;
  }

  try {
    statusElement.textContent = "Cargando MIDI...";

    const result = await midiManager.load(file);

    /*
                Reemplazamos las notas
                de demostración por las
                notas reales del MIDI.
            */

    noteManager.loadMidiNotes(result.notes);

    updateTempoDisplay();

    /*
                La duración ahora viene
                directamente del MIDI.
            */

    playback.setDuration(result.duration);

    timeline.max = result.duration;

    timeline.value = playback.currentTime;

    durationElement.textContent = formatTime(result.duration);

    statusElement.textContent = "MIDI cargado";
  } catch (error) {
    console.error("Error cargando MIDI:", error);

    statusElement.textContent = "Error cargando MIDI";
  }
});

// CARGAR AUDIO

audioFileInput.addEventListener("change", () => {
  const file = audioFileInput.files[0];

  if (!file) {
    return;
  }

  audioManager.load(file);

  statusElement.textContent = "Audio cargado";
});

// RESIZE

window.addEventListener("resize", () => {
  const width = visualizer.clientWidth;
  const height = visualizer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

let lastFrameTime = performance.now();

// ANIMACIÓN

function animate(now) {
  requestAnimationFrame(animate);

  const delta = (now - lastFrameTime) / 1000;

  lastFrameTime = now;

  // ACTUALIZAR REPRODUCCIÓN
  playback.update(delta);

  updateTempoDisplay();

  // TIEMPO ACTUAL
  const currentTime = playback.currentTime;

  // ACTUALIZAR NOTAS
  noteManager.update(currentTime);

  // TIMELINE
  timeline.value = currentTime;

  // TIEMPO
  currentTimeElement.textContent = formatTime(currentTime);

  // ESTADO
  if (playback.playing) {
    statusElement.textContent = "Reproduciendo";
  } else if (
    playback.currentTime >= playback.duration &&
    playback.duration > 0
  ) {
    statusElement.textContent = "Finalizado";
  }

  // RENDER
  renderer.render(scene, camera);
}

// INICIAR
animate();

const controlsTrigger = document.getElementById("controls-trigger");

controlsTrigger.addEventListener("mouseenter", () => {
  showControls();
});

// CAMBIAR VELOCIDAD
function changeSpeed(rate) {
  const min = Number(speedControl.min);
  const max = Number(speedControl.max);

  rate = Math.max(min, Math.min(max, rate));

  playback.setPlaybackRate(rate);

  speedControl.value = rate;

  speedValue.textContent = rate.toFixed(2) + "×";

  updateTempoDisplay();
}

// SLIDER DE VELOCIDAD
speedControl.addEventListener("input", () => {
  changeSpeed(Number(speedControl.value));
});

// DISMINUIR VELOCIDAD
decreaseSpeedButton.addEventListener("click", () => {
  changeSpeed(Number(speedControl.value) - 0.05);
});

// AUMENTAR VELOCIDAD
increaseSpeedButton.addEventListener("click", () => {
  changeSpeed(Number(speedControl.value) + 0.05);
});

// ACTUALIZAR BPM EN PANTALLA
function updateTempoDisplay() {
  const originalBpm = midiManager.getBpmAtTime(playback.currentTime);

  const effectiveBpm = originalBpm * playback.playbackRate;

  tempoValue.textContent = Math.round(effectiveBpm);
}

// ========================================================
// INICIALIZAR BIBLIOTECA
// ========================================================

for (const song of songCatalog) {
  const option = document.createElement("option");

  option.value = song.id;

  option.textContent = song.title;

  songSelect.appendChild(option);
}

// ========================================================
// CARGAR CANCIÓN DE LA BIBLIOTECA
// ========================================================

loadSongButton.addEventListener("click", async () => {
  const selectedSong = songCatalog.find((song) => song.id === songSelect.value);

  if (!selectedSong) {
    statusElement.textContent = "Selecciona una canción";
    return;
  }

  try {
    playback.pause();

    statusElement.textContent = "Cargando canción...";

    // Cargar MIDI
    const result = await midiManager.loadFromUrl(selectedSong.midi);

    noteManager.loadMidiNotes(result.notes);

    // Actualizar duración y timeline
    playback.setDuration(result.duration);

    playback.stop();

    timeline.max = result.duration;

    timeline.value = 0;

    durationElement.textContent = formatTime(result.duration);

    currentTimeElement.textContent = formatTime(0);

    // Cargar audio
    audioManager.loadFromUrl(selectedSong.audio);

    // Actualizar BPM
    updateTempoDisplay();

    statusElement.textContent = `Canción cargada: ${selectedSong.title}`;
  } catch (error) {
    console.error("Error cargando canción:", error);

    statusElement.textContent = "Error cargando canción. Revisa las rutas.";
  }
});
