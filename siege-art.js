(function(root){
'use strict';
const TAU=Math.PI*2;
function draw(ctx,w,{canvas,pull={x:-75,y:28},aim=false}={}){
 const c=w.layout.accent,t=w.time,view=canvas||ctx.canvas;
 ctx.setTransform(view.width/1000,0,0,view.height/700,0,0);
 ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.lineCap='round';ctx.lineJoin='round';ctx.textAlign='left';
 const text=(s,x,y,size=12,color='#c5dce5',weight=600)=>{ctx.fillStyle=color;ctx.font=`${Math.round(weight/100)*100} ${size}px "Noto Sans", Arial, sans-serif`;ctx.fillText(s,x,y);};
 const line=(x,y,a,b,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();};
 const circle=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();};
 const panel=(x,y,width,height,fill='#0a1d2bea',stroke='#53788766',radius=10)=>{ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,width,height,radius);ctx.fill();ctx.stroke();};
 const glow=(x,y,r,color)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#05141e00');circle(x,y,r,g);};
 function background(){
  const g=ctx.createLinearGradient(0,0,0,700);g.addColorStop(0,'#07131f');g.addColorStop(.55,'#12323d');g.addColorStop(1,'#23515a');ctx.fillStyle=g;ctx.fillRect(0,0,1000,700);
  glow(770,265,360,w.layoutIndex===1?'#57407835':'#257b7829');
  for(let i=0;i<53;i++){const x=(i*137.39+24)%1000,y=120+(i*73.71)%295;circle(x,y,i%7===0?1.3:.6,'#b1e7f84f');}
  // A distant observatory dome and suspended research arrays.
  ctx.strokeStyle='#7cb7b51a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(774,520,275,Math.PI,TAU);ctx.stroke();
  for(const r of [170,223]){ctx.beginPath();ctx.ellipse(774,520,r,275,0,Math.PI,TAU);ctx.stroke();}
  line(500,520,1000,520,'#7cb7b51a');
  for(let i=0;i<18;i++){const x=i*66-11,h=66+(i*47)%135;ctx.fillStyle=i%2?'#102c36':'#0e2833';ctx.fillRect(x,640-h,46,h);for(let row=0;row<h/15-1;row++)for(let col=0;col<3;col++)if((i+col+row)%3===0){ctx.fillStyle='#6ac8c126';ctx.fillRect(x+8+col*12,649-h+row*15,4,7);}}
  for(const [x,h] of [[365,200],[610,260],[947,246]]){ctx.fillStyle='#142e3c';ctx.fillRect(x,640-h,13,h);line(x+6,640-h,x+6,625-h,'#669aa6',1);circle(x+6,624-h,2,c);line(x-12,651-h,x+25,651-h,'#446573');}
  // Ghost synapses in the atmosphere: decorative, lower contrast than live links.
  for(let i=0;i<9;i++){const x=348+i*79,y=258+Math.sin(i*2.4)*55;circle(x,y,2,'#7db9c026');if(i){const px=348+(i-1)*79,py=258+Math.sin((i-1)*2.4)*55;line(px,py,x,y,'#6eb4bd16');}}
  const floor=ctx.createLinearGradient(0,640,0,700);floor.addColorStop(0,'#203c45');floor.addColorStop(1,'#0a1924');ctx.fillStyle=floor;ctx.fillRect(0,640,1000,60);line(0,641,1000,641,'#78b2aa',2);
  for(let row=0;row<3;row++){const y=650+row*20;for(let i=0;i<21;i++){const x=i*53-(row%2)*26;ctx.fillStyle=(row+i)%3===0?'#1a303b':'#203a43';ctx.fillRect(x+2,y+2,48,15);line(x+3,y+2,x+48,y+2,'#61858b27');}}
  // The fortress foundation has hazard inlays and numbered docking points.
  ctx.fillStyle='#1b303a';ctx.fillRect(408,642,559,8);for(let i=0;i<24;i++){ctx.fillStyle=i%2?'#b4a37455':'#081a27';ctx.fillRect(412+i*23,644,14,3);}
  text('СЕКТОР 05 / НЕЙРОСФЕРА',680,685,10,'#819ba4',500);
  for(let i=0;i<6;i++){const x=360+i*111;line(x,636,x+9,636,'#63f2d48c',2);circle(x+11,636,1,'#effffb');}
 }
 function block(b){
  const x=b.x-b.w/2,y=b.y-b.h/2;ctx.save();ctx.translate(x,y);
  const g=ctx.createLinearGradient(0,0,b.w,b.h);
  const colors={wood:['#cdab71','#806342'],glass:['#b7eeee88','#235e7399'],stone:['#8496aa','#3b4f64']};
  g.addColorStop(0,colors[b.material][0]);g.addColorStop(1,colors[b.material][1]);ctx.fillStyle=g;ctx.fillRect(0,0,b.w,b.h);
  ctx.strokeStyle=b.material==='glass'?'#b6fbef':'#0b192b';ctx.lineWidth=1.1;ctx.strokeRect(.5,.5,b.w-1,b.h-1);line(2,2,b.w-3,2,'#ffffff65');line(2,2,2,b.h-3,'#ffffff35');
  if(b.material==='wood'){
   const tall=b.h>b.w;
   for(let i=1;i<4;i++){if(tall)line(3+i*3,8,2+i*3,b.h-8,'#5a3c324d');else line(8,2+i*2,b.w-9,3+i*2,'#5a3c324d');}
   for(const [rx,ry] of [[4,5],[b.w-5,b.h-6]]){circle(rx,ry,1.6,'#3b4146');circle(rx-.4,ry-.5,.5,'#e5dbb8');}
  }else if(b.material==='glass'){
   ctx.save();ctx.beginPath();ctx.rect(2,2,b.w-4,b.h-4);ctx.clip();line(b.w*.18,b.h,b.w*.7,0,'#e5ffff60',3);line(b.w*.48,b.h,b.w,0,'#edffff25',2);ctx.restore();
   line(3,4,b.w-4,4,'#d3fff0a0');
  }else{
   if(b.w>b.h){for(let x=22;x<b.w;x+=23)line(x,2,x,b.h-2,'#24384d',1);}else{for(let y=18;y<b.h;y+=21)line(2,y,b.w-2,y,'#24384d',1);}
   for(const [rx,ry] of [[4,5],[b.w-5,b.h-6]]){circle(rx,ry,2,'#25384d');line(rx-1,ry-1,rx+1,ry-1,'#9bb2c4');}
  }
  const max=b.maxHp;if(b.hp<max*.7){const p=b.hp<max*.3?2:1;ctx.strokeStyle='#0b1b28';ctx.lineWidth=p;ctx.beginPath();ctx.moveTo(b.w*.2,2);ctx.lineTo(b.w*.55,b.h*.4);ctx.lineTo(b.w*.3,b.h*.6);ctx.lineTo(b.w*.8,b.h-1);ctx.stroke();}
  ctx.restore();
 }
 function neuron(b){
  ctx.save();ctx.translate(b.x,b.y);const core=!!b.core,color=core?'#ffcf80':b.id%2?'#b9a4f4':'#64dbdd';
  if(core){glow(0,0,49,'#fdcf654b');ctx.strokeStyle='#ffdfa477';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(0,0,28,0,TAU);ctx.stroke();for(let j=0;j<3;j++){const a=t*.6+j*TAU/3;circle(Math.cos(a)*28,Math.sin(a)*28,2,'#fff2c1');}}
  ctx.rotate((b.id%5-2)*.22);ctx.strokeStyle=color;ctx.lineWidth=1.3;
  for(let i=0;i<7;i++){const a=.8+i*.76,u=Math.cos(a),v=Math.sin(a);ctx.beginPath();ctx.moveTo(u*5,v*5);ctx.quadraticCurveTo(u*12+v*2,v*12-u*2,u*20,v*20);ctx.moveTo(u*14,v*14);ctx.lineTo(u*21-v*5,v*21+u*5);ctx.moveTo(u*20,v*20);ctx.lineTo(u*23+v*4,v*23-u*4);ctx.stroke();}
  const body=ctx.createRadialGradient(-3,-4,1,0,0,13);body.addColorStop(0,core?'#ffe8ac':'#c6f2ef');body.addColorStop(1,core?'#b77c45':b.id%2?'#7766b9':'#308fa8');ctx.fillStyle=body;ctx.beginPath();
  for(let j=0;j<16;j++){const a=j*Math.PI/8,r=j%2?6:11;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();circle(-1,-1,4.6,core?'#603b63':'#25364f');circle(-2,-2,1.6,core?'#ffdbb7':'#81c4d8');
  ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(8,0);ctx.bezierCurveTo(16,10,23,3,35,-4);ctx.stroke();
  for(let j=0;j<3;j++){ctx.fillStyle=core?'#ffdda7':'#cee4e2';ctx.strokeStyle=core?'#cba96c':'#6fa6b9';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(15+j*7,3-j*2,4.5,2.1,-.3,0,TAU);ctx.fill();ctx.stroke();}
  ctx.strokeStyle=color;ctx.lineWidth=1.1;for(const d of [-10,0,10]){ctx.beginPath();ctx.moveTo(34,-4);ctx.quadraticCurveTo(37,d-5,43,d-4);ctx.lineTo(46,d-7);ctx.moveTo(41,d-4);ctx.lineTo(46,d);ctx.stroke();}
  ctx.restore();
 }
 function links(){
  const nodes=new Map(w.bodies.filter(b=>!b.dead).map(b=>[b.id,b]));for(const core of w.cores)nodes.set(core.id,core);
  for(const [i,e] of w.links.entries()){const a=nodes.get(e.from),b=nodes.get(e.to);if(!a||!b||(!w.overload&&(a.dead||b.dead)))continue;
   const bend=Math.min(24,Math.abs(a.x-b.x)*.15+6),mx=(a.x+b.x)/2,my=(a.y+b.y)/2-bend;
   ctx.strokeStyle=w.overload?'#ffcd8fc0':e.hub?'#f7d09699':'#64dcd566';ctx.lineWidth=w.overload?2:e.hub?1.5:1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();
   const p=(t*(w.overload?1.9:.36)+i*.13)%1,q=1-p;const x=q*q*a.x+2*q*p*mx+p*p*b.x,y=q*q*a.y+2*q*p*my+p*p*b.y;
   circle(x,y,w.overload?3:1.8,w.overload?'#fff1c9':'#b0ffee');
  }
 }
 function brick(x,y,size,angle,id){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#06121a77';ctx.beginPath();ctx.ellipse(3,size*.4,size*.52,5,0,0,TAU);ctx.fill();
  if(root.BrukBrick?.draw){root.BrukBrick.draw(ctx,0,0,size,size,0);}else{ctx.fillStyle='#adb2b6';ctx.fillRect(-size/2,-size/2,size,size);}
  if(id!=='standard'){ctx.strokeStyle={heavy:'#899da9',drill:'#8feff5',blast:'#ffb65d'}[id];ctx.lineWidth=id==='heavy'?4:2;ctx.strokeRect(-size*.42,-size*.4,size*.84,size*.8);if(id==='drill'){ctx.fillStyle='#c4f8fa';ctx.beginPath();ctx.moveTo(size*.8,0);ctx.lineTo(size*.35,-7);ctx.lineTo(size*.35,7);ctx.closePath();ctx.fill();}if(id==='blast'){ctx.fillStyle='#e55b4e';ctx.fillRect(-5,-size*.42,10,size*.84);line(0,-size*.4,5,-size*.68,'#f5bd71',2);circle(5,-size*.68,2,'#fff4b7');}}
  ctx.restore();
 }
 function sling(){
  ctx.fillStyle='#0a1728';ctx.beginPath();ctx.ellipse(140,638,47,9,0,0,TAU);ctx.fill();panel(106,619,68,20,'#253e49','#6d8b91',4);
  const shaft=ctx.createLinearGradient(126,0,153,0);shaft.addColorStop(0,'#4f3d32');shaft.addColorStop(.45,'#bc9061');shaft.addColorStop(1,'#665240');
  ctx.strokeStyle=shaft;ctx.lineWidth=17;ctx.beginPath();ctx.moveTo(140,620);ctx.lineTo(140,550);ctx.moveTo(115,500);ctx.lineTo(140,550);ctx.lineTo(164,500);ctx.stroke();line(138,561,138,609,'#e5bd8070',3);
  for(let i=0;i<4;i++)line(133,574+i*6,147,571+i*6,'#6a9d9e',2);circle(140,620,4,'#bed1c4');circle(140,620,2,'#324951');
  for(const x of [115,164]){panel(x-7,492,14,21,'#304756','#8fa5a7',3);circle(x,499,2,'#e3d5b5');}
  if(w.phase==='ready'){
   const p=aim?{x:140+pull.x,y:520+pull.y}:{x:140,y:520};
   ctx.strokeStyle='#311f20';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(115,503);ctx.lineTo(p.x,p.y);ctx.lineTo(164,503);ctx.stroke();ctx.strokeStyle='#ceac85';ctx.lineWidth=2;ctx.stroke();
   if(aim){for(let dt=.08;dt<2.1;dt+=.075){const x=p.x-pull.x*9.2*w.force*w.ammo.speed*dt,y=p.y-pull.y*9.2*w.force*w.ammo.speed*dt+255*dt*dt;if(y>640||x>1000||x<0)break;if(y-w.ammo.size/2<=w.ceiling){circle(x,y,5,'#f7ab73');break;}circle(x,y,dt<.5?2.5:1.7,dt<.7?'#e7fff4b0':'#a6dedf70');}
    const power=Math.min(1,Math.hypot(pull.x,pull.y)/105);panel(64,569,36,7,'#0c202c','#425d66',3);ctx.fillStyle=c;ctx.fillRect(66,571,32*power,3);text(Math.round(power*100)+'%',62,563,11,c);
   }
   brick(p.x,p.y,w.ammo.size,0,w.upgrades.ammo);
  }
  for(let i=0;i<Math.min(5,w.shots-1);i++)brick(34+i*20,618,15,0,w.upgrades.ammo);if(w.shots>6)text('+'+(w.shots-6),32,590,11,c);
 }
 function effects(){
  for(let i=1;i<w.trail.length;i++){const a=w.trail[i-1],b=w.trail[i];line(a.x,a.y,b.x,b.y,'#d4f8ed'+Math.round(i/w.trail.length*110).toString(16).padStart(2,'0'),i/w.trail.length*3);}
  for(const e of w.pulses){const duration=e.mega?1.7:.45,ratio=e.age/duration;ctx.globalAlpha=(1-ratio)*.7;ctx.strokeStyle=e.mega?'#ffe0a0':c;ctx.lineWidth=e.mega?3:1.4;ctx.beginPath();ctx.arc(e.x,e.y,5+ratio*(e.mega?390:35),0,TAU);ctx.stroke();ctx.globalAlpha=1;}
  for(const e of w.explosions){const p=e.age/.5;glow(e.x,e.y,35+p*125,'#ffac5060');ctx.globalAlpha=1-p;circle(e.x,e.y,8+p*54,'#ffe1a1');for(let i=0;i<12;i++){const a=i*TAU/12;line(e.x+Math.cos(a)*25*p,e.y+Math.sin(a)*25*p,e.x+Math.cos(a)*120*p,e.y+Math.sin(a)*120*p,'#ffb264',2);}ctx.globalAlpha=1;}
  for(const e of w.sparks){ctx.globalAlpha=1-e.age/.5;for(let i=0;i<6;i++){const a=i*TAU/6;line(e.x,e.y,e.x+Math.cos(a)*(12+e.age*50),e.y+Math.sin(a)*(12+e.age*50),'#fff3ca',1.4);}ctx.globalAlpha=1;}
  for(const f of w.fragments){ctx.globalAlpha=Math.max(0,f.life/1.2);ctx.fillStyle={wood:'#bd9465',glass:'#a8f6f2',stone:'#8a9bae'}[f.material];ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.life*5);ctx.fillRect(-3,-2,6,4);ctx.restore();}ctx.globalAlpha=1;
 }
 function hud(){
  panel(20,20,960,94,'#091b28ee','#63808c66',12);panel(34,34,46,64,'#163442','#4f958d80',6);text('05',40,65,25,c,700);text('ROUTE',39,85,8,'#8fb2bc');
  text('НЕЙРОСФЕРА',97,55,26,'#edf8f4',700);text(w.layout.number+' / '+w.layout.name,98,79,13,c,500);text('ОБЛОГА НЕЙРОНІВ',98,97,8,'#7898a7',500);
  line(536,38,536,94,'#49627266');text('КЛІТИНИ',557,49,9,'#8daab7');text(String(w.remaining).padStart(2,'0'),555,82,28,'#f1faf7',650);text('/ '+w.total,601,80,13,'#789eab');
  text('БРУКІВКА',683,49,9,'#8daab7');text(w.shots+' / '+w.maxShots,683,80,24,c,700);
  panel(827,36,136,62,'#183b3d','#69c4ae70',6);text('НАГОРОДА',844,55,9,'#a6c8bd');text('×250',842,84,27,'#d8efaf',700);
  panel(24,136,284,90,'#0b202acc','#659ba36b',8);circle(42,154,3,w.overload?'#ffd69b':c);text('МЕГА НЕЙРОННА ЗВ’ЯЗКА',53,158,11,'#d7f3e8',700);
  const live=w.cores.filter(n=>!n.dead),ratio=w.cores.reduce((sum,n)=>sum+(n.dead?0:Math.max(0,n.hp)),0)/w.coreMax;
  text('ЯДРА '+live.length+' / '+w.cores.length+' · ЕТАП '+w.layout.number+' / 10',38,181,11,'#ffdda0');
  ctx.fillStyle='#243f49';ctx.fillRect(38,192,255,4);ctx.fillStyle=c;ctx.fillRect(38,192,255*ratio,4);text(w.overload?'Кожне ядро керує своєю частиною':'Пробий бар’єри та зруйнуй усі ядра',38,213,10,'#86a7b2',500);
  for(const core of live){line(core.x,core.y-28,core.x,core.y-42,'#ffd69b99');panel(core.x-27,core.y-61,54,18,'#1c2c33ee','#d2aa6866',4);text('ЯДРО '+(core.cluster+1),core.x-21,core.y-49,8,'#ffdb9f',650);}
  panel(24,656,470,29,'#091d29e6','#45677355',5);text(w.ammo.name.toUpperCase(),36,675,10,'#e1ecea',650);text('НАТЯГ ×'+w.force.toFixed(2)+'   /   ПРОБИТТЯ ×'+w.pierce.toFixed(2),192,675,9,'#91b3bd',500);
  if(w.phase==='ready'&&!aim)text('ПОТЯГНИ БРУКІВКУ Й ВІДПУСТИ',35,456,10,'#afcacb',550);
  if(w.won||w.phase==='lost'){
   const won=w.won;panel(275,240,450,124,'#071722ef',won?'#82cfb2':'#ae7c6d',12);text(won?'МЕРЕЖУ ЗНИЩЕНО':'СПРОБУ ЗАВЕРШЕНО',304,284,25,won?'#d6f4bd':'#f0c4ad',700);text(won?'Нейросферу звільнено · нагороду зараховано':'Залишилося клітин: '+w.remaining,305,312,13,'#b5ccd2',500);text(won?'Далі — наступний етап':'R / «Спочатку» — повторити · Майстерня — покращення',305,340,11,'#82a6b0',500);
  }
 }
 function airDefense(){
  ctx.fillStyle='#ce634517';ctx.fillRect(0,115,1000,Math.max(0,w.ceiling-115));
  ctx.save();ctx.setLineDash([11,8]);line(0,w.ceiling,1000,w.ceiling,'#f4a56c',2);ctx.setLineDash([]);ctx.restore();
  panel(650,w.ceiling-23,326,20,'#2b2729eb','#e9a36e77',4);text('МЕЖА БПЛА · ДОТИК = ЗНИЩЕННЯ БРУКІВКИ',660,w.ceiling-9,9,'#ffd1a2');
 }
 function barrier(b){
  const x=b.x,y=b.y-b.h/2,h=b.h;ctx.save();const g=ctx.createLinearGradient(x-9,0,x+9,0);g.addColorStop(0,'#0e354b33');g.addColorStop(.5,'#a7e9ff8c');g.addColorStop(1,'#0e354b33');ctx.fillStyle=g;ctx.fillRect(x-9,y,18,h);line(x,y,x,y+h,'#98e4f3',2);
  for(let i=0;i<h/28;i++){const yy=y+i*28;line(x-6,yy,x+6,yy+13,'#a7eaff77',1);}
  panel(x-13,y+7,26,11,'#24495f','#9dc4cf',2);panel(x-13,628,26,11,'#24495f','#9dc4cf',2);
  const ratio=Math.max(0,b.hp/b.maxHp);ctx.fillStyle='#182d3b';ctx.fillRect(x-3,y+27,6,46);ctx.fillStyle='#9eeaf1';ctx.fillRect(x-2,y+28,4,44*ratio);text(Math.ceil(b.hp)+' HP',x-19,y+91,8,'#bcebf5');ctx.restore();
 }
 function interceptions(){
  for(const d of w.droneStrikes){const u=Math.min(1,d.age/.18),x=1040+(d.x-1040)*u,y=w.ceiling-35+(d.y-w.ceiling+35)*u;
   if(!d.burst)brick(d.x,d.y,d.size,0,d.ammo);ctx.save();ctx.translate(x,y);ctx.rotate(-.3);ctx.fillStyle='#28343e';ctx.beginPath();ctx.moveTo(-31,-6);ctx.lineTo(20,-10);ctx.lineTo(40,0);ctx.lineTo(20,8);ctx.lineTo(-31,5);ctx.closePath();ctx.fill();line(-5,-3,-16,-24,'#b2c6c8',5);line(-5,3,-16,24,'#b2c6c8',5);circle(25,0,2,'#ff9d71');ctx.restore();
  }
 }
 background();airDefense();links();
 for(const b of w.bodies)if(!b.dead&&b.kind==='block')block(b);
 // Connections remain visible in windows while cells draw over their own endpoints.
 for(const b of w.bodies)if(!b.dead&&b.kind==='neuron')neuron(b);
 for(const b of w.bodies)if(!b.dead&&b.kind==='barrier')barrier(b);sling();effects();interceptions();for(const b of w.bodies)if(!b.dead&&b.kind==='brick')brick(b.x,b.y,b.w,w.age*5,b.ammo);
 hud();
}
const api={draw};if(typeof module==='object'&&module.exports)module.exports=api;else root.BrukSiegeArt=api;
})(typeof window==='undefined'?globalThis:window);
