/* Pure board operations are also exported for validation outside the browser. */
(function(root) {
  'use strict';
  function slide(line) {
    const values=line.filter(Boolean), out=[];let score=0;
    for(let i=0;i<values.length;i++) {
      if(values[i]===values[i+1]) {const merged=values[i]*2;out.push(merged);score+=merged;i++;}
      else out.push(values[i]);
    }
    while(out.length<4)out.push(0);return {line:out,score};
  }
  function move(board,direction) {
    if(!['left','right','up','down'].includes(direction))return {board:board.slice(),score:0,changed:false};
    const next=board.slice();let score=0;
    for(let n=0;n<4;n++) {
      const ids=Array.from({length:4},(_,i)=>direction==='left'?n*4+i:direction==='right'?n*4+3-i:direction==='up'?i*4+n:(3-i)*4+n);
      const result=slide(ids.map(i=>board[i]));score+=result.score;ids.forEach((id,i)=>next[id]=result.line[i]);
    }
    return {board:next,score,changed:next.some((v,i)=>v!==board[i])};
  }
  function canMove(board) {return board.includes(0)||['left','right','up','down'].some(d=>move(board,d).changed);}
  const engine={slide,move,canMove};
  if(typeof module!=='undefined'&&module.exports)module.exports=engine;
  if(!root.document)return;
  const $=id=>document.getElementById(id),KEY='brukivka_2048_v1';
  const materials=['','Камінь','Бруківка','Граніт','Мармур','Сталь','Титан','Срібло','Золото','Платина','Сапфір','Легенда'];
  const colors=[['#c0b4a2','#8d8377','#262c2d'],['#cda57c','#986e4d','#251d15'],['#d99462','#ad643b','#fff3d9'],['#e3ad65','#b77838','#fff5d8'],['#a7b7c0','#5d7684','#fff'],['#889cae','#435d73','#fff'],['#d8e2e9','#8fa4b4','#233440'],['#f0d676','#b88b29','#392c13'],['#d0e6e7','#88adb9','#24434a'],['#78b5f0','#2f62a6','#fff'],['#ce9bee','#8050a6','#fff']];
  let state={board:Array(16).fill(0),score:0,best:0,continued:false},busy=false;
  function spawn() {const free=state.board.flatMap((v,i)=>v?[]:[i]);if(free.length)state.board[free[Math.floor(Math.random()*free.length)]]=Math.random()<.9?2:4;}
  function persist() {try{localStorage.setItem(KEY,JSON.stringify(state));}catch{$('storageNote').textContent='Не вдалося зберегти гру. Прогрес залишиться до закриття сторінки.';}}
  function fresh() {state={board:Array(16).fill(0),score:0,best:state.best,continued:false};spawn();spawn();persist();render();$('status').textContent='Новий майданчик готовий.';}
  function render() {
    $('board').replaceChildren();state.board.forEach(value=>{
      const tile=document.createElement('div');tile.className='tile'+(value?' filled':'')+(value>=1024?' big':'');
      tile.setAttribute('aria-label',value?String(value):'Порожньо');
      if(value) {
        const tier=Math.log2(value),color=colors[Math.min(colors.length-1,tier-1)];
        tile.style.setProperty('--top',color[0]);tile.style.setProperty('--bottom',color[1]);tile.style.setProperty('--ink',color[2]);
        const number=document.createElement('strong');number.textContent=value;const name=document.createElement('small');name.textContent=materials[Math.min(tier,materials.length-1)];tile.append(number,name);
      }
      $('board').append(tile);
    });
    $('score').textContent=state.score;$('record').textContent=state.best;
    const won=state.board.some(v=>v>=2048)&&!state.continued,over=!canMove(state.board);
    $('result').hidden=!won&&!over;$('continue').hidden=!won||over;
    if(won||over) {$('resultTitle').textContent=won?'Легендарна бруківка!':'Майданчик заповнений';$('resultText').textContent=won?`Ти зібрав 2048! Очки: ${state.score}. Спробуєш 4096?`:`Доступних ходів немає. Очки: ${state.score}. Спробуй побити свій рекорд.`;}
  }
  function act(direction) {
    if(busy||!$('result').hidden)return;const result=move(state.board,direction);if(!result.changed)return;
    busy=true;state.board=result.board;state.score+=result.score;state.best=Math.max(state.best,state.score);spawn();persist();render();
    $('status').textContent=result.score?`+${result.score} очок · бруківку об'єднано!`:'Плитки пересунуто.';busy=false;
  }
  let restored=false;
  try {
    const raw=JSON.parse(localStorage.getItem(KEY));
    if(raw&&Array.isArray(raw.board)&&raw.board.length===16&&raw.board.every(v=>Number.isSafeInteger(v)&&(v===0||(v>=2&&Number.isInteger(Math.log2(v)))))&&raw.board.some(Boolean)&&Number.isSafeInteger(raw.score)&&raw.score>=0) {
      state={board:raw.board,score:raw.score,best:Number.isSafeInteger(raw.best)?Math.max(raw.best,raw.score):raw.score,continued:raw.continued===true};restored=true;
    }
  }catch{$('storageNote').textContent='Збереження недоступне або пошкоджене. Створено нове поле.';}
  if(restored)render();else fresh();
  $('newGame').addEventListener('click',()=>{if(confirm('Почати нову гру? Поточний майданчик буде очищено, рекорд залишиться.'))fresh();});
  $('restart').addEventListener('click',fresh);$('continue').addEventListener('click',()=>{state.continued=true;persist();render();$('board').focus();});
  document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.move)));
  document.addEventListener('keydown',e=>{
    const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down'}[e.code];
    if(direction&&!e.ctrlKey&&!e.altKey&&!e.metaKey){e.preventDefault();act(direction);}
  });
  let touch=null;$('board').addEventListener('pointerdown',e=>{touch={x:e.clientX,y:e.clientY};$('board').setPointerCapture(e.pointerId);});
  $('board').addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;act(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');});
  $('board').addEventListener('pointercancel',()=>touch=null);
})(typeof window==='undefined'?globalThis:window);
