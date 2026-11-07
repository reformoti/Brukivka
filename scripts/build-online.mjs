import {spawnSync} from 'node:child_process';
for(const args of [['--check','homow-server/server.mjs'],['--check','homow-server/world.mjs'],['--check','homow-server/auth.mjs'],['--check','homow-server/public/client.js'],['--test','homow-server/test.mjs']]){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
console.log('HoMoW build passed: server/client syntax and online simulation tests.');
