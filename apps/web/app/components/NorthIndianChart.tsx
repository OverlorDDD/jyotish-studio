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
export const chartSignName=(sign:number,lang:'uk'|'en')=>(lang==='uk'?UK:EN)[sign-1];
export const chartPlanetName=(name:string,lang:'uk'|'en')=>lang==='uk'?(PLANETS_UK[name]||name):name;
type Interaction={house:number;pinned:number;detailId:string;preview:(house:number|null)=>void;select:(house:number)=>void};
type Props={interaction?:Interaction;planets:PlanetPosition[];lagna:{sign:number};division:string;lang:'uk'|'en';chartLabel?:string;showDegrees?:boolean};
/** All original planetary data retained; display is now a large clean fixed-sign
 * Rashi-style perimeter instead of cramped/crossing SVG triangle labels. */
export default function NorthIndianChart({planets,lagna,division,lang,chartLabel,showDegrees=true,interaction}:Props){
 const names=lang==='uk'?UK:EN;
 const label=chartLabel??(division==='d1'?(lang==='uk'?'Натальна карта':'Birth chart'):
  division==='d9'?(lang==='uk'?'Навамша':'Navamsha'):(lang==='uk'?'Дашамша':'Dashamsha'));
 return <div className="jy-south-chart" role={interaction?"group":"img"} aria-label={division.toUpperCase()+' · '+(lang==='uk'?'натальна карта дванадцяти знаків':'twelve-sign natal chart')}>
  <div className="jy-south-center" aria-hidden="true"><span className="jy-south-center-index">{division.toUpperCase()}</span><strong>{label}</strong></div>
  {SOUTH_SIGN_GRID.map((sign,i)=>{
   const [column,row]=cellCoordinates[i],house=chartHouseForSign(sign,lagna.sign);
   const occupants=planets.filter(p=>p.sign===sign&&p.name!=='Ascendant');
   const title=names[sign-1]+' · '+(lang==='uk'?'дім ':'house ')+house+
    (occupants.length?' · '+occupants.map(p=>(lang==='uk'?PLANETS_UK[p.name]||p.name:p.name)+(showDegrees?' '+degrees(p.degreesInSign):'')).join(', '):'');
   const Cell=interaction?'button':'section';
   const controls=interaction?{
    type:'button' as const, 'data-house':house, 'data-active':house===interaction.house,
    'aria-controls':interaction.detailId, 'aria-pressed':house===interaction.pinned,
    onFocus:()=>interaction.preview(house),onBlur:()=>interaction.preview(null),
    onPointerMove:(e:React.PointerEvent)=>{if(e.pointerType==='mouse')interaction.preview(house);},
    onPointerLeave:()=>interaction.preview(null),onClick:()=>interaction.select(house)
   }:{};
   return <Cell key={sign} {...controls} className={'jy-south-sign '+(sign===lagna.sign?'jy-south-lagna':'')} style={{gridColumn:column,gridRow:row}} aria-label={title}>
    <span className="jy-south-heading"><span className="jy-south-name">{names[sign-1]}</span><span className="jy-south-symbol" aria-hidden="true">{SIGN_GLYPHS[sign-1]}</span></span>
    <span className="jy-south-house" title={lang==='uk'?'Номер дому':'House number'}>{house}</span>
    {sign===lagna.sign&&<span className="jy-south-ascendant" title={lang==='uk'?'Лагна, висхідний знак':'Lagna, ascendant'}>{interaction?(lang==='uk'?'Лагна':'Lagna'):'Lg'}</span>}
    <span className="jy-south-positions">{occupants.map(p=><span className="jy-south-planet" key={p.name} title={(lang==='uk'?PLANETS_UK[p.name]||p.name:p.name)+(showDegrees?' · '+degrees(p.degreesInSign):'')}>
      <strong>{PLANET_GLYPHS[p.name]||p.name}</strong>
      <span>{showDegrees?degrees(p.degreesInSign):''}{p.retrograde?' ℞':''}</span>
    </span>)}</span>
   </Cell>;
  })}
 </div>;
}
