const board = document.getElementById("gameBoard");
const brick = document.getElementById("brukivka");
const pocket = document.getElementById("pocket");
const lasers = [...document.querySelectorAll(".laser")];
const balanceEl = document.getElementById("balance");
const levelText = document.getElementById("levelText");
const rewardText = document.getElementById("rewardText");
const statusMessage = document.getElementById("statusMessage");
const phoneOverlay = document.getElementById("phoneOverlay");
const phoneButton = document.getElementById("phoneButton");
const closePhone = document.getElementById("closePhone");
const phoneHome = document.getElementById("phoneHome");
const bankScreen = document.getElementById("bankScreen");
const bankApp = document.getElementById("bankApp");
const bankBack = document.getElementById("bankBack");
const phoneHomeButton = document.getElementById("phoneHomeButton");
const phoneTime = document.getElementById("phoneTime");
const bankBalance = document.getElementById("bankBalance");
const bankLevel = document.getElementById("bankLevel");
const bankReward = document.getElementById("bankReward");
const upgradeCostEl = document.getElementById("upgradeCost");
const upgradeButton = document.getElementById("upgradeButton");
const upgradeHint = document.getElementById("upgradeHint");

const STORAGE_KEY = "brukivkaPrototypeSave_v1";
let save = loadSave();
let dragging = false;
let activePointerId = null;
let offsetX = 0;
let offsetY = 0;
let startPosition = null;
let isResetting = false;

function defaultSave(){ return { balance:0, level:1 }; }
function loadSave(){ try { const raw=localStorage.getItem(STORAGE_KEY); return raw ? {...defaultSave(),...JSON.parse(raw)} : defaultSave(); } catch { return defaultSave(); } }
function persist(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(save)); }
function rewardForLevel(level){ return 10 + (level-1)*5; }
function upgradeCost(level){ return Math.round(100*Math.pow(1.55,level-1)); }

function updateUI(){
  const reward=rewardForLevel(save.level), cost=upgradeCost(save.level);
  balanceEl.textContent=save.balance; levelText.textContent=save.level; rewardText.textContent=reward;
  bankBalance.textContent=save.balance; bankLevel.textContent=save.level; bankReward.textContent=reward; upgradeCostEl.textContent=cost;
  upgradeButton.disabled=save.balance<cost;
}

function rectsOverlap(a,b,padding=0){ return !(a.right-padding<=b.left+padding || a.left+padding>=b.right-padding || a.bottom-padding<=b.top+padding || a.top+padding>=b.bottom-padding); }

function rememberStartPosition(){
  const boardRect=board.getBoundingClientRect(), brickRect=brick.getBoundingClientRect();
  startPosition={x:brickRect.left-boardRect.left,y:brickRect.top-boardRect.top};
}

function setBrickPosition(x,y){
  const boardRect=board.getBoundingClientRect(), brickRect=brick.getBoundingClientRect();
  const maxX=boardRect.width-brickRect.width, maxY=boardRect.height-brickRect.height;
  brick.style.left=`${Math.max(0,Math.min(x,maxX))}px`;
  brick.style.top=`${Math.max(0,Math.min(y,maxY))}px`;
}

function setStatus(text,type=""){ statusMessage.textContent=text; statusMessage.classList.remove("good","bad"); if(type)statusMessage.classList.add(type); }

function hitLaser(){
  if(isResetting)return;
  isResetting=true; dragging=false; brick.classList.remove("dragging");
  setStatus("Лазер! Бруківка повертається на старт","bad");
  board.classList.remove("board-hit"); void board.offsetWidth; board.classList.add("board-hit");
  setTimeout(()=>{ resetBrick(); setStatus("Спробуй інший маршрут →"); isResetting=false; },340);
}

function delivered(){
  if(isResetting)return;
  isResetting=true; dragging=false; brick.classList.remove("dragging");
  const reward=rewardForLevel(save.level); save.balance+=reward; persist(); updateUI();
  setStatus(`У Кармані! +${reward} UAH`,"good");
  setTimeout(()=>{ resetBrick(); setStatus("Ще одну? →"); isResetting=false; },520);
}

function resetBrick(){ if(!startPosition)rememberStartPosition(); setBrickPosition(startPosition.x,startPosition.y); }

function checkCollisions(){
  const brickRect=brick.getBoundingClientRect();
  for(const laser of lasers){ if(rectsOverlap(brickRect,laser.getBoundingClientRect(),3)){ hitLaser(); return; } }
  if(rectsOverlap(brickRect,pocket.getBoundingClientRect(),12)) delivered();
}

brick.addEventListener("pointerdown",event=>{
  if(isResetting)return;
  dragging=true; activePointerId=event.pointerId; brick.setPointerCapture(event.pointerId); brick.classList.add("dragging");
  const rect=brick.getBoundingClientRect(); offsetX=event.clientX-rect.left; offsetY=event.clientY-rect.top;
});

brick.addEventListener("pointermove",event=>{
  if(!dragging || event.pointerId!==activePointerId || isResetting)return;
  const boardRect=board.getBoundingClientRect();
  setBrickPosition(event.clientX-boardRect.left-offsetX,event.clientY-boardRect.top-offsetY);
  checkCollisions();
});

function finishDrag(event){ if(event.pointerId!==activePointerId)return; dragging=false; activePointerId=null; brick.classList.remove("dragging"); }
brick.addEventListener("pointerup",finishDrag); brick.addEventListener("pointercancel",finishDrag);

phoneButton.addEventListener("click",()=>{ phoneOverlay.classList.remove("hidden"); showPhoneHome(); updatePhoneTime(); updateUI(); });
closePhone.addEventListener("click",()=>phoneOverlay.classList.add("hidden"));
phoneOverlay.addEventListener("click",event=>{ if(event.target===phoneOverlay)phoneOverlay.classList.add("hidden"); });
function showPhoneHome(){ bankScreen.classList.add("hidden"); phoneHome.classList.remove("hidden"); }
function showBank(){ phoneHome.classList.add("hidden"); bankScreen.classList.remove("hidden"); upgradeHint.textContent=""; updateUI(); }
bankApp.addEventListener("click",showBank); bankBack.addEventListener("click",showPhoneHome); phoneHomeButton.addEventListener("click",showPhoneHome);

upgradeButton.addEventListener("click",()=>{
  const cost=upgradeCost(save.level);
  if(save.balance<cost){ upgradeHint.textContent="Недостатньо UAH"; return; }
  save.balance-=cost; save.level+=1; persist(); updateUI(); upgradeHint.textContent=`Бруківка прокачана до Lv.${save.level}`;
});

function updatePhoneTime(){ const now=new Date(); phoneTime.textContent=now.toLocaleTimeString("uk-UA",{hour:"2-digit",minute:"2-digit"}); }
window.addEventListener("resize",()=>requestAnimationFrame(()=>{ rememberStartPosition(); resetBrick(); }));
window.addEventListener("load",()=>requestAnimationFrame(()=>{ rememberStartPosition(); resetBrick(); updateUI(); updatePhoneTime(); }));
