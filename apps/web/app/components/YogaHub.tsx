import Link from 'next/link';
import {ArrowUpRight,Wind,Sun,Leaf,Moon,ShieldCheck} from 'lucide-react';
import PortalShell from './PortalShell';
import {YOGA_PRACTICES,say,type ContentLocale} from '../../lib/yoga-content';
import {BREATHING_PATTERNS,sessionMs} from '../../lib/breathing-patterns';
import EditorialPublishedCards from './EditorialPublishedCards';
const Icon={wind:Wind,sun:Sun,leaf:Leaf,moon:Moon};
export default function YogaHub({locale}:{locale:ContentLocale}){
 const uk=locale==='uk';
 return <PortalShell locale={locale} active="yoga"><div className="as-wellness">
  <section className="as-wellness-hero yoga-hero">
   <span className="as-overline">{uk?'GALAXIORA YOGA · ПРАКТИКИ':'GALAXIORA YOGA · PRACTICE LIBRARY'}</span>
   <h1>{uk?'Повернись у свій ритм.':'Find your own rhythm.'}</h1>
   <p>{uk?'Дихання по квадрату з анімованим провідником, два ритми без затримок та практики руху й уважності. Обирай, що підходить саме сьогодні: без оцінок, змагання і поспіху.':'Animated box breathing, two gentle hold-free patterns and accessible movement and mindfulness sessions. Choose what feels useful today, at your own pace.'}</p>
   <div className="as-wellness-tags"><span>{uk?'4 практики':'4 sessions'}</span><span>{uk?'4–7 хвилин':'4–7 minutes'}</span><span>{uk?'Без реєстрації':'No account needed'}</span></div>
   <a className="as-button as-button-primary" href="#practice-library">{uk?'Обрати практику':'Explore sessions'} <ArrowUpRight size={17}/></a>
  </section>
  <section className="as-wellness-section" id="practice-library">
   <div className="as-wellness-section-header"><span className="as-overline">{uk?'БІБЛІОТЕКА ПРАКТИК':'THE PRACTICE LIBRARY'}</span><h2>{uk?'Із чого хочеться почати?':'Where would you like to begin?'}</h2></div>
   <div className="as-wellness-grid">{YOGA_PRACTICES.map(practice=>{
    const Visual=Icon[practice.icon];
    const duration=practice.category==='breathing'?sessionMs(BREATHING_PATTERNS[0])/60000:practice.steps.reduce((total,step)=>total+step.seconds,0)/60;
    return <Link className="as-wellness-card" data-practice={practice.slug} key={practice.slug} href={'/'+locale+'/yoga/'+practice.slug}>
     <span className={'as-wellness-card-icon icon-'+practice.icon}><Visual size={30} aria-hidden="true"/></span>
     <span className="as-wellness-meta">{duration} {uk?'хв':'min'} · {practice.category==='breathing'?(uk?'анімований ритм':'animated pacing'):(uk?'без обов’язкового таймера':'untimed guidance')}</span>
     <h3>{say(practice.title,locale)}</h3><p>{say(practice.purpose,locale)}</p>
     <span className="as-wellness-card-link">{uk?'Відкрити практику':'Open practice'} <ArrowUpRight size={17}/></span>
    </Link>;
   })}</div>
  </section>
  <EditorialPublishedCards kind="YOGA" locale={locale}/>
  <aside className="as-wellness-note"><ShieldCheck size={23} aria-hidden="true"/><div><strong>{uk?'Турбота про безпеку':'Practice safely'}</strong>
   <p>{uk?'Рухайся лише в комфортній амплітуді й дихай природно. За болю, запаморочення або дискомфорту припини вправу. За медичних обмежень обирай рекомендації кваліфікованого фахівця.':'Move within a comfortable range and breathe naturally. Stop for pain, dizziness or distress. If you have medical limitations, seek personalized advice from a qualified professional.'}</p>
   <a href="https://www.nccih.nih.gov/health/yoga-effectiveness-and-safety" target="_blank" rel="noopener noreferrer">{uk?'NIH: безпека йоги':'NIH: yoga safety'} <ArrowUpRight size={14}/></a></div>
  </aside>
  <div className="as-wellness-next"><p>{uk?'Хочеш дізнатися більше про традицію йоги?':'Curious about the background of yoga?'}</p>
   <Link href={'/'+locale+'/learn/yoga-roots-and-safety'}>{uk?'Читати в Academy':'Read in Academy'} <ArrowUpRight size={16}/></Link>
  </div>
 </div></PortalShell>;
}