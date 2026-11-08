(() => {
  'use strict';
  window.BrukJourney={create(world,ground,api){
    const $=id=>document.getElementById(id),R=window.BrukRealms,map=$('worldMap'),ctx=map.getContext('2d');
    function openMap(){api.clearKeys();drawMap();$('mapDialog').showModal();}
    function drawMap(){const sx=map.width/R.WIDTH,sy=map.height/R.HEIGHT;ctx.drawImage(ground,0,0,map.width,map.height);ctx.fillStyle='#132e3544';ctx.fillRect(0,0,map.width,map.height);
      const dot=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x*sx,y*sy,r,0,Math.PI*2);ctx.fill();};
      if($('mapResources').checked)for(const n of world.nodes)if(n.charges)dot(n.x,n.y,4,R.RESOURCES[R.NODE_TYPES[n.type].resource].color);
      if($('mapEnemies').checked)for(const m of world.monsters)if(m.alive)dot(m.x,m.y,R.TYPES[m.type].boss?9:3,R.TYPES[m.type].boss?'#efc375':'#e1a18b');
      ctx.font='600 13px system-ui';ctx.textAlign='center';ctx.fillStyle='#f1e6c5';for(const [x,y,name] of [[500,440,'Село мандрівників'],[980,240,'Галявини'],[1450,1450,'Дикий ліс'],[2050,500,'Каменоломня'],[2770,1500,'Рунічні руїни']])ctx.fillText(name,x*sx,y*sy);dot(R.CAMP.x,R.CAMP.y,7,'#d6e8a6');for(const zone of R.ZONES){dot(zone.x,zone.y,8,zone.boss==='frostgiant'?'#afe0ed':'#e5c878');ctx.fillStyle='#f1e6c5';ctx.fillText(zone.name+' · Lv '+zone.level,zone.x*sx,zone.y*sy-14);}dot(R.BILLBOARD.x,R.BILLBOARD.y,4,'#f3df99');
      const s=world.state;dot(s.x,s.y,8,'#fff4cc');dot(s.x,s.y,4,'#377f89');if(world.target){ctx.strokeStyle='#f0d28b';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(s.x*sx,s.y*sy);ctx.lineTo(world.target.x*sx,world.target.y*sy);ctx.stroke();ctx.setLineDash([]);dot(world.target.x,world.target.y,5,'#f0d28b');}
    }
    function openEnding(){api.clearKeys();for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();$('victoryDialog').showModal();}
    function refresh(){const count=Object.values(world.state.claimed).filter(Boolean).length;$('campaignProgress').textContent=count+'/5 контрактів';$('endingAction').classList.toggle('hidden',!world.state.campaignRewardClaimed);$('recallAction').disabled=world.nearCamp()||world.inCombat();$('recallAction').textContent=world.recalling===null?'Повернутись · T':`Повернення · ${Math.max(0,6-world.recalling).toFixed(1)} с`;if($('mapDialog').open)drawMap();}
    $('mapAction').addEventListener('click',openMap);$('endingAction').addEventListener('click',openEnding);$('recallAction').addEventListener('click',()=>api.notice(world.beginRecall().message));
    for(const [button,dialog] of [['closeMap','mapDialog'],['closeVictory','victoryDialog']])$(button).addEventListener('click',()=>{$(dialog).close();api.focus();});
    for(const id of ['mapResources','mapEnemies'])$(id).addEventListener('change',drawMap);
    map.addEventListener('pointerdown',()=>api.notice('Карта показує орієнтири. Рух — WASD або стрілки.'));
    return {refresh,openMap,openEnding,open:()=>$('mapDialog').open||$('victoryDialog').open};
  }};
})();
