/*  Componente che registra la posizione e rotazione del player per riprodurre audio direzionale in modo corretto  */
AFRAME.registerComponent("position-listener", {
  init: function(){
    position = new THREE.Vector3();
    direction = new THREE.Vector3();
    lookat = new THREE.Vector3();

    // Prendo la posizione e la direzione del mio oggetto in riferimento al mondo in cui mi trovo
    this.el.object3D.getWorldPosition(position);
    this.el.object3D.getWorldDirection(direction);

    Tone.Listener.positionX.value = position.x;
    Tone.Listener.positionY.value = position.y;
    Tone.Listener.positionZ.value = position.z;

    //vanno invertite, non sono sicuro del perchè, ma immagino perchè l'audio proviene dalla direzione opposta a quella in cui guardo
    Tone.Listener.forwardX.value = -direction.x;
    Tone.Listener.forwardY.value = direction.y; 
    Tone.Listener.forwardZ.value = -direction.z;

    // direzione della punta della testa, statica per il momento, andrà cambiata per il vr headset, controllare la documentazione,
    //anche il .up, anche se è un valore statico
    Tone.Listener.upX.value = 0;
    Tone.Listener.upY.value = 1;
    Tone.Listener.upZ.value = 0;

  },
  tick: function(){

    this.el.object3D.getWorldPosition(position);
    this.el.object3D.getWorldDirection(direction);
    //this.el.object3D.lookAt(lookat); 
    //console.log(lookat);
    
    Tone.Listener.positionX.value = position.x;
    Tone.Listener.positionY.value = position.y;
    Tone.Listener.positionZ.value = position.z;

    Tone.Listener.forwardX.value = -direction.x;
    Tone.Listener.forwardY.value = direction.y; 
    Tone.Listener.forwardZ.value = -direction.z;

    //console.log(position);

  }
});

