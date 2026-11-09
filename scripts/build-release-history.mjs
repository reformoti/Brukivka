import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),source=readFileSync(new URL('CHANGELOG.md',root),'utf8');
const history=[...source.matchAll(/^# v([\d.]+) · (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=^# v|$(?![\s\S]))/gm)].map(m=>({version:m[1],date:m[2],notes:m[3].split('\n').filter(l=>l.startsWith('- ')).map(l=>l.slice(2))}));
if(!history.length)throw Error('No releases found');
const release=readFileSync(new URL('release.js',root),'utf8').match(/version:'([^']+)'/)[1];
if(history[0].version!==release)throw Error('Release and changelog versions differ');
for(const name of ['index.html','realms.html']){
  const file=new URL(name,root),html=readFileSync(file,'utf8');
  writeFileSync(file,html.replace(/(\.(?:js|css)\?v=)[\d.]+/g,'$1'+release));
}
const render=`\nconst timeline=document.querySelector('.history-timeline');if(!timeline)return;const known=new Set(history.map(r=>r.version));for(const old of [...timeline.children]){const version=old.querySelector('time')?.textContent.match(/v([\\d.]+)/)?.[1];if(known.has(version))old.remove();}for(const r of [...history].reverse()){const article=document.createElement('article'),time=document.createElement('time'),title=document.createElement('h3'),list=document.createElement('ul');article.dataset.releaseVersion=r.version;time.textContent=r.date+' · v'+r.version;title.textContent=r.version===window.BrukRelease.version?window.BrukRelease.name:'Оновлення '+r.version;for(const note of r.notes){const item=document.createElement('li');item.textContent=note;list.append(item);}article.append(time,title,list);timeline.prepend(article);}const card=document.querySelector('.release-card p');if(card)card.textContent=history[0].notes[0]||'';\n`;
writeFileSync(new URL('release-history.js',root),'// Generated from CHANGELOG.md by scripts/build-release-history.mjs.\n(()=>{\'use strict\';const history='+JSON.stringify(history)+';window.BrukReleaseHistory=history;'+render+'})();\n');
console.log('Built release history:',history.length,'versions');
