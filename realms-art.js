(() => {
  'use strict';
  const R=window.BrukRealms,paths={
    sword:'<path d="M34 8l8 1-2 26-8 7-6-6z" fill="#d8e4cf"/><path d="M19 37l20 9M28 41l-9 17" stroke="#d5b780" stroke-width="5" stroke-linecap="round"/>',
    axe:'<path d="M23 8l-4 48" stroke="#b79565" stroke-width="6"/><path d="M20 12q13 4 24-5l8 19q-21-3-31 4z" fill="#cad7c8"/><path d="M43 7l9 19" stroke="#f0e5bf" stroke-width="3"/>',
    spear:'<path d="M17 58L39 19" stroke="#b79565" stroke-width="5"/><path d="M33 23l4-18 9 14-9 9z" fill="#dce5ce"/><path d="M26 34l10 6" stroke="#c9bc8a" stroke-width="3"/>',
    daggers:'<path d="M18 8l11 25-7 3L12 15zM47 8L36 33l7 3 10-21z" fill="#d8e3cb"/><path d="M15 35l17-7m-7 6l7 20m17-19l-17-7m7 6l-7 20" stroke="#d2b67f" stroke-width="4" stroke-linecap="round"/>',
    bow:'<path d="M22 8q34 24 0 48" fill="none" stroke="#d0af77" stroke-width="5"/><path d="M22 8l9 24-9 24M12 32h39m-8-7l8 7-8 7" fill="none" stroke="#e2dfb8" stroke-width="2"/>',
    staff:'<path d="M19 58l17-34" stroke="#b99368" stroke-width="6" stroke-linecap="round"/><path d="M26 21l8-16 17 9-8 17z" fill="#9fcfd2" stroke="#d5dcb5" stroke-width="2"/><path d="M34 10l9 5-6 9" fill="none" stroke="#e9f1d4" stroke-width="2"/>',
    plate:'<path d="M20 10l12 5 12-5 12 15-11 7-2 23H21l-2-23-11-7z" fill="#a1b4aa" stroke="#d1dab8" stroke-width="2"/><path d="M24 17v31m16-31v31M22 45h20" stroke="#657e76" stroke-width="3"/>',
    leather:'<path d="M20 11l12 5 12-5 10 15-10 5v25H20V31l-10-5z" fill="#b39d74" stroke="#dbca9d" stroke-width="2"/><path d="M32 17v38m-13-9h26m-9-20h6" stroke="#715c43" stroke-width="3"/>',
    cloth:'<path d="M23 10l9-5 9 5 12 22-9 5 6 21H14l6-21-9-5z" fill="#95aeb3" stroke="#d0dbc2" stroke-width="2"/><path d="M23 10l9 12 9-12M24 35h16m-8-13v34" stroke="#637d89" stroke-width="3"/>',
    shield:'<path d="M32 7l21 8-4 25-17 17-17-17-4-25z" fill="#91afa0" stroke="#d6d4ad" stroke-width="3"/><path d="M32 12v37m-15-25h30" stroke="#607f76" stroke-width="3"/>',
    focus:'<path d="M14 12l35-4 2 45-35 5z" fill="#9b90b5" stroke="#d6c8aa" stroke-width="3"/><path d="M20 13l1 40m9-32l10 5-5 11-9-5z" fill="none" stroke="#dbd8b7" stroke-width="3"/>',
    torch:'<path d="M26 57l7-27" stroke="#bb9a69" stroke-width="7"/><path d="M22 29Q13 14 30 4q-3 10 9 11 13 16-5 22z" fill="#e6b56f"/><path d="M29 29q-6-8 4-14 10 15-1 18" fill="#f4d99a"/>',
    boots:'<path d="M12 10h15l-2 26 8 9-1 10H10l2-18zm27 0h14l-2 26 8 9-1 10H36l2-18z" fill="#ac9670" stroke="#d3c39a" stroke-width="2"/><path d="M12 18h14m13 0h13" stroke="#6c6950" stroke-width="4"/>',
    cape:'<path d="M20 12l12-5 12 5 11 44-23-6-23 6z" fill="#8fa7aa" stroke="#cad5b7" stroke-width="2"/><path d="M32 11v35m-8-28l-7 27m23-27l7 27" stroke="#617e83" stroke-width="3"/>',
    bag:'<path d="M20 18q0-14 12-14t12 14" fill="none" stroke="#c3af7d" stroke-width="4"/><rect x="12" y="15" width="40" height="43" rx="10" fill="#aa936c" stroke="#d9ca9c" stroke-width="2"/><rect x="19" y="36" width="26" height="15" rx="4" fill="#7c7757"/><path d="M20 22h24m-19 13v8m14-8v8" stroke="#ddcb95" stroke-width="3"/>',
    pickaxe:'<path d="M20 57l20-40" stroke="#b99a69" stroke-width="6"/><path d="M9 20Q32-1 58 25L39 19 29 15z" fill="#bfcfc1" stroke="#dde4c9" stroke-width="2"/>',
    sickle:'<path d="M17 56l10-27" stroke="#b39766" stroke-width="6"/><path d="M29 8q35 7 11 31 10-20-13-18z" fill="#d7dfc1" stroke="#a9bbaa" stroke-width="2"/>',
    potion:'<path d="M24 6h16v14l11 14q9 25-19 25T13 34l11-14z" fill="#a5c3a3" stroke="#d6dfb9" stroke-width="2"/><path d="M17 36q15-8 30 0v11q-3 14-15 9-18 4-15-20" fill="#7aa69a"/><path d="M23 9h18" stroke="#b39c70" stroke-width="7"/>'
  };
  function icon(kind){const shape=paths[kind]||'<path d="M10 39l8-19 25-5 13 18-9 17-26 7z" fill="currentColor"/><path d="M18 22l13 13 14-17m-14 17l-8 17m8-17l19 1" fill="none" stroke="#f0e4bc88" stroke-width="2"/>';return '<svg class="item-icon" viewBox="0 0 64 64" aria-hidden="true">'+shape+'</svg>';}
  function rr(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
  function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  function drawMonster(c,m,world){
    const {x,y,type}=m,t=R.TYPES[type],bob=Math.sin(world.time*5+m.phase)*2;
    if(['slime','wolf','golem'].includes(type))return false;
    c.save();c.translate(x,y);
    if(type==='boar'||type==='bear'){
      const bear=type==='bear',s=bear?1.3:1; c.scale(s,s);const sign=m.x>world.state.x?-1:1;c.scale(sign,1);rr(c,-21,-8,10,22,4,'#615c45');rr(c,7,-8,10,22,4,'#615c45');ellipse(c,-2,-20+bob,29,20,t.color);ellipse(c,22,-24+bob,bear?18:15,bear?18:14,bear?'#af9470':'#ba9f78');ellipse(c,16,-40+bob,6,7,t.color);ellipse(c,33,-38+bob,5,6,t.color);rr(c,29,-25+bob,13,10,4,'#645a45');ellipse(c,27,-29+bob,2.5,2.5,'#263d34');if(!bear){c.strokeStyle='#e7dcad';c.lineWidth=4;c.beginPath();c.moveTo(31,-16+bob);c.quadraticCurveTo(43,-11+bob,41,-24+bob);c.stroke();}
    }else if(type==='spider'){
      c.strokeStyle='#53664d';c.lineWidth=5;c.lineCap='round';for(const sign of [-1,1])for(let k=0;k<4;k++){c.beginPath();c.moveTo(sign*8,-20);c.lineTo(sign*(24+k*2),-42+k*12+bob);c.lineTo(sign*(37+k*2),-28+k*10);c.stroke();}ellipse(c,0,-22,18,21,'#7f9272');ellipse(c,0,-3,13,11,'#a1b28b');for(const sign of [-1,1])ellipse(c,sign*5,-2,3,3,'#ddd2a1');ellipse(c,-4,-28,7,9,'#afc191');
    }else if(type==='ancient'){
      c.scale(1.5,1.5);rr(c,-22,-12,16,26,5,'#5c827a');rr(c,6,-12,16,26,5,'#5c827a');rr(c,-32,-53,64,46,10,'#8cae9e');rr(c,-46,-49,20,39,6,'#799e92');rr(c,26,-49,20,39,6,'#799e92');rr(c,-24,-80,48,36,9,'#b6c6a8');rr(c,-18,-67,36,10,3,'#416c69');rr(c,-13,-65,8,5,1,'#bff4e0');rr(c,5,-65,8,5,1,'#bff4e0');c.strokeStyle='#c5dbb4';c.lineWidth=4;c.beginPath();c.moveTo(-15,-83);c.lineTo(-21,-101);c.lineTo(-6,-87);c.moveTo(15,-83);c.lineTo(21,-101);c.lineTo(6,-87);c.stroke();ellipse(c,0,-31,10,10,'#c1e6ce');ellipse(c,0,-31,5,5,'#63aaab');
    }else{
      const skeleton=type==='skeleton',mage=type==='mage';rr(c,-10,-5,8,20,3,'#53675b');rr(c,3,-5,8,20,3,'#53675b');c.fillStyle=mage?'#8e83a5':skeleton?'#bec2a3':'#927e5e';c.beginPath();c.moveTo(-14,-38+bob);c.lineTo(14,-38+bob);c.lineTo(mage?23:18,6);c.lineTo(mage?-23:-18,6);c.closePath();c.fill();ellipse(c,0,-45+bob,12,12,skeleton?'#e1d8b0':mage?'#c2b49e':'#c1ad84');if(mage){ellipse(c,0,-53+bob,19,6,'#6b698a');c.fillStyle='#817896';c.beginPath();c.moveTo(-13,-54+bob);c.lineTo(4,-79+bob);c.lineTo(16,-54+bob);c.fill();c.strokeStyle='#a59572';c.lineWidth=5;c.beginPath();c.moveTo(23,10);c.lineTo(29,-48);c.stroke();ellipse(c,29,-53,8,9,'#c6b4e4');}else if(skeleton){rr(c,-8,-48+bob,5,6,1,'#647768');rr(c,3,-48+bob,5,6,1,'#647768');c.strokeStyle='#7f927d';c.lineWidth=3;for(let k=0;k<3;k++){c.beginPath();c.moveTo(-9,-28+k*7+bob);c.lineTo(9,-28+k*7+bob);c.stroke();}}else{rr(c,-14,-51+bob,28,9,4,'#6b6650');rr(c,-10,-45+bob,20,5,1,'#4b5d4b');}if(!mage){c.strokeStyle='#c9d3b5';c.lineWidth=5;c.beginPath();c.moveTo(20,-5);c.lineTo(28,-35+bob);c.stroke();c.strokeStyle='#a9905d';c.lineWidth=4;c.beginPath();c.moveTo(17,-10);c.lineTo(29,-8);c.stroke();}
    }c.restore();return true;
  }
  function drawWeapon(c,kind,time){c.strokeStyle='#dfe6cd';c.lineWidth=5;c.lineCap='round';
    if(kind==='bow'){c.strokeStyle='#c8ae79';c.lineWidth=4;c.beginPath();c.moveTo(-6,-37);c.quadraticCurveTo(23,-18,-6,2);c.stroke();c.strokeStyle='#e4dfb7';c.lineWidth=1.5;c.beginPath();c.moveTo(-6,-37);c.lineTo(3,-18);c.lineTo(-6,2);c.stroke();}
    else if(kind==='staff'){c.strokeStyle='#ae916c';c.lineWidth=5;c.beginPath();c.moveTo(0,13);c.lineTo(0,-39);c.stroke();ellipse(c,0,-43,8,10,'#a5d4d3');ellipse(c,-2,-45,3,4,'#e2eac6');}
    else if(kind==='spear'){c.strokeStyle='#b39766';c.lineWidth=4;c.beginPath();c.moveTo(0,23);c.lineTo(0,-46);c.stroke();c.fillStyle='#d5e1ca';c.beginPath();c.moveTo(-6,-42);c.lineTo(0,-59);c.lineTo(6,-42);c.lineTo(0,-36);c.fill();}
    else if(kind==='axe'){rr(c,-3,-37,6,52,2,'#af9465');c.fillStyle='#cbd7c4';c.beginPath();c.moveTo(0,-37);c.quadraticCurveTo(12,-40,19,-45);c.lineTo(24,-22);c.quadraticCurveTo(8,-27,0,-23);c.fill();}
    else{rr(c,-3,kind==='daggers'?-25:-37,6,kind==='daggers'?23:35,2,'#dfdfbd');rr(c,-9,-5,18,5,2,'#c4ac74');rr(c,-2,0,4,11,1,'#665d3f');if(kind==='daggers'){rr(c,-20,-24,5,24,2,'#d7ddbb');rr(c,-25,-2,15,4,1,'#b9a26f');}}
  }
  function drawNode(c,n,world){const t=R.NODE_TYPES[n.type],r=R.RESOURCES[t.resource],selected=world.selectedNode===n.id,near=Math.hypot(n.x-world.state.x,n.y-world.state.y)<125;
    c.save();c.translate(n.x,n.y);c.globalAlpha=n.charges?1:.38;ellipse(c,2,9,28,10,'#324c433b');if(selected){c.strokeStyle='#e8d9a1';c.lineWidth=2;c.beginPath();c.ellipse(0,7,33,15,0,0,Math.PI*2);c.stroke();}
    if(n.type==='wood'){rr(c,-7,-54,14,61,3,'#8d7b55');for(const [x,y,rx,ry,col] of [[0,-62,25,31,'#648456'],[-18,-48,20,24,'#5b7d55'],[15,-49,22,25,'#7c965e']])ellipse(c,x,y,rx,ry,col);rr(c,-10,-25,20,5,2,'#a5b573');}
    else if(n.type==='fiber'||n.type==='herb'){for(let j=0;j<5;j++){c.strokeStyle='#84a872';c.lineWidth=3;c.beginPath();c.moveTo(0,5);c.quadraticCurveTo(j*8-18,-9,j*9-18,-30-(j%2)*9);c.stroke();ellipse(c,j*9-18,-30-(j%2)*9,5,7,n.type==='herb'?'#c5d49a':'#d3c694');}}
    else{c.fillStyle='#74877a';c.beginPath();c.moveTo(-29,3);c.lineTo(-22,-22);c.lineTo(5,-34);c.lineTo(28,-15);c.lineTo(25,8);c.closePath();c.fill();c.fillStyle=r.color;c.beginPath();c.moveTo(-17,-13);c.lineTo(-6,-31);c.lineTo(5,-15);c.lineTo(20,-23);c.lineTo(17,-2);c.lineTo(-3,5);c.closePath();c.fill();c.strokeStyle='#e9ecc399';c.lineWidth=2;c.beginPath();c.moveTo(-6,-26);c.lineTo(-4,-11);c.lineTo(12,-14);c.stroke();}
    if(near||selected){c.globalAlpha=1;c.font='600 10px system-ui';c.textAlign='center';c.fillStyle='#e8e5bd';c.strokeStyle='#314f3b';c.lineWidth=3;const text=n.charges?`${t.name} · ${n.charges}`:'Відновлюється';c.strokeText(text,0,n.type==='wood'?-101:-51);c.fillText(text,0,n.type==='wood'?-101:-51);for(let j=0;j<t.charges;j++)ellipse(c,(j-(t.charges-1)/2)*7,21,2,2,j<n.charges?'#e5d9a8':'#55705c');}c.restore();
  }
  function telegraphs(c,world){for(const m of world.monsters){const t=m.telegraph;if(!m.alive||!t)continue;const progress=1-t.remaining/t.duration;c.save();c.strokeStyle=t.kind==='shot'?'#caa5e5aa':'#edac818c';c.fillStyle=t.kind==='shot'?'#b29ac236':'#e4a08130';c.lineWidth=3;c.setLineDash([9,7]);if(t.kind==='charge'){c.lineWidth=30;c.beginPath();c.moveTo(m.x,m.y);c.lineTo(t.x,t.y);c.stroke();c.lineWidth=3;}else{c.beginPath();c.arc(t.x,t.y,t.radius,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);c.beginPath();c.arc(t.x,t.y,t.radius*progress,0,Math.PI*2);c.stroke();}c.restore();}}
  function projectiles(c,world){for(const p of world.projectiles){if(p.magic){ellipse(c,p.x,p.y,10,10,p.owner==='enemy'?'#c2a4d566':'#8fd5d766');ellipse(c,p.x,p.y,6,6,p.owner==='enemy'?'#dbc1ef':'#c5eadb');}else{const a=Math.atan2(p.vy,p.vx);c.save();c.translate(p.x,p.y);c.rotate(a);c.strokeStyle='#f2e3ae';c.lineWidth=2;c.beginPath();c.moveTo(-17,0);c.lineTo(7,0);c.moveTo(1,-4);c.lineTo(7,0);c.lineTo(1,4);c.stroke();c.restore();}}}
  window.BrukRealmsArt={icon,drawMonster,drawWeapon,drawNode,telegraphs,projectiles};
})();
