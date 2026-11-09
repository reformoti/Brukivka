(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BrukLocalToolsCore=factory();})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  function apply(s,action,c){
    if(action==='add100m'||action==='add500k'){s.balance=Math.min(Number.MAX_SAFE_INTEGER,s.balance+(action==='add100m'?100000000:500000));}
    else if(action==='maxUpgrades'){s.brickTier=c.brick;s.phoneTier=c.phone;s.strength=c.strength;s.pocketTier=c.pocket;s.pcOwned=true;s.monitorTier=c.monitor;s.pcUpgrades={cpu:c.cpu,gpu:c.gpu,ram:c.ram};}
    else if(action==='maxNmt'){s.tests={...c.tests};s.attempted=Object.fromEntries(Object.keys(c.tests).map(k=>[k,true]));}
    else if(action==='unlockAll'){s.pcOwned=true;s.monitorTier=Math.max(1,s.monitorTier);s.deliveryOwned=[...c.routes];s.wallpapersOwned=[...c.wallpapers];s.mining.licenses=[...c.games];for(const id of c.islands)s.islands[id]=true;}
    else return false;
    return true;
  }
  return {apply};
});
