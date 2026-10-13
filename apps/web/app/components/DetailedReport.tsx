'use client';

export type ReadingSection={
 id:string;heading:string;eyebrow:string;lead:string;paragraphs:string[];
 facts?:string[];image?:'cosmos'|'earth'|'nebula';
};
export type ReadingReport={
 sections:ReadingSection[];generatedAt:string;chartSummary:string;language:'uk'|'en';
 practicalTips?:{id:string;title:string;meaning:string;example:string;action:string;evidence:string[]}[];
 asOf?:string;rulesVersion?:string;rulesDigest?:string;ruleFacts?:{id:string;rule:string;subject:string;values:Record<string,string|number|boolean>;evidence:string[]}[];
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
 invalid_response:'AI-пояснення не пройшло перевірку точності. Поради та розрахований звіт залишаються доступними.',
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
 invalid_response:'AI commentary did not pass factual checks. Practical suggestions and the calculated report remain available.',
 timeout:'The model response timed out.',
 network:'Could not connect to the model.',
 local_only:'Offline report was requested.'
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

export default function DetailedReport({report,lang}:{report:ReadingReport;lang:'uk'|'en'}){
 const uk=lang==='uk',ai=report.ai;
 return <section className="reading-root" id="full-reading" aria-label={uk?'Детальне трактування карти':'Detailed chart interpretation'}>
  <div className="reading-kicker">{uk?'✧ ПЕРСОНАЛЬНЕ ТРАКТУВАННЯ':'✧ PERSONAL READING'}</div>
  <h2>{uk?'Ваш астрологічний портрет':'Your astrological portrait'}</h2>
  <p className="reading-version">{report.rulesVersion?(uk?'Перевірені правила · Engine ':'Verified rules · Engine ')+report.rulesVersion:''}{report.asOf?' · '+(uk?'Станом на ':'As of ')+report.asOf:''}{report.rulesDigest?' · SHA-256 '+report.rulesDigest.slice(0,12):''}</p>
  <p className="reading-intro">{uk?
   'Спочатку — коротке пояснення звичайною мовою. Нижче — детальні розділи для тих, хто хоче розібратися глибше.' :
   'Start with a plain-language summary. Detailed chapters follow for anyone who wants to explore further.'}</p>
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
  <section className="reading-llm reading-llm-summary" id="reading-ai">
   <div className="reading-chapter-kicker">{uk?'✧ ГОЛОВНЕ — ПРОСТИМИ СЛОВАМИ':'✧ THE BIG PICTURE — IN PLAIN LANGUAGE'}</div>
   <h3>{uk?'Що це може означати у повсякденному житті':'What this may mean in everyday life'}</h3>
   <p className="reading-chapter-lead">{uk?'Без складних термінів і категоричних прогнозів — лише символічні теми для роздумів.':'No complicated terminology or absolute predictions — just symbolic themes to reflect on.'}</p>
   {ai.provider==='openrouter'||ai.provider==='ollama'?
    <>
     <p className="reading-provider">{(ai.provider==='openrouter'?'OpenRouter':'Ollama')+(ai.model?' · '+ai.model:'')} · {uk?'без платного OpenAI':'no paid OpenAI'}</p>
     <div className="reading-ai-text">
      {friendlyAiCards(ai.text,lang).map((card,index)=><article className="reading-ai-card" key={index}>
       <h4>{card.heading}</h4><p>{card.body}</p>
      </article>)}
     </div>
     {!friendlyAiCards(ai.text,lang).length?<p className="reading-paragraph">{uk?'Не вдалося розібрати короткий AI-підсумок. Детальний розрахований звіт доступний нижче.':'The AI summary could not be displayed. The detailed calculated report is available below.'}</p>:null}
    </>:
    <>
     <p className="reading-paragraph">{uk?'Безкоштовна AI-модель зараз не змогла надати перевірену відповідь. Конкретні ідеї вище та детальний звіт нижче сформовані за перевіреними розрахунками.':'The AI summary is unavailable right now, but the detailed report below is built from calculated data.'}</p>
     <p className="reading-provider">{uk?(FALLBACK_UK[ai.fallbackReason||'']||'Показано детальний звіт без AI'): (FALLBACK_EN[ai.fallbackReason||'']||'Showing the detailed report without AI')}</p>
    </>}
   <p className="reading-ai-disclaimer">{uk?'Це символічне прочитання традиції Джйотіш, а не гарантований прогноз. Використовуйте його як привід для роздумів, а не як єдину основу важливих рішень.':'This is a symbolic reading from the Jyotish tradition, not a guaranteed prediction. Use it for reflection, not as the sole basis for important decisions.'}</p>
  </section>
  <PlainLanguageGlossary lang={lang}/>
  <nav className="reading-toc" aria-label={uk?'Зміст трактування':'Report contents'}>
   {NAV.map(([id,ua,en],index)=><a key={id} href={'#reading-'+id}><span>{String(index+1).padStart(2,'0')}</span> {uk?ua:en}</a>)}
  </nav>
  <div className="reading-content">
   {report.sections.map((section,index)=><div key={section.id}>
    <article id={'reading-'+section.id} className={'reading-chapter '+(section.id==='portrait'?'reading-chapter-hero':'')+(section.id.startsWith('planet-')||section.id.startsWith('house-')?' reading-chapter-small':'')}>
      {section.image?<ReportPhoto kind={section.image} uk={uk}/>:null}
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

   </div>)}
  </div>
  {report.ruleFacts?.length?<details className="reading-provenance">
   <summary>{uk?'Перевірити правила й вихідні дані':'Inspect rule IDs and source evidence'}</summary>
   <p>{uk?'Кожен факт сформовано алгоритмом, не мовною моделлю. Хеш і дата дозволяють перевіряти відтворюваність розрахованого звіту.':'Every fact comes from deterministic rules, not an LLM. The digest and reference date identify the reproducible calculated report.'}</p>
   <div className="reading-provenance-list">{report.ruleFacts.map(f=><div key={f.id}>
    <strong>{f.id}</strong> <span>{f.rule}</span>
    <small>{f.evidence.join(' · ')}</small>
   </div>)}</div>
  </details>:null}
  <div className="reading-end">
   <span>✧</span>
   <p>{uk?'Від зоряних положень — до цілісного прочитання карти.':'From stellar positions to a coherent view of the chart.'}</p>
   <a href="#interpretation">{uk?'Повернутися до кнопки трактування ↑':'Back to interpretation button ↑'}</a>
  </div>
 </section>;
}
