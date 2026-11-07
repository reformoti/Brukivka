(() => {
  'use strict';
  if(typeof window!=='undefined'&&window.BrukDevice?.blocked)return;
  const $=id=>document.getElementById(id),C=window.BrukChess,KEY='brukivka_chess_v1',FILES='abcdefgh';
  const symbols={w:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'},b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}},names={k:'король',q:'ферзь',r:'тура',b:'слон',n:'кінь',p:'пішак'};
  const emotionArt={
    '😠':'<circle cx="24" cy="24" r="21" fill="#e9a16d"/><path d="M11 15l8 4m18-4l-8 4M17 34q7-6 14 0" fill="none" stroke="#694538" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="23" r="2.5" fill="#694538"/><circle cx="31" cy="23" r="2.5" fill="#694538"/>',
    '👍':'<path d="M16 22l8-10 2-7q7 0 5 9l-2 6h10q6 0 4 6l-4 14q-1 4-6 4H19l-5-4V23z" fill="#e4c78e" stroke="#aa8a5d" stroke-width="1.5"/><rect x="5" y="22" width="11" height="22" rx="3" fill="#83b4a0"/><path d="M33 27h8m-10 7h9m-11 7h8" stroke="#bb9865" stroke-width="1.5" stroke-linecap="round"/>',
    '🤔':'<circle cx="24" cy="23" r="21" fill="#e5cb84"/><path d="M11 15h8m10 0l8-3m-19 20l11-3" stroke="#6e593c" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="21" r="2.5" fill="#6e593c"/><circle cx="31" cy="20" r="2.5" fill="#6e593c"/><path d="M18 43l4-9 10-2q4 2 0 5l-6 2 2 4" fill="#ead39b" stroke="#b19660" stroke-width="1.6"/>',
    '😂':'<circle cx="24" cy="24" r="21" fill="#e4ca80"/><path d="M11 20q5-8 10 0m6 0q5-8 10 0" stroke="#70583c" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M13 28q11 20 22 0z" fill="#745240"/><path d="M17 30h14" stroke="#fff0c5" stroke-width="4" stroke-linecap="round"/><path d="M9 21q-9 10-3 11 8-1 3-11m30 0q9 10 3 11-8-1-3-11" fill="#83bbcd"/>'
  };
  function emotionIcon(emoji){const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 48 48');icon.setAttribute('aria-hidden','true');icon.classList.add('emotion-icon');icon.innerHTML=emotionArt[emoji]||emotionArt['👍'];return icon;}
  let game=new C.Chess(),mode='bot',player='w',level=2,flipped=false,selected=null,legal=[],arrows=[],arrowStart=null,arrowPointer=null,arrowMode=false,suppressClickUntil=0,promotion=null,busy=false,generation=0,worker=null,requestId=0;
  const pending=new Map(),emotionTimers=new Map();
  function bootWorker(){try{worker=new Worker('chess-worker.js?v=5.0.0');worker.onmessage=({data})=>{const callback=pending.get(data.id);if(callback){pending.delete(data.id);callback(data.error?null:data.result);}};worker.onerror=()=>{worker?.terminate();worker=null;for(const callback of pending.values())callback(null);pending.clear();};}catch{worker=null;}}
  function cancelWork(){generation++;worker?.terminate();worker=null;for(const callback of pending.values())callback(null);pending.clear();bootWorker();busy=false;}
  function calculate(type,fen,move,options){
    if(worker)return new Promise(resolve=>{const id=++requestId;pending.set(id,resolve);worker.postMessage({id,type,fen,move,options});});
    return new Promise(resolve=>setTimeout(()=>{try{const fallback={...options,depth:1,timeMs:150,maxNodes:800};resolve(type==='analyze'?C.analyze(fen,move,fallback):C.search(fen,fallback));}catch{resolve(null);}},25));
  }
  window.addEventListener('bruk-cloud-snapshot',store);
  function store(){try{localStorage.setItem(KEY,JSON.stringify({mode,player,level,flipped,moves:game.history({verbose:true}).map(C.moveData)}));$('saveStatus').textContent='Партія зберігається на цьому пристрої.';}catch{$('saveStatus').textContent='Партія триває, але браузер не зберіг прогрес.';}}
  function restore(){try{const s=JSON.parse(localStorage.getItem(KEY));if(!s||typeof s!=='object')return;const restored=new C.Chess();if(!Array.isArray(s.moves)||s.moves.length>1000)return;for(const move of s.moves)restored.move(C.moveData(move));game=restored;mode=s.mode==='local'?'local':'bot';player=s.player==='b'?'b':'w';level=[1,2,3].includes(s.level)?s.level:2;flipped=!!s.flipped;}catch{game=new C.Chess();}}
  function coord(square){const file=FILES.indexOf(square[0]),rank=Number(square[1])-1;return {x:(flipped?7-file:file)*100+50,y:(flipped?rank:7-rank)*100+50};}
  function squareAt(event){const rect=$('chessBoard').getBoundingClientRect();if(!rect.width||!rect.height)return null;const x=Math.floor((event.clientX-rect.left)/rect.width*8),y=Math.floor((event.clientY-rect.top)/rect.height*8);if(x<0||x>7||y<0||y>7)return null;return FILES[flipped?7-x:x]+(flipped?y+1:8-y);}
  function arrowShape(from,to){const ns='http://www.w3.org/2000/svg',a=coord(from),b=coord(to);if(from===to){const el=document.createElementNS(ns,'circle');el.setAttribute('cx',a.x);el.setAttribute('cy',a.y);el.setAttribute('r','39');el.setAttribute('class','arrow-circle');return el;}const el=document.createElementNS(ns,'line'),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);el.setAttribute('x1',a.x);el.setAttribute('y1',a.y);el.setAttribute('x2',b.x-dx/len*18);el.setAttribute('y2',b.y-dy/len*18);el.setAttribute('class','arrow-line');return el;}
  function renderArrows(draft=null){$('arrows').replaceChildren(...arrows.map(a=>arrowShape(a.from,a.to)));$('arrowDraft').replaceChildren(...(draft?[arrowShape(draft.from,draft.to)]:[]));}
  function renderBoard(){
    const board=$('chessBoard'),last=game.history({verbose:true}).at(-1),checked=game.inCheck()?game.turn():null,fragment=document.createDocumentFragment();
    for(let row=0;row<8;row++)for(let col=0;col<8;col++){
      const x=flipped?7-col:col,y=flipped?row:7-row,square=FILES[x]+(y+1),piece=game.get(square),button=document.createElement('button');button.type='button';button.className='square '+((x+y)%2===0?'dark':'light');button.dataset.square=square;
      if(last&&(last.from===square||last.to===square))button.classList.add('last-move');if(square===selected)button.classList.add('selected');if(legal.some(m=>m.to===square))button.classList.add('legal');if(piece?.type==='k'&&piece.color===checked)button.classList.add('in-check');
      button.setAttribute('aria-label',square+(piece?' · '+(piece.color==='w'?'білий ':'чорний ')+names[piece.type]:''));if(piece){const span=document.createElement('span');span.className='piece '+(piece.color==='w'?'white':'black');span.textContent=symbols[piece.color][piece.type];button.append(span);}
      if(col===0){const span=document.createElement('span');span.className='coord rank';span.textContent=y+1;button.append(span);}if(row===7){const span=document.createElement('span');span.className='coord file';span.textContent=FILES[x];button.append(span);}fragment.append(button);
    }board.replaceChildren(fragment);renderArrows();
  }
  function renderPlayers(){
    for(const [position,color] of [['top',flipped?'w':'b'],['bottom',flipped?'b':'w']]){
      $(position+'Name').textContent=mode==='local'?(color==='w'?'Гравець 1':'Гравець 2'):(color===player?'Ти':'Ігровий бот');$(position+'Role').textContent=color==='w'?'Білі фігури':'Чорні фігури';$(position+'Turn').classList.toggle('active',!game.isGameOver()&&game.turn()===color);
      const avatar=$(position+'Name').parentElement.previousElementSibling;avatar.className='avatar '+(color==='w'?'light-avatar':'dark-avatar');avatar.textContent=color==='w'?'♔':'♚';
      const captured=game.history({verbose:true}).filter(m=>m.color===color&&m.captured).sort((a,b)=>C.VALUE[b.captured]-C.VALUE[a.captured]);$(position+'Captured').textContent=captured.map(m=>symbols[color==='w'?'b':'w'][m.captured]).join('');
    }
  }
  function status(){
    if(game.isCheckmate())return 'Мат. Перемогли '+(game.turn()==='w'?'чорні!':'білі!');
    if(game.isStalemate())return 'Пат · нічия';if(game.isThreefoldRepetition())return 'Нічия · повторення позиції';if(game.isInsufficientMaterial())return 'Нічия · недостатньо матеріалу';if(game.isDraw())return 'Нічия';
    if(busy)return mode==='bot'&&game.turn()!==player?'Бот обмірковує хід…':'Аналіз ходу…';
    return (game.turn()==='w'?'Хід білих':'Хід чорних')+(game.inCheck()?' · шах!':'');
  }
  function renderHistory(){
    const history=game.history(),root=$('moveHistory');root.replaceChildren();if(!history.length){const p=document.createElement('p');p.className='empty-history';p.textContent='Дошка чекає на твою ідею.';root.append(p);}
    for(let i=0;i<history.length;i+=2){const row=document.createElement('div');row.className='move-pair';const index=document.createElement('b');index.textContent=(i/2+1)+'.';row.append(index);for(let j=0;j<2;j++){const span=document.createElement('span');span.textContent=history[i+j]||'—';if(i+j===history.length-1)span.className='latest';row.append(span);}root.append(row);}root.scrollTop=root.scrollHeight;
  }
  function render(){renderBoard();renderPlayers();renderHistory();$('gameState').textContent=status();$('thinkingDot').classList.toggle('busy',busy);$('undoMove').disabled=!game.history().length;$('botSettings').classList.toggle('hidden',mode!=='bot');$('chessMode').value=mode;$('playerColor').value=player;$('botLevel').value=level;}
  function showQuality(result,san){
    const root=$('moveQuality');root.replaceChildren();const symbol=document.createElement('span'),box=document.createElement('div'),name=document.createElement('strong'),copy=document.createElement('small');root.style.setProperty('--quality',result?.color||'#afc3bd');symbol.textContent=result?.symbol||'·';name.textContent=result?result.label:'Аналіз недоступний';copy.textContent=result?`${san} · кращий за пошуком: ${result.bestSan} · глибина ${result.depth}`:'Ходи та правила працюють. Спробуй нову партію для відновлення аналізу.';box.append(name,copy);root.append(symbol,box);
    if(result){const score=Math.max(-1500,Math.min(1500,result.score));$('evalFill').style.height=(50+45*Math.tanh(score/500))+'%';$('evalText').textContent=Math.abs(result.score)>C.MATE-100?'M':(result.score>=0?'+':'')+(result.score/100).toFixed(1);$('evalBar').setAttribute('aria-label','Приблизна оцінка білих '+$('evalText').textContent);}
  }
  function canMove(){return !busy&&!game.isGameOver()&&!promotion&&(mode==='local'||game.turn()===player);}
  async function play(move,fromBot=false){
    if(!fromBot&&!canMove())return;const token=generation,fen=game.fen();let played;try{played=game.move(move);}catch{return;}if(!played)return;selected=null;legal=[];arrows=[];busy=true;store();render();
    const quality=await calculate('analyze',fen,played,{depth:3,maxNodes:16000,timeMs:1500});if(token!==generation)return;showQuality(quality,played.san);busy=false;render();if(!fromBot)await botTurn();
  }
  async function botTurn(){
    if(mode!=='bot'||game.turn()===player||game.isGameOver())return;const token=generation,fen=game.fen();busy=true;render();
    const result=await calculate('search',fen,null,{depth:level,maxNodes:level===3?42000:9000,timeMs:level===3?2500:900});if(token!==generation||game.fen()!==fen)return;busy=false;
    const move=result?.move||C.moveData(game.moves({verbose:true})[0]);if(move)await play(move,true);else render();
  }
  function selectSquare(square){
    if(!canMove()||!square)return;const piece=game.get(square),moves=legal.filter(m=>m.to===square);
    if(selected&&moves.length){if(moves.some(m=>m.promotion)){promotion={from:selected,to:square,color:game.turn()};$('promotionChoices').replaceChildren();for(const type of ['q','r','b','n']){const button=document.createElement('button');button.type='button';button.textContent=symbols[promotion.color][type];button.setAttribute('aria-label',names[type]);button.addEventListener('click',()=>{const move={from:promotion.from,to:promotion.to,promotion:type};promotion=null;$('promotionDialog').close();play(move);});$('promotionChoices').append(button);}$('promotionDialog').showModal();return;}play({from:selected,to:square});return;}
    if(piece?.color===game.turn()){selected=selected===square?null:square;legal=selected?game.moves({square:selected,verbose:true}):[];}else{selected=null;legal=[];}renderBoard();
  }
  function reaction(emoji){const color=mode==='local'?game.turn():player,position=(color===(flipped?'w':'b'))?'top':'bottom',target=$(position+'Emotion');clearTimeout(emotionTimers.get(position));const text=document.createElement('span');text.className='visually-hidden';text.textContent=emoji;target.replaceChildren(text,emotionIcon(emoji));target.dataset.emotion=emoji;target.classList.remove('visible');void target.offsetWidth;target.classList.add('visible');emotionTimers.set(position,setTimeout(()=>target.classList.remove('visible'),2200));}
  function newGame(){cancelWork();game=new C.Chess();selected=null;legal=[];arrows=[];promotion=null;if($('promotionDialog').open)$('promotionDialog').close();flipped=mode==='bot'&&player==='b';$('moveQuality').style.removeProperty('--quality');$('moveQuality').innerHTML='<span>♟</span><div><strong>Нова партія</strong><small>Зроби свій перший хід.</small></div>';$('evalFill').style.height='50%';$('evalText').textContent='0.0';store();render();botTurn();}
  const board=$('chessBoard');board.addEventListener('click',event=>{if(performance.now()<suppressClickUntil||arrowMode||event.shiftKey)return;selectSquare(event.target.closest('[data-square]')?.dataset.square);});board.addEventListener('contextmenu',event=>event.preventDefault());
  board.addEventListener('pointerdown',event=>{if(event.button!==2&&!event.shiftKey&&!arrowMode)return;const square=squareAt(event);if(!square)return;event.preventDefault();arrowStart=square;arrowPointer=event.pointerId;board.setPointerCapture?.(event.pointerId);renderArrows({from:square,to:square});});
  board.addEventListener('pointermove',event=>{if(arrowStart&&event.pointerId===arrowPointer){event.preventDefault();const to=squareAt(event);if(to)renderArrows({from:arrowStart,to});}});
  board.addEventListener('pointerup',event=>{if(!arrowStart||event.pointerId!==arrowPointer)return;const to=squareAt(event);if(to){const index=arrows.findIndex(a=>a.from===arrowStart&&a.to===to);if(index>=0)arrows.splice(index,1);else{if(arrows.length>=32)arrows.shift();arrows.push({from:arrowStart,to});}}arrowStart=null;arrowPointer=null;suppressClickUntil=performance.now()+120;renderArrows();});
  board.addEventListener('pointercancel',()=>{arrowStart=null;arrowPointer=null;renderArrows();});
  $('arrowMode').addEventListener('click',()=>{arrowMode=!arrowMode;$('arrowMode').setAttribute('aria-pressed',String(arrowMode));});$('clearArrows').addEventListener('click',()=>{arrows=[];renderArrows();});$('flipBoard').addEventListener('click',()=>{flipped=!flipped;store();render();});
  $('undoMove').addEventListener('click',()=>{if(!game.history().length)return;cancelWork();game.undo();if(mode==='bot'&&game.turn()!==player&&game.history().length)game.undo();selected=null;legal=[];arrows=[];store();showQuality(null);render();botTurn();});
  $('newGame').addEventListener('click',newGame);$('chessMode').addEventListener('change',()=>{mode=$('chessMode').value==='local'?'local':'bot';newGame();});$('playerColor').addEventListener('change',()=>{player=$('playerColor').value==='b'?'b':'w';newGame();});$('botLevel').addEventListener('change',()=>{level=Number($('botLevel').value)||2;store();});
  function cancelPromotion(){promotion=null;$('promotionDialog').close();} $('cancelPromotion').addEventListener('click',cancelPromotion);$('promotionDialog').addEventListener('cancel',()=>promotion=null);
  document.querySelectorAll('button[data-emotion]').forEach(button=>{button.setAttribute('aria-label',button.title);button.firstChild.replaceWith(emotionIcon(button.dataset.emotion));button.addEventListener('click',()=>reaction(button.dataset.emotion));});
  document.addEventListener('keydown',event=>{if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,select,textarea,[contenteditable=true]'))return;const emoji={KeyJ:'😠',KeyF:'👍',KeyH:'🤔',KeyK:'😂'}[event.code];if(emoji){event.preventDefault();reaction(emoji);}});
  $('downloadPgn').addEventListener('click',()=>{const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([game.pgn()],{type:'application/x-chess-pgn'}));link.download='bruk-chess.pgn';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);});
  window.addEventListener('pagehide',()=>{store();worker?.terminate();for(const timer of emotionTimers.values())clearTimeout(timer);});
  restore();bootWorker();render();botTurn();
})();
