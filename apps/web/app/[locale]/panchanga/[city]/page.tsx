import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../components/PortalShell';
import PanchangaCityIndex from '../../../components/PanchangaCityIndex';
import {isPortalLocale,type PortalLocale} from '../../../../lib/brand';
import {indexRobots,publicSiteOrigin} from '../../../../lib/site-indexing';
import {panchangaCityBySlug,type PanchangaCity} from '../../../../lib/panchanga-cities';
import {cityChanges,cityCivilDate,cityClock,cityDayMatches,cityLongDate,cityMoment,citySunriseRows,
 nakshatraLabel,nextCivilDate,tithiLabel,varaLabel,type CityDay} from '../../../../lib/panchanga-city-day';
import styles from './PanchangaCity.module.css';

type Params={params:Promise<{locale:string;city:string}>};

/** A given city and civil date is deterministic, so a verified API answer is reused:
 * in this process for the rest of the day and through the Next data cache.
 * "Today" itself is resolved per request in the city's own time zone. Failures are never cached. */
const memo=new Map<string,CityDay>();
async function loadDay(city:PanchangaCity,date:string):Promise<CityDay|null>{
 const key=city.slug+'|'+date,known=memo.get(key);
 if(known)return known;
 const origin=process.env.INTERNAL_API_ORIGIN||'http://127.0.0.1:4000';
 const query=new URLSearchParams({date,zone:city.timeZone,latitude:String(city.latitude),longitude:String(city.longitude)});
 try{
  const response=await fetch(origin+'/api/v1/panchanga/day?'+query,{next:{revalidate:86400},signal:AbortSignal.timeout(20000)});
  if(!response.ok)return null;
  const day:unknown=await response.json();
  if(!cityDayMatches(day,date,city))return null;
  if(memo.size>=800)memo.delete(memo.keys().next().value!);
  memo.set(key,day);
  return day;
 }catch{return null;}
}
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {locale,city:slug}=await params;
 const city=panchangaCityBySlug(slug);
 if(!isPortalLocale(locale)||!city)return {};
 const uk=locale==='uk',name=city.name[locale],path='panchanga/'+city.slug,canonical='/'+locale+'/'+path;
 const title=uk?'Панчанга сьогодні — '+name+': тітхі, накшатра, Раху-кала':'Panchang Today in '+name+' — Tithi, Nakshatra, Rahu Kalam';
 const description=uk
  ?'Панчанга на сьогодні для міста '+name+': тітхі, накшатра, йога, карана, схід і захід Сонця, Раху-кала за місцевим часом. Розрахунок Swiss Ephemeris, аянамша Лахірі.'
  :'Today’s Panchanga for '+name+': tithi, nakshatra, yoga, karana, sunrise, sunset and Rahu Kalam in local time. Swiss Ephemeris with Lahiri ayanamsha.';
 return {title:title+' | Galaxiora',description,robots:indexRobots(),
  alternates:{canonical,languages:{uk:'/uk/'+path,en:'/en/'+path,'x-default':'/en/'+path}},
  openGraph:{title,description,type:'website',locale:uk?'uk_UA':'en_US',url:canonical,siteName:'Galaxiora'},
  twitter:{card:'summary_large_image',title,description}};
}
export default async function PanchangaCityPage({params}:Params){
 const {locale:raw,city:slug}=await params;
 const city=panchangaCityBySlug(slug);
 if(!isPortalLocale(raw)||!city)notFound();
 const locale=raw as PortalLocale,uk=locale==='uk',name=city.name[locale],zone=city.timeZone;
 const today=cityCivilDate(new Date(),zone),tomorrow=nextCivilDate(today);
 const [day,next]=await Promise.all([loadDay(city,today),loadDay(city,tomorrow)]);
 const prefix='/'+locale+'/',origin=publicSiteOrigin();
 const tool=prefix+'panchanga?city='+city.slug;
 const breadcrumbs=origin?JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
  {'@type':'ListItem',position:1,name:uk?'Панчанга':'Panchanga',item:origin+prefix+'panchanga'},
  {'@type':'ListItem',position:2,name,item:origin+prefix+'panchanga/'+city.slug}
 ]}).replace(/</g,'\\u003c'):null;
 const rows=day?citySunriseRows(day,locale):[],changes=day?cityChanges(day,locale):[];
 const kalas=day?.daytimeKalas;
 return <PortalShell locale={locale} active="panchanga" languagePath={'panchanga/'+city.slug}>
  {breadcrumbs&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:breadcrumbs}}/>}
  <article className={styles.page} data-testid="panchanga-city-page" data-city={city.slug} data-date={today}>
   <nav className={styles.crumbs} aria-label={uk?'Навігація':'Breadcrumb'}>
    <Link href={prefix+'panchanga'}>{uk?'Панчанга':'Panchanga'}</Link><span aria-hidden="true"> / </span><span>{name}</span>
   </nav>
   <h1 className={styles.title}>{uk?'Панчанга на сьогодні: '+name:'Panchang today in '+name}</h1>
   <p className={styles.date}><time dateTime={today}>{cityLongDate(today,locale)}</time>
    <span> · {uk?'місцевий час, пояс ':'local time, zone '}{zone}</span></p>
   {day?<>
    <p className={styles.lead} data-testid="panchanga-city-summary">{uk
     ?'На схід Сонця о '+cityClock(day.sunriseUtc,zone,locale)+' у місті '+name+' триває тітхі '+tithiLabel(day.sunrise.tithi,locale)+', а Місяць проходить накшатру '+nakshatraLabel(day.sunrise.nakshatra,locale)+'. '+varaLabel(day.sunrise.vara,locale)+'. Ведичний день триває від цього сходу до наступного, тож усі п’ять складників нижче прив’язані саме до місцевого світанку.'
     :'At sunrise ('+cityClock(day.sunriseUtc,zone,locale)+') in '+name+' the tithi is '+tithiLabel(day.sunrise.tithi,locale)+' and the Moon is passing through '+nakshatraLabel(day.sunrise.nakshatra,locale)+'. '+varaLabel(day.sunrise.vara,locale)+'. A Vedic day runs from this sunrise to the next, so all five limbs below are anchored to the local dawn.'}</p>
    <section aria-labelledby="pc-five">
     <h2 id="pc-five">{uk?'П’ять складників дня':'The five limbs of the day'}</h2>
     <table className={styles.table}>
      <thead><tr><th scope="col">{uk?'Складник':'Limb'}</th><th scope="col">{uk?'На схід Сонця':'At sunrise'}</th><th scope="col">{uk?'Триває до':'Lasts until'}</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.kind} data-anga={row.kind}>
       <th scope="row">{row.name}</th><td>{row.value}</td>
       <td>{row.until||(uk?'до наступного сходу':'until the next sunrise')}</td></tr>)}</tbody>
     </table>
    </section>
    {changes.length>0&&<section aria-labelledby="pc-changes">
     <h2 id="pc-changes">{uk?'Що зміниться протягом дня':'What changes during the day'}</h2>
     <ul className={styles.changes}>{changes.map((item,index)=><li key={index}>
      <strong>{item.at}</strong> — {uk?'починається ':'begins '}{item.name.toLowerCase()} <span>{item.value}</span></li>)}</ul>
    </section>}
    <section aria-labelledby="pc-sun">
     <h2 id="pc-sun">{uk?'Сонце й періоди дня':'Sun and daytime periods'}</h2>
     <dl className={styles.facts}>
      <div><dt>{uk?'Схід Сонця':'Sunrise'}</dt><dd>{cityClock(day.sunriseUtc,zone,locale)}</dd></div>
      <div><dt>{uk?'Захід Сонця':'Sunset'}</dt><dd>{cityClock(day.sunsetUtc,zone,locale)}</dd></div>
      <div><dt>{uk?'Наступний схід':'Next sunrise'}</dt><dd>{cityMoment(day.nextSunriseUtc,day,locale)}</dd></div>
      {kalas&&<>
       <div><dt>{uk?'Раху-кала':'Rahu Kalam'}</dt><dd>{cityClock(kalas.rahuKalam.fromUtc,zone,locale)}–{cityClock(kalas.rahuKalam.untilUtc,zone,locale)}</dd></div>
       <div><dt>{uk?'Ямаганда':'Yamaganda'}</dt><dd>{cityClock(kalas.yamaganda.fromUtc,zone,locale)}–{cityClock(kalas.yamaganda.untilUtc,zone,locale)}</dd></div>
       <div><dt>{uk?'Гуліка-кала':'Gulika Kalam'}</dt><dd>{cityClock(kalas.gulikaKalam.fromUtc,zone,locale)}–{cityClock(kalas.gulikaKalam.untilUtc,zone,locale)}</dd></div>
      </>}
     </dl>
     <p className={styles.note}>{uk
      ?'Раху-калу, Ямаганду й Гуліка-калу традиційно оминають для важливих починань. Це восьмі частини світлового дня, тому їхній час щодня і в кожному місті інший.'
      :'Rahu Kalam, Yamaganda and Gulika Kalam are traditionally avoided for important beginnings. Each is one eighth of the daylight span, so the clock times differ by day and by city.'}</p>
    </section>
    {next&&<section aria-labelledby="pc-next">
     <h2 id="pc-next">{uk?'Завтра, ':'Tomorrow, '}<time dateTime={tomorrow}>{cityLongDate(tomorrow,locale)}</time></h2>
     <p>{uk
      ?'Схід Сонця о '+cityClock(next.sunriseUtc,zone,locale)+'. На світанку: тітхі '+tithiLabel(next.sunrise.tithi,locale)+', накшатра '+nakshatraLabel(next.sunrise.nakshatra,locale,false)+'. '+varaLabel(next.sunrise.vara,locale)+'.'
      :'Sunrise at '+cityClock(next.sunriseUtc,zone,locale)+'. At dawn: tithi '+tithiLabel(next.sunrise.tithi,locale)+', nakshatra '+nakshatraLabel(next.sunrise.nakshatra,locale,false)+'. '+varaLabel(next.sunrise.vara,locale)+'.'}</p>
    </section>}
   </>:<p className={styles.lead} role="status" data-testid="panchanga-city-unavailable">{uk
    ?'Розрахунок на сьогодні тимчасово недоступний. Відкрий інтерактивний календар нижче — він порахує день для цього міста.'
    :'Today’s calculation is temporarily unavailable. Open the interactive calendar below to compute the day for this city.'}</p>}
   <p className={styles.cta}><Link href={tool} data-testid="panchanga-city-tool">{uk
    ?'Відкрити повний календар для міста '+name+': інші дати, тиждень, місяць і сприятливі вікна'
    :'Open the full calendar for '+name+': other dates, week, month and favourable windows'}</Link></p>
   <section aria-labelledby="pc-how">
    <h2 id="pc-how">{uk?'Як ми рахуємо Панчангу для міста '+name:'How we calculate the Panchanga for '+name}</h2>
    <p>{uk
     ?'Положення Сонця й Місяця беремо зі Swiss Ephemeris у сидеричному зодіаку з аянамшею Лахірі. Схід і захід обчислюємо для координат '+city.latitude.toFixed(4)+'°, '+city.longitude.toFixed(4)+'° і показуємо в поясі '+zone+' з урахуванням літнього часу. Момент зміни тітхі чи накшатри єдиний для всієї Землі, але на годиннику кожного міста він інший — тому Панчанга завжди складається для конкретного місця.'
     :'Sun and Moon positions come from Swiss Ephemeris in the sidereal zodiac with Lahiri ayanamsha. Sunrise and sunset are computed for '+city.latitude.toFixed(4)+'°, '+city.longitude.toFixed(4)+'° and shown in the '+zone+' zone, daylight saving included. A tithi or nakshatra changes at one instant for the whole Earth, yet every city reads a different clock time — which is why a Panchanga is always drawn up for a specific place.'}</p>
    <ul className={styles.links}>
     <li><Link href={prefix+'pedia/what-is-tithi-lunar-day'}>{uk?'Що таке тітхі — місячний день':'What a tithi, the lunar day, is'}</Link></li>
     <li><Link href={prefix+'pedia/nakshatra-today-location-guide'}>{uk?'Накшатра сьогодні: чому важливе місце':'Nakshatra today: why location matters'}</Link></li>
     <li><Link href={prefix+'pedia/rahu-kalam-calculation'}>{uk?'Як розраховується Раху-кала':'How Rahu Kalam is calculated'}</Link></li>
     <li><Link href={prefix+'pedia/panchanga-sunrise-day-rule'}>{uk?'Чому ведичний день починається зі сходу Сонця':'Why the Vedic day starts at sunrise'}</Link></li>
     <li><Link href={prefix+'methodology'}>{uk?'Методи розрахунків Galaxiora':'Galaxiora calculation methods'}</Link></li>
    </ul>
   </section>
  </article>
  <PanchangaCityIndex locale={locale} current={city.slug}/>
 </PortalShell>;
}
