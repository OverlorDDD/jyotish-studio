import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import {PANCHANGA_CITIES,PANCHANGA_REGIONS} from '../../lib/panchanga-cities';
import styles from './PanchangaCityIndex.module.css';

/** Crawlable directory of city Panchanga pages, grouped by region. */
export default function PanchangaCityIndex({locale,current}:{locale:PortalLocale;current?:string}){
 const uk=locale==='uk';
 return <section className={styles.section} id="cities" data-testid="panchanga-city-index" aria-labelledby="panchanga-city-index-heading">
  <h2 className={styles.title} id="panchanga-city-index-heading">{uk?'Панчанга на сьогодні по містах':'Today’s Panchanga by city'}</h2>
  <p className={styles.lead}>{uk
   ?'Обери місто, щоб побачити тітхі, накшатру, схід Сонця й Раху-калу за його місцевим часом.'
   :'Choose a city to see its tithi, nakshatra, sunrise and Rahu Kalam in local time.'}</p>
  {PANCHANGA_REGIONS.map(region=><div key={region.id} className={styles.region}>
   <h3>{region.title[locale]}</h3>
   <ul>{PANCHANGA_CITIES.filter(city=>city.region===region.id).map(city=><li key={city.slug}>
    {city.slug===current?<span aria-current="page">{city.name[locale]}</span>
     :<Link href={'/'+locale+'/panchanga/'+city.slug}>{city.name[locale]}</Link>}</li>)}</ul>
  </div>)}
  <p className={styles.more}><Link href={'/'+locale+'/nakshatra'}>{uk?'Довідник 27 накшатр: значення, управителі, пади':'Guide to the 27 nakshatras: meanings, rulers, padas'}</Link></p>
 </section>;
}
