const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const S=require('../neuron-siege'),art=require('../siege-art');
const settle=w=>{for(let i=0;i<650&&w.phase==='flying';i++)w.step(1/60);};

test('all three fortresses stay stable and every neuron belongs to the core network',()=>{
 for(let layout=0;layout<S.LAYOUTS.length;layout++){
  const w=new S.World({},layout),ids=new Set([w.core.id]);
  assert.equal(w.total,[16,18,22][layout]);assert(w.core.hp>55);
  for(let i=0;i<w.total;i++)for(const e of w.links){if(ids.has(e.from))ids.add(e.to);if(ids.has(e.to))ids.add(e.from);}
  assert.equal(ids.size,w.total);
  for(let i=0;i<900;i++)w.step(1/60);
  assert.equal(w.remaining,w.total);assert.equal(w.core.hp,w.coreMax);assert.equal(w.shots,5);assert(!w.overload);assert(!w.pending.length);
  assert(w.bodies.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)));
 }
});

test('each layout can be cleared with standard ammunition and no upgrades within five shots',()=>{
 const solutions=[[[-60,30]],[[-60,30],[-60,30]],[[-60,30],[-60,30],[-60,30],[-40,30]]];
 for(let layout=0;layout<3;layout++){
  const w=new S.World({},layout);
  for(const [x,y] of solutions[layout]){if(w.won)break;assert(w.launch({x,y}));settle(w);}
  assert(w.won,S.LAYOUTS[layout].name);assert.equal(w.remaining,0);assert(w.shots>=0);
 }
});

test('missing five shots cannot trigger the network or grant a victory on any layout',()=>{
 for(let layout=0;layout<3;layout++){
  const w=new S.World({},layout);
  for(let i=0;i<5;i++){assert(w.launch({x:70,y:50}));settle(w);}
  assert.equal(w.phase,'lost');assert.equal(w.remaining,w.total);assert(!w.overload);assert(!w.won);
 }
});

test('core destruction sends a delayed, single chain reaction that damages supporting blocks',()=>{
 const w=new S.World({},2);w.launch({x:70,y:50});
 const block=w.bodies.find(b=>b.kind==='block'),startHp=block.hp;
 w.hurt(w.core,1000);assert(w.overload);const count=w.pending.length;assert.equal(count,w.total-1);
 w.hurt(w.core,1000);assert.equal(w.pending.length,count);assert.equal(w.pulses.filter(p=>p.mega).length,1);
 for(let i=0;i<6;i++)w.step(1/60);assert.equal(w.remaining,w.total-1,'the distant cells do not disappear instantly');
 for(let i=0;i<240&&!w.won;i++)w.step(1/60);
 assert(w.won);assert.equal(w.remaining,0);assert(block.dead||block.hp<startHp);
});

test('overload on the final shot finishes before loss and restarting clears the network and preserves equipment',()=>{
 const w=new S.World({power:4,owned:['drill'],ammo:'drill'},1);w.shots=1;assert(w.launch({x:70,y:50}));w.hurt(w.core,1000);settle(w);assert(w.won);assert.equal(w.shots,0);
 w.reset();assert.equal(w.layoutIndex,1);assert.equal(w.upgrades.power,4);assert.equal(w.upgrades.ammo,'drill');assert.equal(w.remaining,18);assert(!w.overload);assert.equal(w.pending.length,0);assert.equal(w.shots,5);
 w.reset(w.upgrades,99);assert.equal(w.layoutIndex,0);
});

test('live canvas input pauses, switches layouts safely and awards a chain victory only once',()=>{
 let handlers={},raf=[],time=0,active=true,rewards=0,config={};
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 const canvas={width:1000,height:700,getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1000,height:700}),addEventListener:(k,f)=>handlers[k]=f,focus(){},setPointerCapture(){}};
 const win={BrukSiegeArt:art,document:{addEventListener(){}},addEventListener(){},requestAnimationFrame:f=>raf.push(f)};
 vm.runInNewContext(fs.readFileSync(require.resolve('../neuron-siege'),'utf8'),{window:win});
 const game=win.BrukNeuronSiege.create({canvas,isActive:()=>active,getSiege:()=>config,onMessage(){},onSuccess:()=>rewards++});
 function frames(n){for(let i=0;i<n;i++){time+=1000/60;raf.shift()(time);}}
 game.setActive(true);frames(120);handlers.pointerdown({pointerId:1,clientX:80,clientY:550,preventDefault(){}});handlers.pointerup({pointerId:1});frames(600);assert.equal(rewards,1);frames(180);assert.equal(rewards,1);
 game.setLayout(2);assert.equal(game.world.remaining,22);assert.equal(game.world.shots,5);assert.equal(game.world.phase,'ready');
 active=false;const before=game.world.time;frames(30);assert.equal(game.world.time,before);active=true;frames(30);assert(game.world.time>before);
 config={owned:['blast'],ammo:'blast'};game.reset();assert.equal(game.world.upgrades.ammo,'blast');assert.equal(game.world.layoutIndex,2);
 // Exercise the renderer's aiming, projectile, explosion, overload and failure states.
 handlers.pointerdown({pointerId:2,clientX:70,clientY:560,preventDefault(){}});frames(1);handlers.pointerup({pointerId:2});game.world.hurt(game.world.core,1000);frames(1);
 const ball=game.world.ball;game.world.explode(ball);frames(1);game.reset();game.world.phase='lost';frames(1);assert.equal(rewards,1);
});
