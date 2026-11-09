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
  function realm(world,text,R){
    const m=typeof text==='string'&&/^(UPLVL|DOWNLVL|GIVEMONEY)\(([1-9]\d{0,8})\)$/.exec(text.trim());
    if(!m)return false;
    const n=Number(m[2]),s=world.state;
    if(m[1]==='GIVEMONEY'){if(s.silver+n>100000000)return false;world.creditSilver(n);}
    else{s.level=m[1]==='UPLVL'?Math.min(R.levelCap(s),s.level+n):Math.max(1,s.level-n);s.xp=0;s.hp=m[1]==='UPLVL'?R.maxHp(s):Math.min(s.hp,R.maxHp(s));s.mana=m[1]==='UPLVL'?R.maxMana(s):Math.min(s.mana,R.maxMana(s));}
    return true;
  }
  return {apply,realm};
});
