const test=require('node:test'),assert=require('node:assert/strict'),R=require('../realms-core'),D=require('../realms-destiny');
test('destiny graph connects every progression node once and stays within the board',()=>{
  const s=R.normalize(),before=JSON.stringify(s),g=D.model(s),ids=new Set(g.nodes.map(n=>n.id));
  assert.equal(g.nodes.length,1305);assert.equal(ids.size,g.nodes.length);assert.equal(g.edges.length,g.nodes.length-1);
  for(const n of g.nodes){assert(n.x>0&&n.x<g.size);assert(n.y>0&&n.y<g.size);}
  const incoming=new Map();for(const e of g.edges){assert(ids.has(e.from));assert(ids.has(e.to));assert(!incoming.has(e.to));incoming.set(e.to,e.from);}
  for(const n of g.nodes){let id=n.id;const seen=new Set();while(id!=='hero'){assert(!seen.has(id));seen.add(id);id=incoming.get(id);assert(id);}}
  assert.equal(JSON.stringify(s),before);assert.deepEqual(D.model(s),g);
});
test('mastery nodes display earned levels and the next real experience goal',()=>{
  const s=R.normalize({schema:2,mastery:{sword:{level:3,xp:27}}}),g=D.model(s),n=id=>g.nodes.find(n=>n.id===id);
  assert.equal(n('mastery-sword-3').status,'learned');assert.equal(n('mastery-sword-4').status,'available');assert.equal(n('mastery-sword-5').status,'locked');assert.equal(n('mastery-sword-4').xp,27);assert.equal(n('mastery-sword-4').goal,R.masteryGoal(3));
});
test('talent nodes follow actual prerequisites, rank costs and training results',()=>{
  const w=new R.World({level:6,silver:1000});let g=D.model(w.state);const n=id=>g.nodes.find(n=>n.id===id);
  assert(n('talent-vitality-1').canTrain);assert.equal(n('talent-vitality-2').canTrain,false);assert.equal(n('talent-guard-1').status,'locked');
  assert(g.edges.some(e=>e.from==='talent-vitality-1'&&e.to==='talent-guard-1'));
  assert(w.train('vitality').ok);g=D.model(w.state);assert.equal(n('talent-vitality-1').status,'learned');assert(n('talent-guard-1').canTrain);assert(n('talent-vitality-2').canTrain);
  assert(w.train('guard').ok);assert(w.train('vitality').ok);assert(w.train('guard').ok);g=D.model(w.state);
  assert.equal(R.talentPoints(w.state),1);assert.equal(n('talent-vitality-3').cost,2);assert.equal(n('talent-vitality-3').canTrain,false);
  assert(w.respec().ok);g=D.model(w.state);assert.equal(n('talent-guard-1').status,'locked');assert(n('talent-vitality-1').canTrain);
});
