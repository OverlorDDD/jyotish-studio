'use client';
import {useEffect,useRef,type PointerEvent} from 'react';
import styles from './NatalSkyLayers.module.css';

/**
 * Galaxiora's original celestial atlas hero artwork.
 * This is an interactive, deliberately schematic sky scene – NOT a calculated
 * natal chart, a tropical wheel, or a claim of live planet positions.
 *
 * Canvas 2D rather than WebGL keeps the flagship chart landing light:
 * no extra three.js bundle, GPU context, remote images or dependencies.
 */
type BodyKind='sun'|'jupiter'|'saturn'|'neptune'|'venus'|'moon';
type Body={kind:BodyKind;name:string;x:number;y:number;r:number;light:string;middle:string;dark:string;labelX:number;labelY:number};
type Star={x:number;y:number;r:number;a:number;phase:number;depth:number};
const W=640,H=620;
const PLANETS:readonly Body[]=[
 {kind:'sun',name:'SUN',x:164,y:254,r:28,light:'#f4e7c8',middle:'#d3ac77',dark:'#6f5a56',labelX:116,labelY:309},
 {kind:'jupiter',name:'JUPITER',x:462,y:206,r:39,light:'#e3d6c7',middle:'#a58d8b',dark:'#4b465e',labelX:499,labelY:258},
 {kind:'saturn',name:'SATURN',x:425,y:452,r:29,light:'#e2d3bc',middle:'#a69c99',dark:'#535165',labelX:465,labelY:496},
 {kind:'neptune',name:'NEPTUNE',x:229,y:459,r:24,light:'#c5c3db',middle:'#676f9b',dark:'#292c51',labelX:145,labelY:504},
 {kind:'venus',name:'VENUS',x:507,y:351,r:13,light:'#eadccf',middle:'#b9a29f',dark:'#68677e',labelX:529,labelY:361},
 {kind:'moon',name:'MOON',x:310,y:125,r:12,light:'#e1e9ed',middle:'#9da9ba',dark:'#4a5474',labelX:332,labelY:118}
];
const CONSTELLATIONS:readonly (readonly [number,number])[][]=[
 [[73,122],[122,103],[154,141],[194,116],[247,148]],
 [[346,51],[394,81],[445,65],[497,93],[529,77]],
 [[77,376],[114,398],[157,383],[177,413]],
 [[303,521],[342,549],[382,534],[416,562],[476,551]],
 [[532,293],[564,318],[552,378],[587,405]]
];
function stars():Star[]{
 let seed=0x6a71c0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 return Array.from({length:168},()=>({
  x:34+random()*572,y:25+random()*562,r:.5+random()*1.55,
  a:.24+random()*.56,phase:random()*6.28,depth:.35+random()*.85
 }));
}
const STARFIELD=stars();
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
function strokeCurve(ctx:CanvasRenderingContext2D,points:readonly (readonly [number,number])[],color:string,width:number){
 if(points.length<2)return;
 ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
 ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
}
/**
 * Muted lithographic planets: desaturated gradients, engraved texture,
 * very fine orbit details. This is deliberately not glossy 3D solar-system art.
 */
function planet(ctx:CanvasRenderingContext2D,body:Body,hover:boolean){
 const {x,y,r,kind}=body;
 ctx.save();
 const glow=ctx.createRadialGradient(x,y,r*.48,x,y,r*2.85);
 glow.addColorStop(0,kind==='sun'?'rgba(238,189,122,.25)':'rgba(174,163,213,.14)');
 glow.addColorStop(.45,kind==='sun'?'rgba(204,151,111,.10)':'rgba(124,129,185,.05)');
 glow.addColorStop(1,'rgba(10,19,39,0)');
 ctx.beginPath();ctx.arc(x,y,r*2.85,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
 // Fine astrolabe marker: no big cartoon-like halo or oversized rings.
 ctx.strokeStyle=hover?'rgba(245,216,164,.78)':'rgba(201,190,182,.25)';
 ctx.lineWidth=.75;
 ctx.beginPath();ctx.arc(x,y,r+9,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<4;i++){
  const angle=i*Math.PI/2+.26;
  ctx.beginPath();
  ctx.moveTo(x+Math.cos(angle)*(r+12),y+Math.sin(angle)*(r+12));
  ctx.lineTo(x+Math.cos(angle)*(r+17),y+Math.sin(angle)*(r+17));
  ctx.stroke();
 }
 // Saturn's back ring is etched before the planetary disc.
 if(kind==='saturn'){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.3);
  ctx.strokeStyle='rgba(211,183,152,.36)';ctx.lineWidth=4;
  ctx.beginPath();ctx.ellipse(0,0,r*1.73,r*.51,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='rgba(197,180,188,.24)';ctx.lineWidth=.85;
  ctx.beginPath();ctx.ellipse(0,0,r*1.92,r*.6,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
 }
 const disc=ctx.createRadialGradient(x-r*.38,y-r*.43,r*.07,x+r*.28,y+r*.26,r*1.15);
 disc.addColorStop(0,body.light);disc.addColorStop(.42,body.middle);disc.addColorStop(1,body.dark);
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=disc;ctx.fill();
 ctx.strokeStyle='rgba(234,212,194,.25)';ctx.lineWidth=.7;ctx.stroke();
 ctx.save();ctx.beginPath();ctx.arc(x,y,r-.6,0,Math.PI*2);ctx.clip();
 // Soft mineral-like shadow with engraved latitude marks, not plastic shine.
 const shade=ctx.createLinearGradient(x-r*.6,y-r*.7,x+r*.8,y+r*.6);
 shade.addColorStop(0,'rgba(8,12,25,0)');
 shade.addColorStop(1,'rgba(12,16,38,.34)');
 ctx.fillStyle=shade;ctx.fillRect(x-r,y-r,r*2,r*2);
 if(kind==='jupiter'||kind==='saturn'||kind==='neptune'){
  const lines=kind==='jupiter'?7:kind==='saturn'?5:3;
  for(let i=-lines;i<=lines;i++){
   const py=y+i*r/(lines+3);
   const wave=Math.sin(i*1.28)*r*.08;
   ctx.beginPath();
   ctx.moveTo(x-r*1.15,py+wave);
   ctx.bezierCurveTo(x-r*.45,py-r*.1,x+r*.42,py+r*.13,x+r*1.15,py-wave);
   ctx.strokeStyle=i%3===0?'rgba(236,228,213,.23)':'rgba(31,30,49,.17)';
   ctx.lineWidth=i%4===0?1.65:.85;ctx.stroke();
  }
 }
 if(kind==='moon'){
  ctx.fillStyle='rgba(57,63,89,.22)';
  for(const [dx,dy,rr] of [[-3,-2,2.3],[4,4,1.5],[-4,5,1]]){
   ctx.beginPath();ctx.arc(x+dx,y+dy,rr,0,Math.PI*2);ctx.fill();
  }
 }
 if(kind==='sun'){
  ctx.strokeStyle='rgba(253,241,210,.16)';
  for(let i=0;i<3;i++){
   ctx.beginPath();ctx.ellipse(x,y+(i-1)*r*.35,r*1.1,r*.26,0,0,Math.PI*2);ctx.stroke();
  }
 }
 ctx.restore();
 if(kind==='saturn'){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.3);
  ctx.beginPath();ctx.ellipse(0,0,r*1.73,r*.51,0,.06,Math.PI-.06);
  ctx.lineWidth=3.3;ctx.strokeStyle='rgba(231,202,165,.74)';ctx.stroke();ctx.restore();
 }
 if(hover){
  ctx.beginPath();ctx.arc(x,y,r+23,0,Math.PI*2);
  ctx.setLineDash([2,5]);ctx.lineWidth=.85;ctx.strokeStyle='rgba(236,205,156,.7)';ctx.stroke();
  ctx.setLineDash([]);
 }
 ctx.restore();
}
function draw(ctx:CanvasRenderingContext2D,seconds:number,pointer:{x:number;y:number;hover:BodyKind|null},reduced:boolean){
 ctx.clearRect(0,0,W,H);
 const px=pointer.x*7,py=pointer.y*6;
 // A subtle purple/amber cosmic atmosphere echoes the approved spiral #6.
 const nebula=ctx.createRadialGradient(397+px,287+py,23,356,289,311);
 nebula.addColorStop(0,'rgba(116,93,156,.13)');
 nebula.addColorStop(.48,'rgba(75,88,149,.065)');
 nebula.addColorStop(1,'rgba(20,34,62,0)');
 ctx.fillStyle=nebula;ctx.fillRect(0,0,W,H);
 const gold=ctx.createRadialGradient(400,337,10,400,337,225);
 gold.addColorStop(0,'rgba(207,170,117,.05)');
 gold.addColorStop(1,'rgba(207,170,117,0)');
 ctx.fillStyle=gold;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.translate(px*.35,py*.35);
 // Astronomy-chart coordinates at the edge; the chart stays visually open.
 ctx.lineWidth=.7;
 for(let i=0;i<3;i++){
  const y=171+i*116;
  ctx.strokeStyle='rgba(192,196,230,.095)';
  ctx.beginPath();ctx.moveTo(73,y+24);
  ctx.bezierCurveTo(228,y-37,440,y-37,573,y+24);ctx.stroke();
 }
 for(let i=0;i<3;i++){
  const x=144+i*159;
  ctx.strokeStyle='rgba(209,187,168,.07)';
  ctx.beginPath();ctx.moveTo(x-26,76);
  ctx.bezierCurveTo(x+66,212,x-68,434,x+26,548);ctx.stroke();
 }
 for(const constellation of CONSTELLATIONS){
  strokeCurve(ctx,constellation,'rgba(186,197,228,.15)',.75);
  for(const [x,y] of constellation){
   ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);
   ctx.fillStyle='rgba(235,230,231,.61)';ctx.fill();
  }
 }
 // A shallow Milky Way arc of dust and tiny stars, no oversized colored discs.
 for(const star of STARFIELD){
  const shimmer=reduced?1:.91+.09*Math.sin(seconds*.8+star.phase);
  const x=star.x+pointer.x*star.depth*8,y=star.y+pointer.y*star.depth*6;
  ctx.globalAlpha=star.a*shimmer*.82;
  ctx.beginPath();ctx.arc(x,y,star.r*.8,0,Math.PI*2);
  ctx.fillStyle=star.r>1.4?'#f5e9d6':'#d8e5f6';ctx.fill();
  if(star.r>1.8){
   ctx.beginPath();ctx.moveTo(x-2.7,y);ctx.lineTo(x+2.7,y);
   ctx.moveTo(x,y-2.7);ctx.lineTo(x,y+2.7);
   ctx.strokeStyle='rgba(234,227,230,.3)';ctx.lineWidth=.55;ctx.stroke();
  }
 }
 ctx.restore();ctx.globalAlpha=1;
 ctx.save();ctx.translate(px*.5,py*.5);
 // Three incomplete cartographic trajectories, not a zodiac/tropical ring.
 ctx.strokeStyle='rgba(225,192,147,.25)';ctx.lineWidth=.95;
 ctx.beginPath();ctx.moveTo(76,378);
 ctx.bezierCurveTo(201,137,425,105,565,272);ctx.stroke();
 ctx.strokeStyle='rgba(178,176,213,.16)';
 ctx.beginPath();ctx.moveTo(94,488);
 ctx.bezierCurveTo(244,558,441,565,559,390);ctx.stroke();
 ctx.strokeStyle='rgba(181,203,229,.12)';
 ctx.beginPath();ctx.moveTo(138,108);
 ctx.bezierCurveTo(236,448,405,511,533,160);ctx.stroke();
 ctx.restore();
 ctx.save();ctx.translate(px,py);
 for(const body of PLANETS)planet(ctx,body,body.kind===pointer.hover);
 // Restrained micro typography is secondary to the hero's main heading.
 ctx.textBaseline='middle';ctx.font='500 9px system-ui, sans-serif';
 for(const body of PLANETS){
  if(body.kind==='moon'||body.kind==='venus')continue;
  ctx.fillStyle=body.kind===pointer.hover?'rgba(244,218,180,.9)':'rgba(192,192,213,.48)';
  ctx.fillText(body.name,body.labelX,body.labelY);
 }
 ctx.restore();
}
export default function NatalSkyLayers({lang}:{lang:'uk'|'en'}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const input=useRef({x:0,y:0,hover:null as BodyKind|null});
 useEffect(()=>{
  const canvas=canvasRef.current;
  if(!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=motion.matches,visible=true,frame=0,last=0,alive=true;
  const render=(now:number)=>{
   if(!alive)return;
   if(!reduced&&visible&&now-last>=30){last=now;draw(ctx,now/1000,input.current,false);}
   if(!reduced&&visible)frame=requestAnimationFrame(render);
  };
  const paint=()=>{
   const dpr=Math.min(window.devicePixelRatio||1,2);
   canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
   ctx.setTransform(dpr,0,0,dpr,0,0);
   draw(ctx,0,input.current,reduced);
  };
  const stop=()=>{cancelAnimationFrame(frame);frame=0;};
  const start=()=>{
   stop();paint();
   if(!reduced&&visible)frame=requestAnimationFrame(render);
  };
  const change=()=>{reduced=motion.matches;start();};
  const watcher=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{
   visible=entries[0]?.isIntersecting??false;
   if(visible)start();else stop();
  },{threshold:.05});
  watcher?.observe(canvas);
  motion.addEventListener?.('change',change);
  paint();if(!watcher)start();
  return ()=>{alive=false;stop();watcher?.disconnect();motion.removeEventListener?.('change',change);};
 },[]);
 const point=(event:PointerEvent<HTMLCanvasElement>)=>{
  if(event.pointerType==='touch')return;
  const rect=event.currentTarget.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width*W;
  const y=(event.clientY-rect.top)/rect.height*H;
  input.current.x=clamp((x/W-.5)*2,-1,1);input.current.y=clamp((y/H-.5)*2,-1,1);
  const nearby=PLANETS.find(p=>Math.hypot(p.x+input.current.x*9-x,p.y+input.current.y*7-y)<p.r+12);
  input.current.hover=nearby?.kind??null;
  event.currentTarget.style.cursor=nearby?'crosshair':'default';
 };
 const leave=()=>{input.current={x:0,y:0,hover:null};};
 return <figure className={styles.scene} data-testid="n41-sky" aria-label={lang==='uk'?'Інтерактивна ілюстрація зоряного неба з планетами Сонячної системи':'Interactive illustrated star atlas with Solar System planets'}>
  <canvas ref={canvasRef} width={W} height={H} className={styles.canvas}
    role="img"
    aria-label={lang==='uk'?'Схематична небесна сцена: Сонце, Юпітер, Сатурн, Нептун, Венера, Місяць і зорі. Позиції не розраховані для певної дати.':'Schematic celestial scene: Sun, Jupiter, Saturn, Neptune, Venus, Moon and stars. Positions are not calculated for a specific date.'}
    onPointerMove={point} onPointerLeave={leave}>
    {lang==='uk'?'Ілюстрація небесної карти':'Illustration of a celestial atlas'}
  </canvas>
  <figcaption className={styles.caption}>{lang==='uk'?'Небесний атлас · інтерактивна ілюстрація':'Celestial atlas · interactive illustration'}</figcaption>
 </figure>;
}
