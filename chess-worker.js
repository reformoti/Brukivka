'use strict';
importScripts('vendor/chess.js?v=5.0.0','chess-core.js?v=5.0.0');
self.onmessage=({data})=>{
  try{const result=data.type==='analyze'?BrukChess.analyze(data.fen,data.move,data.options):BrukChess.search(data.fen,data.options);self.postMessage({id:data.id,result});}
  catch(error){self.postMessage({id:data.id,error:error.message});}
};
