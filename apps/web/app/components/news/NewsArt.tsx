/** First-party GalaxiNews illustrations (inline SVG, no remote assets).
 * Diagrams of the sky event, never presented as photographs. */
import type {SkyArticle} from '../../../lib/news-sky';

const PLANET_COLOR:Record<string,[string,string]>={Sun:['#FFF1C9','#F2B65A'],Moon:['#F4F1EA','#B9C3D6'],
 Mercury:['#E6F2EC','#8FD3B8'],Venus:['#FFF4D6','#F2C982'],Mars:['#FFD9CC','#E0785A'],Jupiter:['#FFF0D8','#E7BD72'],Saturn:['#EFE6D2','#BFA77A']};
const STARS=[[80,90,1.4],[300,160,1],[470,70,1.6],[1090,110,1.2],[990,590,1.4],[150,520,1.2],[610,620,1],[860,60,1.1],[1140,300,1.3],[40,330,1]];

export default function NewsArt({art,id,label}:{art:SkyArticle['art'];id:string;label:string}){
 const [core,glow]=PLANET_COLOR[art.body||'']||PLANET_COLOR.Venus;
 const g=(n:string)=>id+'-'+n;
 return <svg viewBox="0 0 1200 675" role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
  <defs>
   <radialGradient id={g('bg')} cx="0.62" cy="0.4" r="0.7"><stop offset="0" stopColor="#3C5FA6" stopOpacity=".7"/><stop offset="1" stopColor="#0B1428" stopOpacity="0"/></radialGradient>
   <radialGradient id={g('p')} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={core}/><stop offset=".5" stopColor={glow}/><stop offset="1" stopColor={glow} stopOpacity="0"/></radialGradient>
   <radialGradient id={g('m')} cx=".42" cy=".38" r=".7"><stop offset="0" stopColor="#FBF7EE"/><stop offset="1" stopColor="#C9C3B4"/></radialGradient>
  </defs>
  <rect width="1200" height="675" fill="#0B1428"/><rect width="1200" height="675" fill={'url(#'+g('bg')+')'}/>
  <g fill="#F3EEE4">{STARS.map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} opacity={.45+(i%3)*.15}/>)}</g>
  {art.kind==='station'&&<>
   <path d="M0 500 C300 460 900 460 1200 500" fill="none" stroke="#E7BD72" strokeOpacity=".16" strokeWidth="56"/>
   <path d="M230 420 C420 370 560 300 640 300 C720 300 720 390 650 390 C585 390 600 312 705 296 C830 276 950 300 1090 360" fill="none" stroke="#E7BD72" strokeWidth="3" strokeLinecap="round" strokeDasharray={art.retro?'2 10':undefined}/>
   <path d="M1066 344 L1094 362 L1062 372" fill="none" stroke="#E7BD72" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
   <circle cx={art.retro?640:705} cy={art.retro?300:296} r="90" fill={'url(#'+g('p')+')'}/>
   <circle cx={art.retro?640:705} cy={art.retro?300:296} r="18" fill={core}/>
  </>}
  {art.kind==='ingress'&&<>
   <path d="M-40 560 A760 760 0 0 1 1240 560" fill="none" stroke="#E7BD72" strokeOpacity=".22" strokeWidth="2"/>
   <path d="M-40 600 A760 760 0 0 1 1240 600" fill="none" stroke="#E7BD72" strokeOpacity=".12" strokeWidth="60"/>
   <line x1="600" y1="150" x2="600" y2="640" stroke="#E7BD72" strokeOpacity=".55" strokeDasharray="4 10"/>
   <circle cx="640" cy="232" r={art.body==='Sun'?150:110} fill={'url(#'+g('p')+')'}/>
   <circle cx="640" cy="232" r={art.body==='Sun'?44:22} fill={core}/>
   <path d="M380 300 Q520 250 600 238" fill="none" stroke={glow} strokeOpacity=".5" strokeWidth="3" strokeLinecap="round"/>
  </>}
  {art.kind==='phase'&&(()=>{
   const ph=art.phase??2,cx=600,cy=330,r=170;
   // Lit part: 0 new (dark), 1 first quarter (right half), 2 full, 3 last quarter (left half).
   return <>
    <circle cx={cx} cy={cy} r={r+120} fill="#F3EEE4" opacity={ph===2?.06:.03}/>
    <circle cx={cx} cy={cy} r={r} fill="#1A2440" stroke="#F3EEE4" strokeOpacity=".18"/>
    {ph===2&&<circle cx={cx} cy={cy} r={r} fill={'url(#'+g('m')+')'}/>}
    {ph===1&&<path d={`M${cx} ${cy-r} A${r} ${r} 0 0 1 ${cx} ${cy+r} Z`} fill={'url(#'+g('m')+')'}/>}
    {ph===3&&<path d={`M${cx} ${cy-r} A${r} ${r} 0 0 0 ${cx} ${cy+r} Z`} fill={'url(#'+g('m')+')'}/>}
    {ph===0&&<circle cx={cx} cy={cy} r={r} fill="none" stroke="#F6DCA4" strokeOpacity=".5" strokeWidth="3"/>}
    {ph===2&&<g fill="#B7AF9D" opacity=".35"><circle cx={cx-50} cy={cy-40} r="34"/><circle cx={cx+60} cy={cy+50} r="24"/><circle cx={cx+20} cy={cy-80} r="14"/></g>}
   </>;
  })()}
  {art.kind==='eclipse'&&<>
   <circle cx="600" cy="330" r="230" fill="#F2B65A" opacity=".18"/>
   <circle cx="600" cy="330" r="150" fill="#F6DCA4"/>
   <circle cx="640" cy="320" r="150" fill="#0B1428"/>
  </>}
 </svg>;
}
