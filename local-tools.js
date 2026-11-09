(()=>{
  'use strict';if(window.BrukDevice?.blocked)return;
  const $=id=>document.getElementById(id),entry=$('accountToolsEntry');if(!entry)return;
  const shell=$('phoneShell'),overlay=$('phoneOverlay'),screen=document.createElement('section');screen.id='localToolsScreen';screen.className='phone-screen hidden';
  screen.innerHTML='<div class="screen-header"><button id="localToolsBack" class="icon-button" type="button" aria-label="Назад до акаунта">‹</button><span>Бруківка · локальні інструменти</span></div><div class="local-tools-body"><div id="brukivkaTools"><button type="button" data-local-tool="add100m">Додати 100 млн</button><button type="button" data-local-tool="add500k">Додати 500 тис.</button><button type="button" data-local-tool="maxUpgrades">Повна прокачка</button><button type="button" data-local-tool="maxNmt">Максимум НМТ</button><button type="button" data-local-tool="unlockAll">Відкрити всі покупки</button><button type="button" class="danger" data-local-tool="reset">Повністю скинути прогрес</button></div><p id="localToolsStatus" role="status"></p></div>';
  shell.append(screen);
  function orient(){shell.classList.toggle('phone-tools-wide',!screen.classList.contains('hidden')&&!overlay.classList.contains('hidden'));}
  function show(target){document.querySelectorAll('.phone-screen').forEach(s=>s.classList.toggle('hidden',s!==target));orient();}
  function note(text){$('localToolsStatus').textContent=text;}
  entry.onclick=()=>{show(screen);note('Зміни стосуються Бруківки на цьому пристрої.');};
  $('localToolsBack').onclick=()=>show($('accountScreen'));
  const observer=new MutationObserver(orient);for(const target of [screen,overlay])observer.observe(target,{attributes:true,attributeFilter:['class']});
  screen.querySelectorAll('[data-local-tool]').forEach(b=>b.onclick=()=>{try{const ok=window.BrukLocalTools.apply(b.dataset.localTool);note(ok?'Готово.':b.dataset.localTool==='reset'?'Скидання скасовано.':'Не виконано.');}catch(e){note(e.message);}});
})();
