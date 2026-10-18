import {describeDraws,type Spread} from './tarot-deck.ts';
type Both={en:string;uk:string};
type RawCard={id:string;position:number;reversed:boolean};
export type TarotSynthesis={
 answer:Both;connections:Both;reflection:Both;steps:{en:string[];uk:string[]};
};
/** A transparent, non-predictive synthesis grounded ONLY in drawn cards.
 * No AI calls, no invented biographical facts or certain forecasts.
 */
export function synthesizeTarot(raw:ReadonlyArray<RawCard>,spread:Spread,question:string|null):TarotSynthesis{
 const cards=describeDraws(raw,spread);
 if(!cards.length)throw new Error('Cannot interpret an empty spread');
 const first=cards[0],last=cards[cards.length-1];
 const middle=cards[Math.floor(cards.length/2)];
 const rev=cards.filter(c=>c.reversed).length;
 const major=cards.filter(c=>c.id.startsWith('major-')).length;
 const tally=new Map<string,number>();
 for(const c of cards){const suit=c.id.split('-')[0];if(suit!=='major')tally.set(suit,(tally.get(suit)||0)+1);}
 const common=[...tally].sort((a,b)=>b[1]-a[1])[0]?.[0];
 const themes:Record<string,Both>={
  cups:{uk:'почуття й близькі взаємини',en:'feelings and close relationships'},
  wands:{uk:'ініціативу й сміливість діяти',en:'initiative and courage to act'},
  swords:{uk:'мислення, розмови та рішення',en:'thinking, communication and decisions'},
  pentacles:{uk:'роботу, ресурси й щоденну відповідальність',en:'work, resources and practical responsibility'}
 };
 const topic=question||'';
 const personalFocus:Both=/\b(pregnan|fertil|medical|health|illness|children|baby)\b|вагітн|здоров|діт|дитин|зачат|хвороб/i.test(topic)?{
  uk:'Таро не може встановити вагітність, стан здоров’я чи факт майбутнього народження дитини. Для таких фактів потрібні відповідні реальні дані та фахівці; символи можуть допомогти лише дослідити власні почуття й рішення. ',
  en:'Tarot cannot determine pregnancy, health status or whether a child will be born. Real-world evidence and qualified professionals are needed for those facts; symbols can only support reflection on feelings and choices. '
 }:/стосунк|кохан|дівчин|хлопц|шлюб|любов|любить|relationship|marri|romance|partner|love/i.test(topic)?{
  uk:'У стосунках карти не можуть підтвердити чужі приховані почуття. Відповідь варто шукати у взаємних діях, чесній розмові та твоїх межах. ',
  en:'In relationships the cards cannot verify someone else’s private feelings. Look to mutual actions, honest communication and your own boundaries. '
 }:/робот|кар'єр|профес|грош|бізнес|доход|прац|career|job|business|money|work|income/i.test(topic)?{
  uk:'Якщо питання про роботу чи гроші, розклад не може гарантувати прибуток. Зістав його теми з навичками, ризиками, бюджетом і конкретними варіантами дій. ',
  en:'For career or money questions, the spread cannot guarantee a financial outcome. Compare its themes with skills, risks, budget and practical alternatives. '
 }:/виріш|вибір|обрати|рішення|перехід|переїх|decide|choice|decision|move|change/i.test(topic)?{
  uk:'Коли йдеться про рішення, карти не обирають за тебе. Корисно порівняти альтернативи, ціну бездіяльності та те, що відповідає твоїм цінностям. ',
  en:'For a decision, the cards cannot choose on your behalf. Compare alternatives, the cost of inaction and alignment with your values. '
 }:{
  uk:'Сприймай ці образи як запрошення поставити собі точніші запитання, а не як відповідь із надприродного джерела. ',
  en:'Treat these images as an invitation to ask clearer questions, not a supernatural source of facts. '
 };
 const opening=question?.trim()?{
  uk:'Щодо питання «'+question.trim()+'» розклад пропонує символічну, умовну відповідь: ',
  en:'For your question “'+question.trim()+'”, the spread offers a symbolic, conditional answer: '
 }:{
  uk:'Цей розклад пропонує такий напрям для роздумів: ',
  en:'This spread suggests a direction for reflection: '
 };
 const answer:Both=cards.length===1?{
  uk:opening.uk+personalFocus.uk+'Центральна тема — «'+first.name.uk+'»'+(first.reversed?' у перевернутому положенні. ':'. ')+first.detail.uk+' Це не дозволяє передбачити точну подію або дату.',
  en:opening.en+personalFocus.en+'The focus is '+first.name.en+(first.reversed?' reversed. ':'. ')+first.detail.en+' This cannot predict a precise event or date.'
 }:{
  uk:opening.uk+personalFocus.uk+'Початкова позиція «'+first.name.uk+'» окреслює контекст, а фінальна «'+last.name.uk+'» — один із можливих напрямів. '+last.detail.uk+' Висновок залежить від реальних обставин та твоїх дій.',
  en:opening.en+personalFocus.en+'The opening '+first.name.en+' frames the situation, while the final '+last.name.en+' suggests one possible direction. '+last.detail.en+' Your circumstances and actions still matter.'
 };
 const caveat:Both=rev>cards.length/2?{
  uk:'Більшість карт перевернуті: важливо помітити вагання, внутрішні потреби й затримки, а не трактувати це як вирок.',
  en:'Most cards are reversed: examine hesitation, inner needs and delays without treating the spread as a verdict.'
 }:rev?{
  uk:'Перевернуті карти додають теми, які можуть потребувати іншого погляду або чесної розмови.',
  en:'Reversed cards add themes that may require a different perspective or an honest conversation.'
 }:{
  uk:'Прямі карти підсвічують конструктивні можливості, але не гарантують результату.',
  en:'Upright cards highlight constructive possibilities without guaranteeing an outcome.'
 };
 const scale:Both=major>=Math.max(2,Math.ceil(cards.length/2))?{
  uk:'Помітна частка Старших арканів звертає увагу на глибші цінності й тривалі життєві теми.',
  en:'Several Major Arcana suggest deeper values and recurring life themes.'
 }:{
  uk:'Більшість символів стосуються повсякденних дій, думок і стосунків.',
  en:'Most symbols point toward ordinary decisions, thoughts and relationships.'
 };
 const connections:Both={
  uk:'Зістав «'+first.name.uk+'» ('+first.positionName.uk+') з «'+last.name.uk+'» ('+last.positionName.uk+'). '+(cards.length>2?'Додатковий відтінок дає «'+middle.name.uk+'». ':'')+(common?'Повторювана масть акцентує '+themes[common].uk+'. ':'')+scale.uk+' '+caveat.uk,
  en:'Compare '+first.name.en+' ('+first.positionName.en+') with '+last.name.en+' ('+last.positionName.en+'). '+(cards.length>2?'The middle card '+middle.name.en+' adds another layer. ':'')+(common?'A recurring suit emphasizes '+themes[common].en+'. ':'')+scale.en+' '+caveat.en
 };
 return {answer,connections,
  reflection:{
   uk:'Ключове питання: на що ти можеш вплинути особисто? '+last.detail.uk+' Перевір символічні підказки фактами, власними межами та реальними розмовами.',
   en:'The key question is what you can personally influence. '+last.detail.en+' Check symbolic insights against evidence, boundaries and actual conversations.'
  },
  steps:{
   uk:['Запиши, про що нагадує «'+first.name.uk+'» у цій ситуації.','Обери одну посильну дію за темою карти «'+last.name.uk+'».','Повернися до питання після нової розмови або реальних фактів, а не лише нового розкладу.'],
   en:['Write what '+first.name.en+' evokes about your situation.','Choose one manageable action suggested by '+last.name.en+'.','Revisit the question after a conversation or new evidence, not just another draw.']
  }
 };
}
