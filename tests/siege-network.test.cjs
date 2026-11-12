const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const S=require('../neuron-siege'),art=require('../siege-art'),Boss=require('../sky-boss');
const settle=w=>{for(let i=0;i<650&&['flying','intercepted'].includes(w.phase);i++)w.step(1/60);};
test('nine increasingly dense fortresses stay stable and every cell belongs to a connected network',()=>{
 for(let stage=0;stage<9;stage++){
  const w=new S.World({},stage),ids=new Set([w.core.id]);assert.equal(w.total,18+stage*4);assert.equal(w.cores.length,2+Math.floor(stage/3));assert.equal(w.bodies.filter(b=>b.fixed).length,1+Math.floor(stage/3));
  for(let i=0;i<w.total;i++)for(const e of w.links){if(ids.has(e.from))ids.add(e.to);if(ids.has(e.to))ids.add(e.from);}assert.equal(ids.size,w.total);
  for(let i=0;i<900;i++)w.step(1/60);assert.equal(w.remaining,w.total);assert(w.cores.every(c=>c.hp===c.maxHp));assert.equal(w.shots,5);assert(!w.overload);assert(!w.pending.length);assert(w.bodies.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)));
  if(stage){assert(w.ceiling>S.STAGES[stage-1].ceiling);assert(w.layout.barrierHp>S.STAGES[stage-1].barrierHp);}
 }
});
test('each fortress has a physical solution within its purchased ammunition budget',()=>{
 const paths=[[[ -75,20],[-55,50]],[[-75,20],[-25,10]],[[-45,20],[-55,10]],[[-65,20],[-45,20]],[[-65,20],[-35,20]],[[-45,20],[-45,20],[-25,20],[-25,-35],[-45,10]],[[-45,20],[-75,20],[-25,20]],[[-55,20],[-65,20],[-45,20],[-35,10]],[[-90,35],[-45,20],[-35,20],[-25,20]]];
 for(let stage=0;stage<9;stage++){const w=new S.World(stage?{power:6,penetration:6,stock:12,owned:['drill'],ammo:'drill'}:{},stage);for(const [x,y] of paths[stage]){if(w.won)break;assert(w.launch({x,y}));for(let i=0;i<230&&['flying','intercepted'].includes(w.phase);i++)w.step(.045);}assert(w.won,'stage '+(stage+1));assert.equal(w.remaining,0);assert(w.shots>=0);}
});
test('five misses cannot activate cores, bypass barriers or grant victory on any fortress',()=>{
 for(let stage=0;stage<9;stage++){const w=new S.World({},stage);for(let i=0;i<5;i++){assert(w.launch({x:70,y:50}));settle(w);}assert.equal(w.phase,'lost');assert.equal(w.remaining,w.total);assert(!w.overload);assert(!w.won);assert.equal(w.bodies.filter(b=>b.fixed).length,w.layout.barriers);}
});
test('a core only overloads its own ordinary neurons; other cores survive until directly destroyed',()=>{
 const w=new S.World({},8);w.launch({x:70,y:50});const first=w.cores[0],others=w.cores.slice(1);w.hurt(first,10000);const scheduled=w.pending.length;assert(scheduled>0);assert(w.pending.every(p=>w.bodies.find(b=>b.id===p.id).cluster===first.cluster));w.hurt(first,10000);assert.equal(w.pending.length,scheduled);
 for(let i=0;i<240;i++)w.step(1/60);assert(others.every(c=>!c.dead));assert(!w.won);assert(w.remaining>0);
 for(const c of others)w.hurt(c,10000);for(let i=0;i<240&&!w.won;i++)w.step(1/60);assert(w.won);assert.equal(w.remaining,0);assert(w.pulses.some(p=>p.mega));
});
test('last-shot overload completes before loss and restarting preserves equipment but clears the network',()=>{
 const w=new S.World({power:4,stock:5,owned:['drill'],ammo:'drill'},1);w.shots=1;assert(w.launch({x:70,y:50}));for(const core of w.cores)w.hurt(core,10000);settle(w);assert(w.won);assert.equal(w.shots,0);w.reset();assert.equal(w.layoutIndex,1);assert.equal(w.upgrades.power,4);assert.equal(w.upgrades.ammo,'drill');assert.equal(w.remaining,22);assert(!w.overload);assert.equal(w.pending.length,0);assert.equal(w.shots,10);
});
test('live input advances and saves stages, gates the boss, pauses and charges each defeat only once',()=>{
 let handlers={},docHandlers={},raf=[],time=0,active=true,rewards=0,penalties=0,config=S.normalizeUpgrade();
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 const canvas={width:1000,height:700,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1000,height:700}),addEventListener:(k,f)=>handlers[k]=f,focus(){},setPointerCapture(){}};
 const win={BrukSkyBoss:Boss,BrukSiegeArt:art,document:{addEventListener:(k,f)=>docHandlers[k]=f},addEventListener(){},requestAnimationFrame:f=>raf.push(f)};
 vm.runInNewContext(fs.readFileSync(require.resolve('../neuron-siege'),'utf8'),{window:win});
 const game=win.BrukNeuronSiege.create({canvas,isActive:()=>active,getSiege:()=>config,onMessage(){},onSuccess:()=>rewards++,onSiegeClear:s=>config=S.advance(config,s),onSiegeSelect:s=>config=S.selectStage(config,s),onBossDefeat:()=>{penalties++;return 850;}});
 function frames(n){for(let i=0;i<n;i++){time+=1000/60;raf.shift()(time);}}
 const key=(code,repeat=false)=>docHandlers.keydown({code,repeat,target:{closest:()=>false},preventDefault(){}});
 game.setActive(true);assert.equal(game.setLayout(9),false);frames(120);
 for(const [x,y] of [[-75,20],[-55,50]]){handlers.pointerdown({pointerId:1,clientX:140+x,clientY:520+y,preventDefault(){}});handlers.pointerup({pointerId:1});frames(600);}
 assert.equal(rewards,1);assert.equal(config.unlocked,1);assert.equal(config.stage,1);frames(120);assert.equal(rewards,1);game.reset();assert.equal(game.world.layoutIndex,1);
 active=false;const before=game.world.time;frames(30);assert.equal(game.world.time,before);active=true;frames(30);assert(game.world.time>before);
 config.unlocked=9;assert(game.setLayout(9));assert(game.world.isBoss);assert.equal(game.world.phase,'intro');key('Space',true);assert.equal(game.world.phase,'intro');key('Space');frames(10);docHandlers.keyup({code:'Space'});assert.equal(game.world.phase,'playing');
 for(let i=0;i<3;i++){game.world.player.invuln=0;game.world.hit();}frames(1);assert.equal(penalties,1);assert.equal(game.world.lossCharged,850);frames(100);assert.equal(penalties,1);assert.equal(rewards,1);
 key('KeyR');assert.equal(game.world.player.hp,3);assert.equal(game.world.phase,'intro');key('Enter');game.world.hit(true);frames(1);assert.equal(penalties,2);frames(20);assert.equal(penalties,2);
});
