(function(root){
  'use strict';
  const themes={classic:{name:'Оригінальний',description:'М’які картки, сині акценти та звичний інтерфейс.'},crimson:{name:'Crimson Minimal',description:'Точні лінії, чорний фон і червоні акценти.'},paper:{name:'Paper Studio',description:'Світла типографіка, паперова сітка та чорнильні панелі.'},terminal:{name:'Terminal',description:'Моноширинна консоль, прямі рамки та зелений люмінофор.'},aurora:{name:'Aurora Glass',description:'Прозорі шари, великі заокруглення та холодне світло.'}};
  const normalize=value=>Object.hasOwn(themes,value)?value:'classic';
  if(typeof module==='object'&&module.exports){module.exports={themes,normalize};return;}
  let current='classic';try{current=normalize(localStorage.getItem('brukivka_design_v1'));}catch{}
  function apply(value,persist=true){current=normalize(value);document.documentElement.dataset.design=current;if(persist)try{localStorage.setItem('brukivka_design_v1',current);}catch{}root.dispatchEvent(new CustomEvent('bruk-design',{detail:current}));}
  root.BrukDesign={themes,get:()=>current,set:apply};apply(current,false);
  root.addEventListener('storage',e=>{if(e.key==='brukivka_design_v1')apply(e.newValue,false);});
})(typeof window==='undefined'?globalThis:window);
