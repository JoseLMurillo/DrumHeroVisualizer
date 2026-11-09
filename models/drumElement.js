import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* =========================================================
   TEXTURAS PROCEDURALES
   ========================================================= */

const textureCache = new Map();

function createWoodTexture(baseColor) {
  if (textureCache.has(baseColor)) {
    return textureCache.get(baseColor);
  }

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  const color = new THREE.Color(baseColor);

  ctx.fillStyle = `#${color.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  // Vetas verticales
  for (let i = 0; i < 90; i += 1) {
    const x = Math.random() * size;
    const width = 0.4 + Math.random() * 1.6;
    const alpha = 0.025 + Math.random() * 0.07;

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(x, 0);

    for (let y = 0; y <= size; y += 16) {
      ctx.lineTo(x + Math.sin(y * 0.035 + i) * 2.2, y);
    }

    ctx.stroke();
  }

  // Oscurecido en los bordes
  const gradient = ctx.createLinearGradient(0, 0, size, 0);
  gradient.addColorStop(0, "rgba(0,0,0,0.5)");
  gradient.addColorStop(0.2, "rgba(0,0,0,0)");
  gradient.addColorStop(0.8, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);

  textureCache.set(baseColor, texture);
  return texture;
}

function createLogoTexture() {
  if (textureCache.has("logo")) {
    return textureCache.get("logo");
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 512, 512);

  ctx.strokeStyle = "rgba(216, 255, 74, 0.85)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(256, 256, 176, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(242, 237, 226, 0.26)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 198, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f2ede2";
  ctx.font = "700 108px 'Space Grotesk', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "8px";
  ctx.fillText("PULSE", 256, 238);

  ctx.fillStyle = "rgba(242, 237, 226, 0.55)";
  ctx.font = "500 26px 'Space Grotesk', Arial, sans-serif";
  ctx.fillText("DRUM VISUALIZER", 256, 316);

  ctx.fillStyle = "rgba(216, 255, 74, 0.9)";
  ctx.fillRect(118, 278, 276, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  textureCache.set("logo", texture);
  return texture;
}

function createGlowTexture() {
  if (textureCache.has("glow")) {
    return textureCache.get("glow");
  }

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );

  gradient.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.28)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  textureCache.set("glow", texture);
  return texture;
}

/* =========================================================
   MATERIALES COMPARTIDOS
   ========================================================= */

const shared = {
  metal: null,
  darkMetal: null,
  head: null,
  headDark: null,
  chrome: null,
};

function getMetalMaterial() {
  if (!shared.metal) {
    shared.metal = new THREE.MeshStandardMaterial({
      color: 0xe2ddd0,
      metalness: 0.86,
      roughness: 0.3,
      emissive: 0x2b2416,
      emissiveIntensity: 0.34,
    });
  }

  return shared.metal;
}

function getDarkMetalMaterial() {
  if (!shared.darkMetal) {
    shared.darkMetal = new THREE.MeshStandardMaterial({
      color: 0x17171b,
      metalness: 0.72,
      roughness: 0.42,
      emissive: 0x050505,
      emissiveIntensity: 0.2,
    });
  }

  return shared.darkMetal;
}

function getHeadMaterial() {
  if (!shared.head) {
    shared.head = new THREE.MeshStandardMaterial({
      color: 0xf7f0e3,
      roughness: 0.76,
      metalness: 0.02,
      emissive: 0x2b241b,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,
    });
  }

  return shared.head;
}

function getHeadDarkMaterial() {
  if (!shared.headDark) {
    shared.headDark = new THREE.MeshStandardMaterial({
      color: 0x1c1a19,
      roughness: 0.5,
      metalness: 0.12,
      emissive: 0x080808,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide,
    });
  }

  return shared.headDark;
}

function getChromeMaterial() {
  if (!shared.chrome) {
    shared.chrome = new THREE.MeshStandardMaterial({
      color: 0xd6dbe3,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0x1c1c22,
      emissiveIntensity: 0.18,
    });
  }

  return shared.chrome;
}

function getShellMaterial(color) {
  const key = `shell-${color}`;

  if (textureCache.has(key)) {
    return textureCache.get(key);
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createWoodTexture(color),
    roughness: 0.5,
    metalness: 0.18,
    emissive: new THREE.Color(color).multiplyScalar(0.3),
    emissiveIntensity: 0.48,
    side: THREE.DoubleSide,
  });

  textureCache.set(key, material);
  return material;
}

/* =========================================================
   HELPERS GEOMÉTRICOS
   ========================================================= */

const UNIT_Y = new THREE.Vector3(0, 1, 0);

function addRod(group, start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();

  if (length < 0.0001) {
    return null;
  }

  const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    UNIT_Y,
    direction.clone().normalize(),
  );

  group.add(mesh);
  return mesh;
}

/* =========================================================
   DRUM ELEMENT
   ========================================================= */

const FLOOR_Y = -1;

export class DrumElement {
  constructor({
    name,
    position,
    color,
    radius = 1,
    height = 0.5,
    kind = null,
    floorY = FLOOR_Y,
    reducedMotion = false,
  }) {
    this.name = name;
    this.position = position.clone();
    this.color = color;
    this.radius = radius;
    this.height = height;
    this.floorY = floorY;
    this.reducedMotion = reducedMotion;

    this.hitPosition = position.clone();

    this.kind =
      kind ??
      (["crash", "ride", "hihat"].includes(name) ? "cymbal" : "drum");

    this.isCymbal = this.kind === "cymbal";

    // Estado de animación
    this.impact = 0;
    this.sway = 0;
    this.swayVelocity = 0;
    this.time = Math.random() * 10;
    this.restSway = 0;

    this.group = new THREE.Group();
    this.group.name = `drum-${name}`;
    this.group.position.copy(this.position);

    this.model = new THREE.Group();
    this.group.add(this.model);

    this.head = null;
    this.cymbalPivot = null;
    this.glow = null;
    this.accentMaterial = null;

    if (name === "kick") {
      this.buildKick();
    } else if (this.isCymbal) {
      this.buildCymbal();
    } else {
      this.buildDrum();
    }

    this.mesh = this.group;
  }

  /* =======================================================
     BOMBO
     ======================================================= */

  buildKick() {
    const r = this.radius;
    const depth = 0.86;
    const shellColor = "#18141b";
    const shellMaterial = getShellMaterial(shellColor);
    const metal = getMetalMaterial();
    const chrome = getChromeMaterial();

    // El bombo real se apoya en el suelo: corregimos su centro visual
    this.model.position.y = 0.3;

    // Casco cilíndrico horizontal
    const shellGeometry = new THREE.CylinderGeometry(
      r,
      r,
      depth,
      72,
      1,
      true,
    );
    shellGeometry.rotateX(Math.PI / 2);

    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    this.model.add(shell);

    // Aros
    const hoopGeometry = new THREE.TorusGeometry(r * 1.002, 0.045, 8, 80);

    const frontHoop = new THREE.Mesh(hoopGeometry, metal);
    frontHoop.position.z = depth / 2;
    this.model.add(frontHoop);

    const backHoop = new THREE.Mesh(hoopGeometry, metal);
    backHoop.position.z = -depth / 2;
    this.model.add(backHoop);

    // Parches
    const headGeometry = new THREE.CircleGeometry(r * 0.965, 80);

    this.head = new THREE.Mesh(headGeometry, getHeadMaterial());
    this.head.position.z = depth / 2 + 0.004;
    this.model.add(this.head);

    const backHead = new THREE.Mesh(headGeometry, getHeadDarkMaterial());
    backHead.position.z = -depth / 2 - 0.004;
    backHead.rotation.y = Math.PI;
    this.model.add(backHead);

    // Logo frontal
    const logoGeometry = new THREE.CircleGeometry(r * 0.43, 64);
    const logoMaterial = new THREE.MeshBasicMaterial({
      map: createLogoTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    logo.position.z = depth / 2 + 0.012;
    this.model.add(logo);

    // Anillo de acento
    const ringGeometry = new THREE.TorusGeometry(r * 0.9, 0.012, 6, 80);
    this.accentMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const accentring = new THREE.Mesh(ringGeometry, this.accentMaterial);
    accentring.position.z = depth / 2 + 0.018;
    this.model.add(accentring);

    // Tensoras
    const lugGeometry = new THREE.BoxGeometry(0.07, 0.16, 0.11);

    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2;

      const lug = new THREE.Mesh(lugGeometry, chrome);
      lug.position.set(
        Math.cos(angle) * r * 0.995,
        Math.sin(angle) * r * 0.995,
        0,
      );
      lug.rotation.z = angle;
      this.model.add(lug);

      const rod = addRod(
        this.model,
        new THREE.Vector3(
          Math.cos(angle) * r * 1.0,
          Math.sin(angle) * r * 1.0,
          depth / 2 + 0.02,
        ),
        new THREE.Vector3(
          Math.cos(angle) * r * 1.0,
          Math.sin(angle) * r * 1.0,
          -depth / 2 - 0.02,
        ),
        0.008,
        chrome,
      );

      rod.material = chrome;
    }

    // Patas del bombo
    const floorLocal = this.floorY - this.position.y - this.model.position.y;

    addRod(
      this.model,
      new THREE.Vector3(-r * 0.82, -r * 0.58, depth / 2 - 0.1),
      new THREE.Vector3(-r * 1.02, floorLocal, depth / 2 + 0.48),
      0.024,
      chrome,
    );

    addRod(
      this.model,
      new THREE.Vector3(r * 0.82, -r * 0.58, depth / 2 - 0.1),
      new THREE.Vector3(r * 1.02, floorLocal, depth / 2 + 0.48),
      0.024,
      chrome,
    );

    // Halo
    this.addGlow(r * 1.1, new THREE.Vector3(0, 0, depth / 2 + 0.05));
  }

  /* =======================================================
     TAMBOR (CAJA / TOMS)
     ======================================================= */

  buildDrum() {
    const r = this.radius;
    const h = this.height;
    const shellColor =
      this.name === "snare" ? "#a97a52" : "#7f5438";

    // Casco
    const shellGeometry = new THREE.CylinderGeometry(
      r,
      r * 0.985,
      h,
      64,
      1,
      true,
    );

    const shell = new THREE.Mesh(shellGeometry, getShellMaterial(shellColor));
    shell.position.y = -h / 2;
    this.model.add(shell);

    // Interior del casco
    const innerGeometry = new THREE.CylinderGeometry(
      r * 0.94,
      r * 0.94,
      h * 1.01,
      48,
      1,
      true,
    );
    const inner = new THREE.Mesh(innerGeometry, getDarkMetalMaterial());
    inner.position.y = -h / 2;
    this.model.add(inner);

    // Parches
    const headGeometry = new THREE.CircleGeometry(r * 0.965, 64);
    headGeometry.rotateX(-Math.PI / 2);

    this.head = new THREE.Mesh(headGeometry, getHeadMaterial());
    this.head.position.y = 0.004;
    this.model.add(this.head);

    const bottomHead = new THREE.Mesh(headGeometry, getHeadDarkMaterial());
    bottomHead.position.y = -h - 0.004;
    this.model.add(bottomHead);

    // Aros
    const hoopGeometry = new THREE.TorusGeometry(r * 1.008, 0.032, 8, 72);
    hoopGeometry.rotateX(Math.PI / 2);

    const topHoop = new THREE.Mesh(hoopGeometry, getMetalMaterial());
    topHoop.position.y = 0;
    this.model.add(topHoop);

    const bottomHoop = new THREE.Mesh(hoopGeometry, getMetalMaterial());
    bottomHoop.position.y = -h;
    this.model.add(bottomHoop);

    // Tensoras + varillas
    const lugGeometry = new THREE.BoxGeometry(0.055, h * 0.52, 0.11);
    const rodGeometry = new THREE.CylinderGeometry(0.009, 0.009, h, 6);
    const chrome = getChromeMaterial();

    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * r * 1.018;
      const z = Math.sin(angle) * r * 1.018;

      const lug = new THREE.Mesh(lugGeometry, getMetalMaterial());
      lug.position.set(x, -h / 2, z);
      lug.rotation.y = -angle;
      this.model.add(lug);

      const rod = new THREE.Mesh(rodGeometry, chrome);
      rod.position.set(x, -h / 2, z);
      this.model.add(rod);
    }

    // Anillo de acento superior
    const ringGeometry = new THREE.TorusGeometry(r * 1.0, 0.013, 6, 72);
    ringGeometry.rotateX(Math.PI / 2);

    this.accentMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    const accentRing = new THREE.Mesh(ringGeometry, this.accentMaterial);
    accentRing.position.y = 0.022;
    this.model.add(accentRing);

    // Halo superior
    this.addGlow(r * 1.25, new THREE.Vector3(0, 0.06, 0));

    // Soporte
    const floorLocal = this.floorY - this.position.y;
    const standTop = -h;
    const standBottom = floorLocal;

    addRod(
      this.model,
      new THREE.Vector3(0, standTop, 0),
      new THREE.Vector3(0, standBottom, 0),
      0.028,
      getChromeMaterial(),
    );

    // Trípode
    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;

      addRod(
        this.model,
        new THREE.Vector3(0, standBottom + 0.55, 0),
        new THREE.Vector3(
          Math.cos(angle) * 0.62,
          standBottom,
          Math.sin(angle) * 0.62,
        ),
        0.019,
        getMetalMaterial(),
      );
    }

    // Patas extra para el floor tom
    if (this.name === "floorTom") {
      for (let i = 0; i < 3; i += 1) {
        const angle = (i / 3) * Math.PI * 2;

        addRod(
          this.model,
          new THREE.Vector3(
            Math.cos(angle) * r * 0.92,
            -h * 0.38,
            Math.sin(angle) * r * 0.92,
          ),
          new THREE.Vector3(
            Math.cos(angle) * r * 1.18,
            floorLocal,
            Math.sin(angle) * r * 1.18,
          ),
          0.018,
          getChromeMaterial(),
        );
      }
    }

    // Detalle de caja: tensores laterales
    if (this.name === "snare") {
      const stripeGeometry = new THREE.TorusGeometry(r * 1.012, 0.012, 5, 64);
      stripeGeometry.rotateX(Math.PI / 2);
      const stripe = new THREE.Mesh(stripeGeometry, getChromeMaterial());
      stripe.position.y = -h * 0.28;
      this.model.add(stripe);
    }
  }

  /* =======================================================
     PLATILLO
     ======================================================= */

  buildCymbal() {
    const r = this.radius;
    const isHihat = this.name === "hihat";
    const baseColor =
      this.name === "crash" ? 0xe6c777 : this.name === "ride" ? 0xc9a657 : 0xd4b36b;

    const cymbalMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      metalness: 0.85,
      roughness: 0.28,
      emissive: new THREE.Color(baseColor).multiplyScalar(0.24),
      emissiveIntensity: 0.48,
      side: THREE.DoubleSide,
    });

    const createCymbalMesh = (radius, thickness = 1) => {
      const points = [
        new THREE.Vector2(0.001, 0.075 * thickness),
        new THREE.Vector2(radius * 0.08, 0.07 * thickness),
        new THREE.Vector2(radius * 0.16, 0.045 * thickness),
        new THREE.Vector2(radius * 0.28, 0.016 * thickness),
        new THREE.Vector2(radius * 0.55, 0.0),
        new THREE.Vector2(radius * 0.78, 0.003 * thickness),
        new THREE.Vector2(radius * 0.94, 0.015 * thickness),
        new THREE.Vector2(radius, 0.03 * thickness),
      ];

      const geometry = new THREE.LatheGeometry(points, 72);
      return new THREE.Mesh(geometry, cymbalMaterial);
    };

    this.cymbalPivot = new THREE.Group();

    if (isHihat) {
      this.cymbalPivot.position.y = 0.02;
      this.restSway = 0;

      const bottom = createCymbalMesh(r * 0.94, 0.8);
      bottom.position.y = -0.095;
      this.model.add(bottom);

      const top = createCymbalMesh(r, 1);
      this.cymbalPivot.add(top);

      // Clutch central
      addRod(
        this.cymbalPivot,
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(0, 0.32, 0),
        0.012,
        getChromeMaterial(),
      );
    } else {
      this.cymbalPivot.rotation.z = this.name === "crash" ? 0.09 : 0.05;
      this.cymbalPivot.rotation.x = this.name === "crash" ? 0.055 : 0.03;

      this.cymbalPivot.add(createCymbalMesh(r, 1));
    }

    this.model.add(this.cymbalPivot);

    // Campana
    const bellGeometry = new THREE.SphereGeometry(r * 0.16, 24, 16);
    const bell = new THREE.Mesh(bellGeometry, getMetalMaterial());
    bell.scale.set(1, 0.42, 1);
    bell.position.y = 0.06;
    this.cymbalPivot.add(bell);

    // Halo
    this.addGlow(r * 1.18, new THREE.Vector3(0, -0.03, 0));

    // Anillo de acento
    const ringGeometry = new THREE.RingGeometry(r * 1.01, r * 1.09, 64);
    ringGeometry.rotateX(-Math.PI / 2);

    this.accentMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    const accentRing = new THREE.Mesh(ringGeometry, this.accentMaterial);
    accentRing.position.y = -0.04;
    this.model.add(accentRing);

    // Soporte
    const floorLocal = this.floorY - this.position.y;

    addRod(
      this.model,
      new THREE.Vector3(0, isHihat ? -0.1 : -0.02, 0),
      new THREE.Vector3(0, floorLocal, 0),
      0.024,
      getChromeMaterial(),
    );

    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;

      addRod(
        this.model,
        new THREE.Vector3(0, floorLocal + 0.55, 0),
        new THREE.Vector3(
          Math.cos(angle) * 0.6,
          floorLocal,
          Math.sin(angle) * 0.6,
        ),
        0.018,
        getMetalMaterial(),
      );
    }

    // Brazo de boom para crash / ride
    if (!isHihat) {
      const boomAngle = this.name === "crash" ? -1 : 1;

      addRod(
        this.model,
        new THREE.Vector3(0, floorLocal + 0.55, 0),
        new THREE.Vector3(boomAngle * 0.32, -0.28, 0.1),
        0.016,
        getChromeMaterial(),
      );
    }
  }

  /* =======================================================
     HALO
     ======================================================= */

  addGlow(scale, position) {
    const material = new THREE.SpriteMaterial({
      map: createGlowTexture(),
      color: this.color,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    this.glow = new THREE.Sprite(material);
    this.glow.scale.set(scale, scale, 1);
    this.glow.position.copy(position);
    this.model.add(this.glow);
  }

  /* =======================================================
     GOLPE
     ======================================================= */

  hit(strength = 1) {
    this.impact = Math.min(1.6, this.impact + strength);

    if (this.isCymbal) {
      this.swayVelocity += 4.8 * strength;
    }
  }

  reset() {
    this.impact = 0;
    this.sway = 0;
    this.swayVelocity = 0;

    if (this.head) {
      this.head.scale.set(1, 1, 1);
    }

    if (this.accentMaterial) {
      this.accentMaterial.opacity = this.isCymbal ? 0.35 : 0.6;
    }

    if (this.glow) {
      this.glow.material.opacity = 0.12;
    }
  }

  /* =======================================================
     ACTUALIZACIÓN
     ======================================================= */

  update(delta) {
    if (this.reducedMotion) {
      this.impact = Math.max(0, this.impact - delta * 6);

      if (this.accentMaterial) {
        const base = this.isCymbal ? 0.35 : 0.6;
        this.accentMaterial.opacity = base + this.impact * 0.3;
      }

      return;
    }

    this.time += delta;

    // Decaimiento del impacto
    this.impact = Math.max(0, this.impact - delta * 4.6);

    // Respiración sutil
    const breath = 0.06 + Math.sin(this.time * 0.9) * 0.02;

    if (this.head) {
      const ripple = this.impact * 0.075;
      this.head.scale.set(1 + ripple, 1, 1 + ripple);
    }

    if (this.isCymbal && this.cymbalPivot) {
      // Oscilador amortiguado
      const stiffness = this.name === "hihat" ? 120 : 46;
      const damping = this.name === "hihat" ? 8 : 4.2;

      this.swayVelocity +=
        (-this.sway * stiffness - this.swayVelocity * damping) * delta;

      this.sway += this.swayVelocity * delta;

      const baseZ = this.name === "crash" ? 0.09 : this.name === "ride" ? 0.05 : 0;
      const baseX = this.name === "crash" ? 0.055 : this.name === "ride" ? 0.03 : 0;

      this.cymbalPivot.rotation.z = baseZ + this.sway * 0.16;
      this.cymbalPivot.rotation.x = baseX + this.sway * 0.09;
      this.cymbalPivot.position.y =
        (this.name === "hihat" ? 0.02 : 0) + Math.abs(this.sway) * 0.025;
    }

    if (this.accentMaterial) {
      const base = this.isCymbal ? 0.35 : 0.6;
      this.accentMaterial.opacity = base + this.impact * 0.35;
    }

    if (this.glow) {
      this.glow.material.opacity = breath + this.impact * 0.55;
      const glowScale =
        (this.kind === "kick" ? this.radius * 1.1 : this.radius * 1.2) *
        (1 + this.impact * 0.18);
      this.glow.scale.set(glowScale, glowScale, 1);
    }
  }

  /* =======================================================
     ESCENA / LIMPIEZA
     ======================================================= */

  addToScene(scene) {
    scene.add(this.group);
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material && child.material !== this.accentMaterial) {
        child.material.dispose?.();
      }
    });

    this.accentMaterial?.dispose();
  }
}
