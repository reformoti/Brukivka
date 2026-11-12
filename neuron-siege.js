(function(root){'use strict';
const FLOOR=640,ANCHOR={x:140,y:520},MATERIALS={wood:{hp:75,mass:3,color:'#b58249'},glass:{hp:35,mass:2,color:'#91dce5'},stone:{hp:180,mass:7,color:'#8e99a5'}};
class World{
 constructor(){this.reset();}
 reset(){this.bodies=[];this.fragments=[];this.shots=5;this.phase='ready';this.age=0;this.quiet=0;this.time=0;this.ball=null;this.won=false;
  for(const [index,x] of [570,735,900].entries()){
   const material=['wood','glass','stone'][index];this.add('block',x-43,590,16,100,material);this.add('block',x+43,590,16,100,material);this.add('block',x,532,116,16,material);
   this.add('neuron',x,623,30,30,'wood');
   if(index===1){this.add('block',x-30,495,14,58,'wood');this.add('block',x+30,495,14,58,'wood');this.add('block',x,458,86,16,'wood');this.add('neuron',x,510,28,28,'wood');}
  }
 }
 add(kind,x,y,w,h,material){const m=MATERIALS[material],b={kind,x,y,w,h,vx:0,vy:0,mass:kind==='neuron'?1.2:m.mass,hp:kind==='neuron'?55:m.hp,material,dead:false};this.bodies.push(b);return b;}
 launch(pull){if(this.phase!=='ready'||this.shots<=0||this.won)return false;const d=Math.hypot(pull.x,pull.y);if(d<12)return false;const scale=Math.min(1,105/d);this.ball=this.add('brick',ANCHOR.x+pull.x*scale,ANCHOR.y+pull.y*scale,34,34,'stone');this.ball.mass=9;this.ball.hp=1e9;this.ball.vx=-pull.x*scale*9.2;this.ball.vy=-pull.y*scale*9.2;this.shots--;this.phase='flying';this.age=0;this.quiet=0;return true;}
 hurt(b,amount){if(b.dead||b.kind==='brick'||amount<1)return;b.hp-=amount;if(b.hp<=0){b.dead=true;for(let i=0;i<5;i++)this.fragments.push({x:b.x,y:b.y,vx:(i-2)*50+b.vx*.3,vy:-65-i*17,life:1.2,material:b.material});}}
 collide(a,b){if(a.dead||b.dead)return;const dx=b.x-a.x,dy=b.y-a.y,ox=(a.w+b.w)/2-Math.abs(dx),oy=(a.h+b.h)/2-Math.abs(dy);if(ox<=0||oy<=0)return;const horizontal=ox<oy,nx=horizontal?(dx>=0?1:-1):0,ny=horizontal?0:(dy>=0?1:-1),penetration=horizontal?ox:oy,ia=1/a.mass,ib=1/b.mass,sum=ia+ib;
  a.x-=nx*penetration*ia/sum;a.y-=ny*penetration*ia/sum;b.x+=nx*penetration*ib/sum;b.y+=ny*penetration*ib/sum;
  const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(relative>=0)return;const impulse=-1.12*relative/sum;a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib;
  if(-relative>90){this.hurt(a,(-relative-70)*Math.min(b.mass,9)*.16);this.hurt(b,(-relative-70)*Math.min(a.mass,9)*.16);}
 }
 step(dt){if(!Number.isFinite(dt)||dt<=0||this.won||this.phase==='lost')return;dt=Math.min(dt,.05);const count=Math.ceil(dt/.005),h=dt/count;
  for(let step=0;step<count;step++){
   this.time+=h;for(const b of this.bodies){if(b.dead)continue;b.vy=Math.min(1400,b.vy+510*h);b.vx=Math.max(-1400,Math.min(1400,b.vx));b.x+=b.vx*h;b.y+=b.vy*h;
    if(b.y+b.h/2>FLOOR){const impact=b.vy;b.y=FLOOR-b.h/2;b.vy=-b.vy*.12;b.vx*=Math.pow(.1,h);if(impact>230)this.hurt(b,(impact-180)*.6);}
    if(b.x<-150||b.x>1150||b.y>850){b.dead=true;}
   }
   for(let pass=0;pass<3;pass++)for(let i=0;i<this.bodies.length;i++)for(let j=i+1;j<this.bodies.length;j++)this.collide(this.bodies[i],this.bodies[j]);
   for(const f of this.fragments){f.life-=h;f.x+=f.vx*h;f.vy+=510*h;f.y+=f.vy*h;}
   this.fragments=this.fragments.filter(f=>f.life>0);this.bodies=this.bodies.filter(b=>!b.dead);
  }
  if(!this.bodies.some(b=>b.kind==='neuron')){this.won=true;this.phase='won';return;}
  if(this.phase==='flying'){this.age+=dt;const moving=this.bodies.some(b=>Math.hypot(b.vx,b.vy)>30);this.quiet=moving?0:this.quiet+dt;
   if(this.age>9||(this.age>1.2&&this.quiet>.6)){if(this.ball)this.ball.dead=true;this.ball=null;this.phase=this.shots?'ready':'lost';}
  }
 }
 get remaining(){return this.bodies.filter(b=>b.kind==='neuron'&&!b.dead).length;}
}
function create({canvas,onSuccess,onMessage,isActive}){const ctx=canvas.getContext('2d'),world=new World();let enabled=false,pointer=null,pull={x:-75,y:28},aim=false,last=null,awarded=false;
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1000,y:(e.clientY-r.top)/r.height*700};};
 function reset(){world.reset();pointer=null;aim=false;awarded=false;pull={x:-75,y:28};}
 function setPull(p){const x=p.x-ANCHOR.x,y=p.y-ANCHOR.y,scale=Math.min(1,105/(Math.hypot(x,y)||1));pull={x:x*scale,y:y*scale};}
 function shoot(){if(world.launch(pull)){aim=false;onMessage('Зруйнуй усі домики з нейронами. Залишилось пострілів: '+world.shots);}}
 canvas.addEventListener('pointerdown',e=>{if(!enabled||!isActive()||world.phase!=='ready')return;const p=point(e);if(Math.hypot(p.x-ANCHOR.x,p.y-ANCHOR.y)>115)return;pointer=e.pointerId;aim=true;setPull(p);canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(pointer===e.pointerId&&enabled&&isActive()){setPull(point(e));e.preventDefault();}});
 canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;if(enabled&&isActive()&&aim)shoot();else aim=false;});canvas.addEventListener('pointercancel',()=>{pointer=null;aim=false;});
 root.document.addEventListener('keydown',e=>{if(!enabled||!isActive()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,button,a'))return;if(e.code==='KeyR'){e.preventDefault();reset();return;}if(world.phase!=='ready')return;const keys={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]};if(keys[e.code]){e.preventDefault();const [x,y]=keys[e.code];setPull({x:ANCHOR.x+pull.x+x,y:ANCHOR.y+pull.y+y});aim=true;}if(e.code==='Space'&&!e.repeat){e.preventDefault();shoot();}});
 root.addEventListener('blur',()=>{pointer=null;aim=false;});
 function text(s,x,y,size=16,color='#e6edf3'){ctx.font=`600 ${size}px system-ui`;ctx.fillStyle=color;ctx.fillText(s,x,y);}
 function draw(){ctx.setTransform(canvas.width/1000,0,0,canvas.height/700,0,0);const sky=ctx.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#111b31');sky.addColorStop(1,'#314c58');ctx.fillStyle=sky;ctx.fillRect(0,0,1000,700);
  ctx.fillStyle='#1b3342';for(let i=0;i<13;i++){const x=i*89,h=70+(i*57)%140;ctx.fillRect(x,FLOOR-h,67,h);}ctx.fillStyle='#4c6259';ctx.fillRect(0,FLOOR,1000,60);ctx.fillStyle='#a5b687';ctx.fillRect(0,FLOOR,1000,5);
  ctx.strokeStyle='#ae8051';ctx.lineWidth=13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(140,FLOOR);ctx.lineTo(140,548);ctx.moveTo(115,500);ctx.lineTo(140,548);ctx.lineTo(164,500);ctx.stroke();
  if(world.phase==='ready'){const p=aim?{x:140+pull.x,y:520+pull.y}:ANCHOR;if(aim){ctx.strokeStyle='#e9bc7f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(115,500);ctx.lineTo(p.x,p.y);ctx.lineTo(164,500);ctx.stroke();ctx.fillStyle='#d8eaa888';for(let t=.1;t<2;t+=.11){const x=p.x-pull.x*9.2*t,y=p.y-pull.y*9.2*t+255*t*t;if(y>FLOOR||x>1000)break;ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();}}root.BrukBrick?.draw(ctx,p.x,p.y,36,36,0);}
  for(const b of world.bodies){if(b.dead)continue;if(b.kind==='brick'){root.BrukBrick?.draw(ctx,b.x,b.y,36,36,world.age*5);continue;}if(b.kind==='neuron'){
   ctx.strokeStyle='#ecc2ec';ctx.lineWidth=2;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(b.x+Math.cos(a)*8,b.y+Math.sin(a)*8);ctx.lineTo(b.x+Math.cos(a)*21,b.y+Math.sin(a)*21);ctx.stroke();ctx.fillStyle='#d1a6db';ctx.beginPath();ctx.arc(b.x+Math.cos(a)*21,b.y+Math.sin(a)*21,3,0,7);ctx.fill();}
   ctx.fillStyle='#d294d1';ctx.beginPath();ctx.arc(b.x,b.y,14,0,7);ctx.fill();ctx.fillStyle='#51315e';ctx.beginPath();ctx.arc(b.x-4,b.y-2,2,0,7);ctx.arc(b.x+4,b.y-2,2,0,7);ctx.fill();ctx.strokeStyle='#51315e';ctx.beginPath();ctx.arc(b.x,b.y+3,5,0,Math.PI);ctx.stroke();
  }else{ctx.fillStyle=MATERIALS[b.material].color;ctx.fillRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h);ctx.strokeStyle='#ffffff50';ctx.lineWidth=2;ctx.strokeRect(b.x-b.w/2+2,b.y-b.h/2+2,b.w-4,b.h-4);if(b.hp<MATERIALS[b.material].hp*.6){ctx.strokeStyle='#273642';ctx.beginPath();ctx.moveTo(b.x-b.w/3,b.y-b.h/3);ctx.lineTo(b.x,b.y);ctx.lineTo(b.x+b.w/4,b.y+b.h/3);ctx.stroke();}}}
  for(const f of world.fragments){ctx.globalAlpha=Math.max(0,f.life/1.2);ctx.fillStyle=MATERIALS[f.material].color;ctx.fillRect(f.x-3,f.y-3,6,6);}ctx.globalAlpha=1;
  text('ОБЛОГА НЕЙРОНІВ / 05',25,38,20);text('×250',900,38,24,'#d5f19c');text(`НЕЙРОНИ ${world.remaining} / 4 · ПОСТРІЛИ ${world.shots} / 5`,25,70,16,'#d5f19c');
  if(world.phase==='ready')text('Потягни бруківку назад і відпусти · стрілки + пробіл',25,104,14,'#c4d2de');
  if(world.phase==='lost'){ctx.fillStyle='#101622dc';ctx.fillRect(200,235,600,145);text('СПРОБА ЗАВЕРШЕНА',320,285,25);text('R або «Спочатку» — збудувати домики заново',282,330,16);}
  if(world.won)text('УСІ НЕЙРОНИ ЗНИЩЕНІ!',295,180,28,'#d5f19c');
 }
 function frame(time){const dt=last===null?0:Math.min(.04,(time-last)/1000);last=time;if(enabled){if(isActive()){world.step(dt);if(world.won&&!awarded){awarded=true;onSuccess();}}else{pointer=null;aim=false;}draw();}root.requestAnimationFrame(frame);}root.requestAnimationFrame(frame);
 return {setActive:on=>{enabled=on;last=null;if(on)reset();},reset,cancel:()=>{pointer=null;aim=false;},world};
}
const api={World,MATERIALS,ANCHOR,FLOOR,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.BrukNeuronSiege=api;
})(typeof window==='undefined'?globalThis:window);
