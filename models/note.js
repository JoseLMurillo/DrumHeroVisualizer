import * as THREE
    from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


export class Note {

    constructor({
        type,
        time
    }) {

        this.type = type;

        this.time = time;

        this.object = null;

        // Posición donde debe terminar la nota
        this.targetPosition = null;

        // Para saber si ya ejecutamos el golpe
        this.hitTriggered = false;

    }


    // ========================================================
    // CREAR MALLA
    // ========================================================

    createMesh() {

        let color;

        let geometry;


        // ----------------------------------------------------
        // KICK
        // ----------------------------------------------------

        if (this.type === "kick") {

            color = 0x4444ff;

            geometry =
                new THREE.SphereGeometry(
                    0.25,
                    16,
                    16
                );

        }


        // ----------------------------------------------------
        // SNARE
        // ----------------------------------------------------

        else if (this.type === "snare") {

            color = 0xff4444;

            geometry =
                new THREE.OctahedronGeometry(
                    0.25,
                    0
                );

        }


        // ----------------------------------------------------
        // HI-HAT
        // ----------------------------------------------------

        else if (this.type === "hihat") {

            color = 0xffff44;

            geometry =
                new THREE.CylinderGeometry(
                    0.22,
                    0.22,
                    0.15,
                    16
                );

        }


        // ----------------------------------------------------
        // TOM HIGH
        // ----------------------------------------------------

        else if (this.type === "tomHigh") {

            color = 0xff8844;

            geometry =
                new THREE.SphereGeometry(
                    0.25,
                    16,
                    16
                );

        }


        // ----------------------------------------------------
        // TOM MID
        // ----------------------------------------------------

        else if (this.type === "tomMid") {

            color = 0xffaa44;

            geometry =
                new THREE.SphereGeometry(
                    0.27,
                    16,
                    16
                );

        }


        // ----------------------------------------------------
        // FLOOR TOM
        // ----------------------------------------------------

        else if (this.type === "floorTom") {

            color = 0xffcc44;

            geometry =
                new THREE.SphereGeometry(
                    0.3,
                    16,
                    16
                );

        }


        // ----------------------------------------------------
        // CRASH
        // ----------------------------------------------------

        else if (this.type === "crash") {

            color = 0xffff88;

            geometry =
                new THREE.CylinderGeometry(
                    0.3,
                    0.3,
                    0.1,
                    16
                );

        }


        // ----------------------------------------------------
        // RIDE
        // ----------------------------------------------------

        else if (this.type === "ride") {

            color = 0xffffbb;

            geometry =
                new THREE.CylinderGeometry(
                    0.32,
                    0.32,
                    0.1,
                    16
                );

        }


        // ----------------------------------------------------
        // TIPO DESCONOCIDO
        // ----------------------------------------------------

        else {

            console.warn(
                `Unknown note type: ${this.type}`
            );

            color = 0xffffff;

            geometry =
                new THREE.SphereGeometry(
                    0.25,
                    16,
                    16
                );

        }


        // ====================================================
        // MATERIAL
        // ====================================================

        const material =
            new THREE.MeshStandardMaterial({

                color,

                emissive: color,

                emissiveIntensity: 0.5

            });


        // ====================================================
        // MESH
        // ====================================================

        this.object =
            new THREE.Mesh(
                geometry,
                material
            );


        return this.object;

    }


    // ========================================================
    // ESTABLECER DESTINO
    // ========================================================

    setTarget(position) {

        this.targetPosition =
            position.clone();

    }


    // ========================================================
    // AÑADIR A ESCENA
    // ========================================================

    addToScene(scene) {

        if (!this.object) {

            this.createMesh();

        }


        scene.add(
            this.object
        );

    }

}