import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* =========================================================
   EFECTOS DE IMPACTO
   Anillos + destello, sin post-procesado.
   ========================================================= */

const RING_COUNT = 28;

const FLASH_COUNT = 20;

function createGlowTexture() {
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

  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.12)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

export class EffectManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.reducedMotion = options.reducedMotion ?? false;
    this.floorY = options.floorY ?? -1;

    this.rings = [];
    this.flashes = [];

    this.energy = 0;
    this.time = 0;

    this.glowTexture = createGlowTexture();

    this.createPools();
  }

  createPools() {
    const ringGeometry = new THREE.RingGeometry(0.46, 0.5, 64);

    for (let i = 0; i < RING_COUNT; i += 1) {
      const isFloor = i % 2 === 1;

      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });

      const mesh = new THREE.Mesh(ringGeometry, material);

      if (isFloor) {
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = this.floorY + 0.015;
      }

      mesh.visible = false;
      mesh.renderOrder = 5;
      mesh.frustumCulled = false;

      this.scene.add(mesh);

      this.rings.push({
        mesh,
        material,
        isFloor,
        life: 0,
        maxLife: 0,
        baseScale: 1,
      });
    }

    for (let i = 0; i < FLASH_COUNT; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: this.glowTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });

      const sprite = new THREE.Sprite(material);
      sprite.visible = false;
      sprite.renderOrder = 6;
      sprite.frustumCulled = false;

      this.scene.add(sprite);

      this.flashes.push({
        sprite,
        material,
        life: 0,
        maxLife: 0,
        baseScale: 1,
      });
    }
  }

  /* =======================================================
     IMPACTO
     ======================================================= */

  impact(position, color, velocity = 0.8) {
    const strength = 0.72 + velocity * 0.5;

    this.energy = Math.min(1.6, this.energy + 0.12 + velocity * 0.16);

    // Con movimiento reducido conservamos un destello breve
    // en lugar de anillos expansivos.
    if (this.reducedMotion) {
      this.spawnFlash(position, color, strength * 0.85);
      return;
    }

    this.spawnRing(position, color, strength, false);
    this.spawnRing(position, color, strength * 1.2, true);
    this.spawnFlash(position, color, strength);

    // Segundo anillo con retardo visual mínimo
    this.spawnRing(
      position.clone().add(new THREE.Vector3(0, 0.18, 0)),
      color,
      strength * 0.55,
      false,
    );
  }

  spawnRing(position, color, strength, isFloor) {
    const item = this.rings.find((entry) => entry.life <= 0);

    if (!item) {
      return;
    }

    const { mesh, material } = item;

    mesh.visible = true;

    if (isFloor) {
      mesh.position.set(position.x, this.floorY + 0.018, position.z);
      mesh.rotation.x = -Math.PI / 2;
    } else {
      mesh.position.copy(position);
      mesh.position.z += 0.04;
      mesh.rotation.x = 0;
    }

    mesh.scale.setScalar(0.35 * strength);
    mesh.rotation.z = isFloor ? 0 : Math.random() * Math.PI;

    material.color.setHex(color);
    material.opacity = isFloor ? 0.46 : 0.85;

    item.life = isFloor ? 0.82 : 0.56;
    item.maxLife = item.life;
    item.baseScale = isFloor ? 6.2 : 3.4;
    item.isFloor = isFloor;
  }

  spawnFlash(position, color, strength) {
    const item = this.flashes.find((entry) => entry.life <= 0);

    if (!item) {
      return;
    }

    const { sprite, material } = item;

    sprite.visible = true;
    sprite.position.copy(position);
    sprite.position.z += 0.08;

    const scale = 1.15 * strength;
    sprite.scale.set(scale, scale, 1);

    material.color.setHex(color);
    material.opacity = 0.72;

    item.life = 0.34;
    item.maxLife = 0.34;
    item.baseScale = scale;
  }

  /* =======================================================
     ACTUALIZACIÓN
     ======================================================= */

  update(delta) {
    this.time += delta;

    this.energy = Math.max(0, this.energy - delta * 0.8);

    for (const item of this.rings) {
      if (item.life <= 0) {
        continue;
      }

      item.life -= delta;

      if (item.life <= 0) {
        item.mesh.visible = false;
        item.material.opacity = 0;
        continue;
      }

      const t = 1 - item.life / item.maxLife;

      // Ease out cúbico
      const ease = 1 - Math.pow(1 - t, 3);

      const scale =
        (item.isFloor ? 0.35 : 0.3) * item.baseScale * ease +
        (item.isFloor ? 0.15 : 0.2);

      item.mesh.scale.setScalar(scale);

      item.material.opacity =
        (item.isFloor ? 0.46 : 0.85) * (1 - ease) * (1 - ease);

      if (item.isFloor) {
        item.mesh.rotation.z += delta * 0.12;
      }
    }

    for (const item of this.flashes) {
      if (item.life <= 0) {
        continue;
      }

      item.life -= delta;

      if (item.life <= 0) {
        item.sprite.visible = false;
        item.material.opacity = 0;
        continue;
      }

      const t = 1 - item.life / item.maxLife;
      const ease = 1 - Math.pow(1 - t, 3);

      const scale = item.baseScale * (1 + ease * 1.6);

      item.sprite.scale.set(scale, scale, 1);
      item.material.opacity = 0.72 * (1 - t) * (1 - t);
    }
  }

  /* =======================================================
     RESET
     ======================================================= */

  reset() {
    for (const item of this.rings) {
      item.life = 0;
      item.mesh.visible = false;
      item.material.opacity = 0;
    }

    for (const item of this.flashes) {
      item.life = 0;
      item.sprite.visible = false;
      item.material.opacity = 0;
    }

    this.energy = 0;
  }

  /* =======================================================
     LIMPIEZA
     ======================================================= */

  dispose() {
    for (const item of this.rings) {
      this.scene.remove(item.mesh);
      item.material.dispose();
    }

    for (const item of this.flashes) {
      this.scene.remove(item.sprite);
      item.material.dispose();
    }

    this.rings[0]?.mesh.geometry.dispose();
    this.glowTexture.dispose();
  }
}
