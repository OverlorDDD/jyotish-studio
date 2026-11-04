import type {ReactNode} from 'react';
const ITEMS=[
 ['D1','Раші — основа','Rashi — foundation','Знаки, доми, планети, управителі','Signs, houses, planets and their lords'],
 ['D2','Хора — ресурси','Hora — resources','Традиційне читання матеріального забезпечення','Traditional perspective on material resources'],
 ['D3','Дреккана — ініціатива','Drekkana — initiative','Сміливість, взаємодія з братами й сестрами','Courage and sibling connections'],
 ['D4','Чатуртхамша — оселя','Chaturthamsa — home','Власність, житло й родинна опора','Home, property and foundations'],
 ['D7','Саптамша — наступництво','Saptamsa — continuity','Діти, виховання і творчі продовження','Children, care and creative continuity'],
 ['D9','Навамша — стосунки','Navamsa — partnership','Зрілість планет, цінності, партнерство','Planetary maturity, values, partnership'],
 ['D10','Дашамша — робота','Dashamsa — vocation','Професійна роль, реалізація і відповідальність','Professional contribution and responsibility'],
 ['D12','Двадашамша — родина','Dwadasamsa — family','Батьки і передача досвіду поколінь','Parents and generational connections'],
 ['D16','Шодашамша — комфорт','Shodasamsa — comforts','Умови життя і засоби пересування','Conveniences and transportation'],
 ['D20','Вімшамша — духовність','Vimsamsa — spiritual practice','Дисципліна, споглядання і традиційні практики','Discipline, contemplation and practice'],
 ['D24','Сіддхамша — освіта','Siddhamsa — learning','Навчання, знання та майстерність','Learning, knowledge and mastery'],
 ['D27','Бхамша — витривалість','Bhamsha — resilience','Сильні та вразливі сторони','Traditional strengths and vulnerabilities'],
 ['D30','Трімшамша — випробування','Trimsamsa — difficulties','Особлива карта з нерівними частинами знака','A special chart with unequal sign sectors'],
 ['D40','Кхаведамша — материнська лінія','Khavedamsa — maternal lineage','Родинна спадщина материнської сторони','Maternal family lineage'],
 ['D45','Акшаведамша — батьківська лінія','Akshavedamsa — paternal lineage','Родинна спадщина батьківської сторони','Paternal family lineage'],
 ['D60','Шаштіамша — тонкі відмінності','Shashtiamsa — fine distinctions','Дуже чутлива до похибки часу народження','Especially sensitive to birth-time uncertainty'],
] as const;
function Faq({question,children}:{question:string;children:ReactNode}){
 return <details className="as-faq-item"><summary>{question}</summary><p>{children}</p></details>;
}
/** Crawlable editorial text only; never embeds a visitor's private natal data. */
export default function VargaSeoGuide({locale}:{locale:'uk'|'en'}){
 const uk=locale==='uk';
 return <section className="as-wellness as-academy-detail n4-seo-guide" aria-labelledby="n4-seo-title">
  <div className="n4-seo-inner">
   <div className="eyebrow">{uk?'ПОСІБНИК ДЖЙОТІШ':'JYOTISH FIELD GUIDE'}</div>
   <h2 id="n4-seo-title">{uk?'16 дробових карт Джйотіш: яку карту обрати?':'The 16 Vedic divisional charts: which one should you use?'}</h2>
   <p>{uk?
    'Одна натальна карта містить багато символічних ракурсів. У традиції Парашарі D1 залишається основою, а інші варги допомагають уважніше дослідити окремі теми. Для будь-якої D-карти потрібні дата, місце й точний час народження.':
    'A birth chart offers several symbolic perspectives. In the Parashari tradition, D1 remains the foundation, while other vargas explore specific themes. Each divisional chart uses the birth date, location and accurate time.'}</p>
   <div className="n4-seo-list">{ITEMS.map(([code,ukName,enName,ukDesc,enDesc])=><article key={code}>
    <h3>{code} · {uk?ukName:enName}</h3><p>{uk?ukDesc:enDesc}</p></article>)}</div>
   <h3>{uk?'Поширені запитання про варги':'Frequently asked questions about divisional charts'}</h3>
   <Faq question={uk?'Чим D9 відрізняється від D1?':'How is D9 different from D1?'}>
    {uk?'D1 — основна Раші-карта. D9, або Навамша, перераховує ті самі сидеричні положення за дев’ятьма частинами кожного знака. Її читають разом із D1, а не замість основної карти.':'D1 is the primary Rashi chart. D9, or Navamsa, remaps the same sidereal positions through nine divisions of each sign. It is interpreted with D1, not as a replacement.'}
   </Faq>
   <Faq question={uk?'Навіщо потрібна D10 для кар’єри?':'Why look at the D10 career chart?'}>
    {uk?'Дашамша — традиційний додатковий погляд на працю, обов’язки і професійну роль. Він не передбачає конкретного роботодавця або зарплату й не скасовує загальних показників D1.':'Dashamsa is a traditional supplementary view of work, responsibilities and vocation. It does not predict a specific employer or salary and does not override D1.'}
   </Faq>
   <Faq question={uk?'Чи можна розрахувати D60 без точного часу?':'Can I use D60 without an exact birth time?'}>
    {uk?'D60 розділяє знак на 60 частин по 30 кутових хвилин. Лагна D60 може змінитися через невелику помилку часу народження. Для відповідального читання варто перевірити стабільність за фактично перерахованими варіантами часу.':'D60 divides each sign into sixty half-degree sectors. Its ascendant may change after a small birth-time correction. Meaningful use requires checking stability across recomputed times.'}
   </Faq>
   <Faq question={uk?'Чи однаково всі програми обчислюють варги?':'Do all calculators use the same varga method?'}>
    {uk?'Ні. Наприклад, для Хори D2 та Трімшамші D30 існують кілька традиційних методик. Galaxiora показує конкретний профіль правил, а не змішує результати різних шкіл.':'No. Hora D2 and Trimsamsa D30 have multiple traditional methods. Galaxiora pins the chosen method rather than silently mixing conventions.'}
   </Faq>
   <p><a href="#calculator">{uk?'Розрахувати свою натальну карту і порівняти 16 варг':'Calculate a birth chart and compare the 16 vargas'}</a></p>
  </div>
 </section>;
}
