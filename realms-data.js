(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BrukRealmsData=factory();})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const WIDTH=8000,HEIGHT=5200,CAMP={x:500,y:470},SPAWN={x:520,y:530};
  const VILLAGE={x:70,y:90,w:880,h:780,gate:{x:950,y:500},exits:[{x:950,y:500},{x:355,y:90},{x:600,y:870},{x:70,y:590}]},inVillage=(x,y)=>x>VILLAGE.x&&x<VILLAGE.x+VILLAGE.w&&y>VILLAGE.y&&y<VILLAGE.y+VILLAGE.h;
  const TYPES={
    slime:{name:'Лісовий слиз',hp:65,damage:8,speed:67,range:30,aggro:195,leash:330,cooldown:1.4,xp:20,silver:22,radius:19,color:'#9cbd70',loot:{fiber:1},respawn:18},
    wolf:{name:'Дикий вовк',hp:115,damage:14,speed:106,range:34,aggro:245,leash:390,cooldown:1.3,xp:38,silver:42,radius:20,color:'#b5b5a2',loot:{hide:2},respawn:24},
    golem:{name:'Кам’яний вартовий',hp:230,damage:24,speed:53,range:44,aggro:210,leash:300,cooldown:2,xp:80,silver:90,radius:29,color:'#9d9c85',loot:{stone:3,iron:2},respawn:35},
    boar:{name:'Дикий кабан',hp:135,damage:17,speed:79,range:35,aggro:210,leash:340,cooldown:2,xp:45,silver:48,radius:24,color:'#ad8e6c',behavior:'charge',loot:{hide:2,herb:1},respawn:25},
    spider:{name:'Отруйний павук',hp:90,damage:10,speed:94,range:32,aggro:205,leash:310,cooldown:1.35,xp:38,silver:38,radius:20,color:'#8b9a76',behavior:'poison',loot:{fiber:3,herb:1},respawn:23},
    bandit:{name:'Розбійник',hp:175,damage:19,speed:91,range:36,aggro:235,leash:360,cooldown:1.5,xp:65,silver:72,radius:20,color:'#a58e6a',loot:{copper:2,cloth:1},respawn:30},
    skeleton:{name:'Кістяний страж',hp:200,damage:23,speed:73,range:40,aggro:230,leash:330,cooldown:1.7,xp:78,silver:85,radius:21,color:'#d4c9a2',loot:{iron:2,stone:2},respawn:32},
    mage:{name:'Попелястий чаклун',hp:155,damage:25,speed:60,range:290,aggro:350,leash:390,cooldown:2.4,xp:95,silver:105,radius:21,color:'#b2a6cd',behavior:'ranged',loot:{crystal:1,cloth:2},respawn:35},
    bear:{name:'Бурий ведмідь',hp:360,damage:30,speed:81,range:45,aggro:235,leash:350,cooldown:1.8,xp:125,silver:125,radius:30,color:'#957b5e',behavior:'charge',loot:{hide:4,herb:2},respawn:40},
    ancient:{name:'Прадавній охоронець',hp:1450,damage:42,speed:48,range:120,aggro:300,leash:330,cooldown:3.3,xp:350,silver:450,radius:43,color:'#91b5ae',behavior:'boss',loot:{crystal:5,mithril:4,steel_ingot:2},respawn:90,boss:true}
  };
  const SPAWNS=[['slime',740,420],['slime',860,630],['slime',1050,450],['slime',1140,790],['slime',660,1000],['slime',910,1150],['wolf',1350,550],['wolf',1500,880],['wolf',1260,1200],['wolf',1830,1120],['wolf',2010,1380],['golem',1810,410],['golem',2160,650],['golem',2040,1000],['slime',620,1280],['slime',980,1420],['boar',830,980],['boar',690,1500],['boar',1100,1560],['spider',1250,1450],['spider',1430,1620],['spider',1580,1320],['bandit',1330,800],['bandit',1620,1050],['bandit',1480,1850],['bandit',1900,1530],['skeleton',2230,420],['skeleton',2400,900],['skeleton',2220,1710],['skeleton',2580,1300],['mage',2510,580],['mage',2750,950],['mage',2490,1750],['bear',1670,1830],['bear',1110,1900],['golem',2830,600],['golem',2940,1240],['wolf',1950,1910],['wolf',2250,2010],['ancient',2840,1820]];
  const additions={rat:{base:'wolf',name:'Печерний щур',hp:85,damage:11,speed:125,radius:14,loot:{hide:1},silver:28,xp:24,skin:'#a19479'},rogue:{base:'bandit',name:'Тіньовий розвідник',hp:250,damage:28,speed:120,loot:{leather:2,iron:3},silver:115,xp:100,skin:'#766d9c'},wraith:{base:'mage',name:'Рунічний привид',hp:350,damage:35,speed:78,loot:{crystal:3,cloth:4},silver:210,xp:180,skin:'#83d5df'},salamander:{base:'boar',name:'Вогняна саламандра',hp:480,damage:38,speed:105,loot:{crystal:2,hide:5},silver:250,xp:220,skin:'#dc845b'},treant:{base:'golem',name:'Старий деревень',hp:800,damage:43,speed:42,loot:{wood:12,herb:6,mithril:3},silver:380,xp:280,skin:'#83a35f'},frostgiant:{base:'ancient',name:'Крижаний велетень',hp:2400,damage:65,speed:44,loot:{crystal:14,mithril_ingot:6},silver:1200,xp:850,skin:'#a3d8f1'}};
  for(const [id,m] of Object.entries(additions))TYPES[id]={...TYPES[m.base],...m,model:m.base,color:m.skin};
  SPAWNS.push(['rat',720,720],['rat',990,820],['rat',1020,1320],['rogue',1680,1240],['rogue',1960,1660],['wraith',2380,1480],['wraith',2740,1460],['salamander',1790,1740],['salamander',2080,1810],['treant',1530,1940],['treant',1970,2030],['frostgiant',2990,2040]);
  const HOUSES=[['blacksmith',150,150],['mage',400,135],['enchanter',650,150],['armorer',150,420],['alchemist',650,420],['artificer',150,665],['quartermaster',400,690],['market',650,665]].map(([owner,x,y])=>({owner,x,y,w:150,h:115,type:'house'}));
  const wallLines=[{x:70,y:90,w:245,h:14},{x:395,y:90,w:555,h:14},{x:70,y:870,w:490,h:14},{x:640,y:870,w:310,h:14},{x:70,y:90,w:14,h:450},{x:70,y:640,w:14,h:230},{x:950,y:90,w:14,h:330},{x:950,y:580,w:14,h:304}];
  const WALLS=wallLines.flatMap(o=>{const horizontal=o.w>o.h,length=horizontal?o.w:o.h,parts=[];for(let n=0;n<length;n+=180)parts.push({...o,x:o.x+(horizontal?n:0),y:o.y+(horizontal?0:n),w:horizontal?Math.min(180,length-n):o.w,h:horizontal?o.h:Math.min(180,length-n),type:'wall'});return parts;});
  const BILLBOARD={x:350,y:610,name:'Дошка пошани'};
  const ZONES=[{id:'sanctuary',x:4300,y:780,name:'Прадавнє святилище',boss:'ancient',level:20},{id:'citadel',x:4600,y:3050,name:'Крижана цитадель',boss:'frostgiant',level:25}];
  const GUARDS=[{id:'gate_north',x:925,y:435,name:'Варта',color:'#84979b'},{id:'gate_south',x:925,y:565,name:'Варта',color:'#84979b'}];
  const OBSTACLES=[...HOUSES,...WALLS,{x:1380,y:170,w:290,h:205,type:'water'},{x:1000,y:930,w:180,h:170,type:'water'},{x:1940,y:260,w:100,h:65,type:'rock'},{x:1700,y:735,w:105,h:75,type:'rock'},{x:2230,y:1160,w:90,h:70,type:'rock'},{x:2100,y:1380,w:230,h:170,type:'water'},{x:2780,y:270,w:130,h:85,type:'rock'},{x:2590,y:1950,w:120,h:75,type:'rock'}];
  OBSTACLES.push({x:3750,y:400,w:230,h:180,type:'water'},{x:4650,y:500,w:130,h:70,type:'rock'},{x:4250,y:2800,w:190,h:100,type:'rock'},{x:4750,y:3220,w:170,h:110,type:'water'});
  const progression={slime:[1,95,10,0,18],rat:[2,160,19,2,32],wolf:[3,260,32,6,62],boar:[4,400,38,9,90],spider:[5,330,34,10,110],bandit:[6,570,44,13,160],golem:[7,950,54,18,220],skeleton:[8,800,60,19,275],mage:[9,690,68,16,340],rogue:[10,1000,76,22,420],bear:[11,1500,85,25,500],wraith:[13,1400,105,28,720],salamander:[15,2000,125,33,950],treant:[17,3400,150,42,1200],ancient:[20,7200,200,60,2100],frostgiant:[25,12500,280,80,3800]};
  for(const [id,[level,hp,damage,defence,xp]] of Object.entries(progression))Object.assign(TYPES[id],{level,hp,damage,defence,xp});
  // Keep spawn IDs and types stable for saved kills and respawn timers.
  Object.assign(SPAWNS[0],['slime',1060,510]);Object.assign(SPAWNS[1],['slime',1100,700]);Object.assign(SPAWNS[2],['slime',1250,380]);Object.assign(SPAWNS[3],['slime',1250,800]);Object.assign(SPAWNS[40],['rat',1040,150]);
  Object.assign(SPAWNS[16],['boar',1470,980]);
  Object.assign(SPAWNS[39],['ancient',4300,780]);Object.assign(SPAWNS[51],['frostgiant',4600,3050]);Object.assign(SPAWNS[45],['wraith',4010,850]);Object.assign(SPAWNS[46],['wraith',4500,1050]);Object.assign(SPAWNS[47],['salamander',3950,2380]);Object.assign(SPAWNS[48],['salamander',4750,2700]);Object.assign(SPAWNS[49],['treant',3400,2200]);Object.assign(SPAWNS[50],['treant',4050,3200]);
  const WEAPONS=[{name:'Дорожній меч',cost:0},{name:'Залізний клинок',cost:160},{name:'Клинок мандрівника',cost:400},{name:'Срібний палаш',cost:850},{name:'Меч вартового',cost:1600},{name:'Клинок світанку',cost:2900}];
  WEAPONS.push({name:'Клинок міфрилу',cost:5200},{name:'Клинок реліквії',cost:9400},{name:'Клинок безсмертя',cost:17000});
  const ARMOR=[{name:'Дорожній одяг',cost:0},{name:'Шкіряний жилет',cost:140},{name:'Кольчуга',cost:360},{name:'Ламелярний обладунок',cost:800},{name:'Панцир вартового',cost:1500},{name:'Обладунок світанку',cost:2700}];
  ARMOR.push({name:'Міфриловий обладунок',cost:4900},{name:'Обладунок реліквії',cost:8800},{name:'Обладунок безсмертя',cost:16000});
  const FAMILIES={
    sword:{name:'Меч',icon:'sword',damage:1,range:80,interval:.52,cost:1,skill:'Коловий удар',skillDescription:'Удар по всіх ворогах навколо.',cooldown:8,role:'Універсальний ближній бій'},
    axe:{name:'Сокира',icon:'axe',damage:1.24,range:85,interval:.85,cost:1.12,skill:'Буревій сталі',skillDescription:'Потужний удар по площі та кровотеча.',cooldown:10,role:'Розсічення до трьох цілей'},
    spear:{name:'Спис',icon:'spear',damage:.98,range:135,interval:.68,cost:1.08,skill:'Пронизливий випад',skillDescription:'Ривок і удар по ворогах перед тобою.',cooldown:8,role:'Досяжність і дві цілі'},
    daggers:{name:'Кинджали',icon:'daggers',damage:.64,range:70,interval:.3,cost:1.1,skill:'Ненаситний шквал',skillDescription:'Сильний удар у ціль і відновлення здоров’я.',cooldown:9,role:'Швидкі одиночні атаки'},
    bow:{name:'Лук',icon:'bow',damage:.94,range:330,interval:.78,cost:1.15,skill:'Віяло стріл',skillDescription:'Три стріли, що сповільнюють ворогів.',cooldown:8,role:'Дальній бій і контроль',ranged:true},
    staff:{name:'Посох',icon:'staff',damage:1.1,range:290,interval:.95,cost:1.22,skill:'Вогняна сфера',skillDescription:'Вибух у вибраній точці та опік ворогів.',cooldown:11,role:'Магія та атаки по площі',ranged:true}
  };
  const ARMOR_KINDS={plate:{name:'Важка броня',icon:'plate',hp:15,resist:2,description:'Найбільше здоров’я та захисту.'},leather:{name:'Шкіряна броня',icon:'leather',hp:9,resist:1.15,description:'+7% швидкості руху та атак.'},cloth:{name:'Мантія',icon:'cloth',hp:5,resist:.65,description:'+12% магічної шкоди та +25 мани.'}};
  const SUPPORTS={shield:{name:'Щит',description:'+1.5 захисту за рівень.'},focus:{name:'Фоліант',description:'+5% магічної шкоди та +12 мани за рівень.'},torch:{name:'Смолоскип',description:'+4% швидкості атак за рівень.'}};
  const EXTRAS={boots:{name:'Чоботи',description:'+4% руху та +5 здоров’я за рівень.'},cape:{name:'Плащ',description:'+12 мани та +3% досвіду за рівень.'},bag:{name:'Сумка',description:'+50 ваги за рівень.'}};
  const RESOURCES={
    copper:{name:'Мідна руда',color:'#c79066',value:8,weight:1.5},iron:{name:'Залізна руда',color:'#a7bec2',value:14,weight:1.5},mithril:{name:'Міфрилова руда',color:'#91cbd8',value:28,weight:1.5},stone:{name:'Камінь',color:'#a3ae95',value:5,weight:2},wood:{name:'Деревина',color:'#bd9d6a',value:4,weight:1.5},fiber:{name:'Волокно',color:'#bdce8a',value:5,weight:.5},hide:{name:'Шкура',color:'#bca17f',value:7,weight:1},herb:{name:'Лікувальні трави',color:'#8fbf8e',value:5,weight:.3},crystal:{name:'Рунічний кристал',color:'#c1ace0',value:40,weight:.5},copper_ingot:{name:'Мідний зливок',color:'#d6a578',value:26,weight:1},iron_ingot:{name:'Залізний зливок',color:'#bfd0d0',value:48,weight:1},steel_ingot:{name:'Сталевий зливок',color:'#96b3ca',value:150,weight:1},mithril_ingot:{name:'Міфриловий зливок',color:'#a7dde0',value:160,weight:1},plank:{name:'Дошки',color:'#d0b279',value:14,weight:1},cloth:{name:'Тканина',color:'#d9cfa9',value:23,weight:.5},leather:{name:'Шкіра',color:'#bf9167',value:22,weight:.7}
  };
  const NODE_TYPES={copper:{resource:'copper',name:'Мідна жила',tool:'pickaxe',required:0,charges:4,seconds:2.3,respawn:25,xp:5},iron:{resource:'iron',name:'Залізна жила',tool:'pickaxe',required:1,charges:4,seconds:3,respawn:35,xp:8},mithril:{resource:'mithril',name:'Міфрилова жила',tool:'pickaxe',required:2,charges:3,seconds:3.6,respawn:50,xp:12},crystal:{resource:'crystal',name:'Рунічна друза',tool:'pickaxe',required:3,charges:3,seconds:4,respawn:60,xp:15},stone:{resource:'stone',name:'Кам’яна брила',tool:'pickaxe',required:0,charges:4,seconds:2,respawn:25,xp:4},wood:{resource:'wood',name:'Дерево для рубки',tool:'axe',required:0,charges:5,seconds:2.1,respawn:28,xp:4},fiber:{resource:'fiber',name:'Дикі льони',tool:'sickle',required:0,charges:4,seconds:1.8,respawn:22,xp:4},herb:{resource:'herb',name:'Лікувальні трави',tool:'sickle',required:0,charges:3,seconds:2,respawn:30,xp:5}};
  const NODES=[['copper',610,730],['copper',890,350],['copper',570,1100],['copper',1030,1330],['iron',1320,390],['iron',1510,1130],['iron',1840,920],['iron',2040,1750],['mithril',2350,730],['mithril',2670,1190],['mithril',2960,1620],['crystal',2620,1610],['crystal',2940,1940],['crystal',3020,450],['stone',830,800],['stone',1280,1000],['stone',1830,630],['wood',540,800],['wood',700,250],['wood',990,780],['wood',1300,1770],['wood',1770,1360],['fiber',540,540],['fiber',790,1290],['fiber',1580,1560],['herb',330,850],['herb',820,520],['herb',1190,1830],['herb',2010,1220]].map(([type,x,y],id)=>({id,type,x,y}));
  Object.assign(NODES[17],{x:600,y:900});Object.assign(NODES[18],{x:820,y:300});
  for(const [type,x,y] of [['mithril',3900,600],['crystal',4500,850],['wood',3500,1200],['herb',3700,1800],['mithril',4400,2700],['crystal',4750,3000],['iron',3350,2000],['stone',3600,2800]])NODES.push({id:NODES.length,type,x,y});
  const TOOLS={pickaxe:{name:'Кирка',description:'T1 відкриває залізо, T2 — міфрил, T3 — кристали.'},axe:{name:'Сокира лісоруба',description:'Кожен рівень прискорює рубку.'},sickle:{name:'Серп',description:'Кожен рівень прискорює збір волокна та трав.'}};
  const RECIPES={
    copper_ingot:{name:'Виплавити мідь',input:{copper:2},output:{copper_ingot:1},fee:2,xp:12},
    iron_ingot:{name:'Виплавити залізо',input:{iron:2,wood:1},output:{iron_ingot:1},fee:4,xp:18},
    steel_ingot:{name:'Виплавити сталь',input:{iron_ingot:2,copper_ingot:1},output:{steel_ingot:1},fee:10,xp:30},
    mithril_ingot:{name:'Виплавити міфрил',input:{mithril:2,crystal:1,wood:1},output:{mithril_ingot:1},fee:12,xp:40},
    plank:{name:'Розпиляти деревину',input:{wood:2},output:{plank:1},fee:1,xp:10},
    cloth:{name:'Виткати тканину',input:{fiber:3},output:{cloth:1},fee:2,xp:12},
    leather:{name:'Вичинити шкіру',input:{hide:2},output:{leather:1},fee:2,xp:12},
    potion:{name:'Зварити зілля',input:{herb:3},output:{},fee:8,xp:14,potion:true}
  };
  const TALENTS={
    vitality:{name:'Міцність',branch:'Вартовий',description:'+12 максимального здоров’я за ранг.',max:5},
    guard:{name:'Стійка захисника',branch:'Вартовий',description:'+1.5 захисту за ранг.',max:5,parent:'vitality'},
    leech:{name:'Бойове відновлення',branch:'Вартовий',description:'Удар лікує на 1% шкоди за ранг.',max:5,parent:'vitality'},
    agility:{name:'Легка хода',branch:'Дослідник',description:'+3% швидкості руху за ранг.',max:5},
    prospector:{name:'Старатель',branch:'Дослідник',description:'+12% швидкості збору, додатковий ресурс на рангах 2 і 4.',max:5,parent:'agility'},
    trader:{name:'Торгівець',branch:'Дослідник',description:'+4% ціни продажу ресурсів за ранг.',max:5,parent:'agility'},
    smith:{name:'Коваль',branch:'Ремісник',description:'−5% срібної комісії крафту за ранг.',max:5},
    alchemist:{name:'Травник',branch:'Ремісник',description:'+10 здоров’я від зілля за ранг.',max:5,parent:'smith'},
    packmaster:{name:'Вантажник',branch:'Ремісник',description:'+25 місткості сумки за ранг.',max:5,parent:'smith'}
  };
  const CONTRACTS={trail:{name:'Стежка має бути вільною',description:'Здолай 5 лісових слизів.',target:5,silver:120,xp:60},miner:{name:'Перший метал',description:'Видобудь 12 одиниць руди.',target:12,silver:180,xp:80,tool:true},hunter:{name:'Вовчий слід',description:'Здолай 5 вовків.',target:5,silver:300,xp:120},artisan:{name:'Руки майстра',description:'Створи або перероби 8 предметів.',target:8,silver:350,xp:120},warden:{name:'Серце старих руїн',description:'Переможи Прадавнього охоронця.',target:1,silver:750,xp:260}};
  const VARIANTS={},DEFAULT_VARIANTS={};
  const variantRows={
    sword:[['broadsword','Палаш',1,1,1,1],['claymore','Клеймор',2,1.23,1.18,1.16],['dual','Парні мечі',2,.88,1,.76]],
    axe:[['battleaxe','Бойова сокира',1,1,1,1],['greataxe','Велика сокира',2,1.28,1.1,1.2],['halberd','Алебарда',2,1.08,1.52,1.16]],
    spear:[['spear','Спис',1,1,1,1],['pike','Піка',2,1.21,1.4,1.17],['glaive','Глефа',2,1.1,1.18,.92]],
    daggers:[['dagger','Кинджал',1,1,1,1],['pair','Парні кинджали',2,.9,1.05,.76],['claws','Бойові пазурі',2,1.18,.9,1.06]],
    bow:[['longbow','Довгий лук',2,1,1,1],['warbow','Бойовий лук',2,1.3,1.2,1.28],['crossbow','Арбалет',2,1.45,.95,1.5]],
    staff:[['fire','Вогняний посох',1,1,1,1],['greatfire','Великий посох',2,1.32,1.15,1.2],['frost','Морозний посох',1,.88,1.12,.88]]
  };
  for(const [family,rows] of Object.entries(variantRows))rows.forEach(([key,name,hands,damage,reach,interval],index)=>{const id=family+'_'+key;VARIANTS[id]={id,family,name,hands,damage,reach,interval,index,icon:family,description:(hands===2?'Дворучна зброя. Друга рука не діє.':'Одноручна зброя. Працює разом із другою рукою.')};if(index===0)DEFAULT_VARIANTS[family]=id;});
  const OUTFITS={
    soldier_helm:{name:'Шолом вартового',slot:'head',icon:'plate',defence:1.5,hp:8,description:'Захист і запас здоров’я.'},
    hunter_hood:{name:'Каптур мисливця',slot:'head',icon:'leather',dodge:.01,crit:.01,description:'Ухилення та шанс критичного удару.'},
    scholar_cowl:{name:'Ковпак знавця',slot:'head',icon:'cloth',mana:12,damage:.01,description:'Мана та сила ударів.'},
    soldier_boots:{name:'Чоботи вартового',slot:'feet',icon:'boots',hp:10,defence:.7,description:'Міцність для ближнього бою.'},
    hunter_boots:{name:'Черевики мисливця',slot:'feet',icon:'boots',speed:.025,dodge:.007,description:'Рухливість і ухилення.'},
    scholar_sandals:{name:'Сандалі знавця',slot:'feet',icon:'boots',mana:8,speed:.015,description:'Мана та швидкість.'},
    guardian_cape:{name:'Плащ охоронця',slot:'cloak',icon:'cape',hp:12,defence:.5,description:'Додатковий запас здоров’я.'},
    scout_cape:{name:'Плащ розвідника',slot:'cloak',icon:'cape',speed:.015,crit:.01,description:'Швидкість і критичні удари.'},
    sage_cape:{name:'Плащ мудреця',slot:'cloak',icon:'cape',mana:10,damage:.015,description:'Мана та сила зброї.'}
  };
  Object.assign(TALENTS,{
    power:{name:'Сила зброї',branch:'Вартовий',description:'+3% шкоди за ранг.',max:5},
    fortitude:{name:'Витривалість',branch:'Вартовий',description:'+18 здоров’я за ранг.',max:5,parent:'vitality'},
    armourTraining:{name:'Знавець обладунків',branch:'Вартовий',description:'+2 захисту за ранг.',max:5,parent:'guard'},
    precision:{name:'Точність',branch:'Вартовий',description:'+2% шансу критичного удару за ранг. Критичний удар завдає ×1.5 шкоди.',max:5,parent:'power'},
    evasion:{name:'Ухилення',branch:'Дослідник',description:'+1.5% шансу ухилитися від удару за ранг.',max:5},
    quickstep:{name:'Легка хода',branch:'Дослідник',description:'+2% швидкості руху за ранг.',max:5,parent:'agility'},
    windrunner:{name:'Крок вітру',branch:'Дослідник',description:'+0.8% ухилення та +0.8% швидкості за ранг.',max:5,parent:'evasion'},
    weaponFlow:{name:'Темп бою',branch:'Дослідник',description:'+2% швидкості звичайних атак за ранг.',max:5,parent:'quickstep'},
    focusMastery:{name:'Внутрішнє джерело',branch:'Ремісник',description:'+10 мани за ранг.',max:5},
    endurance:{name:'Загартування',branch:'Ремісник',description:'+8 здоров’я та +15 місткості за ранг.',max:5,parent:'smith'},
    recovery:{name:'Відновлення',branch:'Ремісник',description:'+2 здоров’я за секунду відновлення в таборі за ранг.',max:5,parent:'alchemist'},
    balanced:{name:'Збалансована зброя',branch:'Ремісник',description:'+1% шкоди та +0.5 захисту за ранг.',max:5,parent:'endurance'}
  });
  const TRADERS={
    blacksmith:{name:'Коваль',role:'Зброя, лати та інструменти',icon:'sword',x:225,y:310,color:'#9c7452'},
    mage:{name:'Маг',role:'Посохи, мантії та фокуси',icon:'staff',x:475,y:290,color:'#8d80b4'},
    enchanter:{name:'Рунний майстер',role:'Зачарування спорядження',icon:'crystal',x:725,y:310,color:'#73b9b1'},
    armorer:{name:'Бронник',role:'Броня, шоломи, чоботи та плащі',icon:'plate',x:325,y:490,color:'#a3a798'},
    alchemist:{name:'Алхімік',role:'Зілля та рецепти лікування',icon:'potion',x:625,y:490,color:'#96b26e'},
    artificer:{name:'Ремісник',role:'Переробка, сумки та інструменти',icon:'bag',x:225,y:800,color:'#b29a6a'},
    quartermaster:{name:'Інтендант',role:'Сховище та контракти',icon:'flag',x:475,y:825,color:'#8b9dab'},
    market:{name:'Ринок',role:'Продаж ресурсів із сумки та сховища',icon:'resource_copper',x:725,y:800,color:'#c7ac78'}
  };
  for(const h of HOUSES)Object.assign(h,{name:TRADERS[h.owner].name,color:TRADERS[h.owner].color});
  function traderStock(id,slot,kind){const catalog={variant:VARIANTS,armor:ARMOR_KINDS,outfit:OUTFITS,support:SUPPORTS,extra:EXTRAS}[slot];if(!catalog||!Object.hasOwn(catalog,kind))return false;if(id==='blacksmith')return slot==='variant'&&VARIANTS[kind]?.family!=='staff'||slot==='armor'&&kind==='plate'||slot==='support'&&kind==='shield';if(id==='mage')return slot==='variant'&&VARIANTS[kind]?.family==='staff'||slot==='armor'&&kind==='cloth'||slot==='support'&&kind==='focus'||slot==='extra'&&kind==='cape';if(id==='armorer')return ['armor','outfit','extra','support'].includes(slot);if(id==='artificer')return slot==='extra'&&kind==='bag';return false;}
  const MOUNTS={donkey:{name:'Вантажний віслюк',hp:180,speed:1.35,protection:5,cost:350,model:'donkey',color:'#9c927c'},horse:{name:'Дорожній кінь',hp:260,speed:1.65,protection:10,cost:1800,model:'horse',color:'#aa7852'},direwolf:{name:'Їздовий вовк',hp:220,speed:1.85,protection:12,cost:7500,model:'wolf',color:'#a7b4bb'},warhorse:{name:'Броньований кінь',hp:520,speed:1.5,protection:35,cost:12000,model:'horse',color:'#647c80'}};
  const APPEARANCE={skin:{light:'#dfc0a0',warm:'#c5a07b',bronze:'#9d7053',dark:'#65483b'},hair:{black:'#292c2b',brown:'#65442f',blond:'#ceb578',red:'#a45d3d',silver:'#c0c9c7'},style:{short:'Коротка зачіска',long:'Довге волосся',braids:'Коси',shaved:'Без волосся'},beard:{none:'Без бороди',short:'Щетина',full:'Борода'},accent:{olive:'#73846a',crimson:'#a34d4a',azure:'#4f89a1',violet:'#89729b',sand:'#b6a077'},body:{standard:'Звичайна статура',slim:'Струнка статура',broad:'Міцна статура'}};
  const SKILL_CHOICES={};
  const alternatives={sword:[['lunge','Випад',8,20,'Ривок і потужний удар по цілі.'],['mend','Бойова перев’язка',14,30,'Відновлює здоров’я, витрачає енергію.']],axe:[['rending','Розрив',10,20,'Удар і тривала кровотеча.'],['quake','Землетрус',11,25,'Широкий удар навколо та сповільнення.']],spear:[['pierce','Прокол',9,20,'Сильний удар на великій відстані.'],['retreat','Відступ списника',7,15,'Стрибок назад, щоб розірвати дистанцію.']],daggers:[['ambush','Засідка',9,20,'Зближення та різкий удар.'],['flurry','П’ять лез',11,25,'Серія ударів і невелике лікування.']],bow:[['charged','Потужний постріл',10,25,'Далека стріла зі сповільненням.'],['retreat','Відступ лучника',8,20,'Стрибок назад і стріла у відповідь.']],staff:[['frost','Крижаний уламок',9,25,'Магічний снаряд, що сповільнює.'],['nova','Магічна хвиля',11,30,'Вибух навколо мага та сповільнення.']]};
  for(const [id,f] of Object.entries(FAMILIES))SKILL_CHOICES[id]=[{id:'standard',name:f.skill,cooldown:f.cooldown,mana:20,description:f.skillDescription},...alternatives[id].map(([id,name,cooldown,mana,description])=>({id,name,cooldown,mana,description}))];
  const BOSS_SKILLS={ancient:[{id:'slam',name:'Кам’яний обвал',shape:'circle',radius:125,factor:1.0,windup:.95},{id:'stone_line',name:'Розлом землі',shape:'line',radius:32,range:330,factor:1.1,windup:1}],frostgiant:[{id:'ice_ring',name:'Крижане кільце',shape:'ring',radius:190,inner:75,factor:1.1,windup:1.1},{id:'ice_lance',name:'Крижаний спис',shape:'line',radius:25,range:390,factor:1.2,windup:.9}],venomqueen:[{id:'venom_pool',name:'Отруйна калюжа',shape:'circle',radius:90,factor:.4,windup:1},{id:'web_fan',name:'Павутинне віяло',shape:'cone',radius:230,angle:1.6,factor:.8,windup:.85}],warlord:[{id:'cleave',name:'Розсічення',shape:'cone',radius:175,angle:2.2,factor:1.35,windup:.8},{id:'rush',name:'Таран',shape:'line',radius:35,range:280,factor:1.4,windup:.85}],emberlord:[{id:'meteor',name:'Метеоритний дощ',shape:'multi',radius:65,factor:.9,windup:1.15},{id:'flame_ring',name:'Вогняне кільце',shape:'ring',radius:210,inner:80,factor:1.2,windup:1}],stormseer:[{id:'cross',name:'Хрест блискавок',shape:'cross',radius:25,range:330,factor:1.1,windup:1},{id:'blink',name:'Стрибок бурі',shape:'circle',radius:120,factor:.9,windup:1.1}]};
  const newBosses={venomqueen:{name:'Королева павутиння',model:'spider',bossStyle:'venom',scale:1.6,level:8,hp:1900,damage:60,defence:22,xp:450,silver:260,radius:36,color:'#9eb76b',loot:{hide:8,herb:8,crystal:2}},warlord:{name:'Залізний воєвода',model:'bandit',bossStyle:'iron',scale:1.5,level:12,hp:3900,damage:110,defence:32,xp:950,silver:580,radius:33,color:'#ae9a72',loot:{steel_ingot:6,leather:5,crystal:4}},emberlord:{name:'Володар попелу',model:'ancient',bossStyle:'fire',scale:1.1,level:18,hp:6400,damage:175,defence:50,xp:1700,silver:950,radius:43,color:'#d77d53',loot:{crystal:10,mithril:8,steel_ingot:4}},stormseer:{name:'Віщун бурі',model:'mage',bossStyle:'storm',scale:1.7,level:22,hp:8600,damage:230,defence:60,xp:2800,silver:1450,radius:36,color:'#9bbbd6',loot:{crystal:15,mithril_ingot:5,cloth:10}}};
  for(const [id,b] of Object.entries(newBosses))TYPES[id]={...TYPES.ancient,...b,boss:true,behavior:'boss',range:250,aggro:310,leash:390,cooldown:3.5,respawn:100};
  for(const [id,x,y] of [['venomqueen',1650,2750],['warlord',3300,550],['emberlord',3300,2500],['stormseer',4800,1700]]){SPAWNS.push([id,x,y]);ZONES.push({id,x,y,name:TYPES[id].name,boss:id,level:TYPES[id].level});}
  for(const [id,a] of Object.entries(ARMOR_KINDS))Object.assign(a,{baseProtection:{plate:18,leather:12,cloth:7}[id],tierProtection:{plate:4.8,leather:3.2,cloth:2.4}[id]});
  for(const [id,o] of Object.entries(OUTFITS))o.protection=id.startsWith('soldier')||id==='guardian_cape'?3:id.startsWith('hunter')||id==='scout_cape'?2:1;

  const MAX_TIER=12,MAX_ENCHANT=8,MAX_MASTERY=30,MAX_SPECIALIZATION=40,STACK_SIZE=999;
  const CITY={x:7040,y:2120,w:860,h:960},PASS={x:6490,y:2400,w:300,h:400,barrierX:6790},MONOLITH={x:6940,y:2600};
  const inCity=(x,y)=>x>CITY.x&&x<CITY.x+CITY.w&&y>CITY.y&&y<CITY.y+CITY.h;
  const REGIONS=[{id:'meadows',x:980,y:0,w:1020,h:1480,level:1},{id:'forest',x:980,y:1480,w:1620,h:3720,level:3},{id:'quarry',x:2020,y:0,w:2080,h:1380,level:7},{id:'ruins',x:2600,y:1380,w:1500,h:3820,level:10},{id:'wilds',x:4100,y:0,w:2350,h:5200,level:25},{id:'city',x:6800,y:0,w:1200,h:5200,level:80},{id:'pass',x:6490,y:2400,w:310,h:400,level:80}];
  // Existing spawn IDs/types stay stable; old positions are deliberately redistributed.
  const centers={slime:[[1140,380],[1200,1140],[1710,700]],rat:[[1690,130],[1750,1200]],wolf:[[1230,1830],[1880,1910],[2210,2370]],boar:[[1110,2820],[1880,3160]],spider:[[2180,2850],[2380,3330]],bandit:[[2350,480],[2750,950]],golem:[[2970,240],[3170,1130]],skeleton:[[2870,1650],[3070,2250]],mage:[[3550,1730],[3660,2940]],bear:[[2780,3200],[3320,3400]],rogue:[[3650,1040],[3840,2130]],wraith:[[4050,1450],[4660,1200]],salamander:[[4500,2350],[4960,2950]],treant:[[3900,3430],[4600,3690]]},seen={};
  const SPAWN_GROUPS={};
  for(let i=0;i<SPAWNS.length;i++){const [kind]=SPAWNS[i],list=centers[kind];if(!list)continue;const n=seen[kind]||0;seen[kind]=n+1;const g=Math.floor(n/3)%list.length,[cx,cy]=list[g],offset=[[-55,0],[55,0],[0,75]][n%3];SPAWNS[i]=[kind,cx+offset[0],cy+offset[1]];SPAWN_GROUPS[i]=kind+'-'+g;}
  for(const t of Object.values(TYPES)){t.aggro=Math.min(t.boss?150:110,Math.round(t.aggro*.5));t.leash=Math.min(t.leash,300);}
  const addSpawn=(kind,x,y,group)=>{const id=SPAWNS.length;SPAWNS.push([kind,x,y]);if(group)SPAWN_GROUPS[id]=group;return id;};
  // A leader for each camp of ordinary enemies.
  for(const [kind,list] of Object.entries(centers)){const base=TYPES[kind],id='elite_'+kind;TYPES[id]={...base,name:'Елітний · '+base.name,model:base.model||kind,elite:true,scale:1.15,hp:Math.round(base.hp*2.4),damage:Math.round(base.damage*1.35),xp:base.xp*3,silver:base.silver*3,color:'#cbb271'};for(let g=0;g<list.length;g++)if(Object.values(SPAWN_GROUPS).includes(kind+'-'+g)){const [x,y]=list[g];addSpawn(id,x,y-70,kind+'-'+g);}}
  for(const [kind,base,level,x,y] of [['highland_wolf','wolf',30,5270,560],['iron_guard','skeleton',45,5680,1450],['ash_mage','mage',60,5300,3300],['pass_knight','bandit',72,6080,4140]]){const b=TYPES[base];TYPES[kind]={...b,model:base,name:{highland_wolf:'Гірський вовк',iron_guard:'Залізний легіонер',ash_mage:'Маг згарища',pass_knight:'Лицар перевалу'}[kind],level,hp:level*160,damage:level*14,defence:level*3,xp:level*250,silver:level*40};for(const [dx,dy] of [[-80,0],[80,0],[0,90]])addSpawn(kind,x+dx,y+dy,kind);const elite='elite_'+kind;TYPES[elite]={...TYPES[kind],name:'Елітний · '+TYPES[kind].name,elite:true,scale:1.15,hp:level*400,xp:level*750,silver:level*120};addSpawn(elite,x,y-90,kind);}
  const minis=[['mosskeeper','treant',14,2550,4000],['crypt_lord','skeleton',24,3350,4150],['ironmaw','bear',38,4900,4400],['rime_hunter','wolf',52,5900,650],['ash_oracle','mage',66,5940,3000]];
  for(const [id,base,level,x,y] of minis){TYPES[id]={...TYPES[base],name:{mosskeeper:'Моховий хранитель',crypt_lord:'Володар склепу',ironmaw:'Залізна паща',rime_hunter:'Крижаний мисливець',ash_oracle:'Попелястий оракул'}[id],model:TYPES[base].model||base,miniBoss:true,boss:true,bossStyle:'iron',scale:1.4,level,hp:level*360,damage:level*16,defence:level*3,xp:level*750,silver:level*150,radius:36,aggro:145,leash:260,cooldown:3.5,respawn:120,behavior:'boss'};BOSS_SKILLS[id]=BOSS_SKILLS[base==='mage'?'stormseer':'warlord'];addSpawn(id,x,y);}
  TYPES.pass_guardian={...TYPES.ancient,name:'Титан перевалу',model:'ancient',bossStyle:'iron',scale:1.5,boss:true,level:80,hp:98000,damage:1400,defence:280,xp:100000,silver:22000,radius:58,aggro:150,leash:180,range:145,respawn:180,loot:{crystal:120,mithril_ingot:90,steel_ingot:90}};BOSS_SKILLS.pass_guardian=BOSS_SKILLS.ancient;addSpawn('pass_guardian',6600,2600);
  for(const [id,base,level,x,y] of [['city_wraith','wraith',110,7400,800],['city_salamander','salamander',160,7470,4000]]){TYPES[id]={...TYPES[base],model:TYPES[base].model||base,name:level===110?'Привид півночі':'Саламандра глибин',level,hp:level*280,damage:level*18,defence:level*3,xp:level*1000,silver:level*100,aggro:110,leash:250};for(const [dx,dy] of [[-80,0],[80,0],[0,100]])addSpawn(id,x+dx,y+dy,id);const elite='elite_'+id;TYPES[elite]={...TYPES[id],name:'Елітний · '+TYPES[id].name,elite:true,scale:1.15,hp:level*670,xp:level*3000,silver:level*300};addSpawn(elite,x,y-90,id);}
  OBSTACLES.push({x:6490,y:0,w:300,h:2400,type:'mountain'},{x:6490,y:2800,w:300,h:HEIGHT-2800,type:'mountain'});
  const CITY_LAYOUT=[['blacksmith',7130,2170],['mage',7590,2170],['armorer',7130,2380],['alchemist',7590,2380],['enchanter',7130,2590],['artificer',7590,2590],['quartermaster',7130,2800],['market',7590,2800]];
  const CITY_LANDMARKS={hall:{x:7440,y:2500,name:'Ратуша'},inn:{x:7440,y:2890,name:'Заїзд'},fountain:{x:7440,y:2290,name:'Фонтан'}};
  const CITY_WALLS=[{x:7040,y:2110,w:330,h:22},{x:7510,y:2110,w:390,h:22},{x:7040,y:3070,w:330,h:22},{x:7510,y:3070,w:390,h:22},{x:7030,y:2120,w:22,h:390},{x:7030,y:2690,w:22,h:390},{x:7890,y:2120,w:22,h:390},{x:7890,y:2690,w:22,h:390}].map(w=>({...w,type:'citywall'}));
  OBSTACLES.push(...CITY_WALLS,{x:7375,y:2240,w:130,h:90,type:'fountain'},{x:7350,y:2760,w:180,h:95,type:'inn'});
  const DUNGEONS=[
    {id:'cavern',name:'Мідна печера',level:8,entry:{x:1540,y:2400},arena:{x:80,y:1600,w:780,h:950},color:'#78674e',types:['cave_rat','cave_guard','cave_warden'],reward:{silver:850,xp:1200,loot:{iron:30,crystal:6}}},
    {id:'crypt',name:'Склеп забутих',level:24,entry:{x:3620,y:3860},arena:{x:80,y:2770,w:780,h:950},color:'#5b6470',types:['crypt_bone','crypt_mage','crypt_regent'],reward:{silver:4200,xp:7000,loot:{steel_ingot:18,crystal:24}}},
    {id:'vault',name:'Сховище Вартових',level:90,entry:{x:7815,y:2985},arena:{x:80,y:3940,w:780,h:1050},color:'#524e70',types:['vault_shade','vault_sentinel','vault_archon'],reward:{silver:24000,xp:75000,loot:{mithril_ingot:45,crystal:90}}}
  ];
  const dungeonTypes=[['cave_rat','rat',8,450,25],['cave_guard','skeleton',9,750,38],['cave_warden','ancient',10,3500,80],['crypt_bone','skeleton',24,3200,140],['crypt_mage','mage',26,2900,180],['crypt_regent','wraith',28,15000,320],['vault_shade','wraith',90,30000,900],['vault_sentinel','golem',95,45000,1100],['vault_archon','ancient',100,220000,1800]];
  const dungeonNames={cave_rat:'Печерний падальник',cave_guard:'Мідний страж',cave_warden:'Хранитель печери',crypt_bone:'Забутий воїн',crypt_mage:'Жрець склепу',crypt_regent:'Регент забутих',vault_shade:'Тінь сховища',vault_sentinel:'Вартовий реліквій',vault_archon:'Архонт Вартових'};
  for(const [id,base,level,hp,damage] of dungeonTypes){const boss=id.endsWith('warden')||id.endsWith('regent')||id.endsWith('archon');TYPES[id]={...TYPES[base],model:TYPES[base].model||base,name:dungeonNames[id],level,hp,damage,defence:Math.round(level*1.5),xp:level*(boss?500:90),silver:level*(boss?80:10),respawn:1000000,boss,miniBoss:boss,scale:boss?1.35:1,radius:boss?36:20,aggro:140,leash:450,loot:{[level<20?'iron':level<50?'steel_ingot':'mithril_ingot']:boss?8:2}};if(boss)TYPES[id].bossStyle=base==='ancient'?'stone':'storm';if(boss)BOSS_SKILLS[id]=BOSS_SKILLS[base==='ancient'?'ancient':'stormseer'];}
  for(const d of DUNGEONS){const a=d.arena,cx=a.x+a.w/2;d.spawn={x:cx,y:a.y+a.h-100};d.chest={x:cx+110,y:a.y+125};d.exit={x:cx,y:a.y+a.h-55};d.gates=[{x:cx-70,y:a.y+530,w:140,h:20,stage:1},{x:cx-70,y:a.y+245,w:140,h:20,stage:2}];d.waves=[];
    const rows=[[[cx-125,a.y+690],[cx+125,a.y+690],[cx-75,a.y+775],[cx+75,a.y+775]],[[cx-125,a.y+365],[cx+125,a.y+365],[cx,a.y+435]],[[cx,a.y+125]]];
    rows.forEach((positions,wave)=>{d.waves[wave]=positions.map(([x,y])=>{const index=SPAWNS.length;SPAWNS.push([d.types[wave],x,y]);return index;});});
    OBSTACLES.push({x:a.x,y:a.y,w:a.w,h:22,type:'dungeonwall'},{x:a.x,y:a.y+a.h-22,w:a.w,h:22,type:'dungeonwall'},{x:a.x,y:a.y,w:22,h:a.h,type:'dungeonwall'},{x:a.x+a.w-22,y:a.y,w:22,h:a.h,type:'dungeonwall'});
    for(const g of d.gates)OBSTACLES.push({x:a.x+22,y:g.y,w:g.x-a.x-22,h:20,type:'dungeonwall'},{x:g.x+g.w,y:g.y,w:a.x+a.w-22-g.x-g.w,h:20,type:'dungeonwall'});
  }
  const CITY_CONTRACTS={north:{name:'Північний дозор',level:80,targets:{city_wraith:6},silver:9000,xp:22000},ember:{name:'Загроза півдня',level:120,targets:{city_salamander:6},silver:24000,xp:65000},titan:{name:'Варта перевалу',level:80,targets:{pass_guardian:1},silver:16000,xp:40000}};

  const CITY_HOUSES=CITY_LAYOUT.map(([owner,x,y])=>({owner,x,y,w:150,h:115,type:'house',name:TRADERS[owner].name,color:TRADERS[owner].color}));OBSTACLES.push(...CITY_HOUSES);
  for(let tier=9;tier<=MAX_TIER;tier++){WEAPONS.push({name:'Клинок міста · '+tier,cost:Math.round(17000*1.75**(tier-8))});ARMOR.push({name:'Обладунок міста · '+tier,cost:Math.round(16000*1.75**(tier-8))});}
  for(const [id,t] of Object.entries(TALENTS))if(['vitality','guard','power','fortitude','armourTraining','precision','evasion','quickstep','windrunner','weaponFlow','focusMastery','endurance','recovery','balanced'].includes(id))t.max=20;
  TALENTS.guard.description='+0.6% захисту за ранг.';TALENTS.armourTraining.description='+0.8% захисту за ранг.';TALENTS.balanced.description='+1% шкоди та +0.3% захисту за ранг.';
  const townTraders=s=>inCity(s.x,s.y)?Object.fromEntries(CITY_LAYOUT.map(([id,x,y])=>[id,{...TRADERS[id],x:x+75,y:y+155}])):TRADERS;
  return {DUNGEONS,CITY_CONTRACTS,CITY_LANDMARKS,CITY_WALLS,townTraders,MAX_TIER,MAX_ENCHANT,MAX_MASTERY,MAX_SPECIALIZATION,STACK_SIZE,CITY,CITY_HOUSES,PASS,MONOLITH,inCity,REGIONS,SPAWN_GROUPS,MOUNTS,APPEARANCE,SKILL_CHOICES,BOSS_SKILLS,BILLBOARD,ZONES,VILLAGE,inVillage,HOUSES,WALLS,GUARDS,TRADERS,traderStock,WIDTH,HEIGHT,CAMP,SPAWN,TYPES,SPAWNS,OBSTACLES,WEAPONS,ARMOR,FAMILIES,ARMOR_KINDS,SUPPORTS,EXTRAS,RESOURCES,NODE_TYPES,NODES,TOOLS,RECIPES,TALENTS,CONTRACTS,VARIANTS,DEFAULT_VARIANTS,OUTFITS};
});
