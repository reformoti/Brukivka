(function(root){'use strict';const KEY='brukivka_cloud_binding_bonus_v1',PROFILE='brukivka_cloud_profile_v1',valid=p=>p&&/^[a-z0-9_]{3,24}$/.test(p.username||'');
function read(store){try{const p=JSON.parse(store.getItem(KEY));return valid(p)&&p.granted===true?p:null;}catch{return null;}}
function grant(store,username){if(!valid({username}))return false;store.setItem(KEY,JSON.stringify({username,granted:true}));return true;}
const keep=k=>k===KEY||k===PROFILE;
if(typeof module==='object'&&module.exports){module.exports={KEY,PROFILE,read,grant,keep};return;}
let memory=read(localStorage);if(!memory)try{const p=JSON.parse(localStorage.getItem(PROFILE));if(valid(p)){grant(localStorage,p.username);memory=read(localStorage);}}catch{}
root.BrukBindingBonus={multiplier:()=>memory?10:1,account:()=>memory?.username||'',grant(username){if(!valid({username}))return false;try{grant(localStorage,username);}catch{}memory={username,granted:true};root.dispatchEvent(new Event('bruk-binding-bonus'));return true;},keep};
root.addEventListener('storage',e=>{if(e.key===KEY){memory=read(localStorage);root.dispatchEvent(new Event('bruk-binding-bonus'));}});
})(typeof window==='undefined'?globalThis:window);
