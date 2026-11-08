(function(root){'use strict';const URL='https://homow.onrender.com/';if(typeof module==='object'&&module.exports){module.exports={URL};return;}
// The official game opens immediately; legacy local server settings are ignored.
root.BrukHoMoWLaunch={open(){root.dispatchEvent(new Event('bruk-cloud-snapshot'));location.assign(URL);}};
})(typeof window==='undefined'?globalThis:window);
