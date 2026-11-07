(function(root){
  'use strict';
  const W=1200,H=800,DRAFT='brukivka_paint_draft_v2',FILES='brukivka_paint_folder_v2';
  const tools=new Set(['brush','eraser','line','rect','ellipse','clear','paper']);
  const validColor=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
  const clone=value=>JSON.parse(JSON.stringify(value));
  function sanitizeDocument(raw){
    if(!raw||!Array.isArray(raw.actions)||raw.actions.length>2000)return null;
    let count=0;const actions=[];
    for(const a of raw.actions){
      if(!a||!tools.has(a.tool)||!validColor(a.color)||!Number.isFinite(a.width)||a.width<1||a.width>80||!Array.isArray(a.points))return null;
      count+=a.points.length;if(count>100000)return null;
      if(a.points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[0]<0||p[0]>W||p[1]<0||p[1]>H))return null;
      if(!['clear','paper'].includes(a.tool)&&!a.points.length)return null;
      actions.push({tool:a.tool,color:a.color,width:a.width,fill:a.fill===true,points:a.points.map(p=>p.slice())});
    }
    return {version:2,width:W,height:H,paper:validColor(raw.paper)?raw.paper:'#ffffff',actions};
  }
  function paintAction(ctx,a){
    if(a.tool==='paper')return;
    if(a.tool==='clear'){ctx.clearRect(0,0,W,H);return;}
    ctx.save();ctx.globalCompositeOperation=a.tool==='eraser'?'destination-out':'source-over';
    ctx.strokeStyle=ctx.fillStyle=a.color;ctx.lineWidth=a.width;ctx.lineCap=ctx.lineJoin='round';
    const first=a.points[0],last=a.points[a.points.length-1];
    ctx.beginPath();
    if(a.tool==='brush'||a.tool==='eraser'){
      if(a.points.length===1){ctx.arc(first[0],first[1],a.width/2,0,Math.PI*2);ctx.fill();}
      else{
        ctx.moveTo(...first);
        for(let i=1;i<a.points.length-1;i++){const p=a.points[i],q=a.points[i+1];ctx.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);}
        ctx.lineTo(...last);ctx.stroke();
      }
    }else if(a.tool==='line'){ctx.moveTo(...first);ctx.lineTo(...last);ctx.stroke();}
    else{
      const x=Math.min(first[0],last[0]),y=Math.min(first[1],last[1]),w=Math.abs(first[0]-last[0]),h=Math.abs(first[1]-last[1]);
      if(a.tool==='rect')ctx.rect(x,y,w,h);else ctx.ellipse(x+w/2,y+h/2,Math.max(.1,w/2),Math.max(.1,h/2),0,0,Math.PI*2);
      if(a.fill)ctx.fill();else ctx.stroke();
    }
    ctx.restore();
  }
  function paperColor(doc,pending){
    let color=doc.paper;
    for(const a of doc.actions)if(a.tool==='paper')color=a.color;
    if(pending?.tool==='paper')color=pending.color;
    return color;
  }
  function drawDocument(doc,canvas,makeCanvas){
    const ink=makeCanvas(W,H),ctx=ink.getContext('2d');
    for(const a of doc.actions)paintAction(ctx,a);
    const out=canvas.getContext('2d');out.clearRect(0,0,canvas.width,canvas.height);
    out.fillStyle=paperColor(doc);out.fillRect(0,0,canvas.width,canvas.height);out.drawImage(ink,0,0,canvas.width,canvas.height);
    return canvas;
  }
  const pure={sanitizeDocument,paintAction,drawDocument,W,H};
  if(typeof module!=='undefined'&&module.exports)module.exports=pure;
  if(!root.document)return;
  const $=id=>document.getElementById(id);
  const makeCanvas=(w=W,h=H)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const blank=()=>({version:2,width:W,height:H,paper:'#ffffff',actions:[]});
  let doc=blank(),name='Малюнок 1',fileId=null,dirty=false,redo=[],tool='brush',color='#26394b',width=8,fill=false;
  let directory={created:false,files:[]},cleanup=null,finishStroke=null,storageProblem='';
  const safeName=value=>String(value||'Малюнок').replace(/[\\/:*?"<>|\x00-\x1f]/g,'').replace(/\.png$/i,'').trim().slice(0,64)||'Малюнок';
  try{
    const raw=JSON.parse(localStorage.getItem(FILES));
    if(raw&&Array.isArray(raw.files)){
      directory.created=raw.created===true;
      directory.files=raw.files.flatMap(f=>{
        const drawing=sanitizeDocument(f?.document);
        if(!drawing||typeof f.id!=='string'||f.id.length>100)return [];
        return [{id:f.id,name:safeName(f.name),createdAt:Number(f.createdAt)||0,updatedAt:Number(f.updatedAt)||0,document:drawing,
          thumbnail:typeof f.thumbnail==='string'&&/^data:image\/(png|webp);base64,[a-z0-9+/=]+$/i.test(f.thumbnail)?f.thumbnail:''}];
      });
    }
    const draft=JSON.parse(localStorage.getItem(DRAFT)),drawing=sanitizeDocument(draft?.document);
    if(drawing){doc=drawing;name=safeName(draft.name);fileId=directory.files.some(f=>f.id===draft.fileId)?draft.fileId:null;dirty=draft.dirty===true;}
    else{
      // Import the previous small pixel sketch once, keeping the old app data intact.
      const legacy=JSON.parse(localStorage.getItem('brukivka_pc_apps_v1'));
      if(Array.isArray(legacy?.paint)&&legacy.paint.length===96)legacy.paint.forEach((c,i)=>{
        if(validColor(c))doc.actions.push({tool:'rect',color:c,width:1,fill:true,points:[[(i%12)*100,Math.floor(i/12)*100],[(i%12+1)*100,(Math.floor(i/12)+1)*100]]});
      });
      dirty=doc.actions.length>0;
    }
  }catch{storageProblem='Не вдалося прочитати частину малюнків. Поточне полотно можна зберегти як PNG.';}
  function notice(text){$('pcPreviewNotice').textContent=text;}
  window.addEventListener('bruk-cloud-snapshot',persistDraft);
  function persistDraft(){try{localStorage.setItem(DRAFT,JSON.stringify({name,fileId,dirty,document:doc}));return true;}catch{notice('Чернетку не збережено: у сховищі браузера бракує місця. Завантаж PNG або звільни місце в папці.');return false;}}
  function folderIcon(){
    const folder=$('paintFolderApp');if(!folder)return;
    folder.classList.toggle('hidden',!directory.created);
    $('paintFolderCount').textContent=`${directory.files.length} зображень`;
  }
  function persistDirectory(next){
    try{localStorage.setItem(FILES,JSON.stringify(next));directory=next;folderIcon();return true;}
    catch{notice('Малюнок не збережено: бракує місця у браузері. Завантаж PNG або видали непотрібні роботи.');return false;}
  }
  function button(text,fn,id){const b=document.createElement('button');b.type='button';b.textContent=text;if(id)b.id=id;b.addEventListener('click',fn);return b;}
  function leave(){if(cleanup){cleanup();cleanup=null;}finishStroke=null;}
  function navigate(id){root.BrukPcApps.open(id);}
  function exportCanvas(drawing=doc){return drawDocument(drawing,makeCanvas(),makeCanvas);}
  function download(drawing=doc,title=name){
    const a=document.createElement('a');a.href=exportCanvas(drawing).toDataURL('image/png');a.download=safeName(title)+'.png';document.body.append(a);a.click();a.remove();
  }
  function save(copy=false){
    if(finishStroke)finishStroke();
    const now=Date.now(),old=copy?null:directory.files.find(f=>f.id===fileId);
    const image=exportCanvas(),thumb=makeCanvas(240,160);thumb.getContext('2d').drawImage(image,0,0,240,160);
    const id=old?.id||(root.crypto?.randomUUID?.()||`${now.toString(36)}-${Math.random().toString(36).slice(2)}`);
    const baseName=safeName(name);let fileName=baseName,index=2;
    while(directory.files.some(f=>f.id!==id&&f.name.toLocaleLowerCase()===fileName.toLocaleLowerCase()))fileName=baseName.slice(0,55)+` (${index++})`;
    const file={id,name:fileName,createdAt:old?.createdAt||now,updatedAt:now,document:clone(doc),thumbnail:thumb.toDataURL('image/png')};
    const next={created:true,files:[...directory.files.filter(f=>f.id!==id),file]};
    if(!persistDirectory(next))return false;
    fileId=id;name=file.name;dirty=false;persistDraft();if($('paintName'))$('paintName').value=name;
    const label=$('paintDocumentStatus');if(label)label.textContent='Збережено в «Мої малюнки»';
    notice(`${file.name}.png збережено. Відкрий папку «Мої малюнки» на робочому столі ПК.`);return true;
  }
  function mount(container){
    leave();
    const editor=document.createElement('div');editor.className='paint-editor';container.append(editor);
    const header=document.createElement('div');header.className='paint-editor-heading';
    const title=document.createElement('div');title.innerHTML='<small>BRUKPAINT STUDIO</small><h2>Від ідеї до малюнка</h2><p>Малюй мишею, пальцем або стилусом. Зберігай роботи в папку на ігровому ПК.</p>';
    header.append(title,button('▣ Мої малюнки',()=>navigate('gallery'),'paintOpenFolder'));editor.append(header);
    const toolbar=document.createElement('div');toolbar.className='paint-toolbar';
    const toolsBox=document.createElement('div');toolsBox.className='paint-tool-list';
    const labels={brush:'✎ Кисть',eraser:'▱ Гумка',line:'╱ Лінія',rect:'□ Прямокутник',ellipse:'○ Еліпс'};
    for(const [id,text] of Object.entries(labels)){
      const b=button(text,()=>{finish();tool=id;refresh();});b.dataset.paintTool=id;toolsBox.append(b);
    }toolbar.append(toolsBox);
    const settings=document.createElement('div');settings.className='paint-settings';
    const colorLabel=document.createElement('label');colorLabel.textContent='Колір ';const picker=document.createElement('input');picker.type='color';picker.id='paintColor';picker.value=color;picker.addEventListener('input',()=>{color=picker.value;});colorLabel.append(picker);
    const sizeLabel=document.createElement('label');sizeLabel.textContent='Товщина ';const slider=document.createElement('input');slider.type='range';slider.id='paintWidth';slider.min=1;slider.max=80;slider.value=width;slider.setAttribute('aria-label','Товщина кисті');const size=document.createElement('b');size.id='paintWidthLabel';slider.addEventListener('input',()=>{width=Number(slider.value);refresh();});sizeLabel.append(slider,size);
    const fillLabel=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.id='paintShapeFill';check.checked=fill;check.addEventListener('change',()=>{fill=check.checked;});fillLabel.append(check,document.createTextNode(' Заливка фігур'));
    settings.append(colorLabel,sizeLabel,fillLabel);toolbar.append(settings);editor.append(toolbar);
    const palette=document.createElement('div');palette.className='paint-swatches';
    for(const c of ['#26394b','#ffffff','#f05454','#e79a47','#f4d56a','#69b681','#49b4c6','#6695eb','#a883d1','#ee9fc5','#a37953','#a7b0b8']){
      const b=button('',()=>{color=c;picker.value=c;});b.style.background=c;b.setAttribute('aria-label',`Колір ${c}`);palette.append(b);
    }editor.append(palette);
    const history=document.createElement('div');history.className='paint-history';
    history.append(button('↶ Скасувати',undo,'paintUndo'),button('↷ Повторити',redoAction,'paintRedo'),button('▧ Залити фон',()=>commit({tool:'paper',color,width:1,fill:false,points:[]}),'paintPaper'),
      button('Очистити',()=>commit({tool:'clear',color,width:1,fill:false,points:[]}),'paintClear'),button('+ Нове полотно',()=>{
        finish();if(dirty&&!confirm('Почати нове полотно без збереження поточних змін у папку?'))return;
        doc=blank();name=`Малюнок ${directory.files.length+1}`;fileId=null;dirty=false;redo=[];nameInput.value=name;persistDraft();rebuild();refresh();
      },'paintNew'));
    editor.append(history);
    const paper=document.createElement('div');paper.className='paint-paper';const canvas=makeCanvas();canvas.id='paintCanvas';canvas.tabIndex=0;canvas.setAttribute('aria-label','Полотно для малювання, 1200 на 800');paper.append(canvas);editor.append(paper);
    const bottom=document.createElement('div');bottom.className='paint-file-bar';
    const nameInput=document.createElement('input');nameInput.type='text';nameInput.id='paintName';nameInput.maxLength=64;nameInput.value=name;nameInput.setAttribute('aria-label','Назва малюнка');nameInput.addEventListener('input',()=>{name=safeName(nameInput.value);dirty=true;persistDraft();refresh();});
    bottom.append(nameInput,button('💾 Зберегти',()=>{save();refresh();},'paintSave'),button('Зберегти копію',()=>{save(true);refresh();},'paintSaveCopy'),button('↓ PNG',()=>{finish();download();},'paintDownload'));editor.append(bottom);
    const status=document.createElement('div');status.className='paint-status';status.innerHTML='<span id="paintDocumentStatus"></span><span>1200 × 800 · Ctrl+Z / Ctrl+Y · Ctrl+S</span>';editor.append(status);
    const ink=makeCanvas(),preview=makeCanvas(),ctx=canvas.getContext('2d');
    let pending=null,pointer=null,request=null;
    function present(){
      const p=preview.getContext('2d');p.clearRect(0,0,W,H);p.drawImage(ink,0,0);if(pending)paintAction(p,pending);
      ctx.fillStyle=paperColor(doc,pending);ctx.fillRect(0,0,W,H);ctx.drawImage(preview,0,0);
    }
    function rebuild(){const c=ink.getContext('2d');c.clearRect(0,0,W,H);for(const a of doc.actions)paintAction(c,a);present();}
    function schedule(){if(request===null)request=requestAnimationFrame(()=>{request=null;present();});}
    function refresh(){
      editor.querySelectorAll('[data-paint-tool]').forEach(b=>{b.classList.toggle('active',b.dataset.paintTool===tool);b.setAttribute('aria-pressed',String(b.dataset.paintTool===tool));});
      $('paintWidthLabel').textContent=width+' px';$('paintUndo').disabled=!doc.actions.length;$('paintRedo').disabled=!redo.length;
      $('paintDocumentStatus').textContent=dirty?'Є зміни · чернетка':'Збережено'+(fileId?' в «Мої малюнки»':' · нове полотно');
    }
    function commit(action){
      if(!sanitizeDocument({...doc,actions:[...doc.actions,action]})){rebuild();notice('Полотно дуже складне. Збережи поточний малюнок та почни нове полотно.');return;}
      doc.actions.push(action);redo=[];dirty=true;persistDraft();rebuild();refresh();
    }
    function finish(){if(pending){const action=pending;pending=null;pointer=null;commit(action);}}
    function undo(){finish();if(!doc.actions.length)return;redo.push(doc.actions.pop());dirty=true;persistDraft();rebuild();refresh();}
    function redoAction(){finish();if(!redo.length)return;doc.actions.push(redo.pop());dirty=true;persistDraft();rebuild();refresh();}
    function point(e){const r=canvas.getBoundingClientRect();return [Math.round(Math.max(0,Math.min(W,(e.clientX-r.left)/r.width*W))*10)/10,Math.round(Math.max(0,Math.min(H,(e.clientY-r.top)/r.height*H))*10)/10];}
    function add(e){
      const p=point(e),last=pending.points.at(-1);
      if(['brush','eraser'].includes(pending.tool)){if(Math.hypot(p[0]-last[0],p[1]-last[1])>=.7)pending.points.push(p);}
      else pending.points=[pending.points[0],p];
    }
    canvas.addEventListener('pointerdown',e=>{
      if(pointer!==null||(e.button!==undefined&&e.button!==0))return;
      pointer=e.pointerId;pending={tool,color,width,fill,points:[point(e)]};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});e.preventDefault();schedule();
    });
    canvas.addEventListener('pointermove',e=>{if(!pending||pointer!==e.pointerId)return;const samples=e.getCoalescedEvents?.();for(const sample of samples?.length?samples:[e])add(sample);e.preventDefault();schedule();});
    canvas.addEventListener('pointerup',e=>{if(!pending||pointer!==e.pointerId)return;add(e);finish();});
    canvas.addEventListener('pointercancel',finish);canvas.addEventListener('lostpointercapture',finish);
    function shortcut(e){
      if($('pcOverlay').classList.contains('hidden')||$('pcPreviewPanel').classList.contains('hidden')||!editor.isConnected)return;
      if(!e.ctrlKey&&!e.metaKey)return;const key=e.key.toLowerCase();
      if(key==='s'){e.preventDefault();save();refresh();return;}
      if(e.target.closest('input,textarea'))return;
      if(key==='z'){e.preventDefault();e.shiftKey?redoAction():undo();}
      else if(key==='y'){e.preventDefault();redoAction();}
    }
    document.addEventListener('keydown',shortcut);root.addEventListener('blur',finish);
    cleanup=()=>{finish();if(request!==null)cancelAnimationFrame(request);document.removeEventListener('keydown',shortcut);root.removeEventListener('blur',finish);};
    finishStroke=finish;rebuild();refresh();if(storageProblem)notice(storageProblem);
  }
  function openEditor(file){if(dirty&&!confirm('Поточне полотно має зміни поза папкою. Відкрити інший малюнок?'))return;leave();doc=clone(file.document);name=file.name;fileId=file.id;dirty=false;redo=[];persistDraft();navigate('paint');}
  function showFile(container,id){
    const file=directory.files.find(f=>f.id===id);if(!file)return;
    container.replaceChildren();const header=document.createElement('div');header.className='gallery-heading';
    const h=document.createElement('h2');h.textContent=file.name+'.png';header.append(h,button('← До папки',()=>gallery(container)));container.append(header);
    const viewer=document.createElement('div');viewer.className='paint-viewer';const image=document.createElement('img');image.alt=file.name;image.src=exportCanvas(file.document).toDataURL('image/png');viewer.append(image);container.append(viewer);
    const actions=document.createElement('div');actions.className='gallery-actions';actions.append(button('✎ Редагувати в Paint',()=>openEditor(file),'galleryEdit'),button('↓ Завантажити PNG',()=>download(file.document,file.name),'galleryDownload'));container.append(actions);
  }
  function gallery(container){
    leave();container.replaceChildren();const header=document.createElement('div');header.className='gallery-heading';const title=document.createElement('div');const h=document.createElement('h2');h.textContent='Мої малюнки';
    const p=document.createElement('p');p.textContent=`${directory.files.length} зображень · файли твого ігрового ПК`;title.append(h,p);header.append(title,button('+ Малювати',()=>navigate('paint')));container.append(header);
    if(!directory.files.length){const empty=document.createElement('p');empty.className='gallery-empty';empty.textContent='Папка поки порожня. Намалюй щось у BrukPaint та натисни «Зберегти».';container.append(empty);return;}
    const grid=document.createElement('div');grid.className='paint-gallery';
    for(const file of directory.files.slice().sort((a,b)=>b.updatedAt-a.updatedAt)){
      const card=document.createElement('article');card.className='paint-file';const preview=button('',()=>showFile(container,file.id));preview.className='paint-file-preview';preview.setAttribute('aria-label',`Переглянути ${file.name}`);
      const img=document.createElement('img');img.src=file.thumbnail||exportCanvas(file.document).toDataURL('image/png');img.alt=file.name;preview.append(img);card.append(preview);
      const name=document.createElement('strong');name.textContent=file.name+'.png';const detail=document.createElement('small');detail.textContent='1200 × 800 · '+new Date(file.updatedAt).toLocaleDateString('uk-UA');card.append(name,detail);
      const actions=document.createElement('div');actions.className='paint-file-actions';actions.append(button('Відкрити',()=>showFile(container,file.id)),button('Видалити',()=>{
        if(!confirm(`Видалити «${file.name}.png» з папки?`))return;
        if(persistDirectory({created:true,files:directory.files.filter(f=>f.id!==file.id)})){if(fileId===file.id){fileId=null;dirty=true;persistDraft();}gallery(container);notice('Малюнок видалено з папки.');}
      }));card.append(actions);grid.append(card);
    }container.append(grid);
  }
  folderIcon();root.BrukPaint={mount,gallery,leave,...pure};
})(typeof window==='undefined'?globalThis:window);
