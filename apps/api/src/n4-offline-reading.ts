/**
 * N4 deterministic, no-LLM editorial companion to Reader v6.
 * Generates chart-specific bilingual comparisons from calculated D1 and selected
 * symbolic D9/D10/other varga signs. Does NOT modify Reader v6's chapters,
 * rules digest, historical dasha, or certified JHora status.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {calculateAllVargas} from '../../../packages/jyotish-core/src/vargas.ts';
import {classicalLordshipTable} from './reader-classical.ts';
import {selectN4NarrativeThemes} from './n4-interpretation-brief.ts';

export const N4_OFFLINE_READING_VERSION='n4-offline-editorial-v1' as const;
type Lang='uk'|'en';
export type N4OfflineChapter=Readonly<{
 id:string;division:number;heading:string;lead:string;analysis:string;example:string;action:string;
 evidence:readonly string[];
}>;
export type N4OfflineReading=Readonly<{
 version:typeof N4_OFFLINE_READING_VERSION;
 certification:'independent_jhora8_original_reference_pending';
 language:Lang;chapters:readonly N4OfflineChapter[];
 method:string;
}>;
const names:Record<string,[string,string]>={
 Sun:['Сонце','Sun'],Moon:['Місяць','Moon'],Mars:['Марс','Mars'],Mercury:['Меркурій','Mercury'],
 Jupiter:['Юпітер','Jupiter'],Venus:['Венера','Venus'],Saturn:['Сатурн','Saturn'],
 Rahu:['Раху','Rahu'],Ketu:['Кету','Ketu']
};
const signs:[readonly string[],readonly string[]]=[
 ['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'],
 ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
];
const areas:[readonly string[],readonly string[]]=[
 ['першого кроку та особистого вибору','ресурсів і слова','сміливості та навичок','дому й опори','навчання й творчого внеску','щоденної праці','партнерства й домовленостей','довіри та спільних обов’язків','знань і наставництва','професії та репутації','спільнот та досягнень','відпочинку й завершення'],
 ['personal initiative','resources and communication','courage and practical skills','home and foundations','learning and creative responsibility','daily work','partnership and agreements','trust and shared duties','knowledge and mentorship','career and reputation','community and gains','rest and completion']
];
const meanings:Record<number,{uk:string;en:string;questionUk:string;questionEn:string;sceneUk:string;sceneEn:string;stepUk:string;stepEn:string}>={
 2:{uk:'Гроші та опора',en:'Money and resources',questionUk:'як розподіляти ресурси без поспіху',questionEn:'how to handle resources without rushing',
  sceneUk:'порівняння витрати на негайну зручність із вкладенням часу в навичку',sceneEn:'choosing between an immediate convenience and investing time in a skill',
  stepUk:'розділіть обов’язкові витрати та вибіркові бажання перед рішенням',stepEn:'separate essential commitments from optional spending before deciding'},
 3:{uk:'Сміливість і спілкування',en:'Courage and communication',questionUk:'де ініціатива потребує домовленості',questionEn:'where initiative benefits from an agreement',
  sceneUk:'обговорення ролей із колегою чи братом або сестрою без припущення, що такий конфлікт уже є',sceneEn:'discussing responsibilities with a colleague or sibling, without assuming such a conflict has happened',
  stepUk:'заздалегідь сформулюйте межі відповідальності обох сторін',stepEn:'state each person’s responsibilities before acting'},
 4:{uk:'Оселя та добробут',en:'Home and stability',questionUk:'що робить життєвий простір стабільнішим',questionEn:'what makes domestic decisions more stable',
  sceneUk:'оцінка реального бюджету й умов перед ремонтом чи переїздом',sceneEn:'weighing budget and constraints before renovation or a move',
  stepUk:'спершу складіть список незмінних потреб, тоді порівнюйте варіанти',stepEn:'list non-negotiable needs before comparing options'},
 7:{uk:'Діти й передавання досвіду',en:'Children and passing knowledge onward',questionUk:'як проявляти відповідальну турботу без надмірного контролю',questionEn:'how to support another person without excessive control',
  sceneUk:'вибір між підказкою та самостійною спробою молодшої людини, якщо така роль є у вашому житті',sceneEn:'choosing between guidance and letting a younger person try independently, if that role exists in your life',
  stepUk:'ставте запитання, перш ніж давати готове рішення',stepEn:'ask what support is needed before offering a complete solution'},
 9:{uk:'Партнерство й зрілість',en:'Partnership and maturity',questionUk:'як домовленості витримують реальні навантаження',questionEn:'how agreements hold up under everyday pressure',
  sceneUk:'обговорення спільних правил часу, грошей або особистого простору',sceneEn:'agreeing on shared rules around time, money or personal space',
  stepUk:'назвіть одне очікування вголос і запросіть іншу сторону до відповіді',stepEn:'state one expectation clearly and invite the other person’s view'},
 10:{uk:'Кар’єра й видимий результат',en:'Career and public contribution',questionUk:'де варто поєднати амбіцію та повторювану майстерність',questionEn:'where ambition needs repeatable skill',
  sceneUk:'вибір між швидкою демонстрацією результату й налаштуванням надійного процесу',sceneEn:'choosing between a quick visible result and building a reliable process',
  stepUk:'запишіть вимірюваний наступний крок замість обіцянки великого успіху',stepEn:'set one measurable next step rather than promising a breakthrough'},
 12:{uk:'Батьки та походження',en:'Parents and inherited roles',questionUk:'які сімейні звички слід переглянути',questionEn:'which family habits deserve examination',
  sceneUk:'спокійне обговорення меж обов’язку перед родиною',sceneEn:'a calm conversation about duties and family boundaries',
  stepUk:'розділіть повагу до традиції та власне свідоме рішення',stepEn:'distinguish respect for tradition from a conscious personal choice'},
 16:{uk:'Комфорт і транспорт',en:'Comfort and transport',questionUk:'чи підтримують зручності важливі пріоритети',questionEn:'whether a convenience serves a real priority',
  sceneUk:'оцінка витрат на оновлення транспорту чи робочого простору',sceneEn:'evaluating the cost of upgrading transport or a workspace',
  stepUk:'оцініть користь від покупки протягом року, не лише в день рішення',stepEn:'assess a purchase over a year rather than the day you decide'},
 20:{uk:'Практика й духовний шлях',en:'Spiritual practice',questionUk:'як будувати сталість у внутрішній практиці',questionEn:'how to build consistency in an inner practice',
  sceneUk:'вибір між короткою щоденною практикою та різким виснажливим стартом',sceneEn:'choosing a manageable daily practice over an exhausting burst',
  stepUk:'оберіть невеликий ритуал, який реально повторити сім днів поспіль',stepEn:'choose one modest practice you can repeat for seven days'},
 24:{uk:'Освіта та майстерність',en:'Education and mastery',questionUk:'як знання переходить у перевірюваний результат',questionEn:'how knowledge becomes demonstrable skill',
  sceneUk:'підготовка до навчального проєкту через зворотний зв’язок наставника',sceneEn:'preparing a learning project with feedback from a mentor',
  stepUk:'виберіть одну навичку й покажіть її у практичній роботі',stepEn:'choose one skill and demonstrate it in practical work'},
 27:{uk:'Витривалість',en:'Resilience',questionUk:'де зусиллям потрібна пауза для відновлення',questionEn:'where sustained effort needs recovery',
  sceneUk:'планування складного тижня з чіткими пріоритетами й перервами',sceneEn:'planning a demanding week with priorities and breaks',
  stepUk:'обмежте кількість паралельних справ і перевіряйте навантаження',stepEn:'limit parallel commitments and review the workload'},
 30:{uk:'Перешкоди й самокорекція',en:'Obstacles and self-correction',questionUk:'які перевірки допоможуть уникнути повтору помилки',questionEn:'which checks could prevent a repeated mistake',
  sceneUk:'перевірка умов складного договору до того, як ви погодитеся',sceneEn:'reviewing the terms of a difficult agreement before committing',
  stepUk:'створіть короткий контрольний список ризиків і можливих альтернатив',stepEn:'write a short checklist of risks and available alternatives'},
 40:{uk:'Материнська лінія',en:'Maternal lineage',questionUk:'що варто зберегти з родинних звичок',questionEn:'what is worth preserving in family habits',
  sceneUk:'переосмислення родинного способу турботи без припущень про конкретних родичів',sceneEn:'examining a family approach to caring without inventing relatives’ histories',
  stepUk:'назвіть одну звичку, яку варто зберегти, та одну, яку варто змінити',stepEn:'name one habit to keep and one to reconsider'},
 45:{uk:'Батьківська лінія',en:'Paternal lineage',questionUk:'як не плутати власні цінності з очікуваннями авторитетів',questionEn:'how to separate your values from external expectations',
  sceneUk:'вибір особистого критерію успіху замість автоматичного порівняння',sceneEn:'choosing a personal measure of success over automatic comparison',
  stepUk:'сформулюйте свій критерій доброї роботи в одному реченні',stepEn:'describe your own measure of good work in one sentence'}
};
const local=(s:string,lang:Lang)=>names[s]?.[lang==='uk'?0:1]||s;
const zodiac=(s:number,lang:Lang)=>signs[lang==='uk'?0:1][s-1]||'—';
const place=(h:number,lang:Lang)=>areas[lang==='uk'?0:1][h-1]||'—';
const chapter=(chart:CalculatedChart,d:number,anchor:string,theme:number,lang:Lang):N4OfflineChapter=>{
 const uk=lang==='uk',p=chart.d1.find(x=>x.name===anchor);
 const c=calculateAllVargas(chart.ascendant.longitude,chart.d1.map(g=>({
  name:g.name,longitude:g.longitude,speed:g.retrograde?-1:1
 }))).find(x=>x.division===d);
 const q=c?.planets.find(x=>x.name===anchor);
 if(!p||!q)throw new Error('N4 offline: missing verified source placement');
 const m=meanings[theme];if(!m)throw new Error('N4 offline: unknown topic');
 const planet=local(anchor,lang),sourceArea=place(p.house,lang),sameHouse=p.house===q.house,sameSign=p.sign===q.vargaSign;
 const lead=uk?
  'D'+d+' — '+m.uk+'. У базовій D1 '+planet+' стоїть у домі '+p.house+' ('+sourceArea+'), а в тематичній D'+d+' — у домі '+q.house+' знаку '+zodiac(q.vargaSign,lang)+'.':
  'D'+d+' — '+m.en+'. In D1, '+planet+' occupies house '+p.house+' ('+sourceArea+'); in thematic D'+d+' it is in house '+q.house+', '+zodiac(q.vargaSign,lang)+'.';
 const analysis=uk?
  (sameHouse?'Положення в одному й тому самому домі обох карт підсилює цю спільну тему як привід для уважнішого аналізу. ':
   'Різні доми D1 і D'+d+' підказують не зводити всю тему до одного способу прояву: життєва сфера та її тематичний контекст відрізняються. ')+
  (sameSign?'Знак планети також збігається, але сам по собі цей збіг не доводить результату. ':
   'Зміна знака між D1 та D'+d+' додає інший символічний ракурс; вона не означає автоматично ні успіху, ні невдачі. ')+
  'Практичне запитання: '+m.questionUk+'?':
  (sameHouse?'The same house recurs in D1 and D'+d+', making this shared topic worth exploring. ':
   'D1 and D'+d+' place the planet in different houses; a life domain and its specialized setting need not express themselves identically. ')+
  (sameSign?'The sign is also shared, though this alone guarantees no result. ':
   'The sign shifts between D1 and D'+d+', offering a second symbolic angle rather than a simple good-or-bad verdict. ')+
  'The practical question is '+m.questionEn+'.';
 const example=uk?'Наприклад, уявімо '+m.sceneUk+'. Це приклад можливого вибору, а не опис вашого минулого.':
  'Imagine '+m.sceneEn+'. This illustrates a possible choice, not something claimed to have happened to you.';
 const action=uk?'Спробуйте наступне: '+m.stepUk+'.':'A useful next step: '+m.stepEn+'.';
 const evidence=Object.freeze([
  'D1 '+anchor+' sign='+p.sign+' house='+p.house,
  'D'+d+' '+anchor+' sign='+q.vargaSign+' house='+q.house,
  'D'+d+' lagna sign='+c!.lagna.vargaSign
 ]);
 return Object.freeze({id:'n4-'+d,division:d,heading:'D'+d+' · '+(uk?m.uk:m.en),lead,analysis,example,action,evidence});
};
export function n4OfflineEligible(env:Record<string,string|undefined>=process.env){
 return env.N4_OFFLINE_READER_ENABLED==='1'&&env.N4_VARGA_INDEPENDENT_REFERENCE_APPROVED==='1';
}
export function buildN4OfflineReading(chart:CalculatedChart,lang:Lang):N4OfflineReading{
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const chapters=[chapter(chart,9,'Venus',9,lang),chapter(chart,10,lords[10],10,lang),
  ...selectN4NarrativeThemes(chart).filter(x=>x.division!==9&&x.division!==10)
   .map(t=>chapter(chart,t.division,t.anchor,t.division,lang))];
 if(chapters.length!==5||new Set(chapters.map(c=>c.division)).size!==5)
  throw new Error('N4 offline requires distinct D9, D10 and 3 grounded supplementary themes');
 return Object.freeze({
  version:N4_OFFLINE_READING_VERSION,
  certification:'independent_jhora8_original_reference_pending',
  language:lang,
  chapters:Object.freeze(chapters),
  method:lang==='uk'?'Розрахункове тематичне доповнення до Reader v6: підтверджені положення D1 і математично обчислені варги. Повна сертифікація JHora 8.0 очікується.':
   'Calculated thematic companion to Reader v6: D1 source placements and derived varga signs. Original JHora 8.0 certification remains pending.'
 });
}
