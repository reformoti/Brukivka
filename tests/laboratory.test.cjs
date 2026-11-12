const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../money-core'),L=require('../laboratory-core'),S=require('../neuron-siege'),Boss=require('../sky-boss'),C=require('../cloud-core'),T=require('../local-tools-core');
test('money now grows beyond the old safe integer limit and remains finite through a JSON roundtrip',()=>{
 const old=Number.MAX_SAFE_INTEGER,earned=M.add(old,1e20);assert(earned>old);assert.equal(M.LIMIT,1e120);assert.equal(M.normalize(JSON.parse(JSON.stringify({balance:earned})).balance),earned);assert.equal(M.normalize(-1e24),-1e24);assert.equal(M.normalize(Infinity,77),77);assert.equal(M.normalize(1e140),M.LIMIT);assert.equal(M.add(M.LIMIT,1e119),M.LIMIT);
 for(const n of [old,1e20,1e50,M.LIMIT])assert(M.valid(n));for(const n of [NaN,Infinity,'100',1e121])assert(!M.valid(n));
});
test('huge balances display compactly while ordinary hryvnias retain their familiar grouped format',()=>{
 assert.equal(M.format(123456),Number(123456).toLocaleString('uk-UA'));assert.equal(M.format(5e18),'5 × 10¹⁸');assert.equal(M.format(M.LIMIT),'1 × 10¹²⁰');assert(M.format(-7.5e42).startsWith('-7,5'));assert(M.format(1e100).length<24);assert.equal(M.format(Infinity),'0');
});
test('old purchases and boss penalties still work above the former maximum',()=>{
 const result=S.purchase({},1e20,'ammo','drill');assert(result.ok);assert.equal(result.state.ammo,'drill');assert(result.balance<1e20);assert(Number.isFinite(result.balance));assert.equal(Boss.penaltyForBalance(1e20),8.5e19);assert.equal(Boss.penaltyForBalance(1e100)/1e100,.85);assert.equal(Boss.penaltyForBalance(-1e20),0);
 const s={balance:1e20};assert(T.apply(s,'add100m',{}));assert(s.balance>1e20);assert(s.balance>Number.MAX_SAFE_INTEGER);
});
test('every laboratory facility is far above the old capped balance, has a finite escalating price and keeps a level cap',()=>{
 for(const f of L.FACILITIES){assert(f.price>Number.MAX_SAFE_INTEGER*100);assert(f.price<M.LIMIT);const r=L.buyFacility({},f.price,f.id);assert(r.ok);assert.equal(r.balance,0);assert.equal(r.state.facilities[f.id],1);assert(L.facilityPrice(r.state,f.id)>f.price);assert(!L.buyFacility({},f.price*.99,f.id).ok);}
 const s=L.normalize();s.facilities.accelerator=10;assert.equal(L.facilityPrice(s,'accelerator'),null);assert(!L.buyFacility(s,1e100,'accelerator').ok);assert(!L.buyFacility({},1e100,'__proto__').ok);
});
test('legacy and corrupted laboratory state cannot introduce resources, ranks or future production',()=>{
 const now=1000000,s=L.normalize({facilities:{accelerator:100,bottle:-3,evil:8},studies:{catalyst:NaN},antimatter:Infinity,energy:-4,research:'900',lastAt:now+1e8},now);assert.equal(s.facilities.accelerator,10);assert.equal(s.facilities.bottle,0);assert(!('evil' in s.facilities));assert.equal(s.studies.catalyst,0);assert.equal(s.antimatter,0);assert.equal(s.energy,0);assert.equal(s.research,0);assert.equal(s.lastAt,now);assert.equal(L.effects({}).income,1);assert.deepEqual(L.rates({}),{antimatter:0,energy:0,research:0});
});
test('offline production is capped at eight hours, settles once and uses the old rate before a facility upgrade',()=>{
 const now=1700000000000,s=L.normalize({facilities:{accelerator:1},lastAt:now},now),r=L.settle(s,now+1000*3600*24);assert.equal(r.seconds,8*3600);assert.equal(r.state.antimatter,.25*8*3600);assert.equal(r.state.energy,.8*8*3600);assert.equal(L.settle(r.state,now+1000*3600*24).seconds,0);
 const earned=L.settle(s,now+100000).state,upgraded=L.buyFacility(earned,1e30,'accelerator').state;assert.equal(earned.antimatter,25);assert.equal(upgraded.antimatter,25);assert.equal(L.rates(upgraded).antimatter,.75);
});
test('research consumes the exact required resources and changes real production, sale and income effects',()=>{
 const s=L.normalize({facilities:{accelerator:1},antimatter:1000,energy:1000,research:1000}),before=JSON.stringify(s),a=L.study(s,'containment');assert(a.ok);assert.equal(a.state.antimatter,900);assert.equal(a.state.research,990);assert.equal(L.rates(a.state).antimatter,.375);assert.equal(JSON.stringify(s),before);
 const b=L.study(s,'catalyst');assert.equal(L.effects(b.state).sale,1.4);assert.equal(b.state.energy,850);const c=L.study(s,'compression');assert.equal(L.effects(c.state).income,L.effects(s).income*4);assert(!L.study({},'compression').ok);assert(!L.study(s,'__proto__').ok);
});
test('annihilation spends antimatter and energy and credits the bank without needing safe-integer balances',()=>{
 const s=L.normalize({antimatter:100,energy:200}),r=L.annihilate(s,1e20,.5);assert(r.ok);assert.equal(r.consumed,50);assert.equal(r.state.antimatter,50);assert.equal(r.state.energy,100);assert.equal(r.reward,5e17);assert.equal(r.balance,1e20+5e17);assert.equal(s.antimatter,100);
 const limited=L.annihilate({antimatter:100,energy:4},0,1);assert(limited.ok);assert.equal(limited.consumed,2);assert.equal(limited.reward,2e16);assert.equal(limited.state.antimatter,98);assert.equal(limited.state.energy,0);assert(!L.annihilate(s,0,-1).ok);assert(!L.annihilate({},0,1).ok);
});
test('reaching the new money cap does not destroy unused laboratory stock and negative balances are preserved',()=>{
 const s=L.normalize({antimatter:1e90,energy:1e90}),r=L.annihilate(s,M.LIMIT,1);assert(!r.ok);assert.equal(s.antimatter,1e90);const debt=L.annihilate({antimatter:1,energy:2},-1e18,1);assert(debt.ok);assert(debt.balance<0);assert.equal(debt.balance,-1e18+1e16);
});
test('large bank and FOP balances and laboratory purchases survive the same cloud save and restore as the game',()=>{
 const lab=L.normalize({facilities:{accelerator:3,universe:2},studies:{catalyst:2},antimatter:1e25,energy:2e25}),main={balance:1e70,totalEarned:1e90,fopBalance:1e55,lab,siege:S.normalizeUpgrade({stock:8,unlocked:9})};
 function storage(initial={}){const data=new Map(Object.entries(initial));return {get length(){return data.size;},key:i=>[...data.keys()][i],getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
 const from=storage({brukivka_kos_v4:JSON.stringify(main)}),snapshot=JSON.parse(JSON.stringify(C.collect(from,'6.30.0'))),to=storage();C.replace(to,snapshot);const restored=JSON.parse(to.getItem('brukivka_kos_v4'));assert.equal(M.normalize(restored.balance),1e70);assert.equal(M.normalize(restored.fopBalance),1e55);assert.equal(L.normalize(restored.lab).facilities.universe,2);assert.equal(restored.lab.antimatter,1e25);assert.equal(restored.siege.stock,8);
});
test('phone laboratory controls buy, research, annihilate and keep help closed without rebuilding focused buttons',()=>{
 const {parseHTML}=require('linkedom'),dom=parseHTML('<html><body><div id="labContent"></div></body></html>');let state=L.normalize(),balance=5e18;
 const win=dom.window;win.BrukMoney=M;win.BrukLabCore=L;
 const commit=r=>{if(r.ok){state=r.state;if(r.balance!==undefined)balance=r.balance;}return r;};
 win.BrukLab={read:()=>({state,balance,rates:L.rates(state),effects:L.effects(state)}),facility:id=>commit(L.buyFacility(state,balance,id)),study:id=>commit(L.study(state,id)),annihilate:f=>commit(L.annihilate(state,balance,f))};
 vm.runInNewContext(fs.readFileSync(require.resolve('../laboratory-ui'),'utf8'),{window:win,document:dom.document});const $=s=>dom.document.querySelector(s),first=$('[data-lab-facility="accelerator"]');assert.equal(dom.document.querySelectorAll('[data-lab-facility]').length,6);assert.equal(dom.document.querySelectorAll('[data-lab-study]').length,3);assert(!first.disabled);assert($('[data-lab-facility="universe"]').disabled);first.onclick();assert.equal(state.facilities.accelerator,1);assert.equal(balance,0);assert.equal(first,$('[data-lab-facility="accelerator"]'));
 state.antimatter=1000;state.energy=1000;state.research=1000;win.BrukLabUI.refresh();$('[data-lab-study="containment"]').onclick();assert.equal(state.studies.containment,1);const before=balance;$('[data-lab-annihilate="0.5"]').onclick();assert(balance>before);assert(!$('.lab-help').hasAttribute('open'));assert($('#labCash').textContent.length<30);
});
