(() => {
  'use strict';
  if(typeof window!=='undefined'&&window.BrukDevice?.blocked)return;
  const V=window.BrukVentures,$=id=>document.getElementById(id);
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const money=n=>window.BrukMoney?.format(n)||Math.round(n).toLocaleString('uk-UA');
  function button(text,action,id,disabled=false){const b=el('button','venture-button',text);b.type='button';if(id)b.id=id;b.disabled=disabled;b.addEventListener('click',action);return b;}
  function hero(root,kicker,title,copy){const h=el('div','venture-hero');h.append(el('small','',kicker),el('h2','',title),el('p','',copy));root.append(h);}
  function stat(label,value){const s=el('div','venture-stat');s.append(el('small','',label),el('strong','',value));return s;}
  let cleanup=null,selectedMaterial='brick',rotated=false,demolish=false,carFilter='Усі';
  function mount(root,kind,api){if(cleanup)cleanup();root.replaceChildren();cleanup=kind==='estate'?estate(root,api):garage(root,api);window.BrukHelp?.fold(root);window.BrukWorkspace?.business(root,kind);}
  function close(){if(cleanup)cleanup();cleanup=null;}
  function estate(root,api){
    const state=api.estate();hero(root,'BRUK ESTATE / BUILD SANDBOX','Твоя ділянка','Збудуй власний будинок із секцій. Гравітація, маса, розподіл навантаження й міцність опор впливають на стійкість конструкції.');
    if(!state.owned){
      const card=el('div','plot-offer');card.innerHTML='<div class="plot-art"><span>▱</span><i></i><b>10 соток / ігрова ділянка</b></div><div><small>МІСЦЕ ДЛЯ ТВОГО ПРОЄКТУ</small><h3>Ділянка біля міста</h3><p>Вільне будівництво, 7 матеріалів, арматура та поліпшення. Матеріали купуються за ігрові UAH під час розміщення.</p></div>';
      card.append(button(`Купити ділянку · ${money(V.PLOT_PRICE)} UAH`,()=>{if(state.owned)return;if(api.buy(V.PLOT_PRICE,()=>state.owned=true)){api.message('Ділянку придбано. Починай із міцних опор.');mount(root,'estate',api);}},'buyPlot',api.balance()<V.PLOT_PRICE));root.append(card);return ()=>{};
    }
    const world=new V.BuildingWorld(state);let running=false,frameId=null,previous=null,selected=null,ghost=null,dirty=false,lastSave=0;
    const metrics=el('div','venture-stats');metrics.append(stat('СЕКЦІЙ','0'),stat('МАСА','0 кг'),stat('ВИСОТА','0'),stat('СТІЙКІСТЬ','Проєкт'));root.append(metrics);
    const layout=el('div','build-layout'),palette=el('div','material-palette');
    for(const [id,m] of Object.entries(V.MATERIALS)){
      const b=button('',()=>{selectedMaterial=id;demolish=false;updateTools();},'material-'+id);b.classList.add('material-button');b.style.setProperty('--material',m.color);
      b.append(el('strong','',m.name),el('small','',`${m.mass} кг · ${money(m.price)} UAH`));palette.append(b);
    }layout.append(palette);root.append(layout);
    const controls=el('div','venture-toolbar');
    const play=button('▶ Запустити фізику',()=>{running=!running;play.textContent=running?'Ⅱ Пауза / редагування':'▶ Запустити фізику';if(!running)save();},'buildPlay');
    controls.append(play,button('⟳ Повернути',()=>{rotated=!rotated;updateTools();},'buildRotate'),button('⌫ Демонтаж',()=>{demolish=!demolish;updateTools();},'buildDemolish'),button('Перевірити будинок',inspect,'buildInspect'));root.append(controls);
    const stage=el('div','construction-stage'),canvas=el('canvas','');canvas.id='constructionCanvas';canvas.width=1000;canvas.height=700;canvas.tabIndex=0;canvas.setAttribute('aria-label','Ділянка: вибери матеріал і торкнися поля, щоб розмістити секцію');stage.append(canvas);root.append(stage);
    const detail=el('div','build-detail','Розміщуй секції у режимі проєкту. Запусти фізику, щоб перевірити опори.');detail.id='buildDetail';root.append(detail);
    const upgrades=el('div','venture-upgrades');
    for(const [key,title,copy] of [['foundation','Фундамент','Більше допустиме навантаження на ділянку.'],['quality','Якість матеріалів','+25% міцності кожного матеріалу за рівень.'],['crane','Кран','+90 до висоти будівництва за рівень.']]){
      const card=el('article','');card.append(el('h3','',title),el('p','',copy),el('small','',`Рівень ${state.upgrades[key]} / 3`));
      const cost=V.upgradeCost(key,state.upgrades[key]);card.append(button(state.upgrades[key]>=3?'Максимум':`Покращити · ${money(cost)} UAH`,()=>{if(state.upgrades[key]>=3)return;save();const currentCost=V.upgradeCost(key,state.upgrades[key]);if(api.buy(currentCost,()=>state.upgrades[key]++))mount(root,'estate',api);},'upgrade-'+key,state.upgrades[key]>=3||api.balance()<cost));upgrades.append(card);
    }root.append(upgrades);
    const help=el('details','venture-help');help.innerHTML='<summary>Як будувати?</summary><ol><li>Вибери матеріал і розмісти його на ділянці. Оплата — за кожну секцію. Секції не можуть перетинатися.</li><li>Для арматури вибери інструмент і натисни на бетон, цеглу або газоблок: маса зросте на 15 кг, міцність — у 1.8 раза.</li><li>Запусти фізику. Без опори блоки падають; неврівноважені звисають і зсуваються. Слабкі опори під надмірною масою руйнуються.</li><li>Постав фізику на паузу, щоб продовжити. Демонтаж не повертає гроші.</li><li>Для приймання будинку: 12 секцій, висота від 160, 8 несучих секцій, покрівля, вікно та стійкість понад 1.2 секунди. Перше приймання дає 25 000 UAH.</li></ol><p>Це ігрова модель маси й навантажень. Зелений — запас міцності, жовтий — високе навантаження, червоний — перевантаження.</p>';root.append(help);
    const ctx=canvas.getContext('2d');
    function save(){state.bodies=world.serialize();dirty=false;api.commit();}
    function inspect(){const result=world.inspect();detail.replaceChildren();for(const [name,ok] of result.conditions)detail.append(el('span',ok?'condition-good':'condition-bad',`${ok?'✓':'○'} ${name} `));
      if(result.accepted){if(!state.claimed){state.claimed=true;const earned=api.reward(25000);api.message(`Будинок прийнято! +${money(earned)} UAH. Нагорода видається один раз.`);}else api.message('Будинок стійкий. Нагороду за ділянку вже отримано.');save();}else api.message('Будинок ще не готовий. Перевір умови під полем та запусти фізику.');}
    function updateTools(){palette.querySelectorAll('button').forEach(b=>b.classList.toggle('active',!demolish&&b.id==='material-'+selectedMaterial));$('buildDemolish').classList.toggle('active',demolish);$('buildRotate').textContent=rotated?'⟳ Поворот 90°':'⟳ Повернути';}
    function at(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1000,y:(e.clientY-r.top)/r.height*700};}
    canvas.addEventListener('pointermove',e=>{ghost=at(e);});canvas.addEventListener('pointerleave',()=>ghost=null);
    canvas.addEventListener('pointerdown',e=>{
      e.preventDefault();const p=at(e),body=world.bodies.slice().reverse().find(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h);selected=body?.id||null;
      if(running){api.message('Постав фізику на паузу, щоб редагувати проєкт.');return;}
      if(demolish){if(body){world.remove(body.id);save();}return;}
      if(selectedMaterial==='rebar'){
        if(!body||body.reinforced||!['brick','block','concrete'].includes(body.material)){api.message('Арматура підсилює існуючу бетонну, цегляну або газобетонну секцію.');return;}
        const change=()=>{world.reinforce(body.id);state.bodies=world.serialize();};const ok=api.perks().rebarStock>0?api.usePerk('rebarStock',change):api.buy(V.MATERIALS.rebar.price,change);if(ok)api.message('Секцію армовано: +15 кг та ×1.8 до міцності.');return;
      }
      const x=Math.floor(p.x/20)*20,y=Math.floor(p.y/20)*20,m=V.MATERIALS[selectedMaterial];
      if(!world.canPlace(selectedMaterial,x,y,rotated)){if(body)describe(body);else api.message(`Не можна розмістити тут: перетин, межа або висота понад ${world.heightLimit}.`);return;}
      const change=()=>{if(!world.place(selectedMaterial,x,y,rotated))return false;state.bodies=world.serialize();};const free=selectedMaterial==='brick'&&api.perks().brickStock>0;const ok=free?api.usePerk('brickStock',change):api.buy(m.price,change);if(ok)api.message(`${m.name}: розміщено${free?' зі складу майстерні':''}, маса ${m.mass} кг.`);
    });
    function describe(b){detail.textContent=`${V.MATERIALS[b.material].name} · маса ${V.mass(b)} кг · навантаження ${Math.round(b.load)} / ${Math.round(world.capacity(b))} кг · ${b.grounded?'є опора':'немає стійкої опори'}${b.reinforced?' · армовано':''}`;}
    function draw(){
      ctx.fillStyle='#1a303e';ctx.fillRect(0,0,1000,700);ctx.fillStyle='#d8e3b0';ctx.beginPath();ctx.arc(853,91,31,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#253f49';for(let i=0;i<7;i++)ctx.fillRect(i*170-20,440-i*23%100,130,240);
      ctx.strokeStyle='#b3cfb31a';ctx.lineWidth=1;for(let x=0;x<1000;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,V.FLOOR);ctx.stroke();}for(let y=0;y<V.FLOOR;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1000,y);ctx.stroke();}
      ctx.fillStyle='#637667';ctx.fillRect(0,V.FLOOR,1000,60);ctx.fillStyle='#b7c0a9';ctx.fillRect(0,V.FLOOR,1000,7+state.upgrades.foundation*2);
      ctx.setLineDash([7,8]);ctx.strokeStyle='#dfc18a55';ctx.beginPath();ctx.moveTo(0,V.FLOOR-world.heightLimit);ctx.lineTo(1000,V.FLOOR-world.heightLimit);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#bcc9c7';ctx.font='600 12px system-ui';ctx.fillText(`КРАН: ${world.heightLimit} · ФУНДАМЕНТ: ${money(world.foundationLimit)} кг`,22,28);
      for(const b of world.bodies){const m=V.MATERIALS[b.material];ctx.fillStyle=m.color;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#ffffff20';ctx.fillRect(b.x,b.y,b.w,4);ctx.strokeStyle=b.ratio>1?'#ff7676':b.ratio>.75?'#f2ce75':'#142b32';ctx.lineWidth=b.ratio>.75?3:1;ctx.strokeRect(b.x,b.y,b.w,b.h);
        if(b.material==='brick'){ctx.strokeStyle='#6f4e3f';ctx.beginPath();ctx.moveTo(b.x,b.y+b.h/2);ctx.lineTo(b.x+b.w,b.y+b.h/2);ctx.moveTo(b.x+b.w/2,b.y);ctx.lineTo(b.x+b.w/2,b.y+b.h/2);ctx.stroke();}
        if(b.material==='glass'){ctx.strokeStyle='#d9eef0';ctx.beginPath();ctx.moveTo(b.x+b.w/2,b.y);ctx.lineTo(b.x+b.w/2,b.y+b.h);ctx.moveTo(b.x,b.y+b.h/2);ctx.lineTo(b.x+b.w,b.y+b.h/2);ctx.stroke();}
        if(b.reinforced){ctx.strokeStyle='#e6b3a0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x+5,b.y+b.h/3);ctx.lineTo(b.x+b.w-5,b.y+b.h/3);ctx.moveTo(b.x+5,b.y+b.h*2/3);ctx.lineTo(b.x+b.w-5,b.y+b.h*2/3);ctx.stroke();}
        if(b.id===selected){ctx.strokeStyle='#e6f6ae';ctx.lineWidth=2;ctx.strokeRect(b.x-3,b.y-3,b.w+6,b.h+6);}
      }
      for(const d of world.debris){ctx.globalAlpha=1-d.age;ctx.fillStyle=d.color;for(let i=0;i<6;i++)ctx.fillRect(d.x+Math.cos(i)*d.age*55,d.y+Math.sin(i)*d.age*30+d.age*d.age*70,10,7);ctx.globalAlpha=1;}
      if(ghost&&!running&&!demolish&&selectedMaterial!=='rebar'){const m=V.MATERIALS[selectedMaterial],x=Math.floor(ghost.x/20)*20,y=Math.floor(ghost.y/20)*20;ctx.globalAlpha=.4;ctx.fillStyle=world.canPlace(selectedMaterial,x,y,rotated)?'#c7ef9d':'#f58b8b';ctx.fillRect(x,y,rotated?m.h:m.w,rotated?m.w:m.h);ctx.globalAlpha=1;}
    }
    function frame(time){const dt=previous===null?0:Math.min(.035,(time-previous)/1000);previous=time;
      if(running&&$('businessHost').open&&!document.hidden){world.step(dt);dirty=true;if(time-lastSave>1200){save();lastSave=time;}}
      const inventory=api.perks();palette.querySelectorAll('button small').forEach((node,i)=>{const [id,m]=Object.entries(V.MATERIALS)[i];node.textContent=`${m.mass} кг · ${money(m.price)} UAH`+((id==='brick'&&inventory.brickStock)?` · склад ${inventory.brickStock}`:(id==='rebar'&&inventory.rebarStock)?` · склад ${inventory.rebarStock}`:'');});const m=world.analyze(),values=[`${world.bodies.length}/${V.MAX_BODIES}`,`${money(m.totalMass)} кг`,Math.round(m.height),m.stable?'Стійко':m.overloaded?'Перевантаження':'Перевір опори'];metrics.querySelectorAll('strong').forEach((b,i)=>b.textContent=values[i]);if(selected){const b=world.bodies.find(b=>b.id===selected);if(b&&running)describe(b);}draw();frameId=requestAnimationFrame(frame);
    }
    updateTools();draw();frameId=requestAnimationFrame(frame);return ()=>{cancelAnimationFrame(frameId);if(dirty)save();};
  }
  function garage(root,api){
    const state=api.garage();hero(root,'BRUK GARAGE / COLLECTION','Твій гараж','Від Жигуля до гіперкара. Купуй авто, вибирай активну машину та створюй свій стиль. Активне авто можна випробувати у Bruk Rally в Steam.');
    let previewId=state.active||V.CARS[0].id,previewColor=null,testDrive=false,time=0,last=null,frameId=null;
    const filters=el('div','garage-filters');for(const tier of ['Усі','Бюджетні','Середній клас','Преміум','Гіперкари'])filters.append(button(tier,()=>{carFilter=tier;renderCards();},'tier-'+filters.children.length));root.append(filters);
    const viewer=el('div','garage-viewer'),canvas=el('canvas','');canvas.id='garageCanvas';canvas.width=1000;canvas.height=400;viewer.append(canvas);root.append(viewer);
    const info=el('div','garage-info'),custom=el('div','garage-custom'),cards=el('div','garage-cards');root.append(info,custom,cards);
    function car(){return V.CARS.find(c=>c.id===previewId);}
    function style(){return state.custom[previewId]||V.defaultStyle(car());}
    function refresh(){
      previewColor=null;const c=car(),owned=state.owned.includes(c.id);info.replaceChildren();info.append(el('h3','',c.name),el('p','',`${c.tier} · ${owned?'У твоїй колекції':money(c.price)+' UAH'} · ${state.active===c.id?'Активне авто':'Динаміка '+c.rating.toFixed(1)}`));
      info.append(button(owned?state.active===c.id?'Активна машина':'Обрати машину':`Купити · ${money(c.price)} UAH`,()=>{
        if(state.owned.includes(c.id)){state.active=c.id;api.commit();refresh();renderCards();return;}
        if(api.buy(c.price,()=>{state.owned.push(c.id);state.custom[c.id]=V.defaultStyle(c);state.active=c.id;})){api.message(`${c.name} придбано. Можна змінювати стиль.`);refresh();renderCards();}
      },'buyCar',!owned&&api.balance()<c.price));
      custom.replaceChildren();if(!owned){custom.append(el('p','venture-caption','Кастомізація стане доступною після покупки цієї машини.'));return;}
      const s=style(),paint=el('div','garage-option');paint.append(el('strong','',api.perks().paintVouchers>0?`Фарбування · талонів ${api.perks().paintVouchers}`:'Фарбування · 800 UAH'));const picker=el('input','');picker.id='carColor';picker.type='color';picker.value=s.color;picker.addEventListener('input',()=>previewColor=picker.value);paint.append(picker,button(api.perks().paintVouchers>0?'Фарбування · 1 талон':'Пофарбувати · 800 UAH',()=>{const next=picker.value;if(next===s.color)return;const ok=api.perks().paintVouchers>0?api.usePerk('paintVouchers',()=>s.color=next):api.buy(800,()=>s.color=next);if(ok){api.message('Колір кузова змінено.');refresh();}},'paintCar'));custom.append(paint);
      const rims=el('div','garage-option');rims.append(el('strong','','Диски'));for(const [i,title,cost] of [[0,'Заводські',0],[1,'Sport',2500],[2,'Mesh',6000],[3,'Five spoke',8500],[4,'Turbine',12000],[5,'Forged Gold',18000],[6,'Carbon Aero',26000]])rims.append(button(`${title}${i&&!s.unlocks.includes('rims'+i)?' · '+money(cost)+' UAH':''}`,()=>{
        if(s.rims===i)return;const key='rims'+i,price=i&&!s.unlocks.includes(key)?cost:0;if(api.buy(price,()=>{if(i&&!s.unlocks.includes(key))s.unlocks.push(key);s.rims=i;}))refresh();
      },'carRims'+i));custom.append(rims);
      function choices(label,field,items){const row=el('div','garage-option');row.append(el('strong','',label));const select=el('select','');select.id='car-'+field;items.forEach(([name])=>{const o=el('option','',name);o.value=select.children.length;select.append(o);});select.value=s[field]||0;const buy=button('Встановити',()=>{const n=Number(select.value),key=field==='spoilerType'?(n===1?'spoiler':'spoiler'+n):(n===1?'wrap':'wrap'+n),price=n&&!s.unlocks.includes(key)?items[n][1]:0;if(api.buy(price,()=>{if(n&&!s.unlocks.includes(key))s.unlocks.push(key);s[field]=n;s[field==='spoilerType'?'spoiler':'wrap']=n>0;}))refresh();},'buy-'+field);function hint(){const n=Number(select.value),key=field==='spoilerType'?(n===1?'spoiler':'spoiler'+n):(n===1?'wrap':'wrap'+n);buy.textContent=n&&!s.unlocks.includes(key)?'Купити · '+money(items[n][1])+' UAH':'Встановити';}select.onchange=hint;hint();row.append(select,buy);custom.append(row);}
      choices('Спойлер','spoilerType',[['Без спойлера',0],['Lip · низький',3500],['Sport · дуга',8500],['GT Wing · трек',18000]]);
      choices('Ліврея та стікери','livery',[['Без лівреї',0],['Racing · смуги',4500],['Heritage · широка смуга',6500],['Velocity · діагоналі',9500],['Volt · блискавка',12000],['Track 07 · номер',16000]]);
      for(const [key,title,cost] of [['neon','Неон',5500],['lowered','Заниження',3000]]){const b=button(`${s[key]?'✓ ':''}${title}${s.unlocks.includes(key)?' · перемкнути':' · '+money(cost)+' UAH'}`,()=>{const owned=s.unlocks.includes(key);if(api.buy(owned?0:cost,()=>{if(!owned)s.unlocks.push(key);s[key]=!s[key];}))refresh();},'carStyle-'+key);custom.append(b);}
      const neon=el('label','garage-option');neon.append(el('strong','','Колір неону'));const neonColor=el('input','garage-neon-color');neonColor.id='carNeonColor';neonColor.type='color';neonColor.value=s.neonColor;neonColor.disabled=!s.unlocks.includes('neon');neonColor.oninput=()=>{s.neonColor=neonColor.value;api.commit();};neon.append(neonColor,el('small','','Безкоштовно після покупки неону · висота слідує заниженню'));custom.append(neon);
      const cost=Math.round(c.price*.15*1.6**s.engine);custom.append(button(s.engine>=10?'Двигун · максимум':`Двигун ${s.engine}/10 → +1 · ${money(cost)} UAH`,()=>{if(s.engine<10&&api.buy(Math.round(c.price*.15*1.6**s.engine),()=>s.engine++))refresh();},'carEngine',s.engine>=10||api.balance()<cost),button(testDrive?'Ⅱ Зупинити тест':'▶ Тест-драйв',()=>{testDrive=!testDrive;refresh();},'carTest'));
      custom.append(el('p','venture-caption','Талони фарбування з BrukExchange або логістики замінюють оплату 800 UAH. Деталі купуються один раз і потім перемикаються безкоштовно. Перефарбування оплачується за кожний новий колір. Ціни та динаміка — ігрові.'));window.BrukHelp?.fold(custom);
    }
    function renderCards(){cards.replaceChildren();for(const c of V.CARS.filter(c=>carFilter==='Усі'||c.tier===carFilter)){
      const card=el('article','garage-car-card'),icon=el('canvas','');icon.width=440;icon.height=180;icon.getContext('2d').fillStyle='#1a303e';icon.getContext('2d').fillRect(0,0,440,180);V.drawCar(icon.getContext('2d'),220,115,1.05,c,state.custom[c.id]||{});card.append(icon,el('h3','',c.name),el('small','',c.tier),el('strong','',state.owned.includes(c.id)?'У гаражі ✓':money(c.price)+' UAH'),button('Переглянути',()=>{previewId=c.id;testDrive=false;refresh();},'view-car-'+c.id));cards.append(card);
    }window.BrukFit?.pages(cards,':scope>.garage-car-card',3);}
    const ctx=canvas.getContext('2d');function frame(t){const dt=last===null?0:Math.min(.04,(t-last)/1000);last=t;if(testDrive&&!document.hidden)time+=dt;ctx.fillStyle='#142635';ctx.fillRect(0,0,1000,400);ctx.fillStyle='#243a47';ctx.fillRect(0,310,1000,90);ctx.strokeStyle='#7e9b9b44';for(let x=-100;x<1100;x+=150){ctx.beginPath();ctx.moveTo(x-(testDrive?time*260%150:0),360);ctx.lineTo(x+70-(testDrive?time*260%150:0),360);ctx.stroke();}ctx.strokeStyle='#72859433';ctx.strokeRect(115,38,770,224);V.drawCar(ctx,500,255,2.35,car(),{...style(),color:previewColor||style().color},testDrive?time:0);ctx.fillStyle='#adc5ce';ctx.font='600 15px system-ui';ctx.fillText(car().name.toUpperCase(),35,40);if(testDrive){ctx.fillStyle='#d3eca8';ctx.fillText('ТЕСТ-ДРАЙВ · '+Math.round((car().rating+style().engine*.25)*time*18)+' м',35,67);}frameId=requestAnimationFrame(frame);}
    renderCards();refresh();frameId=requestAnimationFrame(frame);return ()=>cancelAnimationFrame(frameId);
  }
  window.BrukBusiness={mount,close};
})();
