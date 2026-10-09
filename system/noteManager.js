import { Note }
    from "../models/note.js";


export class NoteManager {

    constructor(
        scene,
        drumKit,
        travelTime = 3
    ) {

        this.scene = scene;

        this.drumKit = drumKit;

        this.travelTime = travelTime;

        this.notes = [];
    }


    // =========================================================
    // CARGAR NOTAS DE PRUEBA
    // =========================================================

    loadNotes(noteData) {

        this.clear();

        for (const data of noteData) {

            this.addNote(data);
        }
    }


    // =========================================================
    // CARGAR NOTAS DESDE MIDI
    // =========================================================

    loadMidiNotes(midiNotes) {

        console.log(
            "========================================"
        );

        console.log(
            "CARGANDO NOTAS MIDI"
        );

        console.log(
            "Cantidad recibida:",
            midiNotes.length
        );

        console.log(
            "========================================"
        );


        this.clear();


        for (const data of midiNotes) {

            const type =
                this.drumKit.getNameFromMidi(
                    data.midi
                );


            console.log(
                `MIDI ${data.midi} → ${type || "SIN MAPEO"}`
            );


            if (!type) {

                console.warn(
                    `MIDI sin mapeo: ${data.midi}`
                );

                continue;
            }


            this.addNote({

                type: type,

                time: data.time

            });
        }


        console.log(
            "Notas visuales creadas:",
            this.notes.length
        );
    }


    // =========================================================
    // CREAR UNA NOTA
    // =========================================================

    addNote(data) {

        const note =
            new Note(data);


        const drum =
            this.drumKit.elements[
                note.type
            ];


        if (!drum) {

            console.warn(
                `No existe un elemento de batería para: ${note.type}`
            );

            return null;
        }


        // Crear objeto 3D
        note.addToScene(
            this.scene
        );


        // -----------------------------------------------------
        // Posición objetivo
        // -----------------------------------------------------

        note.targetPosition =
            drum.position.clone();


        // -----------------------------------------------------
        // Posición inicial
        //
        // Las notas comienzan alejadas de la batería.
        // -----------------------------------------------------

        note.object.position.set(

            drum.position.x,

            drum.position.y,

            -30
        );


        // -----------------------------------------------------
        // Ocultar inicialmente
        //
        // update() decidirá cuándo debe aparecer.
        // -----------------------------------------------------

        note.object.visible = false;


        this.notes.push(
            note
        );


        return note;
    }


    // =========================================================
    // ACTUALIZAR TODAS LAS NOTAS
    // =========================================================

    update(currentTime) {

        for (const note of this.notes) {

            this.updateNote(
                note,
                currentTime
            );
        }
    }


    // =========================================================
    // ACTUALIZAR UNA NOTA
    // =========================================================

    updateNote(
        note,
        currentTime
    ) {

        const object =
            note.object;


        if (!object) {
            return;
        }


        const timeUntilHit =
            note.time -
            currentTime;


        // -----------------------------------------------------
        // Todavía falta demasiado tiempo
        // -----------------------------------------------------

        if (
            timeUntilHit >
            this.travelTime
        ) {

            object.visible = false;

            return;
        }


        // -----------------------------------------------------
        // La nota ya pasó
        // -----------------------------------------------------

        if (
            timeUntilHit <
            0
        ) {

            object.visible = false;

            return;
        }


        // -----------------------------------------------------
        // La nota debe estar visible
        // -----------------------------------------------------

        object.visible = true;


        // -----------------------------------------------------
        // Progreso del viaje
        //
        // 0 = acaba de aparecer
        // 1 = llegó al instrumento
        // -----------------------------------------------------

        const progress =
            1 -
            (
                timeUntilHit /
                this.travelTime
            );


        // -----------------------------------------------------
        // Posición inicial y final
        // -----------------------------------------------------

        const startZ = -30;

        const endZ =
            note.targetPosition.z;


        // -----------------------------------------------------
        // Mantener X e Y del instrumento
        // -----------------------------------------------------

        object.position.x =
            note.targetPosition.x;


        object.position.y =
            note.targetPosition.y;


        // -----------------------------------------------------
        // Movimiento en Z
        // -----------------------------------------------------

        object.position.z =
            startZ +
            (
                endZ -
                startZ
            ) *
            progress;


        // -----------------------------------------------------
        // La nota aumenta de tamaño mientras se acerca
        // -----------------------------------------------------

        const scale =
            0.5 +
            progress *
            1.5;


        object.scale.setScalar(
            scale
        );
    }


    // =========================================================
    // LIMPIAR TODAS LAS NOTAS
    // =========================================================

    clear() {

        for (
            const note
            of this.notes
        ) {

            if (
                note.object
            ) {

                this.scene.remove(
                    note.object
                );
            }
        }


        this.notes = [];
    }
}