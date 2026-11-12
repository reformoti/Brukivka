const {test}=require('node:test'),assert=require('node:assert/strict'),B=require('../sky-boss'),S=require('../neuron-siege');
test('the sky battle waits for an explicit start and begins with exactly three HP',()=>{
 const w=new B.World();assert.equal(w.player.hp,3);assert.equal(w.phase,'intro');assert(!w.fire());w.step(30,{fire:true,x:1});assert.equal(w.time,0);assert.equal(w.enemies.length,0);assert(w.start());assert(!w.start());assert(w.fire());assert(!w.fire());
});
test('ordinary hits take one HP each, respect brief protection, and three hits destroy the plane',()=>{
 const w=new B.World();w.start();assert(w.hit());assert.equal(w.player.hp,2);assert(!w.hit());w.player.invuln=0;assert(w.hit());assert.equal(w.player.hp,1);w.player.invuln=0;assert(w.hit());assert.equal(w.player.hp,0);assert.equal(w.phase,'lost');assert(!w.hit());assert(!w.fire());assert(!w.won);
});
test('a rare neutron kills instantly even while ordinary collision protection is active',()=>{
 const w=new B.World();w.start();w.player.invuln=10;w.enemies.push({x:w.player.x+80,y:w.player.y,vx:-10000,vy:0,r:8,kind:'neutron',dead:false});w.step(.02);assert.equal(w.player.hp,0);assert.equal(w.phase,'lost');
});
test('neurons, birds, storms and debris use the same one-hit collision rule and cannot hit twice',()=>{
 for(const kind of ['neuron','bird','storm','debris']){const w=new B.World();w.start();w.enemies.push({x:w.player.x,y:w.player.y,baseY:w.player.y,vx:0,vy:0,r:20,kind,seed:0,dead:false});w.step(.01);assert.equal(w.player.hp,2,kind);w.step(.01);assert.equal(w.player.hp,2,kind);}
 const w=new B.World();for(let i=0;i<4;i++)w.spawnObstacle();assert.deepEqual(new Set(w.obstacles.map(o=>o.kind)),new Set(['bird','storm','debris']));
});
test('rare neutron salvos show a warning before firing and aim at the telegraphed point without homing',()=>{
 const w=new B.World();w.start();w.volley=8;w.volleyClock=0;w.step(.01);assert.equal(w.warnings.length,1);const warning={...w.warnings[0]};assert(!w.enemies.some(e=>e.kind==='neutron'));for(let i=0;i<45;i++)w.step(1/60);assert(!w.enemies.some(e=>e.kind==='neutron'));w.player.y=600;for(let i=0;i<12;i++)w.step(1/60);const neutron=w.enemies.find(e=>e.kind==='neutron');assert(neutron);const angle=Math.atan2(warning.ty-warning.y,warning.tx-warning.x);assert(Math.abs(neutron.vx-Math.cos(angle)*350)<1e-8);assert(Math.abs(neutron.vy-Math.sin(angle)*350)<1e-8);
});
test('brick projectiles can stop regular neurons but cannot shoot down a neutron',()=>{
 for(const kind of ['neuron','neutron']){const w=new B.World();w.start();w.enemies.push({x:350,y:w.player.y,vx:0,vy:0,r:10,kind,dead:false});w.bullets.push({x:330,y:w.player.y,vx:900,r:10,damage:20,dead:false});w.step(.02);assert.equal(w.enemies.some(e=>e.kind===kind),kind==='neutron');}
});
test('moving and firing can beat the real brain model with purchased equipment and victory stops damage',()=>{
 const w=new B.World({power:6,penetration:6,ammo:'drill'},S.AMMO.drill);w.start();let seenPhases=new Set();
 for(let i=0;i<3600&&w.phase==='playing';i++){
  const travel=(w.brain.x-w.player.x-49)/(860*S.AMMO.drill.speed),target=350+Math.sin((w.time+travel)*.75)*142;
  w.step(1/60,{x:w.player.x<500?1:0,y:Math.max(-1,Math.min(1,(target-w.player.y)/25)),fire:true});seenPhases.add(w.bossPhase);
 }
 assert(w.won);assert.equal(w.brain.hp,0);assert(w.player.hp>0);assert(seenPhases.has(2));assert(seenPhases.has(3));const hp=w.player.hp;assert(!w.hit(true));assert.equal(w.player.hp,hp);
});
test('controls clamp the plane inside the sky and diagonal input does not increase its speed',()=>{
 const a=new B.World(),b=new B.World();a.start();b.start();const p={x:a.player.x,y:a.player.y};a.step(.05,{x:1});b.step(.05,{x:1,y:1});assert(Math.abs(Math.hypot(a.player.x-p.x,a.player.y-p.y)-Math.hypot(b.player.x-p.x,b.player.y-p.y))<1e-8);for(let i=0;i<100;i++)a.step(.05,{x:-1,y:-1});assert(a.player.x>=60);assert(a.player.y>=155);
});
test('the 85 percent penalty is an exact integer charge, preserves negative balances and never exceeds funds',()=>{
 for(const balance of [0,1,7,100,1000,228148867690450,Number.MAX_SAFE_INTEGER]){const fee=B.penaltyForBalance(balance);assert.equal(fee,Number(BigInt(balance)*85n/100n));assert(fee>=0&&fee<=balance);assert(Number.isSafeInteger(balance-fee));}
 assert.equal(B.penaltyForBalance(1000),850);assert.equal(B.penaltyForBalance(-500),0);assert.equal(B.penaltyForBalance(Infinity),0);assert.equal(B.penaltyForBalance('1000'),0);
});
