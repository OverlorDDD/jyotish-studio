/** N4.9 chart-conditioned editorial bridge, not an outcome prediction. */
export const N4_OFFLINE_SYNTHESIS_VERSION='n4-house-bridge-v2' as const;
type Lang='uk'|'en';
type Context=0|1|2|3;
const categories:readonly (readonly number[])[]=[[1,5,9],[2,6,10],[3,7,11],[4,8,12]];
const uk=[
 {label:'навчання й особистої ініціативи',choice:'спершу перевірити власний задум на малому прикладі',check:'запишіть одну перевірювану гіпотезу'},
 {label:'ресурсів та щоденної організації',choice:'обмежити бюджет, час і обсяг зобов’язань',check:'поставте кількісну межу часу або витрат'},
 {label:'спілкування й домовленостей',choice:'узгодити очікування з іншою стороною',check:'перевірте одне очікування в розмові'},
 {label:'приватних потреб і внутрішньої опори',choice:'залишити простір для обдумування та відновлення',check:'визначте особисту межу перед згодою'}
] as const;
const en=[
 {label:'learning and personal initiative',choice:'first test your idea on a small example',check:'write down one testable assumption'},
 {label:'resources and daily organization',choice:'bound the time, cost and scope of commitments',check:'set a measurable limit on time or spending'},
 {label:'communication and agreements',choice:'clarify expectations with the other party',check:'check one expectation in a conversation'},
 {label:'private needs and inner foundations',choice:'leave room for reflection and recovery',check:'name one personal boundary before agreeing'}
] as const;
const group=(house:number):Context=>{
 if(!Number.isInteger(house)||house<1||house>12)throw Error('N4 bridge requires a valid 1-based house');
 return categories.findIndex(a=>a.includes(house)) as Context;
};
export function n4OfflineSynthesis(division:number,d1LordHouse:number,vargaLordHouse:number,lang:Lang){
 if(!Number.isInteger(division)||division<2||division>60||!['uk','en'].includes(lang))
  throw Error('N4 bridge received an invalid division or locale');
 const a=group(d1LordHouse),b=group(vargaLordHouse),labels=lang==='uk'?uk:en;
 const left=labels[a],right=labels[b],same=a===b;
 if(lang==='uk'){
  return Object.freeze({
   version:N4_OFFLINE_SYNTHESIS_VERSION,
   contextKey:a+'-'+b,
   analysis:same?
    'У D1 (дім '+d1LordHouse+') та D'+division+' (дім '+vargaLordHouse+
    ') управитель теми вказує на споріднений контекст '+left.label+
    '. Це не обіцянка результату: варто перевірити, як цей напрям проявляється в реальних рішеннях.':
    'У D1 управитель теми пов’язаний із контекстом '+left.label+' (дім '+d1LordHouse+
    '), а в D'+division+' — із контекстом '+right.label+' (дім '+vargaLordHouse+
    '). Традиційно це можна читати як напругу між двома способами діяти, а не як прогноз конкретної події.',
   example:'Коли виникне подібний вибір, порівняйте два підходи: '+left.choice+' або '+right.choice+'.',
   action:same?('Окремий крок для цього зіставлення: '+left.check+'.'):
    ('Окремі перевірки для двох ракурсів: '+left.check+'; потім '+right.check+'.')
  });
 }
 return Object.freeze({
  version:N4_OFFLINE_SYNTHESIS_VERSION,
  contextKey:a+'-'+b,
  analysis:same?
   'In D1 (house '+d1LordHouse+') and D'+division+' (house '+vargaLordHouse+
   '), the topic ruler points toward the related context of '+left.label+
   '. This is not a promised outcome; check how the theme appears in actual decisions.':
   'In D1 the topic ruler relates to '+left.label+' (house '+d1LordHouse+
   '), while D'+division+' places it in the setting of '+right.label+' (house '+vargaLordHouse+
   '). Traditionally this suggests two competing approaches, not a prediction of an event.',
  example:'When facing such a choice, weigh two approaches: '+left.choice+' or '+right.choice+'.',
  action:same?('One chart-specific check: '+left.check+'.'):
   ('Two checks for the contrasting lenses: '+left.check+'; then '+right.check+'.')
 });
}
