import {randomInt} from 'node:crypto';

export type Lang='uk'|'en';
export type TarotCard={
 id:string;name:{en:string;uk:string};upright:{en:string;uk:string};reversed:{en:string;uk:string};
};
const major:[string,string,string,string,string,string,string][]=[
 ['fool','The Fool','Блазень','A beginning invites curiosity, experimentation, and mindful risk.','Новий початок запрошує до відкритості, проб і обдуманого ризику.','Consider whether spontaneity has become avoidance of responsibility.','Поміркуй, чи не перетворилася спонтанність на уникання відповідальності.'],
 ['magician','The Magician','Маг','Available skills can become purposeful action.','Наявні навички можна спрямувати на конкретну дію.','Examine scattered effort or attempts to control others.','Зверни увагу на розпорошені зусилля або бажання контролювати інших.'],
 ['priestess','The High Priestess','Верховна Жриця','Pause and listen to intuition while checking the facts.','Прислухайся до інтуїції, не нехтуючи фактами.','Uncertainty may call for clearer information rather than guesswork.','Невизначеність потребує яснішої інформації замість здогадів.'],
 ['empress','The Empress','Імператриця','Nurture growth, creativity, and supportive relationships.','Підтримуй розвиток, творчість і турботливі взаємини.','Care for your own needs without overextending yourself.','Подбай і про власні потреби, не виснажуючи себе турботою.'],
 ['emperor','The Emperor','Імператор','Structure, boundaries, and consistent leadership matter.','Структура, межі та послідовність допомагають рухатися вперед.','Check where rigid control prevents cooperation.','Перевір, де надмірний контроль заважає співпраці.'],
 ['hierophant','The Hierophant','Ієрофант','Traditions and trusted teachers can offer perspective.','Традиції та надійні наставники можуть розширити погляд.','Question rules that no longer serve your values.','Переосмисли правила, які більше не відповідають твоїм цінностям.'],
 ['lovers','The Lovers','Закохані','Align important relationships and choices with your values.','Узгоджуй важливі стосунки й вибір зі своїми цінностями.','Notice indecision or compromises that feel inauthentic.','Помічай нерішучість і компроміси проти власних переконань.'],
 ['chariot','The Chariot','Колісниця','Focused direction and discipline help overcome obstacles.','Чітка мета й дисципліна допомагають долати перешкоди.','Slow down if determination turns into force.','Сповільнися, якщо наполегливість переходить у тиск.'],
 ['strength','Strength','Сила','Patience and compassion can be more effective than pressure.','Терпіння й співчуття можуть діяти сильніше за тиск.','Find a gentler response to insecurity or exhaustion.','Знайди м’якший спосіб впоратися з невпевненістю чи втомою.'],
 ['hermit','The Hermit','Відлюдник','Solitude and reflection can clarify your next step.','Самота й рефлексія здатні прояснити наступний крок.','Avoid isolating yourself when support would help.','Не ізолюйся, коли підтримка могла б допомогти.'],
 ['wheel','Wheel of Fortune','Колесо Фортуни','Notice changing circumstances and adapt with flexibility.','Помічай зміни обставин і адаптуйся без поспіху.','Focus on your response rather than trying to control every outcome.','Зосередься на своїх діях, а не на контролі кожного результату.'],
 ['justice','Justice','Справедливість','Weigh evidence, accountability, and fairness.','Зважуй факти, відповідальність і справедливість.','Revisit assumptions or a one-sided judgment.','Переглянь припущення або однобічне судження.'],
 ['hanged','The Hanged Man','Повішений','A change in viewpoint may reveal a better approach.','Зміна перспективи може підказати кращий підхід.','Distinguish useful patience from unhelpful stagnation.','Розрізняй корисне терпіння та безплідний застій.'],
 ['death','Death','Смерть','An ending may create space for a new phase; this is symbolic.','Завершення може відкрити місце для нового етапу; значення символічне.','Explore what you are reluctant to release.','Поміркуй, що тобі важко відпустити.'],
 ['temperance','Temperance','Помірність','Balance competing needs through gradual adjustment.','Шукай рівновагу між потребами через поступові зміни.','Notice extremes and restore a manageable rhythm.','Помічай крайнощі й повертайся до посильного ритму.'],
 ['devil','The Devil','Диявол','Recognize attachments and patterns that limit freedom.','Розпізнавай прив’язаності та звички, що обмежують свободу.','Small boundaries can loosen an unhealthy pattern.','Невеликі межі можуть послабити шкідливий шаблон.'],
 ['tower','The Tower','Вежа','An old assumption may need honest reassessment.','Старі уявлення можуть потребувати чесного перегляду.','Build stability without catastrophizing uncertainty.','Відновлюй опору без драматизації невизначеності.'],
 ['star','The Star','Зірка','Renew hope through restorative and realistic steps.','Відновлюй надію через посильні та реалістичні кроки.','Care for discouragement without abandoning progress.','Підтримай себе у зневірі, не знецінюючи прогрес.'],
 ['moon','The Moon','Місяць','Make room for uncertainty while separating fears from facts.','Залишай місце для невизначеності, відділяючи страхи від фактів.','Seek clarification before acting on assumptions.','Шукай ясності, перш ніж діяти на основі припущень.'],
 ['sun','The Sun','Сонце','Celebrate clarity, warmth, and genuine progress.','Радій ясності, теплу й справжнім досягненням.','Allow rest when pressure to be optimistic is exhausting.','Дозволь собі відпочити, якщо вимога бути позитивним виснажує.'],
 ['judgement','Judgement','Суд','Review past experience and choose how to grow.','Переосмисли досвід і свідомо обери напрям розвитку.','Move beyond harsh self-criticism toward repair.','Відпусти надмірну самокритику заради виправлення помилок.'],
 ['world','The World','Світ','A cycle of learning reaches integration or completion.','Цикл навчання підходить до інтеграції чи завершення.','Honor achievements while noting unfinished details.','Цінуй здобутки й приділи увагу незавершеним деталям.']
];
const suits=[
 {id:'wands',en:'Wands',uk:'Жезлів',scopeEn:'initiative and creative energy',scopeUk:'ініціативи та творчої енергії',shadowEn:'overextension or conflicting ambitions',shadowUk:'перенапруження чи суперечливих прагнень'},
 {id:'cups',en:'Cups',uk:'Кубків',scopeEn:'feelings and close relationships',scopeUk:'почуттів і близьких взаємин',shadowEn:'emotional avoidance or unclear expectations',shadowUk:'емоційного уникання чи нечітких очікувань'},
 {id:'swords',en:'Swords',uk:'Мечів',scopeEn:'thoughts, communication and decisions',scopeUk:'думок, спілкування та рішень',shadowEn:'worry or unproductive conflict',shadowUk:'тривоги чи безплідних конфліктів'},
 {id:'pentacles',en:'Pentacles',uk:'Пентаклів',scopeEn:'work, resources and practical care',scopeUk:'роботи, ресурсів і практичної турботи',shadowEn:'rigidity or material insecurity',shadowUk:'негнучкості чи відчуття матеріальної нестабільності'}
] as const;
const ranks=[
 ['ace','Ace','Туз','a new opportunity','нової можливості'],
 ['two','Two','Двійка','a choice or balance','вибору та рівноваги'],
 ['three','Three','Трійка','cooperation and expansion','співпраці й розширення'],
 ['four','Four','Четвірка','foundations and stability','основ і стабільності'],
 ['five','Five','П’ятірка','a challenge that needs attention','складності, яка потребує уваги'],
 ['six','Six','Шістка','support, exchange, and recovery','підтримки, обміну й відновлення'],
 ['seven','Seven','Сімка','review and a strategic choice','перегляду та стратегічного вибору'],
 ['eight','Eight','Вісімка','focused effort and movement','зосереджених зусиль і руху'],
 ['nine','Nine','Дев’ятка','maturity and nearing completion','зрілості й наближення до завершення'],
 ['ten','Ten','Десятка','the outcome of accumulated actions','наслідків накопичених дій'],
 ['page','Page','Паж','curiosity and learning','цікавості й навчання'],
 ['knight','Knight','Лицар','active pursuit and determination','активного пошуку й рішучості'],
 ['queen','Queen','Королева','care, steadiness and wise leadership','турботи, стійкості й мудрого лідерства'],
 ['king','King','Король','responsibility and thoughtful mastery','відповідальності та обдуманої майстерності']
] as const;
export const TAROT_DECK:ReadonlyArray<TarotCard>=[
 ...major.map(([id,en,uk,upEn,upUk,revEn,revUk])=>({id:'major-'+id,name:{en,uk},upright:{en:upEn,uk:upUk},reversed:{en:revEn,uk:revUk}})),
 ...suits.flatMap(suit=>ranks.map(([id,en,uk,lensEn,lensUk])=>({
  id:suit.id+'-'+id,name:{en:en+' of '+suit.en,uk:uk+' '+suit.uk},
  upright:{en:'Reflect on '+lensEn+' in '+suit.scopeEn+'.',uk:'Поміркуй про тему '+lensUk+' у сфері '+suit.scopeUk+'.'},
  reversed:{en:'Check for '+suit.shadowEn+' while approaching '+lensEn+'.',uk:'Зверни увагу на прояви '+suit.shadowUk+' у темі '+lensUk+'.'}
 })))
];
export type Spread='one'|'three'|'celtic';
export const SPREADS={
 one:[{en:'Focus of the day',uk:'Фокус дня'}],
 three:[{en:'Past influence',uk:'Вплив минулого'},{en:'Present situation',uk:'Теперішня ситуація'},{en:'Possible direction',uk:'Можливий напрям'}],
 celtic:[
  {en:'Present situation',uk:'Поточна ситуація'},{en:'Crossing challenge',uk:'Перешкода'},
  {en:'Conscious aim',uk:'Свідома мета'},{en:'Underlying factor',uk:'Прихований чинник'},
  {en:'Recent past',uk:'Недавнє минуле'},{en:'Near-term possibility',uk:'Найближча можливість'},
  {en:'Your approach',uk:'Твій підхід'},{en:'External influences',uk:'Зовнішні впливи'},
  {en:'Hopes and concerns',uk:'Надії та побоювання'},{en:'Overall direction',uk:'Загальний напрям'}
 ]
} as const;
/** Cryptographically sound unbiased selection without replacement. */
export function drawCards(spread:Spread){
 const count=SPREADS[spread].length;
 const pool=TAROT_DECK.map(c=>c.id);
 for(let i=0;i<count;i++){
  const pick=i+randomInt(pool.length-i);
  [pool[i],pool[pick]]=[pool[pick],pool[i]];
 }
 return pool.slice(0,count).map((id,i)=>({id,position:i,reversed:randomInt(2)===1}));
}
export function describeDraws(draws:ReadonlyArray<{id:string;position:number;reversed:boolean}>,spread:Spread){
 return draws.map(draw=>{
  const card=TAROT_DECK.find(c=>c.id===draw.id);
  if(!card||!SPREADS[spread][draw.position])throw new Error('Invalid reading data');
  return {...draw,name:card.name,positionName:SPREADS[spread][draw.position],meaning:draw.reversed?card.reversed:card.upright};
 });
}
