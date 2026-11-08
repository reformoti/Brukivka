import {ownerName} from './owner.mjs';
import {randomBytes,randomUUID,scrypt as rawScrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
import {R} from './world.mjs';
const scrypt=promisify(rawScrypt),cookieName='homow_session',life=30*86400000;
export const normalizeName=v=>typeof v==='string'&&/^[a-z0-9_]{3,24}$/.test(v.normalize('NFKC').trim().toLowerCase())?v.normalize('NFKC').trim().toLowerCase():null;
export const validPassword=v=>typeof v==='string'&&v.length>=6&&v.length<=128;
const digest=v=>createHash('sha256').update(v).digest('hex');
export async function passwordHash(password,salt=randomBytes(16).toString('hex')){return {salt,hash:(await scrypt(password,salt,64,{N:65536,r:8,p:1,maxmem:128*1024*1024})).toString('hex')};}
export async function verifyPassword(password,record){const derived=await passwordHash(password,record?.salt||'0'.repeat(32)),expected=record?.password_hash||'0'.repeat(128);return timingSafeEqual(Buffer.from(derived.hash,'hex'),Buffer.from(expected,'hex'))&&!!record;}
export async function migrateAccounts(pool){await pool.query(await readFile(new URL('./accounts.sql',import.meta.url),'utf8'));}
export function createAccounts(pool,origin,onLogout=()=>{}){
 let hashing=0;const attempts=new Map();
 const cookie=(token,age=life/1000)=>`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${origin.startsWith('https:')?'; Secure':''}`;
 const readToken=req=>{const value=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);return /^[a-f0-9]{64}$/.test(value||'')?value:null;};
 async function session(req){const token=readToken(req);if(!token)return null;const r=await pool.query('SELECT p.id,p.username,s.token_hash FROM homow_sessions s JOIN homow_players p ON p.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2',[digest(token),Date.now()]);return r.rows[0]||null;}
 async function issue(res,id){const token=randomBytes(32).toString('hex');await pool.query('DELETE FROM homow_sessions WHERE expires_at<$1',[Date.now()]);await pool.query('INSERT INTO homow_sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',[digest(token),id,Date.now()+life]);res.setHeader('Set-Cookie',cookie(token));}
 async function handle(req,res,path){
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
 if(path==='/api/auth/session'&&req.method==='GET'){const s=await session(req);send(200,{username:s?.username||null});return;}
 if(req.method!=='POST'){send(405,{error:'Method not allowed'});return;}
 if(req.headers.origin!==origin){send(403,{error:'Невірне джерело запиту.'});return;}
 if(path==='/api/auth/logout'){const token=readToken(req),s=await session(req);if(token)await pool.query('DELETE FROM homow_sessions WHERE token_hash=$1',[digest(token)]);res.setHeader('Set-Cookie',cookie('',0));if(s)onLogout(s.id);send(200,{ok:true});return;}
 if(!['/api/auth/register','/api/auth/login'].includes(path)){send(404,{error:'Not found'});return;}
 let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>2048){send(413,{error:'Запит завеликий.'});return;}}
 let data;try{data=JSON.parse(body);}catch{send(400,{error:'Невірний запит.'});return;}
 if(!data||typeof data!=='object'||Array.isArray(data)){send(400,{error:'Невірний запит.'});return;}
 const name=normalizeName(data.username),password=data.password;if(!name||!validPassword(password)){send(400,{error:'Логін: 3–24 латинські літери, цифри або _. Пароль: 6–128 символів.'});return;}
 if(path==='/api/auth/register'&&name===ownerName){send(409,{error:'Цей логін недоступний.'});return;}
 const now=Date.now();for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);const rateKey=path+':'+name,rate=attempts.get(rateKey)||{count:0,until:now+60000};
 if(rate.count>=6||attempts.size>=4096||hashing>=2){send(429,{error:'Забагато спроб. Спробуй за хвилину.'});return;}rate.count++;attempts.set(rateKey,rate);hashing++;
 try{
 if(path==='/api/auth/login'){const r=await pool.query('SELECT p.id,p.username,a.salt,a.password_hash FROM homow_players p JOIN homow_passwords a ON a.user_id=p.id WHERE lower(p.username)=$1',[name]);if(!await verifyPassword(password,r.rows[0])){send(401,{error:'Невірний логін або пароль.'});return;}await issue(res,r.rows[0].id);send(200,{username:r.rows[0].username});return;}

 const record=await passwordHash(password),id=randomUUID(),client=await pool.connect();
 try{await client.query('BEGIN');await client.query('INSERT INTO homow_players(id,username,state) VALUES($1,$2,$3)',[id,name,JSON.stringify(R.normalize({}))]);await client.query('INSERT INTO homow_passwords(user_id,salt,password_hash) VALUES($1,$2,$3)',[id,record.salt,record.hash]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');if(e.code==='23505'){send(409,{error:'Цей логін уже зайнятий. Старі ніки зарезервовані за їх власниками.'});return;}throw e;}finally{client.release();}
 await issue(res,id);send(201,{username:name});
 }finally{hashing--;}
 }
 return {handle,session,issue};
}
