(function (root) {
  'use strict';
  const LEVELS = [
    {name:'Склад', multiplier:0.1, icon:'▰', hint:'Просто перенеси бруківку зі складу в карман. Без перешкод.'},
    {name:'Лазерні ворота', multiplier:1, icon:'⌁', hint:'Знайомий маршрут: проведи бруківку між воротами й лазерами.'},
    {name:'Лабіринт', multiplier:3, icon:'▦', hint:'Знайди шлях від входу ліворуч до виходу праворуч. Торкання стіни: −500 UAH.'},
    {name:'У відкрите вікно', multiplier:10, icon:'↗', hint:'Потягни бруківку вниз і вліво та відпусти. Влуч у вікно зверху, на спаданні. Стіна чи БПЛА: −500 UAH.'}
  ];
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
    reset(){this.ball={...THROW.anchor,vx:0,vy:0};this.phase='ready';this.elapsed=0;this.bounces=0;this.cooldown=0;this.hitDrone=false;this.wallContacts=new Set();}
    launch(pull){const shot=shotFromPull(pull);if(shot.power<.07)return false;this.ball={...shot};this.phase='flying';this.elapsed=0;return true;}
    step(dt) {
      const count=Math.max(1,Math.ceil(dt*240)),h=dt/count;
      for(let n=0;n<count;n++) {
        this.time+=h;
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
          const nx=d?dx/d:0,ny=d?dy/d:-1,dot=b.vx*nx+b.vy*ny;
          b.x=drone.x+nx*(range+2);b.y=drone.y+ny*(range+2);
          if(dot<0){b.vx-=1.7*dot*nx;b.vy-=1.7*dot*ny;}
          b.vx+=nx*105;b.vy+=ny*105;this.cooldown=.22;this.hitDrone=true;
        }
        if(b.y>THROW.floor-THROW.radius){b.y=THROW.floor-THROW.radius;b.vy=-Math.abs(b.vy)*.47;b.vx*=.7;this.bounces++;}
        if(b.x<THROW.radius){this.onCollision('wall');b.x=THROW.radius;b.vx=Math.abs(b.vx)*.55;}
        if(b.x>THROW.width-THROW.radius){this.onCollision('wall');b.x=THROW.width-THROW.radius;b.vx=-Math.abs(b.vx)*.55;}
        if(this.elapsed>9||this.bounces>=3||(this.bounces&&Math.hypot(b.vx,b.vy)<55)){this.phase='miss';return;}
      }
    }
  }
  function create(options) {
    const {canvas,onSuccess,onMessage,isActive,onPenalty=()=>{}}=options,ctx=canvas.getContext('2d');
    let level=2,maze={x:.65,y:5},done=false,pointer=null,offset={x:0,y:0},pull={x:-54,y:78};
    let aiming=false,keys=new Set(),previous=null,mazeContact=false,flight=new FlightWorld(kind=>onPenalty(kind));
    function notify(text,type=''){onMessage(text,type);}
    function reset() {maze={x:.65,y:5};done=false;pointer=null;aiming=false;keys.clear();flight.reset();mazeContact=false;draw();}
    function setLevel(id){level=id;canvas.style.aspectRatio=id===2?'1 / 1':'10 / 7';reset();resize();}
    function resize() {
      const r=canvas.getBoundingClientRect(),ratio=Math.min(root.devicePixelRatio||1,2);
      canvas.width=Math.max(1,Math.round(r.width*ratio));canvas.height=Math.max(1,Math.round(r.height*ratio));draw();
    }
    function point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)/r.width*1000,y:(event.clientY-r.top)/r.height*(level===2?1000:700)};}
    const mazePoint=p=>({x:(p.x-75)/85,y:(p.y-75)/85});
    function finishMaze(target) {
      const next=moveMaze(maze,target);maze={x:next.x,y:next.y};
      if(next.won&&!done){done=true;keys.clear();onSuccess();}
      else if(next.blocked){if(!mazeContact)onPenalty('wall');mazeContact=true;}
      else mazeContact=false;
    }
    function setPull(p){const shot=shotFromPull({x:p.x-THROW.anchor.x,y:p.y-THROW.anchor.y});pull={x:shot.x-THROW.anchor.x,y:shot.y-THROW.anchor.y};}
    canvas.addEventListener('pointerdown',event=>{
      if(!isActive()||done)return;
      const p=point(event);
      if(level===2) {
        const m=mazePoint(p);if(Math.hypot(m.x-maze.x,m.y-maze.y)>.85)return;
        offset={x:m.x-maze.x,y:m.y-maze.y};mazeContact=false;
      } else {
        if(flight.phase==='flying')return;
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
      if(!isActive()||done||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,button,a'))return;
      const direction=codeMap[event.code];
      if(direction){event.preventDefault();keys.add(direction);
        if(level===3&&flight.phase!=='flying'){
          if(direction==='left')pull.x+=3;if(direction==='right')pull.x-=3;
          if(direction==='up')pull.y+=3;if(direction==='down')pull.y-=3;
          const shot=shotFromPull(pull);pull={x:shot.x-THROW.anchor.x,y:shot.y-THROW.anchor.y};aiming=true;
        }
      }
      if(level===3&&event.code==='Space'){event.preventDefault();if(!event.repeat&&flight.phase!=='flying'){flight.reset();aiming=false;flight.launch(pull);}}
    });
    root.document.addEventListener('keyup',event=>{keys.delete(codeMap[event.code]);if(!keys.size)mazeContact=false;});
    root.addEventListener('blur',()=>{keys.clear();pointer=null;aiming=false;});
    function brick(x,y,size=34,rotation=0) {
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.fillStyle='#d7a676';ctx.strokeStyle='#f8d7ae';ctx.lineWidth=2;
      ctx.fillRect(-size/2,-size/2,size,size);ctx.strokeRect(-size/2,-size/2,size,size);
      ctx.strokeStyle='#8b654a';ctx.beginPath();ctx.moveTo(-size/2,0);ctx.lineTo(size/2,0);ctx.moveTo(0,-size/2);ctx.lineTo(0,size/2);ctx.stroke();ctx.restore();
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
      text('Миша / дотик — тягни бруківку · WASD / стрілки — рух',500,975,'#91a5b3',15,'center');
      brick(75+maze.x*85,75+maze.y*85,MAZE_RADIUS*170);
    }
    function drawThrow() {
      const sky=ctx.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#1d354b');sky.addColorStop(1,'#34474e');ctx.fillStyle=sky;ctx.fillRect(0,0,1000,700);
      ctx.fillStyle='#d9e2b0';ctx.beginPath();ctx.arc(838,84,28,0,Math.PI*2);ctx.fill();
      for(let i=0;i<8;i++){const h=120+i*37%110;ctx.fillStyle=i%2?'#243c49':'#263f4d';ctx.fillRect(i*145-30,THROW.floor-h,110,h);}
      ctx.fillStyle='#56635b';ctx.fillRect(0,THROW.floor,1000,28);
      for(const wall of THROW.walls){ctx.fillStyle='#666f6a';ctx.fillRect(wall.x,wall.y,wall.w,wall.h);ctx.strokeStyle='#9aa190';ctx.strokeRect(wall.x,wall.y,wall.w,wall.h);for(let y=wall.y+18;y<THROW.floor;y+=22){ctx.beginPath();ctx.moveTo(wall.x,y);ctx.lineTo(wall.x+wall.w,y);ctx.stroke();}}
      ctx.fillStyle='#39484d';ctx.fillRect(834,380,155,THROW.floor-380);
      ctx.fillStyle='#a1aba0';ctx.fillRect(THROW.window.left-9,273,9,108);ctx.fillRect(THROW.window.right,273,9,108);ctx.fillRect(THROW.window.left-9,374,128,12);
      ctx.fillStyle='#12212b';ctx.fillRect(THROW.window.left,285,110,89);
      ctx.strokeStyle='#95dfe1';ctx.lineWidth=3;ctx.strokeRect(THROW.window.left-22,276,22,96);ctx.strokeRect(THROW.window.right+1,276,20,96);
      ctx.strokeStyle='#d1f590';ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(THROW.window.left+6,THROW.window.plane);ctx.lineTo(THROW.window.right-6,THROW.window.plane);ctx.stroke();ctx.setLineDash([]);
      text('↓ ВЛУЧ ЗВЕРХУ',914,251,'#d6f69e',16,'center');text('×10',918,421,'#d6f69e',26,'center');
      THROW.zones.forEach((z,i)=>{
        ctx.strokeStyle='#9bc8d944';ctx.lineWidth=1;ctx.setLineDash([6,6]);ctx.strokeRect(z.left-44,z.top-44,z.right-z.left+88,z.bottom-z.top+88);
        ctx.beginPath();ctx.ellipse((z.left+z.right)/2,(z.top+z.bottom)/2,(z.right-z.left)/2,(z.bottom-z.top)/2,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        text(`ЗОНА БПЛА ${i+1}`,z.left-42,z.top-52,'#9cb6c9',12);
      });
      dronesAt(flight.time).forEach(d=>{
        ctx.strokeStyle='#e3b782';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(d.x-28,d.y-9);ctx.lineTo(d.x+28,d.y+9);ctx.moveTo(d.x-28,d.y+9);ctx.lineTo(d.x+28,d.y-9);ctx.stroke();
        ctx.fillStyle='#d7e5df';ctx.fillRect(d.x-13,d.y-8,26,16);ctx.strokeStyle='#a2d6df';ctx.lineWidth=2;
        for(const dx of [-28,28])for(const dy of [-9,9]){ctx.beginPath();ctx.ellipse(d.x+dx,d.y+dy,14,3,Math.sin(flight.time*35)*.2,0,Math.PI*2);ctx.stroke();}
      });
      ctx.strokeStyle='#8c6747';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(128,THROW.floor);ctx.lineTo(128,554);ctx.moveTo(128,567);ctx.lineTo(101,526);ctx.moveTo(128,567);ctx.lineTo(155,526);ctx.stroke();
      const shot=shotFromPull(pull),shown=aiming?shot:flight.phase==='miss'?THROW.anchor:flight.ball;
      if(flight.phase!=='flying'&&flight.phase!=='success'&&flight.phase!=='miss') {
        const aim=shotFromPull(pull);ctx.fillStyle='#d7f39488';
        for(let t=.12;t<2.8;t+=.1){const x=aim.x+aim.vx*t,y=aim.y+aim.vy*t+THROW.gravity*t*t/2;if(x<0||x>1000||y>THROW.floor)break;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}
      }
      if(aiming){ctx.strokeStyle='#e9c382';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(101,526);ctx.lineTo(shot.x,shot.y);ctx.lineTo(155,526);ctx.stroke();}
      brick(shown.x,shown.y,36,flight.phase==='flying'?flight.elapsed*5:0);
      text('ВІДКРИТЕ ВІКНО / 04',28,37,'#c0cdd3',17);
      text(flight.phase==='flying'?'У ПОЛЬОТІ':`НАТЯГ ${Math.round(shot.power*100)}%`,28,65,'#d5f19c',17);
      ctx.fillStyle='#0d1c27';ctx.fillRect(28,78,150,7);ctx.fillStyle='#d5f19c';ctx.fillRect(28,78,150*shot.power,7);
      if(flight.phase==='ready')text('↙ потягни й відпусти',40,475,'#f6d1a0',16);
      if(flight.phase==='miss')text('Повз! Бруківка знову на старті.',500,80,'#ffd19e',21,'center');
      if(flight.phase==='success')text('ДОСТАВЛЕНО У ВІКНО!',500,80,'#d6f69e',26,'center');
    }
    function draw(){if(!ctx)return;ctx.setTransform(canvas.width/1000,0,0,canvas.height/(level===2?1000:700),0,0);level===2?drawMaze():drawThrow();}
    function frame(time) {
      const dt=previous===null?0:Math.min(.04,(time-previous)/1000);previous=time;
      if(isActive()&&!done) {
        if(level===2&&keys.size){const x=(keys.has('right')?1:0)-(keys.has('left')?1:0),y=(keys.has('down')?1:0)-(keys.has('up')?1:0),norm=Math.hypot(x,y)||1;finishMaze({x:maze.x+x/norm*dt*2.5,y:maze.y+y/norm*dt*2.5});}
        if(level===3){const before=flight.phase;flight.step(dt);
          if(before==='flying'&&flight.phase==='success'){done=true;onSuccess();}
          else if(before==='flying'&&flight.phase==='miss')notify('Не влучив. Візьми бруківку біля рогатки та спробуй ще раз.');
        }
        draw();
      } else {keys.clear();pointer=null;aiming=false;}
      root.requestAnimationFrame(frame);
    }
    root.requestAnimationFrame(frame);
    return {setLevel,reset,resize,cancel:()=>{keys.clear();pointer=null;aiming=false;mazeContact=false;}};
  }
  const api={LEVELS,MAZE_LINES,mazeBlocked,moveMaze,THROW,dronesAt,shotFromPull,catchesWindow,FlightWorld,create};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.BrukDelivery=api;
})(typeof window==='undefined'?globalThis:window);
