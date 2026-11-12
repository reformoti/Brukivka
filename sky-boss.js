(function(root){'use strict';
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function penaltyForBalance(balance){return Number.isSafeInteger(balance)&&balance>0?Number(BigInt(balance)*85n/100n):0;}
function segmentHit(ax,ay,bx,by,x,y,r){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return (ax+dx*t-x)**2+(ay+dy*t-y)**2<=r*r;}
class World{
 constructor(upgrades={},ammo={damage:1,speed:1}){
  this.isBoss=true;this.upgrades={power:clamp(Number(upgrades.power)||0,0,12),penetration:clamp(Number(upgrades.penetration)||0,0,12),ammo:upgrades.ammo||'standard'};this.ammo=ammo;this.phase='intro';this.won=false;this.time=0;this.player={x:175,y:370,hp:3,r:23,invuln:0};this.brain={x:855,y:350,hp:720,maxHp:720,r:74};this.bullets=[];this.enemies=[];this.obstacles=[];this.particles=[];this.warnings=[];this.shotCooldown=0;this.volleyClock=1.6;this.obstacleClock=3.2;this.volley=0;this.obstacleCount=0;this.lossCharged=0;
 }
 start(){if(this.phase!=='intro')return false;this.phase='playing';return true;}
 get bossPhase(){return this.brain.hp>this.brain.maxHp*2/3?1:this.brain.hp>this.brain.maxHp/3?2:3;}
 burst(x,y,color='#bddad6',count=10){for(let i=0;i<count;i++){const a=i*TAU/count;this.particles.push({x,y,vx:Math.cos(a)*(75+i*6),vy:Math.sin(a)*(75+i*6),life:.65,color});}}
 hit(fatal=false){if(this.phase!=='playing'||(!fatal&&this.player.invuln>0))return false;this.player.hp=fatal?0:Math.max(0,this.player.hp-1);this.player.invuln=1.25;this.burst(this.player.x,this.player.y,fatal?'#ffb85c':'#d8e5db',fatal?24:10);if(!this.player.hp){this.phase='lost';this.bullets=[];}return true;}
 fire(){if(this.phase!=='playing'||this.shotCooldown>0)return false;this.shotCooldown=.22;this.bullets.push({x:this.player.x+49,y:this.player.y,vx:860*(this.ammo.speed||1),r:10,damage:14*(1+this.upgrades.power*.045)*(1+this.upgrades.penetration*.25)*(this.ammo.damage||1),dead:false});return true;}
 spawnVolley(){
  this.volley++;const phase=this.bossPhase,angle=Math.atan2(this.player.y-this.brain.y,this.player.x-this.brain.x),count=phase===1?3:phase===2?4:5;
  for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.17;this.enemies.push({x:this.brain.x-68,y:this.brain.y,vx:Math.cos(a)*(210+phase*28),vy:Math.sin(a)*(210+phase*28),r:10,kind:'neuron',dead:false});}
  // A rare aimed neutron has a visible warning and no homing after launch.
  if(this.volley%9===0)this.warnings.push({x:this.brain.x-70,y:this.brain.y,tx:this.player.x,ty:this.player.y,age:0,delay:.9,fired:false});
 }
 spawnObstacle(){
  this.obstacleCount++;const kind=['bird','bird','storm','debris'][this.obstacleCount%4],y=190+((this.obstacleCount*137)%410);
  this.obstacles.push({x:1060,y,baseY:y,vx:-(145+this.bossPhase*24),r:kind==='storm'?34:kind==='debris'?24:19,kind,seed:this.obstacleCount,dead:false});
 }
 step(dt,input={}){
  if(this.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.05,dt);const steps=Math.ceil(dt/.012),h=dt/steps;
  for(let sub=0;sub<steps&&this.phase==='playing';sub++){
   this.time+=h;const p=this.player,oldX=p.x,oldY=p.y;p.invuln=Math.max(0,p.invuln-h);this.shotCooldown=Math.max(0,this.shotCooldown-h);
   let dx=Number.isFinite(input.x)?input.x:0,dy=Number.isFinite(input.y)?input.y:0;
   if(input.target&&Number.isFinite(input.target.x)&&Number.isFinite(input.target.y)){dx=clamp((input.target.x-p.x)/65,-1,1);dy=clamp((input.target.y-p.y)/65,-1,1);}
   const scale=Math.max(1,Math.hypot(dx,dy));p.x=clamp(p.x+dx/scale*330*h,60,650);p.y=clamp(p.y+dy/scale*330*h,155,625);
   this.brain.y=350+Math.sin(this.time*.75)*142;this.brain.x=855+Math.sin(this.time*.27)*20;
   if(input.fire)this.fire();this.volleyClock-=h;this.obstacleClock-=h;
   if(this.volleyClock<=0){this.spawnVolley();this.volleyClock=[1.2,.94,.72][this.bossPhase-1];}
   if(this.obstacleClock<=0){this.spawnObstacle();this.obstacleClock=4.7-this.bossPhase*.55;}
   for(const warning of this.warnings){warning.age+=h;if(!warning.fired&&warning.age>=warning.delay){warning.fired=true;const a=Math.atan2(warning.ty-warning.y,warning.tx-warning.x);this.enemies.push({x:warning.x,y:warning.y,vx:Math.cos(a)*350,vy:Math.sin(a)*350,r:8,kind:'neutron',dead:false});}}
   this.warnings=this.warnings.filter(w=>w.age<w.delay+.2);
   for(const e of [...this.enemies,...this.obstacles]){
    if(e.dead)continue;const ox=e.x,oy=e.y;e.x+=e.vx*h;if(e.kind==='bird')e.y=e.baseY+Math.sin(this.time*2+e.seed)*26;else if(e.kind==='storm')e.y=e.baseY+Math.sin(this.time*.8+e.seed)*16;else if(e.kind==='debris')e.y+=Math.sin(e.seed)*35*h;else e.y+=e.vy*h;
    if(segmentHit(ox-oldX,oy-oldY,e.x-p.x,e.y-p.y,0,0,p.r+e.r)){e.dead=true;this.hit(e.kind==='neutron');}
    if(e.x<-70||e.x>1150||e.y<-60||e.y>770)e.dead=true;
   }
   if(this.phase!=='playing')break;
   for(const bullet of this.bullets){
    if(bullet.dead)continue;const ox=bullet.x;bullet.x+=bullet.vx*h;
    const target=[...this.enemies,...this.obstacles].find(e=>!e.dead&&e.kind!=='neutron'&&segmentHit(ox,bullet.y,bullet.x,bullet.y,e.x,e.y,e.r+bullet.r));
    if(target){target.dead=true;bullet.dead=true;this.burst(target.x,target.y,'#aad9dc',5);continue;}
    if(segmentHit(ox,bullet.y,bullet.x,bullet.y,this.brain.x,this.brain.y,this.brain.r+bullet.r)){
     bullet.dead=true;this.brain.hp=Math.max(0,this.brain.hp-bullet.damage);this.burst(bullet.x,bullet.y,'#f4b8c7',4);
     if(!this.brain.hp){this.won=true;this.phase='won';this.burst(this.brain.x,this.brain.y,'#fff0b8',48);break;}
    }
    if(bullet.x>1100)bullet.dead=true;
   }
   for(const a of this.particles){a.life-=h;a.x+=a.vx*h;a.y+=a.vy*h;}
   this.particles=this.particles.filter(a=>a.life>0);this.bullets=this.bullets.filter(b=>!b.dead);this.enemies=this.enemies.filter(e=>!e.dead);this.obstacles=this.obstacles.filter(e=>!e.dead);
  }
 }
}
function draw(ctx,w,{canvas}={}){
 const view=canvas||ctx.canvas,t=w.time,p=w.player,b=w.brain;ctx.setTransform(view.width/1000,0,0,view.height/700,0,0);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.lineCap='round';ctx.lineJoin='round';ctx.textAlign='left';
 const text=(s,x,y,size=12,color='#c8dee7',weight=600)=>{ctx.fillStyle=color;ctx.font=`${Math.round(weight/100)*100} ${size}px "Noto Sans", Arial, sans-serif`;ctx.fillText(s,x,y);};
 const line=(x,y,a,b,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();};
 const circle=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();};
 const panel=(x,y,width,height,fill='#0a2035ed',stroke='#9bb9cd77')=>{ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,width,height,10);ctx.fill();ctx.stroke();};
 const glow=(x,y,r,color)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#11243a00');circle(x,y,r,g);};
 const brick=(x,y,s,angle=0)=>{if(root.BrukBrick?.draw)root.BrukBrick.draw(ctx,x,y,s,s*.78,angle);else{ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#c3cacb';ctx.strokeStyle='#e9f1ed';ctx.lineWidth=1;ctx.beginPath();for(const [i,[a,b]] of [[-.5,-.4],[-.2,-.4],[-.2,-.24],[.2,-.24],[.2,-.4],[.5,-.4],[.5,.4],[.2,.4],[.2,.24],[-.2,.24],[-.2,.4],[-.5,.4]].entries())i?ctx.lineTo(a*s,b*s):ctx.moveTo(a*s,b*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}};
 function cloud(x,y,s,opacity=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.globalAlpha=opacity;const g=ctx.createLinearGradient(0,-40,0,30);g.addColorStop(0,'#e8f2fa');g.addColorStop(1,'#749dbf');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-83,22);ctx.bezierCurveTo(-115,0,-68,-32,-48,-22);ctx.bezierCurveTo(-40,-74,27,-76,42,-25);ctx.bezierCurveTo(87,-44,116,9,76,24);ctx.closePath();ctx.fill();ctx.restore();}
 const sky=ctx.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#102747');sky.addColorStop(.5,'#2c678b');sky.addColorStop(1,'#b4d1d8');ctx.fillStyle=sky;ctx.fillRect(0,0,1000,700);glow(728,201,180,'#ffd6a638');circle(728,201,31,'#f9dfb1');
 for(let i=0;i<8;i++){const x=1100-((i*181+t*(13+i%3*4))%1320),y=172+(i*97)%410;cloud(x,y,.45+i%3*.25,.22);}
 ctx.fillStyle='#305c8150';ctx.beginPath();ctx.moveTo(0,700);for(let x=0;x<=1000;x+=25)ctx.lineTo(x,641+Math.sin(x*.017)*24);ctx.lineTo(1000,700);ctx.closePath();ctx.fill();
 for(let i=0;i<7;i++)cloud(i*180-50-(t*24)%180,724+Math.sin(i)*10,1.3,.8);
 // Brain: a lobed silhouette, hemispheres and cortical folds, suspended in the sky.
 if(!w.won){
  glow(b.x,b.y,128,'#f391c63b');ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.sin(t*.7)*.05);
  const brain=ctx.createLinearGradient(-70,-70,65,80);brain.addColorStop(0,'#f9ccd1');brain.addColorStop(.5,'#d481a1');brain.addColorStop(1,'#844c83');ctx.fillStyle=brain;ctx.strokeStyle='#5e416d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-67);ctx.bezierCurveTo(-22,-93,-57,-76,-57,-54);ctx.bezierCurveTo(-93,-58,-105,-20,-85,-2);ctx.bezierCurveTo(-100,25,-70,58,-47,48);ctx.bezierCurveTo(-43,79,-10,85,2,59);ctx.bezierCurveTo(21,86,54,64,54,46);ctx.bezierCurveTo(88,55,104,22,83,0);ctx.bezierCurveTo(109,-20,85,-57,59,-54);ctx.bezierCurveTo(52,-86,20,-91,0,-67);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#784d7e';ctx.lineWidth=3;for(const side of [-1,1])for(let j=0;j<5;j++){const y=-56+j*25;ctx.beginPath();ctx.moveTo(side*9,y);ctx.bezierCurveTo(side*58,y-15,side*20,y+28,side*(63-(j%2)*10),y+12);ctx.stroke();}
  line(0,-63,0,60,'#734265',3);line(-2,-57,-2,51,'#ffdae067',1);circle(-35,4,10,'#fbdeb4');circle(35,4,10,'#fbdeb4');circle(-35,4,4,'#704a78');circle(35,4,4,'#704a78');
  for(let i=0;i<5;i++){const x=(i-2)*22;line(x,69,x+Math.sin(t*2+i)*16,101+i%2*15,'#f1b9cf',3);}ctx.restore();
 }
 for(const o of w.obstacles){
  if(o.kind==='bird'){ctx.save();ctx.translate(o.x,o.y);ctx.strokeStyle='#15374e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-25,-Math.sin(t*10+o.seed)*13);ctx.quadraticCurveTo(-12,-10,0,2);ctx.quadraticCurveTo(12,-10,25,-Math.sin(t*10+o.seed)*13);ctx.stroke();circle(0,2,4,'#254a5f');ctx.restore();}
  else if(o.kind==='storm'){cloud(o.x,o.y,.55,.95);line(o.x-5,o.y-9,o.x-12,o.y+14,'#ffe4a1',3);line(o.x-12,o.y+14,o.x+5,o.y+7,'#ffe4a1',3);line(o.x+5,o.y+7,o.x-6,o.y+31,'#ffe4a1',3);}
  else{ctx.save();ctx.translate(o.x,o.y);ctx.rotate(t+o.seed);panel(-21,-15,42,30,'#4a6476','#a3b7bb');line(-17,-10,17,10,'#d4ac6e',4);line(17,-10,-17,10,'#1c394e',3);ctx.restore();}
 }
 for(const e of w.enemies){
  if(e.kind==='neutron'){glow(e.x,e.y,25,'#ffd36588');circle(e.x,e.y,7,'#ffedb0');for(let i=0;i<3;i++){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(i*TAU/3+t*4);ctx.strokeStyle='#ffb968';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,15,5,0,0,TAU);ctx.stroke();ctx.restore();}}
  else{circle(e.x,e.y,7,'#88e6e5');circle(e.x,e.y,3,'#214d6d');for(let i=0;i<5;i++){const a=i*TAU/5+t;line(e.x+Math.cos(a)*6,e.y+Math.sin(a)*6,e.x+Math.cos(a)*15,e.y+Math.sin(a)*15,'#a0f0ed',1.7);}}
 }
 for(const a of w.warnings){ctx.save();ctx.setLineDash([8,9]);line(a.x,a.y,a.tx,a.ty,'#ffdc9588',2);ctx.setLineDash([]);circle(a.tx,a.ty,19,'#ffca5f25');ctx.strokeStyle='#ffdd99';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.tx,a.ty,24,0,TAU);ctx.stroke();text('НЕЙТРОН · УХИЛЯЙСЯ',a.tx-62,Math.max(157,a.ty-34),10,'#ffe5aa');ctx.restore();}
 if(p.hp>0){
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(clamp((p.y-350)/1200,-.12,.12));if(p.invuln>0)ctx.globalAlpha=.55+.3*Math.sin(t*20);
  glow(0,0,72,'#afdfed29');
  // Continuous interlocking paving-brick airframe, with swept wings and a tail.
  ctx.fillStyle='#8b9ba3';ctx.strokeStyle='#d8e6e1';ctx.lineWidth=1.5;ctx.beginPath();
  const silhouette=[[-63,-10],[-63,-27],[-48,-23],[-35,-10],[-18,-14],[-35,-57],[-18,-53],[14,-13],[43,-10],[56,0],[43,10],[14,13],[-18,53],[-35,57],[-18,14],[-35,10],[-48,23],[-63,27],[-63,10]];
  silhouette.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke();
  for(const [x,y,s,r] of [[-15,-25,34,-.18],[-27,-43,29,-.3],[-15,25,34,.18],[-27,43,29,.3],[-52,-19,25,-.28],[-52,19,25,.28],[-46,0,31,0],[-21,0,36,0],[6,0,38,0],[33,0,30,0]])brick(x,y,s,r);
  panel(-3,-13,23,17,'#63c7d0','#c7f7f2');line(2,-9,13,-9,'#e2ffff',2);circle(-48,0,4,'#eeb567');
  line(54,-22*Math.cos(t*45),54,22*Math.cos(t*45),'#d8e9dfcc',2);circle(52,0,3,'#f8e9ba');ctx.restore();
 }
 for(const a of w.bullets)brick(a.x,a.y,21,t*2);
 for(const a of w.particles){ctx.globalAlpha=a.life/.65;circle(a.x,a.y,2.5,a.color);}ctx.globalAlpha=1;
 panel(20,20,960,94);text('10 / ФІНАЛ · МОЗОК НАД ХМАРАМИ',38,49,18,'#e6f3f2',700);text('БРУКОЛІТ',38,75,10,'#a6c6d6');for(let i=0;i<3;i++){ctx.fillStyle=i<p.hp?'#b9e8d7':'#385469';ctx.beginPath();ctx.roundRect(118+i*27,61,20,15,4);ctx.fill();}text('HP '+p.hp+' / 3',213,75,12,'#d1e6e7');
 text('МОЗОК · ФАЗА '+w.bossPhase+' / 3',557,49,11,'#f2c8d8');ctx.fillStyle='#433c60';ctx.fillRect(557,62,380,13);ctx.fillStyle='#edb0c9';ctx.fillRect(557,62,380*b.hp/b.maxHp,13);text(Math.ceil(b.hp)+' / '+b.maxHp,557,94,11,'#e4c7d9');
 panel(20,650,960,33,'#102a40e8','#b3cdd75a');text('WASD / СТРІЛКИ · рух     ПРОБІЛ · бруківка     R · нова спроба',34,671,11,'#d1e7e7');text('ПОРАЗКА: −85% БАЛАНСУ',739,671,11,'#ffe1b2',700);
 if(w.phase==='intro'){
  panel(228,242,544,196,'#0a2037f5','#d0dccca0');text('БІЙ НАД ХМАРАМИ',259,281,27,'#f8e7c8',700);text('3 HP · нейрон, птах або перешкода забирають 1 HP.',259,314,13);text('Рідкісний золотий НЕЙТРОН знищує літак одразу.',259,340,13,'#ffdc9c');text('За поразку: штраф 85% поточного додатного балансу.',259,366,12,'#ffe0b1');text('ПРОБІЛ / ENTER або натисни на поле — почати',259,408,14,'#c6eddd',700);
 }else if(w.phase==='lost'||w.won){
  panel(250,249,500,163,'#0a2037f5',w.won?'#a8e6ca':'#e4a49b');text(w.won?'МОЗОК ПЕРЕМОЖЕНО':'ЛІТАК ЗНИЩЕНО',279,290,27,w.won?'#d8f1b7':'#ffd0b4',700);text(w.won?'Нейросферу звільнено. Кампанію завершено.':'Штраф −'+w.lossCharged.toLocaleString('uk-UA')+' UAH (85%).',279,326,14,'#e6d5c1');text(w.won?'Нагороду зараховано · відкриті етапи доступні знову':'R або «Спочатку» — повторити бій із 3 HP',279,376,12,'#a9d4d9');
 }
}
const api={World,draw,penaltyForBalance,segmentHit};if(typeof module==='object'&&module.exports)module.exports=api;else root.BrukSkyBoss=api;
})(typeof window==='undefined'?globalThis:window);
