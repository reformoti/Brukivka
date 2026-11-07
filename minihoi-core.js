/* Iron Atlas: geography is data; all military/economic values are fictional game rules. */
(function(root){'use strict';
const D=typeof module==='object'&&module.exports?require('./world-map-data.js'):root.BrukWorldMap;
const MODES={
 easy:{label:'Легка',rank:1,playerIncome:1.25,aiIncome:.72,aiArmy:.85,develop:12,attack:18,ratio:1.4,aggression:.32,speed:.8},
 medium:{label:'Середня',rank:2,playerIncome:1,aiIncome:1,aiArmy:1,develop:7,attack:10,ratio:1.15,aggression:.58,speed:1},
 hardcore:{label:'Хардкор',rank:3,playerIncome:1,aiIncome:1.4,aiArmy:1.2,develop:3,attack:5,ratio:1.02,aggression:.9,speed:1.4}
};
const PROJECTS={
 infra:{name:'Інфраструктура',cost:220,days:15,max:5,field:'infra',note:'+12% місцевого доходу, +5% постачання'},
 factory:{name:'Завод',cost:400,days:30,max:10,field:'factories',note:'+8 кредитів / день'},
 fort:{name:'Укріплення',cost:280,days:18,max:5,field:'fort',note:'+18% до захисту області'},
 recruit:{name:'Мобілізація',cost:260,days:10,max:100000,field:'troops',note:'+80 військ після підготовки'},
 tech:{name:'Озброєння',cost:1100,days:60,max:6,field:'tech',national:true,note:'+12% сили всіх військ'},
 naval:{name:'Морські транспорти',cost:900,days:45,max:1,field:'naval',national:true,note:'Десант між узбережжями до 8 000 км'}
};
const FORMATIONS={infantry:{name:'Піхотна дивізія',attack:1,defense:1.15,speed:1,cost:180,days:8},motorized:{name:'Моторизована дивізія',attack:1.12,defense:.95,speed:1.5,cost:420,days:14},armored:{name:'Бронетанкова дивізія',attack:1.4,defense:1.1,speed:1.2,cost:850,days:24}};
const TACTICS={assault:{name:'Фронтальний наступ',days:3,cost:45,power:1,loss:1},breakthrough:{name:'Броньований прорив',days:4,cost:100,power:1.25,loss:1.2},pincer:{name:'Кліщі · охоплення',days:5,cost:130,power:1.15,loss:.9},pin:{name:'Сковувальна атака',days:2,cost:35,power:.8,loss:.45},barrage:{name:'Артпідготовка',days:3,cost:90,power:.9,loss:.3}};
for(const [key,f] of Object.entries(FORMATIONS))PROJECTS['train_'+key]={name:f.name,cost:f.cost,days:f.days,max:100,field:'org',template:key,note:'Переформування без створення додаткових військ.'};
const GOALS={frontier:{name:'Рубіж',target:12},campaign:{name:'Велика кампанія',target:36},world:{name:'Світове панування',target:Infinity}};
const LEGACY_IDS=['GBR','FRA','DEU','POL','ESP','ITA','UKR','ROU','NOR','SWE','DNK','NLD','CZE','AUT','HUN','PRT','BEL','CHE','SVN','HRV','LTU','LVA','EST','FIN','GRC'];
const countries=new Map(D.countries.filter(c=>c.playable).map(c=>[c.id,c])),MAX=1e12;
const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
const num=(n,a=0,b=MAX)=>cap(Number.isFinite(Number(n))?Number(n):a,a,b);
const int=(n,a=0,b=MAX)=>Math.floor(num(n,a,b));
const valid=id=>typeof id==='string'&&countries.has(id);
const budget=c=>14+Math.log10(Math.max(c.pop,1))*6+Math.log10(Math.max(c.gdp,1))*4;
function distance(a,b){const r=Math.PI/180,la=a.lonlat[1]*r,lb=b.lonlat[1]*r,dlat=lb-la,dlon=(b.lonlat[0]-a.lonlat[0])*r;return 12742*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(la)*Math.cos(lb)*Math.sin(dlon/2)**2)));}
class Campaign{
 constructor(mode='medium',player='UKR',goal='frontier',seed=Date.now()){
  this.mode=Object.hasOwn(MODES,mode)?mode:'medium';this.player=valid(player)?player:'UKR';this.goal=Object.hasOwn(GOALS,goal)?goal:'frontier';this.day=0;this.seed=int(seed,1,4294967295);this.over=false;this.won=false;this.rewardClaimed=false;this.log=[];this.legacyTargets=null;this.operations=[];this._supply=null;
  const cfg=MODES[this.mode];this.nations={};
  for(const c of countries.values())this.nations[c.id]={cash:c.id===this.player?1200:800,tech:0,naval:0,allies:[],projects:[]};
  this.provinces=D.provinces.map((p,i)=>{const c=countries.get(p.home),me=p.home===this.player,total=300+Math.sqrt(Math.max(c.pop,1))/15;
   return {owner:p.home,troops:Math.max(8,Math.round(total/c.regions.length*(me?1.15:cfg.aiArmy)))+(i===c.capital?100:0),factories:i===c.capital?2:0,infra:i===c.capital?2:1,fort:0,projects:[],template:'infantry',org:100,entrenchment:0};});
  this.addLog('Розпочато кампанію: '+countries.get(this.player).name+'.');
 }
 random(){let x=this.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=x>>>0||1;return this.seed/4294967296;}
 addLog(text){this.log.unshift('День '+(this.day+1)+': '+text);this.log.length=Math.min(this.log.length,45);}
 owned(id=this.player){const list=[];this.provinces.forEach((p,i)=>{if(p.owner===id)list.push(i);});return list;}
 allied(a,b){return this.nations[a]?.allies.includes(b)===true;}
 summary(id=this.player){let troops=0,income=0,factories=0,infra=0,owned=0,foreign=0;
  for(let i=0;i<this.provinces.length;i++){const p=this.provinces[i];if(p.owner!==id)continue;troops+=p.troops;factories+=p.factories;infra+=p.infra;income+=this.provinceIncome(i);owned++;if(D.provinces[i].home!==id)foreign++;}
  return {troops:Math.floor(troops),income,net:income-troops*.004,factories,infra:owned?infra/owned:0,owned,foreign};
 }
 provinceIncome(i){const p=this.provinces[i],c=countries.get(D.provinces[i].home);return (budget(c)/c.regions.length+p.factories*8)*(1+p.infra*.12);}
 offer(kind,index,id=this.player){const rule=Object.hasOwn(PROJECTS,kind)?PROJECTS[kind]:null,p=this.provinces[index],n=this.nations[id];if(!rule||!p||!n)return {ok:false,reason:'Невідомий проєкт.'};
  const target=rule.national?n:p,queue=target.projects,level=target[rule.field],cost=Math.round(rule.cost*(1+(kind==='tech'?level*.6:kind==='infra'?level*.3:kind==='factory'?level*.12:0))),days=rule.days+(kind==='infra'?level*5:0);
  let reason='';if(this.over)reason='Кампанію завершено.';else if(p.owner!==id)reason='Потрібна власна область.';else if(rule.template&&p.template===rule.template)reason='Це з’єднання вже має такий шаблон.';else if(!rule.template&&level>=rule.max)reason='Досягнуто максимум.';else if(queue.some(q=>q.kind===kind))reason='Такий проєкт уже виконується.';else if(queue.length>=2)reason='Черга зайнята: максимум 2 проєкти.';else if(n.cash<cost)reason='Недостатньо кредитів.';
  return {ok:!reason,reason,cost,days,kind};
 }
 queue(kind,index,id=this.player){const o=this.offer(kind,index,id);if(!o.ok)return o;const r=PROJECTS[kind],p=this.provinces[index],n=this.nations[id];n.cash-=o.cost;(r.national?n:p).projects.push({kind,progress:0,total:o.days,owner:id});if(id===this.player)this.addLog(r.name+': '+D.provinces[index].name+' · '+o.days+' дн.');return o;}
 invalidateSupply(){this._supply=null;}
 supplyMap(){if(this._supply)return this._supply;const supplied=new Set(),byOwner=new Map();this.provinces.forEach((p,i)=>{if(!byOwner.has(p.owner))byOwner.set(p.owner,[]);byOwner.get(p.owner).push(i);});for(const [id,c] of countries){const owned=byOwner.get(id)||[];if(!owned.length)continue;const root=this.provinces[c.capital].owner===id?c.capital:owned.slice().sort((a,b)=>this.provinces[b].factories-this.provinces[a].factories||this.provinces[b].troops-this.provinces[a].troops)[0],queue=[root],seen=new Set([root]);for(let k=0;k<queue.length;k++)for(const j of D.provinces[queue[k]].neighbors)if(!seen.has(j)&&this.provinces[j].owner===id){seen.add(j);queue.push(j);}if(this.nations[id].naval&&queue.some(i=>D.provinces[i].coast)){for(const i of owned)if(D.provinces[i].coast&&!seen.has(i)){seen.add(i);queue.push(i);}for(let k=0;k<queue.length;k++)for(const j of D.provinces[queue[k]].neighbors)if(!seen.has(j)&&this.provinces[j].owner===id){seen.add(j);queue.push(j);}}for(const i of seen)supplied.add(i);}return this._supply=supplied;}
 supplied(index){return this.supplyMap().has(index);}
 army(index){const p=this.provinces[index],f=FORMATIONS[p.template]||FORMATIONS.infantry;return {template:p.template||'infantry',name:f.name,divisions:Math.ceil(p.troops/80),strength:p.troops,org:p.org??100,supplied:this.supplied(index)};}
 power(index,defense=false){const p=this.provinces[index],n=this.nations[p.owner],f=FORMATIONS[p.template]||FORMATIONS.infantry,supply=(this.supplied(index)?1:.35)*(.8+p.infra*.05),org=.3+.7*(p.org??100)/100;return p.troops*(1+n.tech*.12)*supply*org*(defense?f.defense*(1+p.fort*.18+(p.entrenchment||0)*.015):f.attack);}
 launchOperation(target,tactic='assault',id=this.player){const rule=TACTICS[tactic],route=this.route(target,id),t=this.provinces[target],n=this.nations[id];if(!rule||this.over||!route||this.allied(id,t.owner)||n.cash<rule.cost+(route.naval?115:0)||this.operations.some(o=>o.owner===id&&o.target===target))return {ok:false,reason:'Немає маршруту, кредитів або наказ уже виконується.'};let sources=route.naval?[route.source]:D.provinces[target].neighbors.filter(i=>this.provinces[i].owner===id&&this.provinces[i].troops>=20&&!(this.provinces[i].busyUntil>this.day)).sort((a,b)=>this.power(b)-this.power(a));if(tactic==='pincer'&&(route.naval||sources.length<2))return {ok:false,reason:'Для кліщів потрібні щонайменше два вільні сухопутні напрямки.'};sources=sources.slice(0,tactic==='pincer'?3:1);if(!sources.length||sources.some(i=>this.provinces[i].busyUntil>this.day))return {ok:false,reason:'Армія вже виконує наказ.'};n.cash-=rule.cost+(route.naval?115:0);const days=Math.max(1,Math.ceil(rule.days/(FORMATIONS[this.provinces[sources[0]].template]?.speed||1)));this.operations.push({owner:id,target,tactic,sources,finish:this.day+days});for(const i of sources)this.provinces[i].busyUntil=this.day+days;if(id===this.player)this.addLog(rule.name+' → '+D.provinces[target].name+' · '+days+' дн.');return {ok:true};}
 resolveOperations(){const ready=this.operations.filter(o=>o.finish<=this.day);this.operations=this.operations.filter(o=>o.finish>this.day);for(const o of ready){if(this.over)break;const sources=o.sources.filter(i=>this.provinces[i].owner===o.owner&&(D.provinces[o.target].neighbors.includes(i)||this.route(o.target,o.owner)?.naval));if(!sources.length||this.provinces[o.target].owner===o.owner||this.allied(o.owner,this.provinces[o.target].owner)){if(o.owner===this.player)this.addLog('Операцію скасовано: фронт змінився.');continue;}if(o.tactic==='pin'||o.tactic==='barrage'){const t=this.provinces[o.target];t.org=Math.max(0,(t.org??100)-(o.tactic==='pin'?25:35));t.troops=Math.max(1,t.troops-Math.ceil(t.troops*.04));if(o.tactic==='barrage')t.fort=Math.max(0,t.fort-1);for(const i of sources){this.provinces[i].troops=Math.max(1,Math.floor(this.provinces[i].troops*.98));this.provinces[i].org=Math.max(0,(this.provinces[i].org??100)-12);}if(o.owner===this.player)this.addLog(TACTICS[o.tactic].name+' завершена: противник ослаблений, територію не захоплено.');}else this.attack(o.target,o.owner,{sources,tactic:o.tactic,paid:true});}}
 route(target,id=this.player){const t=this.provinces[target];if(!t||t.owner===id||!this.nations[id])return null;
  const land=D.provinces[target].neighbors.filter(i=>this.provinces[i]?.owner===id&&this.provinces[i].troops>=20).sort((a,b)=>this.power(b)-this.power(a));
  if(land.length)return {source:land[0],naval:false,cost:45};
  if(!this.nations[id].naval||!D.provinces[target].coast)return null;
  const sea=this.owned(id).filter(i=>D.provinces[i].coast&&this.provinces[i].troops>=60&&distance(D.provinces[i],D.provinces[target])<=8000).sort((a,b)=>this.power(b)-this.power(a));
  return sea.length?{source:sea[0],naval:true,cost:160}:null;
 }
 estimate(target,id=this.player){const route=this.route(target,id);if(!route)return null;return {...route,ratio:this.power(route.source)*.72*(route.naval?.72:1)/Math.max(1,this.power(target,true))};}
 attack(target,id=this.player,options={}){const t=this.provinces[target],route=this.route(target,id),n=this.nations[id];if(this.over||!t||!route||this.allied(id,t.owner)||(!options.paid&&n.cash<route.cost))return {ok:false,reason:'Потрібні кордон / десант, війська, кредити та відсутність союзу.'};if(!options.paid)n.cash-=route.cost;const rule=TACTICS[options.tactic]||TACTICS.assault,sources=(options.sources||[route.source]).filter(i=>this.provinces[i]?.owner===id&&(D.provinces[target].neighbors.includes(i)||route.naval&&i===route.source));if(!sources.length)return {ok:false,reason:'Фронт змінився.'};const commits=sources.map(i=>Math.floor(this.provinces[i].troops*.72)),committed=commits.reduce((a,b)=>a+b,0),oldOwner=t.owner,attack=sources.reduce((v,i)=>v+this.power(i)*.72,0)*rule.power*(route.naval?.72:1)*(.88+this.random()*.24),defense=this.power(target,true)*(.88+this.random()*.24),won=attack>defense;
 if(won){sources.forEach((i,k)=>{this.provinces[i].troops-=commits[k];});t.owner=id;t.troops=Math.max(1,Math.round(committed*(.5+.25*cap(1-defense/Math.max(1,attack),0,1))));t.fort=Math.max(0,t.fort-1);t.projects=[];t.template=this.provinces[sources[0]].template||'infantry';t.org=55;t.entrenchment=0;t.busyUntil=0;this.invalidateSupply();}else{sources.forEach((i,k)=>{this.provinces[i].troops=Math.max(1,this.provinces[i].troops-Math.ceil(commits[k]*.62*rule.loss));});t.troops=Math.max(1,Math.round(t.troops*.7));t.org=Math.max(0,(t.org??100)-20);}for(const i of sources){this.provinces[i].org=Math.max(0,(this.provinces[i].org??100)-25);this.provinces[i].entrenchment=0;}
 if(id===this.player||oldOwner===this.player)this.addLog((won?'⚔ ':'🛡 ')+countries.get(id).name+(won?' зайняла ':' не змогла зайняти ')+D.provinces[target].name+' · '+rule.name+'.');this.finish();return {ok:true,won,source:sources[0],naval:route.naval};}
 reinforce(target,source,id=this.player){const a=this.provinces[source],b=this.provinces[target];if(this.over||!a||!b||a.owner!==id||b.owner!==id||!D.provinces[target].neighbors.includes(source)||a.troops<12||a.busyUntil>this.day||b.busyUntil>this.day)return {ok:false,reason:'Потрібна сусідня власна область із 12+ військ.'};const moved=Math.floor(a.troops*.5);a.troops-=moved;b.troops+=moved;return {ok:true,moved};}
 diplomacy(other,id=this.player){const a=this.nations[id],b=this.nations[other];if(this.over||id===other||!a||!b||!this.owned(other).length)return {ok:false,reason:'Недоступно.'};
  if(this.allied(id,other)){a.allies=a.allies.filter(x=>x!==other);b.allies=b.allies.filter(x=>x!==id);if(id===this.player)this.addLog('Союз розірвано: '+countries.get(other).name+'.');return {ok:true,allied:false};}
  if(a.cash<300)return {ok:false,reason:'Потрібно 300 кредитів.'};a.cash-=300;const accepted=this.random()<({easy:.85,medium:.7,hardcore:.5}[this.mode]);if(accepted){a.allies.push(other);b.allies.push(id);}if(id===this.player)this.addLog(countries.get(other).name+(accepted?' погодилася на союз.':' відхилила союз.'));return {ok:true,allied:accepted};
 }
 complete(queue,target,amount,location){for(let i=queue.length-1;i>=0;i--){const q=queue[i];q.progress+=amount;if(q.progress<q.total)continue;queue.splice(i,1);const r=PROJECTS[q.kind];if(r.template){target.template=r.template;target.org=70;continue;}target[r.field]=Math.min(r.max,target[r.field]+(q.kind==='recruit'?80:1));if(q.owner===this.player)this.addLog('Завершено: '+r.name+(location?' · '+location:'')+'.');}}
 advance(days=1){days=int(days,1,30);for(let step=0;step<days&&!this.over;step++){
   this.day++;this.invalidateSupply();this.resolveOperations();const supplied=this.supplyMap();for(let i=0;i<this.provinces.length;i++){const p=this.provinces[i];if(supplied.has(i)){p.org=Math.min(100,(p.org??100)+4);if(!(p.busyUntil>this.day))p.entrenchment=Math.min(10,(p.entrenchment||0)+1);}else{p.org=Math.max(0,(p.org??100)-12);p.troops=Math.max(0,p.troops-Math.ceil(p.troops*.012));p.entrenchment=0;}}const cfg=MODES[this.mode],income={},troops={},owned={};
   for(const id of countries.keys()){income[id]=0;troops[id]=0;owned[id]=[];}
   this.provinces.forEach((p,i)=>{const speed=p.owner===this.player?1:cfg.speed;this.complete(p.projects,p,speed,D.provinces[i].name);income[p.owner]+=this.provinceIncome(i);troops[p.owner]+=p.troops;owned[p.owner].push(i);});
   for(const [id,n] of Object.entries(this.nations)){const mult=id===this.player?cfg.playerIncome:cfg.aiIncome;n.cash=cap(n.cash+income[id]*mult-troops[id]*.004,0,MAX);this.complete(n.projects,n,id===this.player?1:cfg.speed,'');}
   if(this.day%cfg.develop===0)for(const id of countries.keys())if(id!==this.player&&owned[id].length)this.developAI(id,owned[id]);
   if(this.day>30&&this.day%cfg.attack===0)for(const id of countries.keys())if(id!==this.player&&owned[id].length)this.attackAI(id,owned[id]);
   this.finish();
  }return this;
 }
 frontier(index,id){return D.provinces[index].neighbors.some(j=>this.provinces[j].owner!==id&&!this.allied(id,this.provinces[j].owner));}
 developAI(id,owned){const n=this.nations[id],cfg=MODES[this.mode];const fronts=owned.filter(i=>this.frontier(i,id));
  // High difficulty concentrates nearby reserves where enemy defenses are weakest.
  if(cfg.rank>1)for(const i of fronts.slice(0,cfg.rank*2)){const candidates=D.provinces[i].neighbors.filter(j=>this.provinces[j].owner===id&&!this.frontier(j,id)&&this.provinces[j].troops>18).sort((a,b)=>this.provinces[b].troops-this.provinces[a].troops);if(candidates.length)this.reinforce(i,candidates[0],id);}
  const front=fronts.sort((a,b)=>this.provinces[a].troops-this.provinces[b].troops)[0],economic=owned.slice().sort((a,b)=>this.provinces[a].projects.length-this.provinces[b].projects.length||this.provinces[a].factories-this.provinces[b].factories)[0];
  if(front!==undefined&&this.provinces[front].troops<120+cfg.rank*25)this.queue('recruit',front,id);
  if(economic!==undefined){this.queue((Math.floor(this.day/cfg.develop)+id.charCodeAt(0))%3===0?'infra':'factory',economic,id);if(n.cash>2000)this.queue('tech',economic,id);if(!n.naval&&this.day>90&&owned.some(i=>D.provinces[i].coast)&&(!fronts.length||cfg.rank===3))this.queue('naval',economic,id);}
  if(front!==undefined&&cfg.rank>1&&n.cash>1200&&this.day>30)this.queue('train_'+(n.tech>=2?'armored':'motorized'),front,id);
  if(cfg.rank===3&&front!==undefined&&this.provinces[front].troops<40)this.queue('fort',front,id);
 }
 attackAI(id,owned){const cfg=MODES[this.mode];if(this.random()>cfg.aggression)return;const targets=new Set();for(const i of owned)for(const j of D.provinces[i].neighbors)if(this.provinces[j].owner!==id&&!this.allied(id,this.provinces[j].owner))targets.add(j);
  // Island nations unlock transport through the same research and payment rules.
  if(!targets.size&&this.nations[id].naval)for(let j=0;j<this.provinces.length;j++)if(this.provinces[j].owner!==id&&D.provinces[j].coast&&!this.allied(id,this.provinces[j].owner))targets.add(j);
  if(targets.size>40){const limited=[...targets].sort((a,b)=>this.power(a,true)-this.power(b,true)).slice(0,40);targets.clear();limited.forEach(i=>targets.add(i));}
  const options=[...targets].map(j=>({target:j,plan:this.estimate(j,id)})).filter(x=>x.plan&&x.plan.ratio>=cfg.ratio).sort((a,b)=>(b.plan.ratio+(this.provinces[b.target].owner===this.player?.12:0))-(a.plan.ratio+(this.provinces[a.target].owner===this.player?.12:0)));
  for(const x of options.slice(0,cfg.rank===3?2:1))if(this.provinces[x.target].owner!==id)this.launchOperation(x.target,cfg.rank===3&&D.provinces[x.target].neighbors.filter(i=>this.provinces[i].owner===id).length>=2?'pincer':cfg.rank>1?'breakthrough':'assault',id);
 }
 objective(){const s=this.summary();let current=s.foreign,target=GOALS[this.goal].target;
  if(this.legacyTargets){target=this.legacyTargets.reduce((n,id)=>n+countries.get(id).regions.length,0);current=this.provinces.filter((p,i)=>this.legacyTargets.includes(D.provinces[i].home)&&p.owner===this.player).length;}
  else if(this.goal==='world'){current=s.owned;target=this.provinces.length;}
  return {current,target};
 }
 finish(){if(this.over)return;const o=this.objective();if(!this.provinces.some(p=>p.owner===this.player)){this.over=true;this.addLog('Державу переможено.');}else if(o.current>=o.target){this.over=true;this.won=true;this.addLog('🏆 Мету кампанії виконано!');}}
 claimVictory(){if(!this.won||this.rewardClaimed)return 0;this.rewardClaimed=true;return MODES[this.mode].rank;}
 serialize(){return {version:2,mode:this.mode,player:this.player,goal:this.goal,day:this.day,seed:this.seed,over:this.over,won:this.won,rewardClaimed:this.rewardClaimed,log:this.log,nations:this.nations,provinces:this.provinces,operations:this.operations,legacyTargets:this.legacyTargets};}
 static restore(raw){if(!raw||!Object.hasOwn(MODES,raw.mode))return null;
  if(raw.version!==2)return Campaign.migrate(raw);
  if(!valid(raw.player)||!Array.isArray(raw.provinces)||raw.provinces.length!==D.provinces.length)return null;
  const g=new Campaign(raw.mode,raw.player,raw.goal,raw.seed);g.day=int(raw.day,0,365000);g.over=raw.over===true;g.won=raw.won===true&&g.over;g.rewardClaimed=raw.rewardClaimed===true;g.log=Array.isArray(raw.log)?raw.log.filter(x=>typeof x==='string').map(x=>x.slice(0,300)).slice(0,45):[];
  function projects(list,id,national){return Array.isArray(list)?list.filter(q=>q&&Object.hasOwn(PROJECTS,q.kind)&&!!PROJECTS[q.kind].national===national&&q.owner===id).slice(0,2).map(q=>({kind:q.kind,owner:id,progress:num(q.progress,0,600),total:num(q.total,1,600)})):[];}
  for(const [id,n] of Object.entries(g.nations)){const old=raw.nations?.[id];if(!old)continue;n.cash=num(old.cash);n.tech=int(old.tech,0,6);n.naval=int(old.naval,0,1);n.allies=Array.isArray(old.allies)?[...new Set(old.allies.filter(x=>valid(x)&&x!==id))]:[];n.projects=projects(old.projects,id,true);}
  g.provinces=raw.provinces.map((p,i)=>{p=p||{};const owner=valid(p.owner)?p.owner:D.provinces[i].home;return {owner,troops:int(p.troops,0,1000000),infra:int(p.infra,0,5),factories:int(p.factories,0,10),fort:int(p.fort,0,10),template:Object.hasOwn(FORMATIONS,p.template)?p.template:'infantry',org:int(p.org??100,0,100),entrenchment:int(p.entrenchment,0,10),busyUntil:int(p.busyUntil,0,g.day+30),projects:projects(p.projects,owner,false)};});
  g.operations=Array.isArray(raw.operations)?raw.operations.filter(o=>valid(o?.owner)&&Object.hasOwn(TACTICS,o.tactic)&&Number.isInteger(o.target)&&!!g.provinces[o.target]&&Array.isArray(o.sources)&&o.sources.length<=3).slice(0,750).map(o=>({...o,sources:o.sources.filter(i=>Number.isInteger(i)&&!!g.provinces[i]),finish:int(o.finish,g.day,g.day+30)})):[];
  for(const [id,n] of Object.entries(g.nations))n.allies=n.allies.filter(other=>g.nations[other].allies.includes(id));
  if(Array.isArray(raw.legacyTargets))g.legacyTargets=[...new Set(raw.legacyTargets.filter(valid))];
  return g;
 }
 static migrate(raw){const count={easy:8,medium:15,hardcore:25}[raw.mode];if(!Array.isArray(raw.countries)||raw.countries.length!==count||!Number.isInteger(raw.player)||raw.player<0||raw.player>=count)return null;
  const g=new Campaign(raw.mode,LEGACY_IDS[raw.player]);g.day=int(raw.turn,0,1200)*30;g.nations[g.player].cash=num(raw.cash);g.nations[g.player].tech=int(raw.tech,0,6);g.legacyTargets=LEGACY_IDS.slice(0,count);
  raw.countries.forEach((old,i)=>{if(!old)return;const id=LEGACY_IDS[i],c=countries.get(id),owner=LEGACY_IDS[Number.isInteger(old.owner)&&old.owner>=0&&old.owner<count?old.owner:i],total=int(old.troops,0,100000),factories=int(old.factories,1,70);
   c.regions.forEach((j,k)=>{g.provinces[j]={owner,troops:Math.floor(total/c.regions.length)+(k<total%c.regions.length?1:0),factories:Math.floor(factories/c.regions.length)+(k<factories%c.regions.length?1:0),infra:1,fort:j===c.capital?int(old.fort,0,10):0,projects:[]};});
   g.nations[id].allies=Array.isArray(old.allies)?old.allies.filter(n=>Number.isInteger(n)&&n>=0&&n<count&&n!==i).map(n=>LEGACY_IDS[n]):[];
  });
  g.log=Array.isArray(raw.log)?raw.log.filter(x=>typeof x==='string').slice(0,40):[];g.addLog('Кампанію перенесено на карту світу. Війська, власність, кредити й заводи збережено.');g.finish();return g;
 }
}
const api={Campaign,MODES,PROJECTS,GOALS,FORMATIONS,TACTICS,LEGACY_IDS,DATA:D,countries,distance};if(typeof module==='object'&&module.exports)module.exports=api;else root.IronAtlas=api;
})(typeof window==='undefined'?globalThis:window);
