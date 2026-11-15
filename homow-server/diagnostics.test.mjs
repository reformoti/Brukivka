import test from 'node:test';
import assert from 'node:assert/strict';
import {newDb} from 'pg-mem';
import WebSocket from 'ws';
import {createGameServer} from './server.mjs';

test('diagnostic echo requires authentication and preserves the authenticated session',async t=>{
  const {Pool}=newDb({noAstCoverageCheck:true}).adapters.createPg(),pool=new Pool();
  const expected='http://localhost:31120',app=await createGameServer(pool,expected);
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+app.server.address().port;
  let ws;t.after(async()=>{ws?.terminate();await app.stop();});
  const response=await fetch(origin+'/api/auth/register',{method:'POST',headers:{Origin:expected,'Content-Type':'application/json'},body:JSON.stringify({username:'latency_probe',password:'test-only-pass'})});
  assert.equal(response.status,201);const cookie=response.headers.get('set-cookie').split(';')[0],messages=[];
  ws=new WebSocket(origin.replace('http:','ws:')+'/ws',{origin:expected,headers:{Cookie:cookie}});
  ws.on('message',raw=>messages.push(JSON.parse(raw)));
  await new Promise((resolve,reject)=>{ws.on('open',resolve);ws.on('error',reject);});
  ws.send(JSON.stringify({type:'ping',at:123}));
  await new Promise(resolve=>setTimeout(resolve,60));
  assert.equal(messages.filter(m=>m.type==='pong').length,0);
  ws.send(JSON.stringify({type:'auth'}));
  const until=async fn=>{const end=Date.now()+5000;while(!fn()){assert(Date.now()<end,'Timed out');await new Promise(resolve=>setTimeout(resolve,20));}};
  await until(()=>messages.some(m=>m.type==='welcome'));
  ws.send(JSON.stringify({type:'ping',at:456.75}));
  await until(()=>messages.some(m=>m.type==='pong'));
  assert.deepEqual(messages.find(m=>m.type==='pong'),{type:'pong',at:456.75});
  await until(()=>messages.some(m=>m.type==='world'));
  assert.equal(ws.readyState,WebSocket.OPEN);
});
