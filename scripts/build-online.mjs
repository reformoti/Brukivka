import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const serverRequire=createRequire(new URL('../homow-server/server.mjs',import.meta.url));
for(const dependency of ['ws','pg']){await import(pathToFileURL(serverRequire.resolve(dependency)).href);console.log('Runtime dependency OK: '+dependency);}
import {spawnSync} from 'node:child_process';
for(const args of [['--check','homow-server/server.mjs'],['--check','homow-server/world.mjs'],['--check','homow-server/auth.mjs'],['--check','homow-server/accounts.mjs'],['--check','homow-server/pvp.mjs'],['--check','realms-core.js'],['--check','homow-music.js'],['--check','homow-online.js'],['--check','realms-ui.js'],['--test','homow-server/test.mjs']]){const r=spawnSync(process.execPath,args,{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
console.log('HoMoW build passed: server/client syntax and online simulation tests.');
