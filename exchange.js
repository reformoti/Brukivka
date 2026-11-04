(function(root){
  'use strict';
  const ASSETS=[{name:'Камінь',symbol:'STONE',base:40,color:'#b3a995'},{name:'Метал',symbol:'METAL',base:90,color:'#7ea4bb'},
    {name:'Мікросхеми',symbol:'CHIP',base:160,color:'#af8fd2'},{name:'Цемент',symbol:'CEMENT',base:65,color:'#b4c5bb'},{name:'Деревина',symbol:'WOOD',base:75,color:'#c7a06d'}];
  const MAX=1e12,validInt=(v,min=0,max=MAX)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
  const number=(v,f=0,min=0,max=MAX)=>validInt(v,min,max)?v:f;
  const NEWS=[['Спокійна сесія','Ринок без великих новин.',{}],['Інфраструктурний бум','Нові будівництва підвищують попит на сировину.',{0:.15,1:.12,3:.16}],
    ['Новий технопарк','Мікросхеми стали потрібнішими.',{2:.18}],['Велика заготівля','Деревини на ринку побільшало.',{4:-.2}],
    ['Імпортна партія','Нова поставка металу й електроніки.',{1:-.14,2:-.12}],['Складна логістика','Перевезення подорожчали.',{0:.05,1:.05,2:.05,3:.05,4:.05}]];
  function normalize(raw={}){
    if(!raw||typeof raw!=='object')raw={};
    const s={cash:number(raw.cash,number(raw.credits,1000)),day:number(raw.day,1,1),qty:[],basis:[],prices:[],feeLevel:number(raw.feeLevel,0,0,2),orders:[],history:[],trades:[],serial:number(raw.serial,1,1),news:typeof raw.news==='string'?raw.news.slice(0,240):'Вітаємо на BrukExchange. Початковий демо-капітал: 1 000 кредитів.'};
    ASSETS.forEach((a,i)=>{s.qty[i]=number((raw.qty||raw.holdings)?.[i],0,0,1000000);s.prices[i]=number(raw.prices?.[i],a.base,1,100000);s.basis[i]=s.qty[i]?(raw.basis?.[i]===null||raw.basis?.[i]===undefined?null:Number.isFinite(raw.basis[i])&&raw.basis[i]>=0?Math.min(MAX,raw.basis[i]):0):0;});
    const seen=new Set(),reservedSell=ASSETS.map(()=>0);
    for(const o of (Array.isArray(raw.orders)?raw.orders:[]).slice(0,8)){
      if(!o||!validInt(o.id,1)||seen.has(o.id)||!validInt(o.asset,0,4)||!['buy','sell'].includes(o.side)||!validInt(o.qty,1,100)||!validInt(o.target,1,100000)||!validInt(o.reserve,0))continue;
      if(o.side==='sell'&&reservedSell[o.asset]+o.qty>s.qty[o.asset])continue;
      if(o.side==='buy'&&(o.reserve<o.target*o.qty||o.reserve>o.target*o.qty*1.05+2))continue;
      const order={id:o.id,asset:o.asset,side:o.side,qty:o.qty,target:o.target,reserve:o.side==='buy'?o.reserve:0};s.orders.push(order);seen.add(o.id);if(o.side==='sell')reservedSell[o.asset]+=o.qty;
    }
    s.serial=Math.max(s.serial,1,...s.orders.map(o=>o.id+1));
    s.history=(Array.isArray(raw.history)?raw.history:[]).slice(-30).filter(h=>h&&validInt(h.day,1)&&Array.isArray(h.prices)&&h.prices.length===5&&h.prices.every(p=>validInt(p,1,100000))).map(h=>({day:h.day,prices:h.prices.slice()}));
    if(!s.history.length)s.history=[{day:s.day,prices:s.prices.slice()}];
    s.trades=(Array.isArray(raw.trades)?raw.trades:[]).slice(-50).filter(t=>t&&['buy','sell'].includes(t.side)&&validInt(t.asset,0,4)&&validInt(t.qty,1,100)&&validInt(t.price,1)&&validInt(t.fee)&&validInt(t.day,1)).map(t=>({side:t.side,asset:t.asset,qty:t.qty,price:t.price,fee:t.fee,day:t.day,profit:Number.isFinite(t.profit)?t.profit:null}));return s;
  }
  class Exchange{
    constructor(raw){this.state=normalize(raw);}
    get feeRate(){return [.01,.005,.0025][this.state.feeLevel];}
    fee(price,qty){return Math.ceil(price*qty*this.feeRate);}
    available(asset){return this.state.qty[asset]-this.state.orders.filter(o=>o.side==='sell'&&o.asset===asset).reduce((n,o)=>n+o.qty,0);}
    get equity(){return this.state.cash+this.state.orders.filter(o=>o.side==='buy').reduce((n,o)=>n+o.reserve,0)+this.state.qty.reduce((sum,n,i)=>sum+n*this.state.prices[i],0);}
    trade(asset,qty,side){
      const s=this.state;if(!validInt(asset,0,4)||!validInt(qty,1,100)||!['buy','sell'].includes(side))return {ok:false,message:'Вкажи правильний товар і кількість від 1 до 100.'};
      const p=s.prices[asset],fee=this.fee(p,qty),value=p*qty;
      if(side==='buy'&&(s.cash<value+fee||s.qty[asset]+qty>1000000))return {ok:false,message:'Не вистачає демо-кредитів з урахуванням комісії.'};
      if(side==='sell'&&this.available(asset)<qty)return {ok:false,message:'Не вистачає вільного товару. Частина може бути у відкладених заявках.'};
      let profit=null;
      if(side==='buy'){if(s.basis[asset]!==null)s.basis[asset]+=value+fee;s.cash-=value+fee;s.qty[asset]+=qty;}
      else{if(s.basis[asset]!==null){const basis=s.basis[asset]/s.qty[asset]*qty;profit=value-fee-basis;s.basis[asset]=Math.max(0,s.basis[asset]-basis);}s.qty[asset]-=qty;s.cash+=value-fee;if(!s.qty[asset])s.basis[asset]=0;}
      s.trades.push({asset,qty,side,price:p,fee,day:s.day,profit});s.trades=s.trades.slice(-50);
      return {ok:true,message:`${side==='buy'?'Куплено':'Продано'}: ${ASSETS[asset].name} ×${qty} по ${p}. Комісія ${fee} кр.`};
    }
    placeOrder(asset,qty,side,target){
      const s=this.state;if(s.orders.length>=8)return {ok:false,message:'Максимум 8 активних заявок.'};
      if(!validInt(asset,0,4)||!validInt(qty,1,100)||!validInt(target,1,100000)||!['buy','sell'].includes(side))return {ok:false,message:'Перевір кількість і бажану ціну.'};
      const reserve=side==='buy'?target*qty+this.fee(target,qty):0;
      if(side==='buy'&&s.cash<reserve)return {ok:false,message:'Недостатньо кредитів для резервування заявки.'};
      if(side==='sell'&&this.available(asset)<qty)return {ok:false,message:'Недостатньо вільного товару для заявки.'};
      s.cash-=reserve;s.orders.push({id:s.serial++,asset,qty,side,target,reserve});return {ok:true,message:'Заявку створено. Вона перевіряється під час наступної сесії.'};
    }
    cancelOrder(id){const o=this.state.orders.find(o=>o.id===id);if(!o)return false;this.state.orders=this.state.orders.filter(o=>o.id!==id);if(o.side==='buy')this.state.cash+=o.reserve;return true;}
    nextDay(random=Math.random){
      const s=this.state,event=NEWS[Math.min(NEWS.length-1,Math.floor(random()*NEWS.length))];s.day++;s.news=event[0]+'. '+event[1];
      s.prices=s.prices.map((p,i)=>Math.max(Math.round(ASSETS[i].base*.3),Math.min(ASSETS[i].base*3,Math.round(p*(1+(random()-.5)*.14+(event[2][i]||0))+(ASSETS[i].base-p)*.03))));
      let filled=0;
      for(const o of s.orders.slice()){
        if(o.side==='buy'&&s.prices[o.asset]<=o.target){
          const actual=s.prices[o.asset]*o.qty+this.fee(s.prices[o.asset],o.qty);
          if(actual>o.reserve||s.qty[o.asset]+o.qty>1000000)continue;
          s.orders=s.orders.filter(x=>x.id!==o.id);s.cash+=o.reserve;const result=this.trade(o.asset,o.qty,'buy');if(result.ok)filled++;
        }else if(o.side==='sell'&&s.prices[o.asset]>=o.target){s.orders=s.orders.filter(x=>x.id!==o.id);if(this.trade(o.asset,o.qty,'sell').ok)filled++;}
      }
      s.history.push({day:s.day,prices:s.prices.slice()});s.history=s.history.slice(-30);return filled;
    }
    upgradeBroker(){const s=this.state,cost=400*2**s.feeLevel;if(s.feeLevel>=2||s.cash<cost)return false;s.cash-=cost;s.feeLevel++;return true;}
  }
  const pure={ASSETS,Exchange,normalize};if(typeof module!=='undefined'&&module.exports)module.exports=pure;
  if(!root.document)return;
  const KEY='brukivka_exchange_v2';let raw;try{raw=JSON.parse(localStorage.getItem(KEY))||JSON.parse(localStorage.getItem('brukivka_pc_apps_v1'))||{};}catch{raw={};}
  const model=new Exchange(raw);let quantity=1,guideOpen=false,selectedTab='market',orderAsset=0;
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const fmt=n=>Math.round(n).toLocaleString('uk-UA');
  let container;
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(model.state));return true;}catch{document.getElementById('pcPreviewNotice').textContent='Сесію не збережено: сховище браузера переповнене.';return false;}}
  function notice(text){document.getElementById('pcPreviewNotice').textContent=text;}
  const button=(text,fn,disabled=false)=>{const b=el('button','exchange-button',text);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;};
  function act(result){const saved=persist();render();if(saved)notice(result?.message||'Оновлено.');}
  function chart(canvas,values,color){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.fillStyle='#142735';ctx.fillRect(0,0,w,h);if(values.length<2)values=[values[0],values[0]];const min=Math.min(...values)*.95,max=Math.max(...values)*1.05,range=max-min||1;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();values.forEach((v,i)=>{const x=i/(values.length-1)*(w-12)+6,y=h-8-(v-min)/range*(h-16);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
  function benefitWallet(){return {balance:()=>model.state.cash,snapshot:()=>JSON.stringify(model.state),debit:cost=>{if(model.state.cash<cost)return false;model.state.cash-=cost;return persist();},restore:snapshot=>{model.state=JSON.parse(snapshot);persist();}};}
  function render(){
    const s=model.state;container.replaceChildren();
    const hero=el('div','exchange-terminal');hero.innerHTML='<small>BRUKEXCHANGE / PAPER MARKET</small><h2>Будуй свій капітал.</h2><p>Умовний ринок матеріалів: новини, графіки, портфель та відкладені заявки.</p>';container.append(hero);
    const ticker=el('div','exchange-ticker');ASSETS.forEach((a,i)=>ticker.append(el('span','',`${a.symbol} ${s.prices[i]} кр.`)));container.append(ticker);
    const stats=el('div','exchange-stats');for(const [name,value] of [['ВІЛЬНІ КРЕДИТИ',fmt(s.cash)],['КАПІТАЛ',fmt(model.equity)],['РЕЗУЛЬТАТ',`${model.equity>=1000?'+':''}${fmt(model.equity-1000)}`],['СЕСІЯ',s.day]]){const box=el('div','');box.append(el('small','',name),el('strong','',value));stats.append(box);}container.append(stats);const goal=el('p','exchange-target',model.equity>=2000?'✓ Перша мета досягнута: 2 000 кредитів!':`Перша мета: 2 000 кредитів · залишилось ${fmt(2000-model.equity)}.`);container.append(goal);
    const news=el('div','exchange-news');news.append(el('b','','НОВИНИ СЕСІЇ'),el('span','',s.news),button('Наступна сесія →',()=>{const count=model.nextDay();act({message:`Сесію завершено. Виконано заявок: ${count}.`});}));container.append(news);
    const tabs=el('div','exchange-tabs');for(const [id,label] of [['market','Ринок'],['orders',`Заявки (${s.orders.length})`],['history','Історія']]){const b=button(label,()=>{selectedTab=id;render();});b.classList.toggle('active',selectedTab===id);tabs.append(b);}container.append(tabs);
    const guide=el('details','exchange-guide');guide.open=guideOpen;guide.addEventListener('toggle',()=>guideOpen=guide.open);
    guide.innerHTML='<summary>Як працює біржа?</summary><ol><li>Купуй матеріали дешевше, а продавай дорожче. Кількість за угоду: 1–100.</li><li>«Наступна сесія» оновлює ціни. Новини впливають на різні матеріали; графік показує останні 30 сесій.</li><li>Комісія брокера — 1%, після поліпшень — 0.5% та 0.25%. Продаж нижче собівартості дає збиток.</li><li>Лімітна купівля чекає ціни не вище вказаної й резервує кредити. Лімітний продаж чекає ціни не нижче вказаної та резервує товар. Заявку можна скасувати.</li></ol><p>Біржові кредити окремі від UAH гри, але купують талони фарбування та матеріали у магазині нижче. Капітал включає вільні та зарезервовані гроші й товари за поточними цінами. Перша мета — 2 000 кредитів. Для товарів зі старої версії невідома собівартість позначена «—».</p>';container.append(guide);
    if(selectedTab==='market'){
      const controls=el('div','exchange-volume');controls.append(el('label','','Обсяг угоди:'));const input=el('input','');input.type='number';input.min=1;input.max=100;input.value=quantity;input.setAttribute('aria-label','Кількість товару');input.addEventListener('change',()=>{quantity=Math.max(1,Math.min(100,Math.floor(Number(input.value)||1)));render();});controls.append(input);
      for(const q of [1,5,10])controls.append(button('×'+q,()=>{quantity=q;render();}));container.append(controls);
      const market=el('div','exchange-market');ASSETS.forEach((a,i)=>{
        const card=el('article','exchange-asset'),last=s.history.at(-2)?.prices[i]||s.prices[i],change=(s.prices[i]/last-1)*100;
        const title=el('div','exchange-asset-title');title.append(el('h3','',a.name),el('span',change>=0?'positive':'negative',`${change>=0?'+':''}${change.toFixed(1)}%`));card.append(title);
        const plot=el('canvas','');plot.width=300;plot.height=80;chart(plot,s.history.map(h=>h.prices[i]),a.color);card.append(plot,el('strong','exchange-quote',s.prices[i]+' кр.'));
        const basis=s.qty[i]&&s.basis[i]!==null?s.basis[i]/s.qty[i]:null;
        card.append(el('p','',`Портфель: ${s.qty[i]} · Вільно: ${model.available(i)} · Середня ціна: ${basis===null?'—':basis.toFixed(1)}`));
        const cost=s.prices[i]*quantity+model.fee(s.prices[i],quantity);card.append(button(`Купити ${quantity} · ${fmt(cost)}`,()=>act(model.trade(i,quantity,'buy')),s.cash<cost),button(`Продати ${quantity}`,()=>act(model.trade(i,quantity,'sell')),model.available(i)<quantity),button('Відкладена заявка',()=>{orderAsset=i;selectedTab='orders';render();}));market.append(card);
      });container.append(market);
      container.append(button(s.feeLevel>=2?'Брокер · максимальний рівень':`Брокер ${s.feeLevel}/2 · поліпшити за ${400*2**s.feeLevel} кр.`,()=>{if(model.upgradeBroker())act({message:'Комісію брокера зменшено.'});},s.feeLevel>=2||s.cash<400*2**s.feeLevel));
    }else if(selectedTab==='orders'){
      const form=el('form','exchange-order-form'),asset=el('select',''),side=el('select',''),qty=el('input',''),price=el('input','');
      ASSETS.forEach((a,i)=>{const o=el('option','',a.name);o.value=i;asset.append(o);});asset.value=orderAsset;for(const [id,name] of [['buy','Купити не дорожче'],['sell','Продати не дешевше']]){const o=el('option','',name);o.value=id;side.append(o);}qty.type=price.type='number';qty.min=1;qty.max=100;qty.value=quantity;price.min=1;price.max=100000;price.value=s.prices[orderAsset];asset.setAttribute('aria-label','Товар заявки');side.setAttribute('aria-label','Тип заявки');qty.setAttribute('aria-label','Кількість заявки');price.setAttribute('aria-label','Лімітна ціна');asset.addEventListener('change',()=>{orderAsset=Number(asset.value);price.value=s.prices[orderAsset];});
      const submit=el('button','exchange-button','Створити заявку');submit.type='submit';form.append(asset,side,qty,price,submit);form.addEventListener('submit',e=>{e.preventDefault();act(model.placeOrder(Number(asset.value),Number(qty.value),side.value,Number(price.value)));});container.append(form);
      const list=el('div','exchange-orders');for(const o of s.orders){const row=el('article','');row.append(el('strong','',`${ASSETS[o.asset].name} ×${o.qty}`),el('p','',`${o.side==='buy'?'Купити ≤':'Продати ≥'} ${o.target} · ${o.side==='buy'?'Резерв '+o.reserve+' кр.':'Товар зарезервовано'}`),button('Скасувати',()=>{model.cancelOrder(o.id);act({message:'Заявку скасовано, резерв звільнено.'});}));list.append(row);}if(!s.orders.length)list.append(el('p','exchange-empty','Активних заявок немає. Створи заявку вище.'));container.append(list);
    }else{
      const list=el('div','exchange-history');for(const t of s.trades.slice().reverse()){const row=el('div','');row.append(el('b','',`Сесія ${t.day} · ${t.side==='buy'?'Купівля':'Продаж'} ${ASSETS[t.asset].symbol} ×${t.qty}`),el('span','',`${t.price} кр. / шт. · комісія ${t.fee}${t.profit!==null?' · результат '+t.profit.toFixed(1):''}`));list.append(row);}if(!s.trades.length)list.append(el('p','exchange-empty','Тут з’являться виконані угоди.'));container.append(list);
    }
    if(root.BrukRewardShop?.mount)root.BrukRewardShop.mount(container,'exchange',benefitWallet(),render);
    root.BrukHelp?.fold(container);
  }
  root.BrukExchange={mount(target){container=target;render();},model};
})(typeof window==='undefined'?globalThis:window);
