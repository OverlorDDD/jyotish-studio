import {describeDraws,type Spread} from './tarot-deck.ts';
type Local={uk:string;en:string};
type Raw={id:string;position:number;reversed:boolean};
/** Motifs describe symbolic possibilities, NEVER a factual claim of future knowledge.
 * The 78 individually authored card explanations remain in tarot-depth.ts. */
const major:Record<string,Local>={
 fool:{uk:'несподіване запрошення або новий початок',en:'an unexpected invitation or fresh beginning'},
 magician:{uk:'можливість вплинути на хід розмови',en:'a chance to steer a conversation'},
 priestess:{uk:'недомовленість або поступове розкриття таємниці',en:'an unspoken detail gradually revealed'},
 empress:{uk:'приємну компанію або турботливу атмосферу',en:'warm company or caring attention'},
 emperor:{uk:'необхідність правил чи вплив авторитетної людини',en:'rules or an influential person'},
 hierophant:{uk:'сімейну традицію чи пораду',en:'a family tradition or advice'},
 lovers:{uk:'важливу зустріч, зближення або вибір',en:'a meaningful meeting, connection or choice'},
 chariot:{uk:'поїздку, швидкий рух чи рішуче рішення',en:'travel, rapid movement or a bold decision'},
 strength:{uk:'момент, коли спокій допоможе уникнути сварки',en:'a moment where patience prevents conflict'},
 hermit:{uk:'усамітнення або потребу спокійно все обдумати',en:'solitude or time to reflect'},
 wheel:{uk:'несподіваний поворот планів',en:'an unexpected change of plans'},
 justice:{uk:'чесну розмову або необхідність зважити факти',en:'a direct talk or decision grounded in facts'},
 hanged:{uk:'затримку, перенесення зустрічі чи необхідну паузу',en:'a delay, postponed meeting or pause'},
 death:{uk:'завершення попередньої історії, а не буквальну смерть',en:'an old chapter ending, not literal death'},
 temperance:{uk:'примирення або спокійне узгодження домовленостей',en:'reconciliation or calm negotiations'},
 devil:{uk:'спокусу, ревнощі чи не дуже корисну звичку',en:'temptation, jealousy or an unhelpful habit'},
 tower:{uk:'раптову зміну домовленостей, гостру новину або зрив плану',en:'a disrupted plan, sharp news or sudden interruption'},
 star:{uk:'обнадійливе повідомлення чи відчуття полегшення',en:'hopeful news or a sense of relief'},
 moon:{uk:'плутанину, неоднозначний сигнал або тривожне припущення',en:'confusion, mixed signals or anxious assumptions'},
 sun:{uk:'радісне повідомлення, приємну зустріч або ясну розмову',en:'good news, a cheerful meeting or clear conversation'},
 judgement:{uk:'повернення старої теми чи важливу звістку',en:'a return of an old question or important news'},
 world:{uk:'завершення справи чи відчуття вдало прожитого дня',en:'a satisfying conclusion or completion'}
};
const suitThemes:Record<string,Local>={
 wands:{uk:'ініціативу, спілкування або несподіваний рух',en:'initiative, communication or sudden activity'},
 cups:{uk:'зустріч, почуття або душевну розмову',en:'a meeting, feelings or emotional exchange'},
 swords:{uk:'новину, суперечку чи важливе рішення',en:'news, an argument or important decision'},
 pentacles:{uk:'побутову подію, гроші, роботу або родинні справи',en:'practical matters, money, work or family concerns'}
};
const ranks:Record<string,Local>={
 ace:{uk:'новий шанс',en:'a new opportunity'},
 two:{uk:'вибір між двома варіантами',en:'a choice between two options'},
 three:{uk:'взаємодію з кількома людьми',en:'interaction with several people'},
 four:{uk:'бажання стабільності',en:'a need for stability'},
 five:{uk:'невелике напруження',en:'some friction'},
 six:{uk:'підтримку або визнання',en:'support or recognition'},
 seven:{uk:'сумніви й необхідність перевірити плани',en:'uncertainty and rechecking plans'},
 eight:{uk:'прискорення подій або робочі справи',en:'movement or practical tasks'},
 nine:{uk:'очікування результату',en:'anticipating an outcome'},
 ten:{uk:'завершення циклу або відповідальність',en:'an ending or responsibility'},
 page:{uk:'повідомлення або нове знайомство',en:'a message or new contact'},
 knight:{uk:'активну людину або несподівану дію',en:'an active person or spontaneous move'},
 queen:{uk:'вплив турботливої чи впевненої людини',en:'a caring or confident figure'},
 king:{uk:'рішення або сильну позицію іншої людини',en:'a decision or someone taking a strong position'}
};
/** 78 total motifs: 22 Major + 56 Minor combinations, with special cases for meaningful cards. */
const special:Record<string,Local>={
 'wands-six':{uk:'похвалу, приємну увагу або маленьку перемогу',en:'praise, pleasant attention or a small victory'},
 'wands-eight':{uk:'швидкі повідомлення чи спонтанну поїздку',en:'rapid messages or an unplanned trip'},
 'cups-two':{uk:'зустріч удвох, примирення чи побачення',en:'a one-on-one meeting, reconciliation or date'},
 'cups-three':{uk:'зустріч друзів або невелике святкування',en:'friends getting together or a celebration'},
 'cups-nine':{uk:'приємний сюрприз і здійснення невеликого бажання',en:'a treat or a small wish granted'},
 'cups-ten':{uk:'теплий вечір із близькими та родиною',en:'a warm evening among loved ones'},
 'swords-three':{uk:'неприємні слова або емоційне розчарування',en:'hurtful words or disappointment'},
 'swords-four':{uk:'скасовані плани й тихий відпочинок',en:'cancelled plans and quiet rest'},
 'swords-seven':{uk:'недомовленість або бажання щось приховати',en:'an omission or something deliberately unsaid'},
 'swords-nine':{uk:'тривожне очікування або неспокійні думки',en:'anxious waiting or restless thoughts'},
 'pentacles-five':{uk:'непередбачені витрати або побутовий клопіт',en:'an unexpected cost or practical inconvenience'},
 'pentacles-six':{uk:'допомогу, невеликий подарунок або обмін',en:'help, a small gift or exchange'},
 'pentacles-ten':{uk:'сімейну зустріч, домашній затишок або спільні плани',en:'family gathering, home comfort or shared plans'}
};
export function tarotEvent(id:string,lang:'uk'|'en'){
 if(id.startsWith('major-'))return major[id.slice(6)]?.[lang]||'нову ситуацію';
 if(special[id])return special[id][lang];
 const [suit,rank]=id.split('-');
 const base=suitThemes[suit]?.[lang]||'a change';
 const turn=ranks[rank]?.[lang]||'an opportunity';
 return lang==='uk'?turn+' у сфері, яка стосується '+base:turn+' involving '+base;
}
function timeIntro(q:string,lang:'uk'|'en'){
 if(/вечір|вечері|tonight|evening/i.test(q))return lang==='uk'?'На сьогоднішній вечір карти показують такий можливий сюжет: ':'For tonight the cards suggest this possible storyline: ';
 if(/сьогодн|today/i.test(q))return lang==='uk'?'На сьогодні найбільше вирізняється такий сценарій: ':'For today the strongest storyline is: ';
 if(/тижд|week/i.test(q))return lang==='uk'?'На найближчий тиждень вимальовується такий сценарій: ':'For the coming week the storyline is: ';
 return lang==='uk'?'З цієї комбінації карт вимальовується такий можливий розвиток: ':'This combination suggests the following possible development: ';
}
export function tarotForecast(cards:Raw[],spread:Spread,question:string|null){
 const full=describeDraws(cards,spread);
 if(!full.length)throw new Error('A reading requires cards');
 const first=full[0],last=full[full.length-1];
 const mid=full[Math.floor(full.length/2)];
 const reversed=last.reversed;
 const answerUk=timeIntro(question||'','uk')+
  (full.length===1?'Найпомітнішою темою стане ':'Спочатку може з’явитися ')+tarotEvent(first.id,'uk')+'. '+
  (full.length>2?'Далі можливі '+tarotEvent(mid.id,'uk')+'. ':'')+
  (full.length>1?'А ближче до завершення — '+tarotEvent(last.id,'uk')+'. ':'')+
  (reversed?'Перевернута фінальна карта змінює цей сюжет: подія може затриматися, виявитися менш різкою, ніж здавалося, або пройти непрямим шляхом. ':'')+
  'Це символічна версія розвитку подій, а не достовірна інформація про майбутнє.';
 const answerEn=timeIntro(question||'','en')+
  (full.length===1?'The dominant theme is ':'The first development could involve ')+tarotEvent(first.id,'en')+'. '+
  (full.length>2?'This may be followed by '+tarotEvent(mid.id,'en')+'. ':'')+
  (full.length>1?'Toward the end, look for '+tarotEvent(last.id,'en')+'. ':'')+
  (reversed?'The reversed final card changes the tone: the event may be delayed, softened or expressed indirectly. ':'')+
  'This is a symbolic possible outcome, not verifiable knowledge of the future.';
 const connectionsUk='«'+first.name.uk+'» на початку задає тему '+tarotEvent(first.id,'uk')+
  (full.length>2?', середня карта «'+mid.name.uk+'» додає '+tarotEvent(mid.id,'uk'):'')+
  ', а фінальна «'+last.name.uk+'» приводить сюжет до '+tarotEvent(last.id,'uk')+'.';
 const connectionsEn=first.name.en+' introduces '+tarotEvent(first.id,'en')+
  (full.length>2?', '+mid.name.en+' adds '+tarotEvent(mid.id,'en'):'')+
  ', and '+last.name.en+' concludes with '+tarotEvent(last.id,'en')+'.';
 return {
  answer:{uk:answerUk,en:answerEn},
  connections:{uk:connectionsUk,en:connectionsEn},
  reflection:{
   uk:'Основний нюанс фінальної карти: '+last.detail.uk+' '+(reversed?'Перевернуте положення звертає увагу на затримку чи стримування ситуації.':'Пряме положення підсилює зовнішній прояв події.'),
   en:'The final card adds this nuance: '+last.detail.en+' '+(reversed?'Its reversal points to a delay or an inward version of events.':'Its upright position emphasizes an outward event.')
  },
  steps:{
   uk:['Зверни увагу, чи виникають події, що нагадують тему «'+first.name.uk+'».','Якщо плани різко зміняться, уточни факти, перш ніж робити висновки.','Наприкінці обраного часу порівняй трактування з реальністю.'],
   en:['Notice whether events resemble the theme of '+first.name.en+'.','If plans shift abruptly, check the facts before reacting.','At the end of the period, compare this with actual events.']
  }
 };
}
