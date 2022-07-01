{/*  Eventi per attivazione oggetti Musicali  */
    /*  Necessari in quanto triggerare il click sul component genererebbe comunque bubbling  */
    /*  E si andrebbe incontro ad un loop di messaggi inviati  */
    /*  Probabile che mi basti un evento per accendere e uno per spegnere se riesco a implementare  */
    /*  L'implementazione del vettore per gestire tutti i cubi  */
    /*  OUTDATED, usati per gli elementi statici  */
    eventOnSynth = new Event('eventOnSynth');
    eventOffSynth = new Event('eventOffSynth');
    eventOnOsc = new Event('eventOnOsc');
    eventOffOsc = new Event('eventOffOsc');
}


/*  Eventi per elementi creati dinamicamente  */
eventOn = new Event('eventOn');
eventOff = new Event('eventOff');
changeSettings = new Event('changeSettings');
updateComponent = new Event('updateComponent');

/*volumeChange = new Event('volumeChange');
detuneChange = new Event('detuneChange');
changeOctave = new Event("changeOctave");
updateEnvelope = new Event('updateEnvelope');
updateDistortion = new Event('updateDistortion'); //da inserire*/

nuovoClient = 0;

//Incrementa l'index quando un'entità viene creata, ci saranno degli spazi vuoti dovuti a quando un utente si connette (viene generato l'avatar,
//ma non influiscono sul funzionamento)
function onConnect() {

    document.body.addEventListener('entityCreated', function (evt) {
        if (evt.detail.el.getAttribute('index') != null)
            if (evt.detail.el.getAttribute('index').indice != undefined)
                index++;
    });

    NAF.connection.subscribeToDataChannel("initializedData", sendDataForInitialization);
    NAF.connection.subscribeToDataChannel("arraynote", createArray);
    NAF.connection.subscribeToDataChannel("arraymusicale", fillArrayMusicale);
    NAF.connection.subscribeToDataChannel("onconnect-setting", setSettings);
    NAF.connection.subscribeToDataChannel("cube-commands", cubeManager);
    NAF.connection.subscribeToDataChannel("note-received", noteSet);
    NAF.connection.subscribeToDataChannel("update-settings", updateSettings)

    NAF.connection.broadcastDataGuaranteed("initializedData", NAF.clientId)


    //turns out che questa roba fa cagare, perchè l'evento viene generato anche sui clients che si stanno attaccando, 
    //non è quindi una one way con cui mandare i dati ai nuovi clients visto che anche questi fanno la stessa cosa
    //visto che i soci del MIT non ci hanno pensato, probabilmente tocca fare tipo
    //onConnect -> manda messaggio in broadcast in cui richiede tutti i dati e gli vengono inviati back
    //così che si possano aggiornare i dati correttamente
    document.body.addEventListener('clientConnected', function (evt) {
        if (evt.detail.clientId == nuovoClient) {
            var cubes = document.querySelectorAll('[polysynth]');
            var arrayNote = [];

            //empty spaces = undefined in teoria
            for (var i = 0; i < cubes.length; i++) {
                var index = cubes[i].getAttribute('index').indice;
                arrayNote[index] = cubes[i].getAttribute('polysynth').note;
            }

            //NAF.connection.broadcastDataGuaranteed("arraynote", arrayNote); 

            NAF.connection.sendDataGuaranteed(evt.detail.clientId, "arraynote", arrayNote);
            NAF.connection.sendDataGuaranteed(evt.detail.clientId, "arraymusicale", arrayMusicale);
            NAF.connection.sendDataGuaranteed(evt.detail.clientId, "onconnect-setting", cubeSettings);
        }
        else{
            console.log(cubeSettings);
        }

    });

    

}


// Listener OUTDATED, per elementi statici
NAF.connection.subscribeToDataChannel('sentmsg', function (senderId, dataType, data, targetId) {

    /*  Oggetti sui quali andiamo ad attivare l'audio in seguito ai messaggi  */
    let objSynth1 = document.querySelector("#synth1");
    let objOsc1 = document.querySelector("#osc1");

    /*  In base al messaggio ricevuto, andiamo ad attivare o disattivare i vari oggetti  */
    switch (data) {
        case 'synthon': {
            objSynth1.dispatchEvent(eventOnSynth);
        } break;
        case 'synthoff': {
            objSynth1.dispatchEvent(eventOffSynth);
        } break;
        case 'oscon': {
            objOsc1.dispatchEvent(eventOnOsc);
        } break;
        case 'oscoff': {
            objOsc1.dispatchEvent(eventOffOsc);
        } break;
        default: break;
    }
});


// Broadcaster che invia messaggi dopo la ricezione di un click OUTDATED, per elementi statici
AFRAME.registerComponent("msgsender", {
    schema: {
        /*  Identifica il tipo di componente sul quale sta ascoltando  */
        musictype: { type: 'string', default: '' },
    },
    init: function () {
        let switchCase = this.data.musictype;

        this.el.addEventListener("click", function () {
            switch (switchCase) {
                case 'synth': {
                    //il controllo è messo sull'attivazione, perchè quando faccio questo controllo
                    //il valore è già stato cambiato nel click dell'oggetto e solo dopo 
                    //arriva al msgsender tramite bubbling
                    if (riproducisynth) {
                        NAF.connection.broadcastDataGuaranteed('sentmsg', 'synthon');
                    }
                    else {
                        NAF.connection.broadcastDataGuaranteed('sentmsg', 'synthoff');
                    }
                }; break;

                case 'osc': {
                    if (riproduciosc) {
                        NAF.connection.broadcastDataGuaranteed('sentmsg', 'oscon');
                    }
                    else {
                        NAF.connection.broadcastDataGuaranteed('sentmsg', 'oscoff');
                    }
                }; break;

                default: break;
            }
        });
    }
});



function createArray(senderId, dataType, data, targetObj) {
    //funzione che assegna ad ogni cubo il suo valore
    //es arrayNote [["D1","C2"],["B2","C3"], null,

    var cubes = document.querySelectorAll('[polysynth]');
    for (var i = 0; i < data.length; i++) {
        var index = cubes[i].getAttribute('index').indice;

        //cubes[i].object3D.setAttribute("polysynth", {note: data[index]});

        cubes[i].setAttribute('polysynth', 'note', data[index]);
        console.log(cubes[i].getAttribute('polysynth').note);

    }
}


//now it is going to be something like index:setting:modifier (having different GUI for each cube)
/*function updateSettings(senderId, dataType, data, targetObj) {

    var cmd = data.split(':');
    var settingIndex = cmd[0];
    var modifier = parseFloat(cmd[1]);
    var cubes = document.querySelectorAll('[polysynth]');

    switch (settingIndex) {
        case 'volume': {
            cubeVolume = modifier;
            if (cubes != null) {
                for (var i = 0; i < cubes.length; i++) {
                    cubes[i].dispatchEvent(volumeChange);
                }
            }

            document.getElementById("volume-value").setAttribute('value', cubeVolume);

            break;
        }
        case 'detune': {
            cubeDetune = modifier;
            if (cubes != null) {
                for (var i = 0; i < cubes.length; i++) {
                    cubes[i].dispatchEvent(detuneChange);
                }
            }

            document.getElementById("detune-value").setAttribute('value', cubeDetune);

            break;
        }
        case 'envelope-attack': {
            cubeEnvelopeAttack = modifier;
            if (cubes != null) {
                for (var i = 0; i < cubes.length; i++) {
                    cubes[i].dispatchEvent(updateEnvelope);
                }
            }

            document.getElementById("attack-value").setAttribute('value', cubeEnvelopeAttack);

            break;
        }
        case 'envelope-decay': {
            cubeEnvelopeDecay = modifier;
            if (cubes != null) {
                for (var i = 0; i < cubes.length; i++) {
                    cubes[i].dispatchEvent(updateEnvelope);
                }
            }

            document.getElementById("decay-value").setAttribute('value', cubeEnvelopeDecay);

            break;
        }
        case 'envelope-sustain': {
            cubeEnvelopeSustain = modifier;
            if (cubes != null) {
                for (var i = 0; i < cubes.length; i++) {
                    cubes[i].dispatchEvent(updateEnvelope);
                }
            }

            document.getElementById("sustain-value").setAttribute('value', cubeEnvelopeSustain);

            break;
        }
        case 'envelope-release': {
            cubeEnvelopeRelease = modifier;
            if (cubes != null) {
                for (var i = 0; i < cubes.length; i++) {
                    cubes[i].dispatchEvent(updateEnvelope);
                }
            }

            document.getElementById("release-value").setAttribute('value', cubeEnvelopeRelease);

            break;
        }
        default:
            console.error("Errore: " + cmd + ", comando non identificato correttamente");
            break;

    }


}*/

function cubeManager(senderId, dataType, data, targetObj) {
    var cmd = data.split('-'); // command-index es: 1-on, 23-off
    var ind = cmd[0];
    var acc = cmd[1];
    var cubes = document.querySelectorAll('[index]');

    //console.log(data);
    for (var i = 0; i < cubes.length; i++) {
        if (cubes[i].getAttribute('index').indice == ind) {
            if (acc == 'on') {
                //console.log('accensione');
                cubes[i].dispatchEvent(eventOn);
            }
            else if (acc == 'off') {
                //console.log('spegnimento');
                cubes[i].dispatchEvent(eventOff);
            }
        }
    }
}

function noteSet(senderId, dataType, data, targetObj) {
    externalDrop = data;
}

function fillArrayMusicale(senderId, dataType, data, targetObj) {
    arrayMusicale = data;
}


function setSettings(senderId, dataType, data, targetObj) {

    cubeSettings = data;
    var cubes = document.querySelectorAll('[polysynth]');
    for (var i = 0; i < cubes.length; i++) {
        cubes[i].dispatchEvent(changeSettings);
    }
}

function sendDataForInitialization(senderId, dataType, data, targetObj) {
    console.log(data);
    nuovoClient = data;
}

function updateSettings(senderId, dataType, data, targetObj) {
    var cmd = data.split(':');
    var cubeInd = cmd[0];

    var cube;
    var cubes = document.querySelectorAll('[index]');
    for (var i = 0; i < cubes.length; i++) {
        if (cubes[i].getAttribute('index').indice == cubeInd)
            cube = cubes[i];
    }
    cubeSettings[cmd[0]][cmd[1]] = cmd[2];

    cube.dispatchEvent(changeSettings);

    console.log(data);
    console.log(cubeSettings);

}