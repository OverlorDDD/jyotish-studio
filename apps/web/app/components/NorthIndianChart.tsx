import {SIGN_GLYPHS,PLANET_GLYPHS,type PlanetPosition} from '../../lib/north-indian-layout';

const UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANETS_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
/** Classical South Indian / fixed-sign perimeter, clockwise from Pisces at top left.
 * Middle 2x2 cells belong to the legend, never to a planet. */
export const SOUTH_SIGN_GRID=[12,1,2,3,11,4,10,5,9,8,7,6] as const;
export const chartHouseForSign=(sign:number,lagnaSign:number)=>((sign-lagnaSign+12)%12)+1;
const cellCoordinates:ReadonlyArray<readonly [number,number]>=
 [[1,1],[2,1],[3,1],[4,1],[1,2],[4,2],[1,3],[4,3],[1,4],[2,4],[3,4],[4,4]];
function degrees(value:number){
 const d=Math.floor(value),minutes=Math.floor((value-d)*60);
 return d+'°'+String(minutes).padStart(2,'0')+'′';
}
type Props={planets:PlanetPosition[];lagna:{sign:number};division:'d1'|'d9'|'d10';lang:'uk'|'en'};
/** All original planetary data retained; display is now a large clean fixed-sign
 * Rashi-style perimeter instead of cramped/crossing SVG triangle labels. */
export default function NorthIndianChart({planets,lagna,division,lang}:Props){
 const names=lang==='uk'?UK:EN;
 const label=division==='d1'?'RASHI':division==='d9'?'NAVAMSHA':'DASHAMSHA';
 return <div className="jy-south-chart" role="img" aria-label={division.toUpperCase()+' · '+(lang==='uk'?'натальна карта дванадцяти знаків':'twelve-sign natal chart')}>
  <div className="jy-south-center" aria-hidden="true"><strong>{label}</strong><span>{division.toUpperCase()} · {lang==='uk'?'Натальна карта':'Birth chart'}</span></div>
  {SOUTH_SIGN_GRID.map((sign,i)=>{
   const [column,row]=cellCoordinates[i],house=chartHouseForSign(sign,lagna.sign);
   const occupants=planets.filter(p=>p.sign===sign&&p.name!=='Ascendant');
   const title=names[sign-1]+' · '+(lang==='uk'?'дім ':'house ')+house+
    (occupants.length?' · '+occupants.map(p=>(lang==='uk'?PLANETS_UK[p.name]||p.name:p.name)+' '+degrees(p.degreesInSign)).join(', '):'');
   return <section key={sign} className={'jy-south-sign '+(sign===lagna.sign?'jy-south-lagna':'')} style={{gridColumn:column,gridRow:row}} aria-label={title}>
    <div className="jy-south-heading"><span className="jy-south-name">{names[sign-1]}</span><span className="jy-south-symbol" aria-hidden="true">{SIGN_GLYPHS[sign-1]}</span></div>
    <span className="jy-south-house" title={lang==='uk'?'Номер дому':'House number'}>{house}</span>
    {sign===lagna.sign&&<span className="jy-south-ascendant" title={lang==='uk'?'Лагна, висхідний знак':'Lagna, ascendant'}>Lg</span>}
    <div className="jy-south-positions">{occupants.map(p=><div className="jy-south-planet" key={p.name} title={(lang==='uk'?PLANETS_UK[p.name]||p.name:p.name)+' · '+degrees(p.degreesInSign)}>
      <strong>{PLANET_GLYPHS[p.name]||p.name}</strong>
      <span>{degrees(p.degreesInSign)}{p.retrograde?' ℞':''}</span>
    </div>)}</div>
   </section>;
  })}
 </div>;
}
