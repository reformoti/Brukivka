(() => {
  'use strict';if(window.BrukDevice?.blocked)return;
  const states=new WeakMap();
  function pages(root,selector,size=6){if(!root)return;const items=[...root.querySelectorAll(selector)].filter(x=>x.parentElement===root),old=states.get(root);if(!items.length)return;
    let state=old;if(!old||old.items.length!==items.length||old.items.some((x,i)=>x!==items[i])){old?.nav.remove();state={items,page:0,size,nav:document.createElement('nav')};state.nav.className='fit-nav';state.nav.setAttribute('aria-label','Сторінки');const prev=document.createElement('button'),label=document.createElement('span'),next=document.createElement('button');prev.type=next.type='button';prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label','Попередня сторінка');next.setAttribute('aria-label','Наступна сторінка');state.nav.append(prev,label,next);root.append(state.nav);prev.onclick=()=>{state.page--;paint();};next.onclick=()=>{state.page++;paint();};states.set(root,state);}
    function paint(){const count=Math.ceil(state.items.length/state.size);state.page=Math.max(0,Math.min(count-1,state.page));state.items.forEach((item,i)=>item.dataset.fitHidden=String(Math.floor(i/state.size)!==state.page));state.nav.hidden=count<2;state.nav.children[0].disabled=state.page===0;state.nav.children[2].disabled=state.page===count-1;const text=`${state.page+1} / ${count}`;if(state.nav.children[1].textContent!==text)state.nav.children[1].textContent=text;}
    paint();return state;
  }
  window.BrukFit={pages};
})();
