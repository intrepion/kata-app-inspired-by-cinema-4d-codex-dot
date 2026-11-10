import {LIMITS,PALETTES,copy,preset,clones,projectPoint,validate} from './model.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const STORE='kata-orbitweave-v1';let project=preset(),phase=0,playing=false,previous=0,showGrid=true,zoom=1,history=[],future=[],dirty=false,drag=null,storageWarning=false,raf=0;
try{const saved=localStorage.getItem(STORE);if(saved)project=validate(JSON.parse(saved));}catch{storageWarning=true;}
const controlGroups={cloneControls:[['count','Clones',1],['spacing','Spacing',1],['size','Scale',1]],waveControls:[['amplitude','Amplitude',1],['frequency','Frequency',.1]],twistControls:[['twist','Rotation',1]],scatterControls:[['noise','Spread',1]]};
for(const [container,controls]of Object.entries(controlGroups))$('#'+container).innerHTML=controls.map(([id,label,step])=>`<div class="slider-control"><label for="${id}">${label}<output id="${id}Value"></output></label><input id="${id}" type="range" min="${LIMITS[id][0]}" max="${LIMITS[id][1]}" step="${step}"></div>`).join('');
function status(s){$('#status').textContent=s;}
function remember(){history.push(copy(project));if(history.length>50)history.shift();future=[];}
function persist(){dirty=true;try{localStorage.setItem(STORE,JSON.stringify(project));}catch{status('Browser storage is unavailable. Save a project file for a backup.');}}
function update(){renderUI();draw();}
function renderUI(){
 $('#projectName').value=project.name;$('#sceneTitle').textContent=project.name;
 for(const id of Object.keys(LIMITS)){const el=$('#'+id);if(el){el.value=project[id];const output=$('#'+id+'Value');if(output)output.textContent=project[id]+(id==='twist'?'°':'');}}
 for(const id of ['wave','rotation','scatter','field'])$('#'+id).checked=project[id];for(const id of ['shape','palette'])$('#'+id).value=project[id];$('#fieldValue').textContent=project.fieldRadius;
 $$('[data-layout]').forEach(b=>{b.classList.toggle('selected',b.dataset.layout===project.layout);b.setAttribute('aria-pressed',b.dataset.layout===project.layout?'true':'false');});
 $('#stackLayout').textContent=project.layout[0].toUpperCase()+project.layout.slice(1)+' distribution';$('#stackShape').textContent=project.shape[0].toUpperCase()+project.shape.slice(1)+' primitive';$('#objectCount').textContent=project.count+' instances';$('#renderStats').textContent=project.count+' CLONES / CANVAS 2D PROJECTION';$('#palettePreview').innerHTML=PALETTES[project.palette].map(c=>`<i style="background:${c}"></i>`).join('');
 $('#undo').disabled=!history.length;$('#redo').disabled=!future.length;$('#phase').value=phase;$('#time').textContent=(phase*4).toFixed(2).padStart(5,'0');
}
function color(hex,m){const n=parseInt(hex.slice(1),16);return `rgb(${Math.round((n>>16)*m)},${Math.round((n>>8&255)*m)},${Math.round((n&255)*m)})`;}
function draw(target=$('#canvas'),exporting=false){
 const ctx=target.getContext('2d');const w=target.width,h=target.height;
 const gradient=ctx.createRadialGradient(w*.48,h*.44,10,w*.5,h*.5,w*.75);gradient.addColorStop(0,'#2d263c');gradient.addColorStop(1,'#161925');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
 const side=Math.ceil(Math.sqrt(project.count)),extent=project.layout==='grid'?Math.max(480,(side-1)*project.spacing*1.5):Math.max(480,project.spacing*(project.layout==='radial'?7.8:5.5));
 const scale=Math.min(w/(extent+90),h/(Math.max(420,project.amplitude*2+360)))*.86*zoom;
 const center={x:w*.5,y:h*.54};const proj=q=>{const p=projectPoint(q,project.yaw,project.pitch);return{x:p.x*scale+center.x,y:p.y*scale+center.y,depth:p.depth};};
 function path(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=Math.max(.6,w/1500);ctx.stroke();}}
 if(showGrid){ctx.strokeStyle='#4b405b33';ctx.lineWidth=Math.max(.5,w/1500);for(let i=-8;i<=8;i++){for(const axis of [0,1]){const a=proj({x:axis?-360:i*45,y:-128,z:axis?i*45:-360}),b=proj({x:axis?360:i*45,y:-128,z:axis?i*45:360});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
 const shadow=ctx.createRadialGradient(center.x,center.y+h*.16,1,center.x,center.y+h*.16,w*.34);shadow.addColorStop(0,'#08091165');shadow.addColorStop(1,'#08091100');ctx.fillStyle=shadow;ctx.fillRect(0,0,w,h);
 if(project.field&&!exporting){const ring=Array.from({length:65},(_,i)=>proj({x:Math.cos(i/64*Math.PI*2)*project.fieldRadius,y:-100,z:Math.sin(i/64*Math.PI*2)*project.fieldRadius}));ctx.setLineDash([3,6]);path(ring,null,'#a28fc747');ctx.setLineDash([]);}
 const palette=PALETTES[project.palette],items=clones(project,phase);
 if(project.shape==='sphere'){
  items.map(o=>({...o,...proj(o)})).sort((a,b)=>a.depth-b.depth).forEach(o=>{const radius=o.size*scale;const g=ctx.createRadialGradient(o.x-radius*.35,o.y-radius*.4,radius*.1,o.x,o.y,radius);g.addColorStop(0,color(palette[o.color],1.1));g.addColorStop(.45,palette[o.color]);g.addColorStop(1,color(palette[o.color],.38));ctx.beginPath();ctx.arc(o.x,o.y,Math.max(1,radius),0,Math.PI*2);ctx.fillStyle=g;ctx.fill();});
 }else{
  const faces=[];const indices=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[1,2,6,5],[0,3,7,4]];
  for(const o of items){const d=o.size;const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([x,y,z])=>proj({x:o.x+x*d,y:o.y+y*d,z:o.z+z*d}));indices.forEach((ids,k)=>{const points=ids.map(i=>vertices[i]);faces.push({points,depth:points.reduce((s,p)=>s+p.depth,0)/4,fill:color(palette[o.color],[.72,.74,.5,1.05,.87,.62][k])});});}
  faces.sort((a,b)=>a.depth-b.depth).forEach(f=>path(f.points,f.fill,'#17131c22'));
 }
}
function resize(){const canvas=$('#canvas'),rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);draw();}
new ResizeObserver(resize).observe($('.canvas-wrap'));
for(const id of Object.keys(LIMITS)){
 const el=$('#'+id);if(!el)continue;let recorded=false;
 if(el.type==='range'){el.addEventListener('pointerdown',()=>{remember();recorded=true;});el.addEventListener('input',()=>{if(!recorded){remember();recorded=true;}project[id]=Number(el.value);persist();update();});el.addEventListener('change',()=>{recorded=false;});}
 else el.onchange=()=>{remember();project[id]=Number(el.value);persist();update();};
}
for(const id of ['wave','scatter','rotation','field'])$('#'+id).onchange=e=>{remember();project[id]=e.target.checked;persist();update();};
for(const id of ['shape','palette'])$('#'+id).onchange=e=>{remember();project[id]=e.target.value;persist();update();};
$('#projectName').onchange=e=>{remember();project.name=e.target.value.trim()||'Untitled composition';persist();update();};
$$('[data-layout]').forEach(b=>b.onclick=()=>{remember();project.layout=b.dataset.layout;persist();update();});
$$('[data-preset]').forEach(b=>b.onclick=()=>{if(dirty&&!confirm('Replace this composition with a preset? Save a project first to keep it. You can undo.'))return;remember();project=preset(b.dataset.preset);phase=0;zoom=1;stop();persist();update();status('A new starting point. Follow your curiosity.');});
$('#surprise').onclick=()=>{remember();project.seed=1+Math.floor(Math.random()*9999);project.scatter=true;project.noise=12+Math.floor(Math.random()*40);project.rotation=true;project.twist=-80+Math.floor(Math.random()*160);project.amplitude=20+Math.floor(Math.random()*70);persist();update();status('A new variation, keeping your layout and colors. Undo anytime.');};
function undo(){if(!history.length)return;future.push(copy(project));project=history.pop();persist();update();status('Undid the last change.');}function redo(){if(!future.length)return;history.push(copy(project));project=future.pop();persist();update();status('Redid the last change.');}$('#undo').onclick=undo;$('#redo').onclick=redo;
function stop(){cancelAnimationFrame(raf);playing=false;$('#play').textContent='▶';$('#play').setAttribute('aria-label','Play motion');}
function play(){if(playing){stop();return;}playing=true;previous=performance.now();$('#play').textContent=playing?'Ⅱ':'▶';$('#play').setAttribute('aria-label',playing?'Pause motion':'Play motion');if(playing)raf=requestAnimationFrame(tick);}
function tick(t){if(!playing)return;phase=(phase+(t-previous)/1000*project.speed/2)%1;previous=t;$('#phase').value=phase;$('#time').textContent=(phase*4).toFixed(2).padStart(5,'0');draw();raf=requestAnimationFrame(tick);}
$('#play').onclick=play;$('#rewind').onclick=()=>{phase=0;update();};$('#phase').oninput=e=>{stop();phase=Number(e.target.value);update();};
$('#grid').onclick=()=>{showGrid=!showGrid;$('#grid').setAttribute('aria-pressed',String(showGrid));draw();};$('#resetView').onclick=()=>{remember();project.yaw=38;project.pitch=29;zoom=1;persist();update();status('Camera centered.');};
const canvas=$('#canvas');canvas.onpointerdown=e=>{remember();drag={x:e.clientX,y:e.clientY,yaw:project.yaw,pitch:project.pitch};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;project.yaw=Math.max(-180,Math.min(180,drag.yaw+(e.clientX-drag.x)*.45));project.pitch=Math.max(10,Math.min(75,drag.pitch-(e.clientY-drag.y)*.3));draw();};canvas.onpointerup=()=>{if(drag){drag=null;persist();renderUI();}};canvas.onpointercancel=()=>{drag=null;};canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.4,Math.min(2,zoom*Math.exp(-e.deltaY*.001)));draw();},{passive:false});
canvas.addEventListener('keydown',e=>{if(e.key.startsWith('Arrow')){e.preventDefault();remember();if(e.key==='ArrowLeft')project.yaw=Math.max(-180,project.yaw-5);if(e.key==='ArrowRight')project.yaw=Math.min(180,project.yaw+5);if(e.key==='ArrowUp')project.pitch=Math.min(75,project.pitch+5);if(e.key==='ArrowDown')project.pitch=Math.max(10,project.pitch-5);persist();update();}else if(['+','=','-'].includes(e.key)){e.preventDefault();zoom=Math.max(.4,Math.min(2,zoom*(e.key==='-'?.9:1.1)));draw();}});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function save(){download(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),'orbitweave-project.orbitweave');dirty=false;status('Editable project downloaded.');}$('#save').onclick=save;
$('#export').onclick=()=>{const c=document.createElement('canvas');c.width=1800;c.height=1200;draw(c,true);c.toBlob(blob=>{if(blob){download(blob,'orbitweave-frame.png');status('1800 × 1200 PNG exported from the current view.');}else status('PNG export failed. Please try again.');},'image/png');};
$('#open').onclick=()=>$('#file').click();$('#file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw Error('Project files must be smaller than 100 KB.');const next=validate(JSON.parse(await file.text()));if(dirty&&!confirm('Replace this composition with the selected project? You can undo.'))return;remember();project=next;phase=0;zoom=1;stop();persist();update();status('Project opened successfully.');}catch(err){status('Could not open project: '+err.message);}finally{e.target.value='';}};
$('#help').onclick=()=>$('#helpDialog').showModal();$('#closeHelp').onclick=()=>$('#helpDialog').close();
window.addEventListener('keydown',e=>{if($('#helpDialog').open||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if(e.code==='Space'){e.preventDefault();play();}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
update();if(storageWarning)status('Could not restore browser autosave. Save project files for durable backups.');
