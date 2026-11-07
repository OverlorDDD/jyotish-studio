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
 {kind:'sun',name:'SUN',x:155,y:255,r:41,light:'#fff3cd',middle:'#f5bd68',dark:'#b45e32',labelX:100,labelY:325},
 {kind:'jupiter',name:'JUPITER',x:471,y:194,r:53,light:'#fff0d6',middle:'#ce9872',dark:'#664b56',labelX:508,labelY:264},
 {kind:'saturn',name:'SATURN',x:427,y:461,r:36,light:'#ffe8bc',middle:'#b99b80',dark:'#555e74',labelX:476,labelY:524},
 {kind:'neptune',name:'NEPTUNE',x:219,y:449,r:30,light:'#c6ecff',middle:'#5494cf',dark:'#263a81',labelX:111,labelY:503},
 {kind:'venus',name:'VENUS',x:493,y:350,r:17,light:'#fff4d2',middle:'#e0b27e',dark:'#9f6a5e',labelX:519,labelY:358},
 {kind:'moon',name:'MOON',x:308,y:121,r:17,light:'#e5f4ff',middle:'#99b3d3',dark:'#465f82',labelX:334,labelY:112}
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
function planet(ctx:CanvasRenderingContext2D,body:Body,hover:boolean){
 const {x,y,r,kind}=body;
 ctx.save();
 if(kind==='sun'){
  const aura=ctx.createRadialGradient(x,y,r*.45,x,y,r*3.9);
  aura.addColorStop(0,'rgba(255,199,115,.36)');
  aura.addColorStop(.38,'rgba(246,172,84,.12)');
  aura.addColorStop(1,'rgba(240,166,94,0)');
  ctx.fillStyle=aura;ctx.beginPath();ctx.arc(x,y,r*3.9,0,Math.PI*2);ctx.fill();
 }
 if(kind==='saturn'){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.33);
  ctx.strokeStyle='rgba(240,210,163,.52)';ctx.lineWidth=12;
  ctx.beginPath();ctx.ellipse(0,0,r*1.85,r*.49,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='rgba(155,197,228,.45)';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(0,0,r*2.06,r*.57,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 const disc=ctx.createRadialGradient(x-r*.45,y-r*.46,r*.08,x+r*.22,y+r*.20,r*1.14);
 disc.addColorStop(0,body.light);disc.addColorStop(.47,body.middle);disc.addColorStop(1,body.dark);
 ctx.shadowColor=kind==='neptune'?'#5599fa99':kind==='sun'?'#fac48a99':'#b8c6e45c';
 ctx.shadowBlur=hover?30:16;
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=disc;ctx.fill();
 ctx.shadowBlur=0;
 ctx.save();ctx.beginPath();ctx.arc(x,y,r-.45,0,Math.PI*2);ctx.clip();
 if(kind==='jupiter'||kind==='saturn'){
  for(let i=-5;i<=5;i++){
   const yy=y+i*r*.20,curve=Math.sin(i*.88)*r*.095;
   ctx.beginPath();
   ctx.moveTo(x-r*1.15,yy+curve);ctx.bezierCurveTo(x-r*.30,yy-4,x+r*.34,yy+9,x+r*1.15,yy+curve);
   ctx.strokeStyle=i%2?'rgba(255,237,202,.18)':'rgba(71,53,62,.20)';
   ctx.lineWidth=i%3===0?4:2;ctx.stroke();
  }
 }
 if(kind==='neptune'){
  for(let i=-2;i<3;i++){
   ctx.beginPath();ctx.ellipse(x,y+i*9,r*1.2,r*.2,-.12,0,Math.PI*2);
   ctx.strokeStyle='rgba(187,234,255,.15)';ctx.lineWidth=2;ctx.stroke();
  }
 }
 if(kind==='moon'){
  ctx.beginPath();ctx.arc(x+8,y-3,r*.96,0,Math.PI*2);ctx.fillStyle='rgba(18,37,74,.52)';ctx.fill();
 }
 ctx.restore();
 if(kind==='saturn'){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.33);ctx.beginPath();
  ctx.ellipse(0,0,r*1.87,r*.49,0,.04,Math.PI-.04);
  ctx.lineWidth=8;ctx.strokeStyle='rgba(248,211,152,.83)';ctx.stroke();ctx.restore();
 }
 if(hover){
  ctx.beginPath();ctx.arc(x,y,r+11,0,Math.PI*2);
  ctx.strokeStyle='rgba(251,223,168,.8)';ctx.lineWidth=1;ctx.stroke();
 }
 ctx.restore();
}
function draw(ctx:CanvasRenderingContext2D,seconds:number,pointer:{x:number;y:number;hover:BodyKind|null},reduced:boolean){
 ctx.clearRect(0,0,W,H);
 const driftX=pointer.x*9,driftY=pointer.y*7;
 const mist=ctx.createRadialGradient(346+driftX,290+driftY,25,330,300,330);
 mist.addColorStop(0,'rgba(78,112,166,.14)');
 mist.addColorStop(.54,'rgba(62,81,134,.075)');
 mist.addColorStop(1,'rgba(15,28,53,0)');
 ctx.fillStyle=mist;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.translate(driftX*.35,driftY*.35);
 // Meridian and latitude sweeps suggest an astronomical atlas, not a zodiac wheel.
 ctx.strokeStyle='rgba(166,204,247,.12)';ctx.lineWidth=.9;
 for(let i=0;i<4;i++){
  const yy=172+i*93;
  ctx.beginPath();ctx.moveTo(48,yy+32);
  ctx.bezierCurveTo(204,yy-48,425,yy-48,594,yy+32);ctx.stroke();
 }
 for(let i=0;i<5;i++){
  const xx=92+i*111;
  ctx.beginPath();ctx.moveTo(xx-36,58);
  ctx.bezierCurveTo(xx+54,214,xx-54,422,xx+36,566);ctx.stroke();
 }
 for(const line of CONSTELLATIONS){
  strokeCurve(ctx,line,'rgba(172,199,233,.24)',.85);
  for(const [x,y] of line){ctx.beginPath();ctx.arc(x,y,1.95,0,Math.PI*2);ctx.fillStyle='rgba(229,238,255,.75)';ctx.fill();}
 }
 for(const star of STARFIELD){
  const shimmer=reduced?1:.80+.20*Math.sin(seconds*.9+star.phase);
  const x=star.x+pointer.x*star.depth*9,y=star.y+pointer.y*star.depth*7;
  ctx.globalAlpha=star.a*shimmer;
  ctx.beginPath();ctx.arc(x,y,star.r,0,Math.PI*2);ctx.fillStyle='#f0f7ff';ctx.fill();
  if(star.r>1.7){
   ctx.beginPath();ctx.moveTo(x-3.4,y);ctx.lineTo(x+3.4,y);
   ctx.moveTo(x,y-3.4);ctx.lineTo(x,y+3.4);
   ctx.strokeStyle='rgba(231,242,255,.35)';ctx.lineWidth=.7;ctx.stroke();
  }
 }
 ctx.restore();ctx.globalAlpha=1;
 // Fine, partial ecliptic/track arcs: curves, never a tropical round wheel.
 ctx.save();ctx.translate(driftX*.5,driftY*.5);
 ctx.lineWidth=1.3;ctx.strokeStyle='rgba(224,188,133,.29)';
 ctx.beginPath();ctx.moveTo(64,356);ctx.bezierCurveTo(201,111,431,79,588,275);ctx.stroke();
 ctx.strokeStyle='rgba(158,197,249,.19)';
 ctx.beginPath();ctx.moveTo(66,456);ctx.bezierCurveTo(227,584,452,554,576,358);ctx.stroke();
 ctx.strokeStyle='rgba(168,197,247,.16)';
 ctx.beginPath();ctx.moveTo(117,109);ctx.bezierCurveTo(192,482,409,522,561,157);ctx.stroke();
 ctx.restore();
 ctx.save();ctx.translate(driftX,driftY);
 for(const body of PLANETS)planet(ctx,body,body.kind===pointer.hover);
 ctx.font='600 11px system-ui, sans-serif';ctx.textBaseline='middle';
 for(const body of PLANETS){
  const hover=body.kind===pointer.hover;
  ctx.fillStyle=hover?'rgba(255,225,169,.97)':'rgba(206,221,244,.72)';
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
