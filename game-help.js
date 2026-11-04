(() => {
  'use strict';
  function fold(nodes,label){const list=Array.from(nodes);if(!list.length||list[0].closest('details'))return;const help=document.createElement('details');help.className='game-help';const summary=document.createElement('summary');summary.textContent=label;list[0].before(help);help.append(summary,...list);}
  fold(document.querySelectorAll('footer>p,footer>span:not([id])'),'Керування та правила');
  document.querySelectorAll('.hint,.rules,#setup>p').forEach(node=>fold([node],'Підказки'));
})();
