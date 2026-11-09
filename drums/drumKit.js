import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import { DrumElement } from "../models/drumElement.js";

export class DrumKit {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.reducedMotion = options.reducedMotion ?? false;
    this.floorY = options.floorY ?? -1;

    this.elements = {};

    // -------------------------
    // MAPA MIDI
    // -------------------------

    this.midiMap = {
      // =====================================================
      // MAPA DEL MIDI ACTUAL
      // Fruity DrumSynth Live
      // =====================================================

      // Bombo
      103: "kick",

      // Caja
      107: "snare",

      // Hi-hat cerrado
      102: "hihat",

      // Hi-hat abierto
      89: "hihat",

      // Ride
      105: "ride",

      // Crash
      87: "crash",

      // Toms
      96: "tomHigh",
      98: "tomMid",
      97: "floorTom",
    };

    // -------------------------
    // CREAR BATERÍA
    // -------------------------

    this.createKit();
  }

  /* ========================================================
     CREAR ELEMENTO
     ======================================================== */

  createElement(name, options) {
    const element = new DrumElement({
      name,
      position: options.position,
      color: options.color,
      radius: options.radius,
      height: options.height,
      kind: options.kind,
      floorY: this.floorY,
      reducedMotion: this.reducedMotion,
    });

    element.addToScene(this.scene);
    this.elements[name] = element;

    return element;
  }

  /* ========================================================
     CREAR BATERÍA
     ======================================================== */

  createKit() {
    // BOMBO
    this.createElement("kick", {
      position: new THREE.Vector3(0, 0, 0),
      color: 0x7194ff,
      radius: 1.4,
      height: 0.8,
    });

    // CAJA
    this.createElement("snare", {
      position: new THREE.Vector3(-2, 1, 0),
      color: 0xff6b6b,
      radius: 0.7,
      height: 0.4,
    });

    // HI-HAT
    this.createElement("hihat", {
      position: new THREE.Vector3(-3.2, 1.2, 0),
      color: 0xffd166,
      radius: 0.8,
      height: 0.2,
    });

    // TOM HIGH
    this.createElement("tomHigh", {
      position: new THREE.Vector3(-1, 1.8, -0.5),
      color: 0xff9f43,
      radius: 0.75,
      height: 0.4,
    });

    // TOM MID
    this.createElement("tomMid", {
      position: new THREE.Vector3(1, 1.8, -0.5),
      color: 0xff7a45,
      radius: 0.85,
      height: 0.4,
    });

    // FLOOR TOM
    this.createElement("floorTom", {
      position: new THREE.Vector3(2.3, 0.7, 0),
      color: 0xffc857,
      radius: 1,
      height: 0.6,
    });

    // CRASH
    this.createElement("crash", {
      position: new THREE.Vector3(-3.5, 2.8, 0),
      color: 0xdcff65,
      radius: 1,
      height: 0.15,
    });

    // RIDE
    this.createElement("ride", {
      position: new THREE.Vector3(3.5, 2.5, 0),
      color: 0x7ce8ff,
      radius: 1.1,
      height: 0.15,
    });
  }

  /* ========================================================
     OBTENER ELEMENTO
     ======================================================== */

  getElement(name) {
    return this.elements[name];
  }

  /* ========================================================
     OBTENER POSICIÓN DE IMPACTO
     ======================================================== */

  getHitPosition(name) {
    const element = this.getElement(name);

    if (!element) {
      console.warn(`Drum element "${name}" not found`);

      return null;
    }

    return element.hitPosition;
  }

  /* ========================================================
     GOLPEAR POR NOMBRE
     ======================================================== */

  hit(name, strength = 1) {
    const element = this.elements[name];

    if (!element) {
      console.warn(`Drum element "${name}" not found`);

      return;
    }

    element.hit(strength);
  }

  /* ========================================================
     GOLPEAR POR MIDI
     ======================================================== */

  hitMidi(midiNote, strength = 1) {
    const drumName = this.midiMap[midiNote];

    if (!drumName) {
      console.warn(`MIDI note ${midiNote} is not mapped`);

      return;
    }

    this.hit(drumName, strength);
  }

  /* ========================================================
     ACTUALIZAR ANIMACIONES
     ======================================================== */

  update(delta) {
    for (const element of Object.values(this.elements)) {
      element.update(delta);
    }
  }

  /* ========================================================
     RESET
     ======================================================== */

  resetAll() {
    for (const element of Object.values(this.elements)) {
      element.reset();
    }
  }

  getNameFromMidi(midiNote) {
    return this.midiMap[midiNote];
  }

  /* ========================================================
     LIMPIEZA
     ======================================================== */

  dispose() {
    for (const element of Object.values(this.elements)) {
      this.scene.remove(element.group);
      element.dispose();
    }

    this.elements = {};
  }
}
