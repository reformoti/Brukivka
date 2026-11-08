(() => {
  'use strict';
  window.BrukJourney={create(world,ground,api){
    const $=id=>document.getElementById(id),R=window.BrukRealms,map=$('worldMap'),ctx=map.getContext('2d');
    function openMap(){api.clearKeys();drawMap();$('mapDialog').showModal();}
    function drawMap(){const sx=map.width/R.WIDTH,sy=map.height/R.HEIGHT;ctx.drawImage(ground,0,0,map.width,map.height);ctx.fillStyle='#132e3544';ctx.fillRect(0,0,map.width,map.height);
      const dot=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x*sx,y*sy,r,0,Math.PI*2);ctx.fill();};
      if($('mapResources').checked)for(const n of world.nodes)if(n.charges)dot(n.x,n.y,4,R.RESOURCES[R.NODE_TYPES[n.type].resource].color);
      if($('mapEnemies').checked)for(const m of world.monsters)if(m.alive)dot(m.x,m.y,R.TYPES[m.type].boss?9:3,R.TYPES[m.type].boss?'#efc375':'#e1a18b');
      dot(R.CAMP.x,R.CAMP.y,7,'#d6e8a6');dot(R.MONOLITH.x,R.MONOLITH.y,6,'#9edddb');dot(R.BILLBOARD.x,R.BILLBOARD.y,4,'#f3df99');
      const s=world.state;dot(s.x,s.y,8,'#fff4cc');dot(s.x,s.y,4,'#377f89');if(world.target){ctx.strokeStyle='#f0d28b';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(s.x*sx,s.y*sy);ctx.lineTo(world.target.x*sx,world.target.y*sy);ctx.stroke();ctx.setLineDash([]);dot(world.target.x,world.target.y,5,'#f0d28b');}
    }
    function openEnding(){api.clearKeys();for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();$('victoryDialog').showModal();}
    function refresh(){$('recallAction').disabled=world.nearCamp()||world.inCombat();$('recallAction').textContent=world.recalling===null?'Повернутись · T':`Повернення · ${Math.max(0,6-world.recalling).toFixed(1)} с`;if($('mapDialog').open)drawMap();}
    $('mapAction').addEventListener('click',openMap);$('recallAction').addEventListener('click',()=>api.notice(world.beginRecall().message));
    for(const [button,dialog] of [['closeMap','mapDialog'],['closeVictory','victoryDialog']])$(button).addEventListener('click',()=>{$(dialog).close();api.focus();});
    for(const id of ['mapResources','mapEnemies'])$(id).addEventListener('change',drawMap);
    map.addEventListener('pointerdown',()=>api.notice('Карта показує орієнтири. Рух — WASD або стрілки.'));
    return {refresh,openMap,openEnding,open:()=>$('mapDialog').open||$('victoryDialog').open};
  }};
})();
