'use client';
import {useEffect,useRef} from 'react';

/** Site-wide night sky behind every section: three star layers that drift at different speeds
 * when the page scrolls and when the pointer moves (gentle parallax). Pure CSS backgrounds moved
 * with transforms only (GPU), no React re-render per frame. Still for reduced-motion users. */
const TILES=[380,560,980];
const DEPTH=[{scroll:.06,pointer:6},{scroll:.14,pointer:14},{scroll:.26,pointer:26}];
export default function StarSky(){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=root.current;
  if(!el||typeof window.matchMedia!=='function'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const layers=[...el.children] as HTMLElement[];
  let mx=0,my=0,frame=0;
  const paint=()=>{
   frame=0;
   const sy=window.scrollY||0;
   layers.forEach((layer,i)=>{
    const d=DEPTH[i],tile=TILES[i];
    const y=-((sy*d.scroll)%tile)-my*d.pointer;
    layer.style.transform='translate3d('+(-mx*d.pointer).toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
   });
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};
  const move=(e:PointerEvent)=>{if(e.pointerType!=='mouse')return;mx=e.clientX/window.innerWidth-.5;my=e.clientY/window.innerHeight-.5;schedule();};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('pointermove',move,{passive:true});
  paint();
  return()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('pointermove',move);if(frame)cancelAnimationFrame(frame);};
 },[]);
 return <div ref={root} className="gx-sky" aria-hidden="true"><span className="gx-sky-1"/><span className="gx-sky-2"/><span className="gx-sky-3"/></div>;
}
