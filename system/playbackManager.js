export class PlaybackManager {
  constructor(audioManager) {
    this.audioManager = audioManager;

    this.currentTime = 0;

    this.duration = 0;

    this.playing = false;

    this.playbackRate = 1;
  }

  // ========================================================
  // DURACIÓN
  // ========================================================

  setDuration(duration) {
    this.duration = duration;

    /*
            Si el tiempo actual quedó fuera
            de la nueva duración, lo corregimos.
        */

    if (this.currentTime > this.duration) {
      this.currentTime = this.duration;
    }
  }

  // ========================================================
  // PLAY
  // ========================================================

  play() {
    /*
            Si llegamos al final,
            comenzamos nuevamente.
        */

    if (this.currentTime >= this.duration) {
      this.setTime(0);
    }

    this.playing = true;

    /*
            Si existe un archivo de audio,
            lo reproducimos.

            El audio será nuestro reloj
            cuando exista.
        */

    if (this.audioManager) {
      this.audioManager.play();
    }
  }

  // ========================================================
  // PAUSE
  // ========================================================

  pause() {
    this.playing = false;

    if (this.audioManager) {
      this.audioManager.pause();
    }
  }

  // ========================================================
  // STOP
  // ========================================================

  stop() {
    this.playing = false;

    this.currentTime = 0;

    if (this.audioManager) {
      this.audioManager.stop();
    }
  }

  // ========================================================
  // RETROCEDER
  // ========================================================

  backward(seconds = 5) {
    this.setTime(this.currentTime - seconds);
  }

  // ========================================================
  // AVANZAR
  // ========================================================

  forward(seconds = 5) {
    this.setTime(this.currentTime + seconds);
  }

  // ========================================================
  // SEEK ABSOLUTO
  // ========================================================

  seek(seconds) {
    this.setTime(seconds);
  }

  // ========================================================
  // ESTABLECER TIEMPO
  // ========================================================

  setTime(seconds) {
    this.currentTime = Math.max(
      0,

      Math.min(seconds, this.duration),
    );

    /*
            Mantener el audio exactamente
            en el mismo instante.
        */

    if (this.audioManager) {
      this.audioManager.setTime(this.currentTime);
    }
  }

  // ========================================================
  // ACTUALIZAR
  // ========================================================

  update(delta = 0) {
    /*
            Si hay audio cargado,
            usamos su tiempo como reloj.
        */

    if (this.playing && this.audioManager && this.audioManager.hasAudio()) {
      this.currentTime = this.audioManager.getTime();
    } else if (this.playing) {
      /*
            Si todavía no hay audio,
            utilizamos un reloj interno.

            Esto permite continuar trabajando
            con demoNotes sin necesidad de
            tener una canción cargada.
        */
      this.currentTime += delta * this.playbackRate;
    }

    /*
            Llegamos al final.
        */

    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration;

      this.playing = false;
    }
  }

  // ========================================================
  // ESTADO
  // ========================================================

  isPlaying() {
    return this.playing;
  }

  getTime() {
    return this.currentTime;
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;

    if (this.audioManager && this.audioManager.hasAudio()) {
      this.audioManager.setPlaybackRate(rate);
    }
  }
}
