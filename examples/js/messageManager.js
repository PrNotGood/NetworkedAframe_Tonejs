/*  Eventi per attivazione oggetti Musicali  */
/*  Necessari in quanto triggerare il click sul component genererebbe comunque bubbling  */
/*  E si andrebbe incontro ad un loop di messaggi inviati  */
/*  Probabile che mi basti un evento per accendere e uno per spegnere se riesco a implementare  */
/*  L'implementazione del vettore per gestire tutti i cubi  */
/*  OUTDATED, usati per gli elementi statici  */
eventOnSynth = new Event('eventOnSynth');
eventOffSynth = new Event('eventOffSynth');
eventOnOsc = new Event('eventOnOsc');
eventOffOsc = new Event('eventOffOsc');



/*  Eventi per elementi creati dinamicamente  */
eventOn = new Event('eventOn');
eventOff = new Event('eventOff');


//Incrementa l'index quando un'entità viene creata, ci saranno degli spazi vuoti dovuti a quando un utente si connette (viene generato l'avatar,
//ma non influiscono sul funzionamento)
function onConnect(){

    document.body.addEventListener('entityCreated', function (evt) {
        if(evt.detail.el.getAttribute('index').indice != undefined)
            index++;
    });

    NAF.connection.subscribeToDataChannel("arraynote", createArray);

    document.body.addEventListener('clientConnected', function (evt) {
        //console.error('clientConnected event. clientId =', evt.detail.clientId);
        var cubes = document.querySelectorAll('[polysynth]');
        var arrayNote = [];

        //empty spaces = undefined in teoria
        for(var i = 0; i < cubes.length; i++){
            var index = cubes[i].getAttribute('index').indice;
            arrayNote[index] = cubes[i].getAttribute('polysynth').note;
        }

        //NAF.connection.broadcastDataGuaranteed("arraynote", arrayNote); 
        NAF.connection.sendDataGuaranteed(evt.detail.clientId, "arraynote", arrayNote); 
    });

}

NAF.connection.subscribeToDataChannel('note-received', function (senderId, dataType, data, targetId) { 
    externalDrop = data;
});

/*  Metodo per la comunicazione attivazione e disattivazione cubi creati dinamicamente */
NAF.connection.subscribeToDataChannel('cube-commands', function(senderId, dataType, data, targetId){
    var cmd = data.split('-'); // command-index es: 1-on, 23-off
    var ind = cmd[0];
    var acc = cmd[1];
    var cubes = document.querySelectorAll('[index]');

    //console.log(data);
    for (var i = 0; i < cubes.length; i++) {
        if(cubes[i].getAttribute('index').indice == ind){
            if(acc == 'on'){
                console.log('accensione');
                cubes[i].dispatchEvent(eventOn);
            }
            else if(acc == 'off'){
                console.log('spegnimento');
                cubes[i].dispatchEvent(eventOff);
            }
        }
      }
});

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


/*function cbFunction(senderId, dataType, data, targetObj){
    //quando un nuovo utente si connette, invia un messaggio "request", questo è ciò che fanno coloro che lo ricevono
    //costruiscono un array con all'interno i valori delle note dei cubi e poi lo inviano
    if(data == "request"){
        var cubes = document.querySelectorAll('[polysynth]');
        var arrayNote = [];

        //empty spaces = undefined in teoria
        for(var i = 0; i < cubes.length; i++){
            var index = cubes[i].getAttribute('index').indice;
            arrayNote[index] = cubes[i].getAttribute('polysynth').note;
        }
        //console.log("ArrayNote: ");
        console.log(senderId);
        var destinatario = senderId;
        //NAF.connection.broadcastDataGuaranteed("arraynote", arrayNote); 
        NAF.connection.sendDataGuaranteed(senderId, "arraynote", arrayNote); 
    }
}*/

function createArray(senderId, dataType, data, targetObj){
    //funzione che assegna ad ogni cubo il suo valore ATTENTO CHE MAGARI GLI INDICI NON SONO IN ORDINE
    //es arrayNote [["D1","C2"],["B2","C3"], null,

    console.log(data);
    
    var cubes = document.querySelectorAll('[polysynth]');
    for(var i = 0; i < data.length; i++){
        var index = cubes[i].getAttribute('index').indice;

        //cubes[i].object3D.setAttribute("polysynth", {note: data[index]});
        console.log(data[index]);
        console.log(cubes[i].getAttribute('polysynth').note);

        cubes[i].setAttribute('polysynth', 'note', data[index]);
    }
}