(function(root){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const integer=(n,a,b,f=0)=>Number.isSafeInteger(n)?clamp(n,a,b):f;
  const MATERIALS={
    brick:{name:'Цегляна секція',w:80,h:40,mass:45,strength:420,price:110,color:'#c38761'},
    block:{name:'Газоблок',w:80,h:40,mass:28,strength:260,price:160,color:'#c6cfcb'},
    concrete:{name:'Бетонна плита',w:120,h:40,mass:200,strength:1900,price:380,color:'#8b999d'},
    steel:{name:'Сталева балка',w:160,h:20,mass:160,strength:2400,price:1400,color:'#7794ab'},
    wood:{name:'Дерев’яна балка',w:120,h:20,mass:65,strength:650,price:180,color:'#bd9b65'},
    roof:{name:'Покрівля',w:120,h:20,mass:55,strength:380,price:250,color:'#596c82'},
    glass:{name:'Віконна секція',w:80,h:80,mass:35,strength:85,price:190,color:'#8bc4d4'},
    rebar:{name:'Арматура',mass:15,price:280,color:'#c5adb0'}
  };
  const PLOT_PRICE=50000,FLOOR=640,MAX_BODIES=150;
  const CARS=[
    {id:'vaz',name:'ВАЗ-2101',tier:'Бюджетні',price:8000,shape:'sedan',rating:1,color:'#c6b48c'},
    {id:'tavria',name:'ЗАЗ Таврія',tier:'Бюджетні',price:14000,shape:'hatch',rating:1.2,color:'#82b1a2'},
    {id:'lanos',name:'Lanos',tier:'Бюджетні',price:26000,shape:'sedan',rating:1.4,color:'#8b9cac'},
    {id:'golf',name:'Golf',tier:'Середній клас',price:85000,shape:'hatch',rating:1.8,color:'#94b1c8'},
    {id:'accord',name:'Accord',tier:'Середній клас',price:175000,shape:'sedan',rating:2.1,color:'#d4d5d1'},
    {id:'m3',name:'BMW M3',tier:'Преміум',price:680000,shape:'coupe',rating:2.5,color:'#6586c7'},
    {id:'carrera',name:'911 Carrera',tier:'Преміум',price:2500000,shape:'sport',rating:2.8,color:'#d7ae63'},
    {id:'hyperion',name:'Hyperion GT',tier:'Гіперкари',price:12000000,shape:'super',rating:3.3,color:'#d56f75'}
  ];
  function defaultEstate(){return {owned:false,upgrades:{foundation:0,quality:0,crane:0},bodies:[],claimed:false};}
  function defaultGarage(){return {owned:[],active:null,custom:{}};}
  function bodyFor(raw,index=0){
    if(!raw||typeof raw.material!=='string'||!Object.hasOwn(MATERIALS,raw.material)||raw.material==='rebar'||!Number.isFinite(raw.x)||!Number.isFinite(raw.y))return null;
    const m=MATERIALS[raw.material],rotated=raw.rotated===true,w=rotated?m.h:m.w,h=rotated?m.w:m.h;
    return {id:Number.isSafeInteger(raw.id)?raw.id:index+1,material:raw.material,x:clamp(raw.x,0,1000-w),y:clamp(raw.y,5,FLOOR-h),w,h,
      rotated,reinforced:raw.reinforced===true&&['brick','block','concrete'].includes(raw.material),vx:0,vy:0,damage:Number.isFinite(raw.damage)?clamp(raw.damage,0,.999):0,load:0,ratio:0,grounded:false};
  }
  function normalizeEstate(raw){
    const s=defaultEstate();if(!raw||typeof raw!=='object')return s;
    s.owned=raw.owned===true;s.claimed=raw.claimed===true&&s.owned;
    for(const key of Object.keys(s.upgrades))s.upgrades[key]=integer(raw.upgrades?.[key],0,3);
    if(s.owned&&Array.isArray(raw.bodies))s.bodies=raw.bodies.slice(0,MAX_BODIES).flatMap((b,i)=>{const body=bodyFor(b,i);return body?[{id:i+1,material:body.material,x:body.x,y:body.y,rotated:body.rotated,reinforced:body.reinforced,damage:body.damage}]:[];});
    return s;
  }
  function defaultStyle(car){return {color:car.color,rims:0,spoiler:false,neon:false,wrap:false,engine:0,lowered:false,unlocks:[]};}
  function normalizeGarage(raw){
    const s=defaultGarage();if(!raw||typeof raw!=='object')return s;
    s.owned=CARS.filter(c=>Array.isArray(raw.owned)&&raw.owned.includes(c.id)).map(c=>c.id);
    s.active=s.owned.includes(raw.active)?raw.active:s.owned[0]||null;
    for(const id of s.owned){const car=CARS.find(c=>c.id===id),v=raw.custom?.[id]||{},style=defaultStyle(car);
      if(typeof v.color==='string'&&/^#[0-9a-f]{6}$/i.test(v.color))style.color=v.color;
      style.unlocks=[...new Set((Array.isArray(v.unlocks)?v.unlocks:[]).filter(x=>['rims1','rims2','spoiler','neon','wrap','lowered'].includes(x)))];
      style.rims=integer(v.rims,0,2);if(style.rims&&!style.unlocks.includes('rims'+style.rims))style.rims=0;
      for(const key of ['spoiler','neon','wrap','lowered'])style[key]=v[key]===true&&style.unlocks.includes(key);
      style.engine=integer(v.engine,0,3);s.custom[id]=style;
    }return s;
  }
  const upgradeCost=(key,level)=>({foundation:8000,quality:10000,crane:6000}[key]||0)*2**level;
  const mass=b=>MATERIALS[b.material].mass+(b.reinforced?15:0);
  const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
  class BuildingWorld{
    constructor(estate){this.estate=normalizeEstate(estate);this.bodies=this.estate.bodies.map(bodyFor);this.upgrades=this.estate.upgrades;this.debris=[];this.stableTime=0;this.time=0;this.nextId=this.bodies.length+1;this.analyze();}
    get heightLimit(){return 280+this.upgrades.crane*90;}
    get foundationLimit(){return 10000+this.upgrades.foundation*7500;}
    capacity(b){return MATERIALS[b.material].strength*(1+this.upgrades.quality*.25)*(b.reinforced?1.8:1);}
    canPlace(material,x,y,rotated=false){
      if(typeof material!=='string'||!Object.hasOwn(MATERIALS,material)||material==='rebar')return false;
      const b=bodyFor({material,x,y,rotated});if(!b||this.bodies.length>=MAX_BODIES||FLOOR-b.y>this.heightLimit||x<0||x+b.w>1000||y<5||y+b.h>FLOOR)return false;
      return !this.bodies.some(o=>b.x<o.x+o.w-1&&b.x+b.w>o.x+1&&b.y<o.y+o.h-1&&b.y+b.h>o.y+1);
    }
    place(material,x,y,rotated=false){if(!this.canPlace(material,x,y,rotated))return null;const b=bodyFor({id:this.nextId++,material,x,y,rotated});this.bodies.push(b);this.stableTime=0;this.analyze();return b;}
    reinforce(id){const b=this.bodies.find(b=>b.id===id);if(!b||b.reinforced||!['brick','block','concrete'].includes(b.material))return false;b.reinforced=true;this.analyze();return true;}
    remove(id){this.bodies=this.bodies.filter(b=>b.id!==id);this.stableTime=0;this.analyze();}
    serialize(){return this.bodies.map(b=>({id:b.id,material:b.material,x:b.x,y:b.y,rotated:b.rotated,reinforced:b.reinforced,damage:b.damage}));}
    analyze(){
      const sorted=this.bodies.slice().sort((a,b)=>b.y-a.y),supports=new Map();
      for(const b of sorted){b.load=mass(b);const list=this.bodies.filter(o=>o!==b&&Math.abs(b.y+b.h-o.y)<2.5&&overlap(b,o)>2);supports.set(b,list);
        const onFloor=Math.abs(b.y+b.h-FLOOR)<2.5,center=b.x+b.w/2;
        b.balanced=onFloor||(list.length>0&&center>=Math.min(...list.map(o=>Math.max(o.x,b.x)))-1&&center<=Math.max(...list.map(o=>Math.min(o.x+o.w,b.x+b.w)))+1);
        b.grounded=onFloor||b.balanced&&list.some(o=>o.grounded);
      }
      for(const b of sorted.slice().reverse()){
        const list=supports.get(b),sum=list.reduce((n,o)=>n+overlap(b,o),0);
        for(const o of list)o.load+=b.load*overlap(b,o)/sum;
      }
      for(const b of this.bodies)b.ratio=b.load/this.capacity(b);
      const totalMass=this.bodies.reduce((sum,b)=>sum+mass(b),0),stable=this.bodies.length>0&&this.bodies.every(b=>b.grounded&&b.ratio<=1&&Math.hypot(b.vx,b.vy)<5)&&totalMass<=this.foundationLimit;
      this.metrics={totalMass,height:this.bodies.length?FLOOR-Math.min(...this.bodies.map(b=>b.y)):0,stable,overloaded:this.bodies.filter(b=>b.ratio>1).length,foundationRatio:totalMass/this.foundationLimit};return this.metrics;
    }
    step(dt){
      const n=Math.max(1,Math.ceil(dt*120)),h=dt/n;
      for(let i=0;i<n;i++){
        this.time+=h;
        for(const b of this.bodies.slice().sort((a,b)=>b.y-a.y)){
          const oldBottom=b.y+b.h,oldX=b.x;b.vy+=680*h;b.x=clamp(b.x+b.vx*h,0,1000-b.w);
          for(const other of this.bodies)if(other!==b&&b.y<other.y+other.h-2&&b.y+b.h>other.y+2){if(oldX+b.w<=other.x+1&&b.x+b.w>other.x){b.x=other.x-b.w;b.vx=0;}else if(oldX>=other.x+other.w-1&&b.x<other.x+other.w){b.x=other.x+other.w;b.vx=0;}}
          b.y+=b.vy*h;b.vx*=.995;
          let landing=FLOOR;
          for(const other of this.bodies)if(other!==b&&overlap(b,other)>2&&oldBottom<=other.y+2&&b.y+b.h>=other.y)landing=Math.min(landing,other.y);
          if(b.y+b.h>=landing){
            const impact=mass(b)*(Math.abs(b.vy)/300)**2;if(b.vy>260&&impact>this.capacity(b)*.8)b.damage+=impact/this.capacity(b)*.45;
            b.y=landing-b.h;b.vy=0;
          }
        }
        this.analyze();
        for(const b of this.bodies){
          if(!b.balanced&&Math.abs(b.vy)<1){const list=this.bodies.filter(o=>o!==b&&Math.abs(b.y+b.h-o.y)<3&&overlap(b,o)>2);const center=list.length?list.reduce((s,o)=>s+o.x+o.w/2,0)/list.length:500;b.vx+=(b.x+b.w/2<center?-1:1)*220*h;}
          if(b.ratio>1)b.damage+=(b.ratio-1)*h*.7;
          if(b.y+b.h>=FLOOR-1&&this.metrics.foundationRatio>1)b.damage+=(this.metrics.foundationRatio-1)*h;
        }
        const broken=this.bodies.filter(b=>b.damage>=1);if(broken.length){for(const b of broken)this.debris.push({x:b.x+b.w/2,y:b.y+b.h/2,age:0,color:MATERIALS[b.material].color});this.bodies=this.bodies.filter(b=>b.damage<1);this.stableTime=0;}
        this.debris=this.debris.filter(d=>(d.age+=h)<1);
        this.stableTime=this.metrics.stable?this.stableTime+h:0;
      }this.analyze();
    }
    inspect(){const s=this.analyze(),m=this.bodies.map(b=>b.material);return {accepted:s.stable&&this.stableTime>=1.2&&this.bodies.length>=12&&s.height>=160&&m.includes('roof')&&m.includes('glass')&&m.filter(x=>['brick','block','concrete'].includes(x)).length>=8,
      conditions:[['Щонайменше 12 секцій',this.bodies.length>=12],['Висота від 160',s.height>=160],['8 несучих секцій',m.filter(x=>['brick','block','concrete'].includes(x)).length>=8],['Покрівля та вікно',m.includes('roof')&&m.includes('glass')],['Стійкість понад 1.2 секунди',s.stable&&this.stableTime>=1.2]]};}
  }
  function drawCar(ctx,x,y,scale,car,style={},time=0){
    const s={...defaultStyle(car),...style};ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,38,157,15,0,0,Math.PI*2);ctx.fill();
    if(s.neon){ctx.shadowColor='#55edf0';ctx.shadowBlur=20;ctx.strokeStyle='#55edf0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-110,31);ctx.lineTo(110,31);ctx.stroke();ctx.shadowBlur=0;}
    const sporty=['sport','super','coupe'].includes(car.shape),low=s.lowered?7:0;ctx.translate(0,low);
    ctx.fillStyle=s.color;ctx.strokeStyle='#ffffff44';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-155,9);ctx.lineTo(-142,-23);ctx.lineTo(-83,-31);ctx.lineTo(sporty?-37:-65,sporty?-64:-76);ctx.lineTo(sporty?55:44,sporty?-62:-76);ctx.lineTo(95,-31);ctx.lineTo(149,-18);ctx.lineTo(160,17);ctx.lineTo(146,32);ctx.lineTo(-145,32);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#183748';ctx.beginPath();ctx.moveTo(-77,-34);ctx.lineTo(sporty?-34:-58,sporty?-59:-69);ctx.lineTo(39,sporty?-57:-69);ctx.lineTo(79,-33);ctx.closePath();ctx.fill();ctx.strokeStyle='#b7d9e055';ctx.beginPath();ctx.moveTo(-12,-68);ctx.lineTo(-12,-33);ctx.stroke();
    if(s.wrap){ctx.fillStyle='#eee3c8';ctx.fillRect(-133,-9,268,7);ctx.fillStyle='#17313c';ctx.fillRect(-133,0,268,4);}
    ctx.fillStyle='#f7dfa0';ctx.fillRect(143,-12,13,11);ctx.fillStyle='#da6964';ctx.fillRect(-149,-12,10,10);
    if(s.spoiler){ctx.fillStyle='#2a333b';ctx.fillRect(-146,-46,8,20);ctx.fillRect(-161,-51,58,7);}
    for(const wx of [-101,105]){ctx.save();ctx.translate(wx,29-low);ctx.fillStyle='#111b22';ctx.beginPath();ctx.arc(0,0,29,0,Math.PI*2);ctx.fill();ctx.fillStyle=s.rims===2?'#dfc384':s.rims===1?'#d4dce0':'#819099';ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();ctx.rotate(time*5);ctx.strokeStyle='#25333c';ctx.lineWidth=s.rims===2?2:4;for(let i=0;i<(s.rims===2?10:5);i++){const a=i*Math.PI*2/(s.rims===2?10:5);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*18,Math.sin(a)*18);ctx.stroke();}ctx.restore();}
    ctx.restore();
  }
  const api={MATERIALS,PLOT_PRICE,FLOOR,MAX_BODIES,CARS,defaultEstate,defaultGarage,normalizeEstate,normalizeGarage,defaultStyle,upgradeCost,BuildingWorld,mass,drawCar};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.BrukVentures=api;
})(typeof window==='undefined'?globalThis:window);
