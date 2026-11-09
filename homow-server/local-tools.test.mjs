import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';import vm from 'node:vm';import {parseHTML} from 'linkedom';
const require=createRequire(import.meta.url),T=require('../local-tools-core.js'),R=require('../realms-core.js');
test('local tools preserve unrelated purchases, reject unknown actions and never charge the balance',()=>{
  const s={balance:-100,pcUpgrades:{},monitorTier:0,islands:{old:true},mining:{licenses:[],running:true},estate:{rooms:[1]},wallpapersOwned:[3]};
  const c={brick:27,phone:25,strength:5,pocket:10,monitor:4,cpu:5,gpu:30,ram:5,tests:{math:32,english:32},routes:[0,1,2],wallpapers:[1,2,3],games:['mines','orbit'],islands:['palm']};
  const before=JSON.stringify(s);assert(!T.apply(s,'unknown',c));assert.equal(JSON.stringify(s),before);
  assert(T.apply(s,'maxUpgrades',c));assert.equal(s.balance,-100);assert.equal(s.pcUpgrades.gpu,30);assert.deepEqual(s.estate,{rooms:[1]});assert(T.apply(s,'maxNmt',c));assert.equal(s.attempted.math,true);assert.equal(s.tests.math,32);assert(T.apply(s,'unlockAll',c));assert(s.islands.old&&s.islands.palm);assert(s.mining.running);assert.deepEqual(s.deliveryOwned,[0,1,2]);assert(T.apply(s,'add500k',c));assert.equal(s.balance,499900);
});
test('local HoMoW commands retain gear and clamp levels; rejected commands change nothing',()=>{
  const w=new R.World({level:2,silver:400}),gear=JSON.stringify(w.state.variantArsenal);assert(T.realm(w,'UPLVL(200)',R));assert.equal(w.state.level,100);assert(T.realm(w,'DOWNLVL(300)',R));assert.equal(w.state.level,1);assert.equal(w.state.xp,0);assert(T.realm(w,'GIVEMONEY(500000)',R));assert.equal(w.state.silver,500400);assert.equal(JSON.stringify(w.state.variantArsenal),gear);
  const before=JSON.stringify(w.save());for(const cmd of ['UPLVL(-1)','UPLVL(1.5)','GIVEMONEY(100000000)','toString(1)','UPLVL(0)'])assert(!T.realm(w,cmd,R));assert.equal(JSON.stringify(w.save()),before);
});
test('plain account text opens the phone tools, grants affect only the selected local game',async()=>{
  const {window}=parseHTML(readFileSync(new URL('../index.html',import.meta.url),'utf8')),document=window.document,storage=new Map([['brukivka_realms_v1',JSON.stringify(new R.World({silver:100}).save())]]),actions=[];
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.getAttribute('data-value')||'brukivka';},set(v){this.setAttribute('data-value',v);}});
  const env={document,console,crypto,Date,JSON,Promise,BrukCloudCore:{},BrukCloudRaw:{},BrukRelease:{version:'6.19.0'},BrukRealms:R,BrukLocalToolsCore:T,BrukLocalTools:{apply:a=>(actions.push(a),true)},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener(){}};env.window=env;
  for(const name of ['cloud-account.js','local-tools.js'])vm.runInNewContext(readFileSync(new URL('../'+name,import.meta.url),'utf8'),env);
  const entry=document.getElementById('accountToolsEntry');assert(entry);assert.equal(entry.textContent,'ChatGPT');assert(entry.classList.contains('account-text-link'));assert(entry.closest('details').querySelector('summary').textContent.includes('Що входить'));assert(document.getElementById('localToolsScreen').classList.contains('hidden'));
  entry.click();assert(!document.getElementById('localToolsScreen').classList.contains('hidden'));assert(document.getElementById('accountScreen').classList.contains('hidden'));document.querySelector('[data-local-tool=add500k]').click();assert.deepEqual(actions,['add500k']);
  const select=document.getElementById('localToolsGame');select.value='homow';select.onchange();assert(document.getElementById('brukivkaTools').hidden);document.querySelector('[data-local-tool=add500k]').click();await new Promise(r=>setTimeout(r,0));assert.equal(JSON.parse(storage.get('brukivka_realms_v1')).silver,500100);assert(storage.has('brukivka_homow_tools_v1'));document.querySelector('[data-local-tool=add100m]').click();await new Promise(r=>setTimeout(r,0));assert.equal(JSON.parse(storage.get('brukivka_realms_v1')).silver,100000000);assert.deepEqual(actions,['add500k']);
});
test('PC archive contains every changelog release once and the current phone description',()=>{
  const {window}=parseHTML(readFileSync(new URL('../index.html',import.meta.url),'utf8')),document=window.document,env={document,BrukRelease:{version:'6.19.0',name:'HoMoW HUD & Phone Tools'}};env.window=env;
  vm.runInNewContext(readFileSync(new URL('../release-history.js',import.meta.url),'utf8'),env);const versions=[...readFileSync(new URL('../CHANGELOG.md',import.meta.url),'utf8').matchAll(/^# v([\d.]+)/gm)].map(m=>m[1]);for(const v of versions)assert.equal(document.querySelectorAll('[data-release-version="'+v+'"]').length,1);assert.equal(document.querySelector('.history-timeline').firstElementChild.dataset.releaseVersion,'6.19.0');assert(document.querySelector('.release-card p').textContent.includes('HoMoW'));
});
