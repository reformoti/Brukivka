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
  class FrameClock{
    constructor(){this.last=0;}
    due(time,fps){const interval=1000/fps,elapsed=time-this.last;if(elapsed+.01<interval)return false;this.last+=Math.max(1,Math.floor((elapsed+.01)/interval))*interval;return true;}
  }
  // Opt-in diagnostic storage is bounded to one minute at 60 FPS.
  class FrameStats{
    constructor(limit=3600){this.limit=limit;this.times=new Float64Array(limit);this.costs=new Float64Array(limit);this.reset();}
    reset(){this.count=0;this.next=0;}
    frame(time,cost){this.times[this.next]=time;this.costs[this.next]=cost;this.next=(this.next+1)%this.limit;this.count=Math.min(this.limit,this.count+1);}
    report(){const gaps=[],costs=[],start=(this.next-this.count+this.limit)%this.limit;let previous=null,first=0,last=0;for(let i=0;i<this.count;i++){const index=(start+i)%this.limit,time=this.times[index];if(previous!==null)gaps.push(time-previous);else first=time;previous=time;last=time;costs.push(this.costs[index]);}gaps.sort((a,b)=>a-b);costs.sort((a,b)=>a-b);const percentile=(values,p)=>values.length?values[Math.ceil(values.length*p)-1]:0;return {frames:this.count,durationMs:last-first,fps:last>first?(this.count-1)*1000/(last-first):0,frameP95Ms:percentile(gaps,.95),drawP95Ms:percentile(costs,.95),stallsOver50Ms:gaps.filter(x=>x>50.01).length};}
  }
  return {inside,Grid,Cache,FrameClock,FrameStats};
});
