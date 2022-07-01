/*  Necessario per Networked Aframe  */
NAF.schemas.getComponentsOriginal = NAF.schemas.getComponents;

/*  Funzionamento audio spaziale  */
Tone.Transport.start();
now = Tone.now();


/*  Ogni posizione di arrayMusicale identifica lo stato di un componente musicale, 0 = spento, 1 = attivo (parte da 1)  */
/*  dropEnable sarà 1 quando prendo un blocco dagli esempi per piazzarlo dopo, per il momento non lo uso  */
/*  start serve per far partire Tone, anche se non sembra essere necessario per il funzionamento, viene comunque consigliato  */
arrayMusicale = [];
index = 0;
dropEnable = 0;
start = 0;

/*  Vado a creare un array di array, ogni singolo array interno conterrà i dati dei setting del cubo in data posizione  */
/*  On connect manderò l'array intero mentre per i singoli cambiamenti solo il contenuto della suddetta cella preceduto dalla posizione nell'array  */
/*  Composizione Array:  */
/*  Posizione 0 Volume  */
/*  Posizione 1 Detune (forse lo cambio con qualcos'altro)  */
/*  Posizione 2 Envelope Attack  */
/*  Posizione 3 Envelope Decay  */
/*  Posizione 4 Envelope Sustain  */
/*  Posizione 5 Envelope Release  */
cubeSettings = [];

/*  array che contiene quali note saranno inserite nell'elemento che verrà posizionato con il prossimo click  */
/*  viene pulito dopo ogni drop e viene riempito clickando su dei blocchi appositi preposizionati quando il mondo viene creato  */
//Default è vuoto ma mi serve per fare testing fin quando non implemento un metodo per selezionare le note
//musicDrop = ["D4", "F4", "A4", "C5", "E5"];
musicDrop = [];

/*  array che uso come supporto per quando viene creato un cubo da un altro utente  */
/*  prima di assegnare le note, se questo è vuoto, allora uso musicDrop, altrimenti uso questo e poi lo svuoto  */
/*  dovrebbe essere vuoto la maggior parte del tempo, quando si popula è solo per creare dare le note al synth e poi si svuota subito  */
externalDrop = [];

/*  Indica l'ottava in cui si trovano i componenti da prendere, quindi se è 1, tutti i componenti hanno note in prima ottava etc  */
octave = 4;

/*  Volume del suono riprodotto dai cubi in dB  */
cubeVolume = -12;

/*  detune applicato al suono riprodotto dai cubi  */
cubeDetune = 0;

cubeEnvelopeAttack = 3;
cubeEnvelopeDecay = 2;
cubeEnvelopeRelease = 0.5;
cubeEnvelopeSustain = 0.5;

//defaultCubeSettings = [-12, 0, 3, 2, 0.5, 0.5]; usando il push poi va a modificare l'oggetto quindi rimane lo stesso per tutti

//OUTDATED, usato per i gli oggetti statici
riproducisynth = 0;
riproduciosc = 0;


/*  Creo grazie a dei mixins i blocchi, con un componente che mi permette di modificarne le proprietà  */
AFRAME.registerComponent('intersection-spawn', {
    schema: {
        default: '',
        parse: AFRAME.utils.styleParser.parse
    },

    init: function () {
        var data = this.data;
        var el = this.el;

        el.addEventListener(data.event, evt => {
            if (evt.detail.intersection.object.el.id == "ground" && musicDrop.length != 0) {

                // Invia in broadcast le note che vanno nel polysynth
                NAF.connection.broadcastDataGuaranteed('note-received', musicDrop);

                //Cube creation
                var spawnEl = document.createElement('a-entity');
                var correctPosition = evt.detail.intersection.point;
                correctPosition.y = 0.550;
                spawnEl.setAttribute('networked', { persistent: true, template: this.data.template });
                spawnEl.setAttribute('position', correctPosition);
                arrayMusicale[index] = 0;
                el.sceneEl.appendChild(spawnEl);
                NAF.utils.getNetworkedEntity(spawnEl).then((networkedEl) => {
                    document.body.dispatchEvent(new CustomEvent('persistentEntityCreated', { detail: { el: spawnEl } }));
                });

                document.getElementById("notebox").value = "";


                //GUI creation
                var gui = document.createElement('a-entity');
                var guipos = correctPosition;
                guipos.x += 2;
                guipos.y += 1;
                gui.setAttribute('networked', { persistent: true, template: this.data.template2 });
                gui.setAttribute('position', guipos);
                //gui.setAttribute('id', index);
                el.sceneEl.appendChild(gui);
                NAF.utils.getNetworkedEntity(gui).then((networkedEl) => {
                    document.body.dispatchEvent(new CustomEvent('persistentEntityCreated', { detail: { el: gui } }));
                });

            }
        });
    }
});


/*  Serve per recuperare l'index degli oggetti visto che non posso modificare correttamente l'id originale  */
AFRAME.registerComponent('index', {
    schema: {
        indice: { type: 'int' },
    },
    init: function () {
        this.data.indice = index;
    }
});

AFRAME.registerComponent('indexgui', {
    schema: {
        indice: { type: 'int' },
    },
    init: function () {
        this.data.indice = index - 1; //-1 perchè creandolo dopo il cubo l'index viene incrementato, se funziona tutto poi sposto la creazione sopra e siamo apposto
    }
});


/*  Componente da aggiungere ai cubi creati a run time, versione precedente
AFRAME.registerComponent("polysynth", {
    schema: {
        note: { type: 'string' }, //mind che probabilmente qui ci saranno più note da dividere con un parser
    },
    init: function () {

        //add obj to array
        this.objPos = index;

        // Creazione Componenti Musicali
        this.physicalObj = this.el.object3D;
        this.pannerpolysynth = new Tone.Panner3D(this.physicalObj.position.x, this.physicalObj.position.y, this.physicalObj.position.z).toDestination();
        this.polysynth = new Tone.PolySynth().connect(this.pannerpolysynth);

        // Senza fa troppo casino
        this.polysynth.volume.value = -12;

        //let note = this.data.note.split(",");
        this.noteA = notePopuling();

        //Serve solo per mostrare le note nell'editor (Ctrl + Alt + i)
        this.data.note = this.noteA;

        //Quando creo un oggetto la posizione di spawn sulle altre macchine risulta 0,0,0, il che da ovviamente problemi con la corretta
        //percezione dell'audio
        console.log("index:" + this.objPos + ", x:" + this.physicalObj.position.x + ", y:" + this.physicalObj.position.y + ", z:" + this.physicalObj.position.z);


        // Eventi per attivare e disattivare audio in seguito ad un messaggio
        this.el.addEventListener("eventOn", function () {
            arrayMusicale[objPos] = 1;
            polysynth.triggerAttack(noteA, now, 1); //scambiare now con "+0" se qualcosa non dovesse andare
            console.log("index:" + objPos + ", x:" + physicalObj.x + ", y:" + physicalObj.y + ", z:" + physicalObj.z);
        });

        this.el.addEventListener("eventOff", function () {
            arrayMusicale[objPos] = 0;
            polysynth.triggerRelease(noteA, now);
        });

        this.el.addEventListener("click", function () {
            console.log(this.el);
            if (!start) {
                Tone.start();
                start++;
            }
            if (arrayMusicale[objPos]) {
                arrayMusicale[objPos] = 0;
                polysynth.triggerRelease(noteA, now);

                //Invio messaggio disattivazione
                var command = objPos + '-off'
                NAF.connection.broadcastDataGuaranteed('cube-commands', command);
                console.log("index:" + objPos + ", x:" + physicalObj.x + ", y:" + physicalObj.y + ", z:" + physicalObj.z);

            }
            else {
                arrayMusicale[objPos] = 1;
                polysynth.triggerAttack(noteA, now, 1);

                //Invio messaggio attivazione
                var command = objPos + '-on'
                NAF.connection.broadcastDataGuaranteed('cube-commands', command);
                console.log("index:" + objPos + ", x:" + physicalObj.x + ", y:" + physicalObj.y + ", z:" + physicalObj.z);

            }
        });

    },
});*/


/*  Componente da aggiungere ai cubi creati a run time  */
AFRAME.registerComponent("polysynth", {
    schema: {
        note: { type: 'string' },
        volume: { type: 'number' },
        detune: { type: 'number' },
        attack: { type: 'number' },
        decay: { type: 'number' },
        sustain: { type: 'number' },
        release: { type: 'number' },
    },
    init: function () {

        //add obj to array
        this.objPos = index;

        // Creazione Componenti Musicali
        this.physicalObj = this.el.object3D;

        //cubeSettings[this.objPos] = defaultCubeSettings;
        //cubeSettings.push(defaultCubeSettings); //questo non va bene perchè mette lo stesso oggetto, quindi quando ne cambio uno, cambiano tutti
        cubeSettings[this.objPos] = [-12, 0, 3, 2, 0.5, 0.5];

        var distortion = new Tone.Distortion(0);    //amount of distortion, between 0-1
        this.pannerpolysynth = new Tone.Panner3D(this.physicalObj.position.x, this.physicalObj.position.y, this.physicalObj.position.z).toDestination();
        /*this.polysynth = new Tone.PolySynth().set({
            envelope: {
                attackCurve: "exponential",
                attack: cubeEnvelopeAttack,
                decay: cubeEnvelopeDecay,
                sustain: cubeEnvelopeSustain,
                release: cubeEnvelopeRelease,
            }
        }).connect(this.pannerpolysynth);*/

        this.polysynth = new Tone.PolySynth().set({
            envelope: {
                attackCurve: "exponential",
                attack: cubeSettings[this.objPos][2],
                decay: cubeSettings[this.objPos][3],
                sustain: cubeSettings[this.objPos][4],
                release: cubeSettings[this.objPos][5],
            }
        });

        this.polysynth.chain(distortion, this.pannerpolysynth);

        // Imposta il volume iniziale del suono riprodotto
        this.polysynth.volume.value = cubeSettings[this.objPos][0];

        this.polysynth.set({ detune: cubeSettings[this.objPos][1] });

        this.data.note = notePopuling();
        this.data.volume = cubeSettings[this.objPos][0];
        this.data.detune = cubeSettings[this.objPos][1];
        this.data.attack = cubeSettings[this.objPos][2];
        this.data.decay = cubeSettings[this.objPos][3];
        this.data.sustain = cubeSettings[this.objPos][4];
        this.data.release = cubeSettings[this.objPos][5];

        this.myGUI = document.getElementById(this.objPos);


    },
    tick: function () {
        this.pannerpolysynth.setPosition(this.el.object3D.position.x, this.el.object3D.position.y, this.el.object3D.position.z);
    },
    updateColor() {
        if (this.el.getAttribute('material').color == "red")
            this.el.setAttribute('material', 'color', "blue")
        else
            this.el.setAttribute('material', 'color', "red")

    },
    events: {
        click: function (evt) {
            NAF.utils.takeOwnership(this.el);
            if (!start) {
                Tone.start();
                start++;
            }
            if (arrayMusicale[this.objPos]) {
                arrayMusicale[this.objPos] = 0;
                this.polysynth.triggerRelease(this.data.note);

                //Invio messaggio disattivazione
                var command = this.objPos + '-off'
                NAF.connection.broadcastDataGuaranteed('cube-commands', command);
                this.updateColor();
            }
            else {
                arrayMusicale[this.objPos] = 1;
                this.polysynth.triggerAttack(this.data.note);

                //Invio messaggio attivazione
                var command = this.objPos + '-on'
                NAF.connection.broadcastDataGuaranteed('cube-commands', command);
                this.updateColor();

            }
        },
        eventOn: function () {
            arrayMusicale[this.objPos] = 1;
            //this.polysynth.triggerAttack(this.data.note, now, 1); //scambiare now con "+0" se qualcosa non dovesse andare
            this.polysynth.triggerAttack(this.data.note);
        },
        eventOff: function () {
            arrayMusicale[this.objPos] = 0;
            //this.polysynth.triggerRelease(this.data.note, now);
            this.polysynth.triggerRelease(this.data.note);
        },
        changeSettings: function () {
            this.polysynth.volume.value = cubeSettings[this.objPos][0];
            this.polysynth.set({ detune: cubeSettings[this.objPos][1] });
            this.polysynth.set({
                envelope: {
                    attackCurve: "exponential",
                    attack: cubeSettings[this.objPos][2],
                    decay: cubeSettings[this.objPos][3],
                    sustain: cubeSettings[this.objPos][4],
                    release: cubeSettings[this.objPos][5],
                }
            });

            var GUIs = document.querySelectorAll('[text-changer]');
            for(var i = 0; i < GUIs.length; i++){
                if(GUIs[i].getAttribute('text-changer').indexcube == this.objPos)
                    GUIs[i].dispatchEvent(updateComponent);
            }
            //dispatch l'evento per il cambiamento del valore nel testo della GUI -- credo qua sia meglio

        }
        //andranno cambiati quando finisco il cambiamento per la GUI 
        /*volumeChange: function () {
            this.polysynth.volume.value = cubeVolume;
        },
        detuneChange: function () {
            this.polysynth.set({ detune: cubeDetune });

        },
        updateEnvelope: function () {
            this.polysynth.set({
                envelope: {
                    attackCurve: "exponential",
                    attack: cubeEnvelopeAttack,
                    decay: cubeEnvelopeDecay,
                    sustain: cubeEnvelopeSustain,
                    release: cubeEnvelopeRelease,
                }
            });
        },*/
    }
});

/*  Component che aggiunge un synth OUTDATED, per elementi statici  */
AFRAME.registerComponent("pannersynth", {
    schema: {
        nota: { type: 'string', default: 'A1' },
    },

    init: function () {

        let physicalObj = this.el.object3D;
        let pannersynth = new Tone.Panner3D(physicalObj.position.x, physicalObj.position.y, physicalObj.position.z).toDestination();
        let synthet = new Tone.Synth().connect(pannersynth);


        let notaM = this.data.nota;

        /*  Eventi in seguito ai messaggi  */
        this.el.addEventListener("eventOnSynth", function () {
            riproducisynth = 1;
            synthet.triggerAttack(notaM, "+0", 1);
        });

        this.el.addEventListener("eventOffSynth", function () {
            riproducisynth = 0;
            synthet.triggerRelease();
        });

        /*  Evento sul click  */
        this.el.addEventListener("click", function () {
            if (!start) {
                Tone.start();
                start++;
            }
            if (riproducisynth) {
                riproducisynth = 0;
                synthet.triggerRelease();
                NAF.connection.broadcastDataGuaranteed('sentmsg', 'synthoff');
            }
            else {
                riproducisynth = 1;
                synthet.triggerAttack("C2", "+0", 1);
                NAF.connection.broadcastDataGuaranteed('sentmsg', 'synthon');
            }
        });
    }
});

/*  Component che aggiunge un osc OUTDATED, per elementi statici  */
AFRAME.registerComponent("pannerosc", {
    schema: { //frequenza e forma?

    },

    init: function () {
        let physicalObj = this.el.object3D;
        let pannerosc = new Tone.Panner3D(physicalObj.position.x, physicalObj.position.y, physicalObj.position.z).toDestination();
        let osc = new Tone.Oscillator(220, "sine").connect(pannerosc);
        osc.volume.value = -15;

        //Ogni tanto si sentono dei pop quando viene ruotato l'avatar (probabilmente colpa del volume alto)


        /*  Eventi in seguito ai messaggi  */
        this.el.addEventListener("eventOnOsc", function () {
            if (!riproduciosc) {
                riproduciosc = 1;
                osc.start();
            }
        });

        this.el.addEventListener("eventOffOsc", function () {
            if (riproduciosc) {
                riproduciosc = 0;
                osc.stop();
            }

        });

        /*  Evento sul click  */
        this.el.addEventListener("click", function () {
            if (!start) {
                Tone.start();
                start++;
            }
            if (riproduciosc) {
                riproduciosc = 0;
                osc.stop();
                NAF.connection.broadcastDataGuaranteed('sentmsg', 'oscoff');
            }
            else {
                riproduciosc = 1;
                osc.start();
                NAF.connection.broadcastDataGuaranteed('sentmsg', 'oscon');
            }
        });
    }
});

/*  assegna correttamente le note ai blocchi musicali  */
/*  externalDrop riceve le note da assegnare al cubo, quando questo viene creato all'esterno, se è vuoto vuol dire che la creazione avviene  */
/*  in locale e poi dovo verrà inviata  */
function notePopuling() {
    var toFill;

    //prima era externalDrop.length != []
    if (externalDrop.length != 0) {
        //console.log("presoDaExternal");
        toFill = externalDrop;
        externalDrop = [];
    }
    else if (musicDrop.length != 0) {
        //console.log("presoDaInternal");
        //console.log(musicDrop);
        toFill = musicDrop;
        musicDrop = [];
    }
    else {
        console.log("Default A1");
        toFill = ["A1"];
    }
    return toFill;
}

AFRAME.registerComponent('note-mem', {
    schema: {
        addnota: { type: 'string', default: 'A' }
    },
    init: function () {
        this.nota = this.data.addnota + octave;
        //console.log("Va");
    },
    events: {
        click: function () {
            if (!musicDrop.includes(this.nota)) {
                musicDrop.push(this.nota);
                document.getElementById("notebox").value = musicDrop;
            }
            console.log(musicDrop);
        },
        changeOctave: function () {
            this.nota = this.data.addnota + octave;
            //console.log(this.nota);
        }
    }
});

AFRAME.registerComponent('change-octave', {
    schema: {
        action: { type: 'string' },
    },
    init: function () {
        this.noteSelectors = document.querySelectorAll('[note-mem]');
        //console.log(this.data.action);
    },
    events: {
        click: function () {
            if (this.data.action == "add") {
                if (octave < 8) {
                    octave++;
                }
            }
            else if (this.data.action == "sub") {
                if (octave > 1)
                    octave--;

            }
            for (var i = 0; i < this.noteSelectors.length; i++) {
                this.noteSelectors[i].dispatchEvent(changeOctave);
                //console.log(i);
            }
            document.getElementById("valoreottava").innerHTML = "Ottava selezionata: " + octave;
            console.log("Octave: " + octave);
        }
    }
});

AFRAME.registerComponent('change-volume', {
    schema: {
        action: { type: 'string' }
    },

    events: {
        click: function () {
            var cmd = 'volume:';
            if (this.data.action == 'add') {
                cubeVolume++;
            }
            else if (this.data.action == 'sub') {
                cubeVolume--;
            }

            cmd += cubeVolume;

            document.getElementById("volume-value").setAttribute('value', cubeVolume);

            var cubes = document.querySelectorAll('[polysynth]');
            for (var i = 0; i < cubes.length; i++) {
                cubes[i].dispatchEvent(volumeChange);
            }

            NAF.connection.broadcastDataGuaranteed('setting-commands', cmd);
        }


    }
});

AFRAME.registerComponent('change-detune', {
    schema: {
        action: { type: 'string' }
    },

    events: {
        click: function () {
            var cmd = 'detune:';
            if (this.data.action == 'add') {
                cubeDetune += 100;
            }
            else if (this.data.action == 'sub') {
                cubeDetune -= 100;
            }

            cmd += cubeDetune;

            document.getElementById("detune-value").setAttribute('value', cubeDetune);

            var cubes = document.querySelectorAll('[polysynth]');
            for (var i = 0; i < cubes.length; i++) {
                cubes[i].dispatchEvent(updateEnvelope);
            }

            NAF.connection.broadcastDataGuaranteed('setting-commands', cmd);
        }


    }
});

AFRAME.registerComponent('change-envelope', {
    schema: {
        argument: { type: 'string' },
        action: { type: 'string' }
    },

    events: {
        click: function () {

            var cmd = '';



            switch (this.data.argument) {
                case 'envelope-attack': {

                    cmd = 'envelope-attack:';

                    if (this.data.action == 'add') {
                        cubeEnvelopeAttack += 0.5;
                    }
                    else if (this.data.action == 'sub') {
                        if (cubeEnvelopeAttack > 0)
                            cubeEnvelopeAttack -= 0.5;
                    }

                    cmd += cubeEnvelopeAttack;

                    document.getElementById("attack-value").setAttribute('value', cubeEnvelopeAttack);


                    break;
                }
                case 'envelope-decay': {

                    cmd = 'envelope-decay:';

                    if (this.data.action == 'add') {
                        cubeEnvelopeDecay += 0.5;
                    }
                    else if (this.data.action == 'sub') {
                        if (cubeEnvelopeDecay > 0)
                            cubeEnvelopeDecay -= 0.5;
                    }

                    cmd += cubeEnvelopeDecay;

                    document.getElementById("decay-value").setAttribute('value', cubeEnvelopeDecay);

                    break;
                }

                case 'envelope-sustain': {

                    cmd = 'envelope-sustain:';

                    if (this.data.action == 'add') {

                        cubeEnvelopeSustain += 0.1;
                        if (cubeEnvelopeSustain > 1) cubeEnvelopeSustain = 1;
                    }
                    else if (this.data.action == 'sub') {
                        cubeEnvelopeSustain -= 0.1;
                        if (cubeEnvelopeSustain < 0) cubeEnvelopeSustain = 0;

                    }

                    cmd += cubeEnvelopeSustain;

                    document.getElementById("sustain-value").setAttribute('value', cubeEnvelopeSustain.toFixed(1));

                    break;
                }
                case 'envelope-release': {

                    cmd = 'envelope-release:';

                    if (this.data.action == 'add') {
                        cubeEnvelopeRelease += 0.5;
                    }
                    else if (this.data.action == 'sub') {
                        if (cubeEnvelopeRelease > 0)
                            cubeEnvelopeRelease -= 0.5;
                    }

                    cmd += cubeEnvelopeRelease;

                    document.getElementById("release-value").setAttribute('value', cubeEnvelopeRelease);

                    break;
                }
                default: {
                    console.error("Input Erratto: " + this.data.argument + ": " + this.data.action);
                    break;
                }
            }

            var cubes = document.querySelectorAll('[polysynth]');
            for (var i = 0; i < cubes.length; i++) {
                cubes[i].dispatchEvent(updateEnvelope);
            }

            NAF.connection.broadcastDataGuaranteed('setting-commands', cmd);
        }
    }
});

AFRAME.registerComponent('text-changer', {
    schema: {
        indexcube: { type: 'int' },
        settingindex: { type: 'int' }
    },

    init: function () {
        //this.data.indexcube = this.el.parentNode.parentNode.id; //mi condivide l'id giusto nell'editor, ma poi nella pagina html rimane l'id networked
        /*var GUIs = document.querySelectorAll('[indexgui]');
        for(var i = 0; i < GUIs.length; i++){
            if(GUIs[i] == this.el.parentNode.parentNode)
                this.data.indexcube = GUIs[i].getAttribute('indexgui').indice - 1;
        }*/

        this.data.indexcube = this.el.parentNode.parentNode.getAttribute("indexgui").indice;
        this.el.setAttribute('value', cubeSettings[this.data.indexcube][this.data.settingindex]);
    },
    events: {
        updateComponent: function () {
            this.el.setAttribute('value', cubeSettings[this.data.indexcube][this.data.settingindex]);
        }
    }
});

AFRAME.registerComponent('setting-changer', {
    schema: {
        indexcube: { type: 'int' },
        settingindex: { type: 'int' },
        action: { type: 'string' }
    },
    init: function () {
        this.cube;
        //this.data.indexcube = this.el.parentNode.parentNode.id;

        /*var GUIs = document.querySelectorAll('[indexgui]');
        for(var i = 0; i < GUIs.length; i++){
            if(GUIs[i] == this.el.parentNode.parentNode)
                this.data.indexcube = GUIs[i].getAttribute('indexgui').indice - 1;
        }*/
        this.data.indexcube = this.el.parentNode.parentNode.getAttribute("indexgui").indice;
        var cubes = document.querySelectorAll('[polysynth]');
        for (var i = 0; i < cubes.length; i++) {
            if (cubes[i].getAttribute('index').indice == this.data.indexcube)
                this.cube = cubes[i];
        }
    },
    events: {
        click: function () {
            //change the value in the array
            if (this.data.action == 'add') {
                if (this.data.settingindex == 4) {//sustain operates on +-0.1 instead of +-0.5
                    cubeSettings[this.data.indexcube][this.data.settingindex] += 0.1;
                    if (cubeSettings[this.data.indexcube][this.data.settingindex] > 1)
                        cubeSettings[this.data.indexcube][this.data.settingindex] = 1;
                }
                else{
                    cubeSettings[this.data.indexcube][this.data.settingindex] += 0.5;
                }
            }
            else if(this.data.action == 'sub'){
                if (this.data.settingindex == 4) {//sustain operates on +-0.1 instead of +-0.5
                    cubeSettings[this.data.indexcube][this.data.settingindex] -= 0.1;
                }
                else{
                    cubeSettings[this.data.indexcube][this.data.settingindex] -= 0.5;
                }
                if(cubeSettings[this.data.indexcube][this.data.settingindex] < 0 && (this.data.settingindex != 0 && this.data.settingindex != 1))
                    cubeSettings[this.data.indexcube][this.data.settingindex] = 0;
            }

            //deploy the event on the cube for it to change the value
            this.cube.dispatchEvent(changeSettings);


            var cmd = '';
            cmd += this.data.indexcube + ':' + this.data.settingindex + ':' + cubeSettings[this.data.indexcube][this.data.settingindex];
            NAF.connection.broadcastDataGuaranteed("update-settings", cmd);

        }
    }
});
