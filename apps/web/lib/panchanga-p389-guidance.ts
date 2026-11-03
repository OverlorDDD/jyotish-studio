/** P3.8.9: Evidence-led activity guidance, not a flattened status headline.
 * Never turn a missing classical rule into a negative result or a fabricated
 * "favorable" certificate. An analogy is explicitly an analogy. A partial
 * ceremonial election cannot be represented as fully verified.
 */
import {P38_ACTIVITIES,p38Activity,type P38Moment,type P38ActivityId}
 from './panchanga-p38-decision.ts';

export type P389Locale='uk'|'en';
export type P389Guidance={
 headline:string;
 reason:string;
 nextStep:string;
 scope:string;
 sharedActivities:P38ActivityId[];
};
const CLASS:Record<string,{uk:string;en:string}>={
 fixed:{uk:'стійка',en:'fixed'},
 gentle:{uk:'лагідна',en:'gentle'},
 swift:{uk:'швидка',en:'swift'},
 movable:{uk:'рухлива',en:'movable'},
 sharp:{uk:'гостра',en:'sharp'},
 cruel:{uk:'сувора',en:'fierce'},
 ordinary:{uk:'змішана',en:'mixed'},
};
const localized=(uk:string,en:string,locale:P389Locale)=>locale==='uk'?uk:en;
const list=(xs:string[],locale:P389Locale)=>xs.join(locale==='uk'?', ':', ');
const SPECIAL_GAPS:Partial<Record<P38ActivityId,{uk:string;en:string}>>={
 wedding:{
  uk:'Для остаточного весільного висновку ще не сертифіковано повну перевірку 21 доші, усіх 8 кут, винятків і взаємодії двох натальних карт. Galaxiora зараз не може видати фінальну весільну мухурту.',
  en:'The full set of 21 doshas, all 8 Kutas, exceptions and two-chart compatibility is not certified. Galaxiora cannot issue a final wedding Muhurta yet.'},
 foundation:{
  uk:'Перевірено лише частину спеціальних правил фундаменту; повну перевірку Васту, D4 і винятків ще не сертифіковано.',
  en:'Only a subset of foundation rules has been verified; Vastu, D4 and exceptions are not yet certified.'}
};
export function p389SharedRuleActivities(activityId:P38ActivityId):P38ActivityId[]{
 const a=p38Activity(activityId);
 if(a.method!=='direct'&&a.method!=='analogy')return [];
 const fingerprint=(item:typeof a)=>[
  item.method,[...item.matchingNakshatra].sort().join(','),
  // Travel is additionally screened for Raman-specific star/tithi vetoes.
  item.category==='travel'?'travel-specific':'',
  item.id==='borrowing_money'?'borrowing-specific':''
 ].join('|');
 return P38_ACTIVITIES.filter(b=>b.id!==a.id&&fingerprint(b)===fingerprint(a))
  .map(b=>b.id);
}
export function p389Guidance(moment:P38Moment,locale:P389Locale):P389Guidance{
 if(moment.version!=='p38-election-screening-v1'||
    moment.certification!=='calendar-screening-only')
  throw Error('P389 only describes verified P38 calendar screening');
 const activity=p38Activity(moment.activityId);
 const star=CLASS[moment.matchedNakshatraClass]?.[locale]||
  moment.matchedNakshatraClass;
 const preferred=activity.matchingNakshatra.map(c=>CLASS[c]?.[locale]||c);
 const evidence=moment.observations;
 const actualSupport=evidence.filter(e=>e.scope==='activity'&&e.polarity==='supports');
 const exclusions=evidence.filter(e=>e.polarity==='excludes');
 const cautions=evidence.filter(e=>e.polarity==='cautions');
 const personal=evidence.filter(e=>e.scope==='personal'&&e.polarity!=='context');
 const distinct=p389SharedRuleActivities(activity.id);
 const name=activity.name[locale];
 const scope=localized(
  'Це перевірка календарних показників для конкретної справи, а не передбачення результату.',
  'This is a source-backed calendar screening for an undertaking, not an outcome prediction.',locale);
 const theReason=(x:typeof evidence)=>x.slice(0,2).map(e=>e.description[locale]).join(' ');
 const preferredText=preferred.length?localized(
  'Традиційні відповідні класи: '+list(preferred,locale)+'. Поточний клас: '+star+'.',
  'Documented matching classes: '+list(preferred,locale)+'. Current class: '+star+'.',locale):
  localized('Для цієї справи немає окремого перевіреного правила за класом накшатри.',
  'No activity-specific verified Nakshatra-class rule is implemented for this undertaking.',locale);
 const base={
  scope,sharedActivities:distinct,
  reason:preferredText+' '+(theReason([...exclusions,...cautions,...actualSupport,...personal])||
   localized('Не виявлено окремих застосовних сигналів для цього моменту.',
    'No additional applicable signals were detected at this moment.',locale))
 };
 if(activity.method==='routine')
  return {...base,headline:localized('Продовжуйте звичайну практику — окремий час початку не потрібний.',
    'Continue your regular practice — no special start-time election is needed.',locale),
   nextStep:localized('Оберіть час, зручний для щоденної практики.',
    'Choose a practical time for your usual routine.',locale)};
 if(exclusions.length)
  return {...base,headline:localized('Не обирайте цей момент: виявлено конкретне обмеження для початку.',
   'Avoid this start moment: a documented restriction applies.',locale),
   nextStep:localized('Причина: '+theReason(exclusions)+' Перевірте інший момент або дату.',
    'Reason: '+theReason(exclusions)+' Check a different moment or date.',locale)};
 if(activity.method==='special_election'){
  const notable=actualSupport.length?
   localized('Є попередня підтримка окремого фактора, але вона не завершує спеціальну перевірку.',
    'A preliminary activity factor is supportive, but the special election is incomplete.',locale):
   cautions.length?localized('Виявлені календарні застереження; спеціальні правила ще не завершено.',
    'Calendar cautions were found; specialist checks remain incomplete.',locale):
   localized('Спеціальна перевірка ще не завершена — позитивного висновку немає.',
    'Specialized verification is incomplete; no positive verdict is available.',locale);
  return {...base,headline:notable,
   nextStep:(SPECIAL_GAPS[activity.id]?.[locale]||localized(
    'Для цієї справи бракує перевіреного повного набору спеціальних правил. Можна перевіряти календарні фактори та шукати попередні інтервали, але не видавати їх за повну мухурту.',
    'A complete verified specialist rule set is unavailable. You may inspect calendar factors and preliminary windows, not treat them as a full Muhurta.',locale))};
 }
 if(activity.method==='analogy')
  return {...base,headline:actualSupport.length?
   localized('Є відповідність за аналогією, а не окрема класична мухурта.',
    'There is an analogical match, not a separately established classical Muhurta.',locale):
   localized('Для цієї дії немає підтвердженого окремого сприятливого правила.',
    'No separate documented favorable rule was established for this activity.',locale),
   nextStep:localized('Показано лише аналогію з класично описаними діями. Не робіть із неї висновку, що подія точно буде вдалою.',
    'This is an analogy to documented classical activities, not proof this event will succeed.',locale)};
 if(actualSupport.length&&cautions.length)
  return {...base,headline:localized('Для цієї справи накшатра підходить, але є конкретні застереження.',
    'The Nakshatra matches this undertaking, but specific cautions apply.',locale),
   nextStep:localized('Застереження: '+theReason(cautions)+' Перевірте інший момент із меншим числом обмежень.',
    'Caution: '+theReason(cautions)+' Compare another moment with fewer restrictions.',locale)};
 if(actualSupport.length)
  return {...base,headline:localized('Є підтверджена традиційна відповідність для цієї справи.',
    'There is documented traditional support for this undertaking.',locale),
   nextStep:localized('Порівняйте конкретні години перед початком. Це календарний відбір, а не гарантія результату.',
    'Compare exact start times. This is a calendar screening, not an outcome guarantee.',locale)};
 if(cautions.length)
  return {...base,headline:localized('Є конкретне застереження, але підтвердженої підтримки для цієї справи немає.',
    'A specific caution applies, without documented activity-specific support.',locale),
   nextStep:localized('Застереження: '+theReason(cautions)+' Це не загальна заборона на весь день.',
    'Caution: '+theReason(cautions)+' It is not a blanket restriction on the entire day.',locale)};
 return {...base,headline:localized('Для цієї дії немає окремої підтвердженої сприятливої ознаки.',
   'No separate verified favorable criterion for this undertaking.',locale),
  nextStep:localized('Це означає невизначеність, а не несприятливий день. Порівняйте іншу дату або справу з перевіреними правилами.',
   'This is insufficient evidence, not an unfavorable day. Compare another date or an activity with documented rules.',locale)};
}
