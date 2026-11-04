(function(root){
  'use strict';
  const LIMIT=100000;
  function normalize(raw={}){const result={paintVouchers:0,brickStock:0,rebarStock:0,logisticsTier:0};for(const key of Object.keys(result)){const n=raw?.[key];result[key]=Number.isSafeInteger(n)?Math.max(0,Math.min(key==='logisticsTier'?3:LIMIT,n)):0;}return result;}
  function offers(source,perks){const list={
    exchange:[{id:'paint',cost:300,key:'paintVouchers',amount:1,label:'Талон на фарбування',detail:'Змінити колір машини в гаражі без UAH.'},{id:'materials',cost:150,key:'brickStock',amount:5,label:'5 цегляних секцій',detail:'Безкоштовне розміщення цегли на своїй ділянці.'}],
    dispatch:[{id:'paint',cost:100,key:'paintVouchers',amount:1,label:'Талон на фарбування',detail:'Діє для будь-якого придбаного авто.'},{id:'reinforce',cost:150,key:'rebarStock',amount:2,label:'2 комплекти арматури',detail:'Підсилити дві секції на ділянці без UAH.'},{id:'logistics',cost:200*(perks.logisticsTier+1),key:'logisticsTier',amount:1,label:`Логістика ФОП ${perks.logisticsTier}/3`,detail:'+30 хв до ліміту накопичення доходу від островів за рівень.'}],
    workshop:[{id:'brick',cost:1,key:'brickStock',amount:1,label:'Передати секцію на ділянку',detail:'1 готова бруківка = 1 безкоштовна цегляна секція.'},{id:'reinforce',cost:3,key:'rebarStock',amount:1,label:'Обмін на арматуру',detail:'3 готові бруківки = 1 безкоштовне армування.'}]
  };return (list[source]||[]).map(o=>({...o,max:o.key==='logisticsTier'?3:LIMIT}));}
  function prepare(source,id,raw,balance){const perks=normalize(raw),offer=offers(source,perks).find(o=>o.id===id);if(!offer)return {ok:false,message:'Невідома пропозиція.'};if(perks[offer.key]+offer.amount>offer.max)return {ok:false,message:'Досягнуто максимум.'};if(!Number.isFinite(balance)||balance<offer.cost)return {ok:false,message:'Недостатньо валюти цього застосунку.'};const next={...perks,[offer.key]:perks[offer.key]+offer.amount};return {ok:true,next,offer};}
  const pure={normalize,offers,prepare};if(typeof module!=='undefined'&&module.exports)module.exports=pure;
  if(!root.document){root.BrukRewardShop=pure;return;}
  let account=null;
  function redeem(source,id,wallet){
    if(!account)return {ok:false,message:'Рахунок ще завантажується.'};
    const before=normalize(account.get()),plan=prepare(source,id,before,wallet.balance());if(!plan.ok)return plan;
    const original=wallet.snapshot();
    if(!wallet.debit(plan.offer.cost)){wallet.restore(original);return {ok:false,message:'Покупку не збережено. Валюту повернуто.'};}
    account.set(plan.next);
    if(!account.save()){account.set(before);wallet.restore(original);return {ok:false,message:'Не вдалося зберегти талон. Валюту повернуто.'};}
    account.changed();return {ok:true,message:`Отримано: ${plan.offer.label}. Використай у відповідному застосунку.`};
  }
  function mount(target,source,wallet,refresh){
    const unit={exchange:'кр.',dispatch:'оч.',workshop:'брук.'}[source]||'',perks=normalize(account?.get()),section=document.createElement('section');section.className='benefit-shop';
    const title=document.createElement('div');title.innerHTML='<small>ПРАЦЮЄ У ВСІЙ ГРІ</small><h3>Магазин користі</h3>';section.append(title);const stock=document.createElement('p');stock.className='benefit-stock';stock.textContent=`Талони: ${perks.paintVouchers} · Цегла: ${perks.brickStock} · Арматура: ${perks.rebarStock} · Логістика ФОП: ${perks.logisticsTier}/3`;section.append(stock);
    const grid=document.createElement('div');grid.className='benefit-grid';
    for(const offer of offers(source,perks)){const card=document.createElement('article'),name=document.createElement('strong'),copy=document.createElement('p'),button=document.createElement('button');name.textContent=offer.label;copy.textContent=offer.detail;button.type='button';button.textContent=perks[offer.key]>=offer.max?'Максимум':`Обміняти · ${offer.cost} ${unit}`;button.disabled=wallet.balance()<offer.cost||perks[offer.key]>=offer.max;button.dataset.benefit=offer.id;button.addEventListener('click',()=>{const result=redeem(source,offer.id,wallet);refresh();const notice=document.getElementById('pcPreviewNotice');notice.textContent=result.message;});card.append(name,copy,button);grid.append(card);}section.append(grid);target.append(section);
  }
  root.BrukRewardShop={...pure,configure:api=>account=api,redeem,mount};
})(typeof window==='undefined'?globalThis:window);
