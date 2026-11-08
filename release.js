(function(root){
  'use strict';
  const release={version:'6.11.0',date:'2026-11-08',name:'Frontiers, Duels and Rankings'};
  root.BrukRelease=Object.freeze(release);
  if(root.document){
    document.querySelectorAll('[data-game-version]').forEach(el=>el.textContent='v'+release.version);
    document.querySelectorAll('[data-release-date]').forEach(el=>el.textContent=new Date(release.date+'T00:00:00Z').toLocaleDateString('uk-UA',{timeZone:'UTC'}));
    document.title='Бруківка · v'+release.version;
  }
})(typeof window==='undefined'?globalThis:window);

