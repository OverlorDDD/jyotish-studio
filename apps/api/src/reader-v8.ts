import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildReaderV7} from './reader-v7.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {extractN44Evidence,N44_CLASSICAL_RULESET_VERSION,sourceForRule,
 type ClassicalEvidence} from './reader-classical-n44.ts';

export const READER_V8_VERSION='reader-v8.0.0-n44' as const;
type Lang='uk'|'en';
export type ClassicalReaderInsight={
 division:number;title:string;headline:string;strength:string;challenge:string;
 context:string;step:string;proof:readonly string[];
 ruleIds:readonly string[];
 sources:readonly {id:string;work:string;chapter:string;stanza:string;
  edition:string;review:string;application:string}[];
 timeSensitivity:'ordinary'|'higher'|'near_boundary';
};
export type ClassicalReaderReport={
 version:typeof READER_V8_VERSION;
 ruleSetVersion:typeof N44_CLASSICAL_RULESET_VERSION;
 status:'available'|'unavailable';
 introduction:string;method:string;
 highlights:readonly {id:'strength'|'challenge'|'career';division:number;title:string;text:string}[];
 insights:readonly ClassicalReaderInsight[];
 d60Notice:string;
};
// Modern editorial interpretation of thematic house emphasis, NOT a literal
// verse from Brihat Jataka. Avoid misleading generic D10 "rest/recovery" readings.
const DOMAIN_CONTEXT_UK:Readonly<Record<number,readonly string[]>>={
 10:['власній професійній ініціативі','заробітку та цінності праці','навичках і переговорах','базі для роботи й стабільності',
 'творчих рішеннях і навчанні','щоденних професійних обов’язках','клієнтах і ділових партнерствах',
 'перебудові робочих процесів','підвищенні кваліфікації та наставниках','публічній ролі й результатах',
 'командній підтримці та результатах','закулісній роботі, міжнародних зв’язках і бережному плануванні навантаження'],
 9:['власній позиції у стосунках','спільних цінностях і фінансових домовленостях','розмовах і спільних ініціативах',
 'побутовій безпеці','спільному розвитку','щоденних зобов’язаннях','взаємності та відкритих угодах',
 'довірі під час змін','спільних переконаннях','відповідальності за спільні цілі','дружбі та оточенні',
 'особистому просторі та здатності відновлюватися'],
 24:['власній навчальній стратегії','поясненні знань словами','повторенні й практиці','тихому робочому місці',
 'творчому осмисленні матеріалу','навчальній дисципліні','навчанні через співпрацю','дослідженні складних тем',
 'вчителях і системному розумінні','застосуванні знань у роботі','спільнотах та обміні досвідом',
 'самостійній підготовці'],
 2:['особистій фінансовій ініціативі','регулярному бюджетуванні','навичках монетизації','стабільних витратах на дім',
 'створенні цінності через ідеї','контролі щоденних витрат','спільному бюджеті та договорах',
 'непередбачуваних фінансових зобов’язаннях','освіті у сфері грошей','доході від професійної діяльності',
 'довгострокових цілях','резервах і необхідних витратах']
};
const DOMAIN_CONTEXT_EN:Readonly<Record<number,readonly string[]>>={
 10:['personal professional initiative','pay and the value of work','skills and negotiation','a stable working base',
 'creative solutions and learning','daily professional duties','clients and business partners',
 'restructuring work processes','upskilling and mentorship','public responsibility and results',
 'team support and outcomes','behind-the-scenes work, international ties and sustainable workload'],
 9:['personal boundaries in partnership','shared values and money agreements','communication and joint initiatives',
 'security at home','growing together','everyday commitments','mutuality and agreements',
 'trust during change','shared beliefs','responsibility for joint goals','friendship and social circles',
 'personal space and recovery'],
 24:['one’s learning strategy','explaining knowledge clearly','repetition and practice','a quiet study environment',
 'creative use of knowledge','learning discipline','study through cooperation','complex research',
 'teachers and systematic understanding','applying knowledge in work','learning communities',
 'independent preparation'],
 2:['personal money initiative','consistent budgeting','income-producing skills','stable household spending',
 'creating value through ideas','tracking regular expenses','joint budgets and agreements',
 'unexpected financial commitments','financial education','work-related income',
 'long-term financial goals','reserves and necessary expenses']
};
function focusedHouseMeaning(proof:readonly string[],division:number,lang:Lang):string|null{
 const found=proof.find(p=>p.startsWith('D'+division+'.')&&p.includes('.house='));
 const house=Number(found?.split('.house=')[1]);
 if(!Number.isInteger(house)||house<1||house>12)return null;
 return (lang==='uk'?DOMAIN_CONTEXT_UK:DOMAIN_CONTEXT_EN)[division]?.[house-1]||null;
}
function sentences(active:readonly ClassicalEvidence[],lang:Lang,limit=2){
 return active.slice(0,limit).map(x=>lang==='uk'?x.detailUk:x.detailEn).join(' ');
}
function choose(activations:readonly ClassicalEvidence[],role:ClassicalEvidence['role']){
 return activations.filter(a=>a.role===role);
}
export function buildClassicalReaderV8(chart:CalculatedChart,lang:Lang,asOf:string):ClassicalReaderReport{
 const uk=lang==='uk';
 const basic=buildReaderV7(chart,lang);
 const unavailable:ClassicalReaderReport={
  version:READER_V8_VERSION,ruleSetVersion:N44_CLASSICAL_RULESET_VERSION,
  status:'unavailable',introduction:uk?
   'Детальне класичне прочитання можливе лише за перевіреною натальною картою.':
   'A classical reading requires a verified natal calculation.',
  method:uk?'Правила без перевірених даних не застосовуються.':'No classical rule is applied without verified data.',
  highlights:[],insights:[],d60Notice:basic.d60Notice
 };
 if(!verifiedVargaSource(chart)||basic.status!=='available'||basic.insights.length!==15)return unavailable;
 const insights:ClassicalReaderInsight[]=basic.insights.map(base=>{
  const activations=extractN44Evidence(chart,base.division,asOf);
  const support=choose(activations,'resource');
  const caution=choose(activations,'friction');
  const context=choose(activations,'context');
  const timing=choose(activations,'timing');
  const contrast=activations.some(a=>a.ruleId.startsWith('N44-CONTRAST'));
  const complement=activations.some(a=>a.ruleId.startsWith('N44-COMPLEMENT'));
  const focused=focusedHouseMeaning(base.proof,base.division,lang);
  const headline=(focused?
   (uk?'У темі «'+base.title+'» додаткова карта звертає увагу на '+focused+'. Водночас загальна карта показує ширший життєвий контекст.':
    'For '+base.title.toLowerCase()+', the focused chart points toward '+focused+'. The main chart adds a broader life context.'):
   base.headline)+(contrast?
   (uk?' Загальний потенціал і конкретна реалізація тут потребують різних підходів.':
    'The general potential and its specific expression call for different approaches.'):
   complement?(uk?' Детальна карта додає спосіб роботи зі складнішою темою.':
    'The detailed chart adds a way to work with a complex theme.'):'');
  // The reader must explain an actual circumstance, not stack boilerplate.
  const strength=support.length?
   (uk?'Додатковий показник підтримує цю тему. ':'Another checked factor reinforces this theme. ')+
   sentences(support,lang,1)+' '+(uk?'Як це можна використати: ':'One way to use it: ')+
   base.strength.replace(/^(Можлива опора:\s*|A possible resource is to\s*)/u,'') :
   (uk?'Практична можливість у цій сфері: ':'One useful direction in this area: ')+
   (focused?(uk?'Зверніть увагу на '+focused+'. ':'Explore '+focused+'. '):'')+
   base.strength.replace(/^(Можлива опора:\s*|A possible resource is to\s*)/u,'');
  const ordinaryChallenge=base.challenge.replace(/^(На що звернути увагу:\s*|A pattern worth watching:\s*)/u,'');
  const challenge=caution.length?
   sentences(caution,lang,1)+' '+(uk?'На практиці варто помічати: ':'In daily life, notice whether you tend to ')+
   ordinaryChallenge :
   (uk?'Одна з можливих складнощів: ':'A possible trade-off is to ')+ordinaryChallenge;
  const situational=context.length?
   sentences(context,lang,2):
   (uk?'Додаткового прямого класичного правила для цього поєднання поки не підтверджено; опис є сучасним узагальненням розрахованих положень.':
    'No specific additional classical rule has been verified for this combination; this is a modern synthesis of calculated placements.');
  const current=timing.length?
   (' '+sentences(timing,lang,1)):'';
  const direct=context.some(a=>a.application==='direct_natal');
  const methodology=uk?
   (direct?'Класичне правило застосовано до факту з основної карти. ':
    'Давній принцип тут застосовано як сучасний тематичний орієнтир, не як буквальний прогноз. '):
   (direct?'A historical rule is tied to an actual natal placement. ':
    'An older principle is used as a modern thematic lens, not a literal prediction. ');
  const proof=unique([...base.proof,...activations.flatMap(a=>a.facts)]);
  const ruleIds=unique(activations.map(a=>a.ruleId));
  const sources=unique(activations.map(a=>a.sourceId)).map(id=>{
   const source=sourceForRule(id);
   return {id,work:source.work,chapter:source.chapter,stanza:source.stanza,
    edition:source.edition,review:source.review,
    application:activations.some(a=>a.sourceId===id&&a.application==='direct_natal')?
     'direct_natal':'modern_extension_or_dasha'};
  });
  return {
   division:base.division,title:base.title,headline,strength,challenge,
   context:methodology+situational+current,
   step:base.step,proof,ruleIds,sources,timeSensitivity:base.timeSensitivity
  };
 });
 const select=(d:number)=>insights.find(x=>x.division===d)!;
 const activated=(d:number,kind:'resource'|'friction')=>{
  const rules=extractN44Evidence(chart,d,asOf);
  return rules.filter(r=>r.role===kind).length*3+rules.filter(r=>r.role==='context').length;
 };
 // Choose actual chart-specific leading themes; the work area remains explicit.
 const primary=([27,24,2,9,3,4,12,7,16,20,40,45,1,30,10] as number[])
  .sort((a,b)=>activated(b,'resource')-activated(a,'resource'))[0];
 const secondary=([30,27,9,2,4,24,7,3,12,20,45,1,16,40] as number[])
  .filter(d=>d!==primary)
  .sort((a,b)=>activated(b,'friction')-activated(a,'friction'))[0];
 const highlights=[
  {id:'strength' as const,division:primary,title:uk?'Де у вас може бути опора':'Where you may find support',
   text:select(primary).strength},
  {id:'challenge' as const,division:secondary,title:uk?'Що варто перевірити':'A pattern to watch',
   text:select(secondary).challenge},
  {id:'career' as const,division:10,title:uk?'Професійний напрям':'Your professional direction',
   text:select(10).context+' '+select(10).step}
 ];
 return {
  version:READER_V8_VERSION,ruleSetVersion:N44_CLASSICAL_RULESET_VERSION,
  status:'available',
  introduction:uk?
   'Це персональне прочитання за традиційними джерелами й перевіреними розрахунками. Кожна тема поєднує кілька показників, пояснює можливості, обмеження та пропонує конкретний крок. Правила з книг і наші сучасні узагальнення позначені окремо.':
   'This is a traditional, calculation-grounded reading. Each theme connects several indicators, explores opportunities and limitations, and suggests a concrete next step. Historical rules and modern extensions remain clearly distinguishable.',
  method:uk?
   'Джерела: Brihat Jataka (переклад 1905) і Laghu Parashari (1900). OCR-уривки прочитані, але не всі звірені зі сканами; дослівні прогнози не переносяться. Вищі карти залежать від точності часу народження.':
   'Sources: Brihat Jataka (1905 translation) and Laghu Parashari (1900). OCR excerpts were reviewed but not all scan-verified; literal predictions are not imported. Higher divisions depend on accurate birth time.',
  highlights,insights,d60Notice:basic.d60Notice
 };
}
/** Short evidence-bound context for the cloud writer. No DOB, coordinates or cities. */
export function compactClassicalReaderV8ForAi(chart:CalculatedChart,asOf:string):string{
 const r=buildClassicalReaderV8(chart,'en',asOf);
 if(r.status!=='available')return 'Classical Reader 8: source-bound synthesis unavailable. Use D1/D9/D10 only.';
 const selected=[10,27,30,9,24,2];
 return ['Classical Reader 8 evidence: historical book metadata are OCR-reviewed, not independently scan-certified.',
  ...selected.map(d=>{
   const i=r.insights.find(x=>x.division===d)!;
   return 'D'+d+' '+i.title+'; '+i.headline+' Resource: '+i.strength+
    ' Concern: '+i.challenge+' Context: '+i.context+
    ' Rules: '+(i.ruleIds.join(',')||'no additional directly verified rule');
  }),
  'Distinguish the literal natal rules from modern Dn generalization. Never invent planetary houses or repeat fatalistic old predictions.',
  'Do not personalize D60; do not claim actual life outcomes as proven.'
 ].join('\n').slice(0,6500);
}
).test(p));
 const house=Number(found?.split('=')[1]);
 if(!Number.isInteger(house)||house<1||house>12)return null;
 return (lang==='uk'?DOMAIN_CONTEXT_UK:DOMAIN_CONTEXT_EN)[division]?.[house-1]||null;
}
function unique<T>(arr:readonly T[]):T[]{return [...new Set(arr)];}
function sentences(active:readonly ClassicalEvidence[],lang:Lang,limit=2){
 return active.slice(0,limit).map(x=>lang==='uk'?x.detailUk:x.detailEn).join(' ');
}
function choose(activations:readonly ClassicalEvidence[],role:ClassicalEvidence['role']){
 return activations.filter(a=>a.role===role);
}
export function buildClassicalReaderV8(chart:CalculatedChart,lang:Lang,asOf:string):ClassicalReaderReport{
 const uk=lang==='uk';
 const basic=buildReaderV7(chart,lang);
 const unavailable:ClassicalReaderReport={
  version:READER_V8_VERSION,ruleSetVersion:N44_CLASSICAL_RULESET_VERSION,
  status:'unavailable',introduction:uk?
   'Детальне класичне прочитання можливе лише за перевіреною натальною картою.':
   'A classical reading requires a verified natal calculation.',
  method:uk?'Правила без перевірених даних не застосовуються.':'No classical rule is applied without verified data.',
  highlights:[],insights:[],d60Notice:basic.d60Notice
 };
 if(!verifiedVargaSource(chart)||basic.status!=='available'||basic.insights.length!==15)return unavailable;
 const insights:ClassicalReaderInsight[]=basic.insights.map(base=>{
  const activations=extractN44Evidence(chart,base.division,asOf);
  const support=choose(activations,'resource');
  const caution=choose(activations,'friction');
  const context=choose(activations,'context');
  const timing=choose(activations,'timing');
  const contrast=activations.some(a=>a.ruleId.startsWith('N44-CONTRAST'));
  const complement=activations.some(a=>a.ruleId.startsWith('N44-COMPLEMENT'));
  const headline=base.headline+(contrast?
   (uk?' Загальний потенціал і конкретна реалізація тут потребують різних підходів.':
    'The general potential and its specific expression call for different approaches.'):
   complement?(uk?' Детальна карта додає спосіб роботи зі складнішою темою.':
    'The detailed chart adds a way to work with a complex theme.'):'');
  // The reader must explain an actual circumstance, not stack boilerplate.
  const strength=support.length?
   (uk?'Додатковий показник підтримує цю тему. ':'Another checked factor reinforces this theme. ')+
   sentences(support,lang,1)+' '+(uk?'Як це можна використати: ':'One way to use it: ')+
   base.strength.replace(/^(Можлива опора:\s*|A possible resource is to\s*)/u,'') :
   (uk?'Практична можливість у цій сфері: ':'One useful direction in this area: ')+
   base.strength.replace(/^(Можлива опора:\s*|A possible resource is to\s*)/u,'');
  const ordinaryChallenge=base.challenge.replace(/^(На що звернути увагу:\s*|A pattern worth watching:\s*)/u,'');
  const challenge=caution.length?
   sentences(caution,lang,1)+' '+(uk?'На практиці варто помічати: ':'In daily life, notice whether you tend to ')+
   ordinaryChallenge :
   (uk?'Одна з можливих складнощів: ':'A possible trade-off is to ')+ordinaryChallenge;
  const situational=context.length?
   sentences(context,lang,2):
   (uk?'Додаткового прямого класичного правила для цього поєднання поки не підтверджено; опис є сучасним узагальненням розрахованих положень.':
    'No specific additional classical rule has been verified for this combination; this is a modern synthesis of calculated placements.');
  const current=timing.length?
   (' '+sentences(timing,lang,1)):'';
  const direct=context.some(a=>a.application==='direct_natal');
  const methodology=uk?
   (direct?'Класичне правило застосовано до факту з основної карти. ':
    'Давній принцип тут застосовано як сучасний тематичний орієнтир, не як буквальний прогноз. '):
   (direct?'A historical rule is tied to an actual natal placement. ':
    'An older principle is used as a modern thematic lens, not a literal prediction. ');
  const proof=unique([...base.proof,...activations.flatMap(a=>a.facts)]);
  const ruleIds=unique(activations.map(a=>a.ruleId));
  const sources=unique(activations.map(a=>a.sourceId)).map(id=>{
   const source=sourceForRule(id);
   return {id,work:source.work,chapter:source.chapter,stanza:source.stanza,
    edition:source.edition,review:source.review,
    application:activations.some(a=>a.sourceId===id&&a.application==='direct_natal')?
     'direct_natal':'modern_extension_or_dasha'};
  });
  return {
   division:base.division,title:base.title,headline,strength,challenge,
   context:methodology+situational+current,
   step:base.step,proof,ruleIds,sources,timeSensitivity:base.timeSensitivity
  };
 });
 const select=(d:number)=>insights.find(x=>x.division===d)!;
 const activated=(d:number,kind:'resource'|'friction')=>{
  const rules=extractN44Evidence(chart,d,asOf);
  return rules.filter(r=>r.role===kind).length*3+rules.filter(r=>r.role==='context').length;
 };
 // Choose actual chart-specific leading themes; the work area remains explicit.
 const primary=([27,24,2,9,3,4,12,7,16,20,40,45,1,30,10] as const)
  .sort((a,b)=>activated(b,'resource')-activated(a,'resource'))[0];
 const secondary=([30,27,9,2,4,24,7,3,12,20,45,1,16,40] as const)
  .filter(d=>d!==primary)
  .sort((a,b)=>activated(b,'friction')-activated(a,'friction'))[0];
 const highlights=[
  {id:'strength' as const,division:primary,title:uk?'Де у вас може бути опора':'Where you may find support',
   text:select(primary).strength},
  {id:'challenge' as const,division:secondary,title:uk?'Що варто перевірити':'A pattern to watch',
   text:select(secondary).challenge},
  {id:'career' as const,division:10,title:uk?'Професійний напрям':'Your professional direction',
   text:select(10).context+' '+select(10).step}
 ];
 return {
  version:READER_V8_VERSION,ruleSetVersion:N44_CLASSICAL_RULESET_VERSION,
  status:'available',
  introduction:uk?
   'Це персональне прочитання за традиційними джерелами й перевіреними розрахунками. Кожна тема поєднує кілька показників, пояснює можливості, обмеження та пропонує конкретний крок. Правила з книг і наші сучасні узагальнення позначені окремо.':
   'This is a traditional, calculation-grounded reading. Each theme connects several indicators, explores opportunities and limitations, and suggests a concrete next step. Historical rules and modern extensions remain clearly distinguishable.',
  method:uk?
   'Джерела: Brihat Jataka (переклад 1905) і Laghu Parashari (1900). OCR-уривки прочитані, але не всі звірені зі сканами; дослівні прогнози не переносяться. Вищі карти залежать від точності часу народження.':
   'Sources: Brihat Jataka (1905 translation) and Laghu Parashari (1900). OCR excerpts were reviewed but not all scan-verified; literal predictions are not imported. Higher divisions depend on accurate birth time.',
  highlights,insights,d60Notice:basic.d60Notice
 };
}
/** Short evidence-bound context for the cloud writer. No DOB, coordinates or cities. */
export function compactClassicalReaderV8ForAi(chart:CalculatedChart,asOf:string):string{
 const r=buildClassicalReaderV8(chart,'en',asOf);
 if(r.status!=='available')return 'Classical Reader 8: source-bound synthesis unavailable. Use D1/D9/D10 only.';
 const selected=[10,27,30,9,24,2];
 return ['Classical Reader 8 evidence: historical book metadata are OCR-reviewed, not independently scan-certified.',
  ...selected.map(d=>{
   const i=r.insights.find(x=>x.division===d)!;
   return 'D'+d+' '+i.title+'; '+i.headline+' Resource: '+i.strength+
    ' Concern: '+i.challenge+' Context: '+i.context+
    ' Rules: '+(i.ruleIds.join(',')||'no additional directly verified rule');
  }),
  'Distinguish the literal natal rules from modern Dn generalization. Never invent planetary houses or repeat fatalistic old predictions.',
  'Do not personalize D60; do not claim actual life outcomes as proven.'
 ].join('\n').slice(0,6500);
}
