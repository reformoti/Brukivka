const {test}=require('node:test'),assert=require('node:assert/strict'),{FrameClock}=require('../realms-viewport.js');
test('render clock keeps 60 FPS on slightly jittering 60Hz displays without changing simulation',()=>{const c=new FrameClock();let draws=0;for(let i=1;i<=600;i++)if(c.due(i*1000/60+(i%2?.001:-.001),60))draws++;assert.equal(draws,600);});
test('render clock respects 30/45/60 caps on 60/120/144Hz displays without drift',()=>{for(const hz of [60,120,144])for(const fps of [30,45,60]){const c=new FrameClock();let frames=0;for(let i=1;i<=hz*10;i++)if(c.due(i*1000/hz,fps))frames++;assert.equal(frames,fps*10,`${hz}Hz / ${fps}FPS`);}});
test('render clock renders only once after a long pause and preserves paused display cadence',()=>{const c=new FrameClock();assert(c.due(10000,4));assert(!c.due(10001,4));assert(c.due(10250,4));assert(!c.due(10251,4));});

const {FrameStats}=require('../realms-viewport.js');
test('diagnostics count drawn frames and distinguish frame pacing from drawing cost',()=>{const s=new FrameStats();for(let i=0;i<=120;i++)s.frame(i*1000/60,3);const r=s.report();assert.equal(r.frames,121);assert(Math.abs(r.fps-60)<.001);assert(Math.abs(r.frameP95Ms-1000/60)<.001);assert.equal(r.drawP95Ms,3);assert.equal(r.stallsOver50Ms,0);});
test('diagnostics keep stalls, bound memory and exclude reset background periods',()=>{const s=new FrameStats(4);for(const t of [0,20,40,140,160])s.frame(t,4);let r=s.report();assert.equal(r.frames,4);assert.equal(r.stallsOver50Ms,1);assert.equal(r.durationMs,140);s.reset();s.frame(10000,2);s.frame(10020,2);r=s.report();assert.equal(r.fps,50);assert.equal(r.stallsOver50Ms,0);});

test('frame cap tolerates browser timestamp quantization without dropping every third frame',()=>{for(const quantization of [.1,1,2]){const c=new FrameClock();let draws=0;for(let i=1;i<=3600;i++)if(c.due(Math.floor(i*1000/60/quantization)*quantization,60))draws++;assert.equal(draws,3600,`${quantization}ms clock`);}});

const {Motion}=require('../realms-viewport.js');
test('online render motion interpolates without changing server positions and snaps teleports',()=>{const m=new Motion();m.push(0,0,0);assert.deepEqual(m.sample(0),{x:0,y:0});m.push(10,0,50);assert.equal(m.sample(75).x,5);assert.equal(m.sample(100).x,10);m.push(20,0,100);assert.equal(m.sample(125).x,15);m.push(1000,500,150);assert.deepEqual(m.sample(150),{x:1000,y:500});assert.deepEqual(m.sample(10000),{x:1000,y:500});});
