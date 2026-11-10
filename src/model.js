export const LIMITS={count:[6,144],spacing:[24,110],size:[6,36],amplitude:[0,100],frequency:[0.2,4],twist:[-180,180],noise:[0,70],seed:[1,9999],fieldRadius:[30,500],speed:[0.1,2],yaw:[-180,180],pitch:[10,75]};
export const PALETTES={orchid:['#c4b5fd','#8b74cb','#7adac7'],coral:['#ffb5a1','#c8798f','#f3d484'],glacier:['#9de4e8','#608bd8','#d8f2ee']};
export const copy=x=>JSON.parse(JSON.stringify(x));
export function preset(name='tide'){
 const p={format:'kata-orbitweave',version:1,name:'Lavender tide',layout:'grid',shape:'cube',palette:'orchid',count:81,spacing:44,size:16,amplitude:58,frequency:1.4,twist:0,noise:0,seed:42,fieldRadius:220,field:false,wave:true,scatter:false,rotation:false,speed:.5,yaw:38,pitch:29};
 if(name==='orbit')Object.assign(p,{name:'Coral orbit',layout:'radial',shape:'sphere',palette:'coral',count:64,spacing:59,size:18,amplitude:36,frequency:2.2,twist:30,rotation:true,yaw:30,pitch:37});
 if(name==='helix')Object.assign(p,{name:'Glacier spiral',layout:'helix',palette:'glacier',count:80,spacing:55,size:13,amplitude:26,frequency:1,twist:65,rotation:true,yaw:20,pitch:21});
 return p;
}
export function random(seed,index){const n=Math.sin(seed*12.9898+index*78.233)*43758.5453;return n-Math.floor(n);}
export function clones(p,time=0){const side=Math.ceil(Math.sqrt(p.count)),out=[];
 for(let i=0;i<p.count;i++){
  let x=0,y=0,z=0,a=i/p.count*Math.PI*2;
  if(p.layout==='grid'){x=(i%side-(side-1)/2)*p.spacing;z=(Math.floor(i/side)-(Math.ceil(p.count/side)-1)/2)*p.spacing;}
  else if(p.layout==='radial'){const ring=i%3,r=p.spacing*(1.9+ring*.85);x=Math.cos(a)*r;z=Math.sin(a)*r;}
  else{x=Math.cos(a*2.5)*p.spacing*2.1;z=Math.sin(a*2.5)*p.spacing*2.1;y=(i/(p.count-1)-.5)*320;}
  const weight=p.field?Math.max(0,1-Math.hypot(x,z)/p.fieldRadius):1;
  if(p.wave)y+=Math.sin((x+z)/Math.max(p.spacing,1)*.6*p.frequency-time*Math.PI*2)*p.amplitude*weight;
  if(p.scatter){x+=(random(p.seed,i*3)-.5)*p.noise*2*weight;y+=(random(p.seed,i*3+1)-.5)*p.noise*2*weight;z+=(random(p.seed,i*3+2)-.5)*p.noise*2*weight;}
  if(p.rotation){const angle=p.twist*Math.PI/180*weight*(Math.sin(time*Math.PI*2)*.35+.65);const nx=x*Math.cos(angle)-z*Math.sin(angle);z=x*Math.sin(angle)+z*Math.cos(angle);x=nx;}
  out.push({x,y,z,size:p.size*(p.wave?(1+.18*Math.sin(i*.3+time*Math.PI*2)*weight):1),color:i%3,index:i,weight});
 }return out;
}
export function projectPoint(point,yaw,pitch){const a=yaw*Math.PI/180,b=pitch*Math.PI/180;const x=point.x*Math.cos(a)-point.z*Math.sin(a),z=point.x*Math.sin(a)+point.z*Math.cos(a);return {x,y:-point.y*Math.cos(b)+z*Math.sin(b),depth:z*Math.cos(b)+point.y*Math.sin(b)};}
export function validate(input){if(!input||input.format!=='kata-orbitweave'||input.version!==1)throw Error('Choose an Orbitweave version 1 project.');if(typeof input.name!=='string'||input.name.length>100)throw Error('Invalid project name.');const p={format:input.format,version:1,name:input.name};for(const [id,limits]of Object.entries(LIMITS)){const n=input[id];if(!Number.isFinite(n)||n<limits[0]||n>limits[1])throw Error(`Invalid ${id}.`);if(['count','seed'].includes(id)&&!Number.isInteger(n))throw Error(`Invalid ${id}.`);p[id]=n;}
 if(![.25,.5,1,2].includes(input.speed))throw Error('Invalid playback speed.');
 for(const [id,options]of Object.entries({layout:['grid','radial','helix'],shape:['cube','sphere'],palette:Object.keys(PALETTES)})){if(!options.includes(input[id]))throw Error(`Invalid ${id}.`);p[id]=input[id];}for(const id of ['field','wave','scatter','rotation']){if(typeof input[id]!=='boolean')throw Error(`Invalid ${id}.`);p[id]=input[id];}return p;}
