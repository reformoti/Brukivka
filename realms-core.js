(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BrukRealms=factory();})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const WIDTH=2480,HEIGHT=1760,CAMP={x:385,y:440},SPAWN={x:350,y:500},RADIUS=15;
  const TYPES={slime:{name:'Лісовий слиз',hp:65,damage:8,speed:67,range:30,aggro:195,leash:330,cooldown:1.4,xp:20,silver:22,radius:19,color:'#9cbd70'},wolf:{name:'Дикий вовк',hp:115,damage:14,speed:106,range:34,aggro:245,leash:390,cooldown:1.3,xp:38,silver:42,radius:20,color:'#b5b5a2'},golem:{name:'Кам’яний вартовий',hp:230,damage:24,speed:53,range:44,aggro:210,leash:300,cooldown:2,xp:80,silver:90,radius:29,color:'#9d9c85'}};
  const SPAWNS=[['slime',740,420],['slime',860,630],['slime',1050,450],['slime',1140,790],['slime',660,1000],['slime',910,1150],['wolf',1350,550],['wolf',1500,880],['wolf',1260,1200],['wolf',1830,1120],['wolf',2010,1380],['golem',1810,410],['golem',2160,650],['golem',2040,1000]];
  const OBSTACLES=[{x:175,y:190,w:160,h:130,type:'house'},{x:435,y:190,w:145,h:120,type:'house'},{x:160,y:570,w:150,h:105,type:'house'},{x:425,y:615,w:155,h:105,type:'house'},{x:1380,y:170,w:290,h:205,type:'water'},{x:1000,y:930,w:180,h:170,type:'water'},{x:1940,y:260,w:100,h:65,type:'rock'},{x:1700,y:735,w:105,h:75,type:'rock'},{x:2230,y:1160,w:90,h:70,type:'rock'}];
  const WEAPONS=[{name:'Дорожній меч',cost:0},{name:'Залізний клинок',cost:160},{name:'Клинок мандрівника',cost:400},{name:'Срібний палаш',cost:850},{name:'Меч вартового',cost:1600},{name:'Клинок світанку',cost:2900}];
  const ARMOR=[{name:'Дорожній одяг',cost:0},{name:'Шкіряний жилет',cost:140},{name:'Кольчуга',cost:360},{name:'Ламелярний обладунок',cost:800},{name:'Панцир вартового',cost:1500},{name:'Обладунок світанку',cost:2700}];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),integer=(v,f=0)=>Number.isSafeInteger(v)&&v>=0?Math.min(99999999,v):f;
  const maxHp=s=>120+(s.level-1)*8+s.armor*15,attack=s=>27+(s.level-1)*2+s.weapon*10,xpGoal=s=>80*s.level;
  function blocked(x,y,r=RADIUS){if(x<r||x>WIDTH-r||y<r||y>HEIGHT-r)return true;return OBSTACLES.some(o=>{const px=clamp(x,o.x,o.x+o.w),py=clamp(y,o.y,o.y+o.h);return Math.hypot(x-px,y-py)<r;});}
  function normalize(raw={}){
    if(!raw||typeof raw!=='object')raw={};const s={x:Number.isFinite(raw.x)?clamp(raw.x,RADIUS,WIDTH-RADIUS):SPAWN.x,y:Number.isFinite(raw.y)?clamp(raw.y,RADIUS,HEIGHT-RADIUS):SPAWN.y,level:clamp(integer(raw.level,1),1,50),xp:integer(raw.xp),silver:integer(raw.silver),weapon:clamp(integer(raw.weapon),0,5),armor:clamp(integer(raw.armor),0,5),potions:clamp(integer(raw.potions,3),0,99),kills:{slime:integer(raw.kills?.slime),wolf:integer(raw.kills?.wolf),golem:integer(raw.kills?.golem)},questClaimed:raw.questClaimed===true};
    s.xp=Math.min(s.xp,xpGoal(s)-1);s.hp=Number.isFinite(raw.hp)?clamp(raw.hp,1,maxHp(s)):maxHp(s);if(blocked(s.x,s.y)){s.x=SPAWN.x;s.y=SPAWN.y;}return s;
  }
  class World{
    constructor(saved={},rng=Math.random){this.state=normalize(saved);this.random=rng;this.time=0;this.target=null;this.selected=null;this.attackCooldown=0;this.dashCooldown=0;this.dashTime=0;this.dashDirection={x:1,y:0};this.facing={x:1,y:0};this.swing=0;this.hurt=0;this.events=[];this.footstep=0;this.monsters=SPAWNS.map(([type,x,y],id)=>({id,type,x,y,homeX:x,homeY:y,hp:TYPES[type].hp,alive:true,cooldown:0,respawn:0,phase:rng()*Math.PI*2,hit:0,state:'patrol'}));}
    emit(type,data={}){this.events.push({type,...data});if(this.events.length>70)this.events.shift();}
    drainEvents(){return this.events.splice(0);}
    save(){return JSON.parse(JSON.stringify(this.state));}
    nearCamp(){return Math.hypot(this.state.x-CAMP.x,this.state.y-CAMP.y)<130;}
    setTarget(x,y){this.target={x:clamp(x,RADIUS,WIDTH-RADIUS),y:clamp(y,RADIUS,HEIGHT-RADIUS)};this.selected=null;}
    selectMonster(id){const m=this.monsters.find(m=>m.id===id&&m.alive);if(!m)return;this.selected=id;this.target=null;}
    moveEntity(entity,dx,dy,r=RADIUS){if(!blocked(entity.x+dx,entity.y,r))entity.x+=dx;if(!blocked(entity.x,entity.y+dy,r))entity.y+=dy;}
    gainXp(amount){const s=this.state;s.xp+=amount;while(s.level<50&&s.xp>=xpGoal(s)){s.xp-=xpGoal(s);s.level++;s.hp=maxHp(s);this.emit('level',{level:s.level});}if(s.level===50)s.xp=Math.min(s.xp,xpGoal(s)-1);}
    hitMonster(monster,damage){if(!monster.alive)return false;monster.hp-=damage;monster.hit=.2;this.emit('hit',{x:monster.x,y:monster.y-35,value:damage});if(monster.hp<=0){monster.hp=0;monster.alive=false;monster.respawn=14;const type=TYPES[monster.type];this.state.silver=Math.min(99999999,this.state.silver+type.silver);this.state.kills[monster.type]++;this.gainXp(type.xp);if(this.selected===monster.id)this.selected=null;this.emit('kill',{x:monster.x,y:monster.y,monsterType:monster.type,silver:type.silver,xp:type.xp});}return true;}
    attack(){
      if(this.attackCooldown>0)return false;this.attackCooldown=.52;this.swing=.25;
      const s=this.state,chosen=this.monsters.find(m=>m.id===this.selected&&m.alive),near=this.monsters.filter(m=>m.alive&&Math.hypot(m.x-s.x,m.y-s.y)<68+TYPES[m.type].radius).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));const target=chosen&&near.includes(chosen)?chosen:near[0];
      if(target){const d=Math.hypot(target.x-s.x,target.y-s.y)||1;this.facing={x:(target.x-s.x)/d,y:(target.y-s.y)/d};this.hitMonster(target,attack(s));}return true;
    }
    dash(dx,dy){if(this.dashCooldown>0)return false;const len=Math.hypot(dx,dy);this.dashDirection=len>.1?{x:dx/len,y:dy/len}:{...this.facing};this.dashTime=.18;this.dashCooldown=2.3;this.emit('dash');return true;}
    potion(){const s=this.state;if(s.potions<=0||s.hp>=maxHp(s))return false;s.potions--;s.hp=Math.min(maxHp(s),s.hp+75);this.emit('heal',{x:s.x,y:s.y-35,value:75});return true;}
    damage(amount){const s=this.state;if(this.dashTime>0)return;const damage=Math.max(2,amount-s.armor*2);s.hp-=damage;this.hurt=.2;this.emit('damage',{x:s.x,y:s.y-35,value:damage});if(s.hp<=0){const lost=Math.floor(s.silver*.1);s.silver-=lost;s.hp=Math.round(maxHp(s)*.65);s.x=SPAWN.x;s.y=SPAWN.y;this.selected=null;this.target=null;this.dashTime=0;this.emit('death',{lost});}}
    buy(kind){const s=this.state;if(!this.nearCamp())return {ok:false,message:'Повернись до торговця в таборі.'};if(kind==='potion'){if(s.potions>=99)return {ok:false,message:'Рюкзак повний.'};if(s.silver<35)return {ok:false,message:'Потрібно 35 срібла.'};s.silver-=35;s.potions++;return {ok:true,message:'Зілля в рюкзаку · Q для використання.'};}if(!['weapon','armor'].includes(kind))return {ok:false,message:'Невідомий товар.'};const list=kind==='weapon'?WEAPONS:ARMOR,item=list[s[kind]+1];if(!item)return {ok:false,message:'Максимальний рівень.'};if(s.silver<item.cost)return {ok:false,message:'Недостатньо срібла.'};s.silver-=item.cost;s[kind]++;if(kind==='armor')s.hp=Math.min(maxHp(s),s.hp+15);return {ok:true,message:`Придбано: ${item.name}.`};}
    claimQuest(){if(!this.nearCamp())return {ok:false,message:'Повернись до табору.'};if(this.state.questClaimed)return {ok:false,message:'Винагороду вже отримано.'};if(this.state.kills.slime<5)return {ok:false,message:'Спочатку здолай 5 лісових слизів.'};this.state.questClaimed=true;this.state.silver+=120;this.gainXp(60);return {ok:true,message:'Контракт виконано · +120 срібла та +60 досвіду.'};}
    update(dt,input={}){
      dt=clamp(Number.isFinite(dt)?dt:0,0,.05);if(!dt)return;this.time+=dt;this.attackCooldown=Math.max(0,this.attackCooldown-dt);this.dashCooldown=Math.max(0,this.dashCooldown-dt);this.dashTime=Math.max(0,this.dashTime-dt);this.swing=Math.max(0,this.swing-dt);this.hurt=Math.max(0,this.hurt-dt);
      const s=this.state;let dx=Number.isFinite(input.x)?input.x:0,dy=Number.isFinite(input.y)?input.y:0,manual=Math.hypot(dx,dy)>.01;
      if(manual){this.target=null;this.selected=null;}const selected=this.monsters.find(m=>m.id===this.selected&&m.alive);
      if(!manual&&selected){const distance=Math.hypot(selected.x-s.x,selected.y-s.y);if(distance>58+TYPES[selected.type].radius){dx=selected.x-s.x;dy=selected.y-s.y;}else this.attack();}
      if(!manual&&!selected&&this.target){dx=this.target.x-s.x;dy=this.target.y-s.y;if(Math.hypot(dx,dy)<7){this.target=null;dx=0;dy=0;}}
      let length=Math.hypot(dx,dy);if(length>0){dx/=length;dy/=length;this.facing={x:dx,y:dy};this.footstep+=dt*13;}
      if(input.dash)this.dash(dx,dy);if(this.dashTime>0){dx=this.dashDirection.x;dy=this.dashDirection.y;length=1;}
      const speed=this.dashTime>0?570:178;this.moveEntity(s,dx*speed*dt,dy*speed*dt);if(input.attack)this.attack();
      if(this.nearCamp()&&this.time>0)s.hp=Math.min(maxHp(s),s.hp+12*dt);
      for(const m of this.monsters){
        const t=TYPES[m.type];m.cooldown=Math.max(0,m.cooldown-dt);m.hit=Math.max(0,m.hit-dt);
        if(!m.alive){m.respawn-=dt;if(m.respawn<=0){m.alive=true;m.hp=t.hp;m.x=m.homeX;m.y=m.homeY;m.state='patrol';}continue;}
        const dist=Math.hypot(m.x-s.x,m.y-s.y),homeDist=Math.hypot(m.x-m.homeX,m.y-m.homeY),safe=this.nearCamp();
        if((dist<t.aggro||m.hp<t.hp||m.state==='chase')&&!safe&&homeDist<t.leash&&Math.hypot(s.x-m.homeX,s.y-m.homeY)<t.leash+70)m.state='chase';else if(m.state==='chase')m.state='return';
        let tx,ty,mSpeed=t.speed;if(m.state==='chase'){tx=s.x;ty=s.y;if(dist<t.range+RADIUS){if(m.cooldown<=0){this.damage(t.damage);m.cooldown=t.cooldown;}tx=m.x;ty=m.y;}}
        else if(m.state==='return'){tx=m.homeX;ty=m.homeY;mSpeed*=1.3;if(homeDist<8){m.state='patrol';m.hp=t.hp;}}
        else{tx=m.homeX+Math.cos(this.time*.35+m.phase)*46;ty=m.homeY+Math.sin(this.time*.3+m.phase)*32;mSpeed*=.4;m.hp=Math.min(t.hp,m.hp+dt*2);}
        const mx=tx-m.x,my=ty-m.y,len=Math.hypot(mx,my);if(len>4)this.moveEntity(m,mx/len*mSpeed*dt,my/len*mSpeed*dt,t.radius*.7);
      }
    }
  }
  return {World,normalize,maxHp,attack,xpGoal,blocked,WIDTH,HEIGHT,CAMP,SPAWN,TYPES,SPAWNS,OBSTACLES,WEAPONS,ARMOR};
});
