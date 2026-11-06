(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BrukMining=factory();})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const UNIT=1000,MAX=9000000000000,UAH_PER_COIN=120;
  const GAMES={mines:{name:'QUARRY · Mines',price:35000,file:'quarry.html'},orbit:{name:'BRUK ORBIT',price:60000,file:'orbit.html'}};
  const GPU=Array.from({length:31},(_,level)=>({level,name:level===0?'Вбудована графіка':`BRUK ${level<10?'GT':level<20?'RTX':'NOVA'} ${String(level).padStart(2,'0')}`,rate:Math.round(5*1.27**level)}));
  const int=(v,max=MAX)=>Number.isSafeInteger(v)&&v>=0?Math.min(max,v):0;
  function normalize(raw){const r=raw&&typeof raw==='object'?raw:{};return {coins:int(r.coins),mined:int(r.mined),carry:Number.isFinite(r.carry)&&r.carry>=0&&r.carry<1?r.carry:0,running:r.running===true,licenses:Object.keys(GAMES).filter(id=>Array.isArray(r.licenses)&&r.licenses.includes(id))};}
  function rate(gpu){return GPU[int(gpu,30)].rate;}
  function tick(s,seconds,gpu,owned=true){if(!owned||!s.running||!Number.isFinite(seconds)||seconds<=0)return 0;const exact=rate(gpu)*Math.min(5,seconds)+(s.carry||0),n=Math.min(MAX-s.coins,Math.floor(exact+1e-9));s.carry=s.coins+n>=MAX?0:Math.max(0,exact-n);s.coins+=n;s.mined=Math.min(MAX,s.mined+n);return n;}
  function unlock(s,id){if(!Object.hasOwn(GAMES,id)||s.licenses.includes(id)||s.coins<GAMES[id].price)return false;s.coins-=GAMES[id].price;s.licenses.push(id);return true;}
  function exchange(s,coins){if(!Number.isSafeInteger(coins)||coins<1||coins>Math.floor(s.coins/UNIT)||coins>1000000)return 0;s.coins-=coins*UNIT;return coins*UAH_PER_COIN;}
  return {UNIT,MAX,UAH_PER_COIN,GAMES,GPU,normalize,rate,tick,unlock,exchange};
});
