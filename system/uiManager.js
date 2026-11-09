import { formatTime } from "./utils.js";

/* =========================================================
   UI MANAGER
   Controla HUD, intro, drawer, atajos y transiciones.
   ========================================================= */

export class UIManager {
  constructor({ playback = null, reducedMotion = false } = {}) {
    this.playback = playback;
    this.reducedMotion = reducedMotion;

    this.listeners = [];
    this.timeouts = new Set();

    this.intro = document.getElementById("intro");
    this.controls = document.getElementById("controls");
    this.controlsTrigger = document.getElementById("controls-trigger");

    this.libraryToggle = document.getElementById("library-toggle");
    this.libraryClose = document.getElementById("library-close");
    this.drawer = document.getElementById("library-drawer");
    this.scrim = document.getElementById("drawer-scrim");

    this.songSelect = document.getElementById("song-select");
    this.songList = document.getElementById("song-list");
    this.songCount = document.getElementById("song-count");
    this.loadSongButton = document.getElementById("load-song");

    this.midiInput = document.getElementById("midi-file");
    this.audioInput = document.getElementById("audio-file");
    this.midiFileName = document.getElementById("midi-file-name");
    this.audioFileName = document.getElementById("audio-file-name");

    this.fullscreenToggle = document.getElementById("fullscreen-toggle");

    this.timeline = document.getElementById("timeline");
    this.currentTimeElement = document.getElementById("current-time");
    this.durationElement = document.getElementById("duration");

    this.speedControl = document.getElementById("speed-control");
    this.speedValue = document.getElementById("speed-value");
    this.tempoValue = document.getElementById("tempo-value");
    this.statusElement = document.getElementById("status");
    this.trackTitle = document.getElementById("track-title");

    this.sceneWipe = document.getElementById("scene-wipe");
    this.sceneWipeTitle = document.getElementById("scene-wipe-title");

    this.playButton = document.getElementById("play");
    this.pauseButton = document.getElementById("pause");
    this.stopButton = document.getElementById("stop");
    this.backwardButton = document.getElementById("backward");
    this.forwardButton = document.getElementById("forward");
    this.decreaseSpeedButton = document.getElementById("decrease-speed");
    this.increaseSpeedButton = document.getElementById("increase-speed");

    this.isDrawerOpen = false;
    this.isScrubbing = false;
    this.isHoveringDock = false;
    this.previousFocus = null;
    this.drawerCloseTimer = null;
    this.wipeTimers = [];

    this.lastPlayback = {
      time: "",
      duration: "",
      status: "",
      tempo: "",
      progress: -1,
      speed: -1,
    };

    this.wasPlaying = false;
    this.pointerFrame = null;

    this.onPointerMove = null;
    this.onIntroDone = null;
    this.onReducedMotionChange = null;
  }

  /* =======================================================
     INIT
     ======================================================= */

  init() {
    this.bindIntro();
    this.bindControlsVisibility();
    this.bindDrawer();
    this.bindFullscreen();
    this.bindKeyboard();
    this.bindParallax();
    this.bindFileLabels();
    this.bindTimeline();
    this.bindSpeed();
    this.bindMotionPreference();

    this.updateRangeFill(this.speedControl);
    this.setNowPlaying("Demo Session");
    this.hideControls();

    // Un primer vistazo a los controles al entrar.
    this.showControls();
    this.scheduleHide(4600);
  }

  addListener(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this.listeners.push({ target, type, handler, options });
  }

  later(fn, delay) {
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      fn();
    }, delay);

    this.timeouts.add(id);
    return id;
  }

  clearTimer(id) {
    if (id) {
      window.clearTimeout(id);
      this.timeouts.delete(id);
    }
  }

  /* =======================================================
     INTRO
     ======================================================= */

  bindIntro() {
    if (!this.intro) {
      return;
    }

    const readyDelay = this.reducedMotion ? 40 : 420;
    const exitDelay = this.reducedMotion ? 500 : 2900;

    this.later(() => {
      this.intro.classList.add("is-ready");
    }, readyDelay);

    this.later(() => {
      this.dismissIntro();
    }, exitDelay);

    const dismiss = () => this.dismissIntro();

    this.addListener(this.intro, "pointerdown", dismiss);
    this.addListener(window, "keydown", (event) => {
      if (!document.body.classList.contains("is-intro")) {
        return;
      }

      if (
        event.key === "Tab" ||
        event.key === "Shift" ||
        event.key === "Control" ||
        event.key === "Alt" ||
        event.key === "Meta"
      ) {
        return;
      }

      this.dismissIntro();
    });
  }

  dismissIntro() {
    if (!this.intro || !document.body.classList.contains("is-intro")) {
      return;
    }

    this.intro.classList.add("intro--out");
    document.body.classList.remove("is-intro");

    this.later(() => {
      this.intro.setAttribute("aria-hidden", "true");
    }, this.reducedMotion ? 20 : 1100);

    if (typeof this.onIntroDone === "function") {
      this.onIntroDone();
    }
  }

  /* =======================================================
     CONTROLES AUTO-OCULTOS
     ======================================================= */

  bindControlsVisibility() {
    let moveFrame = null;

    this.addListener(window, "pointermove", (event) => {
      if (event.pointerType === "touch") {
        return;
      }

      if (moveFrame) {
        return;
      }

      moveFrame = requestAnimationFrame(() => {
        moveFrame = null;
        this.showControls();
        this.scheduleHide(4200);
      });
    });

    this.addListener(window, "pointerdown", (event) => {
      if (this.isDrawerOpen) {
        return;
      }

      this.showControls();
      this.scheduleHide(4600);
    });

    this.addListener(this.controls, "mouseenter", () => {
      this.isHoveringDock = true;
      this.clearTimer(this.hideTimer);
      this.showControls();
    });

    this.addListener(this.controls, "mouseleave", () => {
      this.isHoveringDock = false;
      this.scheduleHide(2600);
    });

    this.addListener(this.controls, "focusin", () => {
      this.showControls();
      this.clearTimer(this.hideTimer);
    });

    this.addListener(this.controls, "focusout", () => {
      this.scheduleHide(3600);
    });

    this.addListener(this.controlsTrigger, "click", () => {
      this.showControls();
      this.scheduleHide(5200);
    });

    this.addListener(this.timeline, "pointerdown", () => {
      this.isScrubbing = true;
      this.showControls();
      this.clearTimer(this.hideTimer);
    });

    this.addListener(window, "pointerup", () => {
      if (this.isScrubbing) {
        this.isScrubbing = false;
        this.scheduleHide(3000);
      }
    });

    this.addListener(document, "visibilitychange", () => {
      if (document.hidden) {
        this.clearTimer(this.hideTimer);
      } else {
        this.scheduleHide(3600);
      }
    });
  }

  showControls() {
    if (!this.controls) {
      return;
    }

    this.controls.classList.add("controls-visible");
    document.body.classList.remove("ui-controls-hidden");
  }

  hideControls() {
    if (!this.controls) {
      return;
    }

    if (
      this.isDrawerOpen ||
      this.isScrubbing ||
      this.isHoveringDock ||
      this.controls.contains(document.activeElement)
    ) {
      return;
    }

    this.controls.classList.remove("controls-visible");
    document.body.classList.add("ui-controls-hidden");
  }

  scheduleHide(delay = 4200) {
    this.clearTimer(this.hideTimer);

    this.hideTimer = this.later(() => {
      this.hideControls();
    }, delay);
  }

  /* =======================================================
     DRAWER
     ======================================================= */

  bindDrawer() {
    this.addListener(this.libraryToggle, "click", () => {
      this.openDrawer();
    });

    this.addListener(this.libraryClose, "click", () => {
      this.closeDrawer();
    });

    this.addListener(this.scrim, "click", () => {
      this.closeDrawer();
    });

    this.addListener(document, "keydown", (event) => {
      if (!this.isDrawerOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        this.closeDrawer();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = Array.from(
        this.drawer.querySelectorAll(
          'button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          element.offsetParent !== null ||
          element.getClientRects().length > 0,
      );

      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  initLibraryCards() {
    if (!this.songList || !this.songSelect) {
      return;
    }

    const options = Array.from(this.songSelect.options).filter(
      (option) => option.value !== "",
    );

    this.songList.innerHTML = "";

    if (this.songCount) {
      this.songCount.textContent = String(options.length).padStart(2, "0");
    }

    options.forEach((option, index) => {
      const card = document.createElement("button");

      card.type = "button";
      card.className = "song-card";
      card.dataset.songId = option.value;

      const number = document.createElement("span");
      number.className = "song-card__index";
      number.textContent = String(index + 1).padStart(2, "0");

      const title = document.createElement("span");
      title.className = "song-card__title";
      title.textContent = option.textContent;

      const meta = document.createElement("span");
      meta.className = "song-card__meta";
      meta.textContent = "MIDI + AUDIO";

      const arrow = document.createElement("span");
      arrow.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      card.append(number, title, meta, arrow);

      card.addEventListener("click", () => {
        this.songSelect.value = option.value;
        this.syncSongCards();

        if (this.loadSongButton) {
          this.loadSongButton.click();
        }

        this.closeDrawer();
      });

      this.songList.appendChild(card);
    });

    this.addListener(this.songSelect, "change", () => {
      this.syncSongCards();
    });

    this.syncSongCards();
  }

  syncSongCards() {
    if (!this.songList || !this.songSelect) {
      return;
    }

    const selected = this.songSelect.value;

    for (const card of this.songList.querySelectorAll(".song-card")) {
      const isSelected = card.dataset.songId === selected;

      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-current", isSelected ? "true" : "false");
    }
  }

  openDrawer() {
    if (!this.drawer || this.isDrawerOpen) {
      return;
    }

    this.isDrawerOpen = true;
    this.previousFocus = document.activeElement;

    this.showControls();
    this.clearTimer(this.hideTimer);

    this.libraryToggle?.setAttribute("aria-expanded", "true");

    if (this.scrim) {
      this.scrim.hidden = false;

      requestAnimationFrame(() => {
        this.scrim.classList.add("is-active");
      });
    }

    this.drawer.setAttribute("aria-hidden", "false");
    this.drawer.classList.add("is-open");

    this.later(() => {
      this.libraryClose?.focus();
    }, 120);
  }

  closeDrawer() {
    if (!this.drawer || !this.isDrawerOpen) {
      return;
    }

    this.isDrawerOpen = false;

    this.libraryToggle?.setAttribute("aria-expanded", "false");
    this.drawer.setAttribute("aria-hidden", "true");
    this.drawer.classList.remove("is-open");

    if (this.scrim) {
      this.scrim.classList.remove("is-active");

      this.clearTimer(this.drawerCloseTimer);

      this.drawerCloseTimer = this.later(() => {
        if (!this.isDrawerOpen) {
          this.scrim.hidden = true;
        }
      }, 480);
    }

    this.previousFocus?.focus?.();
    this.scheduleHide(4200);
  }

  /* =======================================================
     PANTALLA COMPLETA
     ======================================================= */

  bindFullscreen() {
    if (!this.fullscreenToggle) {
      return;
    }

    this.addListener(this.fullscreenToggle, "click", async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen({
            navigationUI: "hide",
          });

          if (screen.orientation?.lock) {
            await screen.orientation.lock("landscape").catch(() => {});
          }
        } else if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.warn("No se pudo cambiar a pantalla completa:", error);
      }
    });

    this.addListener(document, "fullscreenchange", () => {
      const isFullscreen = Boolean(document.fullscreenElement);

      this.fullscreenToggle.setAttribute(
        "aria-label",
        isFullscreen
          ? "Salir de pantalla completa"
          : "Entrar en pantalla completa",
      );

      document.body.classList.toggle("is-fullscreen", isFullscreen);
    });
  }

  /* =======================================================
     ATAJOS DE TECLADO
     ======================================================= */

  bindKeyboard() {
    this.addListener(window, "keydown", (event) => {
      const target = event.target;

      const isFormControl =
        target instanceof HTMLElement &&
        (target.closest("input, select, textarea, button, [contenteditable]") ||
          target.isContentEditable);

      if (event.key === "Escape" && this.isDrawerOpen) {
        return;
      }

      if (!isFormControl && event.code === "Space") {
        event.preventDefault();

        if (this.playback) {
          if (this.playback.playing) {
            this.playback.pause();
          } else {
            this.playback.play();
          }
        }

        this.showControls();
        this.scheduleHide(4200);
        return;
      }

      if (!isFormControl && event.key === "ArrowLeft") {
        event.preventDefault();
        this.playback?.backward(5);
        this.showControls();
        this.scheduleHide(3200);
        return;
      }

      if (!isFormControl && event.key === "ArrowRight") {
        event.preventDefault();
        this.playback?.forward(5);
        this.showControls();
        this.scheduleHide(3200);
        return;
      }

      if (!isFormControl && event.key.toLowerCase() === "f") {
        event.preventDefault();
        this.fullscreenToggle?.click();
        return;
      }

      if (!isFormControl && event.key.toLowerCase() === "l") {
        event.preventDefault();

        if (this.isDrawerOpen) {
          this.closeDrawer();
        } else {
          this.openDrawer();
        }
      }
    });
  }

  /* =======================================================
     PARALLAX
     ======================================================= */

  bindParallax() {
    if (this.reducedMotion) {
      return;
    }

    const finePointer = window.matchMedia("(pointer: fine)").matches;

    if (!finePointer) {
      return;
    }

    this.addListener(window, "pointermove", (event) => {
      if (this.pointerFrame) {
        return;
      }

      this.pointerFrame = requestAnimationFrame(() => {
        this.pointerFrame = null;

        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;

        document.documentElement.style.setProperty("--px", x.toFixed(4));
        document.documentElement.style.setProperty("--py", y.toFixed(4));

        if (typeof this.onPointerMove === "function") {
          this.onPointerMove(x, y);
        }
      });
    });

    this.addListener(document, "pointerleave", () => {
      document.documentElement.style.setProperty("--px", "0");
      document.documentElement.style.setProperty("--py", "0");

      if (typeof this.onPointerMove === "function") {
        this.onPointerMove(0, 0);
      }
    });
  }

  /* =======================================================
     ARCHIVOS / TIMELINE / VELOCIDAD
     ======================================================= */

  bindFileLabels() {
    this.addListener(this.midiInput, "change", () => {
      const file = this.midiInput.files?.[0];

      if (file && this.midiFileName) {
        this.midiFileName.textContent = file.name;
      }
    });

    this.addListener(this.audioInput, "change", () => {
      const file = this.audioInput.files?.[0];

      if (file && this.audioFileName) {
        this.audioFileName.textContent = file.name;
      }
    });
  }

  bindTimeline() {
    if (!this.timeline) {
      return;
    }

    this.addListener(this.timeline, "input", () => {
      this.updateRangeFill(this.timeline);
    });

    this.addListener(this.timeline, "pointerdown", () => {
      this.timeline.classList.add("is-active");
    });

    this.addListener(window, "pointerup", () => {
      this.timeline.classList.remove("is-active");
    });
  }

  bindSpeed() {
    if (!this.speedControl) {
      return;
    }

    this.addListener(this.speedControl, "input", () => {
      this.updateRangeFill(this.speedControl);
    });
  }

  updateRangeFill(input) {
    if (!input) {
      return;
    }

    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const value = Number(input.value);

    const percent = ((value - min) / (max - min)) * 100;

    input.style.setProperty("--progress", `${percent}%`);
  }

  setSpeedDisplay(rate) {
    if (this.speedValue) {
      this.speedValue.textContent = `${rate.toFixed(2)}×`;
    }

    if (this.speedControl) {
      this.speedControl.value = String(rate);
      this.updateRangeFill(this.speedControl);
    }
  }

  /* =======================================================
     ESTADO DE REPRODUCCIÓN
     ======================================================= */

  setPlaying(playing) {
    if (playing === this.wasPlaying) {
      return;
    }

    this.wasPlaying = playing;
    document.body.classList.toggle("is-playing", playing);

    this.playButton?.setAttribute("aria-pressed", String(playing));
    this.pauseButton?.setAttribute("aria-pressed", String(!playing));

    if (playing) {
      this.scheduleHide(3600);
    } else {
      this.showControls();
      this.scheduleHide(4600);
    }
  }

  updatePlayback({
    currentTime,
    duration,
    playing,
    status,
    tempo,
    rate,
  }) {
    if (!Number.isFinite(currentTime)) {
      return;
    }

    const timeText = formatTime(currentTime);
    const durationText = formatTime(duration || 0);

    if (timeText !== this.lastPlayback.time) {
      this.lastPlayback.time = timeText;

      if (this.currentTimeElement) {
        this.currentTimeElement.textContent = timeText;
      }
    }

    if (durationText !== this.lastPlayback.duration) {
      this.lastPlayback.duration = durationText;

      if (this.durationElement) {
        this.durationElement.textContent = durationText;
      }
    }

    const progress =
      duration > 0
        ? Math.max(0, Math.min(100, (currentTime / duration) * 100))
        : 0;

    if (
      Math.abs(progress - this.lastPlayback.progress) > 0.15 &&
      !this.isScrubbing
    ) {
      this.lastPlayback.progress = progress;

      if (
        this.timeline &&
        document.activeElement !== this.timeline
      ) {
        this.timeline.value = String(currentTime);
      }

      this.timeline?.style.setProperty("--progress", `${progress}%`);
    }

    if (status && status !== this.lastPlayback.status) {
      this.lastPlayback.status = status;

      if (this.statusElement) {
        this.statusElement.textContent = status;
      }
    }

    if (Number.isFinite(tempo)) {
      const tempoText = String(Math.round(tempo));

      if (tempoText !== this.lastPlayback.tempo) {
        this.lastPlayback.tempo = tempoText;

        if (this.tempoValue) {
          this.tempoValue.textContent = tempoText;
        }
      }
    }

    if (Number.isFinite(rate) && rate !== this.lastPlayback.speed) {
      this.lastPlayback.speed = rate;

      this.setSpeedDisplay(rate);
    }

    this.setPlaying(playing);
  }

  setNowPlaying(title) {
    if (this.trackTitle && title) {
      this.trackTitle.textContent = title;
    }
  }

  setBusy(isBusy, message = "") {
    document.body.classList.toggle("is-busy", isBusy);

    if (message) {
      this.setStatus(message);
    }
  }

  setStatus(message) {
    if (this.statusElement && message) {
      this.statusElement.textContent = message;
    }

    this.lastPlayback.status = message;
  }

  setTempo(bpm) {
    if (this.tempoValue && Number.isFinite(bpm)) {
      const text = String(Math.round(bpm));

      this.tempoValue.textContent = text;
      this.lastPlayback.tempo = text;
    }
  }

  /* =======================================================
     TRANSICIÓN DE CARGA
     ======================================================= */

  transitionReveal(title = "") {
    if (!this.sceneWipe) {
      return;
    }

    this.clearWipeTimers();

    if (this.sceneWipeTitle) {
      this.sceneWipeTitle.textContent = title || "Live Session";
    }

    this.sceneWipe.classList.remove("is-out");
    this.sceneWipe.classList.add("is-active");

    if (this.reducedMotion) {
      this.wipeTimers.push(
        this.later(() => {
          this.sceneWipe.classList.remove("is-active");
        }, 220),
      );

      return;
    }

    this.wipeTimers.push(
      this.later(() => {
        this.sceneWipe.classList.add("is-out");
      }, 720),
    );

    this.wipeTimers.push(
      this.later(() => {
        this.sceneWipe.classList.remove("is-active", "is-out");
      }, 1480),
    );
  }

  clearWipeTimers() {
    for (const id of this.wipeTimers) {
      this.clearTimer(id);
    }

    this.wipeTimers = [];
  }

  /* =======================================================
     PREFERENCIAS DE MOVIMIENTO
     ======================================================= */

  bindMotionPreference() {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (event) => {
      this.reducedMotion = event.matches;

      if (typeof this.onReducedMotionChange === "function") {
        this.onReducedMotionChange(event.matches);
      }
    };

    if (media.addEventListener) {
      this.addListener(media, "change", handleChange);
    }
  }

  /* =======================================================
     LIMPIEZA
     ======================================================= */

  dispose() {
    for (const { target, type, handler, options } of this.listeners) {
      target.removeEventListener(type, handler, options);
    }

    this.listeners = [];

    for (const id of this.timeouts) {
      window.clearTimeout(id);
    }

    this.timeouts.clear();

    if (this.pointerFrame) {
      cancelAnimationFrame(this.pointerFrame);
      this.pointerFrame = null;
    }

    if (this.drawerCloseTimer) {
      window.clearTimeout(this.drawerCloseTimer);
      this.drawerCloseTimer = null;
    }
  }
}
