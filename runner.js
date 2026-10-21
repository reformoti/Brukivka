(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('road'), ctx = canvas.getContext('2d');
  const W = 900, H = 680, LENGTH = 110, PLAYER_Z = 8;
  const RECORD_KEY = 'brukivka_runner_best_v1';
  let best = 0;
  try { best = Math.max(0, Number(localStorage.getItem(RECORD_KEY)) || 0); if (!Number.isFinite(best)) best = 0; }
  catch { $('storageNote').textContent = 'Рекорд доступний лише до закриття сторінки: сховище браузера недоступне.'; }
  let mode = 'ready', distance = 0, lane = 1, visualLane = 1, jumpTime = -1;
  let obstacles = [], nextRow = 35, speed = 19, previousTime = null;
  const JUMP_DURATION = .96;
  const jumpHeight = () => jumpTime < 0 ? 0 : Math.sin(Math.PI * jumpTime / JUMP_DURATION);
  function hud() {
    $('distance').textContent = `${Math.floor(distance)} м`;
    $('best').textContent = `${Math.floor(best)} м`;
    $('speed').textContent = `${(speed / 19).toFixed(1)}×`;
  }
  function show(title, description, button) {
    $('message').textContent = title; $('description').textContent = description;
    $('start').textContent = button; $('overlay').hidden = false;
  }
  function start() {
    distance = 0; lane = visualLane = 1; jumpTime = -1; obstacles = [];
    nextRow = 35; speed = 19; mode = 'running'; previousTime = null;
    $('overlay').hidden = true; canvas.focus({preventScroll:true}); $('pause').disabled = false; $('pause').textContent = 'Пауза'; hud();
  }
  function pause() {
    if (mode !== 'running' && mode !== 'paused') return;
    if (mode === 'running') {
      mode = 'paused'; show('Перепочинок', 'Забіг на паузі. Продовжуй, коли будеш готовий.', 'Продовжити →');
      $('pause').textContent = 'Продовжити';
    } else { mode = 'running'; previousTime = null; $('overlay').hidden = true; $('pause').textContent = 'Пауза'; }
  }
  function finish(type) {
    mode = 'over'; $('pause').disabled = true;
    const score = Math.floor(distance), record = score > best;
    if (record) {
      best = score;
      try { localStorage.setItem(RECORD_KEY, String(best)); }
      catch { $('storageNote').textContent = 'Не вдалося зберегти рекорд у браузері.'; }
    }
    hud(); show(record ? 'Новий рекорд!' : 'Забіг завершено', `${type === 'hole' ? 'Бруківка впала в яму.' : 'Бруківка зачепила паркан.'} Дистанція: ${score} м.`, 'Ще один забіг →');
  }
  function move(direction) { if (mode === 'running') lane = Math.max(0, Math.min(2, lane + direction)); }
  function jump() { if (mode === 'running' && jumpTime < 0) jumpTime = 0; }
  function spawn() {
    // One blocked lane per row guarantees an open route, even at maximum speed.
    obstacles.push({lane:Math.floor(Math.random() * 3), at:nextRow, type:Math.random() < .5 ? 'hole' : 'fence', checked:false});
    nextRow += 24 + Math.random() * 10;
  }
  function update(dt) {
    speed = Math.min(38, 19 + distance / 180);
    const before = distance; distance += speed * dt;
    visualLane += (lane - visualLane) * Math.min(1, dt * 16);
    if (jumpTime >= 0) { jumpTime += dt; if (jumpTime >= JUMP_DURATION) jumpTime = -1; }
    while (nextRow < distance + LENGTH) spawn();
    for (const obstacle of obstacles) {
      // Check the full crossing interval so a dropped frame cannot skip a collision.
      if (!obstacle.checked && obstacle.at - before >= PLAYER_Z && obstacle.at - distance <= PLAYER_Z) {
        obstacle.checked = true;
        if (Math.abs(visualLane - obstacle.lane) < .56 && jumpHeight() < (obstacle.type === 'hole' ? .42 : .62)) {
          finish(obstacle.type); break;
        }
      }
    }
    obstacles = obstacles.filter(o => o.at > distance - 5); hud();
  }
  function point(l, z) {
    const t = Math.max(0, Math.min(1, 1 - z / LENGTH));
    const scale = .12 + .88 * t * t;
    return {x:W / 2 + (l - 1) * 255 * scale, y:170 + 480 * t * t, scale};
  }
  function polygon(points, fill, stroke) {
    ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) {ctx.strokeStyle = stroke; ctx.stroke();}
  }
  function draw() {
    const sky = ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#263f50'); sky.addColorStop(1,'#111c24');
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#e3e6b6'; ctx.beginPath(); ctx.arc(690,115,36,0,Math.PI*2);ctx.fill();
    for(let i=0;i<12;i++) {
      const x=i*86-40, h=65+(i*47)%120;
      ctx.fillStyle=i%2?'#1d303b':'#182934';ctx.fillRect(x,210-h,72,h+120);
      ctx.fillStyle='#a7b79255';for(let j=0;j<3;j++)ctx.fillRect(x+15+j*17,225-h,6,10);
    }
    polygon([point(-.65,0),point(-.65,LENGTH),point(2.65,LENGTH),point(2.65,0)],'#566363');
    polygon([point(-.5,0),point(-.5,LENGTH),point(2.5,LENGTH),point(2.5,0)],'#394748');
    ctx.lineWidth=2;
    for(let l=-.5;l<=2.5;l++) {
      const a=point(l,0),b=point(l,LENGTH);ctx.strokeStyle='#a8bbab44';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    for(let z=0;z<LENGTH;z+=7) {
      const depth=(z+distance%7),a=point(-.5,depth),b=point(2.5,depth);
      ctx.strokeStyle='#9ba9a12b';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    for(const o of [...obstacles].sort((a,b)=>b.at-a.at)) {
      const z=o.at-distance;if(z<0||z>LENGTH)continue;
      const p=point(o.lane,z),s=p.scale;
      if(o.type==='hole') {
        ctx.fillStyle='#050e13';ctx.beginPath();ctx.ellipse(p.x,p.y,96*s,23*s,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#5ce0e4';ctx.lineWidth=3*s;ctx.stroke();
        ctx.fillStyle='#3a6972';ctx.fillRect(p.x-35*s,p.y-4*s,70*s,3*s);
      } else {
        ctx.fillStyle='#422b23';ctx.fillRect(p.x-87*s,p.y-92*s,12*s,92*s);ctx.fillRect(p.x+75*s,p.y-92*s,12*s,92*s);
        for(let r=0;r<2;r++) {ctx.fillStyle=r?'#b97443':'#e4a263';ctx.fillRect(p.x-96*s,p.y-(80-r*32)*s,192*s,21*s);}
        ctx.fillStyle='#ffe0a2';for(let n=-70;n<90;n+=35)ctx.fillRect(p.x+n*s,p.y-73*s,6*s,6*s);
      }
    }
    const p=point(visualLane,PLAYER_Z),lift=jumpHeight()*145;
    ctx.globalAlpha=.4;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,p.y+5,48-lift*.12,13,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    const x=p.x,y=p.y-lift-25,bob=mode==='running'&&jumpTime<0?Math.sin(distance*1.7)*3:0;
    ctx.save();ctx.translate(x,y+bob);ctx.rotate(jumpTime<0?Math.sin(distance)*.025:-jumpHeight()*.17);
    polygon([{x:-47,y:-17},{x:24,y:-32},{x:49,y:-13},{x:-22,y:3}],'#e2af77','#f3c58f');
    polygon([{x:-47,y:-17},{x:-22,y:3},{x:-22,y:34},{x:-47,y:12}],'#9d6542');
    polygon([{x:-22,y:3},{x:49,y:-13},{x:49,y:17},{x:-22,y:34}],'#c58a56','#754d37');
    ctx.fillStyle='#382b25';ctx.fillRect(0,7,6,7);ctx.fillRect(25,1,6,7);ctx.fillRect(12,20,11,3);ctx.restore();
    const vignette=ctx.createLinearGradient(0,H-80,0,H);vignette.addColorStop(0,'#0c131c00');vignette.addColorStop(1,'#0c131caa');ctx.fillStyle=vignette;ctx.fillRect(0,H-80,W,80);
  }
  function frame(time) {
    const dt=previousTime===null?0:Math.min(.05,(time-previousTime)/1000);previousTime=time;
    if(mode==='running')update(dt);draw();requestAnimationFrame(frame);
  }
  $('start').addEventListener('click',()=>mode==='paused'?pause():start());
  $('pause').addEventListener('click',pause);
  $('left').addEventListener('click',()=>move(-1));$('right').addEventListener('click',()=>move(1));$('jump').addEventListener('click',jump);
  document.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyP','Escape'].includes(e.code))return;
    if(e.target.closest('button,a')&&e.code==='Space')return;
    e.preventDefault();if(e.repeat)return;
    if(['KeyP','Escape'].includes(e.code)){pause();return;}
    if(['ArrowLeft','KeyA'].includes(e.code))move(-1);
    else if(['ArrowRight','KeyD'].includes(e.code))move(1);
    else if(mode==='ready'||mode==='over')start();else if(mode==='paused')pause();else jump();
  });
  let touch=null;
  canvas.addEventListener('pointerdown',e=>{touch={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointerup',e=>{
    if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;
    if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy))move(Math.sign(dx));else if(dy< -25||Math.abs(dy)<15)jump();
  });
  canvas.addEventListener('pointercancel',()=>{touch=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')pause();});
  window.addEventListener('blur',()=>{if(mode==='running')pause();});
  hud();draw();requestAnimationFrame(frame);
})();
