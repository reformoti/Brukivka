(function(root){'use strict';
const FLOOR=640,ANCHOR={x:140,y:520},MAX_RANK=12;
const MATERIALS={wood:{hp:75,mass:3,color:'#b58249'},glass:{hp:35,mass:2,color:'#91dce5'},stone:{hp:180,mass:7,color:'#8e99a5'}};
const AMMO={standard:{name:'Звичайна',mass:9,size:34,speed:1,damage:1,price:0,color:'#b1b4b6'},heavy:{name:'Важка',mass:18,size:43,speed:.82,damage:1.5,price:2000000000000,color:'#78828d'},drill:{name:'Бронебійна',mass:7,size:28,speed:1.08,damage:2.3,price:8000000000000,color:'#8ce1e7'},blast:{name:'Вибухова',mass:8,size:35,speed:.92,damage:.9,price:24000000000000,color:'#ffae6d'}};
const formations=[[1,2,2],[1,2,2,2],[2,2,2,2],[2,2,2,3],[2,2,2,2,2],[2,2,2,2,3],[2,2,2,3,3],[2,2,3,3,3],[3,3,3,3,3]];
const names=['Синаптичний квартал','Каскад пам’яті','Цитадель розуму','Подвійний контур','Вежі свідомості','Кортекс','Синаптична буря','Нейронний бастіон','Остання лінія'];
const STAGES=formations.map((heights,i)=>({id:'fortress-'+i,name:names[i],number:String(i+1).padStart(2,'0'),accent:['#55e2d5','#b8a0ff','#ffd28b'][i%3],heights,neurons:18+i*4,cores:2+Math.floor(i/3),barriers:1+Math.floor(i/3),barrierHp:55+i*20,ceiling:230+i*9}));
STAGES.push({id:'sky-brain',name:'Мозок над хмарами',number:'10',accent:'#ffc797',boss:true});
const LAYOUTS=STAGES,validLayout=id=>Number.isInteger(id)&&id>=0&&id<STAGES.length?id:0;
function normalizeUpgrade(raw={}){
 if(!raw||typeof raw!=='object')raw={};const rank=n=>Number.isInteger(n)?Math.max(0,Math.min(MAX_RANK,n)):0;
 const owned=['standard',...Object.keys(AMMO).filter(id=>id!=='standard'&&Array.isArray(raw.owned)&&raw.owned.includes(id))];
 const unlocked=validLayout(raw.unlocked),stage=Math.min(validLayout(raw.stage),unlocked);
 return {power:rank(raw.power),penetration:rank(raw.penetration),stock:rank(raw.stock),owned,ammo:owned.includes(raw.ammo)?raw.ammo:'standard',stage,unlocked,victories:Number.isSafeInteger(raw.victories)?Math.max(0,Math.min(1000000000,raw.victories)):0};
}
function price(state,kind){const s=normalizeUpgrade(state),base={power:500000000000,penetration:750000000000,stock:400000000000};return Object.hasOwn(base,kind)&&s[kind]<MAX_RANK?Math.round(base[kind]*1.85**s[kind]):null;}
function purchase(raw,balance,kind,id){const state=normalizeUpgrade(raw);let cost=0;
 if(kind==='rank'){cost=price(state,id);if(cost===null)return {ok:false,message:'Досягнуто максимум.'};}
 else if(kind==='ammo'){if(!Object.hasOwn(AMMO,id))return {ok:false,message:'Невідомий тип.'};cost=state.owned.includes(id)?0:AMMO[id].price;}
 else return {ok:false,message:'Невідома дія.'};
 if(!Number.isSafeInteger(balance)||!Number.isSafeInteger(cost)||(cost>0&&balance<cost))return {ok:false,message:'Недостатньо UAH.'};
 if(kind==='rank')state[id]++;else {if(!state.owned.includes(id))state.owned.push(id);state.ammo=id;}
 return {ok:true,state,balance:balance-cost,cost};
}
function advance(raw,stage){const s=normalizeUpgrade(raw);if(!Number.isInteger(stage)||stage<0||stage>s.unlocked||stage>=STAGES.length)return s;s.unlocked=Math.max(s.unlocked,Math.min(9,stage+1));s.stage=stage===9?0:stage+1;if(stage===9)s.victories=Math.min(1000000000,s.victories+1);return s;}
function selectStage(raw,id){const s=normalizeUpgrade(raw);if(Number.isInteger(id)&&id>=0&&id<=s.unlocked)s.stage=id;return s;}
class World{
 constructor(upgrades={},layout=0){this.reset(upgrades,layout);}
 reset(upgrades=this.upgrades,layout=this.layoutIndex){
  this.upgrades=normalizeUpgrade(upgrades);this.ammo=AMMO[this.upgrades.ammo];this.force=1+this.upgrades.power*.11;this.pierce=1+this.upgrades.penetration*.25;
  this.layoutIndex=Math.min(8,validLayout(layout));this.layout=STAGES[this.layoutIndex];this.ceiling=this.layout.ceiling;this.serial=0;this.explosions=[];this.bodies=[];this.fragments=[];this.shots=5+this.upgrades.stock;this.maxShots=this.shots;this.launched=false;this.phase='ready';this.age=0;this.quiet=0;this.time=0;this.ball=null;this.won=false;this.links=[];this.sparks=[];this.pulses=[];this.pending=[];this.overload=false;this.trail=[];this.droneStrikes=[];this.intercepts=0;
  const count=this.layout.heights.length,width=count===5?86:count===4?98:112,cells=[],extras=[];
  for(let column=0;column<count;column++){
   const x=470+column*(430/(count-1)),height=this.layout.heights[column],material=['wood','glass','stone'][(column+this.layoutIndex)%3];
   for(let floor=0;floor<height;floor++){
    const bottom=FLOOR-floor*88,span=width/2-6;
    this.add('block',x-span,bottom-38,12,76,material);this.add('block',x+span,bottom-38,12,76,material);this.add('block',x,bottom-82,width,12,material);
    cells.push({x:x-22,y:bottom-11},{x:x+22,y:bottom-11});extras.push({x,y:bottom-11});
   }
   const top=FLOOR-height*88;cells.push({x:x-22,y:top-11},{x:x+22,y:top-11});extras.push({x,y:top-11});
  }
  for(const p of [...cells,...extras].slice(0,this.layout.neurons))this.add('neuron',p.x,p.y,18,22,'wood');
  const neurons=this.bodies.filter(b=>b.kind==='neuron');this.cores=[];
  for(let i=0;i<this.layout.cores;i++){
   const x=470+i*430/(this.layout.cores-1),n=neurons.filter(n=>!n.core).sort((a,b)=>(Math.abs(a.x-x)*2+a.y)-(Math.abs(b.x-x)*2+b.y))[0];
   n.core=true;n.hp=110+this.layoutIndex*16;n.maxHp=n.hp;n.cluster=i;this.cores.push(n);
  }
  for(const n of neurons){if(!n.core)n.cluster=this.cores.reduce((best,c,i)=>Math.abs(n.x-c.x)<Math.abs(n.x-this.cores[best].x)?i:best,0);}
  this.core=this.cores[0];this.coreMax=this.cores.reduce((sum,c)=>sum+c.hp,0);
  // Each core has its own connected subnetwork. Hub links join the clusters visually.
  for(const core of this.cores){const group=neurons.filter(n=>n.cluster===core.cluster),visited=new Set([core.id]);
   while(visited.size<group.length){let best=null;for(const a of group){if(!visited.has(a.id))continue;for(const b of group){if(visited.has(b.id))continue;const d=Math.hypot(a.x-b.x,a.y-b.y);if(!best||d<best.d)best={from:a.id,to:b.id,d};}}this.links.push({from:best.from,to:best.to});visited.add(best.to);}
  }
  for(let i=1;i<this.cores.length;i++)this.links.push({from:this.cores[i-1].id,to:this.cores[i].id,hub:true});
  const positions=this.layout.barriers===1?[385]:this.layout.barriers===2?[385,742]:[385,630,842];
  for(const x of positions){const b=this.add('barrier',x,(this.ceiling+FLOOR)/2,12,FLOOR-this.ceiling,'glass');b.fixed=true;b.hp=this.layout.barrierHp;b.maxHp=b.hp;}
  this.total=this.remaining;
 }
 add(kind,x,y,w,h,material){const m=MATERIALS[material],scale=1+this.layoutIndex*.065,b={id:this.serial++,kind,x,y,w,h,vx:0,vy:0,mass:kind==='neuron'?1.2:m.mass,hp:(kind==='neuron'?55:m.hp)*scale,material,dead:false};b.maxHp=b.hp;this.bodies.push(b);return b;}
 launch(pull){
  if(this.phase!=='ready'||this.shots<=0||this.won)return false;const d=Math.hypot(pull.x,pull.y);if(!Number.isFinite(d)||d<12)return false;const scale=Math.min(1,105/d);
  this.ball=this.add('brick',ANCHOR.x+pull.x*scale,ANCHOR.y+pull.y*scale,this.ammo.size,this.ammo.size,'stone');this.ball.mass=this.ammo.mass;this.ball.ammo=this.upgrades.ammo;this.trail=[];this.ball.hp=1e9;this.ball.vx=-pull.x*scale*9.2*this.force*this.ammo.speed;this.ball.vy=-pull.y*scale*9.2*this.force*this.ammo.speed;
  this.shots--;this.launched=true;this.phase='flying';this.age=0;this.quiet=0;return true;
 }
 intercept(ball){
  if(ball.dead||ball.intercepted)return;ball.intercepted=true;ball.dead=true;this.intercepts++;
  this.droneStrikes.push({x:ball.x,y:Math.max(this.ceiling,ball.y),size:ball.w,ammo:ball.ammo,age:0,burst:false});this.phase='intercepted';this.age=0;
 }
 explode(ball){if(ball.detonated||ball.ammo!=='blast')return;ball.detonated=true;ball.dead=true;this.explosions.push({x:ball.x,y:ball.y,age:0});for(const b of this.bodies){if(b.dead||b===ball)continue;const dx=b.x-ball.x,dy=b.y-ball.y,d=Math.hypot(dx,dy);if(d<125){const strength=1-d/125;this.hurt(b,230*strength*this.pierce);if(!b.fixed){b.vx+=dx/(d||1)*strength*450;b.vy+=dy/(d||1)*strength*450-70;}}}}
 triggerOverload(core=this.core){
  if(core.overloaded)return;core.overloaded=true;this.overload=true;
  const mega=this.cores.every(c=>c.dead),distance=new Map([[core.id,0]]),queue=[core.id];
  for(let i=0;i<queue.length;i++){const id=queue[i];for(const edge of this.links){const next=edge.from===id?edge.to:edge.to===id?edge.from:null;if(next!==null&&!distance.has(next)){distance.set(next,distance.get(id)+1);queue.push(next);}}}
  for(const n of this.bodies){if(n.kind==='neuron'&&!n.dead&&!n.core&&(mega||n.cluster===core.cluster)&&!this.pending.some(p=>p.id===n.id))this.pending.push({id:n.id,at:this.time+.18+(distance.get(n.id)||1)*.1});}
  this.pulses.push({x:core.x,y:core.y,age:0,mega});
 }
 hurt(b,amount){if(b.dead||b.kind==='brick'||!Number.isFinite(amount)||amount<1)return;b.hp-=amount;if(b.hp<=0){b.dead=true;if(b.core&&this.launched)this.triggerOverload(b);if(b.kind==='neuron')this.pulses.push({x:b.x,y:b.y,age:0,mega:false});for(let i=0;i<5;i++)this.fragments.push({x:b.x,y:b.y,vx:(i-2)*50+b.vx*.3,vy:-65-i*17,life:1.2,material:b.material});}}
 collide(a,b){
  if(a.dead||b.dead)return;const dx=b.x-a.x,dy=b.y-a.y,ox=(a.w+b.w)/2-Math.abs(dx),oy=(a.h+b.h)/2-Math.abs(dy);if(ox<=0||oy<=0)return;
  if(a.fixed||b.fixed){const barrier=a.fixed?a:b,ball=a.fixed?b:a;if(ball.kind!=='brick')return;
   const speed=Math.hypot(ball.vx,ball.vy);this.hurt(barrier,55*this.pierce*this.ammo.damage*Math.min(1.6,speed/450));
   if(!barrier.dead){ball.x=barrier.x-Math.sign(ball.vx||1)*(barrier.w+ball.w)/2;ball.vx=-ball.vx*.32;ball.vy*=.7;}else ball.vx*=.7;
   this.sparks.push({x:barrier.x,y:ball.y,age:0});this.explode(ball);return;
  }
  const horizontal=ox<oy,nx=horizontal?(dx>=0?1:-1):0,ny=horizontal?0:(dy>=0?1:-1),penetration=horizontal?ox:oy,ia=1/a.mass,ib=1/b.mass,sum=ia+ib;
  a.x-=nx*penetration*ia/sum;a.y-=ny*penetration*ia/sum;b.x+=nx*penetration*ib/sum;b.y+=ny*penetration*ib/sum;
  const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(relative>=0)return;const impulse=-1.12*relative/sum;a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib;
  if(-relative>90){this.hurt(a,(-relative-70)*Math.min(b.mass,18)*.16*(b.kind==='brick'?this.pierce*this.ammo.damage:1));this.hurt(b,(-relative-70)*Math.min(a.mass,18)*.16*(a.kind==='brick'?this.pierce*this.ammo.damage:1));if(a.kind==='brick')this.explode(a);if(b.kind==='brick')this.explode(b);}
 }
 step(dt){
  if(!Number.isFinite(dt)||dt<=0||this.won||this.phase==='lost')return;dt=Math.min(dt,.05);const count=Math.ceil(dt/.005),h=dt/count;
  for(let step=0;step<count;step++){
   this.time+=h;
   for(const signal of this.pending.filter(p=>p.at<=this.time)){const n=this.bodies.find(b=>b.id===signal.id&&!b.dead);if(!n)continue;this.sparks.push({x:n.x,y:n.y,age:0});this.hurt(n,200);for(const b of this.bodies)if(b.kind==='block'&&!b.dead&&Math.hypot(b.x-n.x,b.y-n.y)<85)this.hurt(b,38);}
   this.pending=this.pending.filter(p=>p.at>this.time);
   for(const b of this.bodies){
    if(b.dead||b.fixed)continue;const oldY=b.y,cap=b.kind==='brick'?3200:1400;b.vy=Math.min(cap,b.vy+510*h);b.vx=Math.max(-cap,Math.min(cap,b.vx));b.x+=b.vx*h;b.y+=b.vy*h;
    if(b.kind==='brick'&&Math.min(oldY,b.y)-b.h/2<=this.ceiling){this.intercept(b);continue;}
    if(b.y+b.h/2>FLOOR){const impact=b.vy;b.y=FLOOR-b.h/2;b.vy=-b.vy*.12;b.vx*=Math.pow(.1,h);if(impact>230){this.hurt(b,(impact-180)*.6);if(b.kind==='brick')this.explode(b);}}
    if(b.x<-150||b.x>1150||b.y>850){b.dead=true;if(b.core&&this.launched)this.triggerOverload(b);}
   }
   for(let pass=0;pass<3;pass++)for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++)this.collide(this.bodies[i],this.bodies[j]);
   for(const f of this.fragments){f.life-=h;f.x+=f.vx*h;f.vy+=510*h;f.y+=f.vy*h;}
   for(const e of this.pulses)e.age+=h;this.pulses=this.pulses.filter(e=>e.age<(e.mega?1.7:.45));for(const e of this.sparks)e.age+=h;this.sparks=this.sparks.filter(e=>e.age<.5);
   for(const e of this.explosions)e.age+=h;this.explosions=this.explosions.filter(e=>e.age<.5);
   for(const d of this.droneStrikes){d.age+=h;if(!d.burst&&d.age>=.18){d.burst=true;this.explosions.push({x:d.x,y:d.y,age:0,drone:true});for(let i=0;i<12;i++)this.fragments.push({x:d.x,y:d.y,vx:Math.cos(i)*180,vy:Math.sin(i)*180,life:1,material:'stone'});}}
   this.droneStrikes=this.droneStrikes.filter(d=>d.age<.75);this.fragments=this.fragments.filter(f=>f.life>0);this.bodies=this.bodies.filter(b=>!b.dead);
  }
  if(this.ball&&!this.ball.dead){this.trail.push({x:this.ball.x,y:this.ball.y});if(this.trail.length>28)this.trail.shift();}
  if(!this.remaining){this.won=true;this.phase='won';return;}
  if(this.phase==='intercepted'){this.age+=dt;if(this.age>.75&&!this.pending.length){this.ball=null;this.phase=this.shots?'ready':'lost';}}
  if(this.phase==='flying'){this.age+=dt;const moving=this.bodies.some(b=>!b.fixed&&Math.hypot(b.vx,b.vy)>30);this.quiet=moving?0:this.quiet+dt;if(!this.pending.length&&(this.age>9||(this.age>1.2&&this.quiet>.6))){if(this.ball)this.ball.dead=true;this.ball=null;this.phase=this.shots?'ready':'lost';}}
 }
 get remaining(){return this.bodies.filter(b=>b.kind==='neuron'&&!b.dead).length;}
}
function create({canvas,onSuccess,onMessage,isActive,getSiege=()=>({}),onSiegeClear=()=>{},onSiegeSelect=()=>{},onBossDefeat=()=>0}){
 const ctx=canvas.getContext('2d');let current,enabled=false,pointer=null,pull={x:-75,y:28},aim=false,last=null,awarded=false,penalized=false,lastIntercept=0,keys=new Set(),pointerTarget=null;
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1000,y:(e.clientY-r.top)/r.height*700};};
 const boss=()=>!!current?.isBoss;
 function cancel(){pointer=null;aim=false;keys.clear();pointerTarget=null;}
 function reset(){const s=normalizeUpgrade(getSiege());current=s.stage===9?new root.BrukSkyBoss.World(s,AMMO[s.ammo]):new World(s,s.stage);cancel();awarded=false;penalized=false;lastIntercept=0;pull={x:-75,y:28};last=null;}
 function setPull(p){const x=p.x-ANCHOR.x,y=p.y-ANCHOR.y,scale=Math.min(1,105/(Math.hypot(x,y)||1));pull={x:x*scale,y:y*scale};}
 function shoot(){if(current.launch(pull)){aim=false;onMessage('Пробий бар’єри та зруйнуй усі ядра. Не торкайся верхньої лінії — там БПЛА.');}}
 canvas.addEventListener('pointerdown',e=>{
  if(!enabled||!isActive())return;const p=point(e);
  if(boss()){if(current.phase==='intro')current.start();if(current.phase!=='playing')return;pointerTarget=p;pointer=e.pointerId;}else{if(current.phase!=='ready'||Math.hypot(p.x-ANCHOR.x,p.y-ANCHOR.y)>115)return;pointer=e.pointerId;aim=true;setPull(p);}
  canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);e.preventDefault();
 });
 canvas.addEventListener('pointermove',e=>{if(pointer!==e.pointerId||!enabled||!isActive())return;if(boss())pointerTarget=point(e);else setPull(point(e));e.preventDefault();});
 canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;if(boss())pointerTarget=null;else if(enabled&&isActive()&&aim)shoot();else aim=false;});canvas.addEventListener('pointercancel',cancel);
 root.document.addEventListener('keydown',e=>{
  if(!enabled||!isActive()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,button,a'))return;
  if(e.code==='KeyR'){e.preventDefault();reset();return;}
  if(boss()){if(['Space','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();keys.add(e.code);if(current.phase==='intro'&&['Space','Enter'].includes(e.code)&&!e.repeat)current.start();}return;}
  if(current.phase!=='ready')return;const moves={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]};if(moves[e.code]){e.preventDefault();const [x,y]=moves[e.code];setPull({x:ANCHOR.x+pull.x+x,y:ANCHOR.y+pull.y+y});aim=true;}if(e.code==='Space'&&!e.repeat){e.preventDefault();shoot();}
 });
 root.document.addEventListener('keyup',e=>keys.delete(e.code));root.addEventListener('blur',cancel);
 function setLayout(id){const s=normalizeUpgrade(getSiege());if(!Number.isInteger(id)||id<0||id>s.unlocked)return false;onSiegeSelect(id);reset();onMessage('Етап '+STAGES[id].number+' · '+STAGES[id].name+'. Нова спроба.');return true;}
 function frame(time){const dt=last===null?0:Math.min(.04,(time-last)/1000);last=time;if(enabled){
  if(isActive()){
   if(boss()){const x=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),y=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);current.step(dt,{x,y,fire:keys.has('Space')||pointer!==null,target:pointerTarget});}else {current.step(dt);if(current.intercepts>lastIntercept){lastIntercept=current.intercepts;root.BrukSfx?.playBreak();onMessage('БПЛА знищив бруківку біля верхньої межі. Зміни траєкторію.');}}
   if(current.won&&!awarded){awarded=true;onSiegeClear(current.isBoss?9:current.layoutIndex);onSuccess();}
   if(boss()&&current.phase==='lost'&&!penalized){penalized=true;current.lossCharged=onBossDefeat();}
  }else cancel();
  if(boss())root.BrukSkyBoss.draw(ctx,current,{canvas});else root.BrukSiegeArt.draw(ctx,current,{canvas,pull,aim});
 }root.requestAnimationFrame(frame);}
 reset();root.requestAnimationFrame(frame);
 return {setActive:on=>{enabled=on;last=null;if(on)reset();},reset,setLayout,cancel,get world(){return current;}};
}
const api={World,MATERIALS,AMMO,MAX_RANK,STAGES,LAYOUTS,normalizeUpgrade,price,purchase,advance,selectStage,ANCHOR,FLOOR,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.BrukNeuronSiege=api;
})(typeof window==='undefined'?globalThis:window);
