(function(root){'use strict';const URL='homow.html';if(typeof module==='object'&&module.exports){module.exports={URL};return;}
// Open the self-contained single-player build hosted with Brukivka. It needs no Render service.
root.BrukHoMoWLaunch={open(){root.dispatchEvent(new Event('bruk-cloud-snapshot'));location.assign(URL);}};
})(typeof window==='undefined'?globalThis:window);
