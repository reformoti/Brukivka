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
  const model=new Exchange(raw);let quantity=1,selectedAsset=0,container;
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const fmt=n=>Math.round(n).toLocaleString('uk-UA');
  const button=(text,fn,disabled=false)=>{const b=el('button','exchange-button',text);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;};
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(model.state));return true;}catch{notice('Не вдалося зберегти прогрес біржі.');return false;}}
  function notice(text){document.getElementById('pcPreviewNotice').textContent=text;}
  function act(result){const saved=persist();render();if(saved)notice(result?.message||'Готово.');}
  function chart(canvas,values,color){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);if(values.length<2)values=[values[0],values[0]];const min=Math.min(...values)*.95,max=Math.max(...values)*1.05,range=max-min||1;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();values.forEach((v,i)=>{const x=i/(values.length-1)*(w-12)+6,y=h-8-(v-min)/range*(h-16);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
  function benefitWallet(){return {balance:()=>model.state.cash,snapshot:()=>JSON.stringify(model.state),debit:cost=>{if(model.state.cash<cost)return false;model.state.cash-=cost;return persist();},restore:snapshot=>{model.state=JSON.parse(snapshot);persist();}};}
  function popup(title,build){document.getElementById('exchangeExtra')?.remove();const d=el('dialog','os-dialog bx-modal');d.id='exchangeExtra';const head=el('header','os-dialog-head');head.append(el('h2','',title),button('✕',()=>d.close()));d.append(head);const body=el('div','bx-modal-body');d.append(body);document.body.append(d);build(body,d);d.showModal();}
  function history(){popup('Історія угод',body=>{if(!model.state.trades.length)body.append(el('p','','Угод ще немає.'));for(const t of model.state.trades.slice().reverse()){const line=el('article','bx-history-line');line.append(el('strong','',`${t.side==='buy'?'Купівля':'Продаж'} · ${ASSETS[t.asset].name} ×${t.qty}`),el('span','',`${t.price} кр./шт. · комісія ${t.fee} · сесія ${t.day}`));body.append(line);}});}
  function oldOrders(){popup('Збережені заявки',body=>{for(const o of model.state.orders){const line=el('article','bx-history-line');line.append(el('strong','',`${ASSETS[o.asset].name} ×${o.qty} · ${o.side==='buy'?'купити ≤':'продати ≥'} ${o.target}${o.side==='buy'?' · резерв '+o.reserve+' кр.':''}`),button('Скасувати',()=>{model.cancelOrder(o.id);persist();render();document.getElementById('exchangeExtra').close();}));body.append(line);}body.append(el('p','','Вони виконуються під час наступної сесії. Нові угоди тепер виконуються одразу кнопками «Купити» та «Продати».'));});}
  function shop(){popup('Витратити кредити', (body,d)=>{const s=model.state;body.append(el('p','',`Баланс: ${fmt(s.cash)} кр. · комісія: ${(model.feeRate*100).toFixed(2)}%`));body.append(button(s.feeLevel===2?'Комісія вже мінімальна':`Зменшити комісію · ${400*2**s.feeLevel} кр.`,()=>{if(model.upgradeBroker()){d.close();act({message:'Комісію зменшено.'});}},s.feeLevel===2||s.cash<400*2**s.feeLevel));root.BrukRewardShop?.mount(body,'exchange',benefitWallet(),()=>{persist();render();d.close();});});}
  function render(){
    const s=model.state;container.replaceChildren();container.dataset.workspace='exchange-simple';
    const summary=el('div','bx-summary');for(const [label,value] of [['Кредити',fmt(s.cash)],['У товарах',fmt(s.qty.reduce((sum,n,i)=>sum+n*s.prices[i],0))],['Усього',fmt(model.equity)],['Сесія',s.day]]){const box=el('div');box.append(el('small','',label),el('strong','',value));if(label==='Усього'){const reserved=s.orders.filter(o=>o.side==='buy').reduce((n,o)=>n+o.reserve,0);if(reserved)box.append(el('small','','У тому числі резерв: '+fmt(reserved)+' кр.'));}summary.append(box);}container.append(summary);
    const instruction=el('p','bx-instruction','Обери товар → вкажи кількість → купи або продай. «Наступна сесія» змінює ціни. Кредити біржі — окрема ігрова валюта.');container.append(instruction);
    const content=el('div','bx-content'),market=el('section','bx-market'),table=el('table','bx-table'),thead=el('thead'),tr=el('tr');for(const text of ['Товар','Ціна / шт.','У тебе','За сесію'])tr.append(el('th','',text));thead.append(tr);table.append(thead);const tbody=el('tbody');
    ASSETS.forEach((a,i)=>{const row=el('tr'),name=el('td'),choose=button(a.name,()=>{selectedAsset=i;render();});choose.dataset.bxAsset=i;choose.setAttribute('aria-pressed',String(i===selectedAsset));name.append(choose);const last=s.history.at(-2)?.prices[i]||s.prices[i],change=(s.prices[i]/last-1)*100;row.dataset.selected=String(i===selectedAsset);row.append(name,el('td','',fmt(s.prices[i])+' кр.'),el('td','',String(s.qty[i])),el('td',change>=0?'positive':'negative',(change>=0?'+':'')+change.toFixed(1)+'%'));tbody.append(row);});table.append(tbody);market.append(table);content.append(market);
    const trade=el('section','bx-trade'),asset=ASSETS[selectedAsset],price=s.prices[selectedAsset];trade.append(el('h2','',asset.name),el('p','bx-holding',`Ціна: ${fmt(price)} кр. · Доступно для продажу: ${model.available(selectedAsset)} шт.`));const plot=el('canvas','bx-chart');plot.width=560;plot.height=110;chart(plot,s.history.map(h=>h.prices[selectedAsset]),asset.color);trade.append(plot,el('small','bx-chart-label','Ціна за останні '+s.history.length+' сесій'));
    const quantityRow=el('label','bx-quantity','Кількість, шт.'),input=el('input');input.id='bxQuantity';input.type='number';input.min=1;input.max=100;input.step=1;input.value=quantity;quantityRow.append(input);trade.append(quantityRow);const quote=el('div','bx-quote'),buy=button('Купити',()=>act(model.trade(selectedAsset,quantity,'buy'))),sell=button('Продати',()=>act(model.trade(selectedAsset,quantity,'sell')));buy.id='bxBuy';sell.id='bxSell';const actions=el('div','bx-actions');actions.append(buy,sell);trade.append(quote,actions);content.append(trade);container.append(content);
    function updateQuote(){quantity=Math.max(1,Math.min(100,Math.floor(Number(input.value)||1)));const fee=model.fee(price,quantity),cost=price*quantity+fee,receive=price*quantity-fee;quote.replaceChildren(el('span','',`Купівля: ${fmt(cost)} кр.`),el('span','',`Продаж: ${fmt(receive)} кр.`),el('small','',`Комісія в обох сумах: ${fee} кр.`));buy.disabled=s.cash<cost||s.qty[selectedAsset]+quantity>1000000;sell.disabled=model.available(selectedAsset)<quantity;}
    input.addEventListener('input',updateQuote);input.addEventListener('change',()=>{updateQuote();input.value=quantity;});updateQuote();
    const news=el('div','bx-news');news.append(el('span','',s.news));container.append(news);const footer=el('nav','bx-footer');const next=button('Наступна сесія →',()=>{const count=model.nextDay();act({message:'Ціни оновлено.'+(count?' Виконано заявок: '+count+'.':'')});});next.id='bxNext';footer.append(next,button('Історія',history),button('Витратити кредити',shop));if(s.orders.length)footer.append(button('Збережені заявки: '+s.orders.length,oldOrders));container.append(footer);
  }
  root.BrukExchange={mount(target){container=target;render();},model};
})(typeof window!=='undefined'?window:globalThis);
