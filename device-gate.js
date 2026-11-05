(function(root){
  'use strict';
  const detect=(ua,touch=0)=>/Android|iPhone|iPod|iPad|Windows Phone|Mobile|Tablet/i.test(ua)||(/Macintosh/i.test(ua)&&touch>1);
  if(typeof module==='object'&&module.exports){module.exports={detect};return;}
  const blocked=detect(navigator.userAgent,navigator.maxTouchPoints||0);root.BrukDevice={blocked};
  if(blocked){document.documentElement.dataset.device='blocked';document.addEventListener('DOMContentLoaded',()=>{const gate=document.createElement('main');gate.id='deviceUnavailable';gate.innerHTML='<span>BRUKIVKA</span><h1>Недоступно на телефоні</h1><p>Відкрий гру на комп’ютері з клавіатурою.</p>';document.body.append(gate);});}
})(typeof window==='undefined'?globalThis:window);
