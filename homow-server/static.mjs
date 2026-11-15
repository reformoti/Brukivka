/* Public static responses only. Never use this responder for account/API data. */
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {gzip,brotliCompress,constants} from 'node:zlib';
const zip=promisify(gzip),brotli=promisify(brotliCompress);
export function encodingFor(header=''){
 const values=new Map(String(header).toLowerCase().split(',').filter(Boolean).map(part=>{const [name,...parameters]=part.trim().split(';'),q=parameters.find(p=>p.trim().startsWith('q='));const n=q?Number(q.trim().slice(2)):1;return [name.trim(),Number.isFinite(n)&&n>=0&&n<=1?n:0];}));
 const quality=name=>values.get(name)??values.get('*')??0;
 const br=quality('br'),gz=quality('gzip'),identity=values.get('identity')??(values.get('*')===0?0:1);
 if(br>0&&br>=gz&&(!values.has('identity')||br>=identity))return 'br';
 if(gz>0&&(!values.has('identity')||gz>=identity))return 'gzip';
 return identity>0?'identity':null;
}
function entry(bytes,modified){return {bytes,modified,tag:createHash('sha256').update(bytes).digest('hex'),variants:new Map(),size:bytes.length};}
async function send(req,res,data,type,immutable=false){
 if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');res.writeHead(405);return res.end();}
 res.setHeader('Content-Type',type);res.setHeader('Cache-Control',immutable?'public, max-age=31536000, immutable':'public, max-age=0, must-revalidate');res.setHeader('Vary','Accept-Encoding');
 const encoding=encodingFor(req.headers['accept-encoding']);if(!encoding){res.writeHead(406);return res.end();}
 const etag='"'+data.tag+'-'+encoding+'"';res.setHeader('ETag',etag);res.setHeader('Last-Modified',data.modified.toUTCString());
 if(encoding!=='identity')res.setHeader('Content-Encoding',encoding);
 const matches=req.headers['if-none-match']?.split(',').some(tag=>tag.trim()==='*'||tag.trim().replace(/^W\//,'')===etag);
 const since=req.headers['if-modified-since'];
 if(matches||(!req.headers['if-none-match']&&since&&Math.floor(data.modified.getTime()/1000)<=Math.floor(Date.parse(since)/1000))){res.writeHead(304);return res.end();}
 let bytes=data.bytes;
 if(encoding!=='identity'){
  if(!data.variants.has(encoding)){
   const pending=(encoding==='br'?brotli(data.bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:5}}):zip(data.bytes,{level:6})).then(value=>{data.size+=value.length;return value;});
   data.variants.set(encoding,pending);pending.catch(()=>data.variants.delete(encoding));
  }
  bytes=await data.variants.get(encoding);
 }
 res.setHeader('Content-Length',bytes.length);if(req.method==='HEAD')return res.end();res.end(bytes);
}
export function bufferResponder(bytes,type,modified=new Date()){
 const data=entry(Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes),modified);
 return (req,res)=>send(req,res,data,type);
}
export function staticResponder({maxBytes=8*1024*1024,maxEntries=64}={}){
 const cache=new Map();
 function trim(){let size=[...cache.values()].reduce((sum,item)=>sum+(item.data?.size||0),0);for(const [key,item]of cache){if(cache.size<=maxEntries&&size<=maxBytes)break;cache.delete(key);size-=item.data?.size||0;}}
 return async(req,res,file,type,immutable=false)=>{
  let info;try{info=await stat(file);if(!info.isFile())throw Error();}catch{cache.delete(String(file));res.writeHead(404);return res.end();}
  const key=String(file),signature=info.mtimeMs+':'+info.ctimeMs+':'+info.size;let item=cache.get(key);
  if(!item||item.signature!==signature){
   item={signature};item.pending=readFile(file).then(bytes=>item.data=entry(bytes,info.mtime));cache.set(key,item);
   item.pending.catch(()=>{if(cache.get(key)===item)cache.delete(key);});
  }else {cache.delete(key);cache.set(key,item);}
  const data=await item.pending;try{return await send(req,res,data,type,immutable);}finally{trim();}
 };
}
