'use client';
import GlossaryText from './GlossaryText';

export type ReadingSection={
 id:string;heading:string;eyebrow:string;lead:string;paragraphs:string[];
 facts?:string[];image?:'cosmos'|'earth'|'nebula';
};
export type ReadingReport={
 sections:ReadingSection[];generatedAt:string;chartSummary:string;language:'uk'|'en';readerVersion?:string;verification?:{version:string;status:string;digest:string;checks:readonly string[];externalReferenceChecked:false};
 practicalTips?:{id:string;title:string;meaning:string;example:string;action:string;evidence:string[]}[];
 lifePortrait?:{version:string;chapters:{id:string;title:string;overview:string;example:string;action:string;evidence:string[]}[]};
 editorial?:{version:string;findings?:{id:string;topic:string;ruleId:string;verifiedEvidence:string[];traditionalMeaning:string;supportingFactors:string[];counterFactors:string[];relativeImportance:number;limitations:string[];sourceIds?:string[]}[];chapters:{id:string;title:string;paragraphs:string[];insights:string[];evidence:string[]}[];elements:{name:string;count:number;percentage:number}[];highlights:string[];method:string};
 asOf?:string;rulesVersion?:string;rulesDigest?:string;ruleFacts?:{id:string;rule:string;subject:string;values:Record<string,string|number|boolean>;evidence:string[]}[];
 ai:{provider:string;model?:string;text:string;fallbackReason?:string;source?:'llm'|'deterministic';cached?:boolean;documentMode?:'unified';chapters?:{id:string;paragraphs:string[];source:'llm'}[]};
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
 ['portrait','Загальний портрет','Overview'],['sun-moon','Воля та емоції','Purpose & feelings'],
 ['planets-intro','Планети й теми','Planets & themes'],['houses-intro','Сфери життя','Life areas'],
 ['drishti','Взаємний вплив','Interactions'],['conjunctions','Поєднання планет','Planet combinations'],
 ['navamsa','Стосунки й цінності','Relationships & values'],
 ['dashamsa','Робота й покликання','Work & purpose'],['cross-varga','Різні зрізи карти','Chart perspectives'],
 ['dasha','Життєві цикли','Life cycles'],['house-lords','Зв’язок сфер життя','Life-area connections'],
 ['dignities','Особливі положення','Planetary conditions'],['yogas','Особливі комбінації','Special combinations']
] as const;
const FALLBACK_UK:Record<string,string>={
 hourly_limit:'Вичерпано локальний ліміт безкоштовних запитів.',
 no_provider:'Безкоштовна модель не налаштована.',
 rate_limited:'Безкоштовний провайдер тимчасово обмежив запити.',
 provider_rejected:'Провайдер відхилив запит до моделі.',
 provider_unavailable:'Безкоштовна модель наразі недоступна.',
 invalid_response:'Безкоштовна LLM не надала завершеного придатного тексту навіть після повторної спроби або переходу до іншої моделі. Трактування Reader v6 доступне без змін.',
 timeout:'Модель відповідала надто довго.',
 network:'Не вдалося підключитися до моделі.',
 local_only:'Обрано лише локальний звіт.',
 reader_only:'Автономне прочитання Reader v6.'
};
const FALLBACK_EN:Record<string,string>={
 hourly_limit:'The hourly free AI limit was reached.',
 no_provider:'A free model is not configured.',
 rate_limited:'The free provider temporarily limited requests.',
 provider_rejected:'The provider rejected the model request.',
 provider_unavailable:'The free model is temporarily unavailable.',
 invalid_response:'Free LLM providers did not produce an acceptable complete response after the available retry or fallback. Reader v6 remains available unchanged.',
 timeout:'The model response timed out.',
 network:'Could not connect to the model.',
 local_only:'Offline report was requested.',
 reader_only:'Offline Reader v6 consultation.'
};

function ReportPhoto({kind,uk}:{kind:keyof typeof PHOTOS;uk:boolean}){
 const photo=PHOTOS[kind];
 return <figure className="reading-figure">
  <div className="reading-figure-photo" role="img"
   aria-label={uk?'Космічна фотографія NASA':'NASA space photograph'}
   style={{backgroundImage:'linear-gradient(100deg,rgba(10,17,27,.25),rgba(13,22,33,.08)),url("'+photo.url+'")'}}/>
  <figcaption>{uk?'Зображення: ':'Image: '}
   <a href={photo.page} target="_blank" rel="noopener noreferrer">{photo.credit} · Wikimedia Commons</a>
  </figcaption>
 </figure>;
}


type AiCard={heading:string;body:string};
function friendlyAiCards(text:string,lang:'uk'|'en'):AiCard[]{
 const headings:Record<string,{uk:string;en:string}>={
  identity:{uk:'Загальна картина',en:'The big picture'},
  planets:{uk:'Що символізують планети',en:'What the planets represent'},
  houses:{uk:'Важливі сфери життя',en:'Important areas of life'},
  aspects:{uk:'Як різні теми взаємодіють',en:'How different themes interact'},
  navamsa:{uk:'Стосунки та особисті цінності',en:'Relationships and personal values'},
  dashamsa:{uk:'Робота й самореалізація',en:'Work and fulfilment'},
  rules:{uk:'Додаткові символічні акценти',en:'Additional symbolic themes'},
  dasha:{uk:'Поточний життєвий період',en:'The current life period'}
 };
 const legacy:[RegExp,string][]=[
  [/^(?:Лагна:|Ascendant:)/i,'identity'],
  [/^(?:Повна D1:|Full D1:|Сонце:|Sun:)/i,'planets'],
  [/^(?:Дванадцять домів|Twelve houses)/i,'houses'],
  [/^(?:Класичні Парашарі|Classical Parashari)/i,'aspects'],
  [/^(?:D9, Лагна|D9 ascendant|Лагна Навамша)/i,'navamsa'],
  [/^(?:D10, Лагна|D10 ascendant|Лагна Дашамша)/i,'dashamsa'],
  [/^(?:Верифіковані правила|Verified Engine)/i,'rules'],
  [/^(?:Махадаша|Вімшоттарі|Current Mahadasha|Mahadasha)/i,'dasha']
 ];
 return text.split(/\n{2,}/).map(part=>{
  const split=part.indexOf('\n');
  if(split<0)return null;
  let heading=part.slice(0,split).trim(),body=part.slice(split+1).trim();
  if(!body)return null;
  const key=legacy.find(([pattern])=>pattern.test(heading))?.[1];
  if(key)heading=headings[key][lang];
  return {heading,body};
 }).filter((item):item is AiCard=>!!item);
}
function DirectArticle({text,lang}:{text:string;lang:'uk'|'en'}){
 // Free models may put numbered practices on the same line or escape the dot
 // in Markdown. Preserve each practice as its own readable item.
 const cleaned=text.trim().replace(/\\([1-9])\./g,'$1.')
  .replace(/([^\n])\s+(?=[12]\.\s+(?:Практика|Практичний|Практична|Practice|Step)(?:\s|:))/giu,'$1\n\n');
 const blocks=cleaned.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
 return <div className="jy-direct-article">
  {blocks.map((block,i)=>{
   const lines=block.split('\n'),heading=lines[0].match(/^#{1,3}\s+(.+)$/);
   const numbered=block.match(/^([1-9])\.\s+([\s\S]+)$/);
   return heading?<section key={i} className="jy-direct-section">
    <h3>{heading[1].replace(/\*\*/g,'')}</h3>
    {lines.slice(1).join(' ').trim()&&<p><GlossaryText text={lines.slice(1).join(' ').trim()} locale={lang}/></p>}
   </section>:numbered?<div key={i} className="jy-direct-practice">
    <span className="jy-direct-practice-number">{numbered[1]}</span>
    <p><GlossaryText text={numbered[2].replace(/\*\*/g,'')} locale={lang}/></p>
   </div>:<p key={i}><GlossaryText text={block.replace(/\*\*/g,'')} locale={lang}/></p>;
  })}
 </div>;
}
function PlainLanguageGlossary({lang}:{lang:'uk'|'en'}){
 const uk=lang==='uk';
 return <details className="reading-glossary">
  <summary>{uk?'Пояснення термінів простими словами':'Astrology terms in plain language'}</summary>
  <dl>
   <div><dt>{uk?'Дім':'House'}</dt><dd>{uk?'Одна зі сфер життя, яку розглядають у карті, наприклад робота, стосунки чи дім.':'One area of life discussed in the chart, such as work, relationships or home.'}</dd></div>
   <div><dt>{uk?'Ґраха':'Graha'}</dt><dd>{uk?'Традиційна назва небесного тіла в цій системі. Для простоти далі називатимемо їх планетами та вузлами.':'A traditional term for a celestial body in this system. For simplicity, we call them planets and nodes.'}</dd></div>
   <div><dt>{uk?'Накшатра й пада':'Nakshatra and pada'}</dt><dd>{uk?'Додаткові поділи зодіакального кола, які уточнюють положення Місяця та інших тіл.':'Smaller divisions of the zodiac used to describe a more specific position, especially the Moon.'}</dd></div>
   <div><dt>{uk?'D1, D9 та D10':'D1, D9 and D10'}</dt><dd>{uk?'Основна карта та дві допоміжні карти, які в традиції використовують для різних тем, зокрема стосунків і роботи.':'The main chart and two supplementary charts traditionally used to explore themes including relationships and work.'}</dd></div>
   <div><dt>{uk?'Даша':'Dasha'}</dt><dd>{uk?'Традиційний символічний часовий цикл. Він не гарантує подій і не замінює власних рішень.':'A symbolic timing cycle in the tradition. It does not guarantee events or replace your own decisions.'}</dd></div>
   <div><dt>{uk?'Висхідний знак (Лагна)':'Rising sign (Lagna)'}</dt><dd>{uk?'Знак, який традиція вважає висхідним на момент народження. Він задає відправну точку для порядку сфер життя.':'The sign considered to be rising at birth in this tradition. It sets the starting point for the order of life areas.'}</dd></div>
   <div><dt>{uk?'Планета-управитель':'Ruling planet'}</dt><dd>{uk?'Планета, яку традиція пов’язує з певним знаком. Її положення використовують, щоб символічно пов’язати теми двох сфер життя.':'A planet traditionally associated with a zodiac sign. Its placement is used to connect the themes of two life areas.'}</dd></div>
   <div><dt>{uk?'Йога':'Yoga'}</dt><dd>{uk?'Назва для певної комбінації положень у карті. Це символічна категорія традиції, а не обіцянка конкретної події.':'A name for a specific combination of chart placements. It is a symbolic category in the tradition, not a promise of an event.'}</dd></div>
   <div><dt>{uk?'Екзальтація й дебілітація':'Exaltation and debilitation'}</dt><dd>{uk?'Традиційні категорії положення планети у знаку. Вони не оцінюють людину й не гарантують успіху чи невдачі.':'Traditional categories for a planet’s sign placement. They do not judge a person or guarantee success or failure.'}</dd></div>
   <div><dt>{uk?'Аспект (дрішті)':'Aspect (drishti)'}</dt><dd>{uk?'Зв’язок, який традиційні правила приписують планеті щодо іншої сфери карти. Це спосіб символічного читання, а не фізичний вплив.':'A connection that traditional rules assign from a planet to another chart area. It is a symbolic reading method, not a physical effect.'}</dd></div>
   <div><dt>{uk?'Айанамша':'Ayanamsha'}</dt><dd>{uk?'Математичне зміщення, яке враховує різницю між тропічним і сидеричним зодіаком. Для читання основного пояснення його можна не запам’ятовувати.':'A mathematical offset used to account for the difference between tropical and sidereal zodiac systems. You do not need to memorize it to understand the reading.'}</dd></div>
  </dl>
 </details>;
}

/** User-readable rule evidence. Never render empty unordered-list bullets. */
function ChapterEvidence({report,chapter,lang}:{report:ReadingReport;chapter:NonNullable<ReadingReport['editorial']>['chapters'][number];lang:'uk'|'en'}){
 const rows=(report.editorial?.findings||[]).filter(f=>f.verifiedEvidence.length&&chapter.evidence.some(ev=>f.verifiedEvidence.includes(ev)));
 if(!rows.length)return null;
 return <details className="reading-portrait-evidence" data-testid={'reading-proof-'+chapter.id}>
  <summary>{lang==='uk'?'Пояснення астрологічних опор':'Explore chart evidence'} ({rows.length})</summary>
  <div className="reading-evidence-entries">{rows.map(f=><div className="reading-evidence-entry" key={f.id}>
   <p><GlossaryText text={f.traditionalMeaning} locale={lang}/></p>
   <details className="reading-evidence-technical">
    <summary>{lang==='uk'?'Перевірити розрахунок і метод':'Inspect calculation and method'}</summary>
    <code>{f.ruleId} · {f.verifiedEvidence.join(' · ')}</code>
    {f.sourceIds?.length?<small>{lang==='uk'?'Методологічні джерела (не перевірені цитати зі шлок): ':'Method sources (not verified verse quotations): '}{f.sourceIds.join(', ')}</small>:null}
   </details>
  </div>)}</div>
 </details>;
}
export default function DetailedReport({report,lang}:{report:ReadingReport;lang:'uk'|'en'}){
 const uk=lang==='uk',ai=report.ai;
 const hasLlm=ai.source==='llm'&&['openrouter','gemini','groq'].includes(ai.provider)&&Boolean(ai.text);
 const aiChapters=new Map((hasLlm?ai.chapters:[])?.map(c=>[c.id,c])||[]);
 const fullConsultation=aiChapters.size>0;
  const unified=ai.documentMode==='unified'&&aiChapters.size===8;
 const readerOnly=ai.fallbackReason==='reader_only';
 return <section className="reading-root" id="full-reading" aria-label={uk?'Детальне трактування карти':'Detailed chart interpretation'}>
  <div className="reading-kicker">{uk?'✧ ПЕРСОНАЛЬНЕ ТРАКТУВАННЯ':'✧ PERSONAL READING'}</div>
  <h2>{uk?'Ваш астрологічний портрет':'Your astrological portrait'}</h2>
  
  <p className="reading-provider" role="status" data-testid="reading-ai-provenance">{readerOnly?
   (uk?'Jyotish Reader v6 · цілісне традиційне прочитання на основі обчисленої карти.':'Jyotish Reader v6 · complete chart-grounded traditional reading.'):
   hasLlm?
   (unified?(uk?'Єдина AI-консультація · ':'Unified AI consultation · '):(uk?'Основне трактування: Jyotish Reader v6. Додаткова LLM-інтерпретація: ':'Primary reading: Jyotish Reader v6. Additional LLM interpretation: '))+
   (ai.provider==='openrouter'?'OpenRouter':ai.provider==='gemini'?'Google Gemini':ai.provider==='groq'?'GroqCloud':'Ollama')+' · '+(ai.model||'—')+
   (ai.cached?(uk?' · повторне використання перевіреної відповіді':' · cached verified response'):'')+
   (!unified&&fullConsultation?(uk?' · розділів AI: ':' · AI chapters: ')+aiChapters.size+'/8':''):
   (uk?'Основне трактування сформував Jyotish Reader v6. Відповіді від зовнішньої LLM немає. Причина: ':'Primary reading generated by Jyotish Reader v6, not an LLM. Reason: ')+
   (uk?(FALLBACK_UK[ai.fallbackReason||'']||'модель не використана'):(FALLBACK_EN[ai.fallbackReason||'']||'model not used'))}</p>
  <p className="reading-intro">{uk?
   'Спочатку — ваш цілісний портрет і головні життєві теми. Точні планетарні положення та методичні пояснення доступні під текстом.' :
   'Begin with your personal narrative. Calculation details and source facts are available beneath each chapter.'}</p>
  {/* An accepted LLM interpretation is the reader's first substantive narrative, not a collapsed appendix. */}
  {hasLlm&&ai.text&&(!ai.chapters||ai.chapters.length===0)?<article className="jy-direct-document" id="reading-ai" data-testid="jyotish-direct-consultation">
   <div className="reading-chapter-kicker">{uk?'✦ ВАШЕ ПЕРСОНАЛЬНЕ AI-ПРОЧИТАННЯ':'✦ YOUR PERSONAL AI CONSULTATION'}</div>
   <h2>{uk?'Ваш життєвий портрет за Джйотіш':'Your Jyotish life portrait'}</h2>
   <p className="jy-direct-source">{uk?'Інтерпретація створена за перевіреними даними D1, D9, D10 та даш.':'Interpretation grounded in verified D1, D9, D10 and dasha calculations.'}</p>
   <DirectArticle text={ai.text} lang={lang}/>
  </article>:null}
    {report.editorial?.chapters?.length&&(!hasLlm||Boolean(ai.chapters?.length))?<div className="reading-editorial">
   <div className="reading-editorial-opening">
    <div className="reading-chapter-kicker">{uk?'✦ ПЕРСОНАЛЬНЕ ПРОЧИТАННЯ':'✦ YOUR PERSONAL READING'}</div>
    <h3>{uk?'Про вашу особистість, стосунки, кар’єру та життєві орієнтири':'Personality, relationships, work and life direction'}</h3>
    <p>{uk?'Ця карта — історія про ваші сили, вибори та внутрішній ритм. Ми читаємо її через лагну, управителів домів, планети й даші, поєднуючи їх у цілісне традиційне прочитання. Точні астрологічні опори можна розкрити під кожним розділом.':'Your chart tells a connected story of strengths, choices and inner rhythms. We read it through the ascendant, house rulers, planetary placements and dashas, with verifiable astrological details available beneath each chapter.'}</p>
   </div>
   <ol className="reading-principles" aria-label={uk?'Основні акценти карти':'Chart highlights'}>
    {report.editorial.highlights.map((h,i)=>{
     const separator=h.indexOf(':');
     const title=separator>0?h.slice(0,separator):(uk?'Ключова тема':'Key theme');
     const detail=separator>0?h.slice(separator+1).trim():h;
     return <li className="reading-principle" key={i}>
      <span className="reading-principle-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
      <div className="reading-principle-content">
       <h4>{title}</h4>
       <p><GlossaryText text={detail} locale={lang}/></p>
      </div>
     </li>;
    })}
   </ol>
   <div className="reading-editorial-chapters">
    {report.editorial.chapters.map((chapter,i)=><article className="reading-editorial-chapter" key={chapter.id} id={'reading-story-'+chapter.id}>
      <div className="reading-editorial-chapter-header"><span>{String(i+1).padStart(2,'0')}</span><h3>{chapter.title}</h3></div>
      <p className="reading-provider" data-testid={'reading-chapter-source-'+chapter.id}>{unified?(uk?'✧ Єдине AI-прочитання':'✧ Unified AI reading'):aiChapters.has(chapter.id)?(uk?'✧ Трактування LLM · автоматична перевірка окремих тверджень':'✧ LLM interpretation · partial automated claim checks'):(uk?'✦ Трактування за розрахованими даними':'✦ Calculation-based traditional reading')}</p>
      {(aiChapters.get(chapter.id)?.paragraphs||chapter.paragraphs).map((p,j)=><p key={j}><GlossaryText text={p} locale={lang}/></p>)}
      {false&&chapter.id==='elements'?<div className="reading-elements" aria-label={uk?'Підрахунок стихій':'Element count'}>
       {report.editorial!.elements.map(e=><div className="reading-element" key={e.name}>
        <div><strong>{e.name}</strong><span>{e.count} / 7 · {e.percentage}%</span></div>
        <div className="reading-element-track"><div style={{width:e.percentage+'%'}}/></div>
       </div>)}
       <small>{uk?'Частки семи класичних планет за знаками, не психологічний рейтинг.':'Share of seven classical grahas by sign; not a psychological score.'}</small>
      </div>:null}
      <ChapterEvidence report={report} chapter={chapter} lang={lang}/>
     </article>)}
   </div>
   <details className="reading-glossary"><summary>{uk?'Технічний додаток: баланс стихій':'Technical appendix: element distribution'}</summary>
    <div className="reading-elements">{report.editorial.elements.map(e=><div className="reading-element" key={e.name}><div><strong>{e.name}</strong><span>{e.count} / 7 · {e.percentage}%</span></div><div className="reading-element-track"><div style={{width:e.percentage+'%'}}/></div></div>)}</div>
    <p>{report.editorial.method}</p>
   </details>
  </div>:null}

  {!report.editorial?.chapters?.length?<>
  {report.practicalTips?.length?<section className="reading-practical" aria-label={uk?'Поради на основі карти':'Chart-inspired practical ideas'}>
    <div className="reading-chapter-kicker">{uk?'✦ ПРАКТИЧНІ ІДЕЇ':'✦ PRACTICAL IDEAS'}</div>
    <h3>{uk?'Що можна спробувати вже цього тижня':'What you can try this week'}</h3>
    <p className="reading-chapter-lead">{uk?'Це невеликі безпечні експерименти для саморефлексії, підібрані за розрахованими положеннями карти. Вони не є прогнозами або обов’язковими правилами життя.':'Small, low-risk experiments for reflection, selected from calculated chart placements. These are not predictions or required life choices.'}</p>
    <div className="reading-practical-grid">{report.practicalTips.map(t=><article className="reading-practical-card" key={t.id}>
      <h4>{t.title}</h4>
      <p>{t.meaning}</p>
      <p>{t.example}</p>
      <div className="reading-practical-action"><strong>{uk?'Спробуйте':'Try this'}</strong><p>{t.action}</p></div>
    </article>)}</div>
   </section>:null}
  {report.lifePortrait?.chapters?.length?<section className="reading-portrait" aria-label={uk?'Цілісний життєвий портрет':'Whole-life profile'}>
    <div className="reading-chapter-kicker">{uk?'✦ ЦІЛІСНИЙ ПОРТРЕТ':'✦ WHOLE-LIFE PROFILE'}</div>
    <h3>{uk?'Таланти, стосунки, фінанси, робота і ваш розвиток':'Strengths, relationships, resources, work and growth'}</h3>
    <p className="reading-chapter-lead">{uk?'Ці розділи складає перевірений алгоритм з конкретних положень карти. Вони показують теми для саморефлексії, а не факти про вашу особистість чи передбачення майбутнього.':'These sections are generated from verified chart placements, as themes for reflection rather than facts about your personality or future predictions.'}</p>
    <div className="reading-portrait-grid">{report.lifePortrait.chapters.map(chapter=><article key={chapter.id} className="reading-portrait-card">
     <h4>{chapter.title}</h4>
     <p>{chapter.overview}</p>
     <p>{chapter.example}</p>
     <div className="reading-practical-action"><strong>{uk?'Що зробити на практиці':'Try in real life'}</strong><p>{chapter.action}</p></div>
     <details className="reading-portrait-evidence"><summary>{uk?'На чому ґрунтується':'Verified source facts'}</summary><code>{chapter.evidence.join(' · ')}</code></details>
    </article>)}</div>
   </section>:null}
  {hasLlm&&friendlyAiCards(ai.text,lang).length>0?<section className="reading-llm reading-llm-summary" id="reading-ai">
   <div className="reading-chapter-kicker">{uk?'✧ ГОЛОВНЕ — ПРОСТИМИ СЛОВАМИ':'✧ THE BIG PICTURE — IN PLAIN LANGUAGE'}</div>
   <h3>{uk?'Що це може означати у повсякденному житті':'What this may mean in everyday life'}</h3>
   <p className="reading-chapter-lead">{uk?'Без складних термінів і категоричних прогнозів — лише символічні теми для роздумів.':'No complicated terminology or absolute predictions — just symbolic themes to reflect on.'}</p>
   {['openrouter','gemini','groq','ollama'].includes(ai.provider)?
    <>
     <p className="reading-provider">{(ai.provider==='openrouter'?'OpenRouter':ai.provider==='gemini'?'Google Gemini':ai.provider==='groq'?'GroqCloud':'Ollama')+(ai.model?' · '+ai.model:'')} · {uk?'без платного OpenAI':'no paid OpenAI'}</p>
     <div className="reading-ai-text">
      {friendlyAiCards(ai.text,lang).map((card,index)=><article className="reading-ai-card" key={index}>
       <h4>{card.heading}</h4><p><GlossaryText text={card.body} locale={lang}/></p>
      </article>)}
     </div>
     {!friendlyAiCards(ai.text,lang).length?<p className="reading-paragraph">{uk?'Не вдалося розібрати короткий AI-підсумок. Детальний розрахований звіт доступний нижче.':'The AI summary could not be displayed. The detailed calculated report is available below.'}</p>:null}
    </>:
    <>
     <p className="reading-paragraph">{uk?'Безкоштовна AI-модель зараз не змогла надати перевірену відповідь. Конкретні ідеї вище та детальний звіт нижче сформовані за перевіреними розрахунками.':'The AI summary is unavailable right now, but the detailed report below is built from calculated data.'}</p>
     <p className="reading-provider">{uk?(FALLBACK_UK[ai.fallbackReason||'']||'Показано детальний звіт без AI'): (FALLBACK_EN[ai.fallbackReason||'']||'Showing the detailed report without AI')}</p>
    </>}
   <p className="reading-ai-disclaimer">{uk?'Це символічне прочитання традиції Джйотіш, а не гарантований прогноз. Використовуйте його як привід для роздумів, а не як єдину основу важливих рішень.':'This is a symbolic reading from the Jyotish tradition, not a guaranteed prediction. Use it for reflection, not as the sole basis for important decisions.'}</p>
  </section>:null}
  </>:null}
  <details className="reading-technical" id="reading-details">
   <summary><span>{uk?'Астрологічні розрахунки та джерела':'Astrological calculations and sources'}</span>
    <small>{uk?'Необов’язково · для тих, хто хоче розібратися глибше':'Optional · for readers who want to explore the calculations'}</small></summary>
   <div className="reading-technical-inner">
    <p>{uk?'Ці дані пояснюють, на яких положеннях і правилах засновано трактування. Вони потрібні для перевірки точності, але не для розуміння основного тексту.':'These placements and rules explain how the interpretation was derived. You do not need them to understand the main reading.'}</p>
    <p className="reading-version">{report.rulesVersion?(uk?'Версія правил: ':'Rules version: ')+report.rulesVersion:''}{report.asOf?' · '+report.asOf:''}{report.rulesDigest?' · SHA-256 '+report.rulesDigest.slice(0,12):''}</p>
    <PlainLanguageGlossary lang={lang}/>
    <nav className="reading-toc" aria-label={uk?'Зміст розрахунків':'Calculation contents'}>
     {NAV.map(([id,ua,en],index)=><a key={id} href={'#reading-'+id}><span>{String(index+1).padStart(2,'0')}</span> {uk?ua:en}</a>)}
    </nav>
    <div className="reading-content">
     {report.sections.map(section=><article key={section.id} id={'reading-'+section.id} className={'reading-chapter '+(section.id==='portrait'?'reading-chapter-hero':'')+(section.id.startsWith('planet-')||section.id.startsWith('house-')?' reading-chapter-small':'')}>
      {section.image?<ReportPhoto kind={section.image} uk={uk}/>:null}
      <div className="reading-chapter-copy">
       <div className="reading-chapter-kicker">{section.eyebrow}</div>
       <h3>{section.heading}</h3>
       <p className="reading-chapter-lead"><GlossaryText text={section.lead} locale={lang}/></p>
       {section.paragraphs.map((paragraph,i)=><p key={i} className="reading-paragraph"><GlossaryText text={paragraph} locale={lang}/></p>)}
       {section.facts?.length?<details className="reading-facts"><summary>{uk?'Показати точні дані карти':'Show precise chart data'}</summary><ul>{section.facts.map((fact,i)=><li key={i}><GlossaryText text={fact} locale={lang}/></li>)}</ul></details>:null}
      </div>
     </article>)}
    </div>
    {report.ruleFacts?.length?<details className="reading-provenance">
     <summary>{uk?'Перевірити правила та вихідні дані':'Inspect rules and source evidence'}</summary>
     <div className="reading-provenance-list">{report.ruleFacts.map(f=><div key={f.id}>
      <strong>{f.id}</strong> <span>{f.rule}</span><small>{f.evidence.join(' · ')}</small>
     </div>)}</div>
    </details>:null}
   </div>
  </details>
  <div className="reading-end">
   <span>✧</span>
   <p>{uk?'Від зоряних положень — до цілісного прочитання карти.':'From stellar positions to a coherent view of the chart.'}</p>
   <a href="#interpretation">{uk?'Повернутися до кнопки трактування ↑':'Back to interpretation button ↑'}</a>
  </div>
 </section>;
}
