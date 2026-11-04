/* Reuse the desktop player so a game never interrupts the current track. */
(() => {
  'use strict';let bridge=null,audio=null,index=0;
  try{if(parent!==window&&parent.BrukMusic)bridge=parent.BrukMusic;}catch{}
  const tracks=['music/mp3(1).mp3','music/mp3(2).mp3','music/mp3(3).mp3','music/mp3(4).mp3'];
  const button=document.getElementById('musicToggle'),next=document.getElementById('musicNext'),volume=document.getElementById('musicVolume'),label=document.getElementById('musicLabel');
  if(!button)return;
  if(!bridge){audio=new Audio(tracks[0]);audio.volume=.35;audio.addEventListener('ended',()=>{index=(index+1)%tracks.length;audio.src=tracks[index];audio.play().catch(()=>{});});}
  function state(){return bridge?bridge.state():{playing:!audio.paused,volume:audio.volume,track:'Bruk radio · '+(index+1)};}
  function render(){const s=state();button.textContent=s.playing?'Ⅱ Музика':'▶ Музика';button.setAttribute('aria-pressed',String(s.playing));if(volume&&document.activeElement!==volume)volume.value=Math.round(s.volume*100);if(label)label.textContent=typeof s.track==='string'?s.track:s.track?.title||s.track?.name||'Bruk radio';}
  button.addEventListener('click',()=>{if(bridge)bridge.toggle();else if(audio.paused)audio.play().catch(()=>{if(label)label.textContent='Не вдалося завантажити трек';});else audio.pause();render();});
  next?.addEventListener('click',()=>{if(bridge)bridge.next();else{index=(index+1)%tracks.length;audio.src=tracks[index];audio.play().catch(()=>{});}render();});
  volume?.addEventListener('input',()=>{const value=Math.max(0,Math.min(1,Number(volume.value)/100));if(bridge)bridge.volume(value);else audio.volume=value;});
  const timer=setInterval(render,1000);window.addEventListener('pagehide',()=>{clearInterval(timer);if(audio)audio.pause();});render();
})();
