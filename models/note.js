import * as THREE
    from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";


/* =========================================================
   ESTILOS POR INSTRUMENTO
   ========================================================= */

const NOTE_STYLES = {

    kick: {
        color: 0x7194ff,
        geometry: () => new THREE.IcosahedronGeometry(0.28, 1),
        halo: 1.5,
        spin: 0.7
    },

    snare: {
        color: 0xff6b6b,
        geometry: () => new THREE.OctahedronGeometry(0.31, 0),
        halo: 1.6,
        spin: 1.1
    },

    hihat: {
        color: 0xffd166,
        geometry: () => new THREE.TorusGeometry(0.2, 0.055, 10, 32),
        halo: 1.35,
        spin: 1.8
    },

    tomHigh: {
        color: 0xff9f43,
        geometry: () => new THREE.DodecahedronGeometry(0.29, 0),
        halo: 1.5,
        spin: 0.9
    },

    tomMid: {
        color: 0xff7a45,
        geometry: () => new THREE.IcosahedronGeometry(0.29, 0),
        halo: 1.5,
        spin: 1.2
    },

    floorTom: {
        color: 0xffc857,
        geometry: () => new THREE.TetrahedronGeometry(0.34, 0),
        halo: 1.7,
        spin: 0.8
    },

    crash: {
        color: 0xdcff65,
        geometry: () => new THREE.RingGeometry(0.11, 0.34, 32),
        halo: 1.7,
        spin: 1.5
    },

    ride: {
        color: 0x7ce8ff,
        geometry: () => new THREE.TorusGeometry(0.3, 0.038, 8, 40),
        halo: 1.6,
        spin: 0.6
    }
};


/* =========================================================
   CACHÉS COMPARTIDAS
   ========================================================= */

const geometryCache = new Map();

const materialCache = new Map();

const haloMaterialCache = new Map();

const tailMaterialCache = new Map();

const tailGeometryCache = new Map();

let dotGeometry = null;

let glowTexture = null;


function getGlowTexture() {

    if (glowTexture) {
        return glowTexture;
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
        size / 2
    );

    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.38)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    glowTexture = new THREE.CanvasTexture(canvas);
    glowTexture.colorSpace = THREE.SRGBColorSpace;

    return glowTexture;
}


function getStyle(type) {

    return (
        NOTE_STYLES[type] ?? {
            color: 0xf2ede2,
            geometry: () => new THREE.SphereGeometry(0.28, 20, 20),
            halo: 1.4,
            spin: 1
        }
    );
}


function getGeometry(type) {

    if (!geometryCache.has(type)) {

        geometryCache.set(
            type,
            getStyle(type).geometry()
        );
    }

    return geometryCache.get(type);
}


function getMaterial(type) {

    if (!materialCache.has(type)) {

        const style = getStyle(type);

        materialCache.set(
            type,
            new THREE.MeshStandardMaterial({
                color: style.color,
                emissive: style.color,
                emissiveIntensity: 1.35,
                roughness: 0.28,
                metalness: 0.24,
                toneMapped: false
            })
        );
    }

    return materialCache.get(type);
}


function getHaloMaterial(type) {

    if (!haloMaterialCache.has(type)) {

        haloMaterialCache.set(
            type,
            new THREE.SpriteMaterial({
                map: getGlowTexture(),
                color: getStyle(type).color,
                transparent: true,
                opacity: 0.42,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                toneMapped: false
            })
        );
    }

    return haloMaterialCache.get(type);
}


function getTailMaterial(type) {

    if (!tailMaterialCache.has(type)) {

        tailMaterialCache.set(
            type,
            new THREE.MeshBasicMaterial({
                color: getStyle(type).color,
                transparent: true,
                opacity: 0.18,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide,
                toneMapped: false
            })
        );
    }

    return tailMaterialCache.get(type);
}


function getTailGeometry(type) {

    if (!tailGeometryCache.has(type)) {

        const geometry =
            new THREE.ConeGeometry(
                0.07,
                0.95,
                8,
                1,
                true
            );

        geometry.rotateX(
            Math.PI / 2
        );

        tailGeometryCache.set(
            type,
            geometry
        );
    }

    return tailGeometryCache.get(type);
}


function getDotGeometry() {

    if (!dotGeometry) {

        dotGeometry =
            new THREE.SphereGeometry(
                0.075,
                12,
                12
            );
    }

    return dotGeometry;
}


/* =========================================================
   NOTA
   ========================================================= */

export class Note {

    constructor({
        type,
        time,
        velocity = 0.8
    }) {

        this.type = type;

        this.time = time;

        this.velocity = Math.max(
            0.2,
            Math.min(1, velocity)
        );

        this.object = null;

        this.core = null;

        this.targetPosition = null;

        this.hitTriggered = false;

        this.wasActive = false;

        this.phase = Math.random() * Math.PI * 2;

        this.baseScale =
            0.76 +
            this.velocity * 0.42;

        this.style = getStyle(type);

        this.color = this.style.color;
    }


    /* =======================================================
       CREAR MALLA
       ======================================================= */

    createMesh() {

        const group =
            new THREE.Group();

        const style =
            this.style;


        // ---------------------------------------------------
        // Núcleo
        // ---------------------------------------------------

        const core =
            new THREE.Mesh(
                getGeometry(this.type),
                getMaterial(this.type)
            );

        core.rotation.x =
            Math.random() * Math.PI;

        core.rotation.y =
            Math.random() * Math.PI;

        this.core = core;

        group.add(core);


        // ---------------------------------------------------
        // Anillo central para las notas planas
        // ---------------------------------------------------

        if (
            this.type === "crash" ||
            this.type === "hihat" ||
            this.type === "ride"
        ) {

            const dot =
                new THREE.Mesh(
                    getDotGeometry(),
                    getMaterial(this.type)
                );

            core.add(dot);
        }


        // ---------------------------------------------------
        // Halo
        // ---------------------------------------------------

        const halo =
            new THREE.Sprite(
                getHaloMaterial(this.type)
            );

        halo.scale.set(
            style.halo,
            style.halo,
            1
        );

        halo.position.z =
            -0.02;

        group.add(halo);


        // ---------------------------------------------------
        // Estela
        // ---------------------------------------------------

        const tail =
            new THREE.Mesh(
                getTailGeometry(this.type),
                getTailMaterial(this.type)
            );

        tail.position.z =
            -0.52;

        group.add(tail);


        this.object =
            group;

        return this.object;
    }


    /* =======================================================
       DESTINO
       ======================================================= */

    setTarget(position) {

        this.targetPosition =
            position.clone();
    }


    /* =======================================================
       AÑADIR A ESCENA
       ======================================================= */

    addToScene(scene) {

        if (!this.object) {

            this.createMesh();
        }

        scene.add(
            this.object
        );
    }


    /* =======================================================
       LIMPIEZA
       ======================================================= */

    dispose() {

        if (!this.object) {
            return;
        }

        // Las geometrías y materiales son compartidos.
        // Se liberan desde disposeNoteCaches().
        this.core = null;
        this.object = null;
    }
}


/* =========================================================
   LIBERAR CACHÉS
   ========================================================= */

export function disposeNoteCaches() {

    for (const geometry of geometryCache.values()) {
        geometry.dispose();
    }

    for (const material of materialCache.values()) {
        material.dispose();
    }

    for (const material of haloMaterialCache.values()) {
        material.dispose();
    }

    for (const material of tailMaterialCache.values()) {
        material.dispose();
    }

    for (const geometry of tailGeometryCache.values()) {
        geometry.dispose();
    }

    dotGeometry?.dispose();

    geometryCache.clear();
    materialCache.clear();
    haloMaterialCache.clear();
    tailMaterialCache.clear();
    tailGeometryCache.clear();

    dotGeometry = null;

    glowTexture?.dispose();
    glowTexture = null;
}
