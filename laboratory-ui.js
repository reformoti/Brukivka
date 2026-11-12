(()=>{'use strict';
if(window.BrukDevice?.blocked||!window.BrukLab)return;
const L=window.BrukLabCore,M=window.BrukMoney,api=window.BrukLab,$=id=>document.getElementById(id),root=$('labContent');
const quantity=n=>Math.abs(n)<1000?n.toLocaleString('uk-UA',{maximumFractionDigits:2}):M.format(n);
const icons={accelerator:'⌬',bottle:'⟐',reactor:'⊙',gravity:'◉',portal:'⦿',universe:'✦'};
root.innerHTML=`<div class="lab-kicker">XΛR SCIENCE / ВІДДІЛ 01</div>
 <div class="lab-hero"><div class="lab-orbit lab-orbit-a"></div><div class="lab-orbit lab-orbit-b"></div><div class="lab-orbit lab-orbit-c"></div><div class="lab-core"></div><span class="lab-hero-tag">A / АНТИМАТЕРІЯ</span><span class="lab-hero-note" id="labHeroStatus">ПОЛЕ ОЧІКУЄ ЗАПУСКУ</span></div>
 <div class="lab-title"><h2>За межею матерії</h2><p>Установки, що коштують більше за цілі світи.</p></div>
 <div class="lab-wallet"><span>ДОСТУПНО UAH</span><strong id="labCash"></strong><small id="labIncome"></small></div>
 <div class="lab-resources">${[['antimatter','АНТИМАТЕРІЯ','AM'],['energy','ЕНЕРГІЯ','E'],['research','НАУКА','RP']].map(([k,n,u])=>`<div><span>${n}</span><strong id="labValue-${k}"></strong><small id="labRate-${k}"></small><b>${u}</b></div>`).join('')}</div>
 <section class="lab-annihilation"><div class="lab-caption"><h3>Анігіляція</h3><span>AM → UAH</span></div><p id="labConversion"></p><div class="lab-annihilate-buttons"><button type="button" data-lab-annihilate="0.1">10%</button><button type="button" data-lab-annihilate="0.5">50%</button><button type="button" data-lab-annihilate="1">100%</button></div></section>
 <p id="labMessage" class="lab-message" role="status" aria-live="polite">Почни з прискорювача антиматерії.</p>
 <div class="lab-caption"><h3>Установки</h3><span>01 — 06</span></div><div id="labFacilities" class="lab-list"></div>
 <div class="lab-caption"><h3>Дослідження</h3><span>РАНГИ 0 — 10</span></div><div id="labStudies" class="lab-list"></div>
 <details class="lab-help"><summary>Як працює лабораторія</summary><p>Установки купуються за UAH та мають 10 рівнів. Наступний рівень коштує у 3,7 раза більше й утричі збільшує виробництво цієї установки. Кожен рівень також підсилює дохід у головній грі: множники установок перемножуються. Наука й антиматерія потрібні для досліджень.</p><p>Анігіляція витрачає вибрану частку антиматерії та 2 енергії на одиницю. Якщо енергії менше, перетворюється доступний обсяг. UAH одразу надходять на основний баланс. Коли досягнуто нового ліміту, зайві ресурси залишаються.</p><p>Виробництво триває при закритій лабораторії. За відсутності нараховується до 8 годин. Прогрес входить у звичайне й хмарне збереження. Великі суми округлюються; 5 × 10¹⁸ — це 5 із 18 нулями. Ліміт балансу: 10¹²⁰ UAH.</p></details>`;
const facilityNodes=new Map(),studyNodes=new Map();
function element(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e;}
function action(run,success){const result=run();refresh();$('labMessage').textContent=result.ok?success(result):result.message;$('labMessage').dataset.tone=result.ok?'good':'bad';}
for(const f of L.FACILITIES){
 const card=element('article','lab-installation'),top=element('div','lab-installation-top'),mark=element('span','lab-installation-icon',icons[f.id]),title=element('div'),h=element('h4','',f.name),level=element('small'),detail=element('p','',f.detail),rate=element('p','lab-installation-rate'),button=element('button');button.type='button';button.dataset.labFacility=f.id;button.onclick=()=>action(()=>api.facility(f.id),r=>'Установку покращено. Списано '+M.format(r.cost)+' UAH.');title.append(h,level);top.append(mark,title);card.append(top,detail,rate,button);$('labFacilities').append(card);facilityNodes.set(f.id,{level,rate,button});
}
for(const study of L.STUDIES){
 const card=element('article','lab-study'),h=element('h4'),detail=element('p','',study.detail),cost=element('p','lab-study-price'),button=element('button');button.type='button';button.dataset.labStudy=study.id;button.onclick=()=>action(()=>api.study(study.id),()=> 'Дослідження завершено. Ефект уже діє.');card.append(h,detail,cost,button);$('labStudies').append(card);studyNodes.set(study.id,{h,cost,button});
}
for(const b of root.querySelectorAll('[data-lab-annihilate]'))b.onclick=()=>action(()=>api.annihilate(Number(b.dataset.labAnnihilate)),r=>'Анігільовано '+quantity(r.consumed)+' AM. На баланс +'+M.format(r.reward)+' UAH.');
function refresh(){
 const {state,balance,rates,effects}=api.read();$('labCash').textContent=M.format(balance);$('labCash').title=balance.toLocaleString('uk-UA',{maximumFractionDigits:0});$('labIncome').textContent='Дохід головної гри ×'+quantity(effects.income);$('labHeroStatus').textContent=rates.antimatter>0?'ПОЛЕ СТАБІЛЬНЕ · СИНТЕЗ АКТИВНИЙ':'ПОЛЕ ОЧІКУЄ ЗАПУСКУ';
 for(const k of ['antimatter','energy','research']){$('labValue-'+k).textContent=quantity(state[k]);$('labRate-'+k).textContent='+'+quantity(rates[k])+' / с';}
 $('labConversion').textContent='1 AM → '+M.format(1e16*effects.sale)+' UAH · витрата 2 E';
 for(const b of root.querySelectorAll('[data-lab-annihilate]'))b.disabled=state.antimatter<=0||state.energy<=0||balance>=M.LIMIT;
 for(const f of L.FACILITIES){const node=facilityNodes.get(f.id),level=state.facilities[f.id],price=L.facilityPrice(state,f.id);node.level.textContent='РІВЕНЬ '+level+' / '+L.MAX_LEVEL;node.rate.textContent=(level?'Зараз +'+quantity(f.antimatter*3**(level-1)*effects.production)+' AM / с':'Після запуску +'+quantity(f.antimatter*effects.production)+' AM / с')+' · бонус доходу ×'+(1+level*3);node.button.textContent=price===null?'Максимальний рівень':(level?'Покращити':'Побудувати')+' · '+M.format(price)+' UAH';node.button.disabled=price===null||balance<price;}
 for(const study of L.STUDIES){const node=studyNodes.get(study.id),price=L.studyPrice(state,study.id);node.h.textContent=study.name+' · '+state.studies[study.id]+' / 10';node.cost.textContent=price?Object.entries(price).filter(([,v])=>v>0).map(([k,v])=>quantity(v)+' '+{antimatter:'AM',energy:'E',research:'RP'}[k]).join(' · '):'Дослідження завершене';node.button.textContent=price?'Дослідити':'Максимум';node.button.disabled=!price||Object.entries(price).some(([k,v])=>state[k]<v);}
}
window.addEventListener('bruk-lab',refresh);window.BrukLabUI={refresh};refresh();
})();
