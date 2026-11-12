const test=require('node:test');
const assert=require('node:assert/strict');
const {LEVELS,moveMaze,THROW,dronesAt,shotFromPull,catchesWindow,FlightWorld}=require('../delivery.js');

test('delivery routes offer the requested multipliers',()=>{
  assert.deepEqual(LEVELS.map(level=>level.multiplier),[.1,1,3,10,250]);
});
test('the supplied maze has a traversable route through its actual corridors',()=>{
  let position={x:.65,y:5};
  for(const [x,y] of [[1,1],[3,1],[3,3],[7,3],[7,5],[9.5,5]]){
    position=moveMaze(position,{x,y});assert(!position.blocked);
  }
  assert(position.won);
});
test('a fast drag cannot teleport across a maze wall or out of bounds',()=>{
  const wall=moveMaze({x:3,y:5},{x:9.5,y:5});
  assert(wall.blocked);assert(!wall.won);assert(wall.x<4);
  const edge=moveMaze({x:1,y:1},{x:-100,y:1});assert(edge.blocked);assert(edge.x>0);
});
test('longer pull at the same angle produces a higher ballistic arc',()=>{
  const short=shotFromPull({x:-30,y:40}),long=shotFromPull({x:-60,y:80});
  assert(long.power>short.power);
  const peak=shot=>shot.y-shot.vy**2/(2*THROW.gravity);
  assert(peak(long)<peak(short));
  assert(Math.hypot(...Object.values({x:long.x-THROW.anchor.x,y:long.y-THROW.anchor.y}))<=THROW.maxPull);
});
test('gravity advances the launched brick along a parabolic path',()=>{
  const world=new FlightWorld();world.launch({x:-50,y:80});const before={...world.ball};world.step(.1);
  assert(Math.abs(world.ball.x-(before.x+before.vx*.1))<1e-6);
  assert(Math.abs(world.ball.y-(before.y+before.vy*.1+THROW.gravity*.1*.1/2))<1e-6);
  assert(Math.abs(world.ball.vy-(before.vy+THROW.gravity*.1))<1e-6);
});
test('only descending entry inside the open window counts',()=>{
  const x=(THROW.window.left+THROW.window.right)/2,y=THROW.window.plane-THROW.radius;
  assert(catchesWindow({x,y:y-3},{x,y:y+3,vy:200}));
  assert(!catchesWindow({x,y:y+3},{x,y:y-3,vy:-200}));
  assert(!catchesWindow({x:800,y:y-3},{x:800,y:y+3,vy:200}));
});
test('a reachable aimed throw succeeds; a weak throw eventually misses',()=>{
  for(const [pull,outcome] of [[{x:-54,y:78},'success'],[{x:-10,y:20},'miss']]){
    const world=new FlightWorld();assert(world.launch(pull));
    for(let i=0;i<2400&&world.phase==='flying';i++)world.step(1/240);
    assert.equal(world.phase,outcome);
    if(outcome==='success')assert(world.ball.vy>0);
  }
  assert(!new FlightWorld().launch({x:0,y:0}));
});
test('drone patrols remain in their respective zones over repeated circuits',()=>{
  for(let time=0;time<180;time+=.17)dronesAt(time).forEach((d,i)=>{
    const z=THROW.zones[i];assert(d.x>=z.left&&d.x<=z.right);assert(d.y>=z.top&&d.y<=z.bottom);
  });
});
test('a drone destroys the brick and ends its flight without a delivery reward',()=>{
  const world=new FlightWorld(),d=dronesAt(0)[0];
  world.phase='flying';world.ball={x:d.x-33,y:d.y,vx:300,vy:0};world.step(.01);
  assert(world.hitDrone);assert.equal(world.phase,'destroyed');const old={...world.ball};world.step(.2);assert.equal(world.ball.x,old.x);assert.equal(world.ball.y,old.y);
});
test('walls bounce the projectile and do not let it tunnel through',()=>{
  const world=new FlightWorld();world.phase='flying';world.ball={x:355,y:500,vx:1000,vy:0};world.step(.025);
  assert(world.ball.vx<0);assert(world.ball.x<THROW.walls[0].x-THROW.radius);
});

test('wall damage is emitted inside the collision step, once for the contact',()=>{
 const hits=[],world=new FlightWorld(kind=>hits.push(kind));world.phase='flying';world.ball={x:355,y:500,vx:1000,vy:0};
 world.step(.025);assert.deepEqual(hits,['wall']);world.step(.02);assert.deepEqual(hits,['wall'],'moving away is not another impact');
});
test('drone damage is immediate and its contact cooldown prevents duplicate penalties',()=>{
 const hits=[],world=new FlightWorld(kind=>hits.push(kind)),d=dronesAt(0)[0];world.phase='flying';world.ball={x:d.x-33,y:d.y,vx:300,vy:0};
 world.step(.01);assert.deepEqual(hits,['drone']);world.step(.01);assert.deepEqual(hits,['drone']);
});

test('paid routes have increasing one-time prices; explicit access cannot select a locked route',()=>{
 const {restoreAccess}=require('../delivery.js');assert.deepEqual(LEVELS.map(l=>l.price),[0,2500,35000,250000,228148867690450]);
 assert.deepEqual(restoreAccess({deliveryOwned:[0,2,2,'3',99],deliveryLevel:3}),{owned:[0,2],selected:0});
 assert.deepEqual(restoreAccess({deliveryOwned:[0,2],deliveryLevel:2}),{owned:[0,2],selected:2});
 assert.deepEqual(restoreAccess({deliveryLevel:3}),{owned:[0,1,3],selected:3});
});
test('a drone collision creates a short-lived explosion at impact, without changing the penalty count',()=>{
 const hits=[],world=new FlightWorld(kind=>hits.push(kind)),d=dronesAt(0)[0];world.phase='flying';world.ball={x:d.x-33,y:d.y,vx:300,vy:0};world.step(.01);
 assert.equal(world.explosions.length,1);assert.equal(hits.length,1);assert(Math.abs(world.explosions[0].x-d.x)<5);
 world.phase='ready';world.step(1);assert.equal(world.explosions.length,0);
});
