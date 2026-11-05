(() => {
  'use strict';
  if(typeof window!=='undefined'&&window.BrukDevice?.blocked)return;
  function fold(root){
    root.querySelectorAll('.preview-hero>p,.exchange-terminal>p,.gallery-heading p,.steam-library>p,.steam-hero p,.sc-banner p,.paint-editor-heading p,.venture-hero>p,.preview-caption:not([id]),.garage-custom>.venture-caption,.sc-path-note,.history-note,#deliveryHint').forEach(node=>{
      if(node.closest('details')||!node.textContent.trim())return;
      const details=document.createElement('details');details.className='app-help';
      const summary=document.createElement('summary');summary.textContent='Підказки та правила';
      node.replaceWith(details);details.append(summary,node);
    });
  }
  window.BrukHelp={fold};fold(document);
})();
