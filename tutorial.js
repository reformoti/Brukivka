(function(root){
  'use strict';
  const KEY='brukivka_tutorial_v2';
  const fresh=s=>s.earned===0&&s.balance===0&&s.brick===0&&s.route===0&&!s.pc&&!s.order?.active&&!s.order?.completed;
  function next(phase,s,ui){
    if(phase===0&&s.earned>0)return 1;
    if(phase===1&&s.balance>=40)return 2;
    if(phase===2&&ui.phone)return 3;
    if(phase===3&&ui.screen==='telegramScreen')return 4;
    if(phase===4&&ui.screen==='reformotiChatScreen')return 5;
    if(phase===5&&(s.order?.active||s.order?.completed))return 6;
    if(phase===6&&s.order?.completed)return 7;
    if(phase===7&&s.brick>0)return 8;
    if(phase===8&&s.route===1)return 9;
    return phase;
  }
  const normalize=x=>Number.isInteger(x)&&x>=0&&x<=10?x:null;
  if(typeof module==='object'&&module.exports){module.exports={fresh,next,normalize};return;}
  if(root.BrukDevice?.blocked||!root.BrukOnboarding)return;
  const api=root.BrukOnboarding,$=id=>document.getElementById(id);
  let phase=null;try{phase=normalize(JSON.parse(localStorage.getItem(KEY))?.phase);}catch{}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({phase}));if(phase===10)localStorage.setItem('brukivka_tutorial_seen_v1','1');}catch{}}
  if(phase===null){if(!fresh(api.read())){phase=10;save();return;}if(!api.begin())return;phase=0;save();}
  if(phase===10)return;
  const layer=document.createElement('div');layer.className='tutorial-layer';
  layer.innerHTML='<svg class="tutorial-guide" aria-hidden="true"><defs><marker id="tutorial-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="currentColor"/></marker></defs><path class="tutorial-route" marker-end="url(#tutorial-arrow)"/></svg><div class="tutorial-frame" aria-hidden="true"><span>↓</span></div><section class="tutorial-card" role="region" aria-label="Покрокове навчання"><small id="tutorialCount"></small><h2 id="tutorialTitle"></h2><p id="tutorialText" role="status" aria-live="polite"></p><button type="button" id="tutorialFinish" hidden>Почати самостійну гру →</button></section>';
  document.body.append(layer);document.body.classList.add('tutorial-active');
  const card=layer.querySelector('.tutorial-card'),frame=layer.querySelector('.tutorial-frame'),route=layer.querySelector('.tutorial-route'),inert=new Map();
  let allowed=[],stopped=false;
  const ui=()=>({phone:!$('phoneOverlay').classList.contains('hidden'),screen:[...document.querySelectorAll('.phone-screen')].find(n=>!n.classList.contains('hidden'))?.id});
  function resolve(s,u){
    const board=['#gameBoard'];
    if(phase===9)return {title:'Ти готовий грати самостійно!',text:'Доставляй бруківку й бери нові замовлення в Telegram. Покращуй бруківку, телефон і силу, щоб заробляти більше. Відкривай маршрути, купуй ПК та досліджуй програми й ігри Steam. В «Акаунті» можна зберегти прогрес. Тепер усі рішення — за тобою.',targets:[]};
    if(phase<=1)return {title:phase===0?'Перша доставка':'Накопич 40 грн',text:phase===0?'Затисни бруківку мишею та перетягни її в карман праворуч. Відпусти після доставки. На складі немає перешкод.':`Повторюй доставку. Кожна приносить 10 грн. На балансі: ${Math.floor(s.balance)} / 40 грн.`,targets:board,drag:true};
    if(phase===2)return {title:'Відкрий телефон',text:'40 грн уже є! У телефоні знаходяться замовлення та покращення. Натисни підсвічену кнопку.',targets:['#phoneButton']};
    if(phase===3||phase===4||phase===5){
      if(!u.phone)return {title:'Повернися до телефону',text:'Продовжимо навчання в Telegram.',targets:['#phoneButton']};
      if(u.screen==='phoneHome')return {title:'Відкрий Telegram',text:'Тут можна брати замовлення з додатковою оплатою. Інші програми відкриються після навчання.',targets:['#telegramApp']};
      if(u.screen==='telegramScreen')return {title:'Відкрий чат reformoti',text:'У цьому чаті є твоє перше замовлення на доставку бруківки.',targets:['#reformotiChatOpen']};
      if(u.screen==='reformotiChatScreen')return {title:'Прийми замовлення',text:'Потрібно доставити 6 бруківок. Після виконання отримаєш 3 200 грн бонусу. Натисни «Прийняти поставку».',targets:['#orderActionArea button']};
      return {title:'На головний екран',text:'Натисни нижню смужку телефону, щоб знайти Telegram.',targets:['#phoneHomeButton']};
    }
    if(phase===6){if(u.phone)return {title:'Повернися до доставки',text:'Замовлення прийняте! Закрий телефон хрестиком. Доставки зараховуються автоматично.',targets:['#closePhone']};return {title:'Виконай замовлення',text:`Доставлено ${s.order?.progress||0} / ${s.order?.target||6}. Перетягуй бруківку в карман — після останньої доставки бонус надійде автоматично.`,targets:board,drag:true};}
    if(phase===7){
      if(s.balance<s.upgradeCost){if(u.phone)return {title:'Ще кілька доставок',text:'Закрий телефон і накопич на покращення.',targets:['#closePhone']};return {title:'Накопич на покращення',text:`Потрібно ${s.upgradeCost} грн. Зараз: ${Math.floor(s.balance)} грн.`,targets:board,drag:true};}
      if(!u.phone)return {title:'Купи перше покращення',text:'Замовлення виконане, бонус уже на балансі! Відкрий телефон.',targets:['#phoneButton']};
      if(u.screen==='phoneHome')return {title:'Відкрий BrukBank',text:'Тут знаходяться покращення бруківки. Вони підвищують дохід від кожної доставки.',targets:['#bankApp']};
      if(u.screen==='bankScreen')return {title:'Прокачай бруківку',text:`Перше покращення коштує ${s.upgradeCost} грн і збільшує дохід. Натисни підсвічену кнопку.`,targets:['#brickUpgradeButton']};
      return {title:'Знайди покращення',text:'Натисни нижню смужку, потім відкрий BrukBank.',targets:['#phoneHomeButton']};
    }
    if(u.phone)return {title:'Наступний маршрут',text:'Покращення куплене! Закрий телефон — відкриємо новий рівень доставки.',targets:['#closePhone']};
    if(s.balance<s.routeCost)return {title:'Накопич на новий маршрут',text:`Для «Лазерних воріт» потрібно ${s.routeCost} грн. Зараз ${Math.floor(s.balance)} грн. Продовжуй доставки.`,targets:board,drag:true};
    if(!$('routeMenu').open)return {title:'Відкрий маршрути',text:'Новий маршрут дає більший множник доходу. Натисни «Маршрути» зверху.',targets:['.main-quick-tools button:first-child']};
    return {title:'Купи «Лазерні ворота»',text:'Вартість — 2 500 грн, множник доходу — ×1. Доступ залишиться назавжди. На цьому маршруті уникай лазерів: зіткнення знімає 500 грн.',targets:['#deliveryLevels [data-route="1"]']};
  }
  function permitted(node){return node instanceof Element&&(card.contains(node)||allowed.some(el=>el===node||el.contains(node)));}
  function guard(e){if(stopped)return;if(e.type==='keydown'&&e.key==='Escape')return;if(!permitted(e.target)){e.preventDefault();e.stopImmediatePropagation();}}
  ['pointerdown','click','keydown','focusin'].forEach(type=>root.addEventListener(type,guard,true));
  function cleanup(){stopped=true;clearInterval(timer);for(const [el,original] of inert){el.inert=original;el.classList.remove('tutorial-muted');}document.body.classList.remove('tutorial-active');layer.remove();['pointerdown','click','keydown','focusin'].forEach(type=>root.removeEventListener(type,guard,true));}
  $('tutorialFinish').onclick=()=>{phase=10;save();cleanup();};
  function tick(){
    const s=api.read(),u=ui();let n=next(phase,s,u);if(n!==phase){phase=n;save();}
    if(phase===9&&$('routeMenu')?.open)$('routeMenu').close();
    const host=$('routeMenu')?.open?$('routeMenu'):document.body;if(layer.parentElement!==host)host.append(layer);
    const step=resolve(s,u);allowed=step.targets.map(selector=>document.querySelector(selector)).filter(Boolean);
    $('tutorialCount').textContent=phase===9?'НАВЧАННЯ ЗАВЕРШЕНО':`НАВЧАННЯ · ${phase+1} / 9`;
    $('tutorialTitle').textContent=step.title;if($('tutorialText').textContent!==step.text)$('tutorialText').textContent=step.text;
    $('tutorialFinish').hidden=phase!==9;
    document.querySelectorAll('button,a[href],input,select,textarea,[role="button"]').forEach(el=>{if(layer.contains(el))return;if(!inert.has(el))inert.set(el,el.inert);const ok=permitted(el);el.inert=ok?inert.get(el):true;el.classList.toggle('tutorial-muted',!ok);});
    const target=allowed[0],r=target?.getBoundingClientRect();frame.hidden=!r||r.width===0;
    if(r){Object.assign(frame.style,{left:r.left-5+'px',top:r.top-5+'px',width:r.width+10+'px',height:r.height+10+'px'});frame.querySelector('span').hidden=!!step.drag;}
    route.setAttribute('d','');if(step.drag){const a=$('brukivka').getBoundingClientRect(),b=$('pocket').getBoundingClientRect();route.setAttribute('d',`M${a.right+10},${a.top+a.height/2} Q${(a.right+b.left)/2},${a.top-65} ${b.left-10},${b.top+b.height/2}`);}
  }
  let timer=setInterval(tick,250);tick();
})(typeof window==='undefined'?globalThis:window);
