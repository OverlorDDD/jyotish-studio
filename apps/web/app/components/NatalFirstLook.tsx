import {useEffect, useId, useRef, useState} from 'react';
import type {PlanetPosition} from '../../lib/north-indian-layout';
import NorthIndianChart, {chartPlanetName, chartSignName} from './NorthIndianChart';
import styles from './NatalFirstLook.module.css';

type Locale = 'uk' | 'en';
type Chart = {ascendant: {sign: number}; d1: PlanetPosition[]};

const houseMeanings = {
 uk: [
  'Від Лагни відлічують усі доми. Перший описує тіло, темперамент і перше враження, яке ви справляєте.',
  'Другий дім пов’язують із родинним укладом, мовленням і тим, як ви накопичуєте ресурси.',
  'Третій дім описує власні зусилля, спілкування та навички, які ви розвиваєте практикою.',
  'Четвертий дім стосується оселі, коріння й того, що дає відчуття внутрішнього спокою.',
  'П’ятий дім пов’язують із творчістю, дітьми й радістю відкривати та передавати знання.',
  'Шостий дім описує щоденну працю, служіння та спосіб, у який ви долаєте перешкоди.',
  'Сьомий дім показує сферу близького партнерства, домовленостей і спільних справ.',
  'Восьмий дім стосується великих змін, спільних ресурсів і того, що зазвичай приховано від погляду.',
  'Дев’ятий дім пов’язують із наставниками, світоглядом і подорожами, які розширюють досвід.',
  'Десятий дім описує професійні справи, відповідальність і вашу роль у суспільстві.',
  'Одинадцятий дім стосується друзів, однодумців і плодів, які приносять тривалі зусилля.',
  'Дванадцятий дім пов’язують з усамітненням, відпочинком, витратами й умінням відпускати.',
 ],
 en: [
  'The ascendant anchors all twelve houses. The first describes the body, temperament and first impressions.',
  'The second house concerns family life, speech and the resources you build up over time.',
  'The third house describes personal effort, communication and skills developed through practice.',
  'The fourth house concerns home, roots and what gives you a sense of inner ease.',
  'The fifth house relates to creativity, children and the pleasure of learning and passing on knowledge.',
  'The sixth house concerns daily work, service and how you meet practical obstacles.',
  'The seventh house describes close partnerships, agreements and what you undertake with others.',
  'The eighth house concerns major changes, shared resources and matters usually kept private.',
  'The ninth house relates to teachers, beliefs and journeys that broaden your experience.',
  'The tenth house describes vocation, responsibility and the role you take in public life.',
  'The eleventh house concerns friends, wider circles and the gains that come from sustained effort.',
  'The twelfth house relates to solitude, rest, expenditure and letting go.',
 ],
};

// Fictional London chart, 2000-03-20 12:00 local. Only sign placements are displayed in the example.
const sample: Chart = {
 ascendant:{sign:4},
 d1:[
  {name:'Sun',sign:12,house:9,degreesInSign:6.3265898160968845,retrograde:false},
  {name:'Moon',sign:6,house:3,degreesInSign:10.121413434338706,retrograde:false},
  {name:'Mars',sign:1,house:10,degreesInSign:4.260373080374393,retrograde:false},
  {name:'Mercury',sign:11,house:8,degreesInSign:10.402875088978817,retrograde:false},
  {name:'Jupiter',sign:1,house:10,degreesInSign:12.783723867851165,retrograde:false},
  {name:'Venus',sign:11,house:8,degreesInSign:14.811641566458661,retrograde:false},
  {name:'Saturn',sign:1,house:10,degreesInSign:20.38358697505788,retrograde:false},
  {name:'Rahu',sign:4,house:1,degreesInSign:7.001093065407133,retrograde:true},
  {name:'Ketu',sign:10,house:7,degreesInSign:7.001093065407076,retrograde:true},
 ],
};

function HouseMap({chart,lang,example=false}:{chart:Chart;lang:Locale;example?:boolean}){
 const uk=lang==='uk', detailId=useId();
 const [pinned,setPinned]=useState(1);
 const [preview,setPreview]=useState<number|null>(null);
 const house=preview??pinned;
 const sign=(chart.ascendant.sign+house-2)%12+1;
 const names=chart.d1.filter(p=>p.sign===sign&&p.name!=='Ascendant').map(p=>chartPlanetName(p.name,lang));
 return <div className={example?styles.preview:styles.layout}>
  <div className={styles.chart}>
   <NorthIndianChart lang={lang} division="d1" chartLabel={example?(uk?'Зразок':'Example'):(uk?'Раші':'Rashi')}
    lagna={chart.ascendant} planets={chart.d1} showDegrees={false}
    interaction={{house,pinned,detailId,preview:setPreview,select:h=>{setPinned(h);setPreview(null);}}}/>
  </div>
  <div className={styles.detail} id={detailId} role="status" aria-live="polite" aria-atomic="true" data-testid="house-detail" data-house={house}>
   <h3>{uk?'Дім ':'House '}{house} · {chartSignName(sign,lang)}{house===1?' · '+(uk?'Лагна':'Lagna'):''}</h3>
   <p>{houseMeanings[lang][house-1]}</p>
   <p className={styles.occupants}>{names.length?names.join(' · '):(uk?'У цьому домі немає грах.':'No grahas occupy this house.')}</p>
  </div>
 </div>;
}

export function NatalSample({lang}:{lang:Locale}){
 return <figure className={styles.sample} data-testid="natal-chart-sample">
  <figcaption>{lang==='uk'?'Зразок D1 · вигадані дані':'Example D1 · fictional birth details'}</figcaption>
  <HouseMap chart={sample} lang={lang} example/>
 </figure>;
}

export function NatalFirstResult({chart,lang,onEdit,focusHeading,children}:{
 chart:Chart;lang:Locale;onEdit:()=>void;focusHeading:boolean;children:React.ReactNode
}){
 const uk=lang==='uk', title=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(focusHeading)title.current?.focus();},[focusHeading]);
 return <section className={styles.result} id="chart-result" data-testid="natal-chart-result" aria-labelledby="natal-result-title">
  <header className={styles.heading}>
   <h1 id="natal-result-title" ref={title} tabIndex={-1}>{uk?'Натальна карта · Раші':'Birth chart · Rashi'}</h1>
   <a href="#natal-birth-date" onClick={event=>{event.preventDefault();onEdit();}}>{uk?'Змінити дані народження':'Edit birth details'}</a>
  </header>
  <p className={styles.instruction}>{uk?'Наведіть курсор або торкніться дому, щоб побачити його значення й планети.':'Hover over or tap a house to explore its meaning and planets.'}</p>
  <HouseMap chart={chart} lang={lang}/>
  {children}
 </section>;
}
