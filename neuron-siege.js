(function(root){'use strict';
const FLOOR=640,ANCHOR={x:140,y:520},MATERIALS={wood:{hp:75,mass:3,color:'#b58249'},glass:{hp:35,mass:2,color:'#91dce5'},stone:{hp:180,mass:7,color:'#8e99a5'}};
const AMMO={standard:{name:'Звичайна',mass:9,size:34,speed:1,damage:1,price:0,color:'#b1b4b6'},heavy:{name:'Важка',mass:18,size:43,speed:.82,damage:1.5,price:2000000000000,color:'#78828d'},drill:{name:'Бронебійна',mass:7,size:28,speed:1.08,damage:2.3,price:8000000000000,color:'#8ce1e7'},blast:{name:'Вибухова',mass:8,size:35,speed:.92,damage:.9,price:24000000000000,color:'#ffae6d'}};
const MAX_RANK=12;
const LAYOUTS=[
 {id:'quarter',name:'Синаптичний квартал',accent:'#55e2d5',number:'01'},
 {id:'cascade',name:'Каскад пам’яті',accent:'#b8a0ff',number:'02'},
 {id:'citadel',name:'Цитадель розуму',accent:'#ffd28b',number:'03'}
];
const validLayout=id=>Number.isInteger(id)&&id>=0&&id<LAYOUTS.length?id:0;
function normalizeUpgrade(raw={}){if(!raw||typeof raw!=='object')raw={};const rank=n=>Number.isInteger(n)?Math.max(0,Math.min(MAX_RANK,n)):0;const owned=['standard',...Object.keys(AMMO).filter(id=>id!=='standard'&&Array.isArray(raw.owned)&&raw.owned.includes(id))];return {power:rank(raw.power),penetration:rank(raw.penetration),owned,ammo:owned.includes(raw.ammo)?raw.ammo:'standard'};}
function price(state,kind){const s=normalizeUpgrade(state);return ['power','penetration'].includes(kind)&&s[kind]<MAX_RANK?Math.round((kind==='power'?500000000000:750000000000)*1.85**s[kind]):null;}
function purchase(raw,balance,kind,id){const state=normalizeUpgrade(raw);let cost=0;
 if(kind==='rank'){cost=price(state,id);if(cost===null)return {ok:false,message:'Досягнуто максимум.'};}
 else if(kind==='ammo'){if(!Object.hasOwn(AMMO,id))return {ok:false,message:'Невідомий тип.'};cost=state.owned.includes(id)?0:AMMO[id].price;}
 else return {ok:false,message:'Невідома дія.'};
 if(!Number.isSafeInteger(balance)||!Number.isSafeInteger(cost)||(cost>0&&balance<cost))return {ok:false,message:'Недостатньо UAH.'};
 if(kind==='rank')state[id]++;else {if(!state.owned.includes(id))state.owned.push(id);state.ammo=id;}
 return {ok:true,state,balance:balance-cost,cost};
}
class World{
 constructor(upgrades={},layout=0){this.reset(upgrades,layout);}
 reset(upgrades=this.upgrades,layout=this.layoutIndex){this.upgrades=normalizeUpgrade(upgrades);this.ammo=AMMO[this.upgrades.ammo];this.force=1+this.upgrades.power*.11;this.pierce=1+this.upgrades.penetration*.25;this.serial=0;this.explosions=[];this.bodies=[];this.fragments=[];this.shots=5;this.phase='ready';this.age=0;this.quiet=0;this.time=0;this.ball=null;this.won=false;
  this.layoutIndex=validLayout(layout);this.layout=LAYOUTS[this.layoutIndex];this.links=[];this.sparks=[];this.pulses=[];this.pending=[];this.overload=false;this.overloadAt=0;this.trail=[];
  const cell=(x,y,core=false)=>{const n=this.add('neuron',x,y,22,24,'wood');if(core){n.core=true;n.hp=110;}return n;};
  const tower=(x,levels,material,width=112,base=FLOOR)=>{
   for(let level=0;level<levels;level++){
    const bottom=base-level*100,span=width/2-13;
    this.add('block',x-span,bottom-44,16,88,material);
    this.add('block',x+span,bottom-44,16,88,material);
    this.add('block',x,bottom-94,width,12,material);
    cell(x-23,bottom-12);cell(x+23,bottom-12);
   }
   return base-levels*100;
  };
  if(this.layoutIndex===0){
   for(const [index,x] of [570,735,900].entries()){
    const material=['wood','glass','stone'][index];this.add('block',x-43,590,16,100,material);this.add('block',x+43,590,16,100,material);this.add('block',x,532,116,16,material);
    for(const dx of [-22,0,22])cell(x+dx,628);
    if(index!==1)for(const dx of [-20,20])cell(x+dx,512);
    if(index===1){this.add('block',x-30,495,14,58,'wood');this.add('block',x+30,495,14,58,'wood');this.add('block',x,458,86,16,'wood');cell(x,510,true);for(const dx of [-19,19])cell(x+dx,438);}
   }
  }else if(this.layoutIndex===1){
   const a=tower(490,1,'wood'),b=tower(680,2,'glass'),c=tower(880,3,'stone');
   cell(467,a-12);cell(513,a-12);cell(657,b-12);cell(703,b-12);cell(857,c-12);cell(903,c-12,true);
  }else{
   tower(540,3,'stone',122);tower(866,3,'stone',122);const top=tower(703,2,'glass',136);
   cell(517,328);cell(563,328);cell(843,328);cell(889,328);cell(680,top-12);cell(726,top-12,true);
  }
  this.core=this.bodies.find(b=>b.core);this.coreMax=this.core.hp;
  const neurons=this.bodies.filter(b=>b.kind==='neuron');
  // A minimal spanning tree stays readable and connects every cell, even across towers.
  const visited=new Set([this.core.id]);while(visited.size<neurons.length){let best=null;
   for(const a of neurons){if(!visited.has(a.id))continue;for(const b of neurons){if(visited.has(b.id))continue;const d=Math.hypot(a.x-b.x,a.y-b.y);if(!best||d<best.d)best={from:a.id,to:b.id,d};}}
   this.links.push({from:best.from,to:best.to});visited.add(best.to);
  }
  for(const side of [-1,1]){const target=neurons.filter(n=>(n.x-this.core.x)*side>80).sort((a,b)=>a.y-b.y)[0];if(target&&!this.links.some(e=>(e.from===this.core.id&&e.to===target.id)||(e.to===this.core.id&&e.from===target.id)))this.links.push({from:this.core.id,to:target.id,hub:true});}
  this.total=this.remaining;
 }
 add(kind,x,y,w,h,material){const m=MATERIALS[material],b={id:this.serial++,kind,x,y,w,h,vx:0,vy:0,mass:kind==='neuron'?1.2:m.mass,hp:kind==='neuron'?55:m.hp,material,dead:false};this.bodies.push(b);return b;}
 launch(pull){if(this.phase!=='ready'||this.shots<=0||this.won)return false;const d=Math.hypot(pull.x,pull.y);if(d<12)return false;const scale=Math.min(1,105/d);this.ball=this.add('brick',ANCHOR.x+pull.x*scale,ANCHOR.y+pull.y*scale,this.ammo.size,this.ammo.size,'stone');this.ball.mass=this.ammo.mass;this.ball.ammo=this.upgrades.ammo;this.trail=[];this.ball.hp=1e9;this.ball.vx=-pull.x*scale*9.2*this.force*this.ammo.speed;this.ball.vy=-pull.y*scale*9.2*this.force*this.ammo.speed;this.shots--;this.phase='flying';this.age=0;this.quiet=0;return true;}
 explode(ball){if(ball.detonated||ball.ammo!=='blast')return;ball.detonated=true;ball.dead=true;this.explosions.push({x:ball.x,y:ball.y,age:0});for(const b of this.bodies){if(b.dead||b===ball)continue;const dx=b.x-ball.x,dy=b.y-ball.y,d=Math.hypot(dx,dy);if(d<125){const strength=1-d/125;this.hurt(b,230*strength*this.pierce);b.vx+=dx/(d||1)*strength*450;b.vy+=dy/(d||1)*strength*450-70;}}}
 triggerOverload(){if(this.overload)return;this.overload=true;this.overloadAt=this.time;
  const distance=new Map([[this.core.id,0]]),queue=[this.core.id];
  for(let i=0;i<queue.length;i++){const id=queue[i];for(const edge of this.links){const next=edge.from===id?edge.to:edge.to===id?edge.from:null;if(next!==null&&!distance.has(next)){distance.set(next,distance.get(id)+1);queue.push(next);}}}
  for(const n of this.bodies){if(n.kind==='neuron'&&!n.dead)this.pending.push({id:n.id,at:this.time+.12+(distance.get(n.id)||1)*.1});}
  this.pulses.push({x:this.core.x,y:this.core.y,age:0,mega:true});
 }
 hurt(b,amount){if(b.dead||b.kind==='brick'||amount<1)return;b.hp-=amount;if(b.hp<=0){b.dead=true;if(b.core&&this.shots<5)this.triggerOverload();if(b.kind==='neuron')this.pulses.push({x:b.x,y:b.y,age:0,mega:false});for(let i=0;i<5;i++)this.fragments.push({x:b.x,y:b.y,vx:(i-2)*50+b.vx*.3,vy:-65-i*17,life:1.2,material:b.material});}}
 collide(a,b){if(a.dead||b.dead)return;const dx=b.x-a.x,dy=b.y-a.y,ox=(a.w+b.w)/2-Math.abs(dx),oy=(a.h+b.h)/2-Math.abs(dy);if(ox<=0||oy<=0)return;const horizontal=ox<oy,nx=horizontal?(dx>=0?1:-1):0,ny=horizontal?0:(dy>=0?1:-1),penetration=horizontal?ox:oy,ia=1/a.mass,ib=1/b.mass,sum=ia+ib;
  a.x-=nx*penetration*ia/sum;a.y-=ny*penetration*ia/sum;b.x+=nx*penetration*ib/sum;b.y+=ny*penetration*ib/sum;
  const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(relative>=0)return;const impulse=-1.12*relative/sum;a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib;
  if(-relative>90){this.hurt(a,(-relative-70)*Math.min(b.mass,18)*.16*(b.kind==='brick'?this.pierce*this.ammo.damage:1));this.hurt(b,(-relative-70)*Math.min(a.mass,18)*.16*(a.kind==='brick'?this.pierce*this.ammo.damage:1));if(a.kind==='brick')this.explode(a);if(b.kind==='brick')this.explode(b);}
 }
 step(dt){if(!Number.isFinite(dt)||dt<=0||this.won||this.phase==='lost')return;dt=Math.min(dt,.05);const count=Math.ceil(dt/.005),h=dt/count;
  for(let step=0;step<count;step++){
   this.time+=h;
   for(const signal of this.pending.filter(p=>p.at<=this.time)){
    const n=this.bodies.find(b=>b.id===signal.id&&!b.dead);if(!n)continue;
    this.sparks.push({x:n.x,y:n.y,age:0});this.hurt(n,200);
    for(const b of this.bodies){if(b.kind==='block'&&!b.dead&&Math.hypot(b.x-n.x,b.y-n.y)<85)this.hurt(b,38);}
   }this.pending=this.pending.filter(p=>p.at>this.time);
   for(const b of this.bodies){if(b.dead)continue;const cap=b.kind==='brick'?3200:1400;b.vy=Math.min(cap,b.vy+510*h);b.vx=Math.max(-cap,Math.min(cap,b.vx));b.x+=b.vx*h;b.y+=b.vy*h;
    if(b.y+b.h/2>FLOOR){const impact=b.vy;b.y=FLOOR-b.h/2;b.vy=-b.vy*.12;b.vx*=Math.pow(.1,h);if(impact>230){this.hurt(b,(impact-180)*.6);if(b.kind==='brick')this.explode(b);}}
    if(b.x<-150||b.x>1150||b.y>850){b.dead=true;if(b.core&&this.shots<5)this.triggerOverload();}
   }
   for(let pass=0;pass<3;pass++)for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++)this.collide(this.bodies[i],this.bodies[j]);
   for(const f of this.fragments){f.life-=h;f.x+=f.vx*h;f.vy+=510*h;f.y+=f.vy*h;}
   for(const e of this.pulses)e.age+=h;this.pulses=this.pulses.filter(e=>e.age<(e.mega?1.7:.45));
   for(const e of this.sparks)e.age+=h;this.sparks=this.sparks.filter(e=>e.age<.5);
   for(const e of this.explosions)e.age+=h;this.explosions=this.explosions.filter(e=>e.age<.5);
   this.fragments=this.fragments.filter(f=>f.life>0);this.bodies=this.bodies.filter(b=>!b.dead);
  }
  if(this.ball&&!this.ball.dead){this.trail.push({x:this.ball.x,y:this.ball.y});if(this.trail.length>28)this.trail.shift();}
  if(!this.bodies.some(b=>b.kind==='neuron')){this.won=true;this.phase='won';return;}
  if(this.phase==='flying'){this.age+=dt;const moving=this.bodies.some(b=>Math.hypot(b.vx,b.vy)>30);this.quiet=moving?0:this.quiet+dt;
   if(!this.pending.length&&(this.age>9||(this.age>1.2&&this.quiet>.6))){if(this.ball)this.ball.dead=true;this.ball=null;this.phase=this.shots?'ready':'lost';}
  }
 }
 get remaining(){return this.bodies.filter(b=>b.kind==='neuron'&&!b.dead).length;}
}
function create({canvas,onSuccess,onMessage,isActive,getSiege=()=>({})}){const ctx=canvas.getContext('2d'),world=new World(getSiege());let enabled=false,pointer=null,pull={x:-75,y:28},aim=false,last=null,awarded=false;
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1000,y:(e.clientY-r.top)/r.height*700};};
 function reset(){world.reset(getSiege());pointer=null;aim=false;awarded=false;pull={x:-75,y:28};}
 function setPull(p){const x=p.x-ANCHOR.x,y=p.y-ANCHOR.y,scale=Math.min(1,105/(Math.hypot(x,y)||1));pull={x:x*scale,y:y*scale};}
 function shoot(){if(world.launch(pull)){aim=false;onMessage('Влуч у сяюче ядро: його руйнування запустить мегаперевантаження мережі. Пострілів: '+world.shots);}}
 canvas.addEventListener('pointerdown',e=>{if(!enabled||!isActive()||world.phase!=='ready')return;const p=point(e);if(Math.hypot(p.x-ANCHOR.x,p.y-ANCHOR.y)>115)return;pointer=e.pointerId;aim=true;setPull(p);canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(pointer===e.pointerId&&enabled&&isActive()){setPull(point(e));e.preventDefault();}});
 canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;if(enabled&&isActive()&&aim)shoot();else aim=false;});canvas.addEventListener('pointercancel',()=>{pointer=null;aim=false;});
 root.document.addEventListener('keydown',e=>{if(!enabled||!isActive()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,button,a'))return;if(e.code==='KeyR'){e.preventDefault();reset();return;}if(world.phase!=='ready')return;const keys={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]};if(keys[e.code]){e.preventDefault();const [x,y]=keys[e.code];setPull({x:ANCHOR.x+pull.x+x,y:ANCHOR.y+pull.y+y});aim=true;}if(e.code==='Space'&&!e.repeat){e.preventDefault();shoot();}});
 root.addEventListener('blur',()=>{pointer=null;aim=false;});
 function draw(){root.BrukSiegeArt.draw(ctx,world,{canvas,pull,aim});}
 function setLayout(id){world.reset(getSiege(),validLayout(id));pointer=null;aim=false;awarded=false;pull={x:-75,y:28};onMessage('Схема: '+world.layout.name+'. Спробу розпочато заново.');}

 function frame(time){const dt=last===null?0:Math.min(.04,(time-last)/1000);last=time;if(enabled){if(isActive()){world.step(dt);if(world.won&&!awarded){awarded=true;onSuccess();}}else{pointer=null;aim=false;}draw();}root.requestAnimationFrame(frame);}root.requestAnimationFrame(frame);
 return {setActive:on=>{enabled=on;last=null;if(on)reset();},reset,setLayout,cancel:()=>{pointer=null;aim=false;},world};
}
const api={World,MATERIALS,AMMO,MAX_RANK,LAYOUTS,normalizeUpgrade,price,purchase,ANCHOR,FLOOR,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.BrukNeuronSiege=api;
})(typeof window==='undefined'?globalThis:window);
