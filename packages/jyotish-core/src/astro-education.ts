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
const MOON_SIGN_READING={
 uk:[
  ['сміливі починання та бажання діяти одразу','обери одне невелике завдання і зроби перший крок, не беручись за все одночасно'],
  ['побут, комфорт і відчуття стабільності','прибери одну незручність удома або впорядкуй щоденні витрати'],
  ['спілкування, цікавість і обмін новинами','поговори з людиною, яку давно хотів почути, й постав їй конкретне запитання'],
  ['рідних, дім і потребу в душевному спокої','знайди час для короткої щирої розмови з близькою людиною'],
  ['творчість, радість і бажання проявитися','присвяти пів години заняттю, в якому можеш творити без оцінювання'],
  ['увагу до деталей, здорові звички та порядок','упорядкуй одну справу, що давно накопичувала дрібні клопоти'],
  ['партнерство, діалог і справедливий обмін','відкрито обговори одну домовленість, яку обидві сторони розуміють по-різному'],
  ['глибокі переживання, довіру та внутрішні зміни','запиши, що саме тебе тривожить, і відокрем факти від припущень'],
  ['нові знання, подорожі й пошук сенсу','прочитай або прослухай щось нове й запиши одну ідею для себе'],
  ['відповідальність, плани та довгострокові цілі','перевір найближчий дедлайн і розбий складне завдання на два кроки'],
  ['дружбу, спільні задуми та незалежне мислення','поділися ідеєю зі спільнотою або напиши другові з пропозицією'],
  ['уяву, співчуття та необхідність відпочинку','вимкни зайві сповіщення й виділи час для тихої прогулянки']
 ] as [string,string][],
 en:[
  ['new beginnings and the urge to act','take one small first step rather than starting everything at once'],
  ['comfort, stability and everyday needs','improve one thing in your home or review a practical expense'],
  ['conversation, curiosity and exchanging ideas','call someone you have meant to speak to and ask a thoughtful question'],
  ['home, family and emotional security','make space for a sincere conversation with someone close'],
  ['creativity, pleasure and self-expression','spend half an hour creating something without judging the result'],
  ['daily routines, detail and practical care','tidy up one small unfinished task that has accumulated'],
  ['partnership, fairness and dialogue','clarify one agreement that may have been understood differently'],
  ['trust, change and difficult feelings','write down what worries you and separate facts from assumptions'],
  ['learning, exploration and larger meaning','learn something new and note one idea worth keeping'],
  ['responsibility, schedules and future goals','check an approaching deadline and divide the task into two steps'],
  ['friendship, groups and independent thinking','share an idea with your community or reconnect with a friend'],
  ['imagination, compassion and the need for rest','mute unnecessary notifications and take a quiet walk']
 ] as [string,string][]
};
export function contextualEventInsight(event:{kind:EventKind;body?:string;fromSign?:number;toSign?:number;atUtc?:string},locale:Locale):EventInsight{
 const base=eventInsight(event.kind,locale);
 const planet=event.body;
 const planetary=planet?PLANET_CONTEXT[planet]:undefined;
 if(!planetary)return base;
 const theme=planetary[locale];
 const destination=event.toSign;
 if(event.kind==='sidereal_ingress'&&typeof destination==='number'&&Number.isInteger(destination)&&destination>=1&&destination<=12){
  const sign=SIGN_LABELS[locale][destination-1];
  const origin=event.fromSign&&event.fromSign>=1&&event.fromSign<=12?SIGN_LABELS[locale][event.fromSign-1]:null;
  const translated=({Sun:'Сонце',Moon:'Місяць',Mercury:'Меркурій',Venus:'Венера',Mars:'Марс',Jupiter:'Юпітер',Saturn:'Сатурн'} as Record<string,string>)[planet]||planet;
  const verb=planet==='Sun'?'перейшло':planet==='Venus'?'перейшла':'перейшов';
  const moon=MOON_SIGN_READING[locale][destination-1];
  return {
   meaning:locale==='uk'
    ?`${translated} ${verb} ${origin?'зі знака '+origin+' до знака '+sign:'до знака '+sign}.`
    :`${planet} moved ${origin?'from '+origin+' into '+sign:'into '+sign}.`,
   tradition:locale==='uk'
    ?planet==='Moon'
     ?`У Джйотіш Місяць у знаку ${sign} пов’язують із такими темами: ${moon[0]}. Це час звернути увагу на те, як ти спілкуєшся та реагуєш на повсякденні події.`
     :`У Джйотіш перехід ${translated} до знака ${sign} пов’язують із темами ${SIGN_CONTEXT.uk[destination-1]}. Для ${translated} особливо важливі ${theme[0]}.`
    :planet==='Moon'
     ?`In Jyotish the Moon in ${sign} draws attention to ${moon[0]}.`
     :`Jyotish associates ${planet} in ${sign} with ${SIGN_CONTEXT.en[destination-1]}, especially ${theme[0]}.`,
   practice:planet==='Moon'
    ?locale==='uk'?`Спробуй сьогодні: ${moon[1]}.`:`Try today: ${moon[1]}.`
    :locale==='uk'?`Спробуй: ${theme[1]}.`:`Try: ${theme[1]}.`,
   limits:base.limits
  };
 }
 if(event.kind==='retrograde_station'||event.kind==='direct_station'){
  return {...base,
   tradition:locale==='uk'
    ?`У традиції Джйотіш зміна видимого руху планети ${planet==='Mercury'?'Меркурій':planet==='Venus'?'Венера':planet==='Mars'?'Марс':planet==='Jupiter'?'Юпітер':planet==='Saturn'?'Сатурн':planet} звертає увагу на ${theme[0]}.`
    :`Traditionally this change in ${planet}'s apparent motion invites attention to ${theme[0]}.`,
   practice:locale==='uk'?`Спробуй: ${theme[1]}.`:`Try: ${theme[1]}.`};
 }
 return base;
}

export function nearestEvents(events:AstronomicalEvent[],referenceUtc:string,max=4){
 const ms=Date.parse(referenceUtc);
 return events.filter(e=>Number.isFinite(Date.parse(e.atUtc))&&Math.abs(Date.parse(e.atUtc)-ms)<=7*86400000)
 .sort((a,b)=>Math.abs(Date.parse(a.atUtc)-ms)-Math.abs(Date.parse(b.atUtc)-ms)).slice(0,max);
}
