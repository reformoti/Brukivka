(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.BrukRealmModels=factory();
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const TAU=Math.PI*2;
  function shape(c,points,fill,stroke='#1d2629',width=1.4){
    c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();
    c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke();}
  }
  function oval(c,x,y,rx,ry,fill,angle=0){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fillStyle=fill;c.fill();}
  function rect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.3;c.stroke();}}
  function line(c,points,color,width=1.5){c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
  function grad(c,x,y,yy,light,dark){const g=c.createLinearGradient(x,y,x+12,yy);g.addColorStop(0,light);g.addColorStop(1,dark);return g;}
  function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');oval(c,x,y,r,r,g);}
  function facet(c,x,y,w,h,light,mid,dark){
    shape(c,[[x,y+h*.2],[x+w*.35,y],[x+w*.88,y+h*.1],[x+w,y+h*.7],[x+w*.6,y+h],[x+w*.08,y+h*.8]],mid);
    shape(c,[[x,y+h*.2],[x+w*.35,y],[x+w*.88,y+h*.1],[x+w*.53,y+h*.45],[x+w*.12,y+h*.47]],light,null);
    shape(c,[[x+w*.53,y+h*.45],[x+w*.88,y+h*.1],[x+w,y+h*.7],[x+w*.6,y+h]],dark,null);
  }
  function eye(c,x,y,color='#e9d18b'){oval(c,x,y,2.3,2.5,'#162025');oval(c,x+.4,y,1.2,1.4,color);}
  function bone(c,x1,y1,x2,y2){line(c,[[x1,y1],[x2,y2]],'#565452',7);line(c,[[x1,y1],[x2,y2]],'#c7bea1',4);oval(c,x2,y2,3.2,3.2,'#ded5bb');}
  function gem(c,x,y,r,color){shape(c,[[x,y-r],[x+r*.65,y-r*.35],[x+r*.5,y+r*.55],[x,y+r],[x-r*.65,y+r*.2],[x-r*.6,y-r*.45]],color);line(c,[[x,y-r],[x-r*.15,y],[x,y+r]],'#ffffff99',1);}
  function monster(c,m,world){
    if(!m.alive)return true;
    const time=world.time||0,phase=m.phase||0,bob=Math.sin(time*3.5+phase),stride=Math.sin(time*(m.state==='chase'?12:4)+phase);
    c.save();c.translate(m.x,m.y);
    if(m.type==='slime'){
      c.scale(1+bob*.035,1-bob*.04);
      const g=grad(c,-15,-36,10,'#a9bb72','#3e6653');
      c.beginPath();c.moveTo(-24,4);c.bezierCurveTo(-32,-9,-19,-39,0,-38);c.bezierCurveTo(22,-40,33,-9,24,4);c.quadraticCurveTo(0,19,-24,4);c.fillStyle=g;c.fill();c.strokeStyle='#314f43';c.lineWidth=1.5;c.stroke();
      oval(c,3,-6,17,9,'#294b4233');oval(c,-8,-25,8,4,'#f0f2be66',-.6);
      for(const [x,y,r] of [[10,-25,2],[-14,-9,2],[5,2,3]])oval(c,x,y,r,r,'#d7df9a44');
      eye(c,-8,-13);eye(c,9,-13);line(c,[[-3,-6],[1,-4],[5,-6]],'#304a3d',1.4);
      shape(c,[[-6,-37],[0,-46],[7,-39]],'#b9c77f','#607956');line(c,[[0,-43],[1,-38]],'#dbe0a3',1);
    }else if(['wolf','boar','bear'].includes(m.type)){
      const wolf=m.type==='wolf',bear=m.type==='bear',size=bear?1.26:1;
      c.scale((m.x>world.state.x?-1:1)*size,size);
      const fur=wolf?'#8c9290':bear?'#78614f':'#776357',light=wolf?'#c1c0ae':bear?'#a08061':'#a68b6b',dark=wolf?'#505b5c':'#493c35';
      for(const [x,k] of [[-17,-1],[14,1]]){const step=stride*k*3;line(c,[[x,-13],[x+step,3],[x+step-2,12]],dark,8);rect(c,x+step-7,8,12,6,2,dark);for(let j=0;j<3;j++)line(c,[[x+step-4+j*3,12],[x+step-4+j*3,14]],'#c8b694',1);}
      if(wolf){shape(c,[[-20,-26],[-34,-43],[-49,-39],[-37,-28],[-24,-12]],dark);shape(c,[[-38,-38],[-45,-39],[-38,-32]],'#bfc1ae',null);}
      oval(c,-3,-24+bob,31,bear?24:18,grad(c,-15,-46,0,light,fur));
      for(let j=0;j<5;j++)shape(c,[[-17+j*6,-39+bob],[-11+j*6,-43+bob],[-7+j*6,-33+bob]],fur,null);
      oval(c,21,-29+bob,bear?19:16,bear?20:15,grad(c,12,-47,-12,light,fur));
      if(wolf){shape(c,[[10,-39],[12,-58],[22,-43]],dark);shape(c,[[26,-42],[35,-57],[36,-35]],dark);shape(c,[[14,-44],[14,-51],[19,-43]],'#af9a8a',null);}
      else{oval(c,12,-47+bob,6,7,dark);oval(c,32,-46+bob,6,7,dark);oval(c,12,-48+bob,3,4,'#b09479');}
      oval(c,34,-23+bob,13,8,light);rect(c,39,-28+bob,8,8,3,dark);eye(c,26,-34+bob,wolf?'#ebd986':'#e1c28c');
      line(c,[[33,-19+bob],[40,-19+bob]],dark,1.5);
      if(!wolf&&!bear){for(const x of [29,36]){c.beginPath();c.moveTo(x,-18+bob);c.quadraticCurveTo(x+9,-7+bob,x+8,-25+bob);c.strokeStyle='#e4d7b7';c.lineWidth=3.5;c.stroke();}for(let j=0;j<6;j++)line(c,[[-15+j*5,-39],[-17+j*5,-45-j%2*3]],dark,2);}
      if(bear){oval(c,28,-24+bob,7,6,'#b79b7b');line(c,[[5,-20],[-1,-12],[-15,-12]],'#473d3488',2);}
    }else if(m.type==='spider'){
      for(const sign of [-1,1])for(let j=0;j<4;j++){
        const y=-28+j*8,step=Math.sin(time*9+j*Math.PI/2)*3;
        line(c,[[sign*9,y],[sign*(26+j*2),y-14+step],[sign*(39-j*2),y+10]],'#27372e',6);
        line(c,[[sign*9,y],[sign*(26+j*2),y-14+step],[sign*(39-j*2),y+10]],'#788063',3);
        oval(c,sign*(26+j*2),y-14+step,3,3,'#a6a17b');
      }
      oval(c,0,-27,18,23,grad(c,-10,-48,-4,'#858b62','#344b40'));
      shape(c,[[0,-47],[-7,-33],[0,-20],[7,-33]],'#c7b581','#596347');oval(c,0,-6,13,11,'#424c3b');
      for(const [x,y,r] of [[-6,-9,3],[6,-9,3],[-10,-14,1.8],[10,-14,1.8]]){oval(c,x,y,r+1,r+1,'#272f2b');oval(c,x,y,r,r,'#e1ae68');}
      for(const sign of [-1,1])line(c,[[sign*5,0],[sign*9,8],[sign*3,5]],'#e4d9b1',2);
    }else if(m.type==='golem'||m.type==='ancient'){
      const boss=m.type==='ancient',rune=boss?'#99e6df':'#c5dca7';c.scale(boss?1.5:1,boss?1.5:1);
      for(const sign of [-1,1]){
        facet(c,sign<0?-23:5,-15,19,31,'#8c9b8b','#667668','#3f504b');
        facet(c,sign<0?-40:26,-51+bob,18,38,'#98a28e','#707d70','#4b5d57');
        facet(c,sign<0?-43:25,-22,21,19,'#879781','#657769','#3e514c');
        oval(c,sign*25,-45+bob,6,6,'#354c47');
      }
      facet(c,-28,-57+bob,56,46,boss?'#b1c0a5':'#9caa91','#748a78','#4b625b');
      line(c,[[-18,-45],[0,-38],[18,-45]],'#384e47',3);line(c,[[-9,-31],[-15,-20]],'#384e47',2);
      glow(c,0,-34,21,boss?'#84f4de55':'#b2d58c33');gem(c,0,-34,10,rune);
      facet(c,-22,-84+bob,44,32,'#bbc3a6','#92a48e','#5e7b70');
      rect(c,-16,-72+bob,32,9,2,'#263e3a');for(const sign of [-1,1])rect(c,sign<0?-12:5,-70+bob,7,4,1,rune);
      line(c,[[-5,-60],[0,-57],[7,-59]],'#3d5951',2);
      if(boss){
        for(const sign of [-1,1])shape(c,[[sign*12,-83],[sign*25,-108],[sign*23,-81]],'#c1bc92','#586e61');
        for(let j=0;j<3;j++)gem(c,-13+j*13,-52,3,'#a9e1c9');
        const pulse=3+Math.sin(time*2)*2;glow(c,0,-34,23+pulse,'#7ce8dc33');
      }else{line(c,[[6,-81],[1,-70],[4,-63]],'#567264',2);oval(c,-27,-44,6,4,'#779760');}
    }else{
      const mage=m.type==='mage',skeleton=m.type==='skeleton',robe=mage?'#6f5d85':skeleton?'#5c6460':'#785248',robeLight=mage?'#a091b1':skeleton?'#899086':'#a07861';
      if(skeleton){for(const sign of [-1,1]){bone(c,sign*7,-15,sign*10+stride*2,0);bone(c,sign*10+stride*2,0,sign*11,12);rect(c,sign<0?-17:5,9,13,5,2,'#b8ae96');}}
      else{for(const sign of [-1,1])rect(c,sign<0?-12:3,-10+stride*sign*2,10,24,3,'#363c3e','#20272b');}
      shape(c,[[-14,-44+bob],[13,-44+bob],[22,5],[-1,11],[-23,5]],grad(c,-10,-48,11,robeLight,robe));
      if(mage){line(c,[[-9,-39],[-16,3],[-2,6],[9,3],[5,-39]],'#c7b182',2);shape(c,[[-11,-39],[-21,-15],[-17,5],[-6,-1]],'#514761',null);}
      if(skeleton){
        for(let j=0;j<4;j++){line(c,[[-10,-36+j*6],[0,-32+j*6],[10,-36+j*6]],'#d0c4a4',3);}
        line(c,[[0,-39],[0,-13]],'#e1d6b8',3);
        oval(c,0,-57+bob,13,15,grad(c,-10,-71,-42,'#e2d9bd','#9b9e8b'));
        oval(c,-5,-59+bob,4,4,'#283c38');oval(c,5,-59+bob,4,4,'#283c38');shape(c,[[0,-56],[-3,-50],[3,-50]],'#3b4b42',null);
        rect(c,-7,-48+bob,14,7,2,'#b3ad93');for(let j=0;j<4;j++)line(c,[[-5+j*3,-47+bob],[-5+j*3,-43+bob]],'#666d5c',1);
        for(const sign of [-1,1]){bone(c,sign*15,-36,sign*21,-22+bob);bone(c,sign*21,-22+bob,sign*22,-9);}
      }else{
        oval(c,0,-55+bob,11,13,'#bda18a');
        if(mage){shape(c,[[-18,-56],[-15,-71],[1,-81],[15,-68],[19,-51],[9,-58],[0,-68],[-8,-57]],robe);rect(c,-8,-61+bob,16,9,2,'#34333f');eye(c,-4,-57+bob,'#cfc0ed');eye(c,4,-57+bob,'#cfc0ed');}
        else{shape(c,[[-15,-58],[-10,-72],[7,-74],[16,-62],[13,-54],[3,-62],[-8,-58]],'#453d3a');rect(c,-10,-54+bob,21,8,2,'#48413d');eye(c,-4,-57+bob);eye(c,4,-57+bob);line(c,[[-8,-33],[9,-18]],'#b89b72',4);rect(c,-14,-12,29,5,1,'#423c34');rect(c,-3,-14,7,8,1,'#c5ad7a');}
        line(c,[[-15,-37],[-20,-21],[-22,-8]],robe,9);line(c,[[15,-37],[21,-23],[25,-12]],robe,9);oval(c,25,-11,4,4,'#b99b7c');
      }
      if(mage){line(c,[[25,10],[30,-60]],'#3e3b3b',6);line(c,[[24,9],[29,-60]],'#a68b67',3);glow(c,30,-65,18,'#d0abe555');gem(c,30,-66,9,'#bdabda');for(const sign of [-1,1])line(c,[[28,-54],[30+sign*10,-63],[30+sign*7,-75]],'#c3ad7e',2);}
      else{line(c,[[23,-9],[28,-39]],'#d0d6ce',5);line(c,[[27,-38],[31,-46]],'#e1e1d1',2);line(c,[[17,-10],[30,-8]],'#b19569',3);if(skeleton){shape(c,[[-27,-24],[-13,-23],[-15,-2],[-24,4],[-31,-4]],'#586968','#b1ae8e',2);line(c,[[-23,-19],[-22,-3]],'#b3b899',2);}}
    }
    c.restore();return true;
  }
  function tree(c,t){
    c.save();c.translate(t.x,t.y);c.scale(t.size,t.size);oval(c,13,7,37,13,'#15292455');
    shape(c,[[-9,5],[-6,-50],[4,-72],[9,-53],[11,6]],grad(c,-8,-60,9,'#8b7351','#453d32'));
    line(c,[[1,2],[0,-40],[6,-60]],'#baa17466',2);line(c,[[-3,-26],[-18,-45]],'#6c5b3e',7);
    const palette=[['#263e35','#3e5840','#68805a'],['#253e3b','#3f5d4d','#72816a'],['#374531','#566541','#899060']][t.tone%3];
    if(t.tone===1){
      for(let j=0;j<4;j++){const yy=-43-j*19,ww=40-j*7;shape(c,[[-ww,yy+19],[0,yy-29],[ww,yy+19],[10,yy+14],[0,yy+20],[-13,yy+13]],j%2?palette[0]:palette[1],'#20372e');line(c,[[-ww+7,yy+14],[0,yy-20],[ww-12,yy+12]],palette[2]+'77',2);}
    }else{
      const leaves=[[-26,-48,25,22], [23,-52,29,25],[-5,-79,34,29],[-24,-71,25,24],[23,-84,26,24],[0,-105,23,21]];
      for(let i=0;i<leaves.length;i++){const [x,y,rx,ry]=leaves[i];oval(c,x,y,rx,ry,palette[i%2]);oval(c,x-5,y-7,rx*.64,ry*.45,palette[2]+'88',-.15);}
      for(let j=0;j<9;j++)oval(c,Math.sin(j*5)*31,-59-j*5,4,2,palette[2]+'88',-.4);
    }
    line(c,[[-12,9],[-3,3],[9,9],[18,9]],'#536248',2);c.restore();
  }
  function house(c,o){
    const {x,y,w,h}=o,v=(Math.round(x+y)%3),roof=['#6a5550','#4c6267','#62614e'][v],roofLight=['#98766a','#758c88','#8c8c6a'][v];
    c.save();c.translate(x,y);oval(c,w*.58,h+9,w*.6,18,'#17252666');
    rect(c,0,0,w,h,3,'#9f957e','#433f37');rect(c,w*.72,3,w*.28,h-3,0,'#766d5e');
    for(let yy=48;yy<h;yy+=15){line(c,[[2,yy],[w-2,yy]],'#6e695b77',1);for(let xx=yy%30?13:28;xx<w;xx+=32)line(c,[[xx,yy],[xx,Math.min(h,yy+15)]],'#716d5e66',1);}
    for(const xx of [6,w*.34,w*.7,w-7])rect(c,xx,25,5,h-25,1,'#4b4538');
    rect(c,1,h-9,w-2,9,1,'#676455');line(c,[[2,h-9],[w-3,h-9]],'#bab092',2);
    const door=w*.46;rect(c,door-4,h-53,34,51,3,'#49453b','#b0a084');rect(c,door,h-49,26,46,2,'#71604a');
    for(let j=1;j<4;j++)line(c,[[door+j*6,h-47],[door+j*6,h-5]],'#493f32',1);
    line(c,[[door+1,h-38],[door+24,h-11]],'#a18b64',2);oval(c,door+21,h-25,2,2,'#dbc18d');rect(c,door-7,h-1,40,6,1,'#aaa38a');
    for(const xx of [w*.15,w*.78]){
      rect(c,xx-3,h-61,25,29,2,'#403d34','#b9a985');
      rect(c,xx,h-58,19,23,0,grad(c,xx,h-58,h-35,'#edc987','#8b6c42'));
      line(c,[[xx+9,h-57],[xx+9,h-36]],'#584d3a',2);line(c,[[xx,h-47],[xx+18,h-47]],'#584d3a',2);
      rect(c,xx-7,h-58,5,24,1,'#626e60');rect(c,xx+21,h-58,5,24,1,'#626e60');
      rect(c,xx-6,h-34,31,4,1,'#c0ad86');
    }
    const ridge=w*.48;shape(c,[[-13,27],[ridge,-33],[w+13,27],[w+13,41],[-13,41]],'#363c38');
    shape(c,[[-12,26],[ridge,-35],[w+12,26],[ridge,11]],roof);
    shape(c,[[-12,26],[ridge,-35],[ridge,11]],roofLight);
    for(let row=0;row<5;row++){const f=row/5,yy=-30+f*57,left=ridge*(1-f)-9*f,right=ridge+(w-ridge)*f+9*f;
      line(c,[[left,yy],[ridge,yy+12*f],[right,yy]],'#292f2f66',1.3);
      for(let k=1;k<=row*2;k++){const xx=left+(right-left)*k/(row*2+1);line(c,[[xx,yy+3],[xx+3,yy+8]],'#c9bda033',1);}
    }
    line(c,[[-12,27],[ridge,-35],[w+12,27]],'#b0a387',3);line(c,[[-12,39],[w+12,39]],'#282f2c',4);
    rect(c,w*.72,-19,18,31,1,'#6d6d61','#373e38');rect(c,w*.72-3,-22,24,6,1,'#939280');rect(c,w*.72+3,-24,12,3,1,'#343c38');
    if(v===0){rect(c,9,h-27,20,25,1,'#61523e');for(let j=0;j<4;j++)line(c,[[11+j*5,h-25],[11+j*5,h-5]],'#a98e5f',1);line(c,[[9,h-24],[28,h-7]],'#ba9b68',2);}
    else{oval(c,23,h-6,11,5,'#4a4738');rect(c,14,h-30,18,23,5,'#846747','#403d31');for(const yy of [h-26,h-12])line(c,[[14,yy],[31,yy]],'#37433d',3);}
    c.restore();
  }
  function rock(c,o){
    c.save();c.translate(o.x,o.y);oval(c,o.w*.58,o.h-2,o.w*.58,14,'#1b2b2855');facet(c,0,0,o.w,o.h,'#b0b1a0','#838d81','#566961');
    line(c,[[o.w*.53,o.h*.4],[o.w*.38,o.h*.69],[o.w*.46,o.h*.95]],'#3e514a',2);line(c,[[o.w*.68,o.h*.25],[o.w*.8,o.h*.32]],'#d0c9a7',2);
    for(let j=0;j<4;j++)oval(c,10+j*12,o.h*.66+Math.sin(j)*7,5+j,3,'#77875a88');c.restore();
  }
  function node(c,n,world,R){
    const t=R.NODE_TYPES[n.type],r=R.RESOURCES[t.resource],selected=world.selectedNode===n.id,near=Math.hypot(n.x-world.state.x,n.y-world.state.y)<125;
    c.save();c.translate(n.x,n.y);oval(c,5,8,29,10,'#20342c66');
    if(selected){c.beginPath();c.ellipse(0,6,34,15,0,0,TAU);c.strokeStyle='#e5cc8d';c.lineWidth=2;c.stroke();}
    if(n.type==='wood'){
      if(n.charges)tree(c,{x:0,y:0,size:.8,tone:n.id%3});else{rect(c,-10,-9,20,14,2,'#6d593d');oval(c,0,-9,10,5,'#c5aa74');oval(c,0,-9,6,3,'#8a744e');}
    }else if(n.type==='fiber'||n.type==='herb'){
      c.globalAlpha=n.charges?1:.35;
      for(let j=0;j<7;j++){const x=j*6-18,y=-24-(j%3)*7;line(c,[[0,6],[x*.6,-8],[x,y]],'#687c53',2);
        shape(c,[[x*.5,-8],[x*.5-8,-18],[x*.5-2,-17]],'#91a365',null);shape(c,[[x*.6,-12],[x*.6+9,-24],[x*.6+3,-22]],'#a5b172',null);
        if(n.type==='herb'){for(let k=0;k<5;k++)oval(c,x+Math.cos(k*TAU/5)*3,y+Math.sin(k*TAU/5)*3,2.5,2.5,'#c5a1b3');oval(c,x,y,2,2,'#dfcf88');}else oval(c,x,y,3,6,'#d7cda2',-.2);
      }
    }else{
      facet(c,-30,-34,59,45,'#a3a89a','#728179','#455b54');
      if(n.charges){const ore=n.type==='crystal'||n.type==='mithril';for(const [x,y,rr] of [[-14,-18,9],[3,-27,11],[17,-10,8]]){
        if(ore){if(n.type==='crystal')glow(c,x,y,rr*1.7,'#adb9dc33');gem(c,x,y,rr,r.color);}
        else{shape(c,[[x-6,y-2],[x,y-8],[x+7,y-2],[x+3,y+5],[x-6,y+4]],r.color,'#414a3e',1);line(c,[[x-3,y-2],[x,y-6],[x+4,y-2]],'#e6dbbc88',1);}
      }}else{line(c,[[-13,-21],[0,-15],[8,-22]],'#4b5c53',2);}
    }
    c.globalAlpha=1;
    if(near||selected){const label=n.charges?t.name+' · '+n.charges:'Відновлюється',yy=n.type==='wood'?-107:-57;
      c.font='600 10px system-ui';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#182822';c.strokeText(label,0,yy);c.fillStyle='#e8e0c6';c.fillText(label,0,yy);
      for(let j=0;j<t.charges;j++)oval(c,(j-(t.charges-1)/2)*7,23,2,2,j<n.charges?'#e1c991':'#4f6253');
    }c.restore();
  }
  function player(c,world,walking,drawWeapon){
    const s=world.state,bob=walking?Math.sin(world.footstep)*1.3:Math.sin(world.time*2)*.4,step=walking?Math.sin(world.footstep)*3:0;
    const metal=['#87918c','#929b91','#9da9a5','#b1b7ab','#bcc4c0','#dfd2a0'][Math.min(5,s.armor)],cloth=s.armorKind==='cloth',leather=s.armorKind==='leather',base=cloth?'#6f657f':leather?'#785b42':'#586c6d',trim=s.armor>=3?'#c7b378':'#a7a995';
    c.save();c.translate(s.x,s.y);oval(c,2,11,21,8,'#14262377');
    if(world.dashTime>0)line(c,[[-world.facing.x*40,-world.facing.y*40],[0,0]],'#b9d7c455',10);
    if(world.hurt>0)c.globalAlpha=.6;
    shape(c,[[-14,-38+bob],[12,-38+bob],[24+step*.5,10],[-5,8],[-24-step*.5,13]],grad(c,-12,-40,13,'#657b78','#2c4345'));
    for(const sign of [-1,1]){rect(c,sign<0?-11:3,-9+sign*step,9,23,3,'#343d3d');rect(c,sign<0?-13:2,7+sign*step,13,8,3,'#292f32','#687263');}
    shape(c,[[-13,-37+bob],[13,-37+bob],[19,3],[-1,9],[-20,3]],grad(c,-10,-40,8,base,'#32484b'));
    if(!cloth&&!leather){facet(c,-14,-37+bob,29,28,metal,base,'#354c50');for(let j=0;j<3;j++)line(c,[[-11,-15+j*5],[13,-15+j*5]],'#a1aca0',1.4);}
    else{line(c,[[-9,-33],[3,-15],[12,-31]],trim,2);line(c,[[0,-32],[0,4]],'#d2bf9855',1.3);}
    for(const sign of [-1,1]){oval(c,sign*16,-31+bob,8,7,leather?'#9b7950':cloth?'#9c8ea6':metal);line(c,[[sign*17,-27+bob],[sign*20,-11+bob]],base,8);oval(c,sign*20,-9+bob,4,5,'#b2997d');}
    rect(c,-16,-7,32,5,1,'#463e33');rect(c,-3,-8,7,7,1,trim);
    oval(c,0,-48+bob,11,12,'#c5aa8c');oval(c,-5,-47+bob,3,5,'#e0c2a0');
    if(cloth){shape(c,[[-14,-48+bob],[-12,-62+bob],[0,-69+bob],[13,-61+bob],[15,-46+bob],[7,-53+bob],[0,-60+bob],[-6,-51+bob]],base);rect(c,-8,-50+bob,16,5,2,'#3b4143');}
    else{oval(c,0,-55+bob,14,10,grad(c,-9,-65,-45,leather?'#a08e6b':metal,'#4b6467'));shape(c,[[-14,-55+bob],[-12,-43+bob],[-7,-40+bob],[-7,-52+bob]],base);shape(c,[[14,-55+bob],[12,-43+bob],[7,-40+bob],[7,-52+bob]],base);rect(c,-10,-53+bob,20,5,2,'#263a3e');line(c,[[-10,-58+bob],[0,-62+bob],[10,-58+bob]],trim,1.3);}
    if(s.armor>=3){gem(c,0,-60+bob,3,trim);for(const sign of [-1,1])line(c,[[sign*15,-33+bob],[sign*19,-31+bob]],trim,2);}
    if(s.supportKind==='shield'){
      shape(c,[[-29,-31+bob],[-13,-28+bob],[-14,-7+bob],[-22,1+bob],[-32,-8+bob]],'#536d6c',trim,2);
      shape(c,[[-27,-28+bob],[-22,-27+bob],[-22,-3+bob],[-29,-9+bob]],'#81988b',null);oval(c,-22,-16+bob,4,4,trim);
    }else if(s.supportKind==='focus'){rect(c,-31,-29+bob,18,24,2,'#5f526f',trim);line(c,[[-27,-27+bob],[-27,-7+bob]],'#b7ab98',2);gem(c,-21,-17+bob,4,'#b4b9c7');}
    else{line(c,[[-24,0],[-26,-31+bob]],'#806345',4);glow(c,-26,-35+bob,15,'#e3b16b33');oval(c,-26,-35+bob,5,9,'#edbb70');oval(c,-26,-33+bob,2.5,5,'#fff0b5');}
    const angle=Math.atan2(world.facing.y,world.facing.x),swing=world.swing>0?(1-world.swing/.3)*2-1:0;
    c.save();c.translate(18,-17+bob);c.rotate(angle+Math.PI/2+swing);drawWeapon(c,s.weaponKind,world.time);c.restore();c.restore();
    if(world.swing>0&&!['bow','staff'].includes(s.weaponKind)){c.beginPath();c.arc(s.x,s.y-14,57,angle-.7+swing,angle+.7+swing);c.strokeStyle='#f1dfae99';c.lineWidth=4;c.stroke();}
  }
  function camp(c,world){
    const {x,y}=world.camp||{x:385,y:440},time=world.time||0;c.save();c.translate(x,y);
    glow(c,0,-8,65,'#e7a4541a');oval(c,0,10,37,13,'#20302677');
    for(let j=0;j<9;j++){const a=j/9*TAU;facet(c,Math.cos(a)*24-6,Math.sin(a)*9-3,13,9,'#b1b09a','#747e6c','#4c5d51');}
    line(c,[[-17,6],[17,-5]],'#4a3b2b',8);line(c,[[-14,-6],[13,9]],'#785736',7);
    const flicker=Math.sin(time*11)*3;
    shape(c,[[-13,0],[-9,-17],[-4,-14],[3,-34-flicker],[8,-16],[14,-7],[8,5],[-4,7]],'#e3a25d',null);
    shape(c,[[-6,3],[-4,-9],[2,-21],[5,-5],[8,2],[0,5]],'#f7d291',null);
    for(let j=0;j<4;j++)oval(c,Math.sin(time*2+j)*10,-19-((time*18+j*11)%33),1.2,1.8,'#e9bd7488');
    const mx=73,my=-60;oval(c,mx+1,my+12,23,8,'#1c2d2966');
    rect(c,mx-13,my-6,10,20,3,'#384239');rect(c,mx+3,my-6,10,20,3,'#384239');
    shape(c,[[mx-16,my-29],[mx+13,my-29],[mx+18,my+4],[mx-19,my+5]],'#7d6850');rect(c,mx-12,my-29,25,24,3,'#8f805f');line(c,[[mx-9,my-24],[mx+10,my-10]],'#c3a475',3);rect(c,mx-16,my-4,34,4,1,'#443c2e');
    oval(c,mx,my-40,11,13,'#c6ac89');oval(c,mx,my-47,19,6,'#596649');shape(c,[[mx-12,my-49],[mx-7,my-61],[mx+8,my-60],[mx+12,my-49]],'#75835d');line(c,[[mx-11,my-51],[mx+12,my-51]],'#b7a276',2);line(c,[[mx-7,my-37],[mx,my-30],[mx+7,my-37]],'#b9ae92',3);
    rect(c,mx-39,my-3,15,16,2,'#7a6243','#ad9463');rect(c,mx+23,my-19,20,28,3,'#8f734c','#4a4635');line(c,[[mx+24,my-12],[mx+42,my-12]],'#3c4c40',3);
    c.textAlign='center';c.font='700 10px system-ui';c.strokeStyle='#1b2823';c.lineWidth=3;c.strokeText('ТОРГОВЕЦЬ',mx,my-75);c.fillStyle='#dfcfaa';c.fillText('ТОРГОВЕЦЬ',mx,my-75);rect(c,mx-8,my-68,16,16,3,'#314b40','#8e9c76');c.fillText('E',mx,my-56);
    c.restore();
  }

  function weapon(c,kind,time){
    if(kind==='bow'){
      line(c,[[-5,-42],[7,-34],[15,-19],[8,-4],[-5,5]],'#3b322b',6);
      line(c,[[-5,-42],[7,-34],[15,-19],[8,-4],[-5,5]],'#ba9361',3);
      line(c,[[-5,-42],[2,-18],[-5,5]],'#ded2b0',1);
      line(c,[[-13,-19],[22,-19]],'#d5c4a3',2);shape(c,[[22,-22],[28,-19],[22,-16]],'#c7d2ce');
      for(const y of [-29,-11])line(c,[[8,y],[13,y+2]],'#d8c490',2);
    }else if(kind==='staff'){
      line(c,[[-1,16],[0,-40]],'#42372f',6);line(c,[[-2,16],[-1,-40]],'#9f8156',3);
      for(const sign of [-1,1])line(c,[[0,-31],[sign*10,-42],[sign*6,-56]],'#bdab7c',2);
      glow(c,0,-46,17,'#94dce333');gem(c,0,-46,9,'#a5cfcd');
      for(let j=0;j<3;j++)line(c,[[-3,-19+j*5],[3,-16+j*5]],'#c6b07b',2);
    }else if(kind==='spear'){
      line(c,[[0,24],[0,-45]],'#513e2e',5);line(c,[[-1,22],[-1,-43]],'#b19362',2);
      shape(c,[[0,-65],[-7,-45],[0,-35],[7,-45]],'#bccbc4');shape(c,[[0,-65],[0,-35],[7,-45]],'#748e8a',null);
      line(c,[[-5,-36],[5,-36]],'#d6bb83',3);for(let j=0;j<3;j++)line(c,[[-2,-30+j*4],[2,-30+j*4]],'#807953',2);
    }else if(kind==='axe'){
      rect(c,-3,-43,6,59,2,'#97754b','#44392b');shape(c,[[0,-40],[9,-41],[21,-49],[26,-22],[12,-26],[0,-24]],'#9aaea7');
      shape(c,[[21,-49],[26,-22],[20,-25],[17,-43]],'#d8dfca',null);line(c,[[0,-36],[14,-34]],'#5e7872',2);rect(c,-5,-6,10,8,2,'#534630');
    }else{
      const dagger=kind==='daggers',top=dagger?-30:-49;
      shape(c,[[0,top],[-5,top+11],[-5,-7],[0,-3],[5,-7],[5,top+11]],'#d4ddd1');shape(c,[[0,top],[0,-3],[5,-7],[5,top+11]],'#809995',null);
      line(c,[[-10,-4],[10,-4]],'#d1b780',4);rect(c,-3,-1,6,15,1,'#6c5038');oval(c,0,15,4,3,'#c2ae79');
      if(dagger){c.save();c.translate(-18,3);c.rotate(-.2);shape(c,[[0,-32],[-4,-23],[-4,-7],[0,-3],[4,-7],[4,-23]],'#c6d5cf');line(c,[[-8,-4],[8,-4]],'#b7a370',3);line(c,[[0,-1],[0,10]],'#72583b',4);c.restore();}
    }
  }
  function drop(c,d){c.save();c.translate(d.x,d.y);oval(c,3,9,14,5,'#20322966');shape(c,[[-8,-11],[-12,4],[-6,10],[8,8],[12,1],[7,-12]],'#9f8860','#3d4a3c');line(c,[[-7,-9],[8,-10]],'#d3bc85',3);line(c,[[0,-9],[0,6]],'#c2a67a',1.5);oval(c,8,-12,4,3,'#d1bc85');c.restore();}

  function decorate(art,R){art.drawMonster=monster;art.drawWeapon=weapon;art.drawNode=(c,n,w)=>node(c,n,w,R);}
  return {monster,tree,house,rock,node,player,camp,weapon,drop,decorate};
});
