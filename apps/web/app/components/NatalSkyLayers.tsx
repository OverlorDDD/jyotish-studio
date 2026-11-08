'use client';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import styles from './NatalSkyLayers.module.css';

/**
 * Galaxiora solar-system illustration v4.
 * Conceptually heliocentric: Sun at one focus of each elliptical orbit, planets on their own
 * Sun-centred orbits, and the Moon as Earth's satellite (not a ninth planet).
 * Distances, sizes, orbital inclination and the displayed phases are
 * deliberately NOT to scale; this is not a date-specific ephemeris.
 */
type BodyKind='sun'|'mercury'|'venus'|'earth'|'moon'|'mars'|'jupiter'|'saturn'|'uranus'|'neptune';
type Body={kind:BodyKind;name:string;x:number;y:number;r:number;light:string;middle:string;dark:string};
type Orbit={kind:Exclude<BodyKind,'sun'|'moon'>;radius:number;eccentricity:number;phase:number;periodSeconds:number;radiusPx:number;
 light:string;middle:string;dark:string;name:string};
type Star={x:number;y:number;r:number;alpha:number;phase:number;depth:number};
const W=640,H=620,CX=320,CY=310,FLATTEN=.79;
const SUN:Body={kind:'sun',name:'SUN',x:CX,y:CY,r:33,light:'#f6e5b9',middle:'#dcad6d',dark:'#a86755'};
/* Correct radial order with approximate real orbital eccentricities in a projected view.
 * The Sun lies at the unprojected orbital focus. Angles are art-directed, not true current anomalies. */
const ORBITS:readonly Orbit[]=[
 {kind:'mercury',eccentricity:0.2056,name:'MERCURY',radius:62,phase:-2.37,periodSeconds:18,radiusPx:6,light:'#ded6cb',middle:'#a8a19b',dark:'#595b68'},
 {kind:'venus',eccentricity:0.0068,name:'VENUS',radius:96,phase:.61,periodSeconds:30,radiusPx:10,light:'#f1dfc9',middle:'#c4a68e',dark:'#68606c'},
 {kind:'earth',eccentricity:0.0167,name:'EARTH',radius:130,phase:2.54,periodSeconds:48,radiusPx:13,light:'#d1e7e3',middle:'#7a9cae',dark:'#35486a'},
 {kind:'mars',eccentricity:0.0934,name:'MARS',radius:163,phase:-.70,periodSeconds:66,radiusPx:9,light:'#dfbea6',middle:'#aa796d',dark:'#684953'},
 {kind:'jupiter',eccentricity:0.0489,name:'JUPITER',radius:201,phase:1.94,periodSeconds:118,radiusPx:27,light:'#e9d3b9',middle:'#b39b8d',dark:'#54495b'},
 {kind:'saturn',eccentricity:0.0565,name:'SATURN',radius:233,phase:-2.27,periodSeconds:162,radiusPx:22,light:'#e6d3b4',middle:'#a99c93',dark:'#55566a'},
 {kind:'uranus',eccentricity:0.0472,name:'URANUS',radius:258,phase:-.16,periodSeconds:210,radiusPx:13,light:'#c8dce0',middle:'#8db0bf',dark:'#4a647e'},
 {kind:'neptune',eccentricity:0.0086,name:'NEPTUNE',radius:281,phase:1.20,periodSeconds:250,radiusPx:13,light:'#bdc9e4',middle:'#697aa7',dark:'#2d426a'}
];
function orbitPosition(o:Orbit,seconds=0){
 // Solve Kepler's equation with Newton iterations; the Sun lies at the focus.
 // Periods are artistically accelerated relative to the real orbital years.
 const mean=o.phase+seconds*2*Math.PI/o.periodSeconds;
 let e=mean;
 for(let i=0;i<4;i++)e-=(e-o.eccentricity*Math.sin(e)-mean)/(1-o.eccentricity*Math.cos(e));
 const minor=o.radius*Math.sqrt(1-o.eccentricity*o.eccentricity);
 return {x:CX+o.radius*(Math.cos(e)-o.eccentricity),
  y:CY+minor*Math.sin(e)*FLATTEN};
}
function bodiesAt(seconds:number):readonly Body[]{
 const orbiting:Body[]=ORBITS.map(o=>({...orbitPosition(o,seconds),kind:o.kind,name:o.name,r:o.radiusPx,
  light:o.light,middle:o.middle,dark:o.dark}));
 const earth=orbiting.find(p=>p.kind==='earth')!;
 const phase=1.17+seconds*2*Math.PI/9.5;
 const moon:Body={kind:'moon',name:'MOON',x:earth.x+27*Math.cos(phase),y:earth.y+20*Math.sin(phase),
  r:5,light:'#e7e9eb',middle:'#adb4c7',dark:'#596077'};
 return [SUN,...orbiting,moon];
}
const BODY_NAMES:Readonly<Record<BodyKind,string>>={sun:'SUN',mercury:'MERCURY',venus:'VENUS',
 earth:'EARTH',moon:'MOON',mars:'MARS',jupiter:'JUPITER',saturn:'SATURN',uranus:'URANUS',neptune:'NEPTUNE'};
function starfield():Star[]{
 let seed=0x6a71c0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 return Array.from({length:185},()=>({x:22+random()*595,y:26+random()*565,r:.45+random()*1.25,
  alpha:.16+random()*.50,phase:random()*6.28,depth:.2+random()*.8}));
}
const STARS=starfield();
const CONSTELLATIONS:readonly (readonly [number,number])[][]=[
 [[34,90],[86,113],[132,88],[176,125]],
 [[418,61],[476,80],[523,46],[573,71]],
 [[42,471],[89,493],[121,474],[160,515]],
 [[471,552],[509,574],[562,548],[602,583]]
];
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
function coloredDisc(ctx:CanvasRenderingContext2D,b:Body,hover:boolean){
 const {x,y,r,kind}=b;
 ctx.save();
 if(kind==='sun'){
  const glow=ctx.createRadialGradient(x,y,r*.3,x,y,r*4.6);
  glow.addColorStop(0,'rgba(251,219,167,.35)');glow.addColorStop(.31,'rgba(232,183,113,.16)');
  glow.addColorStop(1,'rgba(242,178,98,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r*4.6,0,Math.PI*2);ctx.fill();
 }else{
  const glow=ctx.createRadialGradient(x,y,r*.35,x,y,r*2.45);
  glow.addColorStop(0,'rgba(172,166,215,.14)');glow.addColorStop(1,'rgba(172,166,215,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r*2.45,0,Math.PI*2);ctx.fill();
 }
 if(kind==='saturn'){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.32);
  ctx.lineWidth=3;ctx.strokeStyle='rgba(210,190,160,.43)';
  ctx.beginPath();ctx.ellipse(0,0,r*1.9,r*.57,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 const disc=ctx.createRadialGradient(x-r*.34,y-r*.38,r*.05,x+r*.24,y+r*.24,r*1.2);
 disc.addColorStop(0,b.light);disc.addColorStop(.49,b.middle);disc.addColorStop(1,b.dark);
 ctx.fillStyle=disc;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 ctx.lineWidth=.8;ctx.strokeStyle='rgba(251,226,200,.38)';ctx.stroke();
 ctx.save();ctx.beginPath();ctx.arc(x,y,r-.4,0,Math.PI*2);ctx.clip();
 if(['jupiter','saturn','neptune','uranus'].includes(kind)){
  for(let i=-3;i<=3;i++){
   const yy=y+i*r/4.3;
   ctx.beginPath();ctx.moveTo(x-r*1.1,yy);
   ctx.bezierCurveTo(x-r*.35,yy-r*.12,x+r*.33,yy+r*.1,x+r*1.1,yy);
   ctx.strokeStyle=i%2===0?'rgba(248,224,199,.18)':'rgba(23,32,59,.20)';
   ctx.lineWidth=i%2===0?1.6:.95;ctx.stroke();
  }
 }
 if(kind==='earth'){
  ctx.fillStyle='rgba(118,155,134,.43)';
  ctx.beginPath();ctx.ellipse(x-3,y-1,r*.34,r*.68,.25,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x+5,y+5,r*.22,r*.28,-.4,0,Math.PI*2);ctx.fill();
 }
 if(kind==='moon'){
  ctx.fillStyle='rgba(58,59,76,.3)';
  ctx.beginPath();ctx.arc(x+1,y-1,1.1,0,Math.PI*2);ctx.fill();
 }
 if(kind==='sun'){
  ctx.strokeStyle='rgba(255,248,226,.18)';ctx.lineWidth=.8;
  for(let i=-1;i<=1;i++){
   ctx.beginPath();ctx.ellipse(x,y+i*r*.35,r,r*.19,0,0,Math.PI*2);ctx.stroke();
  }
 }
 ctx.restore();
 if(kind==='saturn'){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.32);
  ctx.strokeStyle='rgba(236,206,166,.72)';ctx.lineWidth=3.1;
  ctx.beginPath();ctx.ellipse(0,0,r*1.9,r*.57,0,.05,Math.PI-.05);ctx.stroke();ctx.restore();
 }
 if(hover){
  ctx.strokeStyle='rgba(242,205,157,.88)';ctx.lineWidth=1;
  ctx.setLineDash([2,4]);ctx.beginPath();ctx.arc(x,y,r+10,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 }
 ctx.restore();
}
type Motion={x:number;y:number;targetX:number;targetY:number;cursorX:number;cursorY:number;inside:boolean;
 hover:BodyKind|null;hoverOpacity:number;elapsed:number;bodies:readonly Body[]};
const blank=():Motion=>({x:0,y:0,targetX:0,targetY:0,cursorX:0,cursorY:0,inside:false,hover:null,hoverOpacity:0,elapsed:0,bodies:bodiesAt(0)});
function hoverLabel(ctx:CanvasRenderingContext2D,b:Body,alpha:number,lang:'uk'|'en'){
 if(alpha<.01)return;
 const names:Partial<Record<BodyKind,string>>={sun:'СОНЦЕ',mercury:'МЕРКУРІЙ',venus:'ВЕНЕРА',earth:'ЗЕМЛЯ',
  moon:'МІСЯЦЬ',mars:'МАРС',jupiter:'ЮПІТЕР',saturn:'САТУРН',uranus:'УРАН',neptune:'НЕПТУН'};
 const label=lang==='uk'?(names[b.kind]||b.name):b.name;
 ctx.save();ctx.globalAlpha=Math.min(1,alpha);
 ctx.font='600 11px system-ui,sans-serif';
 const w=ctx.measureText(label).width+24,h=26;
 const left=b.x+b.r+16;
 const x=clamp(left+w<W-15?left:b.x-b.r-16-w,12,W-w-12);
 const y=clamp(b.y-h/2,12,H-h-12);
 ctx.fillStyle='rgba(10,22,40,.97)';ctx.strokeStyle='rgba(232,191,131,.78)';ctx.lineWidth=.8;
 ctx.beginPath();ctx.roundRect(x,y,w,h,7);ctx.fill();ctx.stroke();
 ctx.fillStyle='#f0d9b5';ctx.textBaseline='middle';ctx.fillText(label,x+12,y+h/2);
 ctx.restore();
}
function draw(ctx:CanvasRenderingContext2D,seconds:number,m:Motion,reduced:boolean,lang:'uk'|'en'){
 ctx.clearRect(0,0,W,H);
 const px=reduced?0:m.x,py=reduced?0:m.y;
 const nebula=ctx.createRadialGradient(CX+px*4,CY+py*2,20,CX,CY,335);
 nebula.addColorStop(0,'rgba(157,124,178,.15)');nebula.addColorStop(.45,'rgba(61,92,148,.085)');
 nebula.addColorStop(1,'rgba(10,24,47,0)');
 ctx.fillStyle=nebula;ctx.fillRect(0,0,W,H);
 for(const constellation of CONSTELLATIONS){
  ctx.save();ctx.translate(px*12,py*9);
  ctx.lineWidth=.7;ctx.strokeStyle='rgba(181,201,229,.19)';
  if(!constellation.length){ctx.restore();continue;}
  ctx.beginPath();ctx.moveTo(constellation[0][0],constellation[0][1]);
  for(const [x,y] of constellation.slice(1))ctx.lineTo(x,y);
  ctx.stroke();
  for(const [x,y] of constellation){ctx.beginPath();ctx.arc(x,y,1.1,0,Math.PI*2);
   ctx.fillStyle='rgba(232,231,233,.6)';ctx.fill();}
  ctx.restore();
 }
 for(const star of STARS){
  const alpha=star.alpha*(reduced?1:.91+.09*Math.sin(seconds*.7+star.phase));
  const x=star.x+px*7*star.depth,y=star.y+py*6*star.depth;
  ctx.globalAlpha=alpha;ctx.fillStyle=star.r>1.1?'#f0ddc7':'#b9cbe3';
  ctx.beginPath();ctx.arc(x,y,star.r,0,Math.PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;
 // The orbital map has deeper parallax than the star dust while every planet
 // and its corresponding orbit share ONE transform, avoiding detachment/jitter.
 ctx.save();ctx.translate(px*18,py*13);
 for(const orbit of ORBITS){
  const minor=orbit.radius*Math.sqrt(1-orbit.eccentricity*orbit.eccentricity);
  ctx.beginPath();ctx.ellipse(CX-orbit.radius*orbit.eccentricity,CY,orbit.radius,minor*FLATTEN,0,0,Math.PI*2);
  ctx.lineWidth=.85;ctx.strokeStyle='rgba(206,190,174,.24)';ctx.stroke();
 }
 // Hint of orbit orientation / local map grid; no inaccurate rays to planets.
 ctx.strokeStyle='rgba(185,200,219,.10)';ctx.lineWidth=.65;
 ctx.beginPath();ctx.moveTo(18,CY);ctx.lineTo(W-18,CY);ctx.stroke();
 ctx.beginPath();ctx.moveTo(CX,24);ctx.lineTo(CX,H-24);ctx.stroke();
 // Moon's LOCAL orbit is centred on Earth.
 const rendered=bodiesAt(reduced?0:seconds);
 m.bodies=rendered;
 const earth=rendered.find(p=>p.kind==='earth')!;
 ctx.strokeStyle='rgba(187,199,224,.29)';ctx.lineWidth=.75;
 ctx.beginPath();ctx.ellipse(earth.x,earth.y,27,20,0,0,Math.PI*2);ctx.stroke();
 for(const body of rendered)coloredDisc(ctx,body,m.hover===body.kind);
 const focused=rendered.find(p=>p.kind===m.hover);
 if(focused)hoverLabel(ctx,focused,m.hoverOpacity,lang);
 ctx.restore();
}
function hit(m:Motion):BodyKind|null{
 if(!m.inside)return null;
 const x=m.cursorX-m.x*18,y=m.cursorY-m.y*13;
 // Use exactly the positions painted on the last frame, not initial orbits.
 return [...m.bodies].reverse().find(p=>Math.hypot(p.x-x,p.y-y)<=Math.max(8,p.r+8))?.kind||null;
}
export default function NatalSkyLayers({lang}:{lang:'uk'|'en'}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const motionRef=useRef<Motion>(blank());
 const redrawRef=useRef<()=>void>(()=>{});
 const [hovered,setHovered]=useState<BodyKind|null>(null);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=media.matches,visible=true,alive=true,frame=0,last=0;
  const m=motionRef.current;
  const paint=()=>draw(ctx,m.elapsed,m,reduced,lang);
  const sync=()=>{
   const next=hit(m);
   if(next!==m.hover){m.hover=next;m.hoverOpacity=0;setHovered(next);canvas.style.cursor=next?'crosshair':'default';}
  };
  const stop=()=>{cancelAnimationFrame(frame);frame=0;last=0;};
  const still=()=>{
   m.x=0;m.y=0;m.targetX=0;m.targetY=0;
   m.elapsed=0;canvas.dataset.parallaxX='0';canvas.dataset.parallaxY='0';paint();sync();m.hoverOpacity=m.hover?1:0;paint();
  };
  const tick=(now:number)=>{
   if(!alive||!visible||reduced)return;
   const dt=last?Math.min(now-last,65):16.7;last=now;
   const ease=1-Math.exp(-dt/350);
   m.x+=(m.targetX-m.x)*ease;m.y+=(m.targetY-m.y)*ease;
   m.elapsed+=dt/1000;
   canvas.dataset.parallaxX=m.x.toFixed(3);canvas.dataset.parallaxY=m.y.toFixed(3);
   canvas.dataset.orbitalSeconds=m.elapsed.toFixed(2);
   // Keep hover targeting in sync with moving orbital bodies.
   m.bodies=bodiesAt(m.elapsed);sync();
   m.hoverOpacity+=(Number(m.hover!==null)-m.hoverOpacity)*(1-Math.exp(-dt/125));
   paint();frame=requestAnimationFrame(tick);
  };
  const start=()=>{stop();if(!visible)return;if(reduced){still();return;}paint();frame=requestAnimationFrame(tick);};
  const setup=()=>{
   const dpr=Math.min(window.devicePixelRatio||1,2);
   canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
   ctx.setTransform(dpr,0,0,dpr,0,0);start();
  };
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{
   visible=entries[0]?.isIntersecting??false;
   if(visible)start();else stop();
  },{threshold:.04});
  observer?.observe(canvas);
  const changed=()=>{reduced=media.matches;start();};
  media.addEventListener?.('change',changed);
  redrawRef.current=()=>{if(reduced)still();};
  setup();
  return ()=>{alive=false;stop();observer?.disconnect();media.removeEventListener?.('change',changed);redrawRef.current=()=>{};};
 },[lang]);
 const point=(event:PointerEvent<HTMLCanvasElement>)=>{
  const rect=event.currentTarget.getBoundingClientRect();
  const m=motionRef.current;
  m.cursorX=(event.clientX-rect.left)/rect.width*W;
  m.cursorY=(event.clientY-rect.top)/rect.height*H;
  m.targetX=clamp((m.cursorX/W-.5)*2,-1,1);
  m.targetY=clamp((m.cursorY/H-.5)*2,-1,1);
  m.inside=true;redrawRef.current();
 };
 const leave=()=>{
  const m=motionRef.current;m.inside=false;m.targetX=0;m.targetY=0;redrawRef.current();
 };
 return <figure className={styles.scene} data-testid="n41-sky" data-orbit-model="heliocentric-schematic"
  aria-label={lang==='uk'?'Сонячна система: Сонце в центрі, вісім планет на орбітах, Місяць біля Землі':'Solar System: Sun at centre, eight planets on their orbits, Moon around Earth'}>
  <canvas ref={canvasRef} width={W} height={H} className={styles.canvas}
    role="img" onPointerMove={point} onPointerDown={point} onPointerLeave={leave}
    aria-label={lang==='uk'?'Сонце в центрі. Від нього послідовно Меркурій, Венера, Земля з Місяцем, Марс, Юпітер, Сатурн, Уран, Нептун. Схема, не масштаб і не реальне положення на дату.':
     'Sun in the centre; Mercury, Venus, Earth and its Moon, Mars, Jupiter, Saturn, Uranus and Neptune. Diagram not to scale or date-specific.'}>
   {lang==='uk'?'Схема Сонячної системи':'Illustrated Solar System'}
  </canvas>
  <span data-testid="n41-hovered-planet" className={styles.screenReaderStatus} aria-live="polite">
   {hovered?BODY_NAMES[hovered]:null}
  </span>
  <figcaption className={styles.caption}>{lang==='uk'?'Геліоцентрична схема · орбіти й розміри не в масштабі':
   'Heliocentric diagram · orbits and sizes not to scale'}</figcaption>
 </figure>;
}
