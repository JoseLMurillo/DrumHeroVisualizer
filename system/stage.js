import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* =========================================================
   ESCENARIO
   Capas de profundidad, luz volumétrica falsa y cámara.
   ========================================================= */

const BASE_FOV = 16.5;

function createFloorTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.05,
    size / 2,
    size / 2,
    size * 0.56,
  );

  gradient.addColorStop(0, "#22202a");
  gradient.addColorStop(0.26, "#141318");
  gradient.addColorStop(0.62, "#0b0a0d");
  gradient.addColorStop(1, "#050505");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Retícula
  ctx.strokeStyle = "rgba(242, 237, 226, 0.035)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(242, 237, 226, 0.075)";

  for (let i = 0; i <= size; i += 256) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Anillos de escenario
  const rings = [
    [0.17, "rgba(216, 255, 74, 0.11)"],
    [0.29, "rgba(255, 138, 31, 0.09)"],
    [0.41, "rgba(242, 237, 226, 0.05)"],
  ];

  for (const [radius, color] of rings) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Brillo central cálido
  const centerGlow = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size * 0.24,
  );

  centerGlow.addColorStop(0, "rgba(255, 138, 31, 0.13)");
  centerGlow.addColorStop(0.4, "rgba(255, 138, 31, 0.04)");
  centerGlow.addColorStop(1, "rgba(255, 138, 31, 0)");

  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  return texture;
}

function createMoteTexture() {
  const size = 64;
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

  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.32, "rgba(255,255,255,0.42)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

export class Stage {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.reducedMotion = options.reducedMotion ?? false;
    this.floorY = options.floorY ?? -1;
    this.isCoarse = options.isCoarse ?? false;

    this.time = 0;
    this.pulseEnergy = 0;

    this.pointer = { x: 0, y: 0 };
    this.pointerTarget = { x: 0, y: 0 };

    this.introProgress = this.reducedMotion ? 1 : 0;

    this.camera = null;

    this.beams = [];
    this.beamPools = [];
    this.bgRings = [];
    this.lights = [];

    this.createAtmosphere();
    this.createFloor();
    this.createBackdrop();
    this.createBeams();
    this.createParticles();
    this.createCamera();
  }

  /* =======================================================
     ATMÓSFERA / LUCES
     ======================================================= */

  createAtmosphere() {
    this.scene.background = new THREE.Color(0x050506);
    this.scene.fog = new THREE.Fog(0x050506, 34, 115);

    const ambient = new THREE.AmbientLight(0xffffff, 0.48);
    this.scene.add(ambient);

    const hemisphere = new THREE.HemisphereLight(0x9d98ff, 0x0c0805, 0.6);
    this.scene.add(hemisphere);

    const key = new THREE.DirectionalLight(0xfff2dc, 2.8);
    key.position.set(7, 14, 12);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x7fb0ff, 1.55);
    rim.position.set(-8, 9, -10);
    this.scene.add(rim);

    const warm = new THREE.PointLight(0xff8a1f, 42, 34, 2);
    warm.position.set(-6.5, 7.5, 5.5);
    this.scene.add(warm);

    const cool = new THREE.PointLight(0x5b7dff, 32, 30, 2);
    cool.position.set(6.5, 5.5, -3.5);
    this.scene.add(cool);

    const top = new THREE.PointLight(0xd8ff4a, 24, 22, 2);
    top.position.set(0, 9.5, 1.5);
    this.scene.add(top);

    // Foco principal sobre los parches
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 1, 0);
    this.scene.add(spotTarget);

    const kitSpot = new THREE.SpotLight(
      0xffd9a6,
      150,
      52,
      Math.PI / 7,
      0.7,
      1.15,
    );

    kitSpot.position.set(2.5, 19, 11);
    kitSpot.target = spotTarget;
    this.scene.add(kitSpot);

    this.lights = { warm, cool, top, kitSpot };
  }

  /* =======================================================
     SUELO
     ======================================================= */

  createFloor() {
    this.floorTexture = createFloorTexture();

    const geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      map: this.floorTexture,
      color: 0xffffff,
      roughness: 0.68,
      metalness: 0.48,
      emissive: 0x2a252d,
      emissiveMap: this.floorTexture,
      emissiveIntensity: 0.42,
    });

    this.floor = new THREE.Mesh(geometry, material);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = this.floorY;
    this.scene.add(this.floor);

    // Tarima
    const riserGeometry = new THREE.CylinderGeometry(6.4, 6.7, 0.16, 96, 1);
    const riserMaterial = new THREE.MeshStandardMaterial({
      color: 0x121116,
      roughness: 0.54,
      metalness: 0.62,
      emissive: 0x0a090c,
      emissiveIntensity: 0.3,
    });

    this.riser = new THREE.Mesh(riserGeometry, riserMaterial);
    this.riser.position.y = this.floorY - 0.075;
    this.scene.add(this.riser);

    // Filo de la tarima
    const rimGeometry = new THREE.TorusGeometry(6.4, 0.022, 8, 128);
    rimGeometry.rotateX(Math.PI / 2);

    this.riserRimMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8a1f,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    this.riserRim = new THREE.Mesh(rimGeometry, this.riserRimMaterial);
    this.riserRim.position.y = this.floorY - 0.006;
    this.scene.add(this.riserRim);

    // Aro decorativo exterior
    const outerRingGeometry = new THREE.TorusGeometry(9.4, 0.012, 6, 140);
    outerRingGeometry.rotateX(Math.PI / 2);

    this.outerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xd8ff4a,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    this.outerRing = new THREE.Mesh(outerRingGeometry, this.outerRingMaterial);
    this.outerRing.position.y = this.floorY + 0.01;
    this.scene.add(this.outerRing);
  }

  /* =======================================================
     FONDO
     ======================================================= */

  createBackdrop() {
    // Rejillas verticales de luz, detrás del kit
    const slats = [];
    const colors = [0xff8a1f, 0x5b7dff, 0xd8ff4a];

    for (let i = 0; i < 9; i += 1) {
      const height = 5.5 + (i % 3) * 2.2;

      const geometry = new THREE.BoxGeometry(0.045, height, 0.045);
      const material = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.26,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });

      const slat = new THREE.Mesh(geometry, material);
      slat.position.set(-11 + i * 2.75, this.floorY + height / 2 + 0.1, -15.5);
      this.scene.add(slat);

      slats.push(slat);
    }

    this.slats = slats;

    // Aros de fondo
    const ringGeometries = [
      new THREE.TorusGeometry(6.6, 0.012, 6, 160),
      new THREE.TorusGeometry(9.2, 0.008, 6, 160),
    ];

    const ringColors = [0xff8a1f, 0xd8ff4a];

    for (let i = 0; i < ringGeometries.length; i += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: ringColors[i],
        transparent: true,
        opacity: i === 0 ? 0.17 : 0.11,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });

      const ring = new THREE.Mesh(ringGeometries[i], material);
      ring.position.set(0, 5.4, -14.5 - i * 1.4);
      ring.rotation.z = i * 0.4;
      this.scene.add(ring);

      this.bgRings.push(ring);
    }

    // Halos difusos del fondo
    this.haze = new THREE.Group();

    for (let i = 0; i < 3; i += 1) {
      const geometry = new THREE.PlaneGeometry(15, 8);
      const material = new THREE.MeshBasicMaterial({
        color: colors[i],
        transparent: true,
        opacity: 0.055,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(-8 + i * 8, 5 + i, -17.5);
      plane.rotation.z = (i - 1) * 0.2;

      this.haze.add(plane);
    }

    this.scene.add(this.haze);
  }

  /* =======================================================
     HACES DE LUZ
     ======================================================= */

  createBeams() {
    const configs = [
      { x: -6.5, color: 0xff8a1f, radius: 2.7, opacity: 0.06, tilt: 0.18 },
      { x: 0, color: 0xf2ede2, radius: 3.4, opacity: 0.042, tilt: 0 },
      { x: 6.5, color: 0x5b7dff, radius: 2.9, opacity: 0.055, tilt: -0.2 },
      { x: 3.2, color: 0xd8ff4a, radius: 1.7, opacity: 0.036, tilt: -0.1 },
    ];

    for (const config of configs) {
      const geometry = new THREE.ConeGeometry(
        config.radius,
        24,
        40,
        1,
        true,
      );

      const material = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

      const cone = new THREE.Mesh(geometry, material);
      cone.position.set(config.x, 10.5, -2.5);
      cone.rotation.z = config.tilt;
      cone.renderOrder = 2;
      this.scene.add(cone);

      this.beams.push({
        mesh: cone,
        material,
        baseOpacity: config.opacity,
        phase: Math.random() * Math.PI * 2,
        tilt: config.tilt,
      });

      // Charco de luz en el suelo
      const poolGeometry = new THREE.CircleGeometry(config.radius * 1.45, 48);
      poolGeometry.rotateX(-Math.PI / 2);

      const poolMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.055,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });

      const pool = new THREE.Mesh(poolGeometry, poolMaterial);
      pool.position.set(
        config.x + Math.sin(config.tilt) * -8,
        this.floorY + 0.012,
        -1.5,
      );
      pool.renderOrder = 1;
      this.scene.add(pool);

      this.beamPools.push({
        mesh: pool,
        material: poolMaterial,
        baseOpacity: 0.055,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  /* =======================================================
     PARTÍCULAS
     ======================================================= */

  createParticles() {
    const count = this.isCoarse ? 120 : 280;

    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 19 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 34 - 3;

      sizes[i] = 0.35 + Math.random() * 0.8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    this.moteTexture = createMoteTexture();

    const material = new THREE.PointsMaterial({
      color: 0xf2ede2,
      size: 0.075,
      map: this.moteTexture,
      transparent: true,
      opacity: 0.42,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.position.y = 0.5;
    this.scene.add(this.particles);
  }

  /* =======================================================
     CÁMARA
     ======================================================= */

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      BASE_FOV,
      1,
      0.1,
      220,
    );

    this.cameraBase = new THREE.Vector3(0, 9, 32);
    this.cameraTarget = new THREE.Vector3(0, 2.4, 0);

    this.camera.position.copy(this.cameraBase);
    this.camera.lookAt(this.cameraTarget);
  }

  setViewport(width, height) {
    if (!this.camera) {
      return;
    }

    const aspect = width / Math.max(1, height);

    this.camera.aspect = aspect;

    // El kit se mantiene centrado y con margen para las notas.
    if (aspect < 1.25) {
      this.camera.fov = 20;
      this.cameraBase.set(0, 10.8, 39);
      this.cameraTarget.set(0, 2.6, 0);
    } else if (aspect < 1.65) {
      this.camera.fov = 18;
      this.cameraBase.set(0, 9.7, 35);
      this.cameraTarget.set(0, 2.5, 0);
    } else {
      this.camera.fov = 16.5;
      this.cameraBase.set(0, 9, 32);
      this.cameraTarget.set(0, 2.4, 0);
    }

    // Móvil en horizontal: misma composición, pero el kit llena la escena.
    if (aspect >= 1.65 && height < 560) {
      this.camera.fov = 15;
      this.cameraBase.set(0, 8.4, 27);
      this.cameraTarget.set(0, 1.9, 0);
    }

    // En pantallas muy verticales alejamos para que el kit completo quepa.
    if (aspect < 0.8) {
      this.camera.fov = 22;
      this.cameraBase.set(0, 12.5, 58);
      this.cameraTarget.set(0, 2.8, 0);
    }

    this.camera.updateProjectionMatrix();

    if (this.introProgress >= 1) {
      this.camera.position.copy(this.cameraBase);
      this.camera.lookAt(this.cameraTarget);
    }
  }

  setPointer(x, y) {
    if (this.reducedMotion) {
      return;
    }

    this.pointerTarget.x = Math.max(-1, Math.min(1, x));
    this.pointerTarget.y = Math.max(-1, Math.min(1, y));
  }

  pulse(strength = 0.5) {
    this.pulseEnergy = Math.min(2, this.pulseEnergy + strength);
  }

  /* =======================================================
     ACTUALIZACIÓN
     ======================================================= */

  update(delta, elapsed, playing = false) {
    this.time += delta;

    this.pulseEnergy = Math.max(0, this.pulseEnergy - delta * 1.4);

    // Cámara: intro + parallax + respiración
    if (this.introProgress < 1) {
      this.introProgress = Math.min(
        1,
        this.introProgress + delta / 3.1,
      );
    }

    const introEase =
      this.introProgress *
      this.introProgress *
      (3 - 2 * this.introProgress);

    const damping = 1 - Math.exp(-delta * 4.2);

    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * damping;
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * damping;

    if (this.camera) {
      const introOffsetY = (1 - introEase) * 4.2;
      const introOffsetZ = (1 - introEase) * 9;

      const breathe = this.reducedMotion
        ? 0
        : Math.sin(this.time * (playing ? 1.15 : 0.55)) * 0.12;

      const parallaxX = this.reducedMotion ? 0 : this.pointer.x * 1.35;
      const parallaxY = this.reducedMotion ? 0 : this.pointer.y * 0.55;

      this.camera.position.set(
        this.cameraBase.x + parallaxX,
        this.cameraBase.y + introOffsetY + parallaxY + breathe,
        this.cameraBase.z + introOffsetZ,
      );

      this.camera.lookAt(
        this.cameraTarget.x + parallaxX * 0.12,
        this.cameraTarget.y,
        this.cameraTarget.z,
      );
    }

    if (this.reducedMotion) {
      if (this.riserRimMaterial) {
        this.riserRimMaterial.opacity = 0.3;
      }
      return;
    }

    // Haces
    for (const beam of this.beams) {
      const wave =
        Math.sin(this.time * 0.42 + beam.phase) * 0.5 + 0.5;

      beam.material.opacity =
        beam.baseOpacity * (0.65 + wave * 0.55) +
        this.pulseEnergy * 0.012;

      beam.mesh.rotation.z =
        beam.tilt + Math.sin(this.time * 0.16 + beam.phase) * 0.025;
    }

    // Charco de luz
    for (const pool of this.beamPools) {
      const wave =
        Math.sin(this.time * 0.36 + pool.phase) * 0.5 + 0.5;

      pool.material.opacity =
        pool.baseOpacity * (0.6 + wave * 0.6) +
        this.pulseEnergy * 0.008;
    }

    // Partículas
    if (this.particles) {
      this.particles.rotation.y += delta * 0.008;
      this.particles.rotation.z = Math.sin(this.time * 0.05) * 0.02;
      this.particles.material.opacity =
        0.36 + this.pulseEnergy * 0.06;
    }

    // Aros de fondo
    for (let i = 0; i < this.bgRings.length; i += 1) {
      const ring = this.bgRings[i];

      ring.rotation.z += delta * (i === 0 ? 0.018 : -0.012);
    }

    // Ligeros pulsos de luz
    if (this.lights.warm) {
      this.lights.warm.intensity = 42 + this.pulseEnergy * 14;
    }

    if (this.lights.cool) {
      this.lights.cool.intensity = 32 + this.pulseEnergy * 10;
    }

    if (this.lights.top) {
      this.lights.top.intensity = 24 + this.pulseEnergy * 8;
    }

    if (this.lights.kitSpot) {
      this.lights.kitSpot.intensity = 150 + this.pulseEnergy * 30;
    }

    if (this.riserRimMaterial) {
      this.riserRimMaterial.opacity = 0.26 + this.pulseEnergy * 0.12;
    }

    if (this.outerRingMaterial) {
      this.outerRingMaterial.opacity = 0.1 + this.pulseEnergy * 0.06;
    }

    // Slats con respiración
    for (let i = 0; i < this.slats.length; i += 1) {
      const slat = this.slats[i];
      const wave = Math.sin(this.time * 0.5 + i * 0.7) * 0.5 + 0.5;

      slat.material.opacity = 0.1 + wave * 0.12;
    }

    // Haze
    if (this.haze) {
      this.haze.rotation.y = Math.sin(this.time * 0.04) * 0.04;
    }

    // Micro pulso de escala de la tarima
    if (this.riser) {
      const scale = 1 + this.pulseEnergy * 0.002;

      this.riser.scale.set(scale, 1, scale);
    }
  }

  /* =======================================================
     RESIZE
     ======================================================= */

  resize(width, height) {
    this.setViewport(width, height);
  }

  /* =======================================================
     LIMPIEZA
     ======================================================= */

  dispose() {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    this.scene.traverse((child) => {
      if (child.geometry) {
        geometries.add(child.geometry);
      }

      if (child.material) {
        const list = Array.isArray(child.material)
          ? child.material
          : [child.material];

        for (const material of list) {
          materials.add(material);
        }
      }
    });

    for (const geometry of geometries) {
      geometry.dispose();
    }

    for (const material of materials) {
      if (material.map) {
        textures.add(material.map);
      }

      material.dispose();
    }

    for (const texture of textures) {
      texture.dispose();
    }
  }
}
