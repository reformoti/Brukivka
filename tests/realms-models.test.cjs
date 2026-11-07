const test=require('node:test'),assert=require('node:assert/strict'),M=require('../realms-models'),R=require('../realms-core');
function recorder(){
  const commands=[],stack=[];let depth=0;
  const c={globalAlpha:1,commands,get depth(){return depth;}};
  for(const name of ['beginPath','closePath','fill','stroke'])c[name]=()=>commands.push([name,c.fillStyle,c.strokeStyle,c.globalAlpha]);
  for(const name of ['moveTo','lineTo','translate','scale','rotate','bezierCurveTo','quadraticCurveTo','roundRect','ellipse','arc','fillRect','strokeRect']){
    c[name]=(...args)=>{for(const n of args)assert(Number.isFinite(n),name+' has a non-finite coordinate');if(name==='ellipse')assert(args[2]>=0&&args[3]>=0);if(name==='arc')assert(args[2]>=0);commands.push([name,...args]);};
  }
  c.save=()=>{depth++;stack.push({globalAlpha:c.globalAlpha,fillStyle:c.fillStyle,strokeStyle:c.strokeStyle});};
  c.restore=()=>{assert(depth>0,'restore without save');depth--;Object.assign(c,stack.pop());};
  for(const name of ['createLinearGradient','createRadialGradient'])c[name]=(...args)=>{
    assert(args.every(Number.isFinite));const stops=[];commands.push([name,...args,stops]);return {addColorStop(offset,color){assert(offset>=0&&offset<=1);assert.equal(typeof color,'string');stops.push([offset,color]);}};
  };
  c.fillText=c.strokeText=(label,x,y)=>{assert(Number.isFinite(x)&&Number.isFinite(y));commands.push(['text',label,x,y]);};
  return c;
}
function world(){return {time:1.7,state:R.normalize({level:12,armor:3}),facing:{x:1,y:0},footstep:2,swing:0,dashTime:0,hurt:0,selectedNode:null};}
function render(fn){const c=recorder();fn(c);assert.equal(c.depth,0);assert.equal(c.globalAlpha,1);return JSON.stringify(c.commands);}
test('all ten monster models render distinct finite geometry without mutating monsters or player',()=>{
  const w=world(),before=JSON.stringify(w),drawings=new Set();
  for(const type of Object.keys(R.TYPES)){const m={id:0,type,x:500,y:500,phase:.2,alive:true,state:'chase'},copy=JSON.stringify(m);drawings.add(render(c=>M.monster(c,m,w)));assert.equal(JSON.stringify(m),copy);}
  assert.equal(drawings.size,10);assert.equal(JSON.stringify(w),before);
});
test('monster facing and animations respond to real world state',()=>{
  const w=world(),m={type:'wolf',x:500,y:500,phase:.2,alive:true,state:'chase'};
  const a=render(c=>M.monster(c,m,w));w.time=2.4;assert.notEqual(render(c=>M.monster(c,m,w)),a);
  const b=render(c=>M.monster(c,m,w));w.state.x=700;assert.notEqual(render(c=>M.monster(c,m,w)),b);
  const c=recorder();M.monster(c,{...m,alive:false},w);assert.equal(c.commands.length,0);
});
test('all resource nodes render both available and exhausted without consuming charges',()=>{
  const w=world();for(const [type,t] of Object.entries(R.NODE_TYPES)){const n={id:0,type,x:350,y:500,charges:t.charges};w.selectedNode=0;const before=JSON.stringify(n),a=render(c=>M.node(c,n,w,R));assert.equal(JSON.stringify(n),before);n.charges=0;assert.notEqual(render(c=>M.node(c,n,w,R)),a);}
});
test('equipment, offhands, walking and weapon families render without changing owned gear',()=>{
  const w=world();for(const armorKind of Object.keys(R.ARMOR_KINDS))for(const supportKind of Object.keys(R.SUPPORTS))for(const weaponKind of Object.keys(R.FAMILIES)){Object.assign(w.state,{armorKind,supportKind,weaponKind});const before=JSON.stringify(w.state);render(c=>M.player(c,w,true,M.weapon));assert.equal(JSON.stringify(w.state),before);}
  w.swing=.15;w.hurt=.2;w.dashTime=.1;render(c=>M.player(c,w,false,M.weapon));
  const drawings=new Set(Object.keys(R.FAMILIES).map(kind=>render(c=>M.weapon(c,kind,1))));assert.equal(drawings.size,6);
});
test('environment details are deterministic and keep collision footprints untouched',()=>{
  for(const o of R.OBSTACLES.filter(o=>o.type!=='water')){const before=JSON.stringify(o),draw=c=>o.type==='house'?M.house(c,o):M.rock(c,o);assert.equal(render(draw),render(draw));assert.equal(JSON.stringify(o),before);}
  const trees=new Set();for(let tone=0;tone<3;tone++)trees.add(render(c=>M.tree(c,{x:20,y:30,size:.7,tone})));assert.equal(trees.size,3);
  const w=world(),before=JSON.stringify(w);render(c=>M.camp(c,w));render(c=>M.drop(c,{x:10,y:20}));assert.equal(JSON.stringify(w),before);
});
test('model integration preserves existing art icons and telegraphs',()=>{
  const art={icon:()=>'<svg/>',telegraphs:()=>42};const icon=art.icon,telegraphs=art.telegraphs;M.decorate(art,R);assert.equal(art.icon,icon);assert.equal(art.telegraphs,telegraphs);assert.equal(typeof art.drawMonster,'function');assert.equal(art.drawWeapon,M.weapon);
  render(c=>art.drawNode(c,{id:0,type:'copper',x:0,y:0,charges:1},world()));
});
