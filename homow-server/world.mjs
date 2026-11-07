import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),R=require('../realms-core.js');
export {R};
export class Realm {
 constructor(){this.players=new Map();const base=new R.World();this.monsters=base.monsters;this.nodes=base.nodes;}
 join(id,name,saved={}){if(this.players.has(id))throw Error('Акаунт уже в грі.');const w=new R.World(saved);w.keyboardOnly=true;w.monsters=this.monsters;w.nodes=this.nodes;w.updateMonster=()=>{};const p={id,name,w,input:{},lastInput:0};this.players.set(id,p);return p;}
 input(p,v){const n=Date.now();p.lastInput=n;p.input={left:v.left===true,right:v.right===true,up:v.up===true,down:v.down===true,attack:v.attack===true,skill:v.skill===true,dash:v.dash===true};p.input.x=Number(p.input.right)-Number(p.input.left);p.input.y=Number(p.input.down)-Number(p.input.up);if(v.potion===true)p.w.potion();}
 tick(dt){dt=Math.min(.1,Math.max(0,dt));for(const p of this.players.values()){p.w.update(dt,Date.now()-p.lastInput<500?p.input:{});p.w.events.length=0;}for(const m of this.monsters){let nearest=null,d=Infinity;for(const p of this.players.values()){const n=Math.hypot(p.w.state.x-m.x,p.w.state.y-m.y);if(n<d){d=n;nearest=p;}}if(nearest)R.World.prototype.updateMonster.call(nearest.w,m,dt);}}
 snapshot(p){const s=p.w.state;return {type:'world',you:p.id,state:s,players:[...this.players.values()].filter(q=>Math.hypot(q.w.state.x-s.x,q.w.state.y-s.y)<1200).map(q=>({id:q.id,name:q.name,state:q.w.state,facing:q.w.facing,time:q.w.time,footstep:q.w.footstep,swing:q.w.swing})),monsters:this.monsters.filter(m=>Math.hypot(m.x-s.x,m.y-s.y)<1200)};}
 saved(p){const s=p.w.save();s.mobState={};s.nodeState={};return s;}
}
