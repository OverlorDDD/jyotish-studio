import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import Image from 'next/image';
import {BRAND,moduleTitle,portalPath,type PortalLocale} from '../../lib/brand';
import GlobalAccount from './GlobalAccount';
import StarSky from './StarSky';

type Props={locale:PortalLocale;children:React.ReactNode;active?:string;languagePath?:string};
const LABELS={
 en:{home:'Home',aboutMe:'About Me',astrology:'Astrology',tarot:'Tarot',experts:'Expert readings',yoga:'Yoga & mindfulness',learn:'GalaxiPedia',news:'News',community:'Community',horoscope:'Horoscopes',panchanga:'Panchanga',personal:'Personal',language:'Language',caption:'A place for celestial wisdom and mindful practice',disclaimer:'Discover Jyotish, Tarot, lunar calendars and mindful living.'},
 uk:{home:'Головна',aboutMe:'Про мене',astrology:'Астрологія',tarot:'Таро',experts:'Консультації',yoga:'Йога та медитація',learn:'GalaxiPedia',news:'Новини',community:'Форум',horoscope:'Гороскопи',panchanga:'Панчанга',personal:'Мій Всесвіт',language:'Мова',caption:'Простір астрології, Таро та живих практик',disclaimer:'Джйотіш, Таро, місячний календар та щоденні практики.'}
} as const;
const SECTIONS=['astrology','tarot','yoga','learn','news','community'] as const;
export default function PortalShell({locale,children,active='',languagePath}:Props){
 const t=LABELS[locale];
 const publicContact=process.env.NEXT_PUBLIC_SITE_CONTACT_EMAIL?.trim()||'';
 return <div className="as-shell">
  <StarSky/>
  <a href="#main-content" className="as-skip-link">{locale==='uk'?'Перейти до вмісту':'Skip to main content'}</a>
  <header className="as-header">
   <div className="as-header-inner">
    <Link href={portalPath(locale,'astrology/jyotish')} className="as-brand" aria-label={BRAND.name+' — '+moduleTitle('jyotish')}>
     <span className="as-brand-icon"><Image src="/galaxiora-favicon.png" alt="" width={46} height={46} unoptimized priority/></span>
     <span><strong>{BRAND.name}</strong><small>ASTROLOGY · TAROT · COSMIC WISDOM</small></span>
    </Link>
    <nav className="as-main-nav" aria-label={locale==='uk'?'Основна навігація':'Main navigation'}>
     <Link href={portalPath(locale,'about-me')} aria-current={active==='about-me'?'page':undefined}>{t.aboutMe}</Link>
     <Link href={portalPath(locale,'horoscope')} aria-current={active==='horoscope'?'page':undefined}>{t.horoscope}</Link>
     <Link href={portalPath(locale,'panchanga')} aria-current={active==='panchanga'?'page':undefined}>{t.panchanga}</Link>
     {SECTIONS.map(s=><Link key={s} href={portalPath(locale,s)} aria-current={active===s?'page':undefined}>{t[s]}</Link>)}
     <Link href={portalPath(locale,'personal')} className="as-personal-link" aria-current={active==='personal'?'page':undefined}>{t.personal}</Link>
    </nav>
    <GlobalAccount locale={locale}/>
    <div className="as-language" aria-label={t.language}>
      <Link href={portalPath('en',languagePath??active)} aria-current={locale==='en'?'page':undefined} lang="en">EN</Link>
      <span>/</span><Link href={portalPath('uk',languagePath??active)} aria-current={locale==='uk'?'page':undefined} lang="uk">UA</Link>
    </div>
   </div>
  </header>
  <main className="as-main" id="main-content" tabIndex={-1}>{children}</main>
  <footer className="as-footer">
    <div><Link className="as-footer-brand" href={portalPath(locale,'astrology/jyotish')}>{BRAND.name}</Link><p>{t.caption}</p></div>
    <p className="as-footer-note">{t.disclaimer}</p>
    <Link href={'/'+locale+'/about'}>{locale==='uk'?'Про Galaxiora':'About Galaxiora'} <ArrowUpRight size={15} aria-hidden="true"/></Link>
    <Link href={'/'+locale+'/methodology'}>{locale==='uk'?'Методологія й точність':'Methods and accuracy'} <ArrowUpRight size={15} aria-hidden="true"/></Link>
    <Link href={portalPath(locale,'astrology/jyotish')}>{moduleTitle('jyotish')} <ArrowUpRight size={15} aria-hidden="true"/></Link>
    <Link href={'/'+locale+'/panchanga#cities'}>{locale==='uk'?'Панчанга по містах':'Panchanga by city'}</Link>
    <Link href={'/'+locale+'/nakshatra'}>{locale==='uk'?'27 накшатр':'27 nakshatras'}</Link>
    <Link href={'/'+locale+'/privacy'}>{locale==='uk'?'Конфіденційність':'Privacy'}</Link>
    <Link href={'/'+locale+'/terms'}>{locale==='uk'?'Умови користування':'Terms of Use'}</Link>
    {publicContact&&<div className="as-footer-contact" aria-label={locale==='uk'?'Контактна інформація':'Contact information'}>
      <strong>{locale==='uk'?'Зв’язок із нами':'Contact us'}</strong>
      <a href={'mailto:'+publicContact}>{publicContact}</a>
    </div>}
  </footer>
 </div>;
}
