const {test}=require('node:test'),assert=require('node:assert/strict'),S=require('../neuron-siege');
test('legacy siege purchases survive migration and corrupt campaign progress cannot unlock the boss',()=>{
 const raw={power:4,penetration:3,owned:['heavy','blast'],ammo:'heavy'},s=S.normalizeUpgrade(raw);assert.equal(s.power,4);assert(s.owned.includes('blast'));assert.equal(s.ammo,'heavy');assert.equal(s.stock,0);assert.equal(s.stage,0);assert.equal(s.unlocked,0);
 const corrupt=S.normalizeUpgrade({...raw,stock:100,stage:9,unlocked:'9',victories:Infinity});assert.equal(corrupt.stock,12);assert.equal(corrupt.stage,0);assert.equal(corrupt.unlocked,0);assert.equal(corrupt.victories,0);
});
test('campaign progression unlocks one stage at a time, persists, and a boss victory increments the record',()=>{
 let s=S.normalizeUpgrade({owned:['drill'],ammo:'drill',stock:7});assert.equal(S.selectStage(s,9).stage,0);assert.equal(S.advance(s,9).unlocked,0);
 for(let stage=0;stage<9;stage++){s=S.advance(s,stage);s=S.normalizeUpgrade(JSON.parse(JSON.stringify(s)));assert.equal(s.stage,stage+1);assert.equal(s.unlocked,stage+1);assert.equal(s.stock,7);assert.equal(s.ammo,'drill');}
 s=S.advance(s,9);assert.equal(s.victories,1);assert.equal(s.stage,0);assert.equal(s.unlocked,9);assert.equal(S.selectStage(s,9).stage,9);assert.equal(S.selectStage(s,200).stage,0);
});
test('stock ranks cost the displayed price and increase the next attempt up to seventeen bricks',()=>{
 const a=S.normalizeUpgrade(),cost=S.price(a,'stock');assert(!S.purchase(a,cost-1,'rank','stock').ok);const result=S.purchase(a,cost,'rank','stock');assert(result.ok);assert.equal(result.balance,0);assert.equal(result.state.stock,1);assert(S.price(result.state,'stock')>cost);
 const w=new S.World(a);a.stock=12;assert.equal(w.maxShots,5);w.reset(a);assert.equal(w.maxShots,17);assert.equal(w.shots,17);assert.equal(S.price(a,'stock'),null);assert(!S.purchase(a,Number.MAX_SAFE_INTEGER,'rank','stock').ok);
});
test('a barrier blocks a weak brick, stays fixed and takes more damage from penetration upgrades',()=>{
 function hit(penetration){const w=new S.World({penetration},8),b=w.bodies.find(b=>b.fixed),ball=w.add('brick',b.x-15,500,34,34,'stone');ball.vx=400;ball.mass=9;const before=b.hp;w.collide(ball,b);return {w,b,ball,damage:before-b.hp};}
 const a=hit(0),b=hit(5);assert(a.ball.vx<0);assert(!a.b.dead);assert(b.damage>a.damage);const oldY=a.b.y;for(let i=0;i<60;i++)a.w.step(1/60);assert.equal(a.b.y,oldY);
});
test('touching or crossing the ceiling calls exactly one UAV strike and consumes only the launched brick',()=>{
 for(const velocity of [10,-10000]){const w=new S.World();w.launch({x:-60,y:20});const ball=w.ball;ball.x=250;ball.y=w.ceiling+ball.h/2;ball.vy=velocity;const targets=w.remaining;w.step(.01);assert(ball.dead);assert(ball.intercepted);assert.equal(w.droneStrikes.length,1);assert.equal(w.shots,4);for(let i=0;i<60;i++)w.step(1/60);assert.equal(w.phase,'ready');assert.equal(w.remaining,targets);assert.equal(w.shots,4);}
});
test('a UAV intercept of the last stock brick loses without destroying the target network',()=>{
 const w=new S.World();w.shots=1;w.launch({x:-60,y:20});w.ball.y=w.ceiling;w.ball.vy=-100;for(let i=0;i<65;i++)w.step(1/60);assert.equal(w.phase,'lost');assert.equal(w.shots,0);assert.equal(w.remaining,w.total);assert(!w.won);
});
