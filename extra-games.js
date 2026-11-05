(function(root){
  'use strict';
  if(typeof window!=='undefined'&&window.BrukDevice?.blocked)return;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class StackWorld{
    constructor(){this.blocks=[{x:180,y:590,w:540}];this.current={x:0,y:562,w:540};this.direction=1;this.score=0;this.streak=0;this.phase='running';this.pieces=[];}
    get top(){return this.blocks.at(-1);}
    step(dt){if(this.phase==='running'){this.current.x+=this.direction*(125+Math.min(230,this.score*9))*dt;if(this.current.x<0){this.current.x=0;this.direction=1;}if(this.current.x+this.current.w>900){this.current.x=900-this.current.w;this.direction=-1;}}
      this.pieces=this.pieces.filter(p=>{p.vy+=800*dt;p.y+=p.vy*dt;p.x+=p.vx*dt;p.age+=dt;return p.age<2;});}
    place(){
      if(this.phase!=='running')return 'ignored';const top=this.top,c=this.current;let left=Math.max(top.x,c.x),right=Math.min(top.x+top.w,c.x+c.w);
      if(right-left<3){this.phase='over';this.pieces.push({...c,vy:0,vx:this.direction*40,age:0});return 'miss';}
      const perfect=Math.abs(c.x-top.x)<8;if(perfect){left=top.x;right=top.x+top.w;this.streak++;}else this.streak=0;
      if(c.x<left)this.pieces.push({x:c.x,y:c.y,w:left-c.x,vy:0,vx:-45,age:0});if(c.x+c.w>right)this.pieces.push({x:right,y:c.y,w:c.x+c.w-right,vy:0,vx:45,age:0});
      let width=right-left;if(this.streak&&this.streak%3===0){const bonus=Math.min(14,540-width);left=clamp(left-bonus/2,0,900-width-bonus);width+=bonus;}
      this.blocks.push({x:left,y:c.y,w:width});this.score++;if(this.blocks.length>40)this.blocks.shift();this.direction*=-1;this.current={x:this.direction===1?0:900-width,y:c.y-28,w:width};return perfect?'perfect':'stacked';
    }
  }
  class RallyWorld{
    constructor(rating=1.4){this.rating=clamp(rating,1,5);this.lane=1;this.visualLane=1;this.distance=0;this.points=0;this.health=3;this.energy=1;this.boost=false;this.boostLocked=false;this.invincible=0;this.obstacles=[];this.next=0;this.phase='running';}
    move(direction){this.lane=clamp(this.lane+direction,0,2);}
    get speed(){return (190+this.rating*16+Math.min(150,this.distance/30))*(this.boost&&!this.boostLocked&&this.energy>0?1.65:1);}
    get score(){return Math.floor(this.distance/12)+this.points;}
    step(dt,random=Math.random){
      if(this.phase!=='running')return;const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
      for(let i=0;i<steps&&this.phase==='running';i++){
        this.invincible=Math.max(0,this.invincible-h);this.visualLane+=(this.lane-this.visualLane)*Math.min(1,h*15);this.distance+=this.speed*h;
        if(!this.boost)this.boostLocked=false;const boosting=this.boost&&!this.boostLocked&&this.energy>0;this.energy=clamp(this.energy+(boosting?-.32:.11)*h,0,1);if(this.energy===0)this.boostLocked=true;this.next-=h;
        if(this.next<=0){const lane=Math.min(2,Math.floor(random()*3));this.obstacles.push({lane,y:-100,type:random()<.25?'bonus':'traffic'});if(random()<.25)this.obstacles.push({lane:(lane+1)%3,y:-160,type:'cone'});this.next=.95+random()*.4;}
        for(const o of this.obstacles){o.y+=this.speed*h;if(!o.hit&&Math.abs(o.lane-this.visualLane)<.52&&o.y>465&&o.y<590){o.hit=true;if(o.type==='bonus')this.points+=50;else if(this.invincible<=0){this.health--;this.invincible=1.2;if(!this.health)this.phase='over';}}}
        this.obstacles=this.obstacles.filter(o=>o.y<760&&!o.hit);
      }
    }
  }
  const api={StackWorld,RallyWorld};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(!root.document)return;
  const $=id=>document.getElementById(id),game=document.body.dataset.game,canvas=$('extraCanvas'),ctx=canvas.getContext('2d');
  let intro=true,paused=false,world,record=0,previous=null,touch=null,feedback='',feedbackTime=0,car,style;
  const KEY=game==='rally'?'brukivka_rally_best_v1':'brukivka_stack_best_v1';
  try{record=Number(JSON.parse(localStorage.getItem(KEY)))||0;if(!Number.isSafeInteger(record)||record<0)record=0;}catch{}
  if(game==='rally'){
    const V=root.BrukVentures;let snapshot;try{snapshot=root.parent!==root?root.parent.BrukGarageSnapshot?.():null;}catch{}
    const garage=V.normalizeGarage(snapshot);car=V.CARS.find(c=>c.id===garage.active)||{id:'training',name:'Навчальний хетчбек',shape:'hatch',rating:1.4,color:'#8ebba9'};style=garage.custom[car.id]||V.defaultStyle(car);$('carName').textContent=car.name;
  }
  function fresh(){world=game==='rally'?new RallyWorld(car.rating+style.engine*.25):new StackWorld();intro=false;paused=false;previous=null;feedback='';$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Пауза';canvas.focus({preventScroll:true});}
  function overlay(title,text,action){$('message').textContent=title;$('description').textContent=text;$('start').textContent=action;$('overlay').hidden=false;}
  function pause(){if(intro||world.phase!=='running')return;paused=!paused;$('pause').textContent=paused?'Продовжити':'Пауза';if(game==='rally')world.boost=false;if(paused)overlay('Пауза','Гра чекає на тебе.','Продовжити →');else{$('overlay').hidden=true;previous=null;}}
  function action(){if(intro){fresh();return;}if(paused){pause();return;}if(world.phase!=='running')return;if(game==='stack'){const r=world.place();feedback=r==='perfect'?'ІДЕАЛЬНО!':r==='stacked'?'+1 ПОВЕРХ':'ПРОМАХ';feedbackTime=1.1;if(world.phase==='over')finish();}}
  function finish(){const score=game==='rally'?world.score:world.score;if(score>record){record=score;try{localStorage.setItem(KEY,JSON.stringify(record));}catch{$('storageNote').textContent='Рекорд не вдалося зберегти у браузері.';}}
    $('pause').disabled=true;overlay(game==='rally'?'Заїзд завершено':'Вежу завершено',game==='rally'?`Очки: ${score}. Авто: ${car.name}.`:`Побудовано поверхів: ${score}. Рекорд: ${record}.`,'Зіграти знову →');}
  $('start').addEventListener('click',()=>paused?pause():fresh());$('pause').addEventListener('click',pause);
  if(game==='rally'){
    $('left').addEventListener('click',()=>{if(!intro&&!paused)world.move(-1);});$('right').addEventListener('click',()=>{if(!intro&&!paused)world.move(1);});
    $('action').addEventListener('pointerdown',e=>{if(intro||paused)return;world.boost=true;$('action').setPointerCapture(e.pointerId);e.preventDefault();});for(const name of ['pointerup','pointercancel','lostpointercapture'])$('action').addEventListener(name,()=>{if(world)world.boost=false;});
  }else $('action').addEventListener('click',action);
  canvas.addEventListener('pointerdown',e=>{touch={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);if(game==='stack')action();e.preventDefault();});
  canvas.addEventListener('pointerup',e=>{if(!touch)return;if(game==='rally'&&!intro&&!paused){const dx=e.clientX-touch.x;if(Math.abs(dx)>20)world.move(Math.sign(dx));else{const r=canvas.getBoundingClientRect();world.lane=clamp(Math.floor((e.clientX-r.left)/r.width*3),0,2);}}touch=null;});canvas.addEventListener('pointercancel',()=>touch=null);
  document.addEventListener('keydown',e=>{
    if(e.target.closest('input,button,a'))return;if(e.code==='KeyP'&&!e.repeat){pause();return;}
    if(game==='rally'&&!intro&&!paused&&['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){e.preventDefault();if(!e.repeat)world.move(['ArrowLeft','KeyA'].includes(e.code)?-1:1);}
    if(e.code==='Space'){e.preventDefault();if(game==='stack'){if(!e.repeat)action();}else if(intro)fresh();else if(paused)pause();else world.boost=true;}
  });document.addEventListener('keyup',e=>{if(game==='rally'&&world&&e.code==='Space')world.boost=false;});
  root.addEventListener('blur',()=>{if(!paused)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused)pause();});
  function brick(x,y,w,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,25);ctx.fillStyle='#ffffff30';ctx.fillRect(x,y,w,4);ctx.fillStyle='#0003';ctx.fillRect(x,y+20,w,5);ctx.strokeStyle='#33434c66';for(let px=x+40;px<x+w;px+=55){ctx.beginPath();ctx.moveTo(px,y+4);ctx.lineTo(px,y+20);ctx.stroke();}}
  function drawStack(){
    ctx.fillStyle='#142b39';ctx.fillRect(0,0,900,650);ctx.fillStyle='#29454b';for(let i=0;i<8;i++)ctx.fillRect(i*135-20,430-i*43%150,100,220);
    const camera=Math.max(0,360-world.current.y);ctx.save();ctx.translate(0,camera);const colors=['#bd9a72','#90b4a5','#879fb9','#c1ac79'];world.blocks.forEach((b,i)=>brick(b.x,b.y,b.w,colors[i%4]));
    if(world.phase==='running')brick(world.current.x,world.current.y,world.current.w,'#d2e9a3');world.pieces.forEach(p=>brick(p.x,p.y,p.w,'#ae8b67'));ctx.restore();
    $('width').textContent=Math.round(world.top.w);$('streak').textContent=world.streak;
    if(feedbackTime>0){ctx.fillStyle='#d9f2af';ctx.font='800 28px system-ui';ctx.textAlign='center';ctx.fillText(feedback,450,88);ctx.textAlign='left';}
  }
  function topCar(x,y,color,player=false){
    ctx.save();ctx.translate(x,y);if(player&&style.neon){ctx.shadowColor='#66dce0';ctx.shadowBlur=18;}ctx.fillStyle='#111d26';for(const side of [-1,1]){ctx.fillRect(side*36-5,-40,10,24);ctx.fillRect(side*36-5,28,10,24);}ctx.fillStyle=color;ctx.fillRect(-33,-60,66,125);ctx.shadowBlur=0;ctx.fillStyle='#213d4c';ctx.fillRect(-25,-31,50,26);ctx.fillRect(-25,30,50,19);ctx.fillStyle='#eddfab';ctx.fillRect(-26,-58,13,7);ctx.fillRect(13,-58,13,7);
    if(player&&style.wrap){ctx.fillStyle='#e7e1c6';ctx.fillRect(-5,-57,10,116);}if(player&&style.spoiler){ctx.fillStyle='#17282e';ctx.fillRect(-40,51,80,7);}if(player&&style.rims===2){ctx.fillStyle='#e2bb74';ctx.fillRect(-39,-31,4,9);ctx.fillRect(35,-31,4,9);ctx.fillRect(-39,36,4,9);ctx.fillRect(35,36,4,9);}ctx.restore();
  }
  function drawRally(){
    ctx.fillStyle='#28443f';ctx.fillRect(0,0,900,650);ctx.fillStyle='#1b2c37';ctx.fillRect(128,0,644,650);ctx.fillStyle='#a5ba9f';ctx.fillRect(128,0,5,650);ctx.fillRect(767,0,5,650);ctx.strokeStyle='#c1ceb755';ctx.lineWidth=4;ctx.setLineDash([35,35]);ctx.lineDashOffset=-world.distance%70;for(const x of [343,557]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,650);ctx.stroke();}ctx.setLineDash([]);
    for(const o of world.obstacles){const x=236+o.lane*214;if(o.type==='traffic')topCar(x,o.y,'#aa6d66');else if(o.type==='cone'){ctx.fillStyle='#d6a46d';ctx.beginPath();ctx.moveTo(x,o.y-30);ctx.lineTo(x-28,o.y+28);ctx.lineTo(x+28,o.y+28);ctx.closePath();ctx.fill();}else{ctx.fillStyle='#cce9a1';ctx.beginPath();ctx.arc(x,o.y,18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#2a483b';ctx.font='800 20px system-ui';ctx.fillText('+',x-6,o.y+7);}}
    ctx.globalAlpha=world.invincible>0?.55+.3*Math.sin(world.invincible*25):1;topCar(236+world.visualLane*214,525,style.color,true);ctx.globalAlpha=1;
    $('health').textContent='♥'.repeat(Math.max(0,world.health));$('energy').textContent=Math.round(world.energy*100)+'%';$('action').classList.toggle('boosting',world.boost&&!world.boostLocked&&world.energy>0);
  }
  function frame(time){const dt=previous===null?0:Math.min(.04,(time-previous)/1000);previous=time;
    if(!intro&&!paused){const phase=world.phase;world.step(dt);feedbackTime=Math.max(0,feedbackTime-dt);if(phase==='running'&&world.phase==='over')finish();}
    if(world){game==='rally'?drawRally():drawStack();$('score').textContent=world.score;}$('record').textContent=record;requestAnimationFrame(frame);
  }
  world=game==='rally'?new RallyWorld(car.rating):new StackWorld();requestAnimationFrame(frame);
})(typeof window==='undefined'?globalThis:window);
