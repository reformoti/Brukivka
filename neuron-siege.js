(function(root){'use strict';
const FLOOR=640,ANCHOR={x:140,y:520},MATERIALS={wood:{hp:75,mass:3,color:'#b58249'},glass:{hp:35,mass:2,color:'#91dce5'},stone:{hp:180,mass:7,color:'#8e99a5'}};
const AMMO={standard:{name:'Звичайна',mass:9,size:34,speed:1,damage:1,price:0,color:'#b1b4b6'},heavy:{name:'Важка',mass:18,size:43,speed:.82,damage:1.5,price:2000000000000,color:'#78828d'},drill:{name:'Бронебійна',mass:7,size:28,speed:1.08,damage:2.3,price:8000000000000,color:'#8ce1e7'},blast:{name:'Вибухова',mass:8,size:35,speed:.92,damage:.9,price:24000000000000,color:'#ffae6d'}};
const MAX_RANK=12;
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
 constructor(upgrades={}){this.reset(upgrades);}
 reset(upgrades=this.upgrades){this.upgrades=normalizeUpgrade(upgrades);this.ammo=AMMO[this.upgrades.ammo];this.force=1+this.upgrades.power*.11;this.pierce=1+this.upgrades.penetration*.25;this.serial=0;this.explosions=[];this.bodies=[];this.fragments=[];this.shots=5;this.phase='ready';this.age=0;this.quiet=0;this.time=0;this.ball=null;this.won=false;
  for(const [index,x] of [570,735,900].entries()){
   const material=['wood','glass','stone'][index];this.add('block',x-43,590,16,100,material);this.add('block',x+43,590,16,100,material);this.add('block',x,532,116,16,material);
   for(const dx of [-22,0,22])this.add('neuron',x+dx,628,22,24,'wood');
   if(index!==1)for(const dx of [-20,20])this.add('neuron',x+dx,512,22,24,'wood');
   if(index===1){this.add('block',x-30,495,14,58,'wood');this.add('block',x+30,495,14,58,'wood');this.add('block',x,458,86,16,'wood');this.add('neuron',x,510,26,28,'wood');for(const dx of [-19,19])this.add('neuron',x+dx,438,22,24,'wood');}
  }
  this.total=this.remaining;
 }
 add(kind,x,y,w,h,material){const m=MATERIALS[material],b={id:this.serial++,kind,x,y,w,h,vx:0,vy:0,mass:kind==='neuron'?1.2:m.mass,hp:kind==='neuron'?55:m.hp,material,dead:false};this.bodies.push(b);return b;}
 launch(pull){if(this.phase!=='ready'||this.shots<=0||this.won)return false;const d=Math.hypot(pull.x,pull.y);if(d<12)return false;const scale=Math.min(1,105/d);this.ball=this.add('brick',ANCHOR.x+pull.x*scale,ANCHOR.y+pull.y*scale,this.ammo.size,this.ammo.size,'stone');this.ball.mass=this.ammo.mass;this.ball.ammo=this.upgrades.ammo;this.ball.hp=1e9;this.ball.vx=-pull.x*scale*9.2*this.force*this.ammo.speed;this.ball.vy=-pull.y*scale*9.2*this.force*this.ammo.speed;this.shots--;this.phase='flying';this.age=0;this.quiet=0;return true;}
 explode(ball){if(ball.detonated||ball.ammo!=='blast')return;ball.detonated=true;ball.dead=true;this.explosions.push({x:ball.x,y:ball.y,age:0});for(const b of this.bodies){if(b.dead||b===ball)continue;const dx=b.x-ball.x,dy=b.y-ball.y,d=Math.hypot(dx,dy);if(d<125){const strength=1-d/125;this.hurt(b,230*strength*this.pierce);b.vx+=dx/(d||1)*strength*450;b.vy+=dy/(d||1)*strength*450-70;}}}
 hurt(b,amount){if(b.dead||b.kind==='brick'||amount<1)return;b.hp-=amount;if(b.hp<=0){b.dead=true;for(let i=0;i<5;i++)this.fragments.push({x:b.x,y:b.y,vx:(i-2)*50+b.vx*.3,vy:-65-i*17,life:1.2,material:b.material});}}
 collide(a,b){if(a.dead||b.dead)return;const dx=b.x-a.x,dy=b.y-a.y,ox=(a.w+b.w)/2-Math.abs(dx),oy=(a.h+b.h)/2-Math.abs(dy);if(ox<=0||oy<=0)return;const horizontal=ox<oy,nx=horizontal?(dx>=0?1:-1):0,ny=horizontal?0:(dy>=0?1:-1),penetration=horizontal?ox:oy,ia=1/a.mass,ib=1/b.mass,sum=ia+ib;
  a.x-=nx*penetration*ia/sum;a.y-=ny*penetration*ia/sum;b.x+=nx*penetration*ib/sum;b.y+=ny*penetration*ib/sum;
  const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(relative>=0)return;const impulse=-1.12*relative/sum;a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib;
  if(-relative>90){this.hurt(a,(-relative-70)*Math.min(b.mass,18)*.16*(b.kind==='brick'?this.pierce*this.ammo.damage:1));this.hurt(b,(-relative-70)*Math.min(a.mass,18)*.16*(a.kind==='brick'?this.pierce*this.ammo.damage:1));if(a.kind==='brick')this.explode(a);if(b.kind==='brick')this.explode(b);}
 }
 step(dt){if(!Number.isFinite(dt)||dt<=0||this.won||this.phase==='lost')return;dt=Math.min(dt,.05);const count=Math.ceil(dt/.005),h=dt/count;
  for(let step=0;step<count;step++){
   this.time+=h;for(const b of this.bodies){if(b.dead)continue;const cap=b.kind==='brick'?3200:1400;b.vy=Math.min(cap,b.vy+510*h);b.vx=Math.max(-cap,Math.min(cap,b.vx));b.x+=b.vx*h;b.y+=b.vy*h;
    if(b.y+b.h/2>FLOOR){const impact=b.vy;b.y=FLOOR-b.h/2;b.vy=-b.vy*.12;b.vx*=Math.pow(.1,h);if(impact>230){this.hurt(b,(impact-180)*.6);if(b.kind==='brick')this.explode(b);}}
    if(b.x<-150||b.x>1150||b.y>850){b.dead=true;}
   }
   for(let pass=0;pass<3;pass++)for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++)this.collide(this.bodies[i],this.bodies[j]);
   for(const f of this.fragments){f.life-=h;f.x+=f.vx*h;f.vy+=510*h;f.y+=f.vy*h;}
   for(const e of this.explosions)e.age+=h;this.explosions=this.explosions.filter(e=>e.age<.5);
   this.fragments=this.fragments.filter(f=>f.life>0);this.bodies=this.bodies.filter(b=>!b.dead);
  }
  if(!this.bodies.some(b=>b.kind==='neuron')){this.won=true;this.phase='won';return;}
  if(this.phase==='flying'){this.age+=dt;const moving=this.bodies.some(b=>Math.hypot(b.vx,b.vy)>30);this.quiet=moving?0:this.quiet+dt;
   if(this.age>9||(this.age>1.2&&this.quiet>.6)){if(this.ball)this.ball.dead=true;this.ball=null;this.phase=this.shots?'ready':'lost';}
  }
 }
 get remaining(){return this.bodies.filter(b=>b.kind==='neuron'&&!b.dead).length;}
}
function create({canvas,onSuccess,onMessage,isActive,getSiege=()=>({})}){const ctx=canvas.getContext('2d'),world=new World(getSiege());let enabled=false,pointer=null,pull={x:-75,y:28},aim=false,last=null,awarded=false;
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1000,y:(e.clientY-r.top)/r.height*700};};
 function reset(){world.reset(getSiege());pointer=null;aim=false;awarded=false;pull={x:-75,y:28};}
 function setPull(p){const x=p.x-ANCHOR.x,y=p.y-ANCHOR.y,scale=Math.min(1,105/(Math.hypot(x,y)||1));pull={x:x*scale,y:y*scale};}
 function shoot(){if(world.launch(pull)){aim=false;onMessage('Зруйнуй усі домики з нейронами. Залишилось пострілів: '+world.shots);}}
 canvas.addEventListener('pointerdown',e=>{if(!enabled||!isActive()||world.phase!=='ready')return;const p=point(e);if(Math.hypot(p.x-ANCHOR.x,p.y-ANCHOR.y)>115)return;pointer=e.pointerId;aim=true;setPull(p);canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(pointer===e.pointerId&&enabled&&isActive()){setPull(point(e));e.preventDefault();}});
 canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;if(enabled&&isActive()&&aim)shoot();else aim=false;});canvas.addEventListener('pointercancel',()=>{pointer=null;aim=false;});
 root.document.addEventListener('keydown',e=>{if(!enabled||!isActive()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,button,a'))return;if(e.code==='KeyR'){e.preventDefault();reset();return;}if(world.phase!=='ready')return;const keys={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]};if(keys[e.code]){e.preventDefault();const [x,y]=keys[e.code];setPull({x:ANCHOR.x+pull.x+x,y:ANCHOR.y+pull.y+y});aim=true;}if(e.code==='Space'&&!e.repeat){e.preventDefault();shoot();}});
 root.addEventListener('blur',()=>{pointer=null;aim=false;});
 function text(s,x,y,size=16,color='#e6edf3'){ctx.font=`600 ${size}px system-ui`;ctx.fillStyle=color;ctx.fillText(s,x,y);}
 function drawBrick(x,y,size,angle,id){root.BrukBrick?.draw(ctx,x,y,size,size,angle);if(id==='standard')return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.strokeStyle=AMMO[id].color;ctx.lineWidth=id==='heavy'?4:2;ctx.strokeRect(-size*.42,-size*.4,size*.84,size*.8);if(id==='drill'){ctx.fillStyle=AMMO[id].color;ctx.beginPath();ctx.moveTo(size*.9,0);ctx.lineTo(size*.35,-7);ctx.lineTo(size*.35,7);ctx.closePath();ctx.fill();}if(id==='blast'){ctx.fillStyle='#ed644c';ctx.fillRect(-5,-size*.4,10,size*.8);ctx.strokeStyle='#ffc277';ctx.beginPath();ctx.moveTo(0,-size*.4);ctx.lineTo(5,-size*.7);ctx.stroke();}ctx.restore();}
 function drawNeuron(b){ctx.save();ctx.translate(b.x,b.y);ctx.rotate((b.id%3-1)*.22);const blue=b.id%2===0;ctx.strokeStyle=blue?'#8ad4ed':'#c8a6ed';ctx.lineCap='round';ctx.lineWidth=1.8;
  for(let i=0;i<7;i++){const a=1.0+i*.73,c=Math.cos(a),s=Math.sin(a);ctx.beginPath();ctx.moveTo(c*6,s*6);ctx.quadraticCurveTo(c*15+s*4,s*15-c*4,c*23,s*23);ctx.moveTo(c*17,s*17);ctx.lineTo(c*26-s*6,s*26+c*6);ctx.moveTo(c*23,s*23);ctx.lineTo(c*30+s*3,s*30-c*3);ctx.stroke();}
  ctx.fillStyle=blue?'#48b8df':'#a78bc9';ctx.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?7:11;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.fillStyle=blue?'#3099c6':'#8c6eb0';ctx.beginPath();ctx.ellipse(0,0,6.5,7.5,-.4,0,7);ctx.fill();ctx.fillStyle=blue?'#213f78':'#345b46';ctx.beginPath();ctx.ellipse(-1,0,3.7,4.5,.2,0,7);ctx.fill();
  ctx.strokeStyle=blue?'#8ad4ed':'#c8a6ed';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(9,1);ctx.bezierCurveTo(25,12,34,1,54,-5);ctx.stroke();
  for(let i=0;i<3;i++){const x=22+i*11,y=4-i*3;ctx.fillStyle=blue?'#d4f1f4':'#f6d870';ctx.strokeStyle=blue?'#6cbed8':'#b58b46';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,6,2.8,-.26,0,7);ctx.fill();ctx.stroke();}
  ctx.strokeStyle=blue?'#8ad4ed':'#c8a6ed';ctx.lineWidth=1.5;for(const dy of [-17,0,17]){ctx.beginPath();ctx.moveTo(53,-5);ctx.quadraticCurveTo(60,dy-6,67,dy-5);ctx.lineTo(72,dy-9);ctx.moveTo(64,dy-5);ctx.lineTo(70,dy+1);ctx.stroke();}ctx.restore();}
 function draw(){ctx.setTransform(canvas.width/1000,0,0,canvas.height/700,0,0);const sky=ctx.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#111b31');sky.addColorStop(1,'#314c58');ctx.fillStyle=sky;ctx.fillRect(0,0,1000,700);
  ctx.fillStyle='#1b3342';for(let i=0;i<13;i++){const x=i*89,h=70+(i*57)%140;ctx.fillRect(x,FLOOR-h,67,h);}ctx.fillStyle='#4c6259';ctx.fillRect(0,FLOOR,1000,60);ctx.fillStyle='#a5b687';ctx.fillRect(0,FLOOR,1000,5);
  ctx.strokeStyle='#ae8051';ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(140,FLOOR);ctx.lineTo(140,548);ctx.moveTo(115,500);ctx.lineTo(140,548);ctx.lineTo(164,500);ctx.stroke();
  if(world.phase==='ready'){const p=aim?{x:140+pull.x,y:520+pull.y}:ANCHOR;if(aim){ctx.strokeStyle='#e9bc7f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(115,500);ctx.lineTo(p.x,p.y);ctx.lineTo(164,500);ctx.stroke();ctx.fillStyle='#d8eaa888';for(let t=.1;t<2;t+=.11){const x=p.x-pull.x*9.2*world.force*world.ammo.speed*t,y=p.y-pull.y*9.2*world.force*world.ammo.speed*t+255*t*t;if(y>FLOOR||x>1000)break;ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();}}drawBrick(p.x,p.y,world.ammo.size,0,world.upgrades.ammo);}
  for(const b of world.bodies){if(b.dead)continue;if(b.kind==='brick'){drawBrick(b.x,b.y,b.w,world.age*5,b.ammo);continue;}if(b.kind==='neuron'){
   drawNeuron(b);
  }else{ctx.fillStyle=MATERIALS[b.material].color;ctx.fillRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h);ctx.strokeStyle='#ffffff50';ctx.lineWidth=2;ctx.strokeRect(b.x-b.w/2+2,b.y-b.h/2+2,b.w-4,b.h-4);if(b.hp<MATERIALS[b.material].hp*.6){ctx.strokeStyle='#273642';ctx.beginPath();ctx.moveTo(b.x-b.w/3,b.y-b.h/3);ctx.lineTo(b.x,b.y);ctx.lineTo(b.x+b.w/4,b.y+b.h/3);ctx.stroke();}}}
  for(const e of world.explosions){ctx.globalAlpha=1-e.age/.5;ctx.fillStyle='#ffb355';ctx.beginPath();ctx.arc(e.x,e.y,125*e.age/.5,0,7);ctx.fill();}ctx.globalAlpha=1;
  for(const f of world.fragments){ctx.globalAlpha=Math.max(0,f.life/1.2);ctx.fillStyle=MATERIALS[f.material].color;ctx.fillRect(f.x-3,f.y-3,6,6);}ctx.globalAlpha=1;
  text('ОБЛОГА НЕЙРОНІВ / 05',25,38,20);text('×250',900,38,24,'#d5f19c');text(world.ammo.name+' · натяг ×'+world.force.toFixed(2)+' · пробиття ×'+world.pierce.toFixed(2),25,127,13,'#a9c2d1');text(`НЕЙРОНИ ${world.remaining} / ${world.total} · ПОСТРІЛИ ${world.shots} / 5`,25,70,16,'#d5f19c');
  if(world.phase==='ready')text('Потягни бруківку назад і відпусти · стрілки + пробіл',25,104,14,'#c4d2de');
  if(world.phase==='lost'){ctx.fillStyle='#101622dc';ctx.fillRect(200,235,600,145);text('СПРОБА ЗАВЕРШЕНА',320,285,25);text('R або «Спочатку» — збудувати домики заново',282,330,16);}
  if(world.won)text('УСІ НЕЙРОНИ ЗНИЩЕНІ!',295,180,28,'#d5f19c');
 }
 function frame(time){const dt=last===null?0:Math.min(.04,(time-last)/1000);last=time;if(enabled){if(isActive()){world.step(dt);if(world.won&&!awarded){awarded=true;onSuccess();}}else{pointer=null;aim=false;}draw();}root.requestAnimationFrame(frame);}root.requestAnimationFrame(frame);
 return {setActive:on=>{enabled=on;last=null;if(on)reset();},reset,cancel:()=>{pointer=null;aim=false;},world};
}
const api={World,MATERIALS,AMMO,MAX_RANK,normalizeUpgrade,price,purchase,ANCHOR,FLOOR,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.BrukNeuronSiege=api;
})(typeof window==='undefined'?globalThis:window);
