import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {BRAND,isPortalLocale} from '../../../../../lib/brand';
import {indexRobots} from '../../../../../lib/site-indexing';
import PortalShell from '../../../../components/PortalShell';
const signs=[
 {slug:'aries',uk:'Овен',en:'Aries',traits:{uk:'ініціатива, сміливість і прямота',en:'initiative, courage and directness'}},
 {slug:'taurus',uk:'Телець',en:'Taurus',traits:{uk:'сталість, тілесний комфорт і цінності',en:'consistency, comfort and values'}},
 {slug:'gemini',uk:'Близнюки',en:'Gemini',traits:{uk:'цікавість, розмови й різноманіття',en:'curiosity, communication and variety'}},
 {slug:'cancer',uk:'Рак',en:'Cancer',traits:{uk:'турбота, дім і почуття належності',en:'care, home and belonging'}},
 {slug:'leo',uk:'Лев',en:'Leo',traits:{uk:'творчість, гідність і самовираження',en:'creativity, dignity and self-expression'}},
 {slug:'virgo',uk:'Діва',en:'Virgo',traits:{uk:'уважність до деталей, порядок і практика',en:'attention to detail, order and practice'}},
 {slug:'libra',uk:'Терези',en:'Libra',traits:{uk:'діалог, взаємність і відчуття міри',en:'dialogue, reciprocity and balance'}},
 {slug:'scorpio',uk:'Скорпіон',en:'Scorpio',traits:{uk:'глибина, стійкість і переосмислення',en:'depth, resolve and transformation'}},
 {slug:'sagittarius',uk:'Стрілець',en:'Sagittarius',traits:{uk:'пошук сенсу, знання та відкритість',en:'meaning, study and openness'}},
 {slug:'capricorn',uk:'Козоріг',en:'Capricorn',traits:{uk:'відповідальність, довгі плани й дисципліна',en:'responsibility, long-range plans and discipline'}},
 {slug:'aquarius',uk:'Водолій',en:'Aquarius',traits:{uk:'незалежність мислення та спільні ідеї',en:'independent thinking and shared ideas'}},
 {slug:'pisces',uk:'Риби',en:'Pisces',traits:{uk:'уяву, співчуття й тонке сприйняття',en:'imagination, compassion and sensitivity'}}
] as const;
export const dynamicParams=false;
export function generateStaticParams(){return BRAND.locales.flatMap(locale=>signs.map(s=>({locale,sign:s.slug})))}
type Props={params:Promise<{locale:string;sign:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {locale,sign}=await params,info=signs.find(s=>s.slug===sign);
 if(!isPortalLocale(locale)||!info)return {robots:{index:false,follow:false}};
 const uk=locale==='uk',name=uk?info.uk:info.en;
 const title=(uk?'Західний гороскоп для знака ':'Western Sun-sign horoscope: ')+name;
 const description=uk?'Західний тропічний зодіак, знак Сонця '+name+', добовий гороскоп за розрахованими транзитами Сонця й Місяця.':'Western tropical Sun sign '+name+', daily guidance from computed Sun and Moon transits.';
 const path='/'+locale+'/horoscope/western/'+sign;
 return {title:title+' | Galaxiora',description,robots:indexRobots(),
  alternates:{canonical:path,languages:{uk:'/uk/horoscope/western/'+sign,en:'/en/horoscope/western/'+sign}},
  openGraph:{type:'article',title,description,url:path,siteName:'Galaxiora'}};
}
export default async function WesternSunSignPage({params}:Props){
 const {locale,sign}=await params,info=signs.find(s=>s.slug===sign);
 if(!isPortalLocale(locale)||!info)notFound();
 const uk=locale==='uk',name=uk?info.uk:info.en;
 return <PortalShell locale={locale} active="horoscope" languagePath={'horoscope/western/'+sign}>
  <article className="as-wellness as-academy-detail" style={{maxWidth:850,margin:'32px auto 70px'}}>
   <header className="as-wellness-detail-head">
    <span className="as-overline">GALAXIORA · WESTERN · TROPICAL SUN</span>
    <h1>{uk?'Західний гороскоп — ':'Western Sun-sign horoscope — '}{name}</h1>
    <p>{uk?'Це традиційне західне читання за тропічним знаком Сонця — саме тим, який зазвичай називають просто знаком зодіаку.':
     'This uses the tropical natal Sun sign, the familiar Western zodiac sign associated with your birthday.'}</p>
   </header>
   <section className="as-lesson-section"><h2>{uk?'Символіка знака':'Sign symbolism'}</h2>
    <p>{uk?'У західній традиції Сонце в знаку '+name+' символічно пов’язують із темами: '+info.traits.uk+'. Це загальна інтерпретація, а не персональне твердження про характер.':
     'In Western astrology, the Sun in '+name+' is traditionally associated with '+info.traits.en+'. This is a general symbolic interpretation, not a personal claim.'}</p>
   </section>
   <section className="as-lesson-section"><h2>{uk?'Як формується прогноз':'How the reading is made'}</h2>
    <p>{uk?'Galaxiora окремо розраховує тропічні положення Сонця й Місяця за Swiss Ephemeris. Для дванадцяти західних знаків редакційні теми визначаються за цілознаковими домами від вибраного знака Сонця. Ведичні Місяць і Лагна тут не використовуються.':
     'Galaxiora independently calculates tropical Sun and Moon positions with Swiss Ephemeris. General editorial themes use whole-sign houses counted from the chosen Sun sign. Vedic Moon and Lagna are not used in this mode.'}</p>
   </section>
   <div className="as-actions" style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:25}}>
    <Link className="as-button as-button-primary" href={'/'+locale+'/horoscope?system=western&sign='+sign}>
     {uk?'Читати гороскоп '+name:'Read '+name+' horoscope'}
    </Link>
    <Link className="as-button as-button-secondary" href={'/'+locale+'/horoscope?system=vedic&sign='+sign}>
     {uk?'Порівняти з ведичним Місяцем':'Compare Vedic Moon-sign reading'}
    </Link>
   </div>
  </article>
 </PortalShell>;
}
