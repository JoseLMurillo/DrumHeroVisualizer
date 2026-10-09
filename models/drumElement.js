import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

export class DrumElement {
  constructor({ name, position, color, radius = 1, height = 0.5 }) {
    // DATOS
    this.name = name;

    this.position = position.clone();

    this.color = color;

    this.radius = radius;

    this.height = height;

    // POSICIÓN DE IMPACTO
    /*
            Esta será la posición
            donde la nota debe llegar.

            La mantenemos separada de
            la posición del objeto para
            poder modificarla posteriormente.
        */

    this.hitPosition = position.clone();

    // GEOMETRÍA
    this.geometry = new THREE.CylinderGeometry(
      radius,

      radius,

      height,

      32,
    );

    // MATERIAL

    this.material = new THREE.MeshStandardMaterial({
      color: color,
    });

    // MESH

    this.mesh = new THREE.Mesh(
      this.geometry,

      this.material,
    );

    /*
            Acostamos el cilindro.

            Esto hace que parezca
            un tambor visto desde arriba.
        */

    /*this.mesh.rotation.x = Math.PI / 2;*/

    this.mesh.position.copy(this.position);

    // ESTADO

    this.isHit = false;
  }

  // GOLPE

  hit() {
    this.isHit = true;

    this.mesh.scale.set(1.15, 1.15, 1.15);
  }

  // RESET

  reset() {
    this.isHit = false;

    this.mesh.scale.set(1, 1, 1);
  }

  // AÑADIR A ESCENA

  addToScene(scene) {
    scene.add(this.mesh);
  }
}
