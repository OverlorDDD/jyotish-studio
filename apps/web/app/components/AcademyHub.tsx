import Link from 'next/link';
import {ArrowUpRight,BookOpen,Compass,Layers,Sparkles} from 'lucide-react';
import PortalShell from './PortalShell';
import {ACADEMY_TOPICS,ACADEMY_LESSONS} from '../../lib/academy-content';
import type {ContentLocale} from '../../lib/yoga-content';
import EditorialPublishedCards from './EditorialPublishedCards';
const ICONS={jyotish:Compass,tarot:Sparkles,practice:Layers};
export default function AcademyHub({locale}:{locale:ContentLocale}){
 const uk=locale==='uk';
 return <PortalShell locale={locale} active="learn"><div className="as-wellness">
  <section className="as-wellness-hero academy-hero">
   <span className="as-overline">{uk?'GALAXIORA ACADEMY · БІБЛІОТЕКА':'GALAXIORA ACADEMY · LEARNING LIBRARY'}</span>
   <h1>{uk?'Знання, що відкривають нові запитання.':'Learn beyond the surface.'}</h1>
   <p>{uk?'Сім повноцінних уроків про Джйотіш, символіку Таро та йогу. Пояснення, приклади й самоперевірка після кожної теми — вільно, без акаунта.':'Seven complete lessons exploring Jyotish, Tarot symbolism and yoga. Explanations, examples and a knowledge check at the end of each topic — free without an account.'}</p>
   <div className="as-wellness-tags"><span>{uk?'7 уроків':'7 lessons'}</span><span>{uk?'3 теми':'3 topics'}</span><span>UA / EN</span></div>
   <a className="as-button as-button-primary" href="#academy-library">{uk?'Перейти до уроків':'Explore lessons'} <ArrowUpRight size={17}/></a>
  </section>
  <nav className="as-academy-jump" aria-label={uk?'Теми бібліотеки':'Library topics'}>
   {ACADEMY_TOPICS.map(topic=><a key={topic.id} href={'#topic-'+topic.id}>{topic.title[locale]}</a>)}
  </nav>
  <div id="academy-library">{ACADEMY_TOPICS.map(topic=>{
   const Icon=ICONS[topic.id];
   return <section className="as-wellness-section as-academy-group" key={topic.id} id={'topic-'+topic.id}>
    <div className="as-wellness-section-header"><span className="as-overline"><Icon size={19} aria-hidden="true"/> {uk?'ТЕМАТИЧНИЙ БЛОК':'TOPIC COLLECTION'}</span>
     <h2>{topic.title[locale]}</h2><p>{topic.subtitle[locale]}</p></div>
    <div className="as-wellness-grid">{ACADEMY_LESSONS.filter(l=>l.topic===topic.id).map((lesson,i)=>
     <Link href={'/'+locale+'/learn/'+lesson.slug} className="as-wellness-card as-lesson-card" data-lesson={lesson.slug} key={lesson.slug}>
      <span className="as-wellness-card-icon"><BookOpen size={27} aria-hidden="true"/></span>
      <span className="as-wellness-meta">{uk?'УРОК':'LESSON'} {String(i+1).padStart(2,'0')} · {lesson.minutes} {uk?'хв читання':'min read'}</span>
      <h3>{lesson.title[locale]}</h3><p>{lesson.description[locale]}</p>
      <span className="as-wellness-card-link">{uk?'Читати та перевірити себе':'Read and check knowledge'} <ArrowUpRight size={17}/></span>
     </Link>)}</div>
   </section>;
  })}</div>
  <EditorialPublishedCards kind="ACADEMY" locale={locale}/>
  <aside className="as-wellness-note"><BookOpen size={23} aria-hidden="true"/><div>
   <strong>{uk?'Як влаштована бібліотека':'About this learning library'}</strong>
   <p>{uk?'Це авторські вступні матеріали з розмежуванням історичних традицій, математичних розрахунків і символічних тверджень. Запитання після уроків перевіряють розуміння тексту, а не «духовні здібності».':'These are original introductory materials that distinguish traditions, mathematical calculations and symbolic claims. Lesson questions check understanding, not spiritual ability.'}</p>
  </div></aside>
 </div></PortalShell>;
}