(() => {
  'use strict';
  const $=id=>document.getElementById(id),KEY='brukivka_pc_apps_v1';
  const COLORS=['#e8dbc0','#dc9b65','#92c8b7','#84a9ed','#ba91d9','#27394a'];
  const goods=[{name:'Камінь',base:40,icon:'▰'},{name:'Метал',base:90,icon:'▤'},{name:'Мікросхеми',base:160,icon:'▣'}];
  const routes=[{name:'Сусідній квартал',seconds:3,points:15,icon:'⌂'},
    {name:'Через усе місто',seconds:5,points:30,icon:'▥'},{name:'Промисловий район',seconds:7,points:50,icon:'⚒'}];
  let state={paint:Array(96).fill(''),credits:1000,holdings:[0,0,0],prices:[40,90,160],day:1,raw:0,baked:0,bricks:0,deliveries:0,points:0};
  const integer=(v,f=0)=>Number.isSafeInteger(v)&&v>=0&&v<=1000000000?v:f;
  try {
    const s=JSON.parse(localStorage.getItem(KEY));
    if(s&&typeof s==='object'){
      for(const k of ['credits','day','raw','baked','bricks','deliveries','points'])state[k]=integer(s[k],state[k]);
      if(Array.isArray(s.paint)&&s.paint.length===96)state.paint=s.paint.map(c=>COLORS.includes(c)?c:'');
      if(Array.isArray(s.holdings)&&s.holdings.length===3)state.holdings=s.holdings.map(v=>integer(v));
      if(Array.isArray(s.prices)&&s.prices.length===3)state.prices=s.prices.map((v,i)=>Math.max(1,Math.min(goods[i].base*3,integer(v,goods[i].base))));
    }
  }catch{}
  let selected='paint',color=COLORS[1],trip=null,lastTick=-1;
  function notice(text){$('pcPreviewNotice').textContent=text;}
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{notice('Не вдалося зберегти пробний прогрес у браузері.');}}
  function button(text,action,disabled=false){const el=document.createElement('button');el.type='button';el.textContent=text;el.disabled=disabled;el.addEventListener('click',action);return el;}
  function heading(title,description){const box=document.createElement('div');box.className='preview-hero';const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=description;box.append(h,p);return box;}
  function stat(label,value){const el=document.createElement('div');el.className='preview-stat';const small=document.createElement('small');small.textContent=label;const b=document.createElement('strong');b.textContent=value;el.append(small,b);return el;}
  function renderPaint(root){window.BrukPaint.mount(root);}
  function renderGallery(root){window.BrukPaint.gallery(root);}
  function renderExchange(root){
    root.append(heading('BrukExchange','Спробуй торгувати будматеріалами. Купуй дешевше, перемотуй день та продавай дорожче. Демо-кредити окремі від ігрових UAH.'));
    const summary=document.createElement('div');summary.className='preview-stats';summary.append(stat('ДЕМО-КРЕДИТИ',state.credits),stat('ДЕНЬ',state.day));root.append(summary);
    const list=document.createElement('div');list.className='demo-market';
    goods.forEach((g,i)=>{
      const row=document.createElement('article');const title=document.createElement('h3');title.textContent=`${g.icon} ${g.name}`;
      const p=document.createElement('p');p.textContent=`Ціна: ${state.prices[i]} кр. · На складі: ${state.holdings[i]}`;
      row.append(title,p,button('Купити 1',()=>{if(state.credits<state.prices[i])return;state.credits-=state.prices[i];state.holdings[i]++;persist();render();},state.credits<state.prices[i]),
        button('Продати 1',()=>{if(!state.holdings[i])return;state.credits+=state.prices[i];state.holdings[i]--;persist();render();},!state.holdings[i]));list.append(row);
    });root.append(list);
    root.append(button('Наступний день →',()=>{state.day++;state.prices=goods.map(g=>Math.round(g.base*(.6+Math.random()*.95)));persist();render();notice('Нові котирування. Порівняй ціни зі своїми покупками.');}));
  }
  function renderWorkshop(root){
    root.append(heading('BrukWorkshop','Мініатюрна виробнича лінія: зібрати 3 камені → випалити заготовку → зробити одну бруківку. Збери партію з 10 штук.'));
    const line=document.createElement('div');line.className='workshop-line';
    const cards=[['01 / СИРОВИНА',state.raw+' каменів','Зібрати камінь',()=>{state.raw++;},false],
      ['02 / ПІЧ',state.baked+' заготовок','Випалити · 3 камені',()=>{if(state.raw<3)return;state.raw-=3;state.baked++;},state.raw<3],
      ['03 / МАЙСТЕРНЯ',state.bricks+' бруківок','Сформувати бруківку',()=>{if(!state.baked)return;state.baked--;state.bricks++;},!state.baked]];
    cards.forEach(([label,value,copy,action,disabled])=>{const card=document.createElement('article');card.append(stat(label,value),button(copy,()=>{action();persist();render();if(state.bricks&&state.bricks%10===0)notice('Партію з 10 бруківок зібрано! Майстерня працює.');},disabled));line.append(card);});root.append(line);
    const progress=document.createElement('progress');progress.max=10;progress.value=state.bricks%10;progress.setAttribute('aria-label','Прогрес поточної партії');root.append(progress);
    const p=document.createElement('p');p.className='preview-caption';p.textContent=`Готових партій: ${Math.floor(state.bricks/10)} · У поточній: ${state.bricks%10}/10. Це пробна майстерня, без змін основного доходу.`;root.append(p);
  }
  function renderDispatch(root){
    root.append(heading('BrukDispatch','Обери маршрут і відправ фургон з бруківкою. Довші маршрути дають більше очок логістики.'));
    const summary=document.createElement('div');summary.className='preview-stats';summary.append(stat('ДОСТАВОК',state.deliveries),stat('ОЧКИ ЛОГІСТИКИ',state.points));root.append(summary);
    const map=document.createElement('div');map.className='dispatch-map';map.innerHTML='<span class="dispatch-depot">▤<small>СКЛАД</small></span><div class="dispatch-route"><span id="demoVan">▰➜</span></div><span class="dispatch-destination">⌂<small>ОТРИМУВАЧ</small></span>';root.append(map);
    const label=document.createElement('p');label.id='dispatchStatus';label.className='preview-caption';root.append(label);
    const list=document.createElement('div');list.className='dispatch-routes';
    routes.forEach((r,i)=>list.append(button(`${r.icon} ${r.name} · ${r.seconds} с · +${r.points} оч.`,()=>{if(trip)return;trip={...r,index:i,started:performance.now()};render();},!!trip)));root.append(list);
    const p=document.createElement('p');p.className='preview-caption';p.textContent='Демонстраційні доставки. Очки логістики не списують і не нараховують UAH.';root.append(p);tickDispatch();
  }
  function tickDispatch(){
    const van=$('demoVan'),label=$('dispatchStatus');
    if(!trip){if(label)label.textContent='Фургон готовий. Обери маршрут.';return;}
    const p=Math.min(1,(performance.now()-trip.started)/(trip.seconds*1000));
    if(van)van.style.left=`${p*86}%`;if(label)label.textContent=`${trip.name} · ${Math.floor(p*100)}%`;
    if(p>=1){state.deliveries++;state.points+=trip.points;const name=trip.name;trip=null;persist();if(selected==='dispatch'&&!$('pcPreviewPanel').classList.contains('hidden'))render();notice(`Доставлено: ${name}!`);}
  }
  const renderers={paint:renderPaint,gallery:renderGallery,exchange:renderExchange,workshop:renderWorkshop,dispatch:renderDispatch};
  const titles={paint:'BrukPaint',gallery:'Мої малюнки',exchange:'BrukExchange',workshop:'BrukWorkshop',dispatch:'BrukDispatch'};
  function render(){window.BrukPaint.leave();const root=$('pcPreviewContent');root.replaceChildren();$('pcPreviewBadge').textContent=selected==='paint'?'СТУДІЯ':selected==='gallery'?'ПАПКА':'ПРОБНА ВЕРСІЯ';$('pcPreviewTitle').textContent=titles[selected];renderers[selected](root);}
  window.BrukPcApps={open(id){if(!renderers[id])return;selected=id;notice('');render();}};
  function frame(time){if(trip&&time-lastTick>60){lastTick=time;tickDispatch();}requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
