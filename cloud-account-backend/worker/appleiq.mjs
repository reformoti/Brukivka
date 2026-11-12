export const APPLE_MAX_BYTES=6*1024*1024;
 const TEST='apple-iq-protocol-02',STORY='apple-iq-story-01',AUDIO='appleiq-audio-01',RESET='apple-iq-ended-01',MAX=2*1024*1024;
 const KEYS=Object.freeze([TEST,STORY,AUDIO]),PHASES=['film','mind','sleep','cycle','resolve','school','quiet-day','bad-end','ultimate','ultimate-win','happy-end','vegetable','genius-hub','genius-battle','genius-loss'];
 const backupKey=k=>k+'-backup-01',corruptKey=k=>k+'-corrupt-01',object=v=>v&&typeof v==='object'&&!Array.isArray(v),int=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b,number=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 function valid(key,p){if(!object(p))return false;
  if(key===TEST)return int(p.index,0,20)&&Array.isArray(p.responses)&&p.responses.length===20&&p.responses.every(v=>v===null||int(v,0,5))&&number(p.elapsed,0,1e15)&&(p.round===undefined||int(p.round,0,1e6))&&(p.pendingRetake===undefined||typeof p.pendingRetake==='boolean')&&(p.format===undefined||typeof p.format==='string'&&p.format.length<=80);
  if(key===AUDIO)return (number(p.volume,0,1)||Array.isArray(p.volumes)&&[2,3].includes(p.volumes.length)&&p.volumes.every(v=>number(v,0,1)))&&(p.muted===undefined||typeof p.muted==='boolean');
  if(key!==STORY)return false;const failed=p.iq===-1&&p.ultimateStatus==='failed'&&p.phase==='vegetable';
  if(p.version!==1||!PHASES.includes(p.phase)||!int(p.step,0,5)||!int(p.iq,8,250)&&!failed||!number(p.filmTime,0,36)||!number(p.potential,0,1e30)&&!(failed&&p.potential===-1000))return false;
  const bounds={qualityLevel:42,speedLevel:80,appleCount:9,shakeLevel:24,imaginationLevel:24,focusLevel:16,synergyLevel:12,lightLevel:3,shadowLevel:3,waterLevel:3,retakeCount:1e6};for(const[k,max]of Object.entries(bounds))if(p[k]!==undefined&&!int(p[k],k==='appleCount'?1:0,max))return false;
  if(p.eventTime!==undefined&&!number(p.eventTime,0,100))return false;
  if(p.geniusArena!==undefined){const a=p.geniusArena;if(!object(a)||!int(a.next,0,10)||!['ready','recovery','complete'].includes(a.status))return false;if(a.fight!==null&&a.fight!==undefined){const f=a.fight;if(!object(f)||f.version!==1||!int(f.index,0,9)||![1,2].includes(f.round)||!['active','win','loss'].includes(f.result)||!number(f.hp,0,100)||!number(f.enemyHP,0,5000)||!number(f.time,0,100))return false;for(const k of ['shots','enemyShots'])if(f[k]!==undefined&&(!Array.isArray(f[k])||f[k].length>100||!f[k].every(s=>object(s)&&['x','y','vx','vy','life'].every(n=>number(s[n],-1e9,1e9)))))return false}}
  return true
 }

export function validateAppleSnapshot(s){
 if(!s||s.schema!==1||s.app!=='AppleIQ'||!object(s.entries))throw Error('Невірний формат AppleIQ.');
 const pairs=Object.entries(s.entries);
 if(!pairs.length||pairs.length>4||!pairs.some(([k])=>k===TEST||k===STORY||k===RESET))throw Error('Прогрес AppleIQ не знайдено.');
 if(s.entries[RESET]!==undefined&&(s.entries[RESET]!=='1'||s.entries[TEST]!==undefined||s.entries[STORY]!==undefined))throw Error('Невірний стан нової гри.');
 for(const[k,v]of pairs){if(![...KEYS,RESET].includes(k)||typeof v!=='string'||v.length>MAX)throw Error('Сторонні дані у збереженні.');if(k!==RESET){let p;try{p=JSON.parse(v)}catch{throw Error('Прогрес пошкоджено.')}if(!valid(k,p))throw Error('Прогрес пошкоджено.')}}
 if(new TextEncoder().encode(JSON.stringify(s)).length>APPLE_MAX_BYTES)throw Error('Збереження завелике: максимум 6 МБ.');
 return true;
}
