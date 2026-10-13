import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {practicalGuidance} from './practical-guidance.ts';

/** Canonical, replayable narrative synthesis: all planetary claims come from validated D1. */
export type LifeChapter={id:string;title:string;overview:string;example:string;action:string;evidence:string[]};
export type LifePortrait={version:'1.1';chapters:LifeChapter[]};
const themes=[
 ['починання та особисті орієнтири','beginnings and personal direction'],
 ['ресурси, звички витрат і цінності','resources and personal values'],
 ['спілкування й власні навички','communication and practical skills'],
 ['дім, відпочинок і близьких','home, rest and family'],
 ['творчість, самовираження й навчання','creativity, self-expression and learning'],
 ['щоденну організацію справ','organizing daily routines'],
 ['партнерство й домовленості','partnership and agreements'],
 ['довіру, зміни й спільну відповідальність','trust, change and shared responsibilities'],
 ['знання й ширшу перспективу','learning and broad perspective'],
 ['роботу, репутацію та професійні цілі','work, reputation and career goals'],
 ['спільноти й довгострокові плани','community and long-term plans'],
 ['відновлення й особистий простір','rest and personal space']
] as const;
const signTone=[
 ['ініціативою','initiative'],['послідовністю','consistency'],['допитливістю','curiosity'],
 ['турботою','care'],['творчістю','creativity'],['увагою до деталей','attention to details'],
 ['пошуком балансу','balancing perspectives'],['глибиною','depth'],
 ['прагненням навчатися','learning'],['дисципліною','discipline'],
 ['новими підходами','new approaches'],['уявою та співчуттям','imagination and empathy']
] as const;
const names:Record<string,[string,string]>={
 Sun:['Сонце','Sun'],Moon:['Місяць','Moon'],Mars:['Марс','Mars'],Mercury:['Меркурій','Mercury'],
 Jupiter:['Юпітер','Jupiter'],Venus:['Венера','Venus'],Saturn:['Сатурн','Saturn'],
 Rahu:['Раху','Rahu'],Ketu:['Кету','Ketu']
};
export function createLifePortrait(chart:CalculatedChart,lang:'uk'|'en'):LifePortrait{
 const uk=lang==='uk',idx=uk?0:1;
 const rules=ruleFindings(chart);
 const get=(name:string)=>{const p=chart.d1.find(g=>g.name===name);if(!p)throw new Error('Missing '+name);return p;};
 const sun=get('Sun'),moon=get('Moon'),saturn=get('Saturn'),venus=get('Venus'),jupiter=get('Jupiter');
 const lord2=rules.lords.find(x=>x.values.house===2)!;
 const lord4=rules.lords.find(x=>x.values.house===4)!;
 const lord7=rules.lords.find(x=>x.values.house===7)!;
 const lord10=rules.lords.find(x=>x.values.house===10)!;
 const area=(house:number)=>themes[house-1][idx];
 const graha=(name:string)=>names[name]?.[idx]||name;
 const descriptor=(name:string)=>{
  const p=get(name);
  return uk?'У перевіреній карті '+graha(name)+' пов’язане зі сферою «'+area(p.house)+'», а знак додає символічну тему '+signTone[p.sign-1][idx]+'.':
   'In the verified chart, '+graha(name)+' is associated with '+area(p.house)+', with a symbolic emphasis on '+signTone[p.sign-1][idx]+'.';
 };
 const tip=practicalGuidance(chart,lang);
 const practical=(house:number)=>tip.find(x=>x.id.endsWith('house-'+house))?.action;
 const chapters:LifeChapter[]=[
  {id:'strengths',title:uk?'Можливі сильні сторони':'Potential strengths',
   overview:descriptor('Sun')+' '+(uk?'У цій традиції це може підказувати, де варто тренувати ініціативу, а не свідчить про вроджені здібності.':'This can point to an area where initiative may be practiced, rather than proving an inborn talent.'),
   example:uk?'Наприклад, у ситуації, коли потрібно самостійно поставити мету й помітити власний прогрес.':'For example, when setting a personal goal and noticing your progress.',
   action:practical(sun.house)||(uk?'Оберіть одну невелику справу й завершіть її протягом тижня.':'Complete one small task this week.'),
   evidence:['D1.Sun.sign='+sun.sign,'D1.Sun.house='+sun.house]},
  {id:'challenges',title:uk?'Можливі труднощі та баланс':'Possible challenges and balance',
   overview:descriptor('Saturn')+' '+(uk?'Традиційно це запрошення уважніше поставитися до меж і терпіння, а не передбачення невдач чи хвороб.':'This is a traditional prompt to reflect on boundaries and patience, not a prediction of setbacks or illness.'),
   example:uk?'Наприклад, коли обов’язків забагато, а енергії на все не вистачає.':'For example, when responsibilities pile up and time feels limited.',
   action:practical(saturn.house)||(uk?'Запишіть три обов’язки та свідомо відкладіть один необов’язковий.':'List three commitments and postpone one optional task.'),
   evidence:['D1.Saturn.sign='+saturn.sign,'D1.Saturn.house='+saturn.house]},
  {id:'relationships',title:uk?'Стосунки й спосіб домовлятися':'Relationships and communication',
   overview:descriptor('Venus')+' '+(uk?'У традиційній схемі сфера партнерства додатково пов’язана з '+graha(String(lord7.subject))+' у сфері «'+area(Number(lord7.values.locatedHouse))+'». Це не висновок про конкретного партнера.':
    'The traditional partnership ruler is '+graha(String(lord7.subject))+' in the area of '+area(Number(lord7.values.locatedHouse))+'. This says nothing certain about a partner.'),
   example:uk?'Наприклад, коли важливо узгодити очікування, час або спільні плани.':'For example, when aligning expectations, time or shared plans.',
   action:practical(venus.house)||(uk?'Обговоріть одну важливу домовленість без припущень, що інша людина все знає.':'Discuss one important expectation without assuming it is understood.'),
   evidence:['D1.Venus.sign='+venus.sign,'D1.Venus.house='+venus.house,lord7.id]},
  {id:'career',title:uk?'Робота та професійний напрям':'Work and professional direction',
   overview:descriptor('Sun')+' '+(uk?'Управитель професійної сфери — '+graha(String(lord10.subject))+' — розташований у сфері «'+area(Number(lord10.values.locatedHouse))+'». Це поєднання традиційно розглядають як тему для пошуку практичного фокуса.':
    'The ruler of the career area is '+graha(String(lord10.subject))+' and is placed in '+area(Number(lord10.values.locatedHouse))+'. This is a symbolic theme for choosing a practical focus.'),
   example:uk?'Наприклад, коли хочеться менше розпорошуватися між задачами.':'For example, when you want to avoid spreading effort across too many tasks.',
   action:practical(10)||(uk?'Оберіть один вимірюваний робочий результат на сім днів.':'Choose one measurable work outcome for the next seven days.'),
   evidence:['D1.Sun.house='+sun.house,lord10.id]},
  {id:'money',title:uk?'Гроші, ресурси й особисті цінності':'Money, resources and values',
   overview:(uk?'За традиційною схемою тема ресурсів пов’язана з ':'Under the traditional framework, the resource area is associated with ')+graha(String(lord2.subject))+(uk?' у сфері «':' in the area of “')+area(Number(lord2.values.locatedHouse))+'». '+(uk?'Це привід поміркувати про свій спосіб керувати ресурсами, а не прогноз доходів чи прибутку.':'This invites reflection on managing resources, not a prediction of earnings or returns.'),
   example:uk?'Наприклад, коли хочеться відкладати на важливу мету, але витрати не завжди відповідають пріоритетам.':'For example, when saving for something important while spending does not always match priorities.',
   action:uk?'Запишіть три фінансові пріоритети та перевірте одну необов’язкову витрату цього тижня.':'List three financial priorities and review one nonessential expense this week.',
   evidence:[lord2.id]},
  {id:'inner-life',title:uk?'Внутрішній комфорт і відновлення':'Inner balance and recovery',
   overview:descriptor('Moon')+' '+(uk?'Сфера внутрішньої опори додатково пов’язана з '+graha(String(lord4.subject))+' у сфері «'+area(Number(lord4.values.locatedHouse))+'». Це не психологічний діагноз, а запрошення придивитися до звичок відновлення.':
    'The inner-foundations area is also associated with '+graha(String(lord4.subject))+' in '+area(Number(lord4.values.locatedHouse))+'. This is not a psychological diagnosis.'),
   example:uk?'Наприклад, коли після насиченого дня важливо знайти час на спокій і побути без сповіщень.':'For example, when a busy day makes a quiet moment valuable.',
   action:uk?'Виділіть десять хвилин щодня без сповіщень і наприкінці тижня оцініть, чи стало легше відпочивати.':'Try a ten-minute notification-free break daily and reflect on how it felt at the end of the week.',
   evidence:['D1.Moon.sign='+moon.sign,'D1.Moon.house='+moon.house,lord4.id]},
  {id:'growth',title:uk?'Особистий розвиток і наступні кроки':'Personal growth and next steps',
   overview:descriptor('Jupiter')+' '+descriptor('Moon')+' '+(uk?'Ці дві теми можна зіставити з реальними інтересами та відчуттям комфорту — без тверджень, що карта визначає призначення.':'Compare these themes with your actual interests and sense of comfort, without claiming the chart fixes your purpose.'),
   example:uk?'Наприклад, під час вибору між новою навичкою та потребою у відпочинку.':'For example, while balancing a new skill with a need for rest.',
   action:practical(jupiter.house)||(uk?'Спробуйте нове заняття двічі на тиждень та запишіть, що сподобалося.':'Try a new activity twice this week and note what you enjoyed.'),
   evidence:['D1.Jupiter.sign='+jupiter.sign,'D1.Jupiter.house='+jupiter.house,'D1.Moon.house='+moon.house]}
 ];
 return {version:'1.1',chapters};
}
