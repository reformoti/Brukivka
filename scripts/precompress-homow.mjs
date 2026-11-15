// Generate lossless transfer variants; the original HTML and assets are never replaced.
import {readFile,writeFile,stat,utimes} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync,brotliCompressSync,gunzipSync,brotliDecompressSync,constants} from 'node:zlib';
export async function precompress(root=resolve(fileURLToPath(new URL('../',import.meta.url)))){
 const paths=new Set(['homow.html','realms.html']);
 const html=await readFile(resolve(root,'realms.html'),'utf8');
 for(const m of html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g))if(/\.(?:js|css)$/.test(m[1]))paths.add(m[1]);
 for(const name of paths){if(!name.endsWith('.css'))continue;const css=await readFile(resolve(root,name),'utf8');for(const m of css.matchAll(/(?:url\(\s*['"]?)([^)'"?#]+)(?:[?#][^)'" ]*)?['"]?\s*\)/g)){if(/^(?:data:|https?:|\/\/)/.test(m[1]))continue;const file=resolve(root,dirname(name),m[1]),path=relative(root,file);if(path.startsWith('..')||! /\.(css|ttf|woff2)$/.test(path))continue;paths.add(path);}}
 const report=[];
 for(const name of paths){const file=resolve(root,name),bytes=await readFile(file),info=await stat(file),gzip=gzipSync(bytes,{level:9}),br=brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:11}});if(!gunzipSync(gzip).equals(bytes)||!brotliDecompressSync(br).equals(bytes))throw Error('Compression round-trip failed: '+name);for(const [suffix,value]of [['.gz',gzip],['.br',br]]){await writeFile(file+suffix,value);await utimes(file+suffix,info.atime,info.mtime);}report.push({file:name,original:bytes.length,gzip:gzip.length,brotli:br.length});}
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const report=await precompress();console.log(JSON.stringify({files:report.length,bundle:report.find(r=>r.file==='homow.html')},null,2));}
