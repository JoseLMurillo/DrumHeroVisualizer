import { Midi } from "https://cdn.jsdelivr.net/npm/@tonejs/midi@2.0.28/+esm";

export class MidiManager {
  constructor() {
    this.midi = null;
    this.notes = [];
    this.duration = 0;
    this.markers = [];
    this.tempos = [];
    this.originalBpm = 120;
  }

  // CARGAR MIDI

  async load(file) {
    console.log("========================================");

    console.log("INICIANDO LECTURA DEL MIDI");

    console.log("========================================");

    console.log("Archivo:", file.name);

    console.log("Tamaño:", file.size, "bytes");

    const arrayBuffer = await file.arrayBuffer();

    console.log("ArrayBuffer obtenido:", arrayBuffer.byteLength, "bytes");

    // CREAR OBJETO MIDI

    this.midi = new Midi(arrayBuffer);

    this.tempos = this.midi.header.tempos.map((tempo) => ({
      bpm: tempo.bpm,
      time: tempo.time,
    }));

    this.originalBpm = this.tempos.length > 0 ? this.tempos[0].bpm : 120;

    console.log("MIDI interpretado correctamente.");

    // INFORMACIÓN GENERAL

    console.log("Duración:", this.midi.duration, "segundos");

    console.log("Número de pistas:", this.midi.tracks.length);

    console.log("Header MIDI:", this.midi.header);

    // MOSTRAR PISTAS

    console.log("========================================");

    console.log("PISTAS DEL MIDI");

    console.log("========================================");

    this.midi.tracks.forEach((track, index) => {
      console.log(`PISTA ${index}`);

      console.log("  Nombre:", track.name);

      console.log("  Canal:", track.channel);

      console.log("  Instrumento:", track.instrument);

      console.log("  Número de notas:", track.notes.length);

      console.log("  Notas:", track.notes);
    });

    // EXTRAER NOTAS

    this.notes = this.extractDrumNotes();

    console.log("========================================");

    console.log("NOTAS DE BATERÍA ENCONTRADAS");

    console.log("========================================");

    console.log("Cantidad:", this.notes.length);

    console.table(this.notes);

    // DURACIÓN

    this.duration = this.midi.duration;

    // MARCADORES

    this.markers = this.extractMarkers();

    return {
      notes: this.notes,

      duration: this.duration,

      markers: this.markers,
    };
  }

  // EXTRAER NOTAS

  extractDrumNotes() {
    const notes = [];

    console.log("========================================");
    console.log("EXTRAYENDO NOTAS MIDI");
    console.log("========================================");

    for (const track of this.midi.tracks) {
      console.log(
        `Analizando pista: ${track.name || "(sin nombre)"}`,
        `Canal: ${track.channel}`,
      );

      console.log(`Notas encontradas en la pista: ${track.notes.length}`);

      for (const note of track.notes) {
        console.log(`MIDI ${note.midi} | tiempo ${note.time.toFixed(3)}s`);

        notes.push({
          midi: note.midi,
          time: note.time,
          duration: note.duration,
          velocity: note.velocity,
        });
      }
    }

    notes.sort((a, b) => a.time - b.time);

    console.log("========================================");
    console.log("NOTAS EXTRAÍDAS");
    console.log("========================================");

    console.log(`Cantidad total: ${notes.length}`);

    console.table(notes.slice(0, 50));

    return notes;
  }

  // MARCADORES

  extractMarkers() {
    const markers = [];

    return markers;
  }

  // DURACIÓN

  getDuration() {
    return this.duration;
  }

  // NOTAS

  getNotes() {
    return this.notes;
  }

  // MARCADORES

  getMarkers() {
    return this.markers;
  }

  // TEMPO ORIGINAL DEL MIDI

  getOriginalBpm() {
    return this.originalBpm;
  }

  // TEMPO SEGÚN LA POSICIÓN ACTUAL

  getBpmAtTime(seconds) {
    let bpm = this.originalBpm;

    for (const tempo of this.tempos) {
      if (tempo.time <= seconds) {
        bpm = tempo.bpm;
      } else {
        break;
      }
    }

    return bpm;
  }

  async loadFromUrl(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`No se pudo cargar el MIDI: ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    this.midi = new Midi(arrayBuffer);

    this.notes = this.extractDrumNotes();

    this.duration = this.midi.duration;

    this.markers = this.extractMarkers();

    this.tempos = this.midi.header.tempos.map((tempo) => ({
      bpm: tempo.bpm,
      time: tempo.time,
    }));

    this.originalBpm = this.tempos.length > 0 ? this.tempos[0].bpm : 120;

    return {
      notes: this.notes,
      duration: this.duration,
      markers: this.markers,
    };
  }
}
