(() => {'use strict';
const paths={
'chess':'<path d="M17 50h30M20 45h24l-3-17H23zM21 27V15h6v6h5v-8h5v8h6v-6h5v12z"/>',
'homow':'<path d="M14 18l18-8 18 8v16q-2 14-18 22Q16 48 14 34z"/><path d="M22 39l21-22m-24 7 22 22m-22-8 7 7m12-25 7 7"/>',
'runner':'<path d="M10 54l16-44m12 0 16 44M32 13v7m0 7v7m0 7v7M18 41l8-8h12l8 8-8 10H26z"/>',
'merge':'<rect x="12" y="12" width="17" height="17" rx="4"/><rect x="35" y="12" width="17" height="17" rx="4"/><rect x="12" y="35" width="17" height="17" rx="4"/><path d="M36 44h16m-8-8v16"/>',
'breakout':'<path d="M10 15h44m-44 9h44m-30-9v9m16-9v9M17 52h30m-9-18-6 10"/><circle cx="41" cy="32" r="5"/>',
'memory':'<rect x="10" y="14" width="28" height="39" rx="5" transform="rotate(-8 24 33)"/><rect x="28" y="10" width="27" height="39" rx="5" transform="rotate(10 40 30)"/><path d="M40 20l6 9-6 10-6-10z"/>',
'rally':'<path d="M9 39l4-9 9-3 6-12h13l11 16 4 4v10H9zM23 27h22M15 46a6 6 0 1 0 12 0m13 0a6 6 0 1 0 12 0"/>',
'stack':'<path d="M12 49h40V38H12zm5-15h35V23H17zm-6-15h34V8H11z"/>',
'cs2':'<circle cx="32" cy="32" r="17"/><circle cx="32" cy="32" r="4"/><path d="M32 7v13m0 24v13M7 32h13m24 0h13"/>',
'minihoi':'<path d="M16 55V10m0 0 13 4 16-4 8 4v26l-12-4-12 4-13-4M24 23l7 7 13-12"/>',
'quarry':'<path d="M15 53l24-38M12 19q19-17 40 6L34 20l-5-7"/><path d="M39 43l6-10 9 11-8 9z"/>',
'orbit':'<circle cx="32" cy="32" r="13"/><ellipse cx="32" cy="32" rx="27" ry="9" transform="rotate(-28 32 32)"/><path d="m44 8 2 5 5 2-5 2-2 5-2-5-5-2 5-2"/>'
};
const hues={chess:['#566d9d','#151d38'],homow:['#82a86c','#183b30'],runner:['#e0a965','#743e32'],merge:['#bda776','#4a4250'],breakout:['#6fb6d3','#1b385e'],memory:['#b393d9','#3b295c'],rally:['#ec7869','#692f49'],stack:['#8dc5b6','#255a61'],cs2:['#e9b064','#6e4826'],minihoi:['#c9b47b','#454636'],quarry:['#bdad84','#4b493a'],orbit:['#a6a4ea','#343064']};
window.BrukSteamIcon=(id)=>{const p=paths[id]||paths.homow,c=hues[id]||hues.homow;return '<svg class="steam-icon" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="game-'+id+'" x2="0" y2="1"><stop stop-color="'+c[0]+'"/><stop offset="1" stop-color="'+c[1]+'"/></linearGradient></defs><rect x="1" y="1" width="62" height="62" rx="14" fill="url(#game-'+id+')"/><rect x="2" y="2" width="60" height="60" rx="13" fill="none" stroke="#ffffff25"/><g stroke="#fff1d9" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">'+p+'</g></svg>';};
document.querySelectorAll('.steam-games>*').forEach(target=>{let id=target.getAttribute('href')?.split('?')[0].replace('.html','')|| (target.id==='steamSelectCs'?'cs2':'minihoi');if(id==='realms')id='homow';const art=target.querySelector('.steam-game-art');if(art)art.innerHTML=window.BrukSteamIcon(id);});
})();
