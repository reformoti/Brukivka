(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BrukRealmsData=factory();})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const WIDTH=3200,HEIGHT=2200,CAMP={x:385,y:440},SPAWN={x:350,y:500};
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
  const OBSTACLES=[{x:175,y:190,w:160,h:130,type:'house'},{x:435,y:190,w:145,h:120,type:'house'},{x:160,y:570,w:150,h:105,type:'house'},{x:425,y:615,w:155,h:105,type:'house'},{x:1380,y:170,w:290,h:205,type:'water'},{x:1000,y:930,w:180,h:170,type:'water'},{x:1940,y:260,w:100,h:65,type:'rock'},{x:1700,y:735,w:105,h:75,type:'rock'},{x:2230,y:1160,w:90,h:70,type:'rock'},{x:2100,y:1380,w:230,h:170,type:'water'},{x:2780,y:270,w:130,h:85,type:'rock'},{x:2590,y:1950,w:120,h:75,type:'rock'}];
  const WEAPONS=[{name:'Дорожній меч',cost:0},{name:'Залізний клинок',cost:160},{name:'Клинок мандрівника',cost:400},{name:'Срібний палаш',cost:850},{name:'Меч вартового',cost:1600},{name:'Клинок світанку',cost:2900}];
  const ARMOR=[{name:'Дорожній одяг',cost:0},{name:'Шкіряний жилет',cost:140},{name:'Кольчуга',cost:360},{name:'Ламелярний обладунок',cost:800},{name:'Панцир вартового',cost:1500},{name:'Обладунок світанку',cost:2700}];
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
  return {WIDTH,HEIGHT,CAMP,SPAWN,TYPES,SPAWNS,OBSTACLES,WEAPONS,ARMOR,FAMILIES,ARMOR_KINDS,SUPPORTS,EXTRAS,RESOURCES,NODE_TYPES,NODES,TOOLS,RECIPES,TALENTS,CONTRACTS,VARIANTS,DEFAULT_VARIANTS,OUTFITS};
});
