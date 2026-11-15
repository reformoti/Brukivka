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
    due(time,fps){const interval=1000/fps,elapsed=time-this.last,tolerance=Math.min(2,interval*.12);if(elapsed+tolerance<interval)return false;this.last+=Math.max(1,Math.floor((elapsed+tolerance)/interval))*interval;return true;}
  }
  // Opt-in diagnostic storage is bounded to one minute at 60 FPS.
  class FrameStats{
    constructor(limit=3600){this.limit=limit;this.times=new Float64Array(limit);this.costs=new Float64Array(limit);this.reset();}
    reset(){this.count=0;this.next=0;this.callbacks=0;this.callbackFirst=0;this.callbackLast=0;}
    tick(time){if(!this.callbacks)this.callbackFirst=time;this.callbackLast=time;this.callbacks++;}
    frame(time,cost){this.times[this.next]=time;this.costs[this.next]=cost;this.next=(this.next+1)%this.limit;this.count=Math.min(this.limit,this.count+1);}
    report(){const gaps=[],costs=[],start=(this.next-this.count+this.limit)%this.limit;let previous=null,first=0,last=0;for(let i=0;i<this.count;i++){const index=(start+i)%this.limit,time=this.times[index];if(previous!==null)gaps.push(time-previous);else first=time;previous=time;last=time;costs.push(this.costs[index]);}gaps.sort((a,b)=>a-b);costs.sort((a,b)=>a-b);const percentile=(values,p)=>values.length?values[Math.ceil(values.length*p)-1]:0;return {frames:this.count,durationMs:last-first,fps:last>first?(this.count-1)*1000/(last-first):0,rafFps:this.callbackLast>this.callbackFirst?(this.callbacks-1)*1000/(this.callbackLast-this.callbackFirst):0,frameP95Ms:percentile(gaps,.95),drawP95Ms:percentile(costs,.95),stallsOver50Ms:gaps.filter(x=>x>50.01).length};}
  }
  class Motion{
    constructor(){this.value={x:0,y:0};this.ready=false;}
    push(x,y,time){if(!this.ready||Math.hypot(x-this.x,y-this.y)>160){this.fromX=this.x=x;this.fromY=this.y=y;this.duration=50;this.ready=true;}else{const p=this.sample(time);this.fromX=p.x;this.fromY=p.y;this.duration=Math.max(30,Math.min(100,time-this.at));this.x=x;this.y=y;}this.at=time;}
    sample(time){if(!this.ready)return this.value;const t=Math.max(0,Math.min(1,(time-this.at)/this.duration));this.value.x=this.fromX+(this.x-this.fromX)*t;this.value.y=this.fromY+(this.y-this.fromY)*t;return this.value;}
  }
  return {inside,Grid,Cache,FrameClock,FrameStats,Motion};
});
