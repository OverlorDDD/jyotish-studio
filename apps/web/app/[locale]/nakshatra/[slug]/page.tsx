import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import PortalShell from '../../../components/PortalShell';
import {isPortalLocale,type PortalLocale} from '../../../../lib/brand';
import {indexRobots,publicSiteOrigin} from '../../../../lib/site-indexing';
import {NAKSHATRA_GUIDES,nakshatraByNumber,nakshatraBySlug,nakshatraClass,nakshatraGana,nakshatraPadas,
 nakshatraRuler,nakshatraSpan} from '../../../../lib/nakshatra-guides';
import {moonDate,moonMoment,moonNakshatraNow,sunriseNakshatras} from '../../../../lib/nakshatra-moon';
import styles from '../Nakshatra.module.css';

// The live Moon line must never be frozen into a build-time snapshot.
export const dynamic='force-dynamic';
type Params={params:Promise<{locale:string;slug:string}>};
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {locale,slug}=await params,guide=nakshatraBySlug(slug);
 if(!isPortalLocale(locale)||!guide)return {};
 const uk=locale==='uk',name=guide.name[locale],path='nakshatra/'+guide.slug,canonical='/'+locale+'/'+path;
 const title=uk?'Накшатра '+name+': значення, управитель, пади':name+' Nakshatra: Meaning, Ruler and Padas';
 const description=uk
  ?name+' — '+guide.number+'-та з 27 накшатр ('+nakshatraSpan(guide,locale)+'). Управитель '+nakshatraRuler(guide,locale)+', божество, символ, чотири пади та значення Місяця в цій накшатрі.'
  :name+' is nakshatra '+guide.number+' of 27 ('+nakshatraSpan(guide,locale)+'). Ruler '+nakshatraRuler(guide,locale)+', deity, symbol, four padas and the meaning of the Moon in this nakshatra.';
 return {title:title+' | Galaxiora',description,robots:indexRobots(),
  alternates:{canonical,languages:{uk:'/uk/'+path,en:'/en/'+path,'x-default':'/en/'+path}},
  openGraph:{title,description,type:'article',locale:uk?'uk_UA':'en_US',url:canonical,siteName:'Galaxiora'},
  twitter:{card:'summary_large_image',title,description}};
}
export default async function NakshatraPage({params}:Params){
 const {locale:raw,slug}=await params,guide=nakshatraBySlug(slug);
 if(!isPortalLocale(raw)||!guide)notFound();
 const locale=raw as PortalLocale,uk=locale==='uk',name=guide.name[locale],prefix='/'+locale+'/';
 const [now,upcoming]=await Promise.all([moonNakshatraNow(),sunriseNakshatras()]);
 const current=now?nakshatraByNumber(now.number):null,here=now?.number===guide.number;
 const nextDawn=here?null:upcoming.find(day=>day.number===guide.number)||null;
 const cls=nakshatraClass(guide,locale),padas=nakshatraPadas(guide,locale);
 const previous=NAKSHATRA_GUIDES[(guide.number+25)%27],following=NAKSHATRA_GUIDES[guide.number%27];
 const origin=publicSiteOrigin();
 const structured=origin?JSON.stringify({'@context':'https://schema.org','@graph':[
  {'@type':'BreadcrumbList',itemListElement:[
   {'@type':'ListItem',position:1,name:uk?'Накшатри':'Nakshatras',item:origin+prefix+'nakshatra'},
   {'@type':'ListItem',position:2,name,item:origin+prefix+'nakshatra/'+guide.slug}]},
  {'@type':'Article',headline:uk?'Накшатра '+name:name+' Nakshatra',inLanguage:locale,
   mainEntityOfPage:origin+prefix+'nakshatra/'+guide.slug,
   author:{'@type':'Organization',name:'Galaxiora'},publisher:{'@id':origin+'/#organization'}}
 ]}).replace(/</g,'\\u003c'):null;
 return <PortalShell locale={locale} active="astrology" languagePath={'nakshatra/'+guide.slug}>
  {structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:structured}}/>}
  <article className={styles.page} data-testid="nakshatra-page" data-nakshatra={guide.number}>
   <nav className={styles.crumbs} aria-label={uk?'Навігація':'Breadcrumb'}>
    <Link href={prefix+'nakshatra'}>{uk?'27 накшатр':'27 nakshatras'}</Link><span aria-hidden="true"> / </span><span>{name}</span>
   </nav>
   <h1 className={styles.title}>{uk?'Накшатра '+name:name+' Nakshatra'}</h1>
   <p className={styles.sub}>{uk?guide.number+'-та з 27 накшатр · ':'Nakshatra '+guide.number+' of 27 · '}{nakshatraSpan(guide,locale)}</p>
   {now&&current&&<p className={styles.live} data-testid="nakshatra-live">{here
    ?(uk?<>Місяць проходить накшатру <strong>{name}</strong> просто зараз: з {moonMoment(now.startUtc,locale)} до {moonMoment(now.endUtc,locale)}.</>
     :<>The Moon is passing through <strong>{name}</strong> right now: from {moonMoment(now.startUtc,locale)} until {moonMoment(now.endUtc,locale)}.</>)
    :(uk?<>Зараз Місяць у накшатрі <Link href={prefix+'nakshatra/'+current.slug}>{current.name[locale]}</Link> — до {moonMoment(now.endUtc,locale)}.{nextDawn&&<> У накшатрі {name} він зустріне світанок у Києві: {moonDate(nextDawn.date,locale)}.</>}</>
     :<>The Moon is now in <Link href={prefix+'nakshatra/'+current.slug}>{current.name[locale]}</Link> until {moonMoment(now.endUtc,locale)}.{nextDawn&&<> It will be in {name} at sunrise in Kyiv on {moonDate(nextDawn.date,locale)}.</>}</>)}</p>}
   <section aria-labelledby="nk-essence">
    <h2 id="nk-essence">{uk?'Суть накшатри':'The essence of the nakshatra'}</h2>
    <p>{guide.essence[locale]}</p>
   </section>
   <section aria-labelledby="nk-facts">
    <h2 id="nk-facts">{uk?'Ключові ознаки':'Key attributes'}</h2>
    <dl className={styles.facts}>
     <div><dt>{uk?'Сектор зодіаку':'Zodiac span'}</dt><dd>{nakshatraSpan(guide,locale)}</dd></div>
     <div><dt>{uk?'Управитель (Вімшоттарі)':'Ruler (Vimshottari)'}</dt><dd>{nakshatraRuler(guide,locale)}</dd></div>
     <div><dt>{uk?'Божество':'Deity'}</dt><dd>{guide.deity[locale]}</dd></div>
     <div><dt>{uk?'Символ':'Symbol'}</dt><dd>{guide.symbol[locale]}</dd></div>
     <div><dt>{uk?'Гана':'Gana'}</dt><dd>{nakshatraGana(guide,locale)}</dd></div>
     <div><dt>{uk?'Клас у Панчанзі':'Panchanga class'}</dt><dd>{cls.label}</dd></div>
    </dl>
    <p className={styles.note}>{uk?'У мухурті накшатри класу '+cls.label+' традиційно обирають '+cls.use+'.'
     :'In muhurta, '+cls.label+' nakshatras are traditionally chosen '+cls.use+'.'}</p>
   </section>
   <section aria-labelledby="nk-moon">
    <h2 id="nk-moon">{uk?'Місяць у накшатрі '+name:'Moon in '+name}</h2>
    <p>{guide.moon[locale]}</p>
    <p className={styles.note}>{uk
     ?'Це опис традиційної символіки, а не вирок. Накшатра Місяця — лише один шар карти: її читають разом із лагною, управителем накшатри та поточним періодом Даша.'
     :'This describes traditional symbolism, not a verdict. The Moon’s nakshatra is one layer of a chart, read together with the Lagna, the nakshatra ruler and the current Dasha period.'}</p>
   </section>
   <section aria-labelledby="nk-padas">
    <h2 id="nk-padas">{uk?'Чотири пади':'The four padas'}</h2>
    <div className={styles.scroll}><table className={styles.table}>
     <thead><tr><th scope="col">{uk?'Пада':'Pada'}</th><th scope="col">{uk?'Починається з':'Starts at'}</th><th scope="col">{uk?'Знак у навамші (D9)':'Navamsa (D9) sign'}</th></tr></thead>
     <tbody>{padas.map(row=><tr key={row.pada}><th scope="row">{row.pada}</th><td>{row.from}</td><td>{row.navamsa}</td></tr>)}</tbody>
    </table></div>
    <p className={styles.note}>{uk
     ?'Кожна пада охоплює 3°20′ і відповідає одному знаку навамші, тому різниця в кілька хвилин часу народження може змінити паду.'
     :'Each pada spans 3°20′ and maps to one navamsa sign, so a difference of a few minutes in birth time can change the pada.'}</p>
   </section>
   <p className={styles.cta}><Link href={prefix+'astrology/jyotish'}>{uk
    ?'Дізнатися свою накшатру: безкоштовна натальна карта':'Find your own nakshatra: free birth chart'}</Link></p>
   <p><Link href={prefix+'panchanga'}>{uk?'Накшатра сьогодні у твоєму місті — Панчанга':'Today’s nakshatra in your city — Panchanga'}</Link>
    {' · '}<Link href={prefix+'pedia/nakshatras'}>{uk?'Урок: що таке накшатри':'Lesson: what nakshatras are'}</Link>
    {' · '}<Link href={prefix+'pedia/vimshottari-life-cycle'}>{uk?'Урок: періоди Вімшоттарі':'Lesson: Vimshottari periods'}</Link></p>
   <nav className={styles.pager} aria-label={uk?'Сусідні накшатри':'Neighbouring nakshatras'}>
    <Link href={prefix+'nakshatra/'+previous.slug}>← {previous.name[locale]}</Link>
    <Link href={prefix+'nakshatra/'+following.slug}>{following.name[locale]} →</Link>
   </nav>
  </article>
 </PortalShell>;
}
