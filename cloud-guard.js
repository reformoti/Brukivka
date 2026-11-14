/* A restore must survive pagehide autosaves from every open game. */
(()=>{'use strict';const proto=Storage.prototype,get=proto.getItem,set=proto.setItem,remove=proto.removeItem,LOCK='brukivka_cloud_restore_lock_v1',MARK='brukivka_cloud_restore_owner_v1';
function locked(){try{const v=JSON.parse(get.call(localStorage,LOCK));return v&&Date.now()-v.at<30000;}catch{return false;}}
window.BrukCloudRaw={get:(k)=>get.call(localStorage,k),set:(k,v)=>set.call(localStorage,k,v),remove:k=>remove.call(localStorage,k),storage:{get length(){return localStorage.length;},key:i=>localStorage.key(i),getItem:k=>get.call(localStorage,k),setItem:(k,v)=>set.call(localStorage,k,v),removeItem:k=>remove.call(localStorage,k)}};
proto.setItem=function(k,v){if(this===localStorage&&(/^(brukivka|homow_options_)/.test(k)||k==='xar_achievements_Brukivka_v1')&&!String(k).startsWith('brukivka_cloud_')&&locked())return;return set.call(this,k,v);};
if(document.currentScript?.dataset.cloudMain==='1'){try{const lock=JSON.parse(get.call(localStorage,LOCK));if(lock?.id===get.call(sessionStorage,MARK)){remove.call(localStorage,LOCK);remove.call(sessionStorage,MARK);}}catch{}}
window.addEventListener('storage',e=>{if(e.key==='brukivka_cloud_applied_v1'&&e.newValue)location.reload();});})();
