'use client';
import {useMemo,useState} from 'react';
import NorthIndianChart from './NorthIndianChart';
import {SHODASHAVARGA,calculateAllVargas,type VargaNumber} from '../../../../packages/jyotish-core/src/vargas';
import type {PlanetPosition} from '../../lib/north-indian-layout';

type Natal=Readonly<{
 verification?:{version:string;status:string;digest:string};
 ascendant:{sign:number;longitude:number};
 lagnaD9:{sign:number};lagnaD10:{sign:number};
 d1:readonly (PlanetPosition&{longitude:number})[];
 d9:readonly PlanetPosition[];d10:readonly PlanetPosition[];
}>;
const UK_SIGNS=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const EN_SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const G_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
type VargaInfo={n:VargaNumber;label:string;uk:string;en:string;ukNote:string;enNote:string};
export const VARGA_INFO:readonly VargaInfo[]=[
 {n:1,label:'Rashi',uk:'Загальна картина',en:'The whole chart',ukNote:'Основна карта для знаків, домів і взаємодії планет.',enNote:'The foundation for signs, houses and planetary relationships.'},
 {n:2,label:'Hora',uk:'Ресурси й достаток',en:'Resources and wealth',ukNote:'Класична Хора Сонця й Місяця. Це не фінансовий прогноз.',enNote:'Classical Sun/Moon Hora, not a financial forecast.'},
 {n:3,label:'Drekkana',uk:'Сміливість і взаємодія',en:'Courage and siblings',ukNote:'Додатковий ракурс ініціативи та стосунків із братами й сестрами.',enNote:'A perspective on initiative and sibling relationships.'},
 {n:4,label:'Chaturthamsa',uk:'Оселя і коріння',en:'Home and roots',ukNote:'Традиційно пов’язують із домом, майном і відчуттям опори.',enNote:'Traditionally associated with home, property and foundations.'},
 {n:7,label:'Saptamsa',uk:'Діти і творчість',en:'Children and creativity',ukNote:'Традиційні теми наступництва, виховання та творчого продовження.',enNote:'Traditional themes of succession, parenting and creative continuity.'},
 {n:9,label:'Navamsa',uk:'Стосунки й дхарма',en:'Relationships and dharma',ukNote:'Додатковий погляд на цінності, партнерство та зрілість планет.',enNote:'An additional view of values, partnership and planetary maturation.'},
 {n:10,label:'Dashamsa',uk:'Праця й покликання',en:'Work and vocation',ukNote:'Професійна роль, відповідальність і способи реалізації.',enNote:'Professional role, responsibility and contribution.'},
 {n:12,label:'Dwadasamsa',uk:'Батьки й родина',en:'Parents and family',ukNote:'Сімейне коріння й передача досвіду між поколіннями.',enNote:'Family origins and generational connections.'},
 {n:16,label:'Shodasamsa',uk:'Комфорт і транспорт',en:'Comfort and vehicles',ukNote:'Комфорт, засоби пересування й матеріальні зручності.',enNote:'Comfort, transportation and material conveniences.'},
 {n:20,label:'Vimsamsa',uk:'Духовна практика',en:'Spiritual practice',ukNote:'Зосередження, духовна дисципліна та ритуальна практика.',enNote:'Contemplation, spiritual discipline and practice.'},
 {n:24,label:'Siddhamsa',uk:'Навчання',en:'Learning',ukNote:'Освіта, засвоєння знань і напрям розвитку майстерності.',enNote:'Education, learning and cultivation of skills.'},
 {n:27,label:'Bhamsha',uk:'Витривалість',en:'Resilience',ukNote:'Традиційне дослідження сильних і вразливих сторін.',enNote:'Traditional exploration of strengths and vulnerabilities.'},
 {n:30,label:'Trimsamsa',uk:'Випробування',en:'Difficulties',ukNote:'Нерівні частини знака: п’ять секторів, не 30 рівних.',enNote:'Unequal sign divisions: five sectors, not 30 equal ones.'},
 {n:40,label:'Khavedamsa',uk:'Материнська спадщина',en:'Maternal lineage',ukNote:'Традиційно розглядають вплив материнської лінії.',enNote:'Traditionally associated with maternal lineage.'},
 {n:45,label:'Akshavedamsa',uk:'Батьківська спадщина',en:'Paternal lineage',ukNote:'Традиційно розглядають вплив батьківської лінії.',enNote:'Traditionally associated with paternal lineage.'},
 {n:60,label:'Shashtiamsa',uk:'Тонкі закономірності',en:'Fine distinctions',ukNote:'Надзвичайно чутлива до точності часу народження варга.',enNote:'A varga highly sensitive to birth-time accuracy.'}
];
const sname=(n:number,lang:'en'|'uk')=>(lang==='uk'?UK_SIGNS:EN_SIGNS)[n-1]||'—';
const pname=(s:string,lang:'en'|'uk')=>lang==='uk'?(G_UK[s]||s):s;
export default function VargaExplorer({chart,lang}:{chart:Natal|null;lang:'en'|'uk'}){
 const [selected,setSelected]=useState<VargaNumber>(9),[matrix,setMatrix]=useState(false);
 const charts=useMemo(()=>{
  if(!chart||chart.verification?.version!=='jyotish-integrity-v3'||chart.verification.status!=='verified_internal')return null;
  return calculateAllVargas(chart.ascendant.longitude,chart.d1.map(p=>({
   name:p.name,longitude:p.longitude,speed:p.retrograde?-1:1
  })));
 },[chart]);
 const info=VARGA_INFO.find(v=>v.n===selected)||VARGA_INFO[5];
 const active=charts?.find(c=>c.division===selected);
 const lagna=selected===1?chart?.ascendant:selected===9?chart?.lagnaD9:selected===10?chart?.lagnaD10:active?{sign:active.lagna.vargaSign}:null;
 const positions:PlanetPosition[]=(selected===1?chart?.d1:selected===9?chart?.d9:selected===10?chart?.d10:
  active?.planets.map(p=>({name:p.name,sign:p.vargaSign,house:p.house,degreesInSign:0,retrograde:p.retrograde})))?.map(p=>({...p}))||[];
 const uk=lang==='uk';
 return <section className="panel n4-explorer" id="varga-explorer" aria-labelledby="n4-heading">
  <div className="n4-intro">
   <div><span className="eyebrow">{uk?'ШІСТНАДЦЯТЬ ВАРГ ДЖЙОТІШ':'SIXTEEN JYOTISH VARGAS'}</span>
    <h2 id="n4-heading">{uk?'Досліди всі карти народження':'Explore all your birth charts'}</h2>
    <p>{uk?'Обирай життєву тему й порівнюй її карту з основною D1. Спочатку факти, після них — трактування.':'Choose a life theme and compare its chart with D1. First the calculated placements, then the reading.'}</p></div>
   <span className="n4-count">16 <small>{uk?'карт':'charts'}</small></span>
  </div>
  <nav className="n4-tabs jy-varga-tabs" aria-label={uk?'Обрати дробову карту':'Select a divisional chart'}>
   {VARGA_INFO.map(v=><button key={v.n} type="button" className={selected===v.n?'selected':''}
    onClick={()=>setSelected(v.n)} aria-pressed={selected===v.n}
    title={uk?v.uk:v.en}>D{v.n}<span>{uk?v.uk:v.en}</span></button>)}
  </nav>
  <div className="n4-chart-head">
   <div><h3>D{selected} · {info.label}</h3><p>{uk?info.ukNote:info.enNote}</p></div>
   {selected===60&&<span className="n4-caution">{uk?'Потрібен точний час народження':'Precise birth time required'}</span>}
  </div>
  {active&&selected>=16&&<p className="n4-angular-boundary-note" data-testid="n4-angular-boundary-note">
   {uk?'Найближча межа сектора Лагни: ':'Nearest varga Lagna sector boundary: '}
   <strong>{(active.lagna.boundaryDistanceArcseconds/60).toFixed(2)}′</strong>.
   {' '}{uk?
    'Це кутова відстань, а не запас точності часу народження. Для оцінки похибки в хвилинах потрібні нові розрахунки ефемерид для кількох можливих моментів.' :
    'This is an angular distance, not a birth-time tolerance. Estimating uncertainty in minutes requires fresh ephemeris calculations for multiple candidate times.'}
   {active.lagna.boundaryDistanceArcseconds<60&&<span className="n4-angular-edge-alert">
    {' '}{uk?'Лагна поблизу межі, тому знак може залежати від точності зазначеного часу.':
     'Lagna is close to a boundary, so the sign may depend on how precisely birth time was recorded.'}
   </span>}
  </p>}
  <div className="n4-comparison">
   <article><h4>D1 · {uk?'Основна карта':'Birth chart'}</h4>
    {chart?<NorthIndianChart planets={[...chart.d1]} lagna={chart.ascendant} division="d1" lang={lang}/>:<div className="jy-empty-chart small">{uk?'Спочатку розрахуй карту':'Calculate your chart first'}</div>}
   </article>
   <article><h4>D{selected} · {uk?info.uk:info.en}</h4>
    {chart&&charts&&lagna?<NorthIndianChart planets={positions} lagna={lagna} division={'d'+selected}
     chartLabel={info.label} showDegrees={selected===1||selected===9||selected===10} lang={lang}/>:
     <div className="jy-empty-chart small">{uk?'Спочатку розрахуй карту':'Calculate your chart first'}</div>}
   </article>
  </div>
  {active&&<>
   <div className="n4-data">
    <h4>{uk?'Що саме розраховано':'Calculated placements'}</h4>
    <p>{uk?'Лагна варги':'Varga ascendant'}: <strong>{sname(active.lagna.vargaSign,lang)}</strong>.
     {' '}{uk?'Положення планет визначені за сидеричними довготами D1.':'Placements are derived from D1 sidereal longitudes.'}</p>
    <div className="n4-placements">{active.planets.map(p=><div key={p.name}><span>{pname(p.name,lang)}</span>
     <strong>{sname(p.vargaSign,lang)} · {uk?'дім':'house'} {p.house}</strong></div>)}</div>
   </div>
   <button className="n4-matrix-toggle" onClick={()=>setMatrix(v=>!v)} type="button" aria-expanded={matrix}>
    {matrix?(uk?'Згорнути порівняння 16 карт':'Hide all-chart matrix'):(uk?'Порівняти 16 карт у таблиці':'Compare all 16 charts in a matrix')}
   </button>
   {matrix&&<div className="table-scroll n4-matrix"><table><thead><tr><th>{uk?'Карта':'Chart'}</th><th>{uk?'Лагна':'Lagna'}</th>
    {active.planets.map(p=><th key={p.name}>{pname(p.name,lang)}</th>)}</tr></thead><tbody>
    {charts?.map(c=><tr key={c.division}><th>D{c.division}</th><td>{sname(c.lagna.vargaSign,lang)}</td>
     {c.planets.map(p=><td key={p.name} title={sname(p.vargaSign,lang)}>{sname(p.vargaSign,lang)}</td>)}</tr>)}
   </tbody></table></div>}
  </>}
  <p className="n4-method-note">{uk?
   'Метод: Парашарі, заданий профіль N4.0. D2 і D30 мають спеціальні правила; незалежна сертифікація всіх 16 варг з JHora триває. Збільшення D-карти не робить час народження точнішим.':
   'Method: pinned Parashari N4.0 profile. D2 and D30 use special rules; independent JHora certification for all 16 vargas is still pending. A higher D number does not make the birth time more accurate.'}</p>
 </section>;
}
