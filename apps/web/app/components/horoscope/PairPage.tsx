/** One of the 78 sign-pair compatibility pages (server component). */
import Link from 'next/link';
import PortalShell from '../PortalShell';
import styles from './Horoscope.module.css';
import {elClass} from './parts';
import {SIGNS,glyph,signPath,type HoroLocale,type SignInfo} from '../../../lib/horoscope-signs';
import {bandLabel,compatPath,pairContent,pairSlug,westernScores,type Pair} from '../../../lib/compatibility';
import {BHAKOOT_NOTE,LOVE_STYLE} from '../../../lib/compatibility-texts';
import {publicIndexingEnabled,publicSiteOrigin} from '../../../lib/site-indexing';
import ShareTools from '../ShareTools';

const PLANET_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
export function pairTitle(p:Pair,locale:HoroLocale){
 return locale==='uk'?(p.a.n===p.b.n?'Сумісність двох '+plural(p.a):'Сумісність '+p.a.gen+' і '+p.b.gen):(p.a.n===p.b.n?p.a.en+' and '+p.b.en+' compatibility':p.a.en+' and '+p.b.en+' compatibility');
}
/** «двох Овнів» — genitive plural for same-sign pairs. */
function plural(s:SignInfo){
 const map:Record<string,string>={aries:'Овнів',taurus:'Тельців',gemini:'Близнюків',cancer:'Раків',leo:'Левів',virgo:'Дів',libra:'Терезів',scorpio:'Скорпіонів',sagittarius:'Стрільців',capricorn:'Козорогів',aquarius:'Водоліїв',pisces:'Риб'};
 return map[s.slug];
}

function Ring({pct,label}:{pct:number;label:string}){
 return <div className={styles.ring} style={{'--pct':pct} as React.CSSProperties} role="img" aria-label={label}>
  <span><b>{pct}</b>%</span>
 </div>;
}

export default function PairPage({locale,pair}:{locale:HoroLocale;pair:Pair}){
 const uk=locale==='uk',{a,b}=pair,c=pairContent(pair);
 const name=(s:SignInfo)=>uk?s.uk:s.en;
 const title=pairTitle(pair,locale);
 const w=c.western,v=c.vedic;
 const cats:[string,number][]=[[uk?'Кохання':'Love',w.love],[uk?'Пристрасть':'Passion',w.passion],[uk?'Дружба':'Friendship',w.friendship],[uk?'Довіра':'Trust',w.trust],[uk?'Спільні справи':'Working together',w.work]];
 const KOOTA=[['varna',uk?'Варна — ставлення до обов’язку':'Varna — sense of duty',1],['vashya',uk?'Вашья — взаємне притягання':'Vashya — mutual pull',2],
  ['grahaMaitri',uk?'Граха-майтрі — дружба управителів':'Graha Maitri — friendship of the lords',5],['bhakoot',uk?'Бхакут — сім’я й добробут':'Bhakoot — family and wellbeing',7]] as const;
 const lords=v.lords.map(x=>uk?PLANET_UK[x]:x);
 const base=publicSiteOrigin();
 const jsonLd=publicIndexingEnabled()&&base?JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
  {'@type':'ListItem',position:1,name:uk?'Гороскопи':'Horoscopes',item:base+'/'+locale+'/horoscope'},
  {'@type':'ListItem',position:2,name:uk?'Сумісність':'Compatibility',item:base+compatPath(locale)},
  {'@type':'ListItem',position:3,name:title,item:base+compatPath(locale,pair.slug)}]}).replace(/</g,'\\u003c'):null;
 const others=(s:SignInfo)=>SIGNS.map(o=>({o,slug:pairSlug(s,o),pct:westernScores(s,o).overall}));
 return <PortalShell locale={locale} active="horoscope" languagePath={'horoscope/compatibility/'+pair.slug}>
  {jsonLd&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>}
  <div className={styles.wrap}>
   <nav className={styles.crumbs} aria-label={uk?'Хлібні крихти':'Breadcrumbs'}>
    <Link href={'/'+locale+'/horoscope'}>{uk?'Гороскопи':'Horoscopes'}</Link> / <Link href={compatPath(locale)}>{uk?'Сумісність':'Compatibility'}</Link> / {name(a)}{a.n===b.n?'':' + '+name(b)}
   </nav>
   <header className={styles.pairHead}>
    <div className={styles.pairMedals} aria-hidden="true">
     <span className={styles.medal+' '+styles.medalBig+' '+elClass(a)}>{glyph(a)}</span>
     <span className={styles.plus}>+</span>
     <span className={styles.medal+' '+styles.medalBig+' '+elClass(b)}>{glyph(b)}</span>
    </div>
    <div style={{flex:'1 1 420px',minWidth:0}}>
     <h1>{title}</h1>
     <p className={styles.tagline}>{c.tagline[locale]}</p>
     <div className={styles.chips}>
      <span className={styles.chip}>{c.element.title[locale]}</span>
      <span className={styles.chip}>{uk?'Аспект: ':'Aspect: '}{c.aspect.name[locale]}</span>
      <span className={styles.chip}>{uk?'Управителі: ':'Rulers: '}{a.ruler[locale]}{a.ruler.en===b.ruler.en?'':' + '+b.ruler[locale]}</span>
     </div>
    </div>
   </header>

   <div className={styles.cols}>
    <div className={styles.main}>
     <section className={styles.scoreCard} aria-labelledby="pair-score">
      <Ring pct={w.overall} label={(uk?'Загальна сумісність ':'Overall compatibility ')+w.overall+'%'}/>
      <div className={styles.scoreBody}>
       <h2 id="pair-score">{bandLabel(w.overall,locale)}</h2>
       <p>{c.aspect.summary[locale]}</p>
      </div>
     </section>

     <section className={styles.meters} aria-label={uk?'Сумісність за сферами':'Compatibility by area'}>
      {cats.map(([label,pct])=><div key={label} className={styles.meter}>
       <span>{label}</span><span className={styles.bar}><span style={{width:pct+'%'}}/></span><b>{pct}%</b>
      </div>)}
     </section>

     <section className={styles.lead+' '+elClass(a)}>
      <span className={styles.kicker}>{c.element.title[locale]}</span>
      <h2>{uk?'Як поєднуються ці знаки':'How these signs combine'}</h2>
      <p>{c.element.text[locale]}</p>
     </section>

     <div className={styles.spheres}>
      {(a.n===b.n?[a]:[a,b]).map(s=><article key={s.slug} className={styles.sphere}>
       <h3>{uk?'Як кохає '+s.uk:'How '+s.en+' loves'}</h3>
       <p>{LOVE_STYLE[s.n-1][locale]}</p>
      </article>)}
     </div>

     <div className={styles.todo}>
      <section><h3>{uk?'Що зближує':'What brings you together'}</h3><ul>{c.aspect.strengths.map(x=><li key={x.en}>{x[locale]}</li>)}</ul></section>
      <section><h3>{uk?'Де можливе тертя':'Where friction can arise'}</h3><ul>{c.aspect.challenges.map(x=><li key={x.en}>{x[locale]}</li>)}</ul></section>
     </div>
     <section className={styles.panel} style={{marginBottom:22}}>
      <h2>{uk?'Порада парі':'Advice for the couple'}</h2>
      <p>{c.aspect.advice[locale]}</p>
      <div className={styles.shareRow}><ShareTools locale={locale} title={title+' — '+w.overall+'%'} path={compatPath(locale,pair.slug)}/></div>
     </section>

     <section className={styles.vedicCard} aria-labelledby="pair-vedic">
      <div className={styles.vedicTop}>
       <div>
        <h2 id="pair-vedic">{uk?'Ведичний погляд: знаки Місяця':'The Vedic view: Moon signs'}</h2>
        <p>{uk?'У Джйотиш сумісність рахують за Місяцем. Якщо ваші знаки Місяця — '+a.uk+' і '+b.uk+', чотири «кути», що залежать від знака, дають:':'Jyotish matches by the Moon. If your Moon signs are '+a.en+' and '+b.en+', the four sign-based kootas give:'}</p>
       </div>
       <strong className={styles.vedicScore}>{String(v.total).replace('.',uk?',':'.')}<small> / {v.max}</small></strong>
      </div>
      <ul className={styles.kootas}>
       {KOOTA.map(([k,label,max])=><li key={k}>
        <span>{label}{k==='bhakoot'&&v.bhakoot.cancelled?(uk?' (доша нейтралізована)':' (dosha neutralised)'):''}</span><span className={styles.bar}><span style={{width:(v.scores[k]/max*100)+'%'}}/></span><b>{String(v.scores[k]).replace('.',uk?',':'.')}/{max}</b>
       </li>)}
      </ul>
      <p>{BHAKOOT_NOTE[v.bhakoot.pair][locale]}{v.bhakoot.cancelled?(uk?' Доша нейтралізується: управителі знаків ('+lords.join(' і ')+') дружні або однакові.':' The dosha is neutralised: the sign lords ('+lords.join(' and ')+') are friends or the same planet.'):''}</p>
      <p className={styles.vedicNote}>{uk?'Ще 21 бал із 36 (тара, йоні, гана, наді) залежать від накшатр — точного положення Місяця. Їх рахує повний калькулятор за датами народження.':'The other 21 of 36 points (Tara, Yoni, Gana, Nadi) depend on the nakshatras — the exact Moon position. The full calculator computes them from birth dates.'}</p>
      <Link className={styles.btn} href={compatPath(locale)+'#by-birth'}>{uk?'Порахувати 36 гун за датами':'Calculate all 36 gunas from birth dates'}</Link>
     </section>
    </div>

    <aside className={styles.side} aria-label={uk?'Інші пари':'Other pairs'}>
     {(a.n===b.n?[a]:[a,b]).map(s=><section key={s.slug} className={styles.panel+' '+elClass(s)}>
      <h2>{uk?'Сумісність '+s.gen:s.en+' compatibility'}</h2>
      <ul className={styles.pairList}>
       {others(s).map(({o,slug,pct})=><li key={o.slug}><Link href={compatPath(locale,slug)} aria-current={slug===pair.slug?'page':undefined}>
        <span className={elClass(o)} aria-hidden="true">{glyph(o)}</span>{uk?o.uk:o.en}<b>{pct}%</b>
       </Link></li>)}
      </ul>
     </section>)}
     <section className={styles.panel}>
      <h2>{uk?'Гороскоп на сьогодні':'Today’s horoscope'}</h2>
      <p className={styles.more} style={{marginTop:0}}>
       {(a.n===b.n?[a]:[a,b]).map(s=><Link key={s.slug} className={styles.link} href={signPath(locale,'western',s.slug)}>{uk?s.uk:s.en}</Link>)}
       <Link className={styles.link} href={'/'+locale+'/horoscope/my-sign'}>{uk?'Зоряний паспорт':'Star Passport'}</Link>
      </p>
     </section>
    </aside>
   </div>
   <p className={styles.method}>{uk?'Західна оцінка спирається на класичний аспект між знаками, їхні стихії та дружбу традиційних управителів; ведична — на таблиці Ашта-кути. Це символічна мова традиції, а не вирок стосункам.':'The Western score rests on the classical aspect between the signs, their elements and the friendship of their traditional rulers; the Vedic part uses the Ashtakoota tables. It is the symbolic language of a tradition, not a verdict on a relationship.'}</p>
  </div>
 </PortalShell>;
}
