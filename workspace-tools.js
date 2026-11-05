(() => {
  'use strict';if(window.BrukDevice?.blocked)return;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n;};
  function extra(root,key,title,nodes){if(!nodes.length)return;const old=document.getElementById('extra-'+key),wasOpen=old?.open;old?.remove();const dialog=el('dialog','os-dialog workspace-extra');dialog.id='extra-'+key;const head=el('header','os-dialog-head'),close=el('button','','✕');close.type='button';close.onclick=()=>dialog.close();head.append(el('h2','',title),close);dialog.append(head,...nodes);document.body.append(dialog);const button=el('button','workspace-extra-button',title);button.type='button';button.onclick=()=>dialog.showModal();root.append(button);if(wasOpen)dialog.showModal();}
  function prepare(root,id){root.dataset.workspace=id;
    if(id==='paint'){const editor=root.querySelector('.paint-editor'),gallery=editor?.querySelector('.paint-editor-heading>button');if(gallery)editor.querySelector('.paint-file-bar').append(gallery);}
    if(id==='gallery'){root.querySelectorAll('.paint-gallery').forEach(n=>window.BrukFit.pages(n,':scope>.paint-file',3));}
    if(id==='exchange'){
      extra(root,'exchange-shop','Магазин користі',[...root.querySelectorAll('.benefit-shop')]);extra(root,'exchange-guide','Довідка',[...root.querySelectorAll('.exchange-guide,.exchange-terminal,.exchange-ticker,:scope>.app-help')]);extra(root,'exchange-news','Новини сесії',[...root.querySelectorAll('.exchange-news')]);
      root.querySelectorAll('.exchange-market').forEach(n=>window.BrukFit.pages(n,':scope>.exchange-asset',2));root.querySelectorAll('.exchange-history').forEach(n=>window.BrukFit.pages(n,':scope>div',8));root.querySelectorAll('.exchange-orders').forEach(n=>window.BrukFit.pages(n,':scope>article',2));
    }else if(['workshop','dispatch'].includes(id)){extra(root,id+'-shop','Магазин користі',[...root.querySelectorAll('.benefit-shop')]);extra(root,id+'-help','Підказки',[...root.querySelectorAll('.app-help,.preview-caption:not(#dispatchStatus)')]);}
  }
  function business(root,kind){root.dataset.business=kind;root.dataset.businessPage=kind==='garage'?'collection':'build';if(kind==='estate'&&!root.querySelector('.construction-stage'))return;const nav=el('nav','business-tabs');for(const [id,title] of kind==='garage'?[['collection','Колекція'],['custom','Кастомізація']]:[['build','Будівництво'],['upgrades','Прокачка'],['help','Довідка']]){const button=el('button','',title);button.type='button';button.onclick=()=>root.dataset.businessPage=id;nav.append(button);}root.prepend(nav);root.querySelectorAll('.garage-cards').forEach(n=>window.BrukFit.pages(n,':scope>.garage-car-card',3));}
  window.BrukWorkspace={prepare,business};
})();
