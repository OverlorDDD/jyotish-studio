/** Shared loaders + metadata for the horoscope routes (server only). */
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import SignPage,{pageTitle} from '../app/components/horoscope/SignPage';
import HoroscopeHome from '../app/components/horoscope/HoroscopeHome';
import {isPortalLocale} from './brand';
import {indexRobots} from './site-indexing';
import {HORO_YEAR,addDays,hubPath,periodFromSegment,kyivToday,monthSpan,signBySlug,signPath,type HoroLocale,type HoroPeriod,type HoroSystem} from './horoscope-signs';
import {fetchAll,fetchDay,fetchPeriod,fetchYear} from './horoscope-v3';

function alternates(path:(l:HoroLocale)=>string,locale:HoroLocale){
 return {canonical:path(locale),languages:{uk:path('uk'),en:path('en'),'x-default':path('en')}};
}
export async function hubMetadata(rawLocale:string,system:HoroSystem):Promise<Metadata>{
 if(!isPortalLocale(rawLocale))return {};
 const locale=rawLocale as HoroLocale,uk=locale==='uk';
 const title=system==='western'?(uk?'Гороскоп на сьогодні для всіх знаків зодіаку':'Today’s horoscope for every zodiac sign'):(uk?'Ведичний гороскоп на сьогодні за знаком Місяця':'Today’s Vedic horoscope by Moon sign');
 const description=system==='western'?(uk?'Щоденний гороскоп для 12 знаків: кохання, робота, гроші й здоров’я за справжнім положенням планет. Завтра, тиждень, місяць і Зоряний паспорт.':'Daily horoscope for 12 signs: love, work, money and health from the real planetary positions. Tomorrow, week, month and the Star Passport.'):
  (uk?'Джйотиш-гороскоп за сидеричним зодіаком для 12 знаків Місяця з позначенням днів Чандраштами.':'Jyotish horoscope in the sidereal zodiac for the 12 Moon signs, with Chandrashtama days marked.');
 return {title:title+' | Galaxiora',description,robots:{...indexRobots(),'max-image-preview':'large'},
  alternates:alternates(l=>hubPath(l,system),locale),
  openGraph:{type:'website',siteName:'Galaxiora',title,description,url:hubPath(locale,system),locale:uk?'uk_UA':'en_US'}};
}
export async function renderHub(rawLocale:string,system:HoroSystem){
 if(!isPortalLocale(rawLocale))notFound();
 const locale=rawLocale as HoroLocale,today=kyivToday();
 const data=await fetchAll(system,today);
 return <HoroscopeHome locale={locale} system={system} date={today} signs={data?.signs||null}/>;
}
function parse(rawLocale:string,slug:string,rawPeriod?:string){
 if(!isPortalLocale(rawLocale))return null;
 const sign=signBySlug(slug),period=periodFromSegment(rawPeriod);
 if(!sign||!period)return null;
 return {locale:rawLocale as HoroLocale,sign,period};
}
export async function signMetadata(rawLocale:string,system:HoroSystem,slug:string,rawPeriod?:string):Promise<Metadata>{
 const p=parse(rawLocale,slug,rawPeriod);if(!p)return {robots:{index:false,follow:false}};
 const {locale,sign,period}=p,uk=locale==='uk',today=kyivToday(),name=uk?sign.uk:sign.en;
 const title=pageTitle(locale,system,sign,period,today);
 const what:Record<HoroPeriod,string>=uk?{today:'Гороскоп на сьогодні',tomorrow:'Гороскоп на завтра',week:'Гороскоп на тиждень',month:'Гороскоп на місяць з календарем вдалих днів',year:'Гороскоп на '+HORO_YEAR+' рік з прогнозом по місяцях'}:
  {today:'Today’s horoscope',tomorrow:'Tomorrow’s horoscope',week:'Weekly horoscope',month:'Monthly horoscope with a calendar of good days',year:'Horoscope for '+HORO_YEAR+' with a month-by-month forecast'};
 const description=uk?what[period]+' для знака '+sign.gen+(system==='vedic'?' (ведична астрологія, знак Місяця)':'')+(period==='year'?': головна тема року, уроки Сатурна, найкращі місяці для кохання, кар’єри й грошей, затемнення й ретроградні періоди.':': кохання, робота, гроші, здоров’я й оцінки дня за реальним положенням планет.'):
  what[period]+' for '+name+(system==='vedic'?' (Vedic, Moon sign)':'')+(period==='year'?': the theme of the year, Saturn’s lesson, the best months for love, career and money, eclipses and retrogrades.':': love, work, money, health and daily ratings from the real planetary positions.');
 return {title:title+' | Galaxiora',description,robots:{...indexRobots(),'max-image-preview':'large'},
  alternates:alternates(l=>signPath(l,system,sign.slug,period),locale),
  openGraph:{type:'article',siteName:'Galaxiora',title,description,url:signPath(locale,system,sign.slug,period),locale:uk?'uk_UA':'en_US'}};
}
export async function renderSign(rawLocale:string,system:HoroSystem,slug:string,rawPeriod?:string){
 const p=parse(rawLocale,slug,rawPeriod);if(!p)notFound();
 const {locale,sign,period}=p,today=kyivToday();
 let day=null,range=null,year=null;
 if(period==='year')year=await fetchYear(system,sign.n,HORO_YEAR);
 else if(period==='today'||period==='tomorrow')day=await fetchDay(system,sign.n,period==='today'?today:addDays(today,1));
 else if(period==='week')range=await fetchPeriod(system,sign.n,today,7);
 else{const m=monthSpan(today);range=await fetchPeriod(system,sign.n,m.start,m.days);}
 return <SignPage locale={locale} system={system} sign={sign} period={period} today={today} day={day} range={range} year={year}/>;
}
