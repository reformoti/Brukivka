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
    {id:'matiz',name:'Daewoo Matiz',tier:'Бюджетні',price:18000,shape:'micro',rating:1.1,color:'#d7c878'},
    {id:'niva',name:'Lada Niva',tier:'Бюджетні',price:38000,shape:'suv',rating:1.3,color:'#8eaa86'},
    {id:'volvo',name:'Volvo Estate',tier:'Середній клас',price:245000,shape:'wagon',rating:2.0,color:'#83a4ae'},
    {id:'roadster',name:'Aurora Roadster',tier:'Преміум',price:1450000,shape:'roadster',rating:2.7,color:'#d79080'},
    {id:'huracan',name:'Lamborghini Huracán',tier:'Гіперкари',price:6200000,shape:'wedge',rating:3.15,color:'#a7cb47'},
    {id:'aventador',name:'Lamborghini Aventador',tier:'Гіперкари',price:9500000,shape:'hyper',rating:3.5,color:'#d88c3a'},
    {id:'mclaren',name:'McLaren 720S',tier:'Гіперкари',price:7800000,shape:'track',rating:3.35,color:'#e69b42'},
    {id:'sf90',name:'Ferrari SF90',tier:'Гіперкари',price:11500000,shape:'wedge',rating:3.65,color:'#c94348'},
    {id:'chiron',name:'Bugatti Chiron',tier:'Гіперкари',price:36000000,shape:'hyper',rating:4.1,color:'#6298c7'},
    {id:'jesko',name:'Koenigsegg Jesko',tier:'Гіперкари',price:48000000,shape:'track',rating:4.4,color:'#d3d7cf'},
    {id:'gtr',name:'Nissan GT-R',tier:'Преміум',price:3100000,shape:'coupe',rating:3.0,color:'#b8bdc6'},
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
  function defaultStyle(car){return {color:car.color,rims:0,spoiler:false,neon:false,wrap:false,engine:0,lowered:false,neonColor:'#69e8e0',spoilerType:0,livery:0,unlocks:[]};}
  function normalizeGarage(raw){
    const s=defaultGarage();if(!raw||typeof raw!=='object')return s;
    s.owned=CARS.filter(c=>Array.isArray(raw.owned)&&raw.owned.includes(c.id)).map(c=>c.id);
    s.active=s.owned.includes(raw.active)?raw.active:s.owned[0]||null;
    for(const id of s.owned){const car=CARS.find(c=>c.id===id),v=raw.custom?.[id]||{},style=defaultStyle(car);
      if(typeof v.color==='string'&&/^#[0-9a-f]{6}$/i.test(v.color))style.color=v.color;
      style.unlocks=[...new Set((Array.isArray(v.unlocks)?v.unlocks:[]).filter(x=>['rims1','rims2','rims3','rims4','rims5','rims6','spoiler','spoiler2','spoiler3','neon','wrap','wrap2','wrap3','wrap4','wrap5','lowered'].includes(x)))];
      style.rims=integer(v.rims,0,6);if(style.rims&&!style.unlocks.includes('rims'+style.rims))style.rims=0;
      for(const key of ['spoiler','neon','wrap','lowered'])style[key]=v[key]===true&&style.unlocks.includes(key);
      style.engine=integer(v.engine,0,10);
      style.neonColor=typeof v.neonColor==='string'&&/^#[0-9a-f]{6}$/i.test(v.neonColor)?v.neonColor:'#69e8e0';
      style.spoilerType=integer(v.spoilerType,0,3,style.spoiler?1:0);if(style.spoilerType&&!style.unlocks.includes(style.spoilerType===1?'spoiler':'spoiler'+style.spoilerType))style.spoilerType=0;style.spoiler=style.spoilerType>0;
      style.livery=integer(v.livery,0,5,style.wrap?1:0);if(style.livery&&!style.unlocks.includes(style.livery===1?'wrap':'wrap'+style.livery))style.livery=0;style.wrap=style.livery>0;s.custom[id]=style;
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
    const s={...defaultStyle(car),...style};
    const profiles={sedan:[160,76,204,27],hatch:[149,79,182,27],micro:[136,82,163,25],suv:[162,94,204,31],wagon:[174,77,216,28],coupe:[166,66,210,28],sport:[170,62,214,29],super:[177,55,222,30],roadster:[163,51,205,28],wedge:[182,46,230,30],hyper:[190,45,239,31],track:[184,49,232,30]};
    const [length,roof,base,radius]=profiles[car.shape]||profiles.sedan,low=s.lowered?6:0;
    function round(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineJoin=ctx.lineCap='round';
    ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,39,length+4,13,0,0,Math.PI*2);ctx.fill();
    if(s.neon){ctx.shadowColor=s.neonColor;ctx.shadowBlur=19;ctx.strokeStyle=s.neonColor;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-base/2,36+low);ctx.lineTo(base/2,36+low);ctx.stroke();ctx.shadowBlur=0;}
    ctx.save();ctx.translate(0,low);
    const hatch=['hatch','micro','suv','wagon'].includes(car.shape),backRoof=car.shape==='wagon'?-94:hatch?-83:-58;
    ctx.beginPath();ctx.moveTo(-length+9,23);ctx.quadraticCurveTo(-length-1,18,-length+2,-2);
    ctx.quadraticCurveTo(-length+3,-21,-length+21,hatch?-36:-27);
    ctx.bezierCurveTo(hatch?-length+25:-99,hatch?-roof+10:-31,backRoof-20,-roof,backRoof,-roof);
    ctx.bezierCurveTo(-25,-roof-4,29,-roof-2,45,-roof+5);
    ctx.quadraticCurveTo(71,-roof+10,95,-30);ctx.bezierCurveTo(112,-29,length-10,-27,length,-9);
    ctx.quadraticCurveTo(length+8,3,length-2,23);ctx.quadraticCurveTo(length-5,32,length-20,32);
    ctx.lineTo(-length+24,32);ctx.quadraticCurveTo(-length+12,31,-length+9,23);ctx.closePath();
    const paint=ctx.createLinearGradient(0,-roof,0,35);paint.addColorStop(0,s.color);paint.addColorStop(.65,s.color);paint.addColorStop(1,'#263e45');ctx.fillStyle=paint;ctx.fill();ctx.strokeStyle='#e8eeee60';ctx.lineWidth=1.5;ctx.stroke();
    ctx.save();ctx.clip();ctx.fillStyle='#ffffff19';ctx.beginPath();ctx.moveTo(-length,-25);ctx.quadraticCurveTo(10,-40,length,-22);ctx.lineTo(length,-16);ctx.quadraticCurveTo(-10,-33,-length,-18);ctx.closePath();ctx.fill();
    if(s.wrap||s.livery){const pattern=s.livery||1;ctx.strokeStyle=pattern===4?'#d5fa87':pattern===5?'#ec78a9':'#e9e4cd';ctx.lineWidth=pattern===2?16:7;ctx.beginPath();
      if(pattern===3){for(let n=-length;n<length;n+=22){ctx.moveTo(n,-20);ctx.lineTo(n+30,24);}}else if(pattern===4){ctx.moveTo(-length,18);for(let n=-length;n<length;n+=30)ctx.lineTo(n,n%60===0?-8:20);}else{ctx.moveTo(-length,1);ctx.quadraticCurveTo(0,-8,length,-2);}ctx.stroke();
      if(pattern===5){ctx.fillStyle='#f6e7db';ctx.font='bold 38px sans-serif';ctx.fillText('07',-10,17);}ctx.strokeStyle='#223d45';ctx.lineWidth=2;ctx.stroke();}ctx.restore();
    ctx.fillStyle='#193945';ctx.beginPath();ctx.moveTo(backRoof-15,-34);ctx.quadraticCurveTo(backRoof-7,-roof+8,backRoof+7,-roof+7);ctx.lineTo(32,-roof+7);ctx.quadraticCurveTo(51,-roof+3,79,-34);ctx.quadraticCurveTo(0,-31,backRoof-15,-34);ctx.fill();
    ctx.strokeStyle='#8eb4c16b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(backRoof+9,-roof+10);ctx.quadraticCurveTo(10,-roof+7,48,-roof+14);ctx.stroke();
    if(car.shape!=='roadster'){ctx.strokeStyle=s.color;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-9,-roof+5);ctx.lineTo(-5,-32);ctx.stroke();}
    ctx.strokeStyle='#102d3855';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-12,-30);ctx.lineTo(-12,21);ctx.stroke();
    ctx.fillStyle='#d2e0dc';round(-30,-20,14,3,1.5);ctx.fill();round(59,-19,13,3,1.5);ctx.fill();
    ctx.fillStyle='#f6e9bf';round(length-16,-15,15,9,4);ctx.fill();ctx.fillStyle='#e47871';round(-length+2,-13,11,10,3);ctx.fill();
    ctx.strokeStyle='#14323d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(length-10,12);ctx.lineTo(length-34,12);ctx.stroke();
    if(['wedge','hyper','track'].includes(car.shape)){ctx.strokeStyle='#1b2932';ctx.lineWidth=4;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(-78+n*13,-16);ctx.lineTo(-62+n*13,10);ctx.stroke();}ctx.fillStyle='#1a2730';round(length-56,4,36,10,3);ctx.fill();}
    if(s.spoiler||s.spoilerType){const type=s.spoilerType||1;ctx.strokeStyle='#1b3038';ctx.lineWidth=type===3?7:5;ctx.beginPath();const rise=type===1?12:type===2?26:40;ctx.moveTo(-length+17,-22);ctx.lineTo(-length+17,-22-rise);ctx.moveTo(-length-5,-26-rise);ctx.quadraticCurveTo(-length+25,-32-rise,-length+(type===3?80:61),-27-rise);if(type===3){ctx.moveTo(-length-7,-34-rise);ctx.lineTo(-length-7,-17-rise);}ctx.stroke();}
    ctx.restore();
    for(const wx of [-base/2,base/2]){ctx.save();ctx.translate(wx,24);ctx.fillStyle='#111f28';ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4a6068';ctx.lineWidth=2;ctx.stroke();
      const wheel=ctx.createRadialGradient(-5,-6,1,0,0,radius-6);wheel.addColorStop(0,[2,5].includes(s.rims)?'#f3d599':s.rims===6?'#303e4c':'#e1e8e6');wheel.addColorStop(1,s.rims===0?'#728b97':'#9aaeb4');ctx.fillStyle=wheel;ctx.beginPath();ctx.arc(0,0,radius-6,0,Math.PI*2);ctx.fill();ctx.rotate(time*5);
      const spokes=[4,6,10,5,12,8,3][s.rims]||4;ctx.strokeStyle='#263b45';ctx.lineWidth=s.rims===2?2:3;for(let i=0;i<spokes;i++){const angle=i*Math.PI*2/spokes;ctx.beginPath();ctx.moveTo(Math.cos(angle)*5,Math.sin(angle)*5);ctx.lineTo(Math.cos(angle)*(radius-9),Math.sin(angle)*(radius-9));ctx.stroke();}ctx.fillStyle='#556e79';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.restore();
  }
  const api={MATERIALS,PLOT_PRICE,FLOOR,MAX_BODIES,CARS,defaultEstate,defaultGarage,normalizeEstate,normalizeGarage,defaultStyle,upgradeCost,BuildingWorld,mass,drawCar};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.BrukVentures=api;
})(typeof window==='undefined'?globalThis:window);
