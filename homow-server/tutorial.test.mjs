import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{parseHTML}=require('linkedom'),T=require('../tutorial.js');
const base=()=>({balance:0,earned:0,brick:0,route:0,pc:false,order:{active:false,completed:false,target:6,progress:0},upgradeCost:400,routeCost:2500});
function setup(s=base(),stored=null){
 const {window}=parseHTML(readFileSync(new URL('../index.html',import.meta.url),'utf8'));const {document}=window;
 window.Element.prototype.getBoundingClientRect=()=>({left:10,right:100,top:10,bottom:100,width:90,height:90});
 const route=document.createElement('dialog');route.id='routeMenu';route.open=false;route.close=()=>route.open=false;route.innerHTML='<button data-route="1">route</button>';document.body.append(route);
 const nav=document.createElement('div');nav.className='main-quick-tools';nav.innerHTML='<button>routes</button>';document.body.append(nav);
 const storage=new Map(stored===null?[]:[['brukivka_tutorial_v2',JSON.stringify({phase:stored})]]);let tick,begin=0;
 const env={document,Element:window.Element,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setInterval:f=>(tick=f,1),clearInterval:()=>{},addEventListener:()=>{},removeEventListener:()=>{},BrukOnboarding:{read:()=>s,begin:()=>(begin++,true)}};env.window=env;
 vm.runInNewContext(readFileSync(new URL('../tutorial.js',import.meta.url),'utf8'),env);
 const screen=id=>{document.querySelectorAll('.phone-screen').forEach(n=>n.classList.add('hidden'));document.getElementById(id).classList.remove('hidden');document.getElementById('phoneOverlay').classList.remove('hidden');};
 return {document,storage,tick,screen,begin:()=>begin,phase:()=>JSON.parse(storage.get('brukivka_tutorial_v2')).phase};
}
test('guided journey requires earned money, accepted and completed work, upgrade and actual next route; unlocks every app only at the end',()=>{
 const s=base(),x=setup(s),d=x.document;assert.equal(x.phase(),0);assert(d.getElementById('telegramApp').inert);assert(!d.getElementById('brukivka').inert);
 s.earned=10;s.balance=10;x.tick();assert.equal(x.phase(),1);x.tick();assert.equal(x.phase(),1);
 s.earned=40;s.balance=40;x.tick();assert.equal(x.phase(),2);assert(!d.getElementById('phoneButton').inert);
 x.screen('phoneHome');x.tick();assert.equal(x.phase(),3);assert(!d.getElementById('telegramApp').inert);assert(d.getElementById('bankApp').inert);
 x.screen('telegramScreen');x.tick();assert.equal(x.phase(),4);x.screen('reformotiChatScreen');x.tick();assert.equal(x.phase(),5);
 s.order.active=true;x.tick();assert.equal(x.phase(),6);s.order.progress=5;x.tick();assert.equal(x.phase(),6);
 s.order.completed=true;s.order.active=false;s.balance=3300;x.tick();assert.equal(x.phase(),7);
 x.screen('phoneHome');x.tick();assert(!d.getElementById('bankApp').inert);assert(d.getElementById('telegramApp').inert);
 x.screen('bankScreen');x.tick();assert(!d.getElementById('brickUpgradeButton').inert);
 s.brick=1;s.balance=2900;d.getElementById('phoneOverlay').classList.add('hidden');x.tick();assert.equal(x.phase(),8);
 d.getElementById('routeMenu').open=true;x.tick();assert.equal(d.querySelector('.tutorial-layer').parentElement.id,'routeMenu');
 s.route=1;s.balance=400;x.tick();assert.equal(x.phase(),9);assert.equal(d.getElementById('routeMenu').open,false);assert(d.getElementById('bankApp').inert);
 d.getElementById('tutorialFinish').click();assert.equal(x.phase(),10);assert(!d.getElementById('bankApp').inert);assert(!d.querySelector('.tutorial-layer'));
});
test('tutorial resumes an accepted order after reload and does not replace it or reset funds',()=>{const s=base();s.order.active=true;s.order.progress=3;s.balance=70;const x=setup(s,6);assert.equal(x.begin(),0);assert.equal(x.phase(),6);assert.equal(s.order.progress,3);assert.equal(s.balance,70);});
test('established and completed players are never locked; invalid stored phases normalize safely',()=>{for(const s of [{...base(),brick:1},{...base(),earned:200},{...base(),pc:true}]){const x=setup(s);assert.equal(x.phase(),10);assert(!x.document.querySelector('.tutorial-layer'));}assert.equal(setup(base(),10).begin(),0);for(const v of [-1,11,'2',null])assert.equal(T.normalize(v),null);});
test('insufficient upgrade and route funds always leave deliveries accessible',()=>{const s=base();s.balance=20;const x=setup(s,7);x.tick();assert(!x.document.getElementById('brukivka').inert);assert.equal(x.phase(),7);s.brick=1;x.tick();assert.equal(x.phase(),8);assert(!x.document.getElementById('brukivka').inert);});
