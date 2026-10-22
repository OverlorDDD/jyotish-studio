import {CHART_HOUSES,SIGN_GLYPHS,PLANET_GLYPHS,layoutHouses,type PlanetPosition} from '../../lib/north-indian-layout';

const SIGN_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANET_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
function degrees(value:number){
 const d=Math.floor(value),minutes=Math.floor((value-d)*60);
 return d+'°'+String(minutes).padStart(2,'0')+'′';
}
type Props={planets:PlanetPosition[];lagna:{sign:number};division:'d1'|'d9'|'d10';lang:'uk'|'en'};

/**
 * Same scalable SVG and house geometry for D1, D9 and D10.
 * Planet glyphs and angular degrees remain independent of UI language.
 * All planets, including a crowded house's overflow, appear in the SVG tooltip
 * and in the adjacent full planetary table.
 */
export default function NorthIndianChart({planets,lagna,division,lang}:Props){
 const houses=layoutHouses(planets),signNames=lang==='uk'?SIGN_UK:SIGN_EN;
 return <svg viewBox="0 0 360 360" className="chart-svg jy-rashi-svg jy-north-chart" role="img"
  aria-label={division.toUpperCase()+' · '+(lang==='uk'?'Північноіндійська карта дванадцяти домів':'North Indian chart of twelve houses')}>
  <rect className="jy-chart-frame" x="1" y="1" width="358" height="358" rx="10" fill="#111b2a" stroke="#bd9b64" strokeWidth="1.45"/>
  <path d="M0 0 L360 360 M360 0 L0 360 M180 0 L360 180 L180 360 L0 180 Z"
   fill="none" stroke="#536477" strokeWidth=".9"/>
  <g className="jy-chart-center" textAnchor="middle" pointerEvents="none">
   <text x="180" y="184" dominantBaseline="middle" fill="#d8bd89" fontFamily="Georgia,serif" fontSize="26" letterSpacing="2">{division.toUpperCase()}</text>
   <text x="180" y="207" dominantBaseline="middle" fill="#8293a8" fontSize="7.5" letterSpacing="2.4">
    {division==='d1'?'RASHI':division==='d9'?'NAVAMSHA':'DASHAMSHA'}
   </text>
  </g>
  {houses.map(slot=>{
   const sign=((lagna.sign+slot.house-2)%12)+1;
   const full=planets.filter(p=>p.house===slot.house&&p.name!=='Ascendant');
   const description=full.map(p=>(lang==='uk'?PLANET_UK[p.name]||p.name:p.name)+' '+degrees(p.degreesInSign)+(p.retrograde?' ℞':'')).join(', ');
   return <g key={slot.house} data-house={slot.house} className="jy-chart-house"
     transform={`translate(${slot.x} ${slot.y})`}>
    <title>{slot.house}. {signNames[sign-1]} · {description||(lang==='uk'?'без планет':'no planets')}</title>
    <g transform={`translate(0 ${slot.top-slot.y})`}>
     <text x="-13" y="8" textAnchor="middle" dominantBaseline="middle"
      fill="#9eafc6" fontSize="8" fontWeight="600">{slot.house}</text>
     <text x="12" y="8" textAnchor="middle" dominantBaseline="middle"
      fill="#ddb87b" fontSize="13" fontFamily="Georgia,serif">{SIGN_GLYPHS[sign-1]}</text>
     {slot.shown.map((p,index)=><g key={p.name} transform={`translate(0 ${18+index*slot.lineHeight})`}>
      <text x="-23" y="0" dominantBaseline="middle" textAnchor="middle" fill="#e5c78d"
       fontFamily="Georgia,serif" fontSize={slot.kind==='corner'?11:12}>{PLANET_GLYPHS[p.name]||'•'}</text>
      <text x="-10" y="0" dominantBaseline="middle" textAnchor="start" fill="#ccd7e5"
       fontSize={slot.kind==='corner'?7.2:7.8}>{degrees(p.degreesInSign)}{p.retrograde?' ℞':''}</text>
     </g>)}
     {slot.hidden>0&&<text x="0" y={18+slot.shown.length*slot.lineHeight} dominantBaseline="middle"
       textAnchor="middle" fontSize="7.5" fill="#d8ba80">+{slot.hidden}</text>}
    </g>
    {slot.house===1&&<g className="jy-ascendant-marker" transform="translate(0 -65)">
     <rect x="-17" y="-8" width="34" height="16" rx="8" fill="#263343" stroke="#bd9859" strokeWidth=".8"/>
     <text x="0" y="0" dominantBaseline="middle" textAnchor="middle" fill="#e9ca8e" fontSize="8.5" fontWeight="700">Lg</text>
    </g>}
   </g>;
  })}
 </svg>;
}
