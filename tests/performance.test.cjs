const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=name=>fs.readFileSync(require.resolve('../'+name),'utf8');
function siegeHarness(stage=0){
 const frames=new Map(),listeners=new Map();let next=0,active=true,draws=0,clears=0,losses=0;
 const canvas={getContext:()=>({}),addEventListener(){},focus(){},setPointerCapture(){}};
 const window={requestAnimationFrame:fn=>{const id=next++;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),addEventListener(){},document:{addEventListener:(name,fn)=>listeners.set(name,fn)},BrukSiegeArt:{draw(){draws++;}},BrukSkyBoss:{...require('../sky-boss.js'),draw(){draws++;}}};
 vm.runInNewContext(source('neuron-siege.js'),{window});
 const api=window.BrukNeuronSiege.create({canvas,isActive:()=>active,getSiege:()=>({stage,unlocked:stage}),onMessage(){},onSuccess(){clears++;},onSiegeClear(){},onBossDefeat(){losses++;return 85;}});
 return {api,frames,setActive:value=>active=value,draws:()=>draws,clears:()=>clears,losses:()=>losses,key(code){listeners.get('keydown')({code,target:{closest:()=>false},preventDefault(){}});},step(time){const batch=[...frames];frames.clear();for(const [,fn] of batch)fn(time);}};
}
test('neuron renderer has no idle RAF, one enabled RAF, no hidden drawing and no duplicates after switching',()=>{
 const h=siegeHarness();assert.equal(h.frames.size,0);h.api.setActive(true);assert.equal(h.frames.size,1);h.step(16);assert.equal(h.draws(),1);
 h.setActive(false);const state=JSON.stringify(h.api.world);for(let i=2;i<62;i++)h.step(i*16);assert.equal(h.draws(),1);assert.equal(JSON.stringify(h.api.world),state);
 h.setActive(true);h.step(1000);assert.equal(h.draws(),2);assert.equal(h.frames.size,1);
 for(let i=0;i<20;i++){h.api.setActive(false);assert.equal(h.frames.size,0);h.api.setActive(true);assert.equal(h.frames.size,1);}
 h.api.setActive(false);assert.equal(h.frames.size,0);
});
test('boss combat pauses behind the phone and resumes without duplicate losses or rewards',()=>{
 const h=siegeHarness(9);h.api.setActive(true);h.key('Space');for(let i=0;i<30;i++)h.step(i*16);
 assert.equal(h.api.world.phase,'playing');h.setActive(false);const before=JSON.stringify(h.api.world),draws=h.draws();for(let i=30;i<90;i++)h.step(i*16);assert.equal(JSON.stringify(h.api.world),before);assert.equal(h.draws(),draws);
 h.setActive(true);h.step(1500);assert.notEqual(JSON.stringify(h.api.world),before);assert.equal(h.clears(),0);assert.equal(h.losses(),0);
});
test('legacy delivery rendering stops its RAF on inactive routes and delegates route five',()=>{
 const frames=new Map();let next=0,draws=0;const gradient={addColorStop(){}};
 const ctx=new Proxy({},{get(target,key){if(key in target)return target[key];return (...args)=>{draws++;return key.startsWith('create')?gradient:undefined;};}});
 const box={classList:{contains:()=>true},parentElement:{getBoundingClientRect:()=>({width:800,height:600})}},canvas={width:1000,height:1000,style:{},parentElement:box,getContext:()=>ctx,getBoundingClientRect:()=>({width:800,height:560}),addEventListener(){}};
 const window={requestAnimationFrame:fn=>{const id=next++;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),addEventListener(){},document:{body:{classList:{contains:()=>false}},addEventListener(){}},matchMedia:()=>({matches:false})};
 vm.runInNewContext(source('delivery.js'),{window});const api=window.BrukDelivery.create({canvas,isActive:()=>false,onMessage(){},onSuccess(){}});
 api.setLevel(2,false);const batch=[...frames];frames.clear();for(const [,fn]of batch)fn(0);assert.equal(frames.size,0);
 api.setLevel(3);assert.equal(frames.size,1);api.setLevel(3);assert.equal(frames.size,1);const before=draws;const idle=[...frames];frames.clear();for(const [,fn]of idle)fn(16);assert.equal(draws,before);
 api.setLevel(4);assert.equal(frames.size,0);api.setLevel(2);assert.equal(frames.size,1);api.setLevel(2,false);assert.equal(frames.size,0);
});
test('cached number formatters preserve legacy UAH output across the full balance range',()=>{
 const M=require('../money-core.js');const legacy=value=>{const n=Number(value);if(!Number.isFinite(n))return '0';if(Math.abs(n)<1e18)return Math.round(n).toLocaleString('uk-UA');const [c,e]=n.toExponential(3).split('e'),sup={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};return Number(c).toLocaleString('uk-UA',{maximumFractionDigits:3})+' × 10'+String(Number(e)).split('').map(c=>sup[c]).join('');};
 for(const value of [NaN,Infinity,-Infinity,-0,0,-500,0.5,1.5,9007199254740991,1e18-128,1e18,-1e18,1.23456e47,1e120,-1e120])assert.equal(M.format(value),legacy(value));
});
test('neurosphere keeps one background buffer and invalidates it on resize, layout and font changes',()=>{
 let buffers=0,fontDone,backgroundCalls=0,blits=0;
 const context=(background=false)=>new Proxy({},{get(target,key){if(key in target)return target[key];return ()=>{if(background)backgroundCalls++;if(!background&&key==='drawImage')blits++;return key.startsWith('create')?{addColorStop(){}}:undefined;};}});
 const window={document:{fonts:{status:'loaded',addEventListener(name,fn){assert.equal(name,'loadingdone');fontDone=fn;}},createElement(name){assert.equal(name,'canvas');buffers++;return {getContext:()=>context(true)};}}};
 vm.runInNewContext(source('siege-art.js'),{window});const canvas={width:1000,height:700},ctx=context(),world=new (require('../neuron-siege.js').World)();
 const draw=()=>window.BrukSiegeArt.draw(ctx,world,{canvas});draw();const first=backgroundCalls;assert(first>0);draw();assert.equal(backgroundCalls,first);assert.equal(buffers,1);assert.equal(blits,2);
 canvas.width=817;draw();assert(backgroundCalls>first);assert.equal(buffers,1);const resized=backgroundCalls;fontDone();draw();assert(backgroundCalls>resized);assert.equal(buffers,1);
 const other=new (require('../neuron-siege.js').World)({},1),prior=backgroundCalls;window.BrukSiegeArt.draw(ctx,other,{canvas});assert(backgroundCalls>prior);assert.equal(buffers,1);
});
