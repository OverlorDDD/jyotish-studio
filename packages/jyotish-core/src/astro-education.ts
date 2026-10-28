/** Verified-event educational interpretation. Traditional Jyotish practice is
 * deliberately separate from astronomical facts; no medical or causal claims.
 */
import type {EventKind,AstronomicalEvent} from './astronomical-events.js';
export type Locale='uk'|'en';
export type EventInsight={meaning:string;tradition:string;practice:string;limits:string};
const D:Record<EventKind,Record<Locale,EventInsight>>={
 new_moon:{uk:{meaning:'Молодик — геоцентричне сполучення Сонця й Місяця: їхні екліптичні довготи збігаються, а освітлений бік Місяця майже не видно із Землі.',tradition:'У традиційному місячному календарі це межа циклу. У Джйотіш цей час співвідносять із внутрішнім підсумком і новими намірами.',practice:'Заверши одну невелику справу, запиши один намір на найближчі два тижні й виділи 10 хвилин для спокійного спостереження.',limits:'Немає надійного підтвердження, що сам молодик визначає настрій, здоров’я або результат рішень кожної людини.'},
 en:{meaning:'New Moon occurs at geocentric Sun–Moon conjunction; the illuminated lunar face is nearly invisible from Earth.',tradition:'Vedic lunar calendars treat the conjunction as a cycle boundary; practitioners associate it with reflection and intention.',practice:'Close one small task, write one practical intention for the next fortnight and spend ten minutes in quiet reflection.',limits:'The New Moon does not establish a proven universal causal effect on mood, health or personal outcomes.'}},
 first_quarter:{uk:{meaning:'Перша чверть: кутова відстань між Сонцем і Місяцем приблизно 90°; бачимо освітлену половину місячного диска.',tradition:'У символічному читанні це період розвитку започаткованих намірів.',practice:'Перевір, що вже зроблено для однієї обраної мети; визнач наступний конкретний крок.',limits:'Це традиційне тлумачення, а не передбачення подій.'},en:{meaning:'First Quarter: the Sun–Moon ecliptic elongation is about 90° and roughly half the lunar face is illuminated.',tradition:'Traditional readings associate it with making progress on intentions.',practice:'Review one goal and choose a small next step.',limits:'Symbolic guidance, not a prediction.'}},
 full_moon:{uk:{meaning:'Повня — геоцентрична опозиція Сонця й Місяця (180°); майже весь видимий диск Місяця освітлений.',tradition:'У багатьох ведичних традиціях Пурніма — день підсумків, подяки та духовної практики.',practice:'Підсумуй завершені справи, подякуй за підтримку, присвяти час спокійній практиці або читанню.',limits:'Повня сама по собі не дає достовірного прогнозу поведінки чи здоров’я.'},en:{meaning:'Full Moon is geocentric Sun–Moon opposition (180°), with almost all of the lunar face illuminated.',tradition:'Many Vedic observances associate Purnima with gratitude and reflection.',practice:'Review completed work, express gratitude and choose a calm practice or reading.',limits:'A full moon is not a reliable prediction of anyone’s behavior or health.'}},
 last_quarter:{uk:{meaning:'Остання чверть: Місяць на кутовій відстані 270° від Сонця; бачимо приблизно половину диска.',tradition:'У традиційному циклі це нагода переглянути зайве перед новим місяцем.',practice:'Переглянь незавершені справи та відмовся від одного необов’язкового зобов’язання.',limits:'Порада належить до символічної практики.'},en:{meaning:'Last Quarter occurs at a 270° Sun–Moon ecliptic elongation.',tradition:'A traditional phase for reassessment before the next cycle.',practice:'Review unfinished tasks and release one optional obligation.',limits:'This is a symbolic practice, not a causal claim.'}},
 sidereal_ingress:{uk:{meaning:'Перехід: геоцентрична сидерична довгота планети перетнула межу знака 30° у системі Лахірі.',tradition:'У Джйотіш зміна раші означає новий контекст для тлумачення гочари; його значення залежить від натальної карти й дому.',practice:'Зверни увагу на тему планети, але перед важливими рішеннями звір реальні обставини.',limits:'Сам перехід не визначає однаковий прогноз для всіх людей.'},en:{meaning:'Sidereal ingress: a geocentric planet longitude crosses a 30° sign boundary in the Lahiri system.',tradition:'Jyotish interprets a rashi transition in the context of natal houses and individual transits.',practice:'Notice the symbolic topic of the planet while basing real decisions on actual circumstances.',limits:'No identical outcome is implied for all people.'}},
 retrograde_station:{uk:{meaning:'Ретроградна станція — момент зміни знака видимої геоцентричної швидкості довготи. Планета фізично не починає рухатися назад орбітою.',tradition:'У традиції Джйотіш це привід уважніше переглянути питання, пов’язані з планетою.',practice:'Перевір один незавершений план або домовленість; не приймай рішень тільки через слово «ретроградний».',limits:'Це видимий геоцентричний рух, а не доведений вплив на техніку чи стосунки.'},en:{meaning:'Retrograde station is a change in the sign of apparent geocentric longitude speed, not a planet reversing its orbital motion.',tradition:'Jyotish uses this as a context for reexamining a planet’s themes.',practice:'Review one unfinished plan, without treating retrograde as the sole basis for decisions.',limits:'No scientifically established direct impact on devices or relationships.'}},
 direct_station:{uk:{meaning:'Директна станція — момент, коли видима геоцентрична довгота знову починає збільшуватися.',tradition:'У традиційному прочитанні це символ відновлення руху вперед після перегляду.',practice:'Повернися до одного відкладеного проєкту й визнач реалістичний наступний крок.',limits:'Символічна інтерпретація, а не гарантія успіху.'},en:{meaning:'Direct station marks the return to increasing apparent geocentric longitude.',tradition:'Traditionally associated with resuming movement after reflection.',practice:'Choose one realistic next step in a paused project.',limits:'A symbolic interpretation, not an outcome guarantee.'}}
};
export function eventInsight(kind:EventKind,locale:Locale):EventInsight{return D[kind][locale];}

/** Contextual calendar interpretation: reuse measured event facts, never invent a
 * natal house, a real-world event or a new transit to vary the daily prose.
 * Adjacent entries for different planets/signs remain editorially distinct. */
const PLANET_CONTEXT:Record<string,{uk:[string,string];en:[string,string]}>={
 Sun:{uk:['самовираження та відповідальність','сформулюй одне рішення, за яке готовий відповідати'],en:['identity and responsibility','write down one choice you can own']},
 Moon:{uk:['звички, дім і відчуття підтримки','визнач, яка щоденна звичка додає тобі спокою'],en:['habits, home and emotional support','notice one daily habit that restores calm']},
 Mercury:{uk:['розмови, документи й навчання','перечитай одне важливе повідомлення перед надсиланням'],en:['communication, paperwork and learning','review one important message before sending it']},
 Venus:{uk:['стосунки, творчість і цінності','обговори очікування з близькою людиною без натяків'],en:['relationships, creativity and values','communicate one expectation clearly']},
 Mars:{uk:['ініціатива, межі й енергія дії','обери одне невелике завдання й виконай його без поспіху'],en:['initiative, boundaries and action','finish one small task without rushing']},
 Jupiter:{uk:['знання, наставництво й довгострокові цілі','прочитай кілька сторінок корисної книги й занотуй висновок'],en:['learning, mentoring and longer-term goals','read a few useful pages and note one insight']},
 Saturn:{uk:['дисципліна, строки й витривалість','переглянь свій графік і прибери одне зайве зобов’язання'],en:['discipline, deadlines and endurance','review your schedule and remove one unnecessary obligation']}
};
const SIGN_CONTEXT={
 uk:['ініціативи та сміливого початку','матеріальної опори й послідовності','розмов та обміну знаннями','дому, родини та турботи','творчості та відкритого самовираження','порядку, здорових звичок та уваги до деталей','партнерства й справедливих домовленостей','довіри, змін і глибинної роботи','навчання, подорожей та пошуку сенсу','обов’язків, кар’єри й планування','спільнот, дружби та нових ідей','співпереживання, відпочинку й внутрішнього життя'],
 en:['initiative and courageous beginnings','material stability and consistency','communication and shared knowledge','home, family and care','creativity and self-expression','order, everyday habits and detail','partnership and fair agreements','trust, change and deep inquiry','learning, travel and meaning','responsibility, work and planning','community, friendships and fresh ideas','compassion, rest and inner life']
};
const SIGN_LABELS={
 uk:['Овна','Тельця','Близнюків','Рака','Лева','Діви','Терезів','Скорпіона','Стрільця','Козорога','Водолія','Риб'],
 en:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
};
export function contextualEventInsight(event:{kind:EventKind;body?:string;fromSign?:number;toSign?:number;atUtc?:string},locale:Locale):EventInsight{
 const base=eventInsight(event.kind,locale);
 const p=event.body?PLANET_CONTEXT[event.body]:undefined;
 if(!p)return base;
 const ctx=p[locale];
 const destination=event.toSign;
 if(event.kind==='sidereal_ingress'&&typeof destination==='number'&&Number.isInteger(destination)&&destination>=1&&destination<=12){
  const sign=SIGN_LABELS[locale][destination-1],area=SIGN_CONTEXT[locale][destination-1];
  const origin=event.fromSign&&event.fromSign>=1&&event.fromSign<=12?SIGN_LABELS[locale][event.fromSign-1]:'';
  const planetUk=({Sun:'Сонце',Moon:'Місяць',Mercury:'Меркурій',Venus:'Венера',Mars:'Марс',Jupiter:'Юпітер',Saturn:'Сатурн'} as Record<string,string>)[event.body||'']||event.body;
  const moved=event.body==='Sun'?'перейшло':event.body==='Venus'?'перейшла':'перейшов';
  return {
   meaning:locale==='uk'?
    `${planetUk} ${moved} ${origin?'зі знака '+origin+' до знака '+sign:'до знака '+sign}. Це розрахований момент переходу, а не загальне припущення для цього дня.`:
    `${event.body} entered ${sign}${origin?' from '+origin:''}, at a calculated sidereal sign boundary.`,
   tradition:locale==='uk'?
    `У Джйотіш ${ctx[0]} тепер розглядають крізь теми ${area}. Для персонального висновку важливо знати дім і положення планети у твоїй натальній карті.`:
    `Jyotish connects ${ctx[0]} with ${area} during this sign transit. Personal houses require a natal chart.`,
   practice:locale==='uk'?
    `Практика для цієї події: ${ctx[1]}. Пов’яжи це з темою ${area}, якщо вона зараз актуальна для тебе.`:
    `A concrete practice: ${ctx[1]}. Relate it to ${area} only where it fits your life.`,
   limits:base.limits
  };
 }
 if(event.kind==='retrograde_station'||event.kind==='direct_station'){
  return {...base,
   tradition:locale==='uk'?
    `У Джйотіш момент зміни видимого руху ${event.body==='Mercury'?'Меркурія':event.body==='Venus'?'Венери':event.body==='Mars'?'Марса':event.body==='Jupiter'?'Юпітера':event.body==='Saturn'?'Сатурна':event.body==='Sun'?'Сонця':'Місяця'} пов’язують із переосмисленням теми: ${ctx[0]}.`:
    `This change in ${event.body}'s apparent motion is traditionally linked to revisiting ${ctx[0]}.`,
   practice:locale==='uk'?`Конкретний крок: ${ctx[1]}.`:`A concrete step: ${ctx[1]}.`};
 }
 return base;
}

export function nearestEvents(events:AstronomicalEvent[],referenceUtc:string,max=4){
 const ms=Date.parse(referenceUtc);
 return events.filter(e=>Number.isFinite(Date.parse(e.atUtc))&&Math.abs(Date.parse(e.atUtc)-ms)<=7*86400000)
 .sort((a,b)=>Math.abs(Date.parse(a.atUtc)-ms)-Math.abs(Date.parse(b.atUtc)-ms)).slice(0,max);
}
