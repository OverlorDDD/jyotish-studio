import Link from 'next/link';
import {ArrowUpRight, MoonStar} from 'lucide-react';
import {BRAND,moduleTitle,portalPath,type PortalLocale} from '../../lib/brand';
import GlobalAccount from './GlobalAccount';

type Props={locale:PortalLocale;children:React.ReactNode;active?:string;languagePath?:string};
const LABELS={
 en:{home:'Home',astrology:'Astrology',tarot:'Tarot',experts:'Expert readings',yoga:'Yoga & mindfulness',learn:'Learn',news:'News',community:'Community',horoscope:'Horoscopes',panchanga:'Panchanga',personal:'Personal',language:'Language',caption:'A place for celestial wisdom and mindful practice',disclaimer:'Discover Jyotish, Tarot, lunar calendars and mindful living.'},
 uk:{home:'Головна',astrology:'Астрологія',tarot:'Таро',experts:'Консультації',yoga:'Йога та медитація',learn:'Знання',news:'Новини',community:'Форум',horoscope:'Гороскопи',panchanga:'Панчанга',personal:'Мій Всесвіт',language:'Мова',caption:'Простір астрології, Таро та живих практик',disclaimer:'Джйотіш, Таро, місячний календар та щоденні практики.'}
} as const;
const SECTIONS=['astrology','tarot','yoga','learn','news','community'] as const;
export default function PortalShell({locale,children,active='',languagePath}:Props){
 const t=LABELS[locale];
 const publicContact=process.env.NEXT_PUBLIC_SITE_CONTACT_EMAIL?.trim()||'';
 return <div className="as-shell">
  <a href="#main-content" className="as-skip-link">{locale==='uk'?'Перейти до вмісту':'Skip to main content'}</a>
  <header className="as-header">
   <div className="as-header-inner">
    <Link href={portalPath(locale)} className="as-brand" aria-label={BRAND.name+' — '+t.home}>
     <span className="as-brand-icon"><MoonStar size={26} strokeWidth={1.45}/></span>
     <span><strong>{BRAND.name}</strong><small>ASTROLOGY · TAROT · COSMIC WISDOM</small></span>
    </Link>
    <nav className="as-main-nav" aria-label={locale==='uk'?'Основна навігація':'Main navigation'}>
     <Link href={portalPath(locale)} aria-current={!active?'page':undefined}>{t.home}</Link>
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
    <div><Link className="as-footer-brand" href={portalPath(locale)}>{BRAND.name}</Link><p>{t.caption}</p></div>
    <p className="as-footer-note">{t.disclaimer}</p>
    <Link href={'/'+locale+'/methodology'}>{locale==='uk'?'Методологія й точність':'Methods and accuracy'} <ArrowUpRight size={15} aria-hidden="true"/></Link>
    <Link href={portalPath(locale,'astrology/jyotish')}>{moduleTitle('jyotish')} <ArrowUpRight size={15} aria-hidden="true"/></Link>
    <Link href={'/'+locale+'/privacy'}>{locale==='uk'?'Конфіденційність':'Privacy'}</Link>
    <Link href={'/'+locale+'/terms'}>{locale==='uk'?'Умови користування':'Terms of Use'}</Link>
    {publicContact&&<div className="as-footer-contact" aria-label={locale==='uk'?'Контактна інформація':'Contact information'}>
      <strong>{locale==='uk'?'Зв’язок із нами':'Contact us'}</strong>
      <a href={'mailto:'+publicContact}>{publicContact}</a>
    </div>}
  </footer>
 </div>;
}
