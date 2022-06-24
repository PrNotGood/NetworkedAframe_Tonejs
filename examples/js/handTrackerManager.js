/*  Hand controller  */
AFRAME.registerComponent('tracked-vr-hands', {
    onEnterVR() {
      if (AFRAME.utils.device.isMobile()) return; // exclude e.g. cardboard, which lacks tracked controllers
      if (document.getElementById('my-tracked-right-hand')) return; // don't add them in more than once!
      // add these with JS:
      // <a-entity hand-controls="hand:left" networked="template:#left-hand-template;attachTemplateToLocal:true;"></a-entity>
      // <a-entity hand-controls="hand:right" networked="template:#right-hand-template;attachTemplateToLocal:true;"></a-entity>
      ['left', 'right'].forEach(side => {
        const el = document.createElement('a-entity')
        el.setAttribute('hand-controls', {hand: side});
        el.setAttribute('networked', {template: `#${side}-hand-template`, attachTemplateToLocal: false});
        el.setAttribute('id', `my-tracked-${side}-hand`);
        // note that the ID will be applied to THIS client's hands,
        // but not other connected clients,
        // and not on the machine of other connected clients
        this.el.appendChild(el);
      })
    },
    init() {
      this.el.sceneEl.addEventListener('enter-vr', this.onEnterVR.bind(this));
    }
  })