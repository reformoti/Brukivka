(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const money = (value) => Math.round(Number(value) || 0).toLocaleString('uk-UA');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = (array) => array[Math.floor(Math.random() * array.length)];

  function shuffle(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // 2026 NMT conversion tables (test score -> 100–200 scale).
  const SCALES = {
    math: {
      5:100,6:108,7:115,8:123,9:131,10:134,11:137,12:140,13:143,14:145,15:147,16:148,
      17:149,18:150,19:151,20:152,21:155,22:159,23:163,24:167,25:170,26:173,27:176,28:180,
      29:184,30:189,31:194,32:200
    },
    english: {
      5:100,6:109,7:118,8:125,9:131,10:134,11:137,12:140,13:143,14:145,15:147,16:148,
      17:149,18:150,19:151,20:152,21:153,22:155,23:157,24:159,25:162,26:166,27:169,28:173,
      29:179,30:185,31:191,32:200
    },
    ukrainian: {
      8:100,9:105,10:110,11:120,12:125,13:130,14:134,15:136,16:138,17:140,18:142,19:143,
      20:144,21:145,22:146,23:148,24:149,25:150,26:152,27:154,28:156,29:157,30:159,31:160,
      32:162,33:163,34:165,35:167,36:170,37:172,38:175,39:177,40:180,41:183,42:186,43:191,
      44:195,45:200
    },
    history: {
      9:100,10:105,11:110,12:115,13:120,14:125,15:130,16:132,17:134,18:136,19:138,20:140,
      21:141,22:142,23:143,24:144,25:145,26:146,27:147,28:148,29:149,30:150,31:151,32:152,
      33:154,34:156,35:158,36:160,37:163,38:166,39:168,40:169,41:170,42:172,43:173,44:175,
      45:177,46:179,47:181,48:183,49:185,50:188,51:191,52:194,53:197,54:200
    }
  };

  const SUBJECTS = {
    math: { name:'Математика', short:'∑', max:32, subtitle:'32 тестові бали' },
    english: { name:'Англійська мова', short:'A', max:32, subtitle:'32 тестові бали' },
    ukrainian: { name:'Українська мова', short:'У', max:45, subtitle:'45 тестових балів' },
    history: { name:'Історія України', short:'І', max:54, subtitle:'54 тестові бали' }
  };

  const brickTiers = [
    {name:'Звичайна', reward:100, cost:400, c1:'#9aa0aa', c2:'#555c68'},
    {name:'Кам’яна', reward:145, cost:900, c1:'#8d929a', c2:'#494e57'},
    {name:'Гранітна', reward:205, cost:1700, c1:'#777f8b', c2:'#3e444e'},
    {name:'Мармурова', reward:285, cost:2900, c1:'#d7d5d1', c2:'#858994'},
    {name:'Сталева', reward:390, cost:4600, c1:'#9eaebd', c2:'#455461'},
    {name:'Титанова', reward:530, cost:7000, c1:'#8ba0b1', c2:'#354653'},
    {name:'Срібна', reward:700, cost:10500, c1:'#d9e0e7', c2:'#77828c'},
    {name:'Золота', reward:920, cost:15500, c1:'#e5c969', c2:'#846b22'},
    {name:'Платинова', reward:1200, cost:22500, c1:'#dce4e8', c2:'#6f7a80'},
    {name:'Сапфірова', reward:1550, cost:32000, c1:'#4a7fff', c2:'#173372'},
    {name:'Смарагдова', reward:2000, cost:45000, c1:'#46df9a', c2:'#116043'},
    {name:'Рубінова', reward:2550, cost:62000, c1:'#ff5b70', c2:'#781629'},
    {name:'Обсидіанова', reward:3250, cost:85000, c1:'#4e4b5f', c2:'#14121a'},
    {name:'Алмазна', reward:4100, cost:115000, c1:'#b9f4ff', c2:'#55a6bd'},
    {name:'Діамантова', reward:5150, cost:155000, c1:'#effcff', c2:'#7bb7cc'},
    {name:'Легендарна', reward:6500, cost:0, c1:'#c388ff', c2:'#4c1e7c'}
  ];

  const phoneTiers = [
    {name:'iPhone 3G', cost:650}, {name:'iPhone 3GS', cost:1100}, {name:'iPhone 4', cost:1800},
    {name:'iPhone 5', cost:2800}, {name:'iPhone 6', cost:4300}, {name:'iPhone 7', cost:6500},
    {name:'iPhone 8', cost:9000}, {name:'iPhone X', cost:13000}, {name:'iPhone 11', cost:18000},
    {name:'iPhone 12', cost:25000}, {name:'iPhone 13', cost:34000}, {name:'iPhone 14', cost:45000},
    {name:'iPhone 15', cost:59000}, {name:'iPhone 16', cost:76000}, {name:'iPhone 17', cost:98000},
    {name:'iPhone 18', cost:0}
  ];

  const strengthTiers = [
    {carry:1, cost:1300}, {carry:2, cost:3600}, {carry:3, cost:8500},
    {carry:4, cost:18000}, {carry:5, cost:36000}, {carry:6, cost:0}
  ];

  const taunts = ['КУДА?!', 'БАЦ ФАНЕРА', 'БРУКІВКУ НЕ КРАСТЬ'];

  const SAVE_KEY = 'brukivka_kos_v4';
  const OLD_KEYS = ['brukivka_kos_fixed_v1', 'brukivkaPrototypeSave_v3', 'brukivkaPrototypeSave_v2', 'brukivkaPrototypeSave_v1'];

  function defaults() {
    return {
      balance:0,
      brickTier:0,
      phoneTier:0,
      strength:0,
      tests:{ math:0, english:0, ukrainian:0, history:0 },
      attempted:{ math:false, english:false, ukrainian:false, history:false },
      legit:{ score:0, streak:0, best:0 },
      order:null,
      inventory:[],
      market:null,
      marketSerial:1
    };
  }

  function loadSave() {
    try {
      let raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        for (const key of OLD_KEYS) {
          raw = localStorage.getItem(key);
          if (raw) break;
        }
      }
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      const base = defaults();
      const merged = Object.assign(base, parsed);
      merged.tests = Object.assign({}, base.tests, parsed.tests || {});
      merged.attempted = Object.assign({}, base.attempted, parsed.attempted || {});
      merged.legit = Object.assign({}, base.legit, parsed.legit || {});
      for (const subject of Object.keys(merged.tests)) {
        if (merged.tests[subject] > 0 && parsed.attempted == null) merged.attempted[subject] = true;
      }
      if (!Array.isArray(merged.inventory)) merged.inventory = [];
      return merged;
    } catch (error) {
      return defaults();
    }
  }

  let save = loadSave();
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (error) {}
  }

  function nmtScore(subject, raw) {
    return SCALES[subject][Number(raw)] || 0;
  }

  function averageNmt() {
    const scores = Object.keys(SUBJECTS)
      .filter((key) => save.attempted[key])
      .map((key) => nmtScore(key, save.tests[key]))
      .filter((score) => score >= 100);
    if (!scores.length) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  function nmtMultiplier(avg = averageNmt()) {
    if (avg < 100) return 1;
    if (avg >= 200) return 11;
    return 1 + Math.floor((avg - 100) / 10) * 0.5;
  }

  function brickTier() { return brickTiers[clamp(save.brickTier, 0, 15)]; }
  function phoneTier() { return phoneTiers[clamp(save.phoneTier, 0, 15)]; }
  function strengthTier() { return strengthTiers[clamp(save.strength, 0, 5)]; }
  function finalReward() { return Math.round(brickTier().reward * strengthTier().carry * nmtMultiplier()); }
  function displayNmt(score) { return score >= 100 ? String(score) : '—'; }

  function setBalanceClass(element) {
    if (!element) return;
    element.classList.toggle('positive', save.balance >= 0);
    element.classList.toggle('negative', save.balance < 0);
  }

  function setupUpgradeButton(button, level, max, tier, label) {
    if (level >= max) {
      button.disabled = true;
      button.textContent = 'Максимум';
      return;
    }
    button.disabled = save.balance < tier.cost;
    button.textContent = `${label} — ${money(tier.cost)} UAH`;
  }

  function inventoryEstimatedValue() {
    return save.inventory.reduce((sum, item) => sum + (item.resale || 0), 0);
  }

  function updateUI() {
    const brick = brickTier();
    const phone = phoneTier();
    const strength = strengthTier();
    const avg = averageNmt();
    const multiplier = nmtMultiplier(avg);

    $('brickBoardName').textContent = `${brick.name} Бруківка`;
    $('brickCountBadge').textContent = `×${strength.carry}`;
    $('brukivka').style.background = `linear-gradient(145deg,${brick.c1},${brick.c2})`;

    $('homePhoneModel').textContent = phone.name;
    $('homeAverageNmt').textContent = displayNmt(avg);
    $('homeSummary').textContent = `Середній NMT · бонус ×${multiplier.toFixed(1)}`;

    $('bankBalance').textContent = money(save.balance);
    setBalanceClass($('bankBalanceCard'));
    $('bankBrickName').textContent = brick.name;
    $('brickTierText').textContent = save.brickTier;
    $('brickBaseReward').textContent = money(brick.reward);
    $('nextBrickName').textContent = save.brickTier < 15 ? brickTiers[save.brickTier + 1].name : 'МАКСИМУМ';
    $('bankPhoneName').textContent = phone.name;
    $('phoneTierText').textContent = save.phoneTier;
    $('nextPhoneName').textContent = save.phoneTier < 15 ? phoneTiers[save.phoneTier + 1].name : 'МАКСИМУМ';
    $('strengthTierText').textContent = save.strength;
    $('carryCountBank').textContent = strength.carry;

    setupUpgradeButton($('brickUpgradeButton'), save.brickTier, 15, brick, 'Прокачати Бруківку');
    setupUpgradeButton($('phoneUpgradeButton'), save.phoneTier, 15, phone, 'Прокачати телефон');
    setupUpgradeButton($('strengthUpgradeButton'), save.strength, 5, strength, 'Прокачати силу');

    $('infoBrickName').textContent = `${brick.name} Бруківка`;
    $('infoBrickTier').textContent = save.brickTier;
    $('infoBalance').textContent = `${money(save.balance)} UAH`;
    $('infoBalance').style.color = save.balance < 0 ? '#ff6175' : '#39dc7d';
    $('infoCarry').textContent = `×${strength.carry}`;
    $('infoAverage').textContent = displayNmt(avg);
    $('infoMultiplier').textContent = `×${multiplier.toFixed(1)}`;
    $('infoBaseReward').textContent = `${money(brick.reward)} UAH`;
    $('infoCarryCount').textContent = String(strength.carry);
    $('infoNmtBonus').textContent = `×${multiplier.toFixed(1)}`;
    $('infoFinalReward').textContent = `${money(finalReward())} UAH`;
    $('infoPhoneModel').textContent = phone.name;
    $('infoInventoryCount').textContent = String(save.inventory.length);
    $('infoInventoryValue').textContent = `${money(inventoryEstimatedValue())} UAH`;

    ensureOrder();
    const order = save.order;
    if (!order) {
      $('infoOrderProgress').textContent = 'Немає';
      $('infoOrderReward').textContent = '—';
    } else if (order.completed) {
      $('infoOrderProgress').textContent = 'Виконано';
      $('infoOrderReward').textContent = `${money(order.reward)} UAH`;
    } else if (order.active) {
      $('infoOrderProgress').textContent = `${Math.min(order.progress, order.target)}/${order.target} шт.`;
      $('infoOrderReward').textContent = `${money(order.reward)} UAH`;
    } else {
      $('infoOrderProgress').textContent = `Запит: ${order.target} шт.`;
      $('infoOrderReward').textContent = `${money(order.reward)} UAH`;
    }

    $('znoAverageScore').textContent = displayNmt(avg);
    $('znoBonusText').textContent = `Бонус Бруківки ×${multiplier.toFixed(1)}`;
    $('znoProgressBar').style.width = avg >= 100 ? `${clamp(avg - 100, 0, 100)}%` : '0%';

    $('legitScore').textContent = save.legit.score;
    $('legitStreak').textContent = save.legit.streak;
    $('legitBest').textContent = save.legit.best;

    renderSubjects();
    renderInventory();
    renderOrderPreview();
  }

  function buyUpgrade(type) {
    let levelKey, max, tiers, hintId, successText;
    if (type === 'brick') {
      levelKey = 'brickTier'; max = 15; tiers = brickTiers; hintId = 'brickUpgradeHint'; successText = 'Бруківку прокачано.';
    } else if (type === 'phone') {
      levelKey = 'phoneTier'; max = 15; tiers = phoneTiers; hintId = 'phoneUpgradeHint'; successText = 'Телефон Коса оновлено.';
    } else {
      levelKey = 'strength'; max = 5; tiers = strengthTiers; hintId = 'strengthUpgradeHint'; successText = 'Сила Коса зросла.';
    }
    const level = save[levelKey];
    if (level >= max) return;
    const cost = tiers[level].cost;
    if (save.balance < cost) {
      $(hintId).textContent = 'Кос, не вистачає UAH.';
      return;
    }
    save.balance -= cost;
    save[levelKey] += 1;
    persist();
    updateUI();
    $(hintId).textContent = successText;
  }

  $('brickUpgradeButton').addEventListener('click', () => buyUpgrade('brick'));
  $('phoneUpgradeButton').addEventListener('click', () => buyUpgrade('phone'));
  $('strengthUpgradeButton').addEventListener('click', () => buyUpgrade('strength'));

  // Phone navigation.
  const screenIds = [
    'phoneHome','bankScreen','brukivkaScreen','znoScreen','quizScreen','quizResultScreen',
    'legitScreen','telegramScreen','reformotiChatScreen'
  ];
  function showScreen(id) {
    screenIds.forEach((screenId) => $(screenId).classList.add('hidden'));
    $(id).classList.remove('hidden');
    updateUI();
    if (id === 'telegramScreen') renderTelegram();
    if (id === 'reformotiChatScreen') renderReformotiChat();
  }

  function openPhone() {
    $('phoneOverlay').classList.remove('hidden');
    $('phoneTime').textContent = new Date().toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'});
    showScreen('phoneHome');
  }

  $('phoneButton').addEventListener('click', openPhone);
  $('closePhone').addEventListener('click', () => $('phoneOverlay').classList.add('hidden'));
  $('phoneHomeButton').addEventListener('click', () => showScreen('phoneHome'));
  $$('[data-home]').forEach((button) => button.addEventListener('click', () => showScreen('phoneHome')));
  $('bankApp').addEventListener('click', () => showScreen('bankScreen'));
  $('brukivkaApp').addEventListener('click', () => showScreen('brukivkaScreen'));
  $('znoApp').addEventListener('click', () => showScreen('znoScreen'));
  $('legitApp').addEventListener('click', () => { showScreen('legitScreen'); startLegitRound(); });
  $('telegramApp').addEventListener('click', () => showScreen('telegramScreen'));
  $('resultBack').addEventListener('click', () => showScreen('znoScreen'));
  $('resultHome').addEventListener('click', () => showScreen('znoScreen'));

  // Main game / drag system.
  const board = $('gameBoard');
  const brickElement = $('brukivka');
  const pocket = $('pocket');
  const lasers = $$('.laser');
  let dragging = false;
  let activePointer = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let resetting = false;
  let startPosition = {x:0,y:0};

  function rememberStart() {
    const boardRect = board.getBoundingClientRect();
    const brickRect = brickElement.getBoundingClientRect();
    startPosition = {x:brickRect.left - boardRect.left, y:brickRect.top - boardRect.top};
  }

  function placeBrick(x, y) {
    const boardRect = board.getBoundingClientRect();
    const brickRect = brickElement.getBoundingClientRect();
    brickElement.style.left = `${clamp(x, 0, boardRect.width - brickRect.width)}px`;
    brickElement.style.top = `${clamp(y, 0, boardRect.height - brickRect.height)}px`;
  }

  function resetBrick() { placeBrick(startPosition.x, startPosition.y); }

  function rectsOverlap(a, b, padding = 0) {
    return !(a.right - padding <= b.left + padding || a.left + padding >= b.right - padding || a.bottom - padding <= b.top + padding || a.top + padding >= b.bottom - padding);
  }

  function randomizeLasers() {
    const mobile = window.innerWidth <= 760;
    const configs = mobile ? [
      {v:false,l:[9,24],t:[27,34],s:[8,13]},
      {v:true,l:[34,46],t:[37,48],s:[8,12]},
      {v:false,l:[48,64],t:[57,65],s:[9,14]},
      {v:true,l:[70,80],t:[65,73],s:[7,11]}
    ] : [
      {v:false,l:[21,31],t:[18,29],s:[9,14]},
      {v:true,l:[41,49],t:[35,46],s:[9,14]},
      {v:false,l:[55,64],t:[57,67],s:[9,14]},
      {v:true,l:[71,79],t:[23,36],s:[9,14]}
    ];

    lasers.forEach((laser, index) => {
      const cfg = configs[index];
      laser.classList.toggle('v', cfg.v);
      laser.style.left = `${rand(cfg.l[0], cfg.l[1])}%`;
      laser.style.top = `${rand(cfg.t[0], cfg.t[1])}%`;
      if (cfg.v) {
        laser.style.width = mobile ? '3px' : '4px';
        laser.style.height = `${rand(cfg.s[0], cfg.s[1])}%`;
      } else {
        laser.style.height = mobile ? '3px' : '4px';
        laser.style.width = `${rand(cfg.s[0], cfg.s[1])}%`;
      }
    });
  }

  function setStatus(text, type = '') {
    $('statusMessage').textContent = text;
    $('statusMessage').className = `status-message${type ? ` ${type}` : ''}`;
  }

  function stopDrag() {
    dragging = false;
    activePointer = null;
    brickElement.classList.remove('dragging');
  }

  function showTaunt() {
    $('taunt').innerHTML = `${pick(taunts)}<small>−500 UAH · КОС</small>`;
    $('taunt').classList.remove('hidden');
    setTimeout(() => $('taunt').classList.add('hidden'), 800);
  }

  function laserHit() {
    if (resetting) return;
    resetting = true;
    stopDrag();
    save.balance -= 500;
    persist();
    updateUI();
    showTaunt();
    setStatus('Лазер! −500 UAH. Лазери змінили позицію.', 'bad');
    randomizeLasers();
    setTimeout(() => { resetBrick(); resetting = false; }, 280);
  }

  function applyOrderDelivery(count) {
    ensureOrder();
    if (!save.order || !save.order.active || save.order.completed) return null;
    save.order.progress += count;
    if (save.order.progress >= save.order.target) {
      save.order.progress = save.order.target;
      save.order.completed = true;
      save.order.active = false;
      save.balance += save.order.reward;
      return save.order.reward;
    }
    return 0;
  }

  function delivered() {
    if (resetting) return;
    resetting = true;
    stopDrag();
    const reward = finalReward();
    save.balance += reward;
    const orderBonus = applyOrderDelivery(strengthTier().carry);
    persist();
    updateUI();
    if (orderBonus) {
      setStatus(`Карман Коса: +${money(reward)} UAH · поставка reformoti виконана +${money(orderBonus)} UAH`, 'good');
    } else {
      setStatus(`Карман Коса: +${money(reward)} UAH`, 'good');
    }
    randomizeLasers();
    setTimeout(() => { resetBrick(); setStatus('Кос, новий маршрут готовий →'); resetting = false; }, 380);
  }

  function checkGameCollision() {
    const brickRect = brickElement.getBoundingClientRect();
    for (const laser of lasers) {
      if (rectsOverlap(brickRect, laser.getBoundingClientRect(), 2)) {
        laserHit();
        return;
      }
    }
    if (rectsOverlap(brickRect, pocket.getBoundingClientRect(), 9)) delivered();
  }

  function pointerDown(event) {
    if (resetting) return;
    const rect = brickElement.getBoundingClientRect();
    dragging = true;
    activePointer = event.pointerId == null ? 'mouse' : event.pointerId;
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    brickElement.classList.add('dragging');
    if (brickElement.setPointerCapture && event.pointerId != null) {
      try { brickElement.setPointerCapture(event.pointerId); } catch (error) {}
    }
    event.preventDefault();
  }

  function pointerMove(event) {
    if (!dragging || resetting) return;
    if (event.pointerId != null && activePointer !== event.pointerId) return;
    const boardRect = board.getBoundingClientRect();
    placeBrick(event.clientX - boardRect.left - dragOffsetX, event.clientY - boardRect.top - dragOffsetY);
    checkGameCollision();
    event.preventDefault();
  }

  function pointerUp(event) {
    if (!dragging) return;
    if (event.pointerId != null && activePointer !== event.pointerId) return;
    stopDrag();
  }

  if (window.PointerEvent) {
    brickElement.addEventListener('pointerdown', pointerDown);
    document.addEventListener('pointermove', pointerMove, {passive:false});
    document.addEventListener('pointerup', pointerUp);
    document.addEventListener('pointercancel', pointerUp);
  } else {
    brickElement.addEventListener('mousedown', pointerDown);
    document.addEventListener('mousemove', pointerMove);
    document.addEventListener('mouseup', pointerUp);
    brickElement.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      pointerDown({clientX:touch.clientX, clientY:touch.clientY, pointerId:'touch', preventDefault:() => event.preventDefault()});
    }, {passive:false});
    document.addEventListener('touchmove', (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      pointerMove({clientX:touch.clientX, clientY:touch.clientY, pointerId:'touch', preventDefault:() => event.preventDefault()});
    }, {passive:false});
    document.addEventListener('touchend', stopDrag);
  }

  // NMT practice questions. These are original game questions, not copied from an official NMT form.
  const englishPool = [
    ['Choose the correct form: She ___ to school every day.', ['go','goes','going','gone'], 1],
    ['Choose the correct word: I have lived here ___ 2022.', ['for','since','from','at'], 1],
    ['Choose the correct sentence.', ['He don’t like tea.','He doesn’t like tea.','He not likes tea.','He doesn’t likes tea.'], 1],
    ['Complete: If it rains, we ___ at home.', ['stay','will stay','stayed','stays'], 1],
    ['Choose the opposite of “cheap”.', ['small','expensive','slow','easy'], 1],
    ['Complete: There ___ two books on the desk.', ['is','are','be','am'], 1],
    ['Choose the past form of “buy”.', ['buyed','bought','brought','buy'], 1],
    ['Complete: My sister is ___ than me.', ['tall','taller','tallest','more tall'], 1],
    ['Choose the correct preposition: interested ___ music.', ['on','at','in','for'], 2],
    ['Complete: We ___ dinner when he called.', ['have','were having','had','are having'], 1],
    ['Choose the correct article: ___ apple a day.', ['A','An','The','—'], 1],
    ['Complete: I ___ never seen this film.', ['have','has','am','did'], 0],
    ['Choose the synonym of “quick”.', ['fast','weak','late','quiet'], 0],
    ['Complete: You ___ wear a seat belt.', ['should','should to','are should','shoulds'], 0],
    ['Choose the correct plural: one child — two ___.', ['childs','childes','children','childrens'], 2],
    ['Complete: This bag belongs ___ Anna.', ['for','with','to','on'], 2],
    ['Choose the correct option: I’m looking forward to ___ you.', ['see','seeing','saw','seen'], 1],
    ['Complete: By 8 p.m. we ___ the work.', ['finish','will have finished','finished','are finish'], 1],
    ['Choose the correct question.', ['Where you live?','Where do you live?','Where does you live?','Where live you?'], 1],
    ['Complete: There isn’t ___ milk left.', ['many','much','few','several'], 1],
    ['Choose the noun: “decision” comes from ___.', ['decide','decidingly','decisive','decided'], 0],
    ['Complete: The window ___ yesterday.', ['broke','was broken','is break','has broke'], 1],
    ['Choose the correct word: He speaks English very ___.', ['good','well','betterly','best'], 1],
    ['Complete: Neither Tom nor Kate ___ here.', ['are','is','be','were'], 1]
  ];

  const ukrainianPool = [
    ['У якому слові треба писати апостроф?', ['буряк','піря','свято','цвях'], 1],
    ['У якому слові пишемо м’який знак?', ['кін..ський','мен..ший','різ..бяр','тон..ший'], 2],
    ['Оберіть правильний варіант.', ['будь ласка','будь-ласка','будьласка','будь  ласка'], 0],
    ['У якому слові подвоєння букв?', ['житя','знання','питаня','колося'], 1],
    ['Яке слово є прикметником?', ['сміливість','сміливо','сміливий','сміливіти'], 2],
    ['Яке слово є займенником?', ['цей','третій','біля','дуже'], 0],
    ['Укажіть дієслово.', ['читання','читати','читач','прочитаний'], 1],
    ['Де правильний наголос?', ['катАлог','каталОг','кАталог','каталоГ'], 1],
    ['Який рядок містить лише іменники?', ['книга, школа, ранок','білий, день, сонце','читати, книга, звук','тихо, ранок, поле'], 0],
    ['Оберіть правильне написання.', ['пів яблука','пів-яблука','півяблука','пів  яблука'], 0],
    ['У якому реченні є звертання?', ['Марко читає книгу.','Марку, підійди сюди.','Я бачу Марка.','Книга Марка нова.'], 1],
    ['Яке слово є прислівником?', ['швидкий','швидкість','швидко','швидшати'], 2],
    ['Укажіть сполучник.', ['але','біля','дуже','через'], 0],
    ['Укажіть прийменник.', ['щоб','під','ніби','також'], 1],
    ['Оберіть правильну форму.', ['найбільш кращий','кращий','самий кращий','більш кращий'], 1],
    ['У якому слові префікс з-?', ['сказати','зробити','шити','жити'], 1],
    ['Визначте підмет: «Учні виконали завдання».', ['виконали','завдання','учні','виконали завдання'], 2],
    ['Визначте присудок: «Сонце яскраво світить».', ['сонце','яскраво','світить','яскраво світить'], 2],
    ['Оберіть правильний кличний відмінок імені Олег.', ['Олег','Олегу','Олеже','Олегом'], 2],
    ['У якому слові пишемо «и»?', ['пр..рода','кр..ниця','л..мон','д..ректор'], 1],
    ['Яке речення складне?', ['Небо ясне.','Сонце зійшло, і птахи заспівали.','Діти читають.','Тиха ніч.'], 1],
    ['Укажіть синонім до слова «гарний».', ['красивий','поганий','високий','далекий'], 0],
    ['Укажіть антонім до слова «сміливий».', ['хоробрий','відважний','боязкий','сильний'], 2],
    ['Оберіть правильне написання частки.', ['хтось','хто сь','хто-сь','хто  сь'], 0],
    ['У якому слові немає закінчення?', ['метро','книга','учень','вікно'], 0],
    ['Укажіть числівник.', ['троє','трійка','третій разом','потрійний'], 0],
    ['Яке слово утворено префіксальним способом?', ['лісник','підписати','дощовий','віконце'], 1],
    ['Де кома потрібна перед «але»?', ['Я прийшов але пізно.','Я прийшов, але пізно.','Я, прийшов але пізно.','Я прийшов але, пізно.'], 1]
  ];

  const historyPool = [
    ['Яке місто було центром Київської Русі?', ['Львів','Київ','Одеса','Харків'], 1],
    ['Хто охрестив Русь у 988 році?', ['Ярослав Мудрий','Володимир Великий','Данило Галицький','Богдан Хмельницький'], 1],
    ['Хто уклав першу відому збірку законів «Руська правда»?', ['Ярослав Мудрий','Іван Мазепа','Петро Сагайдачний','Володимир Мономах'], 0],
    ['Яка держава постала на західноукраїнських землях у XIII ст.?', ['Галицько-Волинська держава','УНР','ЗУНР','Гетьманщина'], 0],
    ['Хто був королем Русі?', ['Данило Романович','Іван Виговський','Павло Скоропадський','Симон Петлюра'], 0],
    ['Запорозька Січ пов’язана насамперед із...', ['козацтвом','чумацтвом','друкарством','промисловістю'], 0],
    ['Національно-визвольна війна під проводом Б. Хмельницького почалася...', ['1648','1569','1709','1775'], 0],
    ['Переяславська рада відбулася...', ['1654','1710','1918','1939'], 0],
    ['Конституція Пилипа Орлика була укладена...', ['1710','1648','1848','1917'], 0],
    ['Полтавська битва відбулася...', ['1709','1654','1764','1812'], 0],
    ['Хто був гетьманом під час Полтавської битви?', ['Іван Мазепа','Богдан Хмельницький','Петро Дорошенко','Кирило Розумовський'], 0],
    ['Коли було ліквідовано Запорозьку Січ?', ['1775','1709','1812','1861'], 0],
    ['«Енеїда» Івана Котляревського вийшла друком наприкінці...', ['XVIII ст.','XVI ст.','XV ст.','XX ст.'], 0],
    ['Кирило-Мефодіївське братство діяло в...', ['1840-х роках','1640-х роках','1740-х роках','1940-х роках'], 0],
    ['Хто написав «Кобзар»?', ['Тарас Шевченко','Іван Франко','Леся Українка','Михайло Грушевський'], 0],
    ['Скасування кріпацтва в Російській імперії відбулося...', ['1861','1848','1905','1917'], 0],
    ['Перша світова війна почалася...', ['1914','1917','1918','1939'], 0],
    ['Українська Центральна Рада була створена...', ['1917','1905','1914','1921'], 0],
    ['Головою Української Центральної Ради був...', ['Михайло Грушевський','Павло Скоропадський','Євген Петрушевич','Нестор Махно'], 0],
    ['IV Універсал Центральної Ради проголосив...', ['незалежність УНР','утворення СРСР','скасування УНР','створення ЗУНР'], 0],
    ['Акт Злуки УНР і ЗУНР проголошено...', ['22 січня 1919','24 серпня 1991','1 грудня 1991','29 січня 1918'], 0],
    ['Бій під Крутами відбувся...', ['1918','1917','1919','1921'], 0],
    ['Голодомор в Україні найбільше пов’язаний з роками...', ['1932–1933','1921–1922','1946–1947','1918–1919'], 0],
    ['Друга світова війна почалася...', ['1939','1941','1938','1945'], 0],
    ['Нацистська Німеччина напала на СРСР...', ['22 червня 1941','1 вересня 1939','9 травня 1945','24 серпня 1941'], 0],
    ['Українська повстанська армія була створена у роки...', ['Другої світової війни','Першої світової війни','Української революції 1917–1921','Холодної війни після 1991'], 0],
    ['Організація Об’єднаних Націй була створена...', ['1945','1939','1954','1991'], 0],
    ['Аварія на Чорнобильській АЕС сталася...', ['1986','1979','1991','2004'], 0],
    ['Декларацію про державний суверенітет України ухвалено...', ['1990','1986','1991','1996'], 0],
    ['Акт проголошення незалежності України ухвалено...', ['24 серпня 1991','1 грудня 1991','28 червня 1996','16 липня 1990'], 0],
    ['Всеукраїнський референдум на підтвердження незалежності відбувся...', ['1 грудня 1991','24 серпня 1991','28 червня 1996','22 січня 1919'], 0],
    ['Конституцію України ухвалено...', ['1996','1991','2004','2014'], 0],
    ['Помаранчева революція відбулася...', ['2004','1991','2010','2014'], 0],
    ['Революція Гідності відбулася...', ['2013–2014','2004–2005','1990–1991','2019–2020'], 0],
    ['Який документ є Основним Законом України?', ['Конституція України','Декларація ООН','Літопис Руський','Універсал'], 0],
    ['Хто є автором «Історії України-Руси»?', ['Михайло Грушевський','Тарас Шевченко','Іван Котляревський','Пантелеймон Куліш'], 0]
  ];

  function mathQuestion() {
    const type = randInt(0, 6);
    if (type === 0) {
      const a = randInt(7, 60), b = randInt(3, 40), correct = a + b;
      return [`Обчисліть: ${a} + ${b}`, shuffleOptions(correct, [correct+1, correct-2, correct+5])];
    }
    if (type === 1) {
      const a = randInt(6, 16), b = randInt(2, 9), correct = a * b;
      return [`Обчисліть: ${a} · ${b}`, shuffleOptions(correct, [correct+b, correct-a, correct+10])];
    }
    if (type === 2) {
      const x = randInt(2, 15), a = randInt(2, 8), b = randInt(1, 20), rhs = a*x+b;
      return [`Розв’яжіть рівняння: ${a}x + ${b} = ${rhs}`, shuffleOptions(x, [x+1, x-1, x+3])];
    }
    if (type === 3) {
      const base = randInt(2, 12) * 10, percent = pick([10,20,25,50]), correct = base * percent / 100;
      return [`Знайдіть ${percent}% від ${base}.`, shuffleOptions(correct, [correct+5, base-percent, correct*2])];
    }
    if (type === 4) {
      const w = randInt(3, 12), h = randInt(3, 12), correct = w*h;
      return [`Площа прямокутника зі сторонами ${w} і ${h} дорівнює...`, shuffleOptions(correct, [2*(w+h), w+h, correct+w])];
    }
    if (type === 5) {
      const a = randInt(3, 12), correct = a*a;
      return [`Чому дорівнює ${a}²?`, shuffleOptions(correct, [a*2, correct+a, correct-1])];
    }
    const a = randInt(2, 10), b = randInt(2, 10), correct = (a+b)/2;
    return [`Середнє арифметичне чисел ${a} і ${b} дорівнює...`, shuffleOptions(correct, [a+b, Math.abs(a-b), correct+2])];
  }

  function shuffleOptions(correct, wrong) {
    const values = [...new Set([correct, ...wrong])];
    while (values.length < 4) values.push(values[values.length - 1] + 1);
    const answerStrings = values.slice(0,4).map(String);
    const shuffled = shuffle(answerStrings);
    return [shuffled, shuffled.indexOf(String(correct))];
  }

  function buildPoolQuestions(pool, total) {
    const result = [];
    while (result.length < total) {
      const cycle = shuffle(pool);
      for (const item of cycle) {
        result.push({text:item[0], answers:item[1], correct:item[2]});
        if (result.length >= total) break;
      }
    }
    return result;
  }

  function buildQuizQuestions(subject) {
    const total = SUBJECTS[subject].max;
    if (subject === 'math') {
      const result = [];
      for (let i = 0; i < total; i++) {
        const generated = mathQuestion();
        result.push({text:generated[0], answers:generated[1][0], correct:generated[1][1]});
      }
      return result;
    }
    if (subject === 'english') return buildPoolQuestions(englishPool, total);
    if (subject === 'ukrainian') return buildPoolQuestions(ukrainianPool, total);
    return buildPoolQuestions(historyPool, total);
  }

  function renderSubjects() {
    const list = $('subjectsList');
    list.innerHTML = '';
    Object.entries(SUBJECTS).forEach(([key, subject]) => {
      const raw = save.tests[key];
      const score = nmtScore(key, raw);
      const card = document.createElement('div');
      card.className = 'subject-card';
      card.innerHTML = `
        <div class="subject-head">
          <span class="subject-icon">${subject.short}</span>
          <div><strong>${subject.name}</strong><small>${subject.subtitle}</small></div>
        </div>
        <div class="subject-score">
          <span>${save.attempted[key] ? `${raw}/${subject.max} тестових` : `0/${subject.max} · не пройдено`}</span>
          <strong>${score >= 100 ? score : '—'}</strong>
        </div>
        <button class="subject-start" data-subject="${key}" type="button">${save.attempted[key] ? 'Пройти ще раз' : 'Почати пробник'}</button>`;
      list.appendChild(card);
    });
    $$('.subject-start').forEach((button) => button.addEventListener('click', () => startQuiz(button.dataset.subject)));
  }

  let quiz = {subject:null, items:[], index:0, correct:0, answered:false};

  function startQuiz(subject) {
    quiz = {subject, items:buildQuizQuestions(subject), index:0, correct:0, answered:false};
    showScreen('quizScreen');
    renderQuestion();
  }

  function renderQuestion() {
    const subject = SUBJECTS[quiz.subject];
    const question = quiz.items[quiz.index];
    quiz.answered = false;
    $('quizSubjectTitle').textContent = subject.name;
    $('quizProgress').textContent = `${quiz.index + 1}/${subject.max}`;
    $('questionLabel').textContent = `ПИТАННЯ ${quiz.index + 1}`;
    $('questionText').textContent = question.text;
    $('quizRawScore').textContent = quiz.correct;
    $('quizNmtScore').textContent = displayNmt(nmtScore(quiz.subject, quiz.correct));
    $('answers').innerHTML = '';
    question.answers.forEach((answer, answerIndex) => {
      const button = document.createElement('button');
      button.className = 'answer';
      button.textContent = `${String.fromCharCode(65 + answerIndex)}. ${answer}`;
      button.addEventListener('click', () => answerQuestion(answerIndex, button));
      $('answers').appendChild(button);
    });
    $('nextQuestion').classList.add('hidden');
  }

  function answerQuestion(index, clicked) {
    if (quiz.answered) return;
    quiz.answered = true;
    const question = quiz.items[quiz.index];
    const answerButtons = $$('#answers .answer');
    answerButtons.forEach((button) => button.disabled = true);
    answerButtons[question.correct].classList.add('correct');
    if (index === question.correct) quiz.correct += 1;
    else clicked.classList.add('wrong');
    $('quizRawScore').textContent = quiz.correct;
    $('quizNmtScore').textContent = displayNmt(nmtScore(quiz.subject, quiz.correct));
    $('nextQuestion').textContent = quiz.index === quiz.items.length - 1 ? 'Результат' : 'Далі';
    $('nextQuestion').classList.remove('hidden');
  }

  function finishQuiz() {
    const subject = quiz.subject;
    save.attempted[subject] = true;
    save.tests[subject] = Math.max(save.tests[subject], quiz.correct);
    persist();
    updateUI();
    const score = nmtScore(subject, quiz.correct);
    $('resultSubject').textContent = SUBJECTS[subject].name;
    $('resultNmt').textContent = displayNmt(score);
    $('resultRaw').textContent = `${quiz.correct}/${SUBJECTS[subject].max}`;
    $('resultAverage').textContent = `Середній NMT: ${displayNmt(averageNmt())}`;
    $('resultMultiplier').textContent = `Бонус Бруківки: ×${nmtMultiplier().toFixed(1)}`;
    showScreen('quizResultScreen');
  }

  $('nextQuestion').addEventListener('click', () => {
    if (!quiz.answered) return;
    if (quiz.index >= quiz.items.length - 1) finishQuiz();
    else { quiz.index += 1; renderQuestion(); }
  });
  $('quizBack').addEventListener('click', () => showScreen('znoScreen'));

  // Clothing / Legit Check.
  const clothingTypes = [
    {key:'tshirt', name:'Футболка'}, {key:'hoodie', name:'Худі'}, {key:'sweatshirt', name:'Світшот'},
    {key:'jacket', name:'Куртка'}, {key:'cap', name:'Кепка'}, {key:'pants', name:'Штани'},
    {key:'sneakers', name:'Кросівки'}
  ];

  const brands = [
    {name:'adidas', detail:'3 STRIPES', fakes:[['adibas','4 STRIPES'],['adiads','2 STRIPES'],['adid@s','5 STRIPES']]},
    {name:'PUMA', detail:'CAT', fakes:[['PUMR','CAT'],['PIMA','DOG'],['PUMA','DOUBLE CAT']]},
    {name:'NIKE', detail:'SWOOSH', fakes:[['N1KE','SWOOSH'],['NIKF','DOUBLE SWOOSH'],['NIKE','BACKWARD SWOOSH']]},
    {name:'Reebok', detail:'VECTOR', fakes:[['Reebak','VECTOR'],['R33BOK','BOX'],['Reebok','DOUBLE VECTOR']]},
    {name:'FILA', detail:'F MARK', fakes:[['F1LA','F MARK'],['FILAA','F MARK'],['FILA','MIRROR F']]},
    {name:'New Balance', detail:'NB', fakes:[['New Balonce','NB'],['New Balance','MB'],['New Balans','N8']]}
  ];

  const garmentColors = ['#e8ebef','#b8c6d1','#d8b6b6','#b8d5c1','#c8bee1','#d7c3a5','#98a7bb'];

  function makeClothing(status = null) {
    const type = pick(clothingTypes);
    let resolvedStatus = status || pick(['legit','legit','fake','plain']);
    if (resolvedStatus === 'plain') {
      return {
        id:`cloth_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        type:type.key, typeName:type.name, status:'plain', brand:'NO BRAND', detail:'BASIC',
        display:'Без бренду', color:pick(garmentColors)
      };
    }
    const brand = pick(brands);
    if (resolvedStatus === 'fake') {
      const fake = pick(brand.fakes);
      return {
        id:`cloth_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        type:type.key, typeName:type.name, status:'fake', brand:fake[0], detail:fake[1],
        display:`${fake[0]} · ${fake[1]}`, realBrand:brand.name, color:pick(garmentColors)
      };
    }
    return {
      id:`cloth_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      type:type.key, typeName:type.name, status:'legit', brand:brand.name, detail:brand.detail,
      display:`${brand.name} · ${brand.detail}`, realBrand:brand.name, color:pick(garmentColors)
    };
  }

  function clothingSvg(item) {
    const color = item.color || '#d6d9de';
    const label = escapeHtml(item.brand || '');
    const detail = escapeHtml(item.detail || '');
    let shape = '';
    if (item.type === 'hoodie') {
      shape = `<path d="M36 22 Q60 3 84 22 L106 38 92 58 82 51 82 113 38 113 38 51 28 58 14 38Z" fill="${color}" stroke="#606872" stroke-width="2"/><path d="M45 22 Q60 42 75 22 Q72 7 60 7 Q48 7 45 22" fill="#aeb5bd" stroke="#606872" stroke-width="2"/>`;
    } else if (item.type === 'sweatshirt') {
      shape = `<path d="M36 18 L48 11 H72 L84 18 108 39 94 57 82 49 82 114 H38 V49 L26 57 12 39Z" fill="${color}" stroke="#606872" stroke-width="2"/><path d="M48 11 Q60 27 72 11" fill="#adb5bd"/>`;
    } else if (item.type === 'jacket') {
      shape = `<path d="M37 16 L49 10 H71 L83 16 105 34 91 54 82 47 82 115 H38 V47 L29 54 15 34Z" fill="${color}" stroke="#606872" stroke-width="2"/><path d="M60 18 V113" stroke="#4e5660" stroke-width="2"/><path d="M51 12 L60 24 69 12" fill="none" stroke="#606872" stroke-width="2"/>`;
    } else if (item.type === 'cap') {
      shape = `<path d="M28 64 Q32 28 66 25 Q94 28 96 65Z" fill="${color}" stroke="#606872" stroke-width="2"/><path d="M60 65 Q93 62 112 75 Q83 82 55 72Z" fill="${color}" stroke="#606872" stroke-width="2"/>`;
    } else if (item.type === 'pants') {
      shape = `<path d="M37 13 H83 L78 57 90 112 H67 L59 64 53 112 H30 L42 57Z" fill="${color}" stroke="#606872" stroke-width="2"/><path d="M59 14 V63" stroke="#606872" stroke-width="2"/>`;
    } else if (item.type === 'sneakers') {
      shape = `<path d="M17 69 Q34 64 49 45 L64 61 93 69 Q106 72 106 87 H18Z" fill="${color}" stroke="#606872" stroke-width="2"/><path d="M52 53 L64 61 79 66" stroke="#606872" stroke-width="2" fill="none"/><path d="M18 87 H106" stroke="#343b44" stroke-width="4"/>`;
    } else {
      shape = `<path d="M35 18 L49 10 H71 L85 18 107 32 94 52 83 45 V114 H37 V45 L26 52 13 32Z" fill="${color}" stroke="#606872" stroke-width="2"/><path d="M49 10 Q60 27 71 10" fill="#b0b6bc"/>`;
    }
    return `<svg viewBox="0 0 120 125" aria-label="${escapeHtml(item.typeName)} ${label}">${shape}<rect x="33" y="59" width="54" height="27" rx="7" fill="#ffffffb8"/><text x="60" y="70" text-anchor="middle" font-size="9" font-weight="800" fill="#20252b">${label}</text><text x="60" y="80" text-anchor="middle" font-size="5.5" font-weight="700" fill="#555d66">${detail}</text></svg>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  let legitLocked = false;
  let legitRoundItems = [];
  function startLegitRound() {
    legitLocked = false;
    $('legitMessage').textContent = 'Кос, знайди підробку. Дивись на напис і деталі дизайну.';
    $('nextLegitRound').classList.add('hidden');
    legitRoundItems = shuffle([makeClothing('fake'), makeClothing('legit'), makeClothing('plain')]);
    const container = $('legitItems');
    container.innerHTML = '';
    legitRoundItems.forEach((item) => {
      const button = document.createElement('button');
      button.className = 'legit-item';
      button.innerHTML = `${clothingSvg(item)}<strong>${escapeHtml(item.typeName)}</strong><small>${escapeHtml(item.display)}</small>`;
      button.addEventListener('click', () => chooseLegitItem(item, button));
      container.appendChild(button);
    });
  }

  function chooseLegitItem(item, button) {
    if (legitLocked) return;
    legitLocked = true;
    $$('#legitItems .legit-item').forEach((element) => element.disabled = true);
    if (item.status === 'fake') {
      button.classList.add('good');
      save.legit.score += 1;
      save.legit.streak += 1;
      save.legit.best = Math.max(save.legit.best, save.legit.streak);
      $('legitMessage').textContent = `ПАЛЬ ЗНАЙДЕНО: ${item.brand} / ${item.detail}. Серія +1.`;
    } else {
      button.classList.add('bad');
      save.legit.streak = 0;
      $('legitMessage').textContent = item.status === 'plain'
        ? 'Це звичайна річ без бренду — вона не прикидається брендовою.'
        : `Це оригінальний дизайн ${item.brand}. Паль була в іншій картці.`;
      const fakeIndex = legitRoundItems.findIndex((entry) => entry.status === 'fake');
      const buttons = $$('#legitItems .legit-item');
      if (fakeIndex >= 0) buttons[fakeIndex].classList.add('good');
    }
    persist();
    updateUI();
    $('nextLegitRound').classList.remove('hidden');
  }

  $('nextLegitRound').addEventListener('click', startLegitRound);

  // Telegram: reformoti supply request + two clothing channels.
  function newOrder() {
    const target = randInt(6, 18);
    const reward = target * randInt(260, 430);
    return {id:Date.now(), target, progress:0, reward, active:false, completed:false};
  }

  function ensureOrder() {
    if (!save.order) {
      save.order = newOrder();
      persist();
    }
  }

  function renderOrderPreview() {
    ensureOrder();
    const order = save.order;
    if (order.completed) $('reformotiPreview').textContent = 'Поставка виконана. Є новий запит?';
    else if (order.active) $('reformotiPreview').textContent = `Поставка Бруківки ${order.progress}/${order.target}`;
    else $('reformotiPreview').textContent = `Треба ${order.target} Бруківок. Візьмеш?`;
  }

  function renderReformotiChat() {
    ensureOrder();
    const order = save.order;
    const messages = $('reformotiMessages');
    messages.innerHTML = '';
    const intro = document.createElement('div');
    intro.className = 'message in';
    intro.innerHTML = `Кос, є тема по Бруківці.<small>reformoti</small>`;
    messages.appendChild(intro);

    const orderMessage = document.createElement('div');
    orderMessage.className = 'order-card-message';
    const progress = order.target ? Math.round(clamp(order.progress / order.target, 0, 1) * 100) : 0;
    orderMessage.innerHTML = `<strong>Поставка: ${order.target} Бруківок</strong><span>Прогрес: ${Math.min(order.progress, order.target)}/${order.target} · бонус ${money(order.reward)} UAH</span><div class="order-progressbar"><div style="width:${progress}%"></div></div>`;
    messages.appendChild(orderMessage);

    const msg = document.createElement('div');
    msg.className = 'message in';
    if (order.completed) msg.innerHTML = `Все чітко. Поставка закрита, бонус уже на балансі.<small>reformoti</small>`;
    else if (order.active) msg.innerHTML = `Чекаю. Занось Бруківку в Карман Коса — прогрес піде автоматично.<small>reformoti</small>`;
    else msg.innerHTML = `Забереш замовлення? За виконання окремо ${money(order.reward)} UAH.<small>reformoti</small>`;
    messages.appendChild(msg);

    const actions = $('orderActionArea');
    actions.innerHTML = '';
    const button = document.createElement('button');
    if (order.completed) {
      button.textContent = 'Запросити нову поставку';
      button.addEventListener('click', () => { save.order = newOrder(); persist(); updateUI(); renderReformotiChat(); });
    } else if (!order.active) {
      button.textContent = 'Прийняти поставку';
      button.addEventListener('click', () => { save.order.active = true; persist(); updateUI(); renderReformotiChat(); });
    } else {
      button.textContent = `У роботі: ${order.progress}/${order.target}`;
      button.disabled = true;
    }
    actions.appendChild(button);
  }

  function marketOffer(channel) {
    const item = makeClothing(pick(['legit','legit','fake','plain']));
    const base = item.status === 'plain' ? randInt(280,700) : randInt(550,1900);
    const channelDiscount = channel === 'kos' ? rand(0.72,0.88) : rand(0.78,0.94);
    item.price = Math.round(base * channelDiscount / 10) * 10;
    item.resale = Math.round(item.price * (item.status === 'legit' ? rand(1.35,1.75) : item.status === 'plain' ? rand(1.12,1.38) : rand(0.25,0.5)) / 10) * 10;
    item.checked = false;
    item.channel = channel;
    item.offerId = `offer_${save.marketSerial++}`;
    return item;
  }

  function generateMarket() {
    save.market = {
      kos:[marketOffer('kos'), marketOffer('kos'), marketOffer('kos')],
      street:[marketOffer('street'), marketOffer('street'), marketOffer('street')]
    };
    persist();
  }

  function ensureMarket() {
    if (!save.market || !Array.isArray(save.market.kos) || !Array.isArray(save.market.street)) generateMarket();
  }

  function verdictText(item) {
    if (item.status === 'fake') return {text:`ПАЛЬ · справжній бренд мав би бути ${item.realBrand || 'іншим'}`, cls:'fake'};
    if (item.status === 'plain') return {text:'NO BRAND · звичайна річ, не підробка', cls:'plain'};
    return {text:'ОРИГІНАЛ · дизайн виглядає коректно', cls:'legit'};
  }

  function renderOfferList(containerId, offers) {
    const container = $(containerId);
    container.innerHTML = '';
    offers.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'offer-card';
      const verdict = item.checked ? verdictText(item) : null;
      card.innerHTML = `
        <div class="offer-visual">${clothingSvg(item)}</div>
        <div class="offer-main">
          <strong>${escapeHtml(item.typeName)} · ${escapeHtml(item.display)}</strong>
          <small>Продавець пише: «стан топ»</small>
          <div class="offer-price">Купити: <b>${money(item.price)} UAH</b> · потенційний продаж: <b>${money(item.resale)} UAH</b></div>
          ${verdict ? `<div class="offer-verdict ${verdict.cls}">${escapeHtml(verdict.text)}</div>` : ''}
          <div class="offer-actions">
            <button class="check-button" data-check="${item.offerId}" type="button">${item.checked ? 'Перевірено' : 'Legit Check'}</button>
            <button class="buy-button" data-buy="${item.offerId}" type="button" ${save.balance < item.price ? 'disabled' : ''}>Купити</button>
          </div>
        </div>`;
      container.appendChild(card);
    });
  }

  function allOffers() {
    ensureMarket();
    return [...save.market.kos, ...save.market.street];
  }

  function findOffer(offerId) { return allOffers().find((item) => item.offerId === offerId); }

  function checkOffer(offerId) {
    const offer = findOffer(offerId);
    if (!offer) return;
    offer.checked = true;
    persist();
    renderMarket();
  }

  function buyOffer(offerId) {
    const offer = findOffer(offerId);
    if (!offer || save.balance < offer.price) return;
    save.balance -= offer.price;
    save.inventory.push({...offer, boughtAt:Date.now()});
    save.market.kos = save.market.kos.filter((item) => item.offerId !== offerId);
    save.market.street = save.market.street.filter((item) => item.offerId !== offerId);
    const target = offer.channel === 'kos' ? save.market.kos : save.market.street;
    target.push(marketOffer(offer.channel));
    persist();
    updateUI();
    renderMarket();
  }

  function sellInventoryItem(itemId) {
    const index = save.inventory.findIndex((item) => item.id === itemId);
    if (index < 0) return;
    const item = save.inventory[index];
    save.balance += item.resale;
    save.inventory.splice(index, 1);
    persist();
    updateUI();
    renderInventory();
  }

  function renderMarket() {
    ensureMarket();
    renderOfferList('channelKosOffers', save.market.kos);
    renderOfferList('channelStreetOffers', save.market.street);
    $$('[data-check]').forEach((button) => button.addEventListener('click', () => checkOffer(button.dataset.check)));
    $$('[data-buy]').forEach((button) => button.addEventListener('click', () => buyOffer(button.dataset.buy)));
  }

  function renderInventory() {
    const count = $('inventoryCount');
    if (count) count.textContent = save.inventory.length;
    const container = $('inventoryList');
    if (!container) return;
    container.innerHTML = '';
    if (!save.inventory.length) {
      container.innerHTML = '<div class="empty-state">Поки порожньо. Заглянь у канали й купи щось на перепродаж.</div>';
      return;
    }
    save.inventory.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'inventory-item';
      const status = item.checked ? verdictText(item).text : 'не перевірено';
      row.innerHTML = `${clothingSvg(item)}<div><strong>${escapeHtml(item.typeName)} · ${escapeHtml(item.display)}</strong><small>${escapeHtml(status)} · куплено за ${money(item.price)} UAH</small><small>Продаж: ${money(item.resale)} UAH</small></div><button class="sell-button" data-sell="${item.id}" type="button">Продати</button>`;
      container.appendChild(row);
    });
    $$('[data-sell]').forEach((button) => button.addEventListener('click', () => sellInventoryItem(button.dataset.sell)));
  }

  function showTelegramTab(tab) {
    $$('.tg-tab').forEach((button) => button.classList.toggle('active', button.dataset.tgTab === tab));
    $('tgChatsPanel').classList.toggle('hidden', tab !== 'chats');
    $('tgMarketPanel').classList.toggle('hidden', tab !== 'market');
    $('tgInventoryPanel').classList.toggle('hidden', tab !== 'inventory');
    if (tab === 'market') renderMarket();
    if (tab === 'inventory') renderInventory();
  }

  function renderTelegram() {
    ensureMarket();
    renderOrderPreview();
    showTelegramTab('chats');
  }

  $$('.tg-tab').forEach((button) => button.addEventListener('click', () => showTelegramTab(button.dataset.tgTab)));
  $('reformotiChatOpen').addEventListener('click', () => showScreen('reformotiChatScreen'));
  $('reformotiChatBack').addEventListener('click', () => { showScreen('telegramScreen'); showTelegramTab('chats'); });
  $('refreshMarket').addEventListener('click', () => { generateMarket(); renderMarket(); updateUI(); });

  function init() {
    ensureOrder();
    ensureMarket();
    rememberStart();
    resetBrick();
    randomizeLasers();
    updateUI();
    $('phoneTime').textContent = new Date().toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'});
  }

  window.addEventListener('resize', () => {
    rememberStart();
    resetBrick();
    randomizeLasers();
  });

  init();
})();
