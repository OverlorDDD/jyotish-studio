'use client';

export type ReadingSection={
 id:string;heading:string;eyebrow:string;lead:string;paragraphs:string[];
 facts?:string[];image?:'cosmos'|'earth'|'nebula';
};
export type ReadingReport={
 sections:ReadingSection[];generatedAt:string;chartSummary:string;language:'uk'|'en';
 ai:{provider:string;model?:string;text:string;fallbackReason?:string};
};
const PHOTOS={
 cosmos:{
  url:'https://commons.wikimedia.org/wiki/Special:FilePath/V_372_Orionis_Hubble.jpg?width=1100',
  page:'https://commons.wikimedia.org/wiki/File:V_372_Orionis_Hubble.jpg',
  credit:'NASA / ESA / Hubble'
 },
 earth:{
  url:'https://commons.wikimedia.org/wiki/Special:FilePath/The_Earth_seen_from_Apollo_17.jpg?width=1100',
  page:'https://commons.wikimedia.org/wiki/File:The_Earth_seen_from_Apollo_17.jpg',
  credit:'NASA / Apollo 17'
 },
 nebula:{
  url:'https://commons.wikimedia.org/wiki/Special:FilePath/Carina_Nebula_in_Visible_and_Infrared.jpg?width=1100',
  page:'https://commons.wikimedia.org/wiki/File:Carina_Nebula_in_Visible_and_Infrared.jpg',
  credit:'NASA / Hubble'
 }
} as const;
const NAV=[
 ['portrait','Портрет','Portrait'],['sun-moon','Сонце та Місяць','Sun & Moon'],
 ['planets-intro','9 ґрах','9 grahas'],['houses-intro','12 домів','12 houses'],
 ['drishti','Дрішті','Drishti'],['navamsa','Навамша D9','Navamsa D9'],
 ['dashamsa','Дашамша D10','Dashamsa D10'],['dasha','Даші','Dashas']
] as const;
const FALLBACK_UK:Record<string,string>={
 hourly_limit:'Вичерпано локальний ліміт безкоштовних запитів.',
 no_provider:'Безкоштовна модель не налаштована.',
 rate_limited:'Безкоштовний провайдер тимчасово обмежив запити.',
 provider_rejected:'Провайдер відхилив запит до моделі.',
 provider_unavailable:'Безкоштовна модель наразі недоступна.',
 invalid_response:'Модель не змогла створити валідну інтерпретацію.',
 timeout:'Модель відповідала надто довго.',
 network:'Не вдалося підключитися до моделі.',
 local_only:'Обрано лише локальний звіт.'
};
const FALLBACK_EN:Record<string,string>={
 hourly_limit:'The hourly free AI limit was reached.',
 no_provider:'A free model is not configured.',
 rate_limited:'The free provider temporarily limited requests.',
 provider_rejected:'The provider rejected the model request.',
 provider_unavailable:'The free model is temporarily unavailable.',
 invalid_response:'The model did not produce a valid interpretation.',
 timeout:'The model response timed out.',
 network:'Could not connect to the model.',
 local_only:'Offline report was requested.'
};

export default function DetailedReport({report,lang}:{report:ReadingReport;lang:'uk'|'en'}){
 const uk=lang==='uk',ai=report.ai;
 return <section className="reading-root" id="full-reading" aria-label={uk?'Детальне трактування карти':'Detailed chart interpretation'}>
  <div className="reading-kicker">{uk?'✧ ПЕРСОНАЛЬНЕ ТРАКТУВАННЯ':'✧ PERSONAL READING'}</div>
  <h2>{uk?'Ваш астрологічний портрет':'Your astrological portrait'}</h2>
  <p className="reading-intro">{uk?
   'Повний путівник по вашій карті: планетні положення, дванадцять домів, класичні аспекти, D9, D10 та планетні періоди.' :
   'A complete guide to your chart: planetary placements, twelve houses, classical aspects, D9, D10 and time periods.'}</p>
  <nav className="reading-toc" aria-label={uk?'Зміст трактування':'Report contents'}>
   {NAV.map(([id,ua,en],index)=><a key={id} href={'#reading-'+id}><span>{String(index+1).padStart(2,'0')}</span> {uk?ua:en}</a>)}
  </nav>
  <div className="reading-content">
   {report.sections.map((section,index)=><div key={section.id}>
    <article id={'reading-'+section.id} className={'reading-chapter '+(section.id==='portrait'?'reading-chapter-hero':'')+(section.id.startsWith('planet-')||section.id.startsWith('house-')?' reading-chapter-small':'')}>
      {section.image?<figure className="reading-figure">
       <div className="reading-figure-photo" role="img"
        aria-label={uk?'Космічна фотографія NASA':'NASA space photograph'}
        style={{backgroundImage:'linear-gradient(100deg,rgba(10,17,27,.25),rgba(13,22,33,.08)),url("'+PHOTOS[section.image].url+'")'}}/>
       <figcaption>{uk?'Зображення: ':'Image: '}<a href={PHOTOS[section.image].page} target="_blank" rel="noopener noreferrer">{PHOTOS[section.image].credit} · Wikimedia Commons</a></figcaption>
      </figure>:null}
      <div className="reading-chapter-copy">
       <div className="reading-chapter-kicker">{section.eyebrow}</div>
       <h3>{section.heading}</h3>
       <p className="reading-chapter-lead">{section.lead}</p>
       {section.paragraphs.map((paragraph,i)=><p key={i} className="reading-paragraph">{paragraph}</p>)}
       {section.facts?.length?<div className="reading-facts">
        <div className="reading-facts-label">{uk?'Перевірені дані карти':'Verified chart facts'}</div>
        <ul>{section.facts.map((fact,i)=><li key={i}>{fact}</li>)}</ul>
       </div>:null}
      </div>
    </article>
    {section.id==='sun-moon'?<aside className="reading-llm" id="reading-ai">
      <div className="reading-chapter-kicker">{uk?'✧ ПОГЛИБЛЕНЕ AI-ТРАКТУВАННЯ':'✧ EXTENDED AI INSIGHT'}</div>
      <h3>{uk?'Синтез основних тем карти':'Synthesis of the chart’s main themes'}</h3>
      {ai.provider==='openrouter'||ai.provider==='ollama'?
        <>
         <p className="reading-provider">{(ai.provider==='openrouter'?'OpenRouter': 'Ollama')+(ai.model?' · '+ai.model:'')} · {uk?'без платного OpenAI':'no paid OpenAI'}</p>
         <div className="reading-ai-text">{ai.text.split(/\n{2,}/).filter(Boolean).map((part,i)=><p key={i}>{part}</p>)}</div>
        </>:
        <>
         <p className="reading-paragraph">{uk?'Безкоштовна LLM зараз не надала прийнятної відповіді. Повний структурований звіт нижче доступний незалежно від AI.':'The free language model did not return an accepted answer. The complete calculated report remains available below.'}</p>
         <p className="reading-provider">{uk?(FALLBACK_UK[ai.fallbackReason||'']||'Режим локального звіту'):(FALLBACK_EN[ai.fallbackReason||'']||'Offline report mode')}</p>
        </>
      }
    </aside>:null}
   </div>)}
  </div>
  <div className="reading-end">
   <span>✧</span>
   <p>{uk?'Від зоряних положень — до цілісного прочитання карти.':'From stellar positions to a coherent view of the chart.'}</p>
   <a href="#interpretation">{uk?'Повернутися до кнопки трактування ↑':'Back to interpretation button ↑'}</a>
  </div>
 </section>;
}
