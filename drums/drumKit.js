import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import { DrumElement } from "../models/drumElement.js";

export class DrumKit {
  constructor(scene) {
    this.scene = scene;

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

  // ========================================================
  // CREAR BATERÍA
  // ========================================================

  createKit() {
    // ====================================================
    // BOMBO
    // ====================================================

    this.elements.kick = new DrumElement({
      name: "kick",

      position: new THREE.Vector3(0, 0, 0),

      color: 0x4444ff,

      radius: 1.4,

      height: 0.8,
    });

    // ====================================================
    // SNARE
    // ====================================================

    this.elements.snare = new DrumElement({
      name: "snare",

      position: new THREE.Vector3(-2, 1, 0),

      color: 0xff4444,

      radius: 0.7,

      height: 0.4,
    });

    // ====================================================
    // HI-HAT
    // ====================================================

    this.elements.hihat = new DrumElement({
      name: "hihat",

      position: new THREE.Vector3(-3.2, 1.2, 0),

      color: 0xffff44,

      radius: 0.8,

      height: 0.2,
    });

    // ====================================================
    // TOM HIGH
    // ====================================================

    this.elements.tomHigh = new DrumElement({
      name: "tomHigh",

      position: new THREE.Vector3(-1, 1.8, -0.5),

      color: 0xff8844,

      radius: 0.75,

      height: 0.4,
    });

    // ====================================================
    // TOM MID
    // ====================================================

    this.elements.tomMid = new DrumElement({
      name: "tomMid",

      position: new THREE.Vector3(1, 1.8, -0.5),

      color: 0xff8844,

      radius: 0.85,

      height: 0.4,
    });

    // ====================================================
    // FLOOR TOM
    // ====================================================

    this.elements.floorTom = new DrumElement({
      name: "floorTom",

      position: new THREE.Vector3(2.3, 0.7, 0),

      color: 0xff8844,

      radius: 1,

      height: 0.6,
    });

    // ====================================================
    // CRASH
    // ====================================================

    this.elements.crash = new DrumElement({
      name: "crash",

      position: new THREE.Vector3(-3.5, 2.8, 0),

      color: 0xffff88,

      radius: 1,

      height: 0.15,
    });

    // ====================================================
    // RIDE
    // ====================================================

    this.elements.ride = new DrumElement({
      name: "ride",

      position: new THREE.Vector3(3.5, 2.5, 0),

      color: 0xffff88,

      radius: 1.1,

      height: 0.15,
    });

    // ====================================================
    // AÑADIR A LA ESCENA
    // ====================================================

    for (const element of Object.values(this.elements)) {
      element.addToScene(this.scene);
    }
  }

  // ========================================================
  // OBTENER ELEMENTO
  // ========================================================

  getElement(name) {
    return this.elements[name];
  }

  // ========================================================
  // OBTENER POSICIÓN DE IMPACTO
  // ========================================================

  getHitPosition(name) {
    const element = this.getElement(name);

    if (!element) {
      console.warn(`Drum element "${name}" not found`);

      return null;
    }

    return element.hitPosition;
  }

  // ========================================================
  // GOLPEAR POR NOMBRE
  // ========================================================

  hit(name) {
    const element = this.elements[name];

    if (!element) {
      console.warn(`Drum element "${name}" not found`);

      return;
    }

    element.hit();
  }

  // ========================================================
  // GOLPEAR POR MIDI
  // ========================================================

  hitMidi(midiNote) {
    const drumName = this.midiMap[midiNote];

    if (!drumName) {
      console.warn(`MIDI note ${midiNote} is not mapped`);

      return;
    }

    this.hit(drumName);
  }

  // ========================================================
  // RESET
  // ========================================================

  resetAll() {
    for (const element of Object.values(this.elements)) {
      element.reset();
    }
  }

  getNameFromMidi(midiNote) {
    return this.midiMap[midiNote];
  }
}
