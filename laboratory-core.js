(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./money-core'):root.BrukMoney);if(typeof module==='object'&&module.exports)module.exports=api;else root.BrukLabCore=api;})(typeof window==='undefined'?globalThis:window,M=>{
 'use strict';
 const MAX_LEVEL=10,OFFLINE=8*3600,RESOURCE_CAP=1e90;
 const FACILITIES=[
  {id:'accelerator',name:'Прискорювач антиматерії',kind:'accelerator',price:5e18,antimatter:.25,energy:.8,research:.03,detail:'Перші античастинки та магнітне утримання.'},
  {id:'bottle',name:'Магнітна пастка',kind:'bottle',price:2e21,antimatter:125,energy:350,research:.3,detail:'Надпровідна камера для щільних хмар антиматерії.'},
  {id:'reactor',name:'Анігіляційний реактор',kind:'reactor',price:8e24,antimatter:5e5,energy:2e6,research:3,detail:'Потужний синтез та перетворення античастинок.'},
  {id:'gravity',name:'Гравітаційна обсерваторія',kind:'gravity',price:3e28,antimatter:2e9,energy:8e9,research:30,detail:'Дослідження викривлень простору навколо сингулярності.'},
  {id:'portal',name:'Квантовий портал',kind:'portal',price:1e32,antimatter:7e12,energy:3e13,research:300,detail:'Потік ресурсів із паралельного виміру.'},
  {id:'universe',name:'Карманний всесвіт',kind:'universe',price:5e36,antimatter:3e17,energy:2e18,research:3000,detail:'Мініатюрний космос у лабораторному контейнері.'}
 ];
 const STUDIES=[
  {id:'containment',name:'Стабілізація поля',antimatter:100,energy:0,research:10,detail:'+50% до виробництва ресурсів за ранг.'},
  {id:'catalyst',name:'Каталізатор анігіляції',antimatter:0,energy:150,research:40,detail:'+40% до виплати за антиматерію за ранг.'},
  {id:'compression',name:'Стиснення простору',antimatter:500,energy:0,research:150,detail:'Множник доходу від дослідження: (ранг + 1)².'}
 ];
 const record=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
 const rank=x=>Number.isInteger(x)?Math.max(0,Math.min(MAX_LEVEL,x)):0;
 const resource=x=>typeof x==='number'&&Number.isFinite(x)?Math.max(0,Math.min(RESOURCE_CAP,x)):0;
 function normalize(raw={},now=Date.now()){
  raw=record(raw);const facilities=record(raw.facilities),studies=record(raw.studies);
  return {facilities:Object.fromEntries(FACILITIES.map(f=>[f.id,rank(facilities[f.id])])),studies:Object.fromEntries(STUDIES.map(s=>[s.id,rank(studies[s.id])])),antimatter:resource(raw.antimatter),energy:resource(raw.energy),research:resource(raw.research),lastAt:Number.isSafeInteger(raw.lastAt)&&raw.lastAt>=0?Math.min(raw.lastAt,now):now};
 }
 function effects(raw){const s=normalize(raw);return {production:1+s.studies.containment*.5,sale:1+s.studies.catalyst*.4,income:FACILITIES.reduce((v,f)=>v*(1+s.facilities[f.id]*3),1)*(1+s.studies.compression)**2};}
 function rates(raw){const s=normalize(raw),boost=effects(s).production,result={antimatter:0,energy:0,research:0};for(const f of FACILITIES){const level=s.facilities[f.id];if(level)for(const k of Object.keys(result))result[k]+=f[k]*3**(level-1)*boost;}return result;}
 function settle(raw,now=Date.now()){
  const s=normalize(raw,now),seconds=Math.min(OFFLINE,Math.max(0,(now-s.lastAt)/1000)),rate=rates(s);for(const k of Object.keys(rate))s[k]=Math.min(RESOURCE_CAP,s[k]+rate[k]*seconds);s.lastAt=now;return {state:s,seconds,rates:rate};
 }
 function facilityPrice(raw,id){const s=normalize(raw),f=FACILITIES.find(f=>f.id===id);return !f||s.facilities[id]>=MAX_LEVEL?null:Math.round(f.price*3.7**s.facilities[id]);}
 function buyFacility(raw,balance,id){const state=normalize(raw),price=facilityPrice(state,id);if(price===null)return {ok:false,message:'Невідома установка або максимум.'};if(!M.valid(balance)||balance<price)return {ok:false,message:'Недостатньо UAH.'};state.facilities[id]++;return {ok:true,state,balance:balance-price,cost:price};}
 function studyPrice(raw,id){const s=normalize(raw),study=STUDIES.find(x=>x.id===id);return !study||s.studies[id]>=MAX_LEVEL?null:Object.fromEntries(['antimatter','energy','research'].map(k=>[k,study[k]*3**s.studies[id]]));}
 function study(raw,id){const state=normalize(raw),price=studyPrice(state,id);if(!price)return {ok:false,message:'Невідоме дослідження або максимум.'};if(Object.keys(price).some(k=>state[k]<price[k]))return {ok:false,message:'Недостатньо ресурсів.'};for(const k of Object.keys(price))state[k]=Math.max(0,state[k]-price[k]);state.studies[id]++;return {ok:true,state,cost:price};}
 function annihilate(raw,balance,fraction){
  const state=normalize(raw);if(![.1,.5,1].includes(fraction)||!M.valid(balance))return {ok:false,message:'Невірний обсяг.'};
  const units=Math.min(state.antimatter*fraction,state.energy/2),price=1e16*effects(state).sale;
  const reward=Math.floor(Math.min(M.LIMIT,Math.max(0,M.LIMIT-balance),units*price));
  if(reward<1||units<=0)return {ok:false,message:balance>=M.LIMIT?'Досягнуто межі балансу.':'Потрібна антиматерія та 2 енергії на кожну одиницю.'};
  const consumed=Math.min(units,reward/price);state.antimatter=Math.max(0,state.antimatter-consumed);state.energy=Math.max(0,state.energy-consumed*2);return {ok:true,state,balance:M.add(balance,reward),reward,consumed};
 }
 return {FACILITIES,STUDIES,MAX_LEVEL,OFFLINE,RESOURCE_CAP,normalize,effects,rates,settle,facilityPrice,buyFacility,studyPrice,study,annihilate};
});
