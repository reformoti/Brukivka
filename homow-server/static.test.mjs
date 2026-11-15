import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,utimes} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {gunzipSync,brotliDecompressSync} from 'node:zlib';import {staticResponder,bufferResponder,encodingFor} from './static.mjs';
function response(){const headers=new Map();return {status:200,headers,setHeader(name,value){headers.set(name.toLowerCase(),String(value));},writeHead(status){this.status=status;},end(bytes){this.body=bytes||Buffer.alloc(0);}};}
const request=(headers={},method='GET')=>({method,headers});
test('encoding negotiation handles q=0, wildcard, preference and identity exclusion',()=>{for(const [header,value]of [['','identity'],['br,gzip','br'],['br;q=0,gzip','gzip'],['br;q=.2,gzip;q=.8','gzip'],['*;q=0',null],['identity;q=0,gzip;q=0',null],['gzip;q=0','identity'],['br;q=.5,identity;q=1','identity']])assert.equal(encodingFor(header),value,header);});
test('public shell gzip/brotli round-trip exactly; validators, HEAD and 406 have no body',async()=>{
 const bytes=Buffer.from('<html>Шрифти, повна гра, весь контент</html>'.repeat(100)),serve=bufferResponder(bytes,'text/html',new Date('2026-11-15T00:00:00Z'));
 for(const encoding of ['gzip','br','identity']){const headers={'accept-encoding':encoding},r=response();await serve(request(headers),r);assert.equal(r.status,200);const unpack=encoding==='gzip'?gunzipSync:encoding==='br'?brotliDecompressSync:x=>x;assert.deepEqual(unpack(r.body),bytes);assert.equal(r.headers.get('vary'),'Accept-Encoding');const cached=response();await serve(request({...headers,'if-none-match':'W/'+r.headers.get('etag')}),cached);assert.equal(cached.status,304);assert.equal(cached.body.length,0);const head=response();await serve(request(headers,'HEAD'),head);assert.equal(head.body.length,0);assert.equal(head.headers.get('content-length'),r.headers.get('content-length'));}
 const no=response();await serve(request({'accept-encoding':'*;q=0'}),no);assert.equal(no.status,406);assert.equal(no.body.length,0);
 const modified=response();await serve(request({'if-modified-since':'Sun, 15 Nov 2026 00:00:00 GMT'}),modified);assert.equal(modified.status,304);
 const precedence=response();await serve(request({'if-none-match':'"other"','if-modified-since':'Sun, 15 Nov 2030 00:00:00 GMT'}),precedence);assert.equal(precedence.status,200);
});
test('static file cache refreshes after a deployment and never serves deleted files',async t=>{
 const root=await mkdtemp(join(tmpdir(),'homow-static-'));t.after(()=>rm(root,{recursive:true,force:true}));const file=join(root,'client.js'),serve=staticResponder({maxBytes:100,maxEntries:1});await writeFile(file,'first');const a=response();await serve(request(),a,file,'text/javascript',true);assert.equal(a.body.toString(),'first');assert.match(a.headers.get('cache-control'),/immutable/);
 await writeFile(file,'second');await utimes(file,new Date(),new Date(Date.now()+2000));const b=response();await serve(request({'if-none-match':a.headers.get('etag')}),b,file,'text/javascript');assert.equal(b.status,200);assert.equal(b.body.toString(),'second');assert.notEqual(a.headers.get('etag'),b.headers.get('etag'));assert(!b.headers.get('cache-control').includes('immutable'));
 await rm(file);const missing=response();await serve(request(),missing,file,'text/javascript');assert.equal(missing.status,404);
});
test('concurrent cold requests share compression and byte limits evict safely',async()=>{
 const serve=bufferResponder('game'.repeat(10000),'text/javascript');const results=await Promise.all(Array.from({length:12},async()=>{const r=response();await serve(request({'accept-encoding':'br'}),r);return r;}));assert(results.every(r=>r.body.equals(results[0].body)));assert.equal(brotliDecompressSync(results[0].body).toString(),'game'.repeat(10000));
 const invalid=response();await serve(request({},'POST'),invalid);assert.equal(invalid.status,405);
});
