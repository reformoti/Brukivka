(function (root) {
  'use strict';
  const LEVELS = [
    {name:'Склад', multiplier:0.1, price:0, penalty:0, icon:'▰', hint:'Просто перенеси бруківку зі складу в карман. Без перешкод.'},
    {name:'Лазерні ворота', multiplier:1, price:2500, penalty:500, icon:'⌁', hint:'Знайомий маршрут: проведи бруківку між воротами й лазерами.'},
    {name:'Лабіринт', multiplier:3, price:35000, penalty:1500, icon:'▦', hint:'Знайди шлях від входу ліворуч до виходу праворуч. Стіна руйнує бруківку й повертає на старт: −1 500 UAH.'},
    {name:'У відкрите вікно', multiplier:10, price:250000, penalty:4500, icon:'↗', hint:'Потягни бруківку вниз і вліво та відпусти. Влуч у вікно зверху, на спаданні. Стіна чи БПЛА: −4 500 UAH. БПЛА повністю знищує бруківку.'}
    ,{name:'Облога нейронів',multiplier:250,price:228148867690450,penalty:0,icon:'◉',hint:'Натягни рогатку та запусти бруківку. Зруйнуй домики й усіх нейронів за 5 пострілів. R — нова спроба.'}
  ];
  const penaltyFor=level=>LEVELS[level]?.penalty||0;
  function restoreAccess(source={}){
    const legacy=source.deliveryOwned===undefined;
    const valid=id=>Number.isInteger(id)&&id>=0&&id<LEVELS.length;
    const owned=new Set([0,...(Array.isArray(source.deliveryOwned)?source.deliveryOwned.filter(valid):[])]);
    const selected=valid(source.deliveryLevel)?source.deliveryLevel:legacy?1:0;
    // Existing players keep the original laser route and the route last in use.
    if(legacy){owned.add(1);owned.add(selected);}
    return {owned:[...owned].sort((a,b)=>a-b),selected:owned.has(selected)?selected:0};
  }
  // Coordinates follow the supplied maze drawing; openings are on the left/right.
  const MAZE_LINES = [
    [0,0,10,0],[0,10,10,10],[0,0,0,4],[0,6,0,10],[10,0,10,4],[10,6,10,10],
    [4,0,4,2],[6,0,6,2],[6,2,8,2],[8,2,8,4],[2,2,2,4],[2,4,4,4],
    [4,4,4,6],[4,6,8,6],[6,4,6,8],[0,8,2,8],[2,6,2,8],[4,8,8,8],[8,8,8,10]
  ];
  const MAZE_RADIUS = .24, WALL_HALF = .085;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  function mazeBlocked(x,y) {
    if(x < .26 || x > 9.74 || y < .26 || y > 9.74) return true;
    return MAZE_LINES.some(([x1,y1,x2,y2]) => {
      const px=clamp(x,Math.min(x1,x2),Math.max(x1,x2));
      const py=clamp(y,Math.min(y1,y2),Math.max(y1,y2));
      return Math.hypot(x-px,y-py)<MAZE_RADIUS+WALL_HALF;
    });
  }
  function moveMaze(position,target) {
    let x=position.x,y=position.y;
    const steps=Math.max(1,Math.ceil(Math.hypot(target.x-x,target.y-y)/.055));
    const dx=(target.x-x)/steps,dy=(target.y-y)/steps;
    let blocked=false;
    for(let i=0;i<steps;i++) {
      if(mazeBlocked(x+dx,y+dy)){blocked=true;break;}
      x+=dx;y+=dy;
    }
    return {x,y,blocked,won:x>9.05&&y>4.35&&y<5.65};
  }
  class MazeWorld {
    constructor(onCollision=()=>{}){this.onCollision=onCollision;this.reset();}
    reset(){this.x=.65;this.y=5;this.phase='ready';this.remaining=0;this.effect=null;}
    move(target){
      if(this.phase!=='ready')return {x:this.x,y:this.y,blocked:false,won:false};
      const next=moveMaze(this,target);
      if(next.blocked){
        this.effect={x:next.x,y:next.y,age:0};this.x=.65;this.y=5;this.phase='broken';this.remaining=.65;this.onCollision('wall');
      }else{this.x=next.x;this.y=next.y;if(next.won)this.phase='success';}
      return next;
    }
    step(dt){if(this.effect){this.effect.age+=dt;if(this.effect.age>.65)this.effect=null;}if(this.phase==='broken'&&(this.remaining-=dt)<=0)this.phase='ready';}
  }
  const THROW = {
    width:1000,height:700,gravity:640,radius:18,anchor:{x:128,y:530},maxPull:155,
    floor:672,window:{left:862,right:972,plane:342},
    walls:[{x:378,y:466,w:26,h:206},{x:656,y:406,w:28,h:266}],
    zones:[{left:282,right:482,top:230,bottom:310,period:4.8},
      {left:574,right:770,top:164,bottom:246,period:6.2}]
  };
  function dronesAt(time) {
    return THROW.zones.map((z,i)=>{
      const phase=time/z.period*Math.PI*2+i*1.7;
      return {x:(z.left+z.right)/2+(z.right-z.left)/2*Math.sin(phase),
        y:(z.top+z.bottom)/2+(z.bottom-z.top)/2*Math.cos(phase),radius:17};
    });
  }
  function shotFromPull(pull) {
    let dx=clamp(pull.x,-THROW.anchor.x+THROW.radius,30);
    let dy=clamp(pull.y,-20,THROW.floor-THROW.radius-THROW.anchor.y-8);
    const length=Math.hypot(dx,dy);
    if(length>THROW.maxPull){dx*=THROW.maxPull/length;dy*=THROW.maxPull/length;}
    return {x:THROW.anchor.x+dx,y:THROW.anchor.y+dy,vx:-dx*9,vy:-dy*9,power:Math.hypot(dx,dy)/THROW.maxPull};
  }
  function catchesWindow(before,after) {
    const plane=THROW.window.plane-THROW.radius;
    if(after.vy<=0||before.y>plane||after.y<plane||after.y===before.y)return false;
    const t=(plane-before.y)/(after.y-before.y),x=before.x+(after.x-before.x)*t;
    return x>THROW.window.left+THROW.radius&&x<THROW.window.right-THROW.radius;
  }
  class FlightWorld {
    constructor(onCollision=()=>{}){this.time=0;this.onCollision=onCollision;this.reset();}
    reset(){this.ball={...THROW.anchor,vx:0,vy:0};this.phase='ready';this.elapsed=0;this.bounces=0;this.cooldown=0;this.hitDrone=false;this.wallContacts=new Set();this.explosions=[];}
    launch(pull){const shot=shotFromPull(pull);if(shot.power<.07)return false;this.ball={...shot};this.phase='flying';this.elapsed=0;return true;}
    step(dt) {
      const count=Math.max(1,Math.ceil(dt*240)),h=dt/count;
      for(let n=0;n<count;n++) {
        this.time+=h;
        this.explosions=this.explosions.filter(effect=>(effect.age+=h)<.9);
        if(this.phase!=='flying')continue;
        this.elapsed+=h;this.cooldown=Math.max(0,this.cooldown-h);
        const b=this.ball,old={...b};
        b.x+=b.vx*h;b.y+=b.vy*h+THROW.gravity*h*h/2;b.vy+=THROW.gravity*h;
        if(catchesWindow(old,b)){this.phase='success';return;}
        const contacts=new Set();
        for(const [wallId,wall] of THROW.walls.entries()) {
          const px=clamp(b.x,wall.x,wall.x+wall.w),py=clamp(b.y,wall.y,wall.y+wall.h);
          if(Math.hypot(b.x-px,b.y-py)>=THROW.radius)continue;
          contacts.add(wallId);
          if(!this.wallContacts.has(wallId))this.onCollision('wall');
          if(old.y<=wall.y-THROW.radius){b.y=wall.y-THROW.radius;b.vy=-Math.abs(b.vy)*.58;}
          else if(old.x<=wall.x-THROW.radius){b.x=wall.x-THROW.radius;b.vx=-Math.abs(b.vx)*.6;}
          else if(old.x>=wall.x+wall.w+THROW.radius){b.x=wall.x+wall.w+THROW.radius;b.vx=Math.abs(b.vx)*.6;}
          else {b.y=wall.y+wall.h+THROW.radius;b.vy=Math.abs(b.vy)*.6;}
        }
        this.wallContacts=contacts;
        for(const drone of dronesAt(this.time)) {
          const dx=b.x-drone.x,dy=b.y-drone.y,d=Math.hypot(dx,dy),range=THROW.radius+drone.radius;
          if(d>=range||this.cooldown>0)continue;
          this.onCollision('drone');
          this.explosions.push({x:drone.x,y:drone.y,age:0,seed:this.time*3});
          this.hitDrone=true;this.phase='destroyed';return;
        }
        if(b.y>THROW.floor-THROW.radius){b.y=THROW.floor-THROW.radius;b.vy=-Math.abs(b.vy)*.47;b.vx*=.7;this.bounces++;}
        if(b.x<THROW.radius){this.onCollision('wall');b.x=THROW.radius;b.vx=Math.abs(b.vx)*.55;}
        if(b.x>THROW.width-THROW.radius){this.onCollision('wall');b.x=THROW.width-THROW.radius;b.vx=-Math.abs(b.vx)*.55;}
        if(this.elapsed>9||this.bounces>=3||(this.bounces&&Math.hypot(b.vx,b.vy)<55)){this.phase='miss';return;}
      }
    }
  }
  function drawExplosion(ctx,e,reduced=false){
    const t=e.age/.9,fade=Math.max(0,1-t);
    ctx.save();ctx.translate(e.x,e.y);
    if(reduced){ctx.globalAlpha=fade*.65;ctx.fillStyle='#ffc16b';ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();ctx.restore();return;}
    // One local burst: expanding flash, sparks, fragments and drifting smoke.
    if(t<.48){
      const r=18+70*t,glow=ctx.createRadialGradient(0,0,1,0,0,r*1.7);
      glow.addColorStop(0,'#fff3b8');glow.addColorStop(.28,'#ffb743cc');glow.addColorStop(1,'#fa5a1700');
      ctx.globalAlpha=1-t*1.8;ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r*1.7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffe3a0';ctx.beginPath();
      for(let i=0;i<20;i++){const a=i*Math.PI/10+e.seed,radius=i%2?r*.5:r;const x=Math.cos(a)*radius,y=Math.sin(a)*radius;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=fade*.8;ctx.strokeStyle='#ffd28b';ctx.lineWidth=2*fade;ctx.beginPath();ctx.arc(0,0,18+90*t,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8+e.seed,speed=65+(i%4)*24,x=Math.cos(a)*speed*t,y=Math.sin(a)*speed*t+35*t*t;
      ctx.globalAlpha=fade;ctx.fillStyle=i%3?'#d4a171':'#b7d3d8';ctx.save();ctx.translate(x,y);ctx.rotate(a+t*7);ctx.fillRect(-3,-2,7*fade+1,3);ctx.restore();
    }
    for(let i=0;i<5;i++){
      ctx.globalAlpha=Math.max(0,t*.5*(1-t));ctx.fillStyle='#263039';ctx.beginPath();ctx.arc(Math.sin(i*2+e.seed)*26*t,-t*(24+i*12),14+23*t,0,Math.PI*2);ctx.fill();
    }ctx.restore();
  }
  function create(options) {
    const {canvas,onSuccess,onMessage,isActive,onPenalty=()=>{}}=options,ctx=canvas.getContext('2d');
    const reducedMotion=root.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
    let level=2,maze=new MazeWorld(kind=>{onPenalty(kind);keys.clear();pointer=null;notify('Бруківка розбилась об стіну. −1 500 UAH. Почни зі входу.','bad');}),done=false,pointer=null,offset={x:0,y:0},pull={x:-54,y:78};
    const siege=root.BrukNeuronSiege?.create(options);
    let aiming=false,keys=new Set(),previous=null,flight=new FlightWorld(kind=>onPenalty(kind));
    function notify(text,type=''){onMessage(text,type);}
    function reset() {maze.reset();done=false;pointer=null;aiming=false;keys.clear();flight.reset();if(level===4)siege?.reset();draw();}
    function setLevel(id){level=id;siege?.setActive(id===4);canvas.style.aspectRatio=id===2?'1 / 1':'10 / 7';reset();resize();}
    function resize() {
      const box=canvas.parentElement;
      if(root.document.body.classList.contains('main-minimal')&&!box.classList.contains('hidden')){
        const area=box.parentElement.getBoundingClientRect(),aspect=level===2?1:10/7;
        const height=Math.max(1,Math.floor(Math.min(area.height-42,(area.width-2)/aspect)));
        box.style.width=(Math.floor(height*aspect)+2)+'px';
        box.style.height=(height+42)+'px';
      }
      const r=canvas.getBoundingClientRect(),ratio=Math.min(root.devicePixelRatio||1,2);
      const w=Math.max(1,Math.round(r.width*ratio)),h=Math.max(1,Math.round(r.height*ratio));if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;draw();
    }
    function point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)/r.width*1000,y:(event.clientY-r.top)/r.height*(level===2?1000:700)};}
    const mazePoint=p=>({x:(p.x-75)/85,y:(p.y-75)/85});
    function finishMaze(target) {
      const next=maze.move(target);
      if(next.won&&!done){done=true;keys.clear();onSuccess();}
    }
    function setPull(p){const shot=shotFromPull({x:p.x-THROW.anchor.x,y:p.y-THROW.anchor.y});pull={x:shot.x-THROW.anchor.x,y:shot.y-THROW.anchor.y};}
    canvas.addEventListener('pointerdown',event=>{
      if(!isActive()||done)return;
      const p=point(event);
      if(level===4)return;
      if(level===2) {
        if(maze.phase!=='ready')return;const m=mazePoint(p);if(Math.hypot(m.x-maze.x,m.y-maze.y)>.85)return;
        offset={x:m.x-maze.x,y:m.y-maze.y};
      } else {
        if(flight.phase==='flying'||flight.phase==='destroyed')return;
        if(Math.hypot(p.x-THROW.anchor.x,p.y-THROW.anchor.y)>95)return;
        flight.reset();aiming=true;pull={x:0,y:0};setPull(p);
      }
      pointer=event.pointerId;canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);event.preventDefault();draw();
    });
    canvas.addEventListener('pointermove',event=>{
      if(pointer!==event.pointerId||!isActive()||done)return;
      const p=point(event);
      if(level===2){const m=mazePoint(p);finishMaze({x:m.x-offset.x,y:m.y-offset.y});}
      else setPull(p);
      event.preventDefault();draw();
    });
    canvas.addEventListener('pointerup',event=>{
      if(pointer!==event.pointerId)return;pointer=null;
      if(!isActive()){aiming=false;return;}
      if(level===3&&aiming){aiming=false;flight.launch(pull);notify(flight.phase==='flying'?'Бруківка в польоті. У вікно потрібно влучити зверху.':'Натягни сильніше й відпусти.');}
    });
    canvas.addEventListener('pointercancel',()=>{pointer=null;aiming=false;});
    const codeMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};
    root.document.addEventListener('keydown',event=>{
      if(level===4)return;
      if(!isActive()||done||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,button,a'))return;
      const direction=codeMap[event.code];
      if(direction){event.preventDefault();keys.add(direction);
        if(level===3&&flight.phase!=='flying'){
          if(direction==='left')pull.x+=3;if(direction==='right')pull.x-=3;
          if(direction==='up')pull.y+=3;if(direction==='down')pull.y-=3;
          const shot=shotFromPull(pull);pull={x:shot.x-THROW.anchor.x,y:shot.y-THROW.anchor.y};aiming=true;
        }
      }
      if(level===3&&event.code==='Space'){event.preventDefault();if(!event.repeat&&flight.phase!=='flying'&&flight.phase!=='destroyed'){flight.reset();aiming=false;flight.launch(pull);}}
    });
    root.document.addEventListener('keyup',event=>{keys.delete(codeMap[event.code]);});
    root.addEventListener('blur',()=>{keys.clear();pointer=null;aiming=false;});
    function brick(x,y,size=34,rotation=0) {
      if(root.BrukBrick)root.BrukBrick.draw(ctx,x,y,size,size,rotation);
    }
    function text(copy,x,y,color='#b7c5cf',size=14,align='left'){ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui`;ctx.textAlign=align;ctx.fillText(copy,x,y);}
    function drawMaze() {
      ctx.fillStyle='#121d28';ctx.fillRect(0,0,1000,1000);
      ctx.strokeStyle='#263748';ctx.lineWidth=1;
      for(let n=0;n<10;n++){ctx.beginPath();ctx.moveTo(75+n*85,75);ctx.lineTo(75+n*85,925);ctx.moveTo(75,75+n*85);ctx.lineTo(925,75+n*85);ctx.stroke();}
      ctx.lineWidth=15;ctx.strokeStyle='#b0c6c8';ctx.lineCap='square';
      MAZE_LINES.forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(75+x1*85,75+y1*85);ctx.lineTo(75+x2*85,75+y2*85);ctx.stroke();});
      ctx.fillStyle='#90caba33';ctx.fillRect(78,446,75,108);ctx.fillStyle='#b6f38d33';ctx.fillRect(848,446,75,108);
      text('ВХІД',108,427,'#92c9c0',16,'center');text('ВИХІД',879,427,'#c4f58a',16,'center');
      text('ПЛАН КВАРТАЛУ / 03',75,42,'#92a7b9',15);text('×3',925,44,'#d6f69e',25,'right');

      if(maze.phase!=='broken')brick(75+maze.x*85,75+maze.y*85,MAZE_RADIUS*170);
      if(maze.effect){const e=maze.effect,t=e.age/.65;ctx.save();ctx.globalAlpha=1-t;ctx.translate(75+e.x*85,75+e.y*85);for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.save();ctx.translate(Math.cos(a)*t*85,Math.sin(a)*t*85+40*t*t);ctx.rotate(i+t*5);ctx.fillStyle=i%3?'#c5c7c6':'#7e8586';ctx.fillRect(-5,-4,10,8);ctx.restore();}ctx.restore();text('РОЗБИТО · НА СТАРТ',500,42,'#ff9b9b',17,'center');}
    }
    function drawThrow() {
      const sky=ctx.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#102539');sky.addColorStop(.6,'#627180');sky.addColorStop(1,'#bea17c');ctx.fillStyle=sky;ctx.fillRect(0,0,1000,700);
      const moon=ctx.createRadialGradient(838,84,8,838,84,110);moon.addColorStop(0,'#fff2c44d');moon.addColorStop(1,'#fff2c400');ctx.fillStyle=moon;ctx.fillRect(728,0,220,200);ctx.fillStyle='#f5e4b1';ctx.beginPath();ctx.arc(838,84,26,0,Math.PI*2);ctx.fill();
      // Distant neighbourhood: windows, roofs, antennas and layered silhouettes.
      for(let layer=0;layer<2;layer++)for(let i=0;i<12;i++){const h=75+(i*53+layer*79)%150,x=i*98-30+layer*27,y=THROW.floor-h-30*(1-layer);ctx.fillStyle=layer?'#283d46':'#4a5962';ctx.fillRect(x,y,85,h+35);ctx.fillStyle='#243842';ctx.fillRect(x-3,y-7,91,7);ctx.strokeStyle='#3b4d55';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+23,y);ctx.lineTo(x+23,y-23);ctx.lineTo(x+52,y-23);ctx.stroke();for(let wy=y+19;wy<THROW.floor;wy+=25)for(let wx=x+12;wx<x+75;wx+=22){ctx.fillStyle=(i+wx+wy)%7<3?'#c7b38a55':'#132c3c88';ctx.fillRect(wx,wy,10,14);}}
      const ground=ctx.createLinearGradient(0,THROW.floor,0,700);ground.addColorStop(0,'#6e786a');ground.addColorStop(1,'#35434b');ctx.fillStyle=ground;ctx.fillRect(0,THROW.floor,1000,28);ctx.strokeStyle='#c8c1a777';ctx.beginPath();ctx.moveTo(0,THROW.floor+2);ctx.lineTo(1000,THROW.floor+2);ctx.stroke();for(let i=0;i<40;i++){ctx.strokeStyle='#263c4266';ctx.beginPath();ctx.moveTo(i*27,THROW.floor+7);ctx.lineTo(i*27-12,700);ctx.stroke();}
      for(const wall of THROW.walls){const g=ctx.createLinearGradient(wall.x,0,wall.x+wall.w,0);g.addColorStop(0,'#b3a28c');g.addColorStop(.5,'#847b6f');g.addColorStop(1,'#4a5553');ctx.fillStyle=g;ctx.fillRect(wall.x,wall.y,wall.w,wall.h);ctx.strokeStyle='#3e4544';ctx.lineWidth=1;for(let y=wall.y+18,row=0;y<THROW.floor;y+=20,row++){ctx.beginPath();ctx.moveTo(wall.x,y);ctx.lineTo(wall.x+wall.w,y);ctx.moveTo(wall.x+(row%2?8:18),y-20);ctx.lineTo(wall.x+(row%2?8:18),y);ctx.stroke();}ctx.fillStyle='#c8bda5';ctx.fillRect(wall.x-3,wall.y-4,wall.w+6,6);ctx.fillStyle='#162c3244';ctx.fillRect(wall.x+wall.w,wall.y+4,8,wall.h-4);ctx.fillStyle='#c8b783';ctx.fillRect(wall.x+4,wall.y+38,wall.w-8,26);text('!',wall.x+wall.w/2,wall.y+59,'#384649',20,'center');}
      // Open apartment window: target plane stays aligned with the physics model.
      const facade=ctx.createLinearGradient(826,0,1000,0);facade.addColorStop(0,'#9c8878');facade.addColorStop(1,'#625d5a');ctx.fillStyle=facade;ctx.fillRect(826,265,174,407);ctx.strokeStyle='#3d41434d';ctx.lineWidth=1;for(let y=275,row=0;y<672;y+=22,row++){ctx.beginPath();ctx.moveTo(826,y);ctx.lineTo(1000,y);ctx.stroke();for(let x=826+(row%2?19:0);x<1000;x+=38){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+22);ctx.stroke();}}ctx.fillStyle='#c1b6a0';ctx.fillRect(820,258,180,10);ctx.fillStyle='#25323b';ctx.fillRect(852,280,130,99);const room=ctx.createLinearGradient(866,290,972,371);room.addColorStop(0,'#192a32');room.addColorStop(1,'#695d46');ctx.fillStyle=room;ctx.fillRect(862,285,110,89);ctx.fillStyle='#ae8a5b55';ctx.fillRect(890,354,56,20);ctx.fillStyle='#ded4ad';ctx.fillRect(THROW.window.left-9,273,9,108);ctx.fillRect(THROW.window.right,273,9,108);ctx.fillRect(THROW.window.left-12,374,140,10);ctx.fillStyle='#3c4947';ctx.fillRect(THROW.window.left-12,384,140,7);
      ctx.fillStyle='#79bbc044';ctx.strokeStyle='#c6e2d6';ctx.lineWidth=3;for(const [x,w] of [[840,19],[974,20]]){ctx.fillRect(x,279,w,91);ctx.strokeRect(x,279,w,91);ctx.beginPath();ctx.moveTo(x,324);ctx.lineTo(x+w,324);ctx.stroke();}ctx.strokeStyle='#6e7b7a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(842,406);ctx.lineTo(842,652);ctx.lineTo(826,663);ctx.stroke();ctx.fillStyle='#b4b6aa';ctx.fillRect(891,466,83,41);ctx.fillStyle='#727b77';ctx.fillRect(897,472,36,29);ctx.strokeStyle='#404e51';ctx.lineWidth=2;ctx.beginPath();ctx.arc(915,486,12,0,Math.PI*2);ctx.stroke();for(let y=475;y<499;y+=5)ctx.fillRect(941,y,26,2);text('ДОСТАВКА',914,428,'#e9d8ae',15,'center');text('×10',914,453,'#dbf5a7',24,'center');
      ctx.strokeStyle='#d1f590';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(THROW.window.left+6,THROW.window.plane);ctx.lineTo(THROW.window.right-6,THROW.window.plane);ctx.stroke();ctx.setLineDash([]);text('↓ ВЛУЧ ЗВЕРХУ',914,240,'#e7f6bb',15,'center');
      dronesAt(flight.time).forEach((d,i)=>{if(flight.explosions.some(e=>Math.hypot(e.x-d.x,e.y-d.y)<100))return;ctx.save();ctx.translate(d.x,d.y);ctx.rotate(Math.sin(flight.time*3+i)*.07);ctx.strokeStyle='#1c2c35';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-28,-9);ctx.lineTo(28,9);ctx.moveTo(-28,9);ctx.lineTo(28,-9);ctx.stroke();ctx.strokeStyle='#96a6a9';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#334651';ctx.beginPath();ctx.roundRect(-14,-9,28,18,5);ctx.fill();ctx.fillStyle='#92a8a9';ctx.fillRect(-10,-6,20,4);ctx.fillStyle='#0e212d';ctx.fillRect(-7,0,14,7);ctx.fillStyle='#e8b97e';ctx.beginPath();ctx.arc(0,6,3,0,Math.PI*2);ctx.fill();for(const dx of [-28,28])for(const dy of [-9,9]){ctx.fillStyle='#182c32';ctx.beginPath();ctx.arc(dx,dy,4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c3d6d7aa';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(dx,dy,17,3,Math.sin(flight.time*48)*.25,0,Math.PI*2);ctx.stroke();ctx.fillStyle=dx<0?'#f98171':'#8fdaaa';ctx.fillRect(dx-2,dy+3,3,3);}ctx.restore();});
      ctx.strokeStyle='#3f332c';ctx.lineWidth=15;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(128,THROW.floor);ctx.lineTo(128,559);ctx.moveTo(128,567);ctx.lineTo(101,526);ctx.moveTo(128,567);ctx.lineTo(155,526);ctx.stroke();ctx.strokeStyle='#a38c64';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#5b4330';ctx.lineWidth=2;for(let y=580;y<640;y+=8){ctx.beginPath();ctx.moveTo(122,y);ctx.lineTo(134,y+2);ctx.stroke();}
      const shot=shotFromPull(pull),shown=aiming?shot:flight.phase==='miss'?THROW.anchor:flight.ball;
      if(aiming) {
        const aim=shotFromPull(pull);ctx.fillStyle='#d7f39488';
        for(let t=.12;t<2.8;t+=.1){const x=aim.x+aim.vx*t,y=aim.y+aim.vy*t+THROW.gravity*t*t/2;if(x<0||x>1000||y>THROW.floor)break;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}
      }
      if(aiming){ctx.strokeStyle='#e9c382';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(101,526);ctx.lineTo(shot.x,shot.y);ctx.lineTo(155,526);ctx.stroke();}
      if(flight.phase!=='destroyed')brick(shown.x,shown.y,36,flight.phase==='flying'?flight.elapsed*5:0);
      flight.explosions.forEach(effect=>drawExplosion(ctx,effect,reducedMotion));
      text('ВІДКРИТЕ ВІКНО / 04',28,37,'#c0cdd3',17);
      text(flight.phase==='flying'?'У ПОЛЬОТІ':`НАТЯГ ${Math.round(shot.power*100)}%`,28,65,'#d5f19c',17);
      ctx.fillStyle='#0d1c27';ctx.fillRect(28,78,150,7);ctx.fillStyle='#d5f19c';ctx.fillRect(28,78,150*shot.power,7);

      if(flight.phase==='destroyed')text('БРУКІВКУ ЗНИЩЕНО',500,80,'#ffd19e',24,'center');
      if(flight.phase==='miss')text('Повз! Бруківка знову на старті.',500,80,'#ffd19e',21,'center');
      if(flight.phase==='success')text('ДОСТАВЛЕНО У ВІКНО!',500,80,'#d6f69e',26,'center');
    }
    function draw(){if(!ctx)return;if(level===4)return;ctx.setTransform(canvas.width/1000,0,0,canvas.height/(level===2?1000:700),0,0);level===2?drawMaze():drawThrow();}
    function frame(time) {
      const dt=previous===null?0:Math.min(.04,(time-previous)/1000);previous=time;
      if(isActive()&&!done&&level!==4) {
        if(level===2)maze.step(dt);
        if(level===2&&keys.size){const x=(keys.has('right')?1:0)-(keys.has('left')?1:0),y=(keys.has('down')?1:0)-(keys.has('up')?1:0),norm=Math.hypot(x,y)||1;finishMaze({x:maze.x+x/norm*dt*2.5,y:maze.y+y/norm*dt*2.5});}
        if(level===3){const before=flight.phase;flight.step(dt);
          if(before==='flying'&&flight.phase==='destroyed')notify('БПЛА знищив бруківку! −4 500 UAH. Бонусу за цей кидок немає.','bad');
          if(flight.phase==='destroyed'&&!flight.explosions.length)flight.reset();
          if(before==='flying'&&flight.phase==='success'){done=true;onSuccess();}
          else if(before==='flying'&&flight.phase==='miss')notify('Не влучив. Візьми бруківку біля рогатки та спробуй ще раз.');
        }
        draw();
      } else {keys.clear();pointer=null;aiming=false;}
      root.requestAnimationFrame(frame);
    }
    if(root.ResizeObserver)new root.ResizeObserver(resize).observe(canvas.parentElement.parentElement);
    root.requestAnimationFrame(resize);
    root.requestAnimationFrame(frame);
    return {setLevel,reset,resize,cancel:()=>{keys.clear();pointer=null;aiming=false;siege?.cancel();}};
  }
  const api={LEVELS,restoreAccess,MAZE_LINES,mazeBlocked,moveMaze,MazeWorld,penaltyFor,THROW,dronesAt,shotFromPull,catchesWindow,FlightWorld,drawExplosion,create};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.BrukDelivery=api;
})(typeof window==='undefined'?globalThis:window);
