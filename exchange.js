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
  function candles(history,asset,span=1){span=[1,3,5].includes(span)?span:1;const result=[];for(let i=0;i<history.length;i+=span){const batch=history.slice(i,i+span),open=history[Math.max(0,i-1)].prices[asset],close=batch.at(-1).prices[asset],values=[open,...batch.map(h=>h.prices[asset])];result.push({day:batch.at(-1).day,open,close,high:Math.max(...values),low:Math.min(...values)});}return result;}
  const pure={ASSETS,Exchange,normalize,candles};if(typeof module!=='undefined'&&module.exports)module.exports=pure;
  if(!root.document)return;
  const KEY='brukivka_exchange_v2';let raw;try{raw=JSON.parse(localStorage.getItem(KEY))||JSON.parse(localStorage.getItem('brukivka_pc_apps_v1'))||{};}catch{raw={};}
  const model=new Exchange(raw);let quantity=1,selectedAsset=0,candleSpan=1,container;
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const fmt=n=>Math.round(n).toLocaleString('uk-UA');
  const button=(text,fn,disabled=false)=>{const b=el('button','exchange-button',text);b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;};
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(model.state));return true;}catch{notice('Не вдалося зберегти прогрес біржі.');return false;}}
  function notice(text){document.getElementById('pcPreviewNotice').textContent=text;}
  function act(result){const saved=persist();render();if(saved)notice(result?.message||'Готово.');}
  function chart(canvas,series,readout){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,left=12,right=75,bottom=28,top=12,lo=Math.min(...series.map(s=>s.low)),hi=Math.max(...series.map(s=>s.high)),pad=Math.max(1,(hi-lo)*.15),min=lo-pad,max=hi+pad,y=n=>top+(max-n)/(max-min)*(h-top-bottom),step=(w-left-right)/Math.max(20,series.length),x=i=>left+step*(i+.5);function draw(hover=-1){c.fillStyle='#181a20';c.fillRect(0,0,w,h);c.font='12px sans-serif';c.textAlign='left';for(let i=0;i<6;i++){const py=top+i*(h-top-bottom)/5;c.strokeStyle='#2b3139';c.lineWidth=1;c.beginPath();c.moveTo(left,py);c.lineTo(w-right,py);c.stroke();c.fillStyle='#848e9c';c.fillText((max-i*(max-min)/5).toFixed(1),w-right+10,py+4);}series.forEach((s,i)=>{c.strokeStyle=c.fillStyle=s.close>=s.open?'#0ecb81':'#f6465d';c.lineWidth=2;c.beginPath();c.moveTo(x(i),y(s.high));c.lineTo(x(i),y(s.low));c.stroke();const bw=Math.max(3,Math.min(24,step*.65));c.fillRect(x(i)-bw/2,Math.min(y(s.open),y(s.close)),bw,Math.max(2,Math.abs(y(s.open)-y(s.close))));if(i%Math.max(1,Math.ceil(series.length/8))===0){c.fillStyle='#848e9c';c.fillText('#'+s.day,x(i)-8,h-8);}});const item=series[Math.max(0,hover<0?series.length-1:hover)];readout.textContent=`O ${item.open}  H ${item.high}  L ${item.low}  C ${item.close} · сесія ${item.day}`;if(hover>=0){c.strokeStyle='#f0b90b88';c.setLineDash([4,4]);c.beginPath();c.moveTo(x(hover),0);c.lineTo(x(hover),h-bottom);c.stroke();c.setLineDash([]);}}canvas.onpointermove=e=>{const r=canvas.getBoundingClientRect(),i=Math.floor(((e.clientX-r.left)/r.width*w-left)/step);draw(i>=0&&i<series.length?i:-1);};canvas.onpointerleave=()=>draw();draw();}
  function benefitWallet(){return {balance:()=>model.state.cash,snapshot:()=>JSON.stringify(model.state),debit:cost=>{if(model.state.cash<cost)return false;model.state.cash-=cost;return persist();},restore:snapshot=>{model.state=JSON.parse(snapshot);persist();}};}
  function popup(title,build){document.getElementById('exchangeExtra')?.remove();const d=el('dialog','os-dialog bx-modal');d.id='exchangeExtra';const head=el('header','os-dialog-head');head.append(el('h2','',title),button('✕',()=>d.close()));d.append(head);const body=el('div','bx-modal-body');d.append(body);document.body.append(d);build(body,d);d.showModal();}
  function history(){popup('Історія угод',body=>{if(!model.state.trades.length)body.append(el('p','','Угод ще немає.'));for(const t of model.state.trades.slice().reverse()){const line=el('article','bx-history-line');line.append(el('strong','',`${t.side==='buy'?'Купівля':'Продаж'} · ${ASSETS[t.asset].name} ×${t.qty}`),el('span','',`${t.price} кр./шт. · комісія ${t.fee} · сесія ${t.day}`));body.append(line);}});}
  function oldOrders(){popup('Збережені заявки',body=>{for(const o of model.state.orders){const line=el('article','bx-history-line');line.append(el('strong','',`${ASSETS[o.asset].name} ×${o.qty} · ${o.side==='buy'?'купити ≤':'продати ≥'} ${o.target}${o.side==='buy'?' · резерв '+o.reserve+' кр.':''}`),button('Скасувати',()=>{model.cancelOrder(o.id);persist();render();document.getElementById('exchangeExtra').close();}));body.append(line);}body.append(el('p','','Вони виконуються під час наступної сесії. Нові угоди тепер виконуються одразу кнопками «Купити» та «Продати».'));});}
  function shop(){popup('Витратити кредити', (body,d)=>{const s=model.state;body.append(el('p','',`Баланс: ${fmt(s.cash)} кр. · комісія: ${(model.feeRate*100).toFixed(2)}%`));body.append(button(s.feeLevel===2?'Комісія вже мінімальна':`Зменшити комісію · ${400*2**s.feeLevel} кр.`,()=>{if(model.upgradeBroker()){d.close();act({message:'Комісію зменшено.'});}},s.feeLevel===2||s.cash<400*2**s.feeLevel));root.BrukRewardShop?.mount(body,'exchange',benefitWallet(),()=>{persist();render();d.close();});});}
  function render(){
    const s=model.state,a=ASSETS[selectedAsset],price=s.prices[selectedAsset],previous=s.history.at(-2)?.prices[selectedAsset]||price,delta=(price/previous-1)*100;container.replaceChildren();container.dataset.workspace='exchange-terminal';
    const top=el('header','bx-terminal-top');top.append(el('strong','bx-brand','◆ BrukExchange'),el('span','bx-demo','ІГРОВИЙ СПОТ · демо-кредити'));const summary=el('div','bx-summary');for(const [label,value] of [['Доступно',fmt(s.cash)],['У товарах',fmt(s.qty.reduce((n,q,i)=>n+q*s.prices[i],0))],['Капітал',fmt(model.equity)],['Сесія',s.day]]){const box=el('div');box.append(el('small','',label),el('strong','',value));summary.append(box);}top.append(summary);container.append(top);
    const content=el('div','bx-terminal-content'),market=el('section','bx-watchlist'),table=el('table','bx-table'),thead=el('thead'),tr=el('tr');for(const label of ['Ринок','Ціна','У тебе','Зміна'])tr.append(el('th','',label));thead.append(tr);table.append(thead);const tbody=el('tbody');ASSETS.forEach((asset,i)=>{const row=el('tr'),name=el('td'),choose=button(asset.symbol,()=>{selectedAsset=i;render();});choose.dataset.bxAsset=i;choose.setAttribute('aria-pressed',String(i===selectedAsset));choose.append(el('small','',asset.name));name.append(choose);const prev=s.history.at(-2)?.prices[i]||s.prices[i],change=(s.prices[i]/prev-1)*100;row.dataset.selected=String(i===selectedAsset);row.append(name,el('td','',fmt(s.prices[i])),el('td','',fmt(s.qty[i])),el('td',change>=0?'positive':'negative',(change>=0?'+':'')+change.toFixed(1)+'%'));tbody.append(row);});table.append(tbody);market.append(el('h3','','Ринки / CR'),table);content.append(market);
    const center=el('section','bx-chart-panel'),ticker=el('div','bx-ticker');ticker.append(el('strong','',a.symbol+'/CR'),el('span','',a.name),el('b',delta>=0?'positive':'negative',fmt(price)),el('span',delta>=0?'positive':'negative',(delta>=0?'+':'')+delta.toFixed(2)+'%'));center.append(ticker);const chartTools=el('nav','bx-chart-tools');chartTools.append(el('small','','Свічка / сесії'));for(const span of [1,3,5]){const b=button(String(span),()=>{candleSpan=span;render();});b.setAttribute('aria-pressed',String(span===candleSpan));chartTools.append(b);}const readout=el('small','bx-ohlc'),plot=el('canvas','bx-chart');plot.width=1000;plot.height=420;plot.setAttribute('aria-label','Свічковий графік '+a.name);center.append(chartTools,readout,plot,el('small','bx-chart-label',s.history.length<2?'Початкова ціна. Наступна сесія додасть нову свічку.':'Історія '+s.history.length+' ігрових сесій · O / H / L / C — фактичні ціни'));chart(plot,candles(s.history,selectedAsset,candleSpan),readout);
    const trades=el('div','bx-recent');trades.append(el('h3','','Останні угоди'));for(const t of s.trades.slice(-4).reverse())trades.append(el('p','',`${t.side==='buy'?'Купівля':'Продаж'} ${ASSETS[t.asset].symbol} · ${t.qty} × ${t.price} · комісія ${t.fee} · #${t.day}`));if(!s.trades.length)trades.append(el('p','','Виконані угоди з’являться тут.'));center.append(trades);content.append(center);
    const trade=el('section','bx-trade');trade.append(el('h3','','Спот · '+a.symbol),el('p','bx-holding',`Доступно: ${fmt(s.cash)} CR · ${model.available(selectedAsset)} ${a.symbol}`));const qtyRow=el('label','bx-quantity','Кількість, шт.'),input=el('input');input.id='bxQuantity';input.type='number';input.min=1;input.max=100;input.step=1;input.value=quantity;qtyRow.append(input);trade.append(qtyRow);const quote=el('div','bx-quote'),buy=button('Купити '+a.symbol,()=>act(model.trade(selectedAsset,quantity,'buy'))),sell=button('Продати '+a.symbol,()=>act(model.trade(selectedAsset,quantity,'sell')));buy.id='bxBuy';sell.id='bxSell';trade.append(quote,buy,sell,el('p','bx-position','У тебе: '+s.qty[selectedAsset]+' шт.'),el('small','',`Комісія: ${(model.feeRate*100).toFixed(2)}%`));const help=el('details','bx-help'),helpTitle=el('summary','','Як торгувати');help.append(helpTitle,el('p','','Обери товар, вкажи кількість і купи або продай. Кнопка «Наступна сесія» змінює ціни. CR — окремі ігрові кредити біржі. Свічки будуються лише з цін твоїх сесій.'));trade.append(help);content.append(trade);container.append(content);
    function updateQuote(){quantity=Math.max(1,Math.min(100,Math.floor(Number(input.value)||1)));const fee=model.fee(price,quantity),cost=price*quantity+fee,receive=price*quantity-fee;quote.replaceChildren(el('span','',`Купівля: ${fmt(cost)} CR`),el('span','',`Продаж: ${fmt(receive)} CR`),el('small','',`Комісія в обох сумах: ${fee} CR`));buy.disabled=s.cash<cost||s.qty[selectedAsset]+quantity>1000000;sell.disabled=model.available(selectedAsset)<quantity;}input.addEventListener('input',updateQuote);input.addEventListener('change',()=>{updateQuote();input.value=quantity;});updateQuote();
    const footer=el('nav','bx-footer'),next=button('Наступна сесія →',()=>{const count=model.nextDay();act({message:'Ціни оновлено.'+(count?' Виконано заявок: '+count+'.':'')});});next.id='bxNext';footer.append(next,button('Історія',history),button('Витратити кредити',shop));if(s.orders.length)footer.append(button('Збережені заявки: '+s.orders.length,oldOrders));container.append(footer,el('div','bx-news',s.news));
  }
  root.BrukExchange={mount(target){container=target;render();},model};
})(typeof window!=='undefined'?window:globalThis);
