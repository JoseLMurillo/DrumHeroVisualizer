export class AudioManager {
  constructor() {
    this.audio = new Audio();
    this.hasLoadedAudio = false;
    this.objectUrl = null;
    this.playbackRate = 1;
  }

  // ========================================================
  // CARGAR AUDIO
  // ========================================================

  load(file) {
    /*
            Si ya había un audio cargado,
            liberamos su URL anterior.
        */

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }

    /*
            Creamos una URL temporal
            para el archivo seleccionado.
        */

    this.objectUrl = URL.createObjectURL(file);

    this.audio.pause();

    this.audio.src = this.objectUrl;

    this.audio.load();

    this.audio.playbackRate =
    this.playbackRate ?? 1;

    this.hasLoadedAudio = true;
  }

  // ========================================================
  // ¿HAY AUDIO?
  // ========================================================

  hasAudio() {
    return this.hasLoadedAudio;
  }

  // ========================================================
  // PLAY
  // ========================================================

  play() {
    if (!this.hasLoadedAudio) {
      return;
    }

    return this.audio.play();
  }

  // ========================================================
  // PAUSE
  // ========================================================

  pause() {
    if (!this.hasLoadedAudio) {
      return;
    }

    this.audio.pause();
  }

  // ========================================================
  // STOP
  // ========================================================

  stop() {
    if (!this.hasLoadedAudio) {
      return;
    }

    this.audio.pause();

    this.audio.currentTime = 0;
  }

  // ========================================================
  // CAMBIAR TIEMPO
  // ========================================================

  setTime(seconds) {
    if (!this.hasLoadedAudio) {
      return;
    }

    /*
            Evitamos intentar colocar el audio
            fuera de su duración.
        */

    if (Number.isFinite(this.audio.duration)) {
      seconds = Math.max(0, Math.min(seconds, this.audio.duration));
    }

    this.audio.currentTime = seconds;
  }

  // ========================================================
  // OBTENER TIEMPO
  // ========================================================

  getTime() {
    if (!this.hasLoadedAudio) {
      return 0;
    }

    return this.audio.currentTime;
  }

  // ========================================================
  // DURACIÓN
  // ========================================================

  getDuration() {
    if (!this.hasLoadedAudio) {
      return 0;
    }

    return this.audio.duration;
  }

  // ========================================================
  // ¿TERMINÓ?
  // ========================================================

  hasEnded() {
    if (!this.hasLoadedAudio) {
      return false;
    }

    return this.audio.ended;
  }

  setPlaybackRate(rate) {
    if (!this.hasLoadedAudio) {
      return;
    }

    this.audio.playbackRate = rate;
  }

  loadFromUrl(url) {

    if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = null;
    }

    this.audio.pause();

    this.audio.src = url;

    this.audio.playbackRate =
        this.playbackRate ?? 1;

    this.audio.load();

    this.hasLoadedAudio = true;
}
}
