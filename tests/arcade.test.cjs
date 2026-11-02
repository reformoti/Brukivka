const test=require('node:test'),assert=require('node:assert/strict');
const {BreakoutWorld,MemoryWorld}=require('../arcade.js');
test('Breakout has 50 bricks, three lives, and a bounded paddle',()=>{
  const game=new BreakoutWorld();assert.equal(game.remaining,50);assert.equal(game.lives,3);
  game.movePaddle(-100);assert.equal(game.paddleX,80);game.movePaddle(2000);assert.equal(game.paddleX,820);
});
test('Breakout paddle bounces the ball upward and an actual miss costs one life',()=>{
  const game=new BreakoutWorld();game.phase='running';game.ball={x:450,y:545,vx:50,vy:300};game.step(.02);assert(game.ball.vy<0);assert.equal(game.lives,3);
  game.ball={x:30,y:608,vx:0,vy:300};game.step(.02);assert.equal(game.lives,2);assert.equal(game.phase,'ready');
});
test('Breakout scores durable-brick hits, finishes after the last brick, and ends at zero lives',()=>{
  const game=new BreakoutWorld();game.bricks=[{x:100,y:100,w:75,h:28,hp:2}];game.remaining=1;
  game.phase='running';game.ball={x:130,y:140,vx:0,vy:-300};game.step(.02);assert.equal(game.score,10);assert.equal(game.bricks[0].hp,1);
  game.ball={x:130,y:140,vx:0,vy:-300};game.step(.02);assert.equal(game.phase,'won');assert.equal(game.score,20);
  const loss=new BreakoutWorld();loss.lives=1;loss.phase='running';loss.ball={x:30,y:608,vx:0,vy:300};loss.step(.02);assert.equal(loss.phase,'over');assert.equal(loss.lives,0);
});
test('Memory contains exactly eight pairs and locks mismatches until they close',()=>{
  const game=new MemoryWorld(()=>.999999);for(let value=0;value<8;value++)assert.equal(game.cards.filter(c=>c.value===value).length,2);
  assert.equal(game.flip(0),'first');assert.equal(game.flip(0),'ignored');assert.equal(game.flip(1),'miss');assert.equal(game.moves,1);
  assert.equal(game.flip(2),'ignored');game.hideMismatch();assert(!game.cards[0].face);assert.equal(game.flip(0),'first');assert.equal(game.flip(8),'match');assert.equal(game.pairs,1);
});
test('Memory wins only after all eight distinct pairs, with one move per pair',()=>{
  const game=new MemoryWorld(()=>.999999);for(let i=0;i<8;i++){game.flip(i);game.flip(i+8);}assert(game.won);assert.equal(game.pairs,8);assert.equal(game.moves,8);assert.equal(game.flip(0),'ignored');
});
