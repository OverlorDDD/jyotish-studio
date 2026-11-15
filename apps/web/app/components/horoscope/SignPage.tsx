/** One sign: today / tomorrow / week / month, Western or Vedic. Server-rendered. */
import Link from 'next/link';
import PortalShell from '../PortalShell';
import styles from './Horoscope.module.css';
import {Dots,elClass} from './parts';
import {MySignButton} from './MySign';
import {SystemSwitch} from './HoroscopeHome';
import {SIGNS,addDays,dayLabel,dayList,glyph,hubPath,monthLabel,shortDay,signPath,weekdayLabel,
 type HoroLocale,type HoroPeriod,type HoroSystem,type SignInfo} from '../../../lib/horoscope-signs';
import {publicIndexingEnabled,publicSiteOrigin} from '../../../lib/site-indexing';
import {MOON_SIGN_GUIDES} from '../../../lib/moon-sign-guides';
import {compatPath,pairSlug,westernScores} from '../../../lib/compatibility';
import type {DayReading,PeriodReading,Ratings} from '../../../lib/horoscope-v3';

type L={uk:string;en:string};
const CAT:{key:keyof Ratings;uk:string;en:string}[]=[{key:'mood',uk:'Настрій',en:'Mood'},{key:'love',uk:'Кохання',en:'Love'},{key:'work',uk:'Робота',en:'Work'},{key:'money',uk:'Гроші',en:'Money'},{key:'health',uk:'Здоров’я',en:'Health'}];
const PERIOD_LABEL:Record<HoroPeriod,L>={today:{uk:'Сьогодні',en:'Today'},tomorrow:{uk:'Завтра',en:'Tomorrow'},week:{uk:'Тиждень',en:'Week'},month:{uk:'Місяць',en:'Month'}};

export function pageTitle(locale:HoroLocale,system:HoroSystem,s:SignInfo,period:HoroPeriod,today:string){
 const uk=locale==='uk',name=uk?s.uk:s.en,ved=system==='vedic';
 const when:Record<HoroPeriod,string>=uk?{today:'на сьогодні, '+dayLabel(today,'uk'),tomorrow:'на завтра, '+dayLabel(addDays(today,1),'uk'),
  week:'на тиждень, '+shortDay(today,'uk')+' – '+shortDay(addDays(today,6),'uk'),month:'на '+monthLabel(today,'uk')}:
  {today:'for today, '+dayLabel(today,'en'),tomorrow:'for tomorrow, '+dayLabel(addDays(today,1),'en'),
  week:'for the week, '+shortDay(today,'en')+' – '+shortDay(addDays(today,6),'en'),month:'for '+monthLabel(today,'en')};
 return uk?name+' — '+(ved?'ведичний гороскоп ':'гороскоп ')+when[period]:name+' '+(ved?'Vedic horoscope ':'horoscope ')+when[period];
}

function DayView({d,locale,system}:{d:DayReading;locale:HoroLocale;system:HoroSystem}){
 const uk=locale==='uk';
 return <>
  <section className={styles.lead} aria-labelledby="horo-headline">
   <span className={styles.kicker}>{d.theme[locale]}</span>
   <h2 id="horo-headline">{d.headline[locale]}</h2>
   <p>{d.intro[locale]}</p>
   <p className={styles.note}>{d.phaseNote[locale]}</p>
   {d.chandrashtama&&system==='vedic'&&<p className={styles.chandra}>{uk?'Сьогодні Чандраштама — Місяць у восьмому домі від вашого знака. Традиція радить відкласти важливі починання й берегти сили.':'Today is Chandrashtama — the Moon is in the eighth house from your sign. Tradition advises postponing important beginnings and saving energy.'}</p>}
  </section>
  <section className={styles.meters} aria-labelledby="horo-meters">
   <h2 id="horo-meters">{uk?'Енергія дня':'The day’s energy'}</h2>
   {CAT.map(c=><div key={c.key} className={styles.meter}><span>{c[locale]}</span>
    <span className={styles.bar} aria-hidden="true"><span style={{width:(d.ratings[c.key]*20)+'%'}}/></span><b>{d.ratings[c.key]}/5</b></div>)}
  </section>
  <div className={styles.spheres}>
   {(['love','work','money','health'] as const).map(k=><section key={k} className={styles.sphere}>
    <h3>{CAT.find(c=>c.key===k)![locale]}<Dots n={d.ratings[k]} label={CAT.find(c=>c.key===k)![locale]}/></h3>
    <p>{d.sections[k][locale]}</p></section>)}
  </div>
  <div className={styles.todo}>
   <section><h3>{uk?'Сприятливо':'Good for'}</h3><ul>{d.good.map((g,i)=><li key={i}>{g[locale]}</li>)}</ul></section>
   <section><h3>{uk?'Краще відкласти':'Better to avoid'}</h3><ul>{d.avoid.map((g,i)=><li key={i}>{g[locale]}</li>)}</ul></section>
  </div>
  <details className={styles.why}>
   <summary>{uk?'Чому так? Розрахунок прогнозу':'Why? How this forecast is calculated'}</summary>
   <ul>{d.why.map((w,i)=><li key={i}>{w[locale]}</li>)}</ul>
   <p>{d.method[locale]+(uk?' Оцінки — за класичною таблицею сприятливих транзитів (Пхаладіпіка, гл. 26).':' Ratings follow the classical table of favourable transits (Phaladeepika, ch. 26).')}</p>
  </details>
 </>;
}

function WeekView({p,locale,system,today}:{p:PeriodReading;locale:HoroLocale;system:HoroSystem;today:string}){
 const uk=locale==='uk';
 const list=(dates:string[])=>dates.length?dates.map(d=>weekdayLabel(d,locale)+', '+shortDay(d,locale)).join('; '):(uk?'немає':'none');
 return <>
  <section className={styles.overview}><p>{p.overview[locale]}</p></section>
  <div className={styles.days}>{p.list.map(d=><article key={d.date} className={styles.day}>
   <time dateTime={d.date}><b>{d.date===today?(uk?'Сьогодні':'Today'):weekdayLabel(d.date,locale,'long')}</b>{shortDay(d.date,locale)}</time>
   <h3>{d.headline[locale]}<small>{d.theme[locale]}{d.events.length?' · '+d.events.map(e=>e[locale]).join(' · '):''}</small></h3>
   <span>{d.chandrashtama&&system==='vedic'?<span className={styles.careful}>{uk?'Чандраштама':'Chandrashtama'}</span>:<Dots n={d.ratings.mood} label={uk?'Настрій':'Mood'}/>}</span>
  </article>)}</div>
  <div className={styles.best}>
   <section><h3>{uk?'Для кохання':'For love'}</h3><p>{list(p.bestFor.love)}</p></section>
   <section><h3>{uk?'Для роботи':'For work'}</h3><p>{list(p.bestFor.work)}</p></section>
   <section><h3>{uk?'Для грошей':'For money'}</h3><p>{list(p.bestFor.money)}</p></section>
   <section><h3>{uk?'Обережні дні':'Careful days'}</h3><p>{list(p.careful)}</p></section>
  </div>
 </>;
}

function MonthView({p,locale,system,today}:{p:PeriodReading;locale:HoroLocale;system:HoroSystem;today:string}){
 const uk=locale==='uk';
 const first=new Date(p.start+'T12:00:00Z').getUTCDay(),lead=(first+6)%7;
 const heads=Array.from({length:7},(_,i)=>weekdayLabel(addDays('2026-11-16',i),locale));
 const mark=(date:string)=>[p.bestFor.love.includes(date)?'♥':'',p.bestFor.money.includes(date)?'₴':'',p.bestFor.work.includes(date)?'★':''].join('');
 const list=(dates:string[])=>dates.length?dayList(dates,locale):(uk?'немає':'none');
 return <>
  <section className={styles.overview}><p>{p.overview[locale]}</p></section>
  <div className={styles.cal} role="grid" aria-label={uk?'Календар енергії дня':'Daily energy calendar'}>
   {heads.map(h=><div key={h} className={styles.calHead} role="columnheader">{h}</div>)}
   {Array.from({length:lead},(_,i)=><div key={'e'+i} className={styles.cell+' '+styles.cellEmpty}/>)}
   {p.list.map(d=><div key={d.date} role="gridcell" className={styles.cell} data-r={d.ratings.mood} data-c={d.chandrashtama&&system==='vedic'?'1':'0'} data-today={d.date===today?'1':'0'}
    title={d.headline[locale]}>
    <b>{Number(d.date.slice(8))}</b><span className={styles.marks}>{mark(d.date)}</span>
   </div>)}
  </div>
  <p className={styles.legend}>
   <span><i style={{background:'rgba(143,211,184,.45)'}}/>{uk?'сприятливий день':'favourable day'}</span>
   <span><i style={{background:'rgba(240,160,143,.45)'}}/>{uk?'складніший день':'harder day'}</span>
   {system==='vedic'&&<span><i style={{background:'repeating-linear-gradient(135deg,rgba(240,160,143,.6) 0 3px,transparent 3px 6px)'}}/>{uk?'Чандраштама':'Chandrashtama'}</span>}
   <span>♥ {uk?'кохання':'love'} · ₴ {uk?'гроші':'money'} · ★ {uk?'робота':'work'}</span>
  </p>
  <div className={styles.best}>
   <section><h3>{uk?'Найкращі дні для кохання':'Best days for love'}</h3><p>{list(p.bestFor.love)}</p></section>
   <section><h3>{uk?'Для роботи':'For work'}</h3><p>{list(p.bestFor.work)}</p></section>
   <section><h3>{uk?'Для грошей':'For money'}</h3><p>{list(p.bestFor.money)}</p></section>
   <section><h3>{uk?'Обережні дні':'Careful days'}</h3><p>{list(p.careful)}</p></section>
  </div>
 </>;
}

export default function SignPage({locale,system,sign,period,today,day,range}:{locale:HoroLocale;system:HoroSystem;sign:SignInfo;period:HoroPeriod;today:string;day:DayReading|null;range:PeriodReading|null}){
 const uk=locale==='uk',name=uk?sign.uk:sign.en;
 const guide=MOON_SIGN_GUIDES.find(g=>g.slug===sign.slug);
 const other:HoroSystem=system==='western'?'vedic':'western';
 const title=pageTitle(locale,system,sign,period,today);
 const crumbs=[{href:hubPath(locale,system),label:uk?(system==='vedic'?'Ведичні гороскопи':'Гороскопи'):(system==='vedic'?'Vedic horoscopes':'Horoscopes')},{href:signPath(locale,system,sign.slug),label:name}];
 const base=publicSiteOrigin();
 const jsonLd=publicIndexingEnabled()&&base?JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Galaxiora',item:base+'/'+locale},...crumbs.map((c,i)=>({'@type':'ListItem',position:i+2,name:c.label,item:base+c.href}))]}).replace(/</g,'\\u003c'):null;
 const languagePath=signPath(locale,system,sign.slug,period).slice(locale.length+2);
 return <PortalShell locale={locale} active="horoscope" languagePath={languagePath}>
  {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>}
  <div className={styles.wrap+' '+elClass(sign)}>
   <nav className={styles.crumbs} aria-label={uk?'Хлібні крихти':'Breadcrumbs'}><Link href={crumbs[0].href}>{crumbs[0].label}</Link> / {name}</nav>
   <header className={styles.signHead}>
    <span className={styles.medal+' '+styles.medalBig} aria-hidden="true">{glyph(sign)}</span>
    <div style={{flex:'1 1 420px',minWidth:0}}>
     <h1>{title}</h1>
     <div className={styles.chips}>
      <span className={styles.chip}>{system==='western'?sign.western[locale]:(uk?'Джанма-раші: Місяць у знаку '+sign.gen:'Janma Rashi: Moon in '+sign.en)}</span>
      <span className={styles.chip}>{uk?'Стихія: ':'Element: '}{sign.element[locale]}</span>
      <span className={styles.chip}>{uk?'Управитель: ':'Ruler: '}{sign.ruler[locale]}</span>
      {system==='vedic'&&<span className={styles.chip}>{sign.sanskrit}</span>}
     </div>
    </div>
    <SystemSwitch locale={locale} system={system} hrefs={{western:signPath(locale,'western',sign.slug,period),vedic:signPath(locale,'vedic',sign.slug,period)}}/>
   </header>
   <nav className={styles.tabs} aria-label={uk?'Період прогнозу':'Forecast period'}>
    {(['today','tomorrow','week','month'] as HoroPeriod[]).map(p=><Link key={p} className={styles.tab} href={signPath(locale,system,sign.slug,p)} aria-current={p===period?'page':undefined}>{PERIOD_LABEL[p][locale]}</Link>)}
   </nav>
   <div className={styles.cols}>
    <div className={styles.main}>
     {(period==='today'||period==='tomorrow')&&(day?<DayView d={day} locale={locale} system={system}/>:<p className={styles.error}>{uk?'Розрахунок тимчасово недоступний. Спробуйте оновити сторінку.':'The calculation is temporarily unavailable. Please refresh.'}</p>)}
     {period==='week'&&(range?<WeekView p={range} locale={locale} system={system} today={today}/>:<p className={styles.error}>{uk?'Розрахунок тимчасово недоступний.':'Temporarily unavailable.'}</p>)}
     {period==='month'&&(range?<MonthView p={range} locale={locale} system={system} today={today}/>:<p className={styles.error}>{uk?'Розрахунок тимчасово недоступний.':'Temporarily unavailable.'}</p>)}
     <section className={styles.panel} style={{marginTop:8}}>
      <h2>{uk?'Характер знака':'The sign’s nature'}</h2>
      <p>{uk?name+' — знак, якому традиція приписує '+sign.traits.uk+'. Управитель — '+sign.ruler.uk+', стихія — '+sign.element.uk+'.':name+' is traditionally linked with '+sign.traits.en+'. Ruler: '+sign.ruler.en+'; element: '+sign.element.en+'.'}</p>
      {system==='vedic'&&guide&&<p>{uk?'Коли Місяць при народженні стоїть у знаку '+sign.gen+', на перший план виходять '+guide.themesUk+'. Знак '+guide.modalityUk+', управитель — '+guide.lordUk+'.':'With the Moon in '+sign.en+' at birth, the focus falls on '+guide.themesEn+'. A '+guide.modalityEn+' sign ruled by '+guide.lordEn+'.'}</p>}
      <p className={styles.more}>
       <Link className={styles.link} href={'/'+locale+'/astrology/moon-sign-vs-sun-sign'}>{uk?'Знак Місяця чи знак Сонця: у чому різниця':'Moon sign vs Sun sign: the difference'}</Link>
       <Link className={styles.link} href={'/'+locale+'/panchanga'}>{uk?'Панчанга на сьогодні':'Today’s Panchanga'}</Link>
       <Link className={styles.link} href={'/'+locale+'/astrology/jyotish'}>{uk?'Що таке Джйотіш':'What is Jyotish'}</Link>
      </p>
     </section>
    </div>
    <aside className={styles.side} aria-label={uk?'Додатково':'More'}>
     <section className={styles.panel}>
      <h2>{uk?'Ваш знак?':'Your sign?'}</h2>
      <p>{uk?'Запам’ятаємо, щоб наступного разу ваш гороскоп відкривався одразу.':'We will remember it so your horoscope opens first next time.'}</p>
      <MySignButton system={system} slug={sign.slug} locale={locale}/>
     </section>
     {day&&(period==='today'||period==='tomorrow')&&<section className={styles.panel}>
      <h2>{uk?'Колір дня':'Colour of the day'}</h2>
      <p><span className={styles.swatch} style={{background:day.color.hex}}/>{day.color.color[locale]}</p>
      <p>{uk?'За ведичною традицією це день '+day.color.planet.uk+'.':'In Vedic tradition this is the day of '+day.color.planet.en+'.'}</p>
      {day.events.length>0&&<p><b>{uk?'На небі: ':'In the sky: '}</b>{day.events.map(e=>e[locale]).join(' · ')}</p>}
     </section>}
     <section className={styles.panel}>
      <h2>{system==='western'?(uk?'А у ведичній системі?':'And in Vedic astrology?'):(uk?'А в західній системі?':'And in Western astrology?')}</h2>
      <p>{uk?'У Джйотиш знак рахують за зірками, і він часто інший. Дізнайтеся обидва свої знаки за датою народження.':'Jyotish measures signs by the stars, so yours may differ. Find both of your signs from your birth date.'}</p>
      <Link className={styles.link} href={'/'+locale+'/horoscope/my-sign'}>{uk?'Зоряний паспорт →':'Star Passport →'}</Link><br/>
      <Link className={styles.link} href={signPath(locale,other,sign.slug,period)}>{other==='vedic'?(uk?'Ведичний гороскоп '+sign.gen:'Vedic '+sign.en+' horoscope'):(uk?'Західний гороскоп '+sign.gen:'Western '+sign.en+' horoscope')}</Link>
     </section>
     <section className={styles.panel}>
      <h2>{uk?'Сумісність '+sign.gen:sign.en+' compatibility'}</h2>
      <p>{uk?'Найкращі пари за західною астрологією:':'Best Western matches:'}</p>
      <ul className={styles.pairList}>
       {SIGNS.filter(o=>o.n!==sign.n).map(o=>({o,pct:westernScores(sign,o).overall})).sort((x,y)=>y.pct-x.pct||x.o.n-y.o.n).slice(0,3).map(({o,pct})=>
        <li key={o.slug}><Link href={compatPath(locale,pairSlug(sign,o))}><span className={elClass(o)} aria-hidden="true">{glyph(o)}</span>{uk?o.uk:o.en}<b>{pct}%</b></Link></li>)}
      </ul>
      <Link className={styles.link} href={compatPath(locale)}>{uk?'Сумісність з усіма знаками і 36 гун →':'All signs and the 36 gunas →'}</Link>
     </section>
     <section className={styles.panel}>
      <h2>{uk?'Інші знаки':'Other signs'}</h2>
      <nav className={styles.signLinks} aria-label={uk?'Інші знаки':'Other signs'}>{SIGNS.map(s=><Link key={s.slug} href={signPath(locale,system,s.slug,period)} className={elClass(s)} aria-current={s.slug===sign.slug?'page':undefined}><span aria-hidden="true">{glyph(s)}</span>{uk?s.uk:s.en}</Link>)}</nav>
     </section>
    </aside>
   </div>
  </div>
 </PortalShell>;
}
