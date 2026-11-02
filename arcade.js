(function(root){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class BreakoutWorld{
    constructor(){this.score=0;this.lives=3;this.paddleX=450;this.bricks=[];
      for(let row=0;row<5;row++)for(let col=0;col<10;col++)this.bricks.push({x:39+col*83,y:96+row*40,w:75,h:28,hp:row<2?2:1,row});
      this.remaining=this.bricks.length;this.resetBall();
    }
    resetBall(){this.phase='ready';this.ball={x:this.paddleX,y:547,vx:175,vy:-330};}
    movePaddle(x){this.paddleX=clamp(x,80,820);if(this.phase==='ready')this.ball.x=this.paddleX;}
    serve(){if(this.phase==='ready')this.phase='running';}
    step(dt){
      if(this.phase!=='running')return;
      const steps=Math.max(1,Math.ceil(dt*240)),h=dt/steps;
      for(let n=0;n<steps&&this.phase==='running';n++){
        const b=this.ball,old={...b};b.x+=b.vx*h;b.y+=b.vy*h;
        if(b.x<10){b.x=10;b.vx=Math.abs(b.vx);}if(b.x>890){b.x=890;b.vx=-Math.abs(b.vx);}if(b.y<10){b.y=10;b.vy=Math.abs(b.vy);}
        if(b.vy>0&&old.y+10<=558&&b.y+10>=558&&Math.abs(b.x-this.paddleX)<=85){
          const angle=clamp((b.x-this.paddleX)/75,-1,1)*Math.PI/3,speed=Math.min(650,Math.max(380,Math.hypot(b.vx,b.vy)*1.025));
          b.y=548;b.vx=Math.sin(angle)*speed;if(Math.abs(b.vx)<55)b.vx=55*(old.vx>=0?1:-1);b.vy=-Math.cos(angle)*speed;
        }
        for(const brick of this.bricks){
          if(!brick.hp)continue;const x=clamp(b.x,brick.x,brick.x+brick.w),y=clamp(b.y,brick.y,brick.y+brick.h);
          if(Math.hypot(b.x-x,b.y-y)>=10)continue;
          brick.hp--;this.score+=10;if(!brick.hp)this.remaining--;
          if(old.y<=brick.y-10){b.y=brick.y-10;b.vy=-Math.abs(b.vy);}
          else if(old.y>=brick.y+brick.h+10){b.y=brick.y+brick.h+10;b.vy=Math.abs(b.vy);}
          else if(old.x<brick.x){b.x=brick.x-10;b.vx=-Math.abs(b.vx);}else{b.x=brick.x+brick.w+10;b.vx=Math.abs(b.vx);}
          if(!this.remaining)this.phase='won';break;
        }
        if(b.y-10>600){this.lives--;if(this.lives<=0)this.phase='over';else this.resetBall();}
      }
    }
  }
  class MemoryWorld{
    constructor(random=Math.random){
      const values=Array.from({length:16},(_,i)=>i%8);
      for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
      this.cards=values.map(value=>({value,face:false,matched:false}));this.open=[];this.moves=0;this.pairs=0;this.locked=false;this.won=false;
    }
    flip(index){
      const card=this.cards[index];if(this.won||this.locked||!card||card.face||card.matched)return 'ignored';
      card.face=true;this.open.push(index);if(this.open.length===1)return 'first';this.moves++;
      if(this.cards[this.open[0]].value===card.value){
        this.open.forEach(i=>this.cards[i].matched=true);this.open=[];this.pairs++;this.won=this.pairs===8;return 'match';
      }
      this.locked=true;return 'miss';
    }
    hideMismatch(){if(!this.locked)return;this.open.forEach(i=>this.cards[i].face=false);this.open=[];this.locked=false;}
  }
  const api={BreakoutWorld,MemoryWorld};if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(!root.document)return;
  const $=id=>document.getElementById(id),game=document.body.dataset.game;
  function overlay(title,description,button){$('message').textContent=title;$('description').textContent=description;$('start').textContent=button;$('overlay').hidden=false;}
  const read=key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{$('storageNote').textContent='Рекорд не збережено: сховище браузера недоступне.';}}
  if(game==='breakout'){
    const KEY='brukivka_breakout_best_v1',canvas=$('arcadeCanvas'),ctx=canvas.getContext('2d');
    let world=new BreakoutWorld(),paused=false,intro=true,previous=null,best=read(KEY)||0,keys=new Set(),touchDirection=0;
    if(!Number.isSafeInteger(best)||best<0)best=0;
    function record(){if(world.score>best){best=world.score;write(KEY,best);}}
    function hud(){$('score').textContent=world.score;$('lives').textContent='♥'.repeat(Math.max(0,world.lives));$('remaining').textContent=world.remaining;$('record').textContent=best;}
    function begin(){
      if(paused){pause();return;}if(intro||['won','over'].includes(world.phase))world=new BreakoutWorld();
      intro=false;world.serve();$('overlay').hidden=true;$('pause').disabled=false;canvas.focus({preventScroll:true});hud();
    }
    function pause(){if(intro||world.phase!=='running')return;paused=!paused;keys.clear();touchDirection=0;
      $('pause').textContent=paused?'Продовжити':'Пауза';
      if(paused)overlay('Пауза','Платформа й м’яч чекають на тебе.','Продовжити →');else{$('overlay').hidden=true;previous=null;canvas.focus({preventScroll:true});}
    }
    function move(event){if(intro||paused)return;const r=canvas.getBoundingClientRect();world.movePaddle((event.clientX-r.left)/r.width*900);}
    canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',event=>{canvas.setPointerCapture(event.pointerId);move(event);event.preventDefault();});
    for(const [id,direction] of [['left',-1],['right',1]]){
      $(id).addEventListener('pointerdown',e=>{touchDirection=direction;$(id).setPointerCapture(e.pointerId);e.preventDefault();});
      for(const name of ['pointerup','pointercancel','lostpointercapture'])$(id).addEventListener(name,()=>touchDirection=0);
    }
    $('action').addEventListener('click',()=>world.phase==='running'?pause():begin());$('start').addEventListener('click',begin);$('pause').addEventListener('click',pause);
    document.addEventListener('keydown',e=>{
      if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){e.preventDefault();keys.add(e.code);}
      if(e.code==='Space'&&!e.target.closest('button,a')){e.preventDefault();if(!e.repeat)world.phase==='running'?pause():begin();}
      if(e.code==='KeyP'&&!e.repeat)pause();
    });document.addEventListener('keyup',e=>keys.delete(e.code));
    function draw(){
      ctx.fillStyle='#112330';ctx.fillRect(0,0,900,600);ctx.strokeStyle='#53717b25';ctx.lineWidth=1;
      for(let x=0;x<900;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,600);ctx.stroke();}
      for(let y=0;y<600;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(900,y);ctx.stroke();}
      const colors=['#85bad2','#d1be7f','#b4c9b7','#d6a276','#8da1b2'];
      for(const b of world.bricks){if(!b.hp)continue;ctx.fillStyle=colors[b.row];ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#ffffff30';ctx.fillRect(b.x,b.y,b.w,4);ctx.fillStyle='#0002';ctx.fillRect(b.x,b.y+b.h-5,b.w,5);
        if(b.hp>1){ctx.strokeStyle='#496776';ctx.beginPath();ctx.moveTo(b.x+b.w/2,b.y+4);ctx.lineTo(b.x+b.w/2,b.y+b.h-5);ctx.stroke();}}
      ctx.fillStyle='#d3f2a2';ctx.fillRect(world.paddleX-75,558,150,14);ctx.fillStyle='#f0f9cf';ctx.fillRect(world.paddleX-75,558,150,3);
      ctx.fillStyle='#f5e1b4';ctx.shadowColor='#f2c483';ctx.shadowBlur=15;ctx.beginPath();ctx.arc(world.ball.x,world.ball.y,10,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#91b0ba';ctx.font='600 13px system-ui';ctx.fillText('BRUKIVKA / BREAKOUT',26,34);ctx.textAlign='right';ctx.fillText('50 БРУКІВОК · 3 ЖИТТЯ',874,34);ctx.textAlign='left';
    }
    function frame(time){const dt=previous===null?0:Math.min(.04,(time-previous)/1000);previous=time;
      if(!intro&&!paused&&world.phase==='running'){
        const direction=touchDirection+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);world.movePaddle(world.paddleX+direction*650*dt);
        const before=world.phase;world.step(dt);if(world.phase!==before){record();$('pause').disabled=true;
          if(world.phase==='ready')overlay('Ще один м’яч',`Залишилось життів: ${world.lives}. Квартал уже частково розібраний.`,`Продовжити →`);
          else overlay(world.phase==='won'?'Квартал розібрано!':'М’ячі закінчилися',`Результат: ${world.score} очок. Рекорд: ${best}.`,'Новий забіг →');
        }
      }hud();draw();requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused)pause();});root.addEventListener('blur',()=>{keys.clear();if(!paused)pause();});hud();draw();requestAnimationFrame(frame);
  }else if(game==='memory'){
    const KEY='brukivka_memory_best_v1',names=['Звичайна','Гранітна','Мармурова','Золота','Сапфірова','Рубінова','Смарагдова','Легендарна'];
    const colors=[['#b0b9c2','#627483','#ffffff'],['#b8b0a4','#7c766c','#ffffff'],['#ece1cc','#bfae8b','#303b38'],['#f1d07c','#b48732','#382a16'],['#87b4ef','#45639d','#ffffff'],['#ec8c97','#a5405f','#ffffff'],['#89d2ac','#3a8069','#ffffff'],['#c7a5f0','#7856a6','#ffffff']];
    let world=new MemoryWorld(),intro=true,paused=false,started=false,elapsed=0,mismatch=0,previous=null,best=read(KEY);
    if(!best||!Number.isInteger(best.moves)||best.moves<8||!Number.isFinite(best.seconds)||best.seconds<0)best=null;
    const clock=seconds=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
    function hud(){$('pairs').textContent=`${world.pairs} / 8`;$('moves').textContent=world.moves;$('timer').textContent=clock(elapsed);$('record').textContent=best?`${best.moves} · ${clock(best.seconds)}`:'—';}
    function render(){
      const buttons=$('memoryBoard').children;
      world.cards.forEach((card,i)=>{const button=buttons[i],open=card.face||card.matched;button.classList.toggle('open',open);button.classList.toggle('matched',card.matched);button.disabled=card.matched||paused||world.locked;
        button.setAttribute('aria-label',open?`${names[card.value]} бруківка`:`Картка ${i+1}, прихована`);button.setAttribute('aria-pressed',String(open));
        button.querySelector('.card-face').textContent=open?String(2**(card.value+1)):'▰';button.querySelector('small').textContent=open?names[card.value]:'BRUK';
      });hud();
    }
    function flip(index){
      if(intro||paused)return;const result=world.flip(index);if(result==='ignored')return;started=true;
      if(result==='miss'){mismatch=.72;$('memoryStatus').textContent='Різна бруківка. Запам’ятай ці місця.';}
      else if(result==='match')$('memoryStatus').textContent='Пару знайдено!';else $('memoryStatus').textContent='Тепер знайди таку саму бруківку.';
      render();
      if(world.won){const record=!best||world.moves<best.moves||(world.moves===best.moves&&elapsed<best.seconds);if(record){best={moves:world.moves,seconds:elapsed};write(KEY,best);}hud();$('pause').disabled=true;
        overlay(record?'Новий рекорд!':'Усі пари знайдено!',`${world.moves} ходів за ${clock(elapsed)}. Спробуй запам’ятати нову розкладку.`,'Зіграти знову →');}
    }
    function fresh(){
      world=new MemoryWorld();intro=false;paused=false;started=false;elapsed=0;mismatch=0;$('memoryBoard').replaceChildren();
      world.cards.forEach((card,i)=>{const b=document.createElement('button');b.type='button';b.className='memory-card';const c=colors[card.value];b.style.setProperty('--tile-top',c[0]);b.style.setProperty('--tile-bottom',c[1]);b.style.setProperty('--tile-ink',c[2]);
        const face=document.createElement('span');face.className='card-face';const label=document.createElement('small');b.append(face,label);b.addEventListener('click',()=>flip(i));$('memoryBoard').append(b);});
      $('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Пауза';$('memoryStatus').textContent='Обери дві картки.';render();
    }
    function pause(){if(intro||world.won)return;paused=!paused;$('pause').textContent=paused?'Продовжити':'Пауза';render();if(paused)overlay('Пауза','Картки й час на паузі.','Продовжити →');else{$('overlay').hidden=true;previous=null;}}
    $('start').addEventListener('click',()=>paused?pause():fresh());$('newRound').addEventListener('click',fresh);$('pause').addEventListener('click',pause);
    function frame(time){const dt=previous===null?0:Math.min(.1,(time-previous)/1000);previous=time;
      if(!intro&&!paused&&started&&!world.won){elapsed+=dt;if(mismatch>0){mismatch-=dt;if(mismatch<=0){world.hideMismatch();render();}}hud();}requestAnimationFrame(frame);
    }
    fresh();intro=true;$('overlay').hidden=false;$('pause').disabled=true;
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused)pause();});root.addEventListener('blur',()=>{if(!paused)pause();});hud();requestAnimationFrame(frame);
  }
})(typeof window==='undefined'?globalThis:window);
