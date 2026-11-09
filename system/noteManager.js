import { Note } from "../models/note.js";

const START_Z = -30;

export class NoteManager {
  constructor(scene, drumKit, travelTime = 3) {
    this.scene = scene;
    this.drumKit = drumKit;
    this.travelTime = travelTime;

    this.notes = [];

    this.lastTime = null;

    // Movimiento reducido: conserva el viaje esencial
    // pero elimina giros y oscilaciones decorativas.
    this.reducedMotion = false;

    // Callback de impacto: main.js conecta aquí
    // los efectos visuales y la animación del tambor.
    this.onHit = null;
  }

  /* =========================================================
     CARGAR NOTAS DE PRUEBA
     ========================================================= */

  loadNotes(noteData) {
    this.clear();

    for (const data of noteData) {
      this.addNote(data);
    }

    this.sortNotes();
  }

  /* =========================================================
     CARGAR NOTAS DESDE MIDI
     ========================================================= */

  loadMidiNotes(midiNotes) {
    this.clear();

    let skipped = 0;

    for (const data of midiNotes) {
      const type = this.drumKit.getNameFromMidi(data.midi);

      if (!type) {
        skipped += 1;
        continue;
      }

      this.addNote({
        type,
        time: data.time,
        velocity: data.velocity,
      });
    }

    this.sortNotes();

    console.info(
      `[PULSE] ${this.notes.length} notas visuales creadas` +
        (skipped ? ` · ${skipped} MIDI sin mapeo` : ""),
    );
  }

  sortNotes() {
    this.notes.sort((a, b) => a.time - b.time);
  }

  /* =========================================================
     CREAR UNA NOTA
     ========================================================= */

  addNote(data) {
    const note = new Note(data);

    const drum = this.drumKit.elements[note.type];

    if (!drum) {
      console.warn(
        `No existe un elemento de batería para: ${note.type}`,
      );

      return null;
    }

    note.addToScene(this.scene);

    note.targetPosition = drum.position.clone();

    note.object.position.set(
      drum.position.x,
      drum.position.y,
      START_Z,
    );

    note.object.visible = false;

    this.notes.push(note);

    return note;
  }

  /* =========================================================
     ACTUALIZAR TODAS LAS NOTAS
     ========================================================= */

  update(currentTime, delta = 0) {
    // Detecta saltos de timeline para no disparar
    // una ráfaga de impactos al hacer seek.
    if (
      this.lastTime !== null &&
      Math.abs(currentTime - this.lastTime) > 0.55
    ) {
      this.resetActivity();
    }

    this.lastTime = currentTime;

    for (const note of this.notes) {
      this.updateNote(note, currentTime, delta);
    }
  }

  resetActivity() {
    for (const note of this.notes) {
      note.wasActive = false;
      note.hitTriggered = false;
    }
  }

  /* =========================================================
     ACTUALIZAR UNA NOTA
     ========================================================= */

  updateNote(note, currentTime, delta) {
    const object = note.object;

    if (!object) {
      return;
    }

    const timeUntilHit = note.time - currentTime;

    // -----------------------------------------------------
    // Todavía falta demasiado tiempo
    // -----------------------------------------------------

    if (timeUntilHit > this.travelTime) {
      if (object.visible) {
        object.visible = false;
      }

      note.wasActive = false;
      note.hitTriggered = false;

      return;
    }

    // -----------------------------------------------------
    // La nota ya pasó
    // -----------------------------------------------------

    if (timeUntilHit <= 0) {
      if (note.wasActive && !note.hitTriggered) {
        note.hitTriggered = true;

        this.triggerHit(note);
      }

      object.visible = false;
      note.wasActive = false;

      return;
    }

    // -----------------------------------------------------
    // La nota debe estar visible
    // -----------------------------------------------------

    object.visible = true;
    note.wasActive = true;

    // -----------------------------------------------------
    // Progreso del viaje
    // 0 = aparece · 1 = llega al instrumento
    // -----------------------------------------------------

    const progress = 1 - timeUntilHit / this.travelTime;

    // -----------------------------------------------------
    // Trayectoria: se conserva el desplazamiento original
    // sobre Z y la posición exacta del instrumento en X/Y.
    // -----------------------------------------------------

    object.position.x = note.targetPosition.x;
    object.position.y = note.targetPosition.y;
    object.position.z =
      START_Z + (note.targetPosition.z - START_Z) * progress;

    // -----------------------------------------------------
    // Escala: entrada, aproximación y pulso final
    // -----------------------------------------------------

    const reveal = Math.min(1, progress / 0.14);
    const proximity = 0.52 + progress * 1.02;
    const impactPulse = Math.max(0, (progress - 0.87) / 0.13);

    const scale =
      note.baseScale *
      proximity *
      (0.55 + reveal * 0.45) *
      (1 + impactPulse * 0.28);

    object.scale.setScalar(scale);

    // -----------------------------------------------------
    // Rotación sutil del núcleo
    // -----------------------------------------------------

    if (note.core && !this.reducedMotion) {
      const spin = note.style.spin;

      note.core.rotation.x =
        note.phase + currentTime * 0.55 * spin;

      note.core.rotation.y =
        note.phase * 0.7 + currentTime * 0.82 * spin;

      note.core.rotation.z =
        note.phase * 0.4 + currentTime * 0.36 * spin;
    }

    // -----------------------------------------------------
    // Micro-oscilación cercana al impacto
    // -----------------------------------------------------

    if (delta > 0 && progress > 0.72 && !this.reducedMotion) {
      const wobble = Math.sin(currentTime * 26 + note.phase) * 0.012;

      object.position.x += wobble;
    }
  }

  /* =========================================================
     IMPACTO
     ========================================================= */

  triggerHit(note) {
    if (typeof this.onHit === "function") {
      this.onHit({
        note,
        type: note.type,
        position: note.targetPosition,
        color: note.color,
        velocity: note.velocity,
      });
    }
  }

  /* =========================================================
     LIMPIAR TODAS LAS NOTAS
     ========================================================= */

  clear() {
    for (const note of this.notes) {
      if (note.object) {
        this.scene.remove(note.object);
        note.dispose();
      }
    }

    this.notes = [];
    this.lastTime = null;
  }

  /* =========================================================
     ESTADÍSTICAS / LIMPIEZA
     ========================================================= */

  getNoteCount() {
    return this.notes.length;
  }

  dispose() {
    this.clear();
    this.onHit = null;
  }
}
