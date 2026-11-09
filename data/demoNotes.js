/* =========================================================
   DEMO — SESIÓN DE 60 SEGUNDOS
   Patrón generado para mostrar la experiencia completa.
   ========================================================= */

const BPM = 120;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const START = 2;
const BARS = 27;

const notes = [];

function add(type, time, velocity = 0.8) {
  notes.push({
    type,
    time: Number(time.toFixed(3)),
    velocity,
  });
}

for (let bar = 0; bar < BARS; bar += 1) {
  const barStart = START + bar * BAR;
  const section = Math.floor(bar / 8); // A / B / C
  const isFillBar = bar % 8 === 7;
  const isBreakdown = bar === 15;

  // -------------------------------------------------------
  // CRASH / ACENTOS DE SECCIÓN
  // -------------------------------------------------------

  if (bar % 8 === 0) {
    add("crash", barStart, 1);
  }

  if (bar === 20) {
    add("crash", barStart + BEAT * 2, 0.9);
  }

  // -------------------------------------------------------
  // BOMBO
  // -------------------------------------------------------

  add("kick", barStart, 1);
  add("kick", barStart + BEAT * 1.75, 0.72);

  if (bar % 2 === 0) {
    add("kick", barStart + BEAT * 2.5, 0.85);
  }

  if (section >= 1 && bar % 4 === 3) {
    add("kick", barStart + BEAT * 3.25, 0.68);
  }

  // -------------------------------------------------------
  // CAJA
  // -------------------------------------------------------

  if (!isBreakdown) {
    add("snare", barStart + BEAT, 0.92);
    add("snare", barStart + BEAT * 3, 0.98);
  } else {
    add("snare", barStart + BEAT * 3.5, 0.55);
  }

  // -------------------------------------------------------
  // HI-HAT / RIDE
  // -------------------------------------------------------

  if (section >= 1 && section < 3) {
    // Sección B: ride con acentos de hi-hat
    for (let i = 0; i < 4; i += 1) {
      add("ride", barStart + i * BEAT, i % 2 === 0 ? 0.78 : 0.55);

      if (i < 3) {
        add("hihat", barStart + i * BEAT + BEAT / 2, 0.42);
      }
    }
  } else {
    for (let i = 0; i < 8; i += 1) {
      add(
        "hihat",
        barStart + i * (BEAT / 2),
        i % 2 === 0 ? 0.62 : 0.36,
      );
    }
  }

  // -------------------------------------------------------
  // FILLS DE TOMS
  // -------------------------------------------------------

  if (isFillBar) {
    add("tomHigh", barStart + BEAT * 3, 0.9);
    add("tomMid", barStart + BEAT * 3.25, 0.95);
    add("floorTom", barStart + BEAT * 3.5, 1);
    add("floorTom", barStart + BEAT * 3.75, 0.7);
  }

  if (bar === 14) {
    add("tomHigh", barStart + BEAT * 2.5, 0.72);
    add("tomMid", barStart + BEAT * 2.75, 0.8);
  }
}

notes.sort((a, b) => a.time - b.time);

export const demoNotes = notes;
