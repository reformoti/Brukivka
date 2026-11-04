(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./vendor/chess.js'));
  else root.BrukChess=factory(root.ChessRules);
})(typeof window==='undefined'?globalThis:window,function(rules){
  'use strict';
  const {Chess}=rules,VALUE={p:100,n:320,b:335,r:500,q:900,k:0},MATE=100000;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const moveData=m=>({from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion}:{})});
  function evaluate(game){
    let score=0,phase=0;const board=game.board();for(const row of board)for(const p of row)if(p&&p.type!=='p'&&p.type!=='k')phase+=VALUE[p.type];
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){
      const p=board[y][x];if(!p)continue;
      const advance=p.color==='w'?6-y:y-1,center=7-(Math.abs(x-3.5)+Math.abs(y-3.5));let position=0;
      if(p.type==='p')position=advance*9+center*3+(x>1&&x<6?5:0);
      if(p.type==='n')position=center*13-(y===0||y===7?12:0);
      if(p.type==='b')position=center*7+advance*2;
      if(p.type==='r')position=(advance===5?22:0)+center*2;
      if(p.type==='q')position=center*3;
      if(p.type==='k')position=phase>2400?-center*10-(advance>0?18:0):center*11;
      score+=(p.color==='w'?1:-1)*(VALUE[p.type]+position);
    }
    return Math.round(score);
  }
  function order(moves){return moves.sort((a,b)=>priority(b)-priority(a));}
  function priority(m){return (m.captured?10000+10*VALUE[m.captured]-VALUE[m.piece]:0)+(m.promotion?8000+VALUE[m.promotion]:0)+(m.san.includes('+')?90:0)+(m.san.includes('#')?1000000:0);}
  function terminal(game,ply){if(game.isCheckmate())return -MATE+ply;if(game.isDraw())return 0;return null;}
  function tick(ctx){ctx.nodes++;if(ctx.nodes>ctx.maxNodes||(ctx.nodes%128===0&&Date.now()>ctx.deadline))throw ctx.abort;}
  function negamax(game,depth,alpha,beta,ply,ctx){
    tick(ctx);const end=terminal(game,ply);if(end!==null)return end;
    if(depth<=0)return (game.turn()==='w'?1:-1)*evaluate(game);
    let best=-Infinity;
    for(const m of order(game.moves({verbose:true}))){
      game.move(moveData(m));let score;try{score=-negamax(game,depth-1,-beta,-alpha,ply+1,ctx);}finally{game.undo();}
      best=Math.max(best,score);alpha=Math.max(alpha,score);if(alpha>=beta)break;
    }
    return best===-Infinity?0:best;
  }
  function search(fen,options={}){
    const game=new Chess(fen),end=terminal(game,0),moves=order(game.moves({verbose:true}));
    if(!moves.length||end!==null)return {move:null,score:end||0,depth:0,nodes:0,lines:[]};
    const depth=clamp(Math.floor(options.depth||2),1,3),ctx={nodes:0,maxNodes:clamp(options.maxNodes||28000,100,100000),deadline:Date.now()+clamp(options.timeMs||1800,50,8000),abort:{}};
    let result={move:moveData(moves[0]),score:(game.turn()==='w'?1:-1)*evaluate(game),depth:0,nodes:0,lines:[]};
    for(let d=1;d<=depth;d++){
      const lines=[];let alpha=-Infinity;
      try{
        for(const m of moves){game.move(moveData(m));let score;try{score=-negamax(game,d-1,-Infinity,-alpha,1,ctx);}finally{game.undo();}lines.push({move:moveData(m),san:m.san,score});alpha=Math.max(alpha,score);}
      }catch(error){if(error!==ctx.abort)throw error;break;}
      lines.sort((a,b)=>b.score-a.score);result={move:lines[0].move,score:lines[0].score,depth:d,nodes:ctx.nodes,lines};
      moves.sort((a,b)=>(lines.find(l=>l.move.from===b.from&&l.move.to===b.to&&l.move.promotion===b.promotion)?.score||0)-(lines.find(l=>l.move.from===a.from&&l.move.to===a.to&&l.move.promotion===a.promotion)?.score||0));
      if(Math.abs(result.score)>MATE-100)break;
    }
    result.nodes=ctx.nodes;return result;
  }
  function classify(loss,{mate=false,draw=false,sacrifice=false,depth=0,unique=false}={}){
    if(mate)return {key:'mate',symbol:'#',label:'Мат',color:'#c8dfa8'};
    if(draw)return {key:'draw',symbol:'½',label:'Нічия',color:'#b7c6cf'};
    if(depth<1)return {key:'pending',symbol:'·',label:'Без оцінки',color:'#a9bac6'};
    if(sacrifice&&depth>=3&&unique&&loss<=25)return {key:'brilliant',symbol:'!!',label:'Блискучий хід',color:'#83ded2'};
    if(loss<=25)return {key:'best',symbol:'★',label:'Найкращий хід',color:'#b4d99f'};
    if(loss<=65)return {key:'good',symbol:'✓',label:'Хороший хід',color:'#a6c8a7'};
    if(loss<=150)return {key:'inaccuracy',symbol:'?!',label:'Неточність',color:'#e1cd8c'};
    if(loss<=300)return {key:'mistake',symbol:'?',label:'Помилка',color:'#dfa57b'};
    return {key:'blunder',symbol:'??',label:'Груба помилка',color:'#e49292'};
  }
  function analyze(fen,move,options={}){
    const game=new Chess(fen),color=game.turn(),best=search(fen,{depth:options.depth||3,maxNodes:options.maxNodes||18000,timeMs:options.timeMs||1600});
    const played=game.move(moveData(move));
    if(!played)throw new Error('Illegal move');
    const mate=game.isCheckmate(),draw=game.isDraw();
    let playedScore;
    const bestMove=best.move,matching=bestMove&&bestMove.from===played.from&&bestMove.to===played.to&&bestMove.promotion===played.promotion;
    if(mate)playedScore=MATE-1;
    else if(draw)playedScore=0;
    else if(matching)playedScore=best.score;
    else if(best.depth>1)playedScore=-search(game.fen(),{depth:best.depth-1,maxNodes:options.maxNodes||18000,timeMs:options.timeMs||1600}).score;
    else playedScore=(color==='w'?1:-1)*evaluate(game);
    const loss=Math.max(0,best.score-playedScore);
    const sacrifice=game.moves({verbose:true}).some(m=>m.captured&&VALUE[m.captured]>VALUE[m.piece]+90&&m.to===played.to);
    const unique=best.lines.length>1&&best.lines[0].score-best.lines[1].score>=60;
    const quality=classify(loss,{mate,draw,sacrifice,depth:best.depth,unique});
    return {...quality,loss:Math.round(loss),score:Math.round(playedScore)*(color==='w'?1:-1),best:best.move,bestSan:best.lines[0]?.san||'—',depth:best.depth,nodes:best.nodes};
  }
  return {Chess,VALUE,MATE,evaluate,search,analyze,classify,moveData};
});
