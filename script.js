const board = document.getElementById('gameBoard');
const brick = document.getElementById('brukivka');
const pocket = document.getElementById('pocket');
const lasers = [...document.querySelectorAll('.laser')];
const balanceEl = document.getElementById('balance');
const topBalanceCard = document.getElementById('topBalanceCard');
const statusMessage = document.getElementById('statusMessage');
const taunt = document.getElementById('taunt');

const phoneOverlay = document.getElementById('phoneOverlay');
const phoneButton = document.getElementById('phoneButton');
const closePhone = document.getElementById('closePhone');
const phoneTime = document.getElementById('phoneTime');
const phoneHomeButton = document.getElementById('phoneHomeButton');
const bankApp = document.getElementById('bankApp');
const znoApp = document.getElementById('znoApp');
const bankScreen = document.getElementById('bankScreen');
const znoScreen = document.getElementById('znoScreen');
const phoneHome = document.getElementById('phoneHome');
const quizScreen = document.getElementById('quizScreen');
const quizResultScreen = document.getElementById('quizResultScreen');

const STORAGE_KEY = 'brukivkaPrototypeSave_v2';
const OLD_STORAGE_KEY = 'brukivkaPrototypeSave_v1';

const mathScale = {5:100,6:108,7:115,8:123,9:131,10:134,11:137,12:140,13:143,14:145,15:147,16:148,17:149,18:150,19:151,20:152,21:155,22:159,23:163,24:167,25:170,26:173,27:176,28:180,29:184,30:189,31:194,32:200};
const englishScale = {5:100,6:109,7:118,8:125,9:131,10:134,11:137,12:140,13:143,14:145,15:147,16:148,17:149,18:150,19:151,20:152,21:153,22:155,23:157,24:159,25:162,26:166,27:169,28:173,29:179,30:185,31:191,32:200};

const tiers = [
  {material:'Звичайна', phone:'iPhone 3G', reward:100, cost:2500, color:['#969aa5','#565b66']},
  {material:"Кам'яна", phone:'iPhone 3GS', reward:130, cost:4000, color:['#777c86','#3f434c']},
  {material:'Гранітна', phone:'iPhone 4', reward:170, cost:6000, color:['#85818a','#4c4852']},
  {material:'Мармурова', phone:'iPhone 5', reward:220, cost:8500, color:['#ddd7cf','#8f8a84']},
  {material:'Сталева', phone:'iPhone 6', reward:290, cost:12000, color:['#aeb6c2','#5b6470']},
  {material:'Титанова', phone:'iPhone 7', reward:380, cost:16000, color:['#a0a9b2','#555f6b']},
  {material:'Срібна', phone:'iPhone 8', reward:500, cost:20000, color:['#e0e3e8','#858b95']},
  {material:'Золота', phone:'iPhone X', reward:650, cost:25000, color:['#f1cc67','#987028']},
  {material:'Платинова', phone:'iPhone 11', reward:850, cost:30000, color:['#d8e3e8','#778b94']},
  {material:'Смарагдова', phone:'iPhone 12', reward:1100, cost:35000, color:['#51d39a','#146144']},
  {material:'Сапфірова', phone:'iPhone 13', reward:1450, cost:42000, color:['#4b8dff','#183b86']},
  {material:'Рубінова', phone:'iPhone 14', reward:1900, cost:50000, color:['#f45d78','#821d36']},
  {material:'Алмазна', phone:'iPhone 15', reward:2500, cost:58000, color:['#dff7ff','#6ab5ca']},
  {material:'Діамантова', phone:'iPhone 16', reward:3300, cost:68000, color:['#f4f0ff','#8878b2']},
  {material:'Неонова', phone:'iPhone 17', reward:4300, cost:80000, color:['#b6ff59','#2f8a19']},
  {material:'Легендарна', phone:'iPhone 18', reward:6000, cost:null, color:['#ffb45e','#9b315e']}
];

const taunts = ['КУДА?!','БАЦ ФАНЕРА','БРУКІВКУ НЕ КРАСТЬ'];

const mathQuestions = [
  ['Скільки буде 7 + 8?', ['13','14','15','16'], 2],
  ['Розв’яжи: 3x − 5 = 16.', ['5','6','7','8'], 2],
  ['25% від 200 дорівнює…', ['25','40','50','75'], 2],
  ['√81 = ?', ['7','8','9','10'], 2],
  ['2⁵ = ?', ['10','16','25','32'], 3],
  ['Площа трикутника з основою 10 і висотою 6 дорівнює…', ['16','30','60','80'], 1],
  ['Додатний розв’язок рівняння x² = 49.', ['5','6','7','8'], 2],
  ['0,75 у вигляді звичайного дробу — це…', ['1/2','2/3','3/4','4/5'], 2],
  ['Середнє арифметичне чисел 4, 8 і 12.', ['6','8','10','12'], 1],
  ['Периметр прямокутника зі сторонами 5 і 3.', ['8','15','16','30'], 2],
  ['Розв’яжи: 2x + 3 = 11.', ['3','4','5','7'], 1],
  ['Ймовірність випадання герба при одному підкиданні чесної монети.', ['1/4','1/3','1/2','1'], 2],
  ['15% від 300 дорівнює…', ['30','35','45','60'], 2],
  ['Довжина кола радіуса 3.', ['3π','6π','9π','12π'], 1],
  ['Кутовий коефіцієнт прямої через точки (0;2) і (2;6).', ['1','2','3','4'], 1],
  ['log₁₀(1000) = ?', ['2','3','10','100'], 1],
  ['sin 30° = ?', ['0','1/2','√2/2','1'], 1],
  ['Наступне число: 2, 5, 8, 11, …', ['12','13','14','15'], 2],
  ['3/4 + 1/4 = ?', ['1/2','3/4','1','5/4'], 2],
  ['|−7| = ?', ['−7','0','7','14'], 2],
  ['5! = ?', ['25','60','100','120'], 3],
  ['Якщо x + y = 10 і x − y = 2, то x = ?', ['4','5','6','8'], 2],
  ['Діагональ квадрата зі стороною 4.', ['4','4√2','8','8√2'], 1],
  ['2/3 від 18 дорівнює…', ['6','9','12','15'], 2],
  ['Похідна функції y = x².', ['x','2x','x²/2','2'], 1],
  ['∫2x dx = ?', ['2x² + C','x² + C','x + C','2 + C'], 1],
  ['Корені рівняння x² − 5x + 6 = 0.', ['1 і 6','2 і 3','−2 і −3','3 і 5'], 1],
  ['1 км дорівнює…', ['100 м','500 м','1000 м','10 000 м'], 2],
  ['Об’єм куба з ребром 3.', ['9','18','27','36'], 2],
  ['tan 45° = ?', ['0','1/2','1','√3'], 2],
  ['4⁰ = ?', ['0','1','4','16'], 1],
  ['Товар коштував 500 грн. Після знижки 30% його ціна…', ['150','300','350','470'], 2]
];

const englishQuestions = [
  ['I ___ to school every day.', ['go','goes','went','going'], 0],
  ['Yesterday she ___ to the cinema.', ['go','goes','went','gone'], 2],
  ['They ___ football now.', ['play','played','are playing','plays'], 2],
  ['He has lived here ___ 2020.', ['for','since','from','at'], 1],
  ['Choose the synonym of “big”.', ['small','large','slow','short'], 1],
  ['There ___ two books on the table.', ['is','are','was','be'], 1],
  ['If it rains, we ___ at home.', ['stay','stayed','will stay','staying'], 2],
  ['My sister is ___ than me.', ['tall','taller','tallest','more tall'], 1],
  ['I have never ___ to London.', ['be','was','been','being'], 2],
  ['Could you ___ the window, please?', ['open','opened','opening','opens'], 0],
  ['This book ___ by many students.', ['reads','is read','read','is reading'], 1],
  ['We ___ dinner when he called.', ['had','were having','have','are having'], 1],
  ['Choose the opposite of “cheap”.', ['expensive','easy','weak','empty'], 0],
  ['She is interested ___ music.', ['on','at','in','for'], 2],
  ['How ___ water do you drink?', ['many','much','few','several'], 1],
  ['There aren’t ___ apples left.', ['some','any','much','a'], 1],
  ['I ___ my homework already.', ['finish','finished','have finished','am finishing'], 2],
  ['He asked me where I ___.', ['live','lived','will live','am living'], 1],
  ['The train arrives ___ 8:30.', ['in','on','at','by'], 2],
  ['Choose the correct word: “I’m looking ___ my keys.”', ['at','for','after','to'], 1],
  ['If I ___ more time, I would learn Spanish.', ['have','had','will have','having'], 1],
  ['The film was ___ than I expected.', ['good','better','best','more good'], 1],
  ['You ___ wear a seat belt in a car.', ['must','might','could','would'], 0],
  ['She speaks English very ___.', ['good','well','best','better'], 1],
  ['We have known each other ___ five years.', ['since','for','at','from'], 1],
  ['By next week, I ___ the project.', ['finish','finished','will have finished','am finish'], 2],
  ['Choose the noun: “decide / decision / decisive / decisively”.', ['decide','decision','decisive','decisively'], 1],
  ['Neither Tom nor Anna ___ at home.', ['are','is','be','were'], 1],
  ['I wish I ___ fly.', ['can','could','will','must'], 1],
  ['The man ___ lives next door is a doctor.', ['which','who','where','whose'], 1],
  ['“Could you help me?” — “Yes, of ___.”', ['course','cause','surely','right'], 0],
  ['Choose the correct sentence.', ['She don’t like coffee.','She doesn’t likes coffee.','She doesn’t like coffee.','She not like coffee.'], 2]
];

function defaultSave(){return {balance:0,tier:0,tests:{math:0,english:0}}}
function loadSave(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw) return {...defaultSave(),...JSON.parse(raw),tests:{...defaultSave().tests,...JSON.parse(raw).tests}};
    const old=localStorage.getItem(OLD_STORAGE_KEY);
    if(old){const o=JSON.parse(old);return {balance:Number(o.balance)||0,tier:Math.max(0,Math.min(15,(Number(o.level)||1)-1)),tests:{math:0,english:0}}}
  }catch(e){}
  return defaultSave();
}
let save=loadSave();
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(save))}

function scaledScore(subject,raw){const scale=subject==='math'?mathScale:englishScale;return scale[raw]||0}
function bestNmt(){return Math.max(scaledScore('math',save.tests.math),scaledScore('english',save.tests.english))}
function nmtMultiplier(score){if(score<100)return 1;if(score===200)return 11;return 1+Math.floor((score-100)/10)*0.5}
function currentTier(){return tiers[Math.max(0,Math.min(15,save.tier))]}
function currentReward(){return Math.round(currentTier().reward*nmtMultiplier(bestNmt()))}
function fmtScore(v){return v>=100?String(v):'—'}
function setBalanceStyle(el){el.classList.toggle('negative',save.balance<0);el.classList.toggle('positive',save.balance>=0)}

function updateUI(){
  const tier=currentTier(), nmt=bestNmt(), mult=nmtMultiplier(nmt), reward=currentReward();
  balanceEl.textContent=save.balance.toLocaleString('uk-UA');
  document.getElementById('bankBalance').textContent=save.balance.toLocaleString('uk-UA');
  setBalanceStyle(topBalanceCard);setBalanceStyle(document.getElementById('bankBalanceCard'));
  document.getElementById('brickNameText').textContent=tier.material;
  document.getElementById('brickBoardName').textContent=`${tier.material} Бруківка`;
  document.getElementById('baseRewardText').textContent=tier.reward.toLocaleString('uk-UA');
  document.getElementById('multiplierText').textContent=`×${mult.toFixed(1)}`;
  document.getElementById('finalRewardText').textContent=reward.toLocaleString('uk-UA');
  document.getElementById('homeNmtScore').textContent=fmtScore(nmt);
  document.getElementById('homeMultiplier').textContent=`×${mult.toFixed(1)} до Бруківки`;
  document.getElementById('znoBestScore').textContent=fmtScore(nmt);
  document.getElementById('znoBonusText').textContent=`Множник Бруківки ×${mult.toFixed(1)}`;
  document.getElementById('mathRaw').textContent=`${save.tests.math}/32`;
  document.getElementById('mathNmt').textContent=fmtScore(scaledScore('math',save.tests.math));
  document.getElementById('englishRaw').textContent=`${save.tests.english}/32`;
  document.getElementById('englishNmt').textContent=fmtScore(scaledScore('english',save.tests.english));
  document.getElementById('bankBrickName').textContent=tier.material;
  document.getElementById('phoneModelName').textContent=tier.phone;
  document.getElementById('upgradeLevel').textContent=save.tier;
  document.getElementById('bankReward').textContent=tier.reward.toLocaleString('uk-UA');
  document.getElementById('bankMultiplier').textContent=`×${mult.toFixed(1)}`;
  document.getElementById('nextBrickName').textContent=save.tier<15?tiers[save.tier+1].material:'МАКСИМУМ';
  const btn=document.getElementById('upgradeButton');
  if(save.tier>=15){btn.disabled=true;btn.innerHTML='Максимальна прокачка';}
  else{btn.innerHTML=`Прокачати — <span id="upgradeCost">${tier.cost.toLocaleString('uk-UA')}</span> UAH`;btn.disabled=save.balance<tier.cost;}
  brick.style.background=`linear-gradient(145deg,${tier.color[0]},${tier.color[1]})`;
}

function rectsOverlap(a,b,p=0){return !(a.right-p<=b.left+p||a.left+p>=b.right-p||a.bottom-p<=b.top+p||a.top+p>=b.bottom-p)}
let dragging=false,activePointerId=null,offsetX=0,offsetY=0,startPosition=null,isResetting=false;
function rememberStartPosition(){const br=board.getBoundingClientRect(),rr=brick.getBoundingClientRect();startPosition={x:rr.left-br.left,y:rr.top-br.top}}
function setBrickPosition(x,y){const br=board.getBoundingClientRect(),rr=brick.getBoundingClientRect();brick.style.left=`${Math.max(0,Math.min(x,br.width-rr.width))}px`;brick.style.top=`${Math.max(0,Math.min(y,br.height-rr.height))}px`}
function resetBrick(){if(!startPosition)rememberStartPosition();setBrickPosition(startPosition.x,startPosition.y)}
function setStatus(text,type=''){statusMessage.textContent=text;statusMessage.classList.remove('good','bad');if(type)statusMessage.classList.add(type)}
function rand(min,max){return Math.random()*(max-min)+min}
function randomizeLasers(){
  const mobile=window.innerWidth<=760;
  const configs=mobile?[
    {v:false,l:[8,24],t:[28,38],s:[34,56]},{v:true,l:[28,45],t:[34,48],s:[19,28]},
    {v:false,l:[42,58],t:[49,61],s:[28,45]},{v:true,l:[63,78],t:[54,66],s:[16,24]},
    {v:false,l:[8,28],t:[69,80],s:[34,55]}
  ]:[
    {v:false,l:[21,31],t:[15,29],s:[18,29]},{v:true,l:[36,50],t:[28,42],s:[18,30]},
    {v:false,l:[43,58],t:[52,66],s:[19,31]},{v:true,l:[63,75],t:[17,36],s:[19,31]},
    {v:false,l:[25,43],t:[72,82],s:[18,30]}
  ];
  lasers.forEach((laser,i)=>{const c=configs[i];laser.classList.toggle('vertical',c.v);laser.style.left=`${rand(...c.l)}%`;laser.style.top=`${rand(...c.t)}%`;if(c.v){laser.style.height=`${rand(...c.s)}%`;laser.style.width='5px'}else{laser.style.width=`${rand(...c.s)}%`;laser.style.height='5px'}});
}
function showTaunt(){const phrase=taunts[Math.floor(Math.random()*taunts.length)];taunt.innerHTML=`${phrase}<span>−500 UAH</span>`;taunt.classList.remove('hidden');void taunt.offsetWidth;setTimeout(()=>taunt.classList.add('hidden'),760)}
function hitLaser(){if(isResetting)return;isResetting=true;dragging=false;brick.classList.remove('dragging');save.balance-=500;persist();updateUI();showTaunt();setStatus('Лазер! −500 UAH. Маршрут уже інший.','bad');board.classList.remove('board-hit');void board.offsetWidth;board.classList.add('board-hit');setTimeout(()=>{resetBrick();randomizeLasers();isResetting=false},350)}
function delivered(){if(isResetting)return;isResetting=true;dragging=false;brick.classList.remove('dragging');const reward=currentReward();save.balance+=reward;persist();updateUI();setStatus(`У Кармані! +${reward.toLocaleString('uk-UA')} UAH`,'good');setTimeout(()=>{resetBrick();randomizeLasers();setStatus('Новий маршрут. Поїхали →');isResetting=false},520)}
function checkCollisions(){const rr=brick.getBoundingClientRect();for(const l of lasers){if(rectsOverlap(rr,l.getBoundingClientRect(),3)){hitLaser();return}}if(rectsOverlap(rr,pocket.getBoundingClientRect(),12))delivered()}
brick.addEventListener('pointerdown',e=>{if(isResetting)return;dragging=true;activePointerId=e.pointerId;brick.setPointerCapture(e.pointerId);brick.classList.add('dragging');const r=brick.getBoundingClientRect();offsetX=e.clientX-r.left;offsetY=e.clientY-r.top});
brick.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==activePointerId||isResetting)return;const br=board.getBoundingClientRect();setBrickPosition(e.clientX-br.left-offsetX,e.clientY-br.top-offsetY);checkCollisions()});
function finishDrag(e){if(e.pointerId!==activePointerId)return;dragging=false;activePointerId=null;brick.classList.remove('dragging')}
brick.addEventListener('pointerup',finishDrag);brick.addEventListener('pointercancel',finishDrag);

function hidePhoneScreens(){[phoneHome,bankScreen,znoScreen,quizScreen,quizResultScreen].forEach(x=>x.classList.add('hidden'))}
function showPhoneHome(){hidePhoneScreens();phoneHome.classList.remove('hidden');updateUI()}
function showBank(){hidePhoneScreens();bankScreen.classList.remove('hidden');document.getElementById('upgradeHint').textContent='';updateUI()}
function showZno(){hidePhoneScreens();znoScreen.classList.remove('hidden');updateUI()}
phoneButton.addEventListener('click',()=>{phoneOverlay.classList.remove('hidden');showPhoneHome();updatePhoneTime()});
closePhone.addEventListener('click',()=>phoneOverlay.classList.add('hidden'));
phoneOverlay.addEventListener('click',e=>{if(e.target===phoneOverlay)phoneOverlay.classList.add('hidden')});
phoneHomeButton.addEventListener('click',showPhoneHome);bankApp.addEventListener('click',showBank);znoApp.addEventListener('click',showZno);
document.querySelector('.bankBack').addEventListener('click',showPhoneHome);document.querySelector('.znoBack').addEventListener('click',showPhoneHome);

document.getElementById('upgradeButton').addEventListener('click',()=>{if(save.tier>=15)return;const t=currentTier(),hint=document.getElementById('upgradeHint');if(save.balance<t.cost){hint.textContent='Недостатньо UAH';return}save.balance-=t.cost;save.tier++;persist();updateUI();hint.textContent=`Тепер у тебе ${currentTier().material} Бруківка — ${currentTier().phone}`});

let quiz={subject:null,questions:[],index:0,correct:0,answered:false};
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function startQuiz(subject){quiz={subject,questions:shuffle([...(subject==='math'?mathQuestions:englishQuestions)]),index:0,correct:0,answered:false};hidePhoneScreens();quizScreen.classList.remove('hidden');renderQuestion()}
document.querySelectorAll('.subject-start').forEach(b=>b.addEventListener('click',()=>startQuiz(b.dataset.subject)));
document.getElementById('quizBack').addEventListener('click',showZno);
function renderQuestion(){
  const q=quiz.questions[quiz.index];quiz.answered=false;
  document.getElementById('quizSubjectTitle').textContent=quiz.subject==='math'?'Математика':'Англійська мова';
  document.getElementById('quizProgress').textContent=`${quiz.index+1}/32`;
  document.getElementById('questionLabel').textContent=`ПИТАННЯ ${quiz.index+1}`;
  document.getElementById('questionText').textContent=q[0];
  document.getElementById('quizRawScore').textContent=quiz.correct;
  document.getElementById('quizNmtScore').textContent=fmtScore(scaledScore(quiz.subject,quiz.correct));
  const answers=document.getElementById('answers');answers.innerHTML='';
  q[1].forEach((txt,i)=>{const b=document.createElement('button');b.className='answer-btn';b.textContent=`${String.fromCharCode(65+i)}. ${txt}`;b.addEventListener('click',()=>answerQuestion(i,b));answers.appendChild(b)});
  document.getElementById('nextQuestion').classList.add('hidden');
}
function answerQuestion(index,btn){
  if(quiz.answered)return;quiz.answered=true;const q=quiz.questions[quiz.index],buttons=[...document.querySelectorAll('.answer-btn')];
  buttons.forEach(b=>b.disabled=true);buttons[q[2]].classList.add('correct');
  if(index===q[2]){quiz.correct++;if(quiz.correct>save.tests[quiz.subject]){save.tests[quiz.subject]=quiz.correct;persist();updateUI()}}else btn.classList.add('wrong');
  document.getElementById('quizRawScore').textContent=quiz.correct;document.getElementById('quizNmtScore').textContent=fmtScore(scaledScore(quiz.subject,quiz.correct));
  const next=document.getElementById('nextQuestion');next.textContent=quiz.index===31?'Результат':'Далі';next.classList.remove('hidden');
}
document.getElementById('nextQuestion').addEventListener('click',()=>{if(!quiz.answered)return;if(quiz.index>=31){showQuizResult();return}quiz.index++;renderQuestion()});
function showQuizResult(){hidePhoneScreens();quizResultScreen.classList.remove('hidden');const score=scaledScore(quiz.subject,quiz.correct);document.getElementById('resultSubject').textContent=quiz.subject==='math'?'Математика':'Англійська мова';document.getElementById('resultNmt').textContent=fmtScore(score);document.getElementById('resultRaw').textContent=quiz.correct;document.getElementById('resultMultiplier').textContent=`Поточний бонус до Бруківки: ×${nmtMultiplier(bestNmt()).toFixed(1)}`;updateUI()}
document.getElementById('resultHome').addEventListener('click',showZno);document.querySelector('.resultBack').addEventListener('click',showZno);

function updatePhoneTime(){const now=new Date();phoneTime.textContent=now.toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'})}
window.addEventListener('resize',()=>requestAnimationFrame(()=>{rememberStartPosition();resetBrick();randomizeLasers()}));
window.addEventListener('load',()=>requestAnimationFrame(()=>{rememberStartPosition();resetBrick();randomizeLasers();updateUI();updatePhoneTime()}));
