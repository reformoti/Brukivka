// XaR credentials share existing account IDs, so old saves and HoMoW ownership stay intact.
export const XAR_SESSION_SECONDS=30*24*60*60;
const XAR_SESSION='__Host-xar_session',XAR_SIGNED_OUT='__Host-xar_signed_out',XAR_ITERATIONS=100000,XAR_WINDOW=15*60*1000;
const xarEncode=new TextEncoder(),xarHex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const xarRandom=bytes=>xarHex(crypto.getRandomValues(new Uint8Array(bytes)));
export const xarUsername=v=>typeof v==='string'&&/^[a-z0-9_]{3,24}$/.test(v.normalize('NFKC').trim().toLowerCase())?v.normalize('NFKC').trim().toLowerCase():null;
export function gmailAddress(v){if(typeof v!=='string')return null;const value=v.trim().toLowerCase();if(value.length>254||!/^[-a-z0-9._+]+@(gmail|googlemail)\.com$/.test(value))return null;const local=value.split('@')[0].split('+')[0].replaceAll('.','');return /^[a-z0-9]{1,64}$/.test(local)?local+'@gmail.com':null}
function xarCookies(req){return Object.fromEntries((req.headers.get('cookie')||'').split(';').map(v=>v.trim().split('=')).filter(v=>v.length===2))}
export async function xarDigest(value){return xarHex(await crypto.subtle.digest('SHA-256',xarEncode.encode(value)))}
function xarReply(data,status=200,cookies=[]){const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});for(const cookie of cookies)headers.append('Set-Cookie',cookie);return new Response(JSON.stringify(data),{status,headers})}
const xarCookie=(name,value,maxAge)=>name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+maxAge;
function xarPepper(env){if(typeof env.XAR_AUTH_PEPPER!=='string'||env.XAR_AUTH_PEPPER.length<32)throw Error('XaR Cloud: вхід із паролем тимчасово недоступний.');return env.XAR_AUTH_PEPPER}
export async function passwordHash(password,salt,env){const pepperKey=await crypto.subtle.importKey('raw',xarEncode.encode(xarPepper(env)),{name:'HMAC',hash:'SHA-256'},false,['sign']);const secret=await crypto.subtle.sign('HMAC',pepperKey,xarEncode.encode(password));const key=await crypto.subtle.importKey('raw',secret,'PBKDF2',false,['deriveBits']);return xarHex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:XAR_ITERATIONS,salt:xarEncode.encode(salt)},key,256))}
function xarEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==64||b.length!==64)return false;let mismatch=0;for(let i=0;i<64;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);return mismatch===0}
export async function resolveIdentity(req,env){const cookies=xarCookies(req),token=cookies[XAR_SESSION];if(token&&/^[a-f0-9]{64}$/.test(token)&&env.DB){const session=await env.DB.prepare('SELECT user_id FROM xar_sessions WHERE token_hash=? AND expires_at>?').bind(await xarDigest(token),Date.now()).first();if(session)return{id:session.user_id,kind:'password'}}if(cookies[XAR_SIGNED_OUT]==='1')return null;const id=req.headers.get('oai-authenticated-user-id');return id?{id,kind:'platform'}:null}
async function xarLimit(req,env,name,limit){const now=Date.now(),window=now-now%XAR_WINDOW,ip=req.headers.get('cf-connecting-ip')||'unknown';await env.DB.prepare('DELETE FROM xar_auth_attempts WHERE window_start<?').bind(window-XAR_WINDOW).run();for(const [part,max]of [['ip:'+ip,60],['name:'+name,limit]]){const key=await xarDigest(xarPepper(env)+':'+part);const row=await env.DB.prepare('INSERT INTO xar_auth_attempts(key_hash,window_start,hits) VALUES(?,?,1) ON CONFLICT(key_hash) DO UPDATE SET hits=CASE WHEN window_start=excluded.window_start THEN hits+1 ELSE 1 END,window_start=excluded.window_start RETURNING hits').bind(key,window).first();if(row.hits>max)return false}return true}
async function xarIssue(req,env,id){const old=xarCookies(req)[XAR_SESSION];if(/^[a-f0-9]{64}$/.test(old||''))await env.DB.prepare('DELETE FROM xar_sessions WHERE token_hash=?').bind(await xarDigest(old)).run();const now=Date.now(),token=xarRandom(32);await env.DB.prepare('DELETE FROM xar_sessions WHERE expires_at<=?').bind(now).run();await env.DB.prepare('DELETE FROM xar_sessions WHERE user_id=? AND token_hash IN (SELECT token_hash FROM xar_sessions WHERE user_id=? ORDER BY created_at DESC,token_hash DESC LIMIT -1 OFFSET 7)').bind(id,id).run();await env.DB.prepare('INSERT INTO xar_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)').bind(await xarDigest(token),id,now,now+XAR_SESSION_SECONDS*1000).run();return[xarCookie(XAR_SESSION,token,XAR_SESSION_SECONDS),xarCookie(XAR_SIGNED_OUT,'',0)]}
export async function authApi(req,env){
 const url=new URL(req.url);if(!env.DB)return xarReply({error:'База даних ще не підключена.'},503);
 if(url.pathname==='/api/auth/context'&&req.method==='GET'){const id=req.headers.get('oai-authenticated-user-id');if(!id)return xarReply({platform:null});const account=await env.DB.prepare('SELECT username FROM accounts WHERE user_id=?').bind(id).first(),credentials=await env.DB.prepare('SELECT gmail FROM xar_credentials WHERE user_id=?').bind(id).first();return xarReply({platform:{gmail:gmailAddress(req.headers.get('oai-authenticated-user-email')),username:account?.username||null,hasPassword:!!credentials}})}
 if(req.method!=='POST')return xarReply({error:'Method not allowed'},405);
 if(req.headers.get('origin')!==url.origin)return xarReply({error:'Невірне джерело запиту.'},403);
 if(url.pathname==='/api/auth/logout'){const token=xarCookies(req)[XAR_SESSION];if(/^[a-f0-9]{64}$/.test(token||''))await env.DB.prepare('DELETE FROM xar_sessions WHERE token_hash=?').bind(await xarDigest(token)).run();return xarReply({ok:true},200,[xarCookie(XAR_SESSION,'',0),xarCookie(XAR_SIGNED_OUT,'1',XAR_SESSION_SECONDS)])}
 if(!['/api/auth/login','/api/auth/bind','/api/auth/recover'].includes(url.pathname))return xarReply({error:'Не знайдено.'},404);
 let body;try{if(Number(req.headers.get('content-length')||0)>4096)return xarReply({error:'Запит завеликий.'},413);const raw=await req.text();if(xarEncode.encode(raw).length>4096)return xarReply({error:'Запит завеликий.'},413);body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error()}catch{return xarReply({error:'Невірний формат запиту.'},400)}
 try{xarPepper(env)}catch(error){return xarReply({error:error.message},503)}
 if(url.pathname==='/api/auth/login'){
  const name=xarUsername(body.username);if(!await xarLimit(req,env,name||'invalid',10))return xarReply({error:'Забагато спроб. Спробуй через 15 хвилин.'},429);
  const credentials=name?await env.DB.prepare('SELECT c.user_id,c.salt,c.password_hash,c.algorithm,a.username FROM xar_credentials c JOIN accounts a ON a.user_id=c.user_id WHERE lower(a.username)=?').bind(name).first():null;
  const password=typeof body.password==='string'&&body.password.length<=128?body.password:'';
  const candidate=await passwordHash(password,credentials?.salt||'00000000000000000000000000000000',env);
  if(!credentials||credentials.algorithm!=='pbkdf2-sha256-pepper-v1'||!xarEqual(candidate,credentials.password_hash))return xarReply({error:'Невірний логін або пароль.'},401);
  return xarReply({username:credentials.username},200,await xarIssue(req,env,credentials.user_id));
 }
 const platformId=req.headers.get('oai-authenticated-user-id'),gmail=gmailAddress(req.headers.get('oai-authenticated-user-email'));
 if(!platformId||!gmail)return xarReply({error:'Підтверди Gmail один раз через ChatGPT, щоб прив’язати акаунт.'},401);
 if(gmailAddress(body.gmail)!==gmail)return xarReply({error:'Gmail має збігатися з підтвердженим акаунтом ChatGPT.'},403);
 const name=xarUsername(body.username);if(!await xarLimit(req,env,'bind:'+platformId,12))return xarReply({error:'Забагато спроб. Спробуй через 15 хвилин.'},429);
 if(typeof body.password!=='string'||body.password.length<12||body.password.length>128)return xarReply({error:'Пароль: від 12 до 128 символів.'},400);
 const account=await env.DB.prepare('SELECT username FROM accounts WHERE user_id=?').bind(platformId).first(),credentials=await env.DB.prepare('SELECT gmail FROM xar_credentials WHERE user_id=?').bind(platformId).first();
 if(!name||account&&account.username!==name)return xarReply({error:account?'Використай поточний ігровий логін @'+account.username+'.':'Логін: 3–24 латинські літери, цифри або _.'},400);
 const recovery=url.pathname==='/api/auth/recover';
 if(recovery&&(!credentials||credentials.gmail!==gmail))return xarReply({error:'Цей Gmail не прив’язаний до цього акаунта.'},403);
 if(!recovery&&credentials)return xarReply({error:'Пароль уже встановлено. Увійди або віднови доступ.'},409);
 const salt=xarRandom(16),password_hash=await passwordHash(body.password,salt,env),now=Date.now();
 try{if(recovery){await env.DB.batch([env.DB.prepare('UPDATE xar_credentials SET salt=?,password_hash=?,updated_at=? WHERE user_id=?').bind(salt,password_hash,now,platformId),env.DB.prepare('DELETE FROM xar_sessions WHERE user_id=?').bind(platformId)])}else{const statements=[];if(!account)statements.push(env.DB.prepare('INSERT INTO accounts(user_id,username,created_at) VALUES(?,?,?)').bind(platformId,name,now));statements.push(env.DB.prepare('INSERT INTO xar_credentials(user_id,gmail,salt,password_hash,algorithm,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(platformId,gmail,salt,password_hash,'pbkdf2-sha256-pepper-v1',now,now));await env.DB.batch(statements)}}catch(error){if(/UNIQUE|constraint/i.test(String(error)))return xarReply({error:'Логін або Gmail уже використовується.'},409);throw error}
 return xarReply({username:name,gmail},200,await xarIssue(req,env,platformId));
}
