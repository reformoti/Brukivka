(() => {
  'use strict';if(window.BrukDevice?.blocked)return;
  const sidebar=document.querySelector('.chess-sidebar'),menu=document.createElement('div');menu.className='chess-menu-actions';
  function panel(title,selector){const d=document.createElement('dialog');d.className='chess-menu-dialog';const h=document.createElement('header'),name=document.createElement('h2'),close=document.createElement('button');name.textContent=title;close.type='button';close.textContent='✕';close.setAttribute('aria-label','Закрити');close.onclick=()=>d.close();h.append(name,close);d.append(h);for(const node of document.querySelectorAll(selector))d.append(node);document.body.append(d);const open=document.createElement('button');open.type='button';open.textContent=title;open.onclick=()=>d.showModal();menu.append(open);return d;}
  panel('Нова партія та налаштування','.session-card,.board-tools');const history=panel('Історія ходів','.history-card');panel('Підказки','.chess-help');sidebar.prepend(menu);
  const list=document.getElementById('moveHistory');function paginate(){window.BrukFit.pages(list,':scope>.move-pair',10);}new MutationObserver(paginate).observe(list,{childList:true});paginate();
})();
