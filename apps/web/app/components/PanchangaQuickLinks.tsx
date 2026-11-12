import Link from 'next/link';
import type {PortalLocale} from '../../lib/brand';
import {panchangaCityBySlug} from '../../lib/panchanga-cities';
import styles from './PanchangaQuickLinks.module.css';

const FEATURED:Record<PortalLocale,readonly string[]>={
 uk:['kyiv','lviv','odesa','kharkiv','dnipro','delhi','london','new-york'],
 en:['delhi','mumbai','bengaluru','london','new-york','toronto','sydney','kyiv']
};
/** One slim row above the calendar so city pages and the nakshatra guide are one tap away. */
export default function PanchangaQuickLinks({locale}:{locale:PortalLocale}){
 const uk=locale==='uk',prefix='/'+locale+'/';
 return <nav className={styles.strip} data-testid="panchanga-quick-links" aria-label={uk?'Панчанга по містах і довідник накшатр':'Panchanga by city and nakshatra guide'}>
  <span className={styles.label}>{uk?'Сьогодні в містах:':'Today in:'}</span>
  {FEATURED[locale].map(slug=>{
   const city=panchangaCityBySlug(slug);
   return city?<Link key={slug} href={prefix+'panchanga/'+slug}>{city.name[locale]}</Link>:null;
  })}
  <Link className={styles.more} href="#cities">{uk?'Усі міста ↓':'All cities ↓'}</Link>
  <Link className={styles.more} href={prefix+'nakshatra'}>{uk?'27 накшатр →':'27 nakshatras →'}</Link>
 </nav>;
}
