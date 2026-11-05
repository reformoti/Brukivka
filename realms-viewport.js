(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BrukViewport=factory();})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const inside=(p,view,pad=180)=>p.x>=view.x-pad&&p.x<=view.x+view.width+pad&&p.y>=view.y-pad&&p.y<=view.y+view.height+pad;
  class Grid{
    constructor(items,size=256){this.size=size;this.cells=new Map();for(const item of items){const key=this.key(item.x,item.y);if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(item);}}
    key(x,y){return Math.floor(x/this.size)+','+Math.floor(y/this.size);}
    query(view,pad=180){const result=[];for(let y=Math.floor((view.y-pad)/this.size);y<=Math.floor((view.y+view.height+pad)/this.size);y++)for(let x=Math.floor((view.x-pad)/this.size);x<=Math.floor((view.x+view.width+pad)/this.size);x++)for(const item of this.cells.get(x+','+y)||[])if(inside(item,view,pad))result.push(item);return result;}
  }
  class Cache{
    constructor(limit=48){this.limit=limit;this.items=new Map();}
    get(key,make){if(this.items.has(key)){const value=this.items.get(key);this.items.delete(key);this.items.set(key,value);return value;}const value=make();this.items.set(key,value);while(this.items.size>this.limit)this.items.delete(this.items.keys().next().value);return value;}
  }
  return {inside,Grid,Cache};
});
