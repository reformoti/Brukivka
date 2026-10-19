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
  const BACKUP_KEY = `${SAVE_KEY}_backup`;
  const OLD_KEYS = ['brukivka_kos_fixed_v1', 'brukivkaPrototypeSave_v3', 'brukivkaPrototypeSave_v2', 'brukivkaPrototypeSave_v1'];
  const MARKET_REFRESH_PRICE = 250;
  const MARKET_REFRESH_COOLDOWN_MS = 30 * 1000;
  const ITEM_SALE_DELAY_MS = 60 * 1000;
  const MAX_BALANCE = Number.MAX_SAFE_INTEGER;
  const PC_PRICE = 12500;
  const PC_UPGRADE_LIMIT = 5;
  const PC_UPGRADE_BASE = {cpu:1100, gpu:1500, ram:900};
  const CS_MODES = {easy:{label:'Легкий',target:10}, medium:{label:'Середній',target:30}, hardcore:{label:'Хардкор',target:60}};
  const CS_ROUND_MS = 30000;
  const MUSIC_TRACKS = ['Тікі Тікі', 'Манго', 'Аура Фонк', 'Наполеон', '?????'];
const MUSIC_COVERS = [
  'https://miyzvuk.net/uploads/posts/2026-01/cover-of-tiki-tiki-slowed-by-qmiir.webp',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQxz9CKitE2lpdmRYUJpThdQgkeenhIG7S890QPPNXKg&s=10',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQt-9Ky-JUv0Wvj_6sflJAEa_HqGNibkj-dcbRI5UAAJQ&s=10',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_vz5JJI5lCiSNC2qlOadr_CkBIkAfKb5JnTFqW7D6ow&s=10',
  'https://i.ytimg.com/vi/-Ueui3XiyUU/sddefault.jpg?v=60705db7'
];

  let saveNotice = '';

  function showSaveNotice(message) {
    saveNotice = message;
    const banner = $('saveWarning');
    if (!banner) return;
    banner.textContent = message;
    banner.classList.toggle('hidden', !message);
  }

  function safeInt(value, fallback, min, max) {
    return typeof value === 'number' && Number.isFinite(value)
      ? clamp(Math.trunc(value), min, max) : fallback;
  }

  function safeText(value, fallback = '', max = 90) {
    return typeof value === 'string' && value.length > 0 ? value.slice(0, max) : fallback;
  }

  function record(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

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
      marketSerial:1,
      marketRefreshedAt:0,
      pcOwned:false,
      pcUpgrades:{cpu:0,gpu:0,ram:0},
      csHardcoreBest:0,
      csHardcoreBestTimeMs:0,
      audio:{track:0,volume:70,muted:false,shuffle:false}
    };
  }

  // Only reconstruct recognized fields: corrupt or unexpected nested data never reaches the UI.
  function sanitizeClothing(source, isInventory, index) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
    const allowedTypes = ['tshirt','hoodie','sweatshirt','jacket','cap','pants','sneakers'];
    const typeNames = ['Футболка','Худі','Світшот','Куртка','Кепка','Штани','Кросівки'];
    const typeIndex = allowedTypes.indexOf(source.type);
    if (typeIndex === -1 || !['legit','fake','plain'].includes(source.status)) return null;
    if (!Number.isFinite(source.price) || source.price < 0 || !Number.isFinite(source.resale) || source.resale < 0) return null;
    const item = {
      id:safeText(source.id, `restored_item_${index}`, 100),
      type:source.type,
      typeName:typeNames[typeIndex],
      status:source.status,
      brand:safeText(source.brand, 'NO BRAND', 60),
      detail:safeText(source.detail, 'BASIC', 60),
      display:safeText(source.display, 'Без бренду', 120),
      realBrand:safeText(source.realBrand, '', 60),
      color:/^#[0-9a-fA-F]{6}$/.test(source.color) ? source.color : '#d6d9de',
      price:safeInt(source.price, 0, 0, MAX_BALANCE),
      resale:safeInt(source.resale, 0, 0, MAX_BALANCE),
      checked:source.checked === true
    };
    if (isInventory) {
      // Existing items predate the selling delay: they remain immediately sellable.
      item.boughtAt = safeInt(source.boughtAt, 0, 0, Date.now());
    } else {
      item.channel = source.channel === 'street' ? 'street' : 'kos';
      item.offerId = safeText(source.offerId, `restored_offer_${index}`, 100);
    }
    return item;
  }

  function sanitizeSave(source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
    const result = defaults();
    const tests = record(source.tests);
    const attempted = record(source.attempted);
    const legit = record(source.legit);
    result.balance = safeInt(source.balance, 0, -MAX_BALANCE, MAX_BALANCE); // Negative balance is intentional.
    result.brickTier = safeInt(source.brickTier, 0, 0, brickTiers.length - 1);
    result.phoneTier = safeInt(source.phoneTier, 0, 0, phoneTiers.length - 1);
    result.strength = safeInt(source.strength, 0, 0, strengthTiers.length - 1);
    Object.keys(SUBJECTS).forEach((subject) => {
      result.tests[subject] = safeInt(tests[subject], 0, 0, SUBJECTS[subject].max);
      result.attempted[subject] = typeof attempted[subject] === 'boolean'
        ? attempted[subject] : result.tests[subject] > 0;
    });
    result.legit.score = safeInt(legit.score, 0, 0, MAX_BALANCE);
    result.legit.streak = safeInt(legit.streak, 0, 0, MAX_BALANCE);
    result.legit.best = Math.max(result.legit.streak, safeInt(legit.best, 0, 0, MAX_BALANCE));
    if (source.order !== null && source.order !== undefined) {
      const order = record(source.order);
      if (Number.isFinite(order.target) && order.target >= 1 && Number.isFinite(order.reward) && order.reward >= 0) {
        const target = safeInt(order.target, 6, 1, 1000);
        const progress = safeInt(order.progress, 0, 0, target);
        const completed = order.completed === true || progress >= target;
        result.order = {
          id:safeInt(order.id, 0, 0, MAX_BALANCE), target, progress,
          reward:safeInt(order.reward, 0, 0, MAX_BALANCE),
          active:!completed && order.active === true,
          completed
        };
      }
    }
    const inventoryIds = new Set();
    if (Array.isArray(source.inventory)) {
      source.inventory.slice(0, 1000).forEach((entry, i) => {
        const item = sanitizeClothing(entry, true, i);
        if (item && !inventoryIds.has(item.id)) {
          inventoryIds.add(item.id);
          result.inventory.push(item);
        }
      });
    }
    const market = record(source.market);
    if (Array.isArray(market.kos) && Array.isArray(market.street)) {
      const seenOffers = new Set();
      result.market = {kos:[], street:[]};
      for (const channel of ['kos','street']) {
        market[channel].slice(0, 3).forEach((entry, i) => {
          const item = sanitizeClothing(entry, false, `${channel}_${i}`);
          if (!item || seenOffers.has(item.offerId)) return;
          seenOffers.add(item.offerId);
          item.channel = channel;
          result.market[channel].push(item);
        });
      }
    }
    result.marketSerial = safeInt(source.marketSerial, 1, 1, MAX_BALANCE);
    if (result.market) {
      const serials = [...result.market.kos, ...result.market.street]
        .map((item) => /^offer_(\d+)$/.exec(item.offerId))
        .filter(Boolean).map((match) => Number(match[1]));
      if (serials.length) result.marketSerial = Math.max(result.marketSerial, Math.max(...serials) + 1);
    }
    result.marketRefreshedAt = safeInt(source.marketRefreshedAt, 0, 0, Date.now());
    result.pcOwned = source.pcOwned === true;
    const upgrades = record(source.pcUpgrades);
    for (const part of Object.keys(PC_UPGRADE_BASE)) {
      result.pcUpgrades[part] = result.pcOwned ? safeInt(upgrades[part], 0, 0, PC_UPGRADE_LIMIT) : 0;
    }
    result.csHardcoreBest = safeInt(source.csHardcoreBest, 0, 0, 60);
    result.csHardcoreBestTimeMs = safeInt(source.csHardcoreBestTimeMs, 0, 0, CS_ROUND_MS);
    const audio = record(source.audio);
    result.audio.track = safeInt(audio.track, 0, 0, MUSIC_TRACKS.length - 1);
    result.audio.volume = safeInt(audio.volume, 70, 0, 100);
    result.audio.muted = audio.muted === true;
    result.audio.shuffle = audio.shuffle === true;
    return result;
  }

  function loadSave() {
    let damaged = false;
    for (const key of [SAVE_KEY, BACKUP_KEY, ...OLD_KEYS]) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        const parsed = sanitizeSave(JSON.parse(raw));
        if (!parsed) throw new Error('Invalid save structure');
        if (damaged || key === BACKUP_KEY) {
          saveNotice = 'Знайдено пошкоджене збереження. Прогрес відновлено з резервної копії або старої версії.';
        }
        return parsed;
      } catch (error) {
        damaged = true;
        // Preserve the original corrupted data for manual recovery if storage allows it.
        if (key === SAVE_KEY) {
          try {
            const raw = localStorage.getItem(key);
            if (raw !== null && localStorage.getItem(`${SAVE_KEY}_corrupt`) === null)
              localStorage.setItem(`${SAVE_KEY}_corrupt`, raw);
          } catch (storageError) {}
        }
      }
    }
    if (damaged) saveNotice = 'Не вдалося прочитати збереження. Запущено новий прогрес; перевір налаштування сховища браузера.';
    return defaults();
  }

  let save = loadSave();
  function persist() {
    try {
      const serialized = JSON.stringify(save);
      localStorage.setItem(SAVE_KEY, serialized);
      try {
        localStorage.setItem(BACKUP_KEY, serialized);
      } catch (backupError) {
        showSaveNotice('Прогрес збережено, але резервна копія недоступна (бракує місця у сховищі).');
        return true;
      }
      return true;
    } catch (error) {
      showSaveNotice('Увага: прогрес не збережено! Перевір доступ до сховища або вільне місце у браузері.');
      return false;
    }
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
    renderPcShop();
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
    'legitScreen','telegramScreen','reformotiChatScreen','pcShopScreen'
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
    updatePhoneTime();
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
  $('pcShopApp').addEventListener('click', () => showScreen('pcShopScreen'));
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
  let mobileLayout = window.matchMedia('(max-width: 760px)').matches;

  function rememberStart() {
    const boardRect = board.getBoundingClientRect();
    startPosition = {
      x:boardRect.width * (mobileLayout ? 0.11 : 0.07),
      y:boardRect.height * (mobileLayout ? 0.09 : 0.43)
    };
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
    const mobile = mobileLayout;
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
            <button class="check-button" data-check="${escapeHtml(item.offerId)}" type="button">${item.checked ? 'Перевірено' : 'Legit Check'}</button>
            <button class="buy-button" data-buy="${escapeHtml(item.offerId)}" type="button" ${save.balance < item.price ? 'disabled' : ''}>Купити</button>
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
    if (Date.now() - item.boughtAt < ITEM_SALE_DELAY_MS) return;
    save.balance += item.resale;
    save.inventory.splice(index, 1);
    persist();
    updateUI();
    renderInventory();
  }

  function updateMarketRefreshButton() {
    const button = $('refreshMarket');
    const remaining = Math.max(0, MARKET_REFRESH_COOLDOWN_MS - (Date.now() - save.marketRefreshedAt));
    button.disabled = remaining > 0 || save.balance < MARKET_REFRESH_PRICE;
    button.textContent = remaining > 0
      ? `Нові пропозиції через ${Math.ceil(remaining / 1000)} с`
      : `Оновити пропозиції — ${money(MARKET_REFRESH_PRICE)} UAH`;
  }

  function renderMarket() {
    ensureMarket();
    updateMarketRefreshButton();
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
      const wait = Math.max(0, ITEM_SALE_DELAY_MS - (Date.now() - item.boughtAt));
      row.innerHTML = `${clothingSvg(item)}<div><strong>${escapeHtml(item.typeName)} · ${escapeHtml(item.display)}</strong><small>${escapeHtml(status)} · куплено за ${money(item.price)} UAH</small><small>Продаж: ${money(item.resale)} UAH</small></div><button class="sell-button" data-sell="${escapeHtml(item.id)}" type="button" ${wait ? 'disabled' : ''}>${wait ? `Через ${Math.ceil(wait / 1000)} с` : 'Продати'}</button>`;
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
  $('refreshMarket').addEventListener('click', () => {
    if (Date.now() - save.marketRefreshedAt < MARKET_REFRESH_COOLDOWN_MS) return;
    if (save.balance < MARKET_REFRESH_PRICE) return;
    save.balance -= MARKET_REFRESH_PRICE;
    save.marketRefreshedAt = Date.now();
    generateMarket();
    renderMarket();
    updateUI();
  });

  // ========================================================
  // PC Market: an owned PC unlocks a separate desktop UI.
  // ========================================================
  function pcUpgradeCost(part) {
    return Math.round(PC_UPGRADE_BASE[part] * Math.pow(1.85, save.pcUpgrades[part]) / 50) * 50;
  }

  function pcAimBonus() {
    return (save.pcUpgrades.cpu + save.pcUpgrades.gpu + save.pcUpgrades.ram) * 3;
  }

  function renderPcShop() {
    $('pcShopBalance').textContent = `${money(save.balance)} UAH`;
    $('pcShopBalance').classList.toggle('debt', save.balance < 0);
    $('pcOwnership').textContent = save.pcOwned ? 'ПК Коса · встановлено ✓' : 'ПК не придбано';
    $('pcBuyButton').classList.toggle('hidden', save.pcOwned);
    $('pcBuyButton').disabled = save.balance < PC_PRICE;
    $('pcBuyButton').textContent = `Купити ПК — ${money(PC_PRICE)} UAH`;
    $('pcShopOpen').classList.toggle('hidden', !save.pcOwned);
    $('pcUpgradeArea').classList.toggle('hidden', !save.pcOwned);
    $('pcOpenButton').classList.toggle('hidden', !save.pcOwned);
    $('pcPowerSummary').textContent = `+${pcAimBonus()} px до цілі`;
    $('pcSpecsLabel').textContent = `CPU ${save.pcUpgrades.cpu} · GPU ${save.pcUpgrades.gpu} · RAM ${save.pcUpgrades.ram}`;
    $('pcDesktopPower').textContent = `+${pcAimBonus()} px до цілі`;
    for (const part of Object.keys(PC_UPGRADE_BASE)) {
      const level = save.pcUpgrades[part];
      $(`pc${part[0].toUpperCase() + part.slice(1)}Level`).textContent = `${level}/${PC_UPGRADE_LIMIT}`;
      const btn = $(`pc${part[0].toUpperCase() + part.slice(1)}Upgrade`);
      btn.disabled = !save.pcOwned || level >= PC_UPGRADE_LIMIT || save.balance < pcUpgradeCost(part);
      btn.textContent = level >= PC_UPGRADE_LIMIT ? 'Максимум ✓' : `Прокачати — ${money(pcUpgradeCost(part))} UAH`;
    }
  }

  function buyPC() {
    if (save.pcOwned) return;
    if (save.balance < PC_PRICE) {
      $('pcShopMessage').textContent = 'Недостатньо UAH. Зароби ще на доставках!';
      return;
    }
    save.balance -= PC_PRICE;
    save.pcOwned = true;
    persist();
    updateUI();
    $('pcShopMessage').textContent = 'ПК придбано! Кнопка «ПК Коса» вже доступна.';
  }

  function upgradePC(part) {
    if (!save.pcOwned || save.pcUpgrades[part] >= PC_UPGRADE_LIMIT) return;
    const cost = pcUpgradeCost(part);
    if (save.balance < cost) {
      $('pcShopMessage').textContent = 'Недостатньо UAH для покращення.';
      return;
    }
    save.balance -= cost;
    save.pcUpgrades[part]++;
    persist();
    updateUI();
    $('pcShopMessage').textContent = `${part.toUpperCase()} покращено! Цілі в КС2 стають трохи більшими.`;
  }

  $('pcBuyButton').addEventListener('click', buyPC);
  for (const part of Object.keys(PC_UPGRADE_BASE)) {
    $(`pc${part[0].toUpperCase() + part.slice(1)}Upgrade`).addEventListener('click', () => upgradePC(part));
  }

  function openPC() {
    if (!save.pcOwned) return;
    $('phoneOverlay').classList.add('hidden');
    $('pcOverlay').classList.remove('hidden');
    showPCProgram('desktop');
    updatePcClock();
    renderPcShop();
  }

  function closePC() {
    if (csRun) finishCsRun(false, true);
    $('pcOverlay').classList.add('hidden');
  }

  function showPCProgram(name) {
    if (csRun && name !== 'steam') finishCsRun(false, true);
    $('pcDesktop').classList.toggle('hidden', name !== 'desktop');
    $('steamPanel').classList.toggle('hidden', name !== 'steam');
    $('soundcloudPanel').classList.toggle('hidden', name !== 'soundcloud');
    if (name === 'steam') renderCsRecord();
    if (name === 'soundcloud') renderSoundcloud();
  }

  $('pcOpenButton').addEventListener('click', openPC);
  $('pcShopOpen').addEventListener('click', openPC);
  $('pcCloseButton').addEventListener('click', closePC);
  $('steamApp').addEventListener('click', () => showPCProgram('steam'));
  $('soundcloudApp').addEventListener('click', () => showPCProgram('soundcloud'));
  $('pcTaskHome').addEventListener('click', () => showPCProgram('desktop'));
  $$('[data-pc-home]').forEach((button) => button.addEventListener('click', () => showPCProgram('desktop')));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('pcOverlay').classList.contains('hidden')) closePC();
  });

  function updatePcClock() {
    const now = new Date().toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'});
    $('pcClock').textContent = now;
    $('pcTaskTime').textContent = now;
  }

  // ========================================================
  // Steam / CS2: sequential targets, genuine elapsed-time
  // scoring, one fixed 30-second limit in every difficulty.
  // ========================================================
  let csRun = null;
  let csTickInterval = null;
  let csLastMode = 'easy';

  function renderCsRecord() {
    $('csRecord').textContent = `${save.csHardcoreBest} / 60`;
    $('csBestTime').textContent = save.csHardcoreBestTimeMs > 0
      ? `Найшвидше 60/60: ${(save.csHardcoreBestTimeMs / 1000).toFixed(2)} с`
      : 'Поки немає повного проходження';
  }

  function setCsTargetPosition() {
    // Percentages keep the target within the play area on mobile too.
    const x = randInt(13,87);
    const y = randInt(18,82);
    const size = 36 + pcAimBonus();
    const target = $('csTarget');
    target.style.left = `${x}%`;
    target.style.top = `${y}%`;
    target.style.width = `${size}px`;
    target.style.height = `${size}px`;
  }

  function startCsRun(mode) {
    if (!save.pcOwned || !CS_MODES[mode]) return;
    if (csRun) finishCsRun(false, true);
    csLastMode = mode;
    csRun = {mode, hits:0, target:CS_MODES[mode].target, start:performance.now()};
    $('csMenu').classList.add('hidden');
    $('csResult').classList.add('hidden');
    $('csGame').classList.remove('hidden');
    $('csModeText').textContent = CS_MODES[mode].label;
    $('csHitCount').textContent = `0 / ${csRun.target}`;
    $('csTimerFill').style.width = '100%';
    $('csTimer').textContent = '30.0';
    setCsTargetPosition();
    if (csTickInterval !== null) clearInterval(csTickInterval);
    csTickInterval = setInterval(tickCsRun, 40);
  }

  function tickCsRun() {
    if (!csRun) return;
    const remaining = Math.max(0, CS_ROUND_MS - (performance.now() - csRun.start));
    $('csTimer').textContent = (remaining / 1000).toFixed(1);
    $('csTimerFill').style.width = `${(remaining / CS_ROUND_MS) * 100}%`;
    if (remaining <= 0) finishCsRun(false);
  }

  function hitCsTarget() {
    if (!csRun) return;
    const elapsed = performance.now() - csRun.start;
    if (elapsed >= CS_ROUND_MS) {
      finishCsRun(false);
      return;
    }
    csRun.hits++;
    $('csHitCount').textContent = `${csRun.hits} / ${csRun.target}`;
    if (csRun.hits >= csRun.target) {
      finishCsRun(true);
    } else {
      setCsTargetPosition();
    }
  }

  function finishCsRun(completed, silent = false) {
    if (!csRun) return;
    const run = csRun;
    const elapsed = Math.min(CS_ROUND_MS, Math.max(0, performance.now() - run.start));
    csRun = null;
    if (csTickInterval !== null) {
      clearInterval(csTickInterval);
      csTickInterval = null;
    }
    $('csGame').classList.add('hidden');
    if (run.mode === 'hardcore' && !silent) {
      let changed = false;
      if (run.hits > save.csHardcoreBest) {
        save.csHardcoreBest = run.hits;
        changed = true;
      }
      if (completed && (save.csHardcoreBestTimeMs === 0 || elapsed < save.csHardcoreBestTimeMs)) {
        save.csHardcoreBestTimeMs = Math.max(1, Math.round(elapsed));
        changed = true;
      }
      if (changed) persist();
    }
    renderCsRecord();
    if (silent) {
      $('csMenu').classList.remove('hidden');
      $('csResult').classList.add('hidden');
      return;
    }
    $('csResult').classList.remove('hidden');
    $('csResultTitle').textContent = completed ? 'Є влучання! Раунд пройдено' : 'Час вийшов!';
    $('csResultText').textContent = `${CS_MODES[run.mode].label}: ${run.hits}/${run.target} кульок за ${(elapsed/1000).toFixed(2)} с. ${run.mode === 'hardcore' ? 'Хардкор оновлює рекорд.' : 'Рекорд рахується тільки на хардкорі.'}`;
  }

  $$('[data-cs-mode]').forEach((button) => button.addEventListener('click', () => startCsRun(button.dataset.csMode)));
  $('csTarget').addEventListener('click', hitCsTarget);
  $('csAbort').addEventListener('click', () => finishCsRun(false));
  $('csPlayAgain').addEventListener('click', () => startCsRun(csLastMode));
  $('csResultMenu').addEventListener('click', () => { $('csResult').classList.add('hidden');$('csMenu').classList.remove('hidden'); });

  // ========================================================
  // SoundCloud: local music files, saved settings, no autoplay.
  // ========================================================
  const scAudio = new Audio();
  scAudio.preload = 'metadata';
  let scCurrentTrack = -1;
  // Requested filenames are music/mp3(1).mp3 through music/mp3(5).mp3.
  // Existing folder-based URLs remain supported for older GitHub uploads.
  let scFallbackIndex = 0;
  let scUserPaused = true;

  function scPaths(index) {
    const num = index + 1;
    return [
      `music/mp3(${num}).mp3`,
      `music/mp3(${num})`,
      `music/mp3/${num}.mp3`,
      `music/${num}.mp3`,
      `mp3/${num}.mp3`
    ];
  }

  function scPath(index, fallbackIndex = 0) {
    return scPaths(index)[fallbackIndex];
  }

  function createTrackCover(index, className = 'sc-cover') {
    const cover = document.createElement('span');
    cover.className = className;
    const fallback = document.createElement('span');
    fallback.className = 'sc-cover-fallback';
    fallback.textContent = '♫';
    fallback.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.src = MUSIC_COVERS[index];
    img.alt = `Обкладинка: ${MUSIC_TRACKS[index]}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => {
      img.remove();
      cover.classList.add('sc-cover-missing');
    });
    cover.append(fallback, img);
    return cover;
  }

  function scTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const whole = Math.floor(seconds);
    return `${Math.floor(whole/60)}:${String(whole%60).padStart(2,'0')}`;
  }

  function renderSoundcloud() {
    const container = $('scTracks');
    container.replaceChildren();
    MUSIC_TRACKS.forEach((name, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `sc-track${index === save.audio.track ? ' selected' : ''}`;
      const cover = createTrackCover(index);
      const meta = document.createElement('span');
      meta.className = 'sc-track-meta';
      const title = document.createElement('strong');
      title.textContent = name;
      const subtitle = document.createElement('small');
      subtitle.textContent = `mp3(${index+1}).mp3`;
      meta.append(title,subtitle);
      const icon = document.createElement('span');
      icon.className = 'sc-track-play';
      icon.textContent = index === save.audio.track && !scAudio.paused ? 'Ⅱ' : '▶';
      button.append(cover, meta, icon);
      button.addEventListener('click', () => selectScTrack(index, true));
      container.append(button);
    });
    $('scCurrentTitle').textContent = MUSIC_TRACKS[save.audio.track];
    const art = $('scCurrentArt');
    if (art.dataset.track !== String(save.audio.track)) {
      art.replaceChildren(createTrackCover(save.audio.track, 'sc-current-cover'));
      art.dataset.track = String(save.audio.track);
    }
    $('scVolume').value = save.audio.volume;
    $('scVolumeLabel').textContent = `${save.audio.volume}%`;
    $('scMute').textContent = save.audio.muted || save.audio.volume === 0 ? '🔇' : '🔊';
    $('scMute').classList.toggle('active', save.audio.muted);
    $('scShuffle').classList.toggle('active', save.audio.shuffle);
    $('scShuffle').setAttribute('aria-pressed', String(save.audio.shuffle));
    $('scMute').setAttribute('aria-pressed', String(save.audio.muted));
    $('scPlay').textContent = scAudio.paused ? '▶' : 'Ⅱ';
    $('scPlay').setAttribute('aria-label', scAudio.paused ? 'Відтворити' : 'Пауза');
    scAudio.volume = save.audio.volume / 100;
    scAudio.muted = save.audio.muted;
    updateScProgress();
  }

  function updateScProgress() {
    $('scElapsed').textContent = scTime(scAudio.currentTime);
    $('scDuration').textContent = scTime(scAudio.duration);
    const valid = Number.isFinite(scAudio.duration) && scAudio.duration > 0;
    $('scSeek').disabled = !valid;
    $('scSeek').value = valid ? String((scAudio.currentTime / scAudio.duration) * 100) : '0';
  }

  function selectScTrack(index, play = false) {
    if (index < 0 || index >= MUSIC_TRACKS.length) return;
    save.audio.track = index;
    scFallbackIndex = 0;
    scCurrentTrack = index;
    scUserPaused = !play;
    scAudio.src = scPath(index);
    scAudio.load();
    persist();
    $('scStatus').textContent = 'Завантаження треку…';
    renderSoundcloud();
    if (play) playScAudio();
  }

  function playScAudio() {
    if (scCurrentTrack !== save.audio.track) selectScTrack(save.audio.track, false);
    scUserPaused = false;
    const request = scAudio.play();
    if (request && typeof request.catch === 'function') {
      request.catch(() => {
        // src can change during rapid track switching; error event handles missing files.
        if (scAudio.error) $('scStatus').textContent = 'Не вдається відтворити файл. Перевір папку music/ та назви mp3(1).mp3 … mp3(5).mp3';
        renderSoundcloud();
      });
    }
  }

  function scAdvance(direction) {
    const last = save.audio.track;
    const next = save.audio.shuffle && MUSIC_TRACKS.length > 1
      ? pick(MUSIC_TRACKS.map((_, i) => i).filter(i => i !== last))
      : (last + direction + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    selectScTrack(next, true);
  }

  $('scPlay').addEventListener('click', () => {
    if (!scAudio.paused) {
      scUserPaused = true;
      scAudio.pause();
    } else playScAudio();
  });
  $('scPrevious').addEventListener('click', () => {
    if (scAudio.currentTime > 3) {scAudio.currentTime=0;return;}
    scAdvance(-1);
  });
  $('scNext').addEventListener('click', () => scAdvance(1));
  $('scShuffle').addEventListener('click', () => {save.audio.shuffle = !save.audio.shuffle; persist(); renderSoundcloud();});
  $('scMute').addEventListener('click', () => {save.audio.muted = !save.audio.muted; persist(); renderSoundcloud();});
  $('scVolume').addEventListener('input', (event) => {
    save.audio.volume = clamp(Number(event.target.value) || 0,0,100);
    scAudio.volume = save.audio.volume/100;
    $('scVolumeLabel').textContent = `${save.audio.volume}%`;
    renderSoundcloud();
  });
  $('scVolume').addEventListener('change', persist);
  $('scSeek').addEventListener('input', (event) => {
    if (Number.isFinite(scAudio.duration) && scAudio.duration > 0)
      scAudio.currentTime = scAudio.duration * Number(event.target.value) / 100;
  });
  scAudio.addEventListener('timeupdate', updateScProgress);
  scAudio.addEventListener('loadedmetadata', updateScProgress);
  scAudio.addEventListener('play', () => {$('scStatus').textContent='Відтворення';renderSoundcloud();});
  scAudio.addEventListener('pause', () => {if(scUserPaused) $('scStatus').textContent='Пауза';renderSoundcloud();});
  scAudio.addEventListener('ended', () => scAdvance(1));
  scAudio.addEventListener('error', () => {
    if (scCurrentTrack < 0) return;
    if (scFallbackIndex < scPaths(scCurrentTrack).length - 1) {
      scFallbackIndex++;
      scAudio.src = scPath(scCurrentTrack, scFallbackIndex);
      scAudio.load();
      if (!scUserPaused) scAudio.play().catch(() => {});
    } else {
      scUserPaused = true;
      $('scStatus').textContent = `Файл music/mp3(${scCurrentTrack + 1}).mp3 не знайдено`;
      renderSoundcloud();
    }
  });

  function updatePhoneTime() {
    $('phoneTime').textContent = new Date().toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'});
  }

  function init() {
    showSaveNotice(saveNotice);
    ensureOrder();
    ensureMarket();
    persist(); // Commit sanitized data and restore a damaged main save from the backup.
    rememberStart();
    resetBrick();
    randomizeLasers();
    updateUI();
    updatePhoneTime();
    updatePcClock();
    renderSoundcloud();
    setInterval(() => {
      updatePcClock();
      updatePhoneTime();
      if (!$('tgMarketPanel').classList.contains('hidden')) updateMarketRefreshButton();
      if (!$('tgInventoryPanel').classList.contains('hidden')) renderInventory();
    }, 1000);
  }

  window.addEventListener('resize', () => {
    const newLayout = window.matchMedia('(max-width: 760px)').matches;
    if (newLayout !== mobileLayout) {
      mobileLayout = newLayout;
      randomizeLasers(); // Rebuild only on desktop/mobile breakpoint crossing.
    }
    if (dragging) stopDrag();
    rememberStart();
    resetBrick();
  });

  init();
})();
