import Link from 'next/link';
import {ArrowUpRight, MoonStar} from 'lucide-react';
import {BRAND,moduleTitle,portalPath,type PortalLocale} from '../../lib/brand';
import GlobalAccount from './GlobalAccount';

type Props={locale:PortalLocale;children:React.ReactNode;active?:string};
const LABELS={
 en:{home:'Home',astrology:'Astrology',tarot:'Tarot',experts:'Expert readings',yoga:'Yoga & mindfulness',learn:'Learn',language:'Language',caption:'Symbolic tools for reflection and discovery',disclaimer:'Astrology and tarot are cultural and symbolic practices, not guarantees about the future.'},
 uk:{home:'Головна',astrology:'Астрологія',tarot:'Таро',experts:'Консультації',yoga:'Йога та медитація',learn:'Знання',language:'Мова',caption:'Символічні інструменти для пізнання себе',disclaimer:'Астрологія і Таро — культурні та символічні практики, а не гарантія передбачення майбутнього.'}
} as const;
const SECTIONS=['astrology','tarot','experts','yoga','learn'] as const;
export default function PortalShell({locale,children,active=''}:Props){
 const t=LABELS[locale];
 return <div className="as-shell">
  <header className="as-header">
   <div className="as-header-inner">
    <Link href={portalPath(locale)} className="as-brand" aria-label={BRAND.name+' — '+t.home}>
     <span className="as-brand-icon"><MoonStar size={26} strokeWidth={1.45}/></span>
     <span><strong>{BRAND.name}</strong><small>ASTROLOGY · TAROT · COSMIC WISDOM</small></span>
    </Link>
    <nav className="as-main-nav" aria-label={t.home}>
     <Link href={portalPath(locale)} aria-current={!active?'page':undefined}>{t.home}</Link>
     {SECTIONS.map(s=><Link key={s} href={portalPath(locale,s)} aria-current={active===s?'page':undefined}>{t[s]}</Link>)}
    </nav>
    <GlobalAccount locale={locale}/>
    <div className="as-language" aria-label={t.language}>
      <Link href={portalPath('en',active)} aria-current={locale==='en'?'page':undefined} lang="en">EN</Link>
      <span>/</span><Link href={portalPath('uk',active)} aria-current={locale==='uk'?'page':undefined} lang="uk">UA</Link>
    </div>
   </div>
  </header>
  <main className="as-main">{children}</main>
  <footer className="as-footer">
    <div><Link className="as-footer-brand" href={portalPath(locale)}>{BRAND.name}</Link><p>{t.caption}</p></div>
    <p className="as-footer-note">{t.disclaimer}</p>
    <Link href={portalPath(locale,'astrology/jyotish')}>{moduleTitle('jyotish')} <ArrowUpRight size={15} aria-hidden="true"/></Link>
  </footer>
 </div>;
}
