'use client';
import {useState,useEffect} from 'react';
import NorthIndianChart from './NorthIndianChart';
import type {PlanetPosition} from '../../lib/north-indian-layout';
import {hasN4RcView,type N4RcView,type VerifiedNatalSource} from '../../lib/n4-rc-view';
import {hasD60Provisional,type N4D60UI} from '../../lib/n4-d60-view';
import styles from './N4RcExplorer.module.css';

type Natal=VerifiedNatalSource&Readonly<{
 d1?:readonly PlanetPosition[];d9?:readonly PlanetPosition[];d10?:readonly PlanetPosition[];
 n4D60?:N4D60UI;input?:{time?:string};
}>;
type Info=Readonly<{n:number;name:string;uk:string;en:string;detailUk:string;detailEn:string}>;
const INFO:readonly Info[]=[
 {n:1,name:'Rashi',uk:'Основна карта',en:'Foundations',detailUk:'Базові положення планет і домів.',detailEn:'Your foundational planetary signs and houses.'},
 {n:2,name:'Hora',uk:'Ресурси',en:'Resources',detailUk:'Хора Сонця й Місяця — традиційна карта ресурсів.',detailEn:'Sun/Moon Hora, a traditional lens on resources.'},
 {n:3,name:'Drekkana',uk:'Ініціатива',en:'Initiative',detailUk:'Дії, сміливість і взаємодія.',detailEn:'Initiative, courage and cooperation.'},
 {n:4,name:'Chaturthamsa',uk:'Дім',en:'Home',detailUk:'Оселя, опора й коріння.',detailEn:'Home, stability and roots.'},
 {n:7,name:'Saptamsa',uk:'Творчість',en:'Creativity',detailUk:'Творчість, діти та спадкоємність у традиції.',detailEn:'Creativity, children and continuity in the tradition.'},
 {n:9,name:'Navamsa',uk:'Стосунки',en:'Relationships',detailUk:'Партнерство, цінності та дхарма.',detailEn:'Partnership, values and dharma.'},
 {n:10,name:'Dashamsa',uk:'Професія',en:'Career',detailUk:'Праця, відповідальність і професійна роль.',detailEn:'Work, responsibility and vocation.'},
 {n:12,name:'Dwadasamsa',uk:'Родина',en:'Family',detailUk:'Батьки та родинне коріння.',detailEn:'Parents and family origins.'},
 {n:16,name:'Shodasamsa',uk:'Комфорт',en:'Comfort',detailUk:'Комфорт та засоби пересування.',detailEn:'Comfort and transportation.'},
 {n:20,name:'Vimsamsa',uk:'Практики',en:'Practice',detailUk:'Духовна дисципліна та внутрішня практика.',detailEn:'Spiritual discipline and practice.'},
 {n:24,name:'Siddhamsa',uk:'Освіта',en:'Education',detailUk:'Навчання й удосконалення навичок.',detailEn:'Education and developing skills.'},
 {n:27,name:'Bhamsha',uk:'Витривалість',en:'Resilience',detailUk:'Сильні сторони та вразливості.',detailEn:'Strengths and vulnerabilities.'},
 {n:30,name:'Trimsamsa',uk:'Виклики',en:'Challenges',detailUk:'Традиційна карта життєвих перешкод.',detailEn:'Traditional lens on obstacles.'},
 {n:40,name:'Khavedamsa',uk:'Материнська лінія',en:'Maternal line',detailUk:'Традиційний ракурс родової спадщини.',detailEn:'Traditional maternal-line themes.'},
 {n:45,name:'Akshavedamsa',uk:'Батьківська лінія',en:'Paternal line',detailUk:'Традиційний ракурс родової спадщини.',detailEn:'Traditional paternal-line themes.'}
];
const CATEGORIES=[
 {key:'resources',uk:'Ресурси й дім',en:'Resources & home',ns:[2,4,16]},
 {key:'family',uk:'Родина й взаємодія',en:'Family & connections',ns:[3,7,12,40,45]},
 {key:'growth',uk:'Розвиток і практика',en:'Growth & practice',ns:[20,24,27]},
 {key:'challenges',uk:'Випробування',en:'Challenges',ns:[30]}
] as const;
const SIGNS_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANETS_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const value=(p:string,uk:boolean)=>uk?PLANETS_UK[p]||p:p;
const sign=(s:number,uk:boolean)=>(uk?SIGNS_UK:SIGNS_EN)[s-1]||'—';
function onN4Only(v:N4RcView,n:number):{planets:PlanetPosition[];lagna:{sign:number}}|null{
 const a=v.charts.find(c=>c.division===n);
 if(!a)return null;
 return {lagna:{sign:a.lagnaSign},planets:a.planets.map(p=>({
  name:p.name,sign:p.sign,house:p.house,retrograde:p.retrograde,degreesInSign:0
 }))};
}
export default function N4RcExplorer({chart,lang}:{chart:Natal|null;lang:'uk'|'en'}){
 const [selected,setSelected]=useState(9);
 const [birthTimeSource,setBirthTimeSource]=useState<'unknown'|'recorded_minute'|'approximate'>('unknown');
 useEffect(()=>{setBirthTimeSource('unknown')},[chart?.verification?.digest]);
 const d60Valid=chart!==null&&hasD60Provisional(chart);
 const d60=d60Valid?chart?.n4D60:undefined;
 const d60BoundaryWarning=d60&&Math.min(
  d60.lagna.boundaryDistanceArcseconds,...d60.planets.map(p=>p.boundaryDistanceArcseconds)
 )<=1;
 const uk=lang==='uk',passed=chart!==null&&hasN4RcView(chart);
 const n4=passed?chart?.n4:null;
 const info=INFO.find(x=>x.n===selected)!;
 const selectedChart=n4?onN4Only(n4,selected):null;
 const isCore=selected===1||selected===9||selected===10;
 const positions=selected===1?chart?.d1:selected===9?chart?.d9:selected===10?chart?.d10:selectedChart?.planets;
 const lagna=selected===1?chart?.ascendant:selected===9?chart?.lagnaD9:selected===10?chart?.lagnaD10:selectedChart?.lagna;
 const selectedRaw=n4?.charts.find(c=>c.division===selected);
 const boundaryGuard=selectedRaw&&Math.min(
  selectedRaw.lagnaBoundaryArcseconds,
  ...selectedRaw.planets.map(p=>p.boundaryDistanceArcseconds)
 )<=1;
 const l=(item:Info)=>item.n===1?'D1 · Rashi':'D'+item.n+' · '+(uk?item.uk:item.en);
 const pick=(item:Info)=><button key={item.n} type="button"
  className={selected===item.n?styles.selected:styles.tab}
  aria-pressed={selected===item.n} onClick={()=>setSelected(item.n)}>
  <strong>D{item.n}</strong><span>{uk?item.uk:item.en}</span></button>;
 return <section id="varga-explorer" className={styles.panel} aria-labelledby="n4-rc-title" data-testid="n4-rc-explorer">
  <div className={styles.intro}>
   <div><small className={styles.eyebrow}>{uk?'ГАЛАКСІОРА · НАТАЛЬНІ КАРТИ':'GALAXIORA · BIRTH CHARTS'}</small>
    <h2 id="n4-rc-title">{uk?'Одна натальна карта — 16 ракурсів':'One birth chart, 16 perspectives'}</h2>
    <p>{uk?'Основна карта D1 завжди поруч. Обери сферу життя, щоб побачити додаткову варгу, її планети й доми.':
     'Your D1 chart stays in view. Select a life area to explore its divisional chart, planets and houses.'}</p></div>
   <strong className={styles.counter}>16 <small>{uk?'карт':'charts'}</small></strong>
  </div>
  <div className={styles.mainTabs} role="group" aria-label={uk?'Основні варги':'Primary vargas'}>
   {INFO.filter(x=>[1,9,10].includes(x.n)).map(pick)}
  </div>
  <details className={styles.more} data-testid="n4-rc-additional">
   <summary>{uk?'Інші 12 карт за життєвими темами':'Explore 12 other charts by life area'}</summary>
   <div className={styles.categories}>
    {CATEGORIES.map(group=><div key={group.key}>
     <h3>{uk?group.uk:group.en}</h3>
     <div role="group" aria-label={uk?group.uk:group.en} className={styles.tabs}>
      {group.ns.map(n=>pick(INFO.find(x=>x.n===n)!))}
     </div>
    </div>)}
   </div>
  </details>
  <details className={styles.more} data-testid="n4-d60-panel">
   <summary>{uk?'D60 · Шаштіамша — тонкі кармічні впливи':'D60 · Shashtiamsa — subtle karmic themes'}</summary>
   <p className={styles.method}>
    {uk?'Математична формула D60 пройшла незалежну звірку для обраного методу JHora Traditional. Однак записаний час народження до хвилини не гарантує стабільність D60: Лагна може змінитися за десятки секунд.':
     'The D60 symbolic formula passed independent method-scoped comparison with JHora Traditional. A recorded minute does not guarantee D60 stability: its ascendant can change within tens of seconds.'}
   </p>
   <label className={styles.d60Precision}>
    {uk?'Наскільки точно відомий час народження?':'How accurately is your birth time known?'}
    <select value={birthTimeSource} onChange={event=>setBirthTimeSource(event.target.value as 'unknown'|'recorded_minute'|'approximate')}>
     <option value="unknown">{uk?'Не знаю точності / хвилини невідомі':'Unknown accuracy / minutes not known'}</option>
     <option value="recorded_minute">{uk?'Записаний у документі до хвилини (HH:MM)':'Documented to the minute (HH:MM)'}</option>
     <option value="approximate">{uk?'Орієнтовний час (або округлений)':'Approximate or rounded time'}</option>
    </select>
   </label>
   {!chart?<p className={styles.empty} role="status">{uk?'Спочатку розрахуй натальну карту, щоб побачити D60.':'Calculate your birth chart first to see D60.'}</p>:
   !d60Valid?<p className={styles.warning} role="alert">
    {uk?'Точні вхідні координати D60 не підтверджені сервером. Результат приховано.':'The server has not verified the D60 source data. Results are hidden.'}
   </p>:
   birthTimeSource==='unknown'?<p className={styles.warning} data-testid="n4-d60-precision-warning">
    {uk?'Хвилини народження не підтверджені: D60 може істотно відрізнятися. Уточни час за документом, щоб побачити попередній розрахунок.':
     'Birth minutes are not documented: D60 can differ substantially. Confirm the recorded time to see a provisional calculation.'}
   </p>:
   <div data-testid="n4-d60-content">
    <p className={styles.warning} role="status">
     {birthTimeSource==='approximate'
      ?uk?'Час приблизний: карта D60 та її доми не є надійними. Показуємо лише номінальні знаки планет без Лагни.':
          'Time is approximate: D60 ascendant and houses are unreliable. Only nominal planetary signs are shown.'
      :uk?'Час записаний до хвилини. Нижче — попередня D60 за вказаним часом: Лагна та доми ще не перевірені на стабільність у межах можливої похибки ±30 секунд.':
          'Time is recorded to the minute. This is a provisional D60 at the entered instant; the ascendant and houses have NOT been stability-certified across a possible ±30-second rounding window.'}
    </p>
    {birthTimeSource==='recorded_minute'&&
     <div className={styles.chart}>
      <h3>D60 · {uk?'Попередня карта':'Provisional chart'}</h3>
      <NorthIndianChart division="d60" lang={lang} chartLabel="Shashtiamsa" showDegrees={false}
       planets={d60!.planets.map(p=>({name:p.name,sign:p.sign,house:p.house,retrograde:p.retrograde,degreesInSign:0}))}
       lagna={{sign:d60!.lagna.sign}}/>
     </div>}
    <div className={styles.planetGrid}>
     {d60!.planets.map(p=><div key={p.name}>
      <span>{value(p.name,uk)}</span><strong>{sign(p.sign,uk)} · {uk?'частина ':'part '}{p.part}/60</strong>
     </div>)}
    </div>
    {d60BoundaryWarning&&<p className={styles.warning} data-testid="n4-d60-near-boundary">
     {uk?'Принаймні одне положення D60 ближче 1″ до межі сектора. Навіть дуже мала похибка довготи може змінити знак.':
      'At least one D60 placement lies within 1″ of a sector boundary; a tiny longitude difference may change its sign.'}
    </p>}
    <p className={styles.method}>
     {uk?'Режим: JHora Traditional, відлік частин від власного знака. Перевірені правила відображення знаків ≠ перевірений історичний час, стабільність Лагни або дозвіл на персональні прогнози D60.':
      'Method: JHora Traditional, own-sign inclusive. Verified symbolic mappings do not certify historical birth time, ascendant stability or individual D60 predictions.'}
    </p>
   </div>}
  </details>
  {!chart?<p className={styles.empty} role="status">{uk?'Введи свої дані народження вище, щоб побачити карти.':'Enter your birth details above to see your charts.'}</p>:
    !passed?<p role="alert" className={styles.warning}>{uk?'Сервер не підтвердив метод і зв’язок додаткових карт із D1. Нові карти приховано.':'Server proof is missing or mismatched. Additional charts are hidden.'}</p>:null}
  <div className={styles.grid}>
   <article className={styles.chart}>
    <h3>D1 · {uk?'Основа':'Foundation'}</h3>
    {chart&&passed&&chart.d1&&chart.ascendant?
      <NorthIndianChart division="d1" lang={lang} planets={[...chart.d1]} lagna={chart.ascendant}/>:
      <div className={styles.placeholder}>{uk?'Очікуємо розрахунок':'Awaiting chart'}</div>}
   </article>
   {selected!==1&&<article className={styles.chart}>
    <h3>{l(info)}</h3><p>{uk?info.detailUk:info.detailEn}</p>
    {passed&&positions&&lagna?
      <NorthIndianChart division={'d'+selected} lang={lang} chartLabel={info.name}
       showDegrees={isCore} planets={[...positions]} lagna={lagna}/>:
      <div className={styles.placeholder}>{uk?'Додаткова карта ще не перевірена':'Additional chart not verified'}</div>}
   </article>}
  </div>
  {passed&&selectedChart&&<div className={styles.placements}>
   <h3>{uk?'Фактичні положення D'+selected:'D'+selected+' placements'}</h3>
   <p>{uk?'Лагна':'Ascendant'}: <strong>{sign(selectedChart.lagna.sign,uk)}</strong></p>
   <div className={styles.planetGrid}>{selectedChart.planets.map(p=><div key={p.name}><span>{value(p.name,uk)}</span><strong>{sign(p.sign,uk)} · {uk?'дім ':'house '}{p.house}</strong></div>)}</div>
  </div>}
  {passed&&boundaryGuard&&<p role="status" className={styles.warning} data-testid="n4-near-boundary-warning">
   {uk?'Увага: щонайменше одна планета або Лагна D'+selected+' перебуває в межах 1 кутової секунди від межі сектора. Для цього положення потрібна додаткова перевірка точності вихідних координат і часу народження.':
    'Precision warning: a planet or the D'+selected+' ascendant lies within 1 arcsecond of a divisional boundary. Verify the source longitude and birth-time precision before relying on this placement.'}
  </p>}
  <p className={styles.method}>
   {uk?'Метод: сидерична D1 Lahiri, дробові карти за зафіксованими правилами Парашарі, D2 — Sun/Moon Hora. Зв’язок із серверною D1 перевірено внутрішньо; це не незалежний сертифікат JHora вашого народження. D60 доступна окремо як попередня карта з обов’язковим попередженням про час народження.':
    'Method: Lahiri sidereal D1; pinned Parashari divisional rules, D2 Sun/Moon Hora. Bound to the internally verified server D1 — not independent JHora certification of your birth. D60 is a separate provisional chart with birth-time accuracy warnings.'}
  </p>
 </section>;
}
