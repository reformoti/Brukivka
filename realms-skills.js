(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BrukSkills=factory();})(typeof window==='undefined'?globalThis:window,function(){return {create(D){function info(s){return D.SKILL_CHOICES[s.weaponKind].find(i=>i.id===s.weaponSkills?.[s.weaponKind])||D.SKILL_CHOICES[s.weaponKind][0];}
function perform(w,R,adapter){const s=w.state,k=info(s);if(w.skillCooldown>0)return {ok:false,message:'Прийом ще відновлюється.'};if(s.mana<k.mana)return {ok:false,message:'Недостатньо енергії.'};w.dismount();w.mounting=null;w.recalling=null;w.gathering=null;w.selectedNode=null;const targets=adapter.targets(450),target=targets[0],pos=t=>adapter.position(t),point=target?pos(target):{x:s.x+w.facing.x*170,y:s.y+w.facing.y*170},angle=Math.atan2(point.y-s.y,point.x-s.x),power=R.attack(s);s.mana-=k.mana;w.skillCooldown=Math.max(5,k.cooldown-s.mastery[s.weaponKind].level*.2);w.swing=.3;w.lastCombat=w.time;const hit=(t,factor,slow=0,dot=false)=>{if(!t)return;adapter.hit(t,power*factor);if(slow)adapter.slow?.(t,slow);if(dot)adapter.dot?.(t,Math.max(3,power*.15));},step=(direction,distance)=>{for(let i=0;i<10;i++)w.moveEntity(s,Math.cos(direction)*distance/10,Math.sin(direction)*distance/10);};
if(k.id==='mend'){const value=35+s.level*2;s.hp=Math.min(R.maxHp(s),s.hp+value);w.emit('heal',{x:s.x,y:s.y-35,value});}
else if(k.id==='retreat'){step(angle+Math.PI,160);if(s.weaponKind==='bow')w.shoot('player',s.x,s.y,angle,power,{range:400});}
else if(k.id==='charged'||k.id==='frost')w.shoot('player',s.x,s.y,angle,power*(k.id==='charged'?2.5:2),{range:450,slow:k.id==='frost'?4:2,magic:k.id==='frost'});
else if(k.id==='lunge'||k.id==='ambush'){step(angle,100);hit(adapter.targets(140)[0],k.id==='lunge'?1.9:2.3);}
else if(k.id==='pierce')hit(adapter.targets(230)[0],2.8);
else if(k.id==='rending')hit(adapter.targets(140)[0],2,0,true);
else if(k.id==='flurry'){for(let i=0;i<5;i++)hit(adapter.targets(85)[0],.5);s.hp=Math.min(R.maxHp(s),s.hp+15);w.emit('heal',{x:s.x,y:s.y-35,value:15});}
else if(k.id==='quake'||k.id==='nova'){const radius=k.id==='nova'?150:180;w.emit('burst',{x:s.x,y:s.y,radius});for(const t of adapter.targets(radius))hit(t,k.id==='nova'?1.7:1.6,3);}
return {ok:true,message:k.name};}
return {info,perform};}};});
