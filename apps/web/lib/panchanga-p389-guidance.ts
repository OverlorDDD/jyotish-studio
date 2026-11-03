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

/** Human-readable audited reason IDs from the PRIVATE Time Finder at its own
 * verified event UTC (never reuse evidence from a different day/hour).
 * Unknown IDs are hidden, not silently assigned a made-up interpretation.
 */
const WINDOW_RULES:Record<string,{uk:string;en:string}>={
 CLASS_FIXED:{uk:'Накшатра стійкого класу відповідає виду справи.',en:'Fixed Nakshatra matches this activity.'},
 CLASS_GENTLE:{uk:'Лагідний клас накшатри відповідає справі.',en:'Gentle Nakshatra matches this activity.'},
 CLASS_SWIFT:{uk:'Швидкий клас накшатри відповідає справі.',en:'Swift Nakshatra matches this activity.'},
 CLASS_MOVABLE:{uk:'Рухливий клас накшатри відповідає справі.',en:'Movable Nakshatra matches this activity.'},
 CLASS_SHARP:{uk:'Гострий клас накшатри відповідає цій практиці.',en:'Sharp Nakshatra matches the chosen practice.'},
 RAHU_START:{uk:'Момент потрапляє в Раху-калам.',en:'Start is inside Rahu Kalam.'},
 VISHTI_AUSPICIOUS_START:{uk:'Вішті/Бхадра: обмеження для нового початку.',en:'Vishti/Bhadra restricts new auspicious starts.'},
 TARA_SUPPORT:{uk:'Персональна Тарабала підтримує момент.',en:'Personal Tarabala is supportive.'},
 TARA_FIRST_CYCLE:{uk:'Тара у першому циклі потребує перевірки винятків.',en:'First-cycle Tara requires exception review.'},
 CHANDRA_SUPPORT:{uk:'Персональна Чандрабала підтримує момент.',en:'Personal Chandrabala is supportive.'},
 CHANDRA_ASHTAMA:{uk:'Аштама-Чандра: персональне застереження.',en:'Ashtama Chandra is a personal caution.'},
 CHANDRA_OTHER:{uk:'Чандрабала не входить до підтримувальних положень.',en:'Chandrabala is not in a supportive position.'},
 RAMAN_TRAVEL_STAR:{uk:'Накшатра виключена для початку подорожі.',en:'The Nakshatra is excluded for starting a journey.'},
 RAMAN_TRAVEL_TITHI:{uk:'Тітхі виключена для початку подорожі.',en:'The Tithi is excluded for starting a journey.'},
 RAMAN_BORROW_STAR:{uk:'Накшатра виключена для позики.',en:'The Nakshatra is excluded for borrowing.'},
 RAMAN_BORROW_JANMA:{uk:'Початок позики в натальну накшатру виключено.',en:'Borrowing at the natal Nakshatra is excluded.'},
 RAMAN_TITHI_CAUTION:{uk:'Ця тітхі потребує додаткової перевірки.',en:'This Tithi requires additional review.'},
 RAMAN_IMPORTANT_TITHI:{uk:'Тітхі великої церемонії потребує перевірки.',en:'Ceremonial Tithi requires review.'},
 SPECIAL_ELECTION_RULE_COVERAGE_INCOMPLETE:{uk:'Частина спеціальних правил не сертифікована.',en:'Some specialist rules are not yet certified.'},
 MARRIAGE_PREFERRED_STAR:{uk:'Накшатра входить до весільного переліку Рамана.',en:'The Nakshatra is on Raman’s permitted wedding list.'},
 MARRIAGE_NAKSHATRA_UNLISTED:{uk:'Накшатра не входить до дозволеного весільного переліку.',en:'The Nakshatra is outside the permitted wedding list.'},
 MARRIAGE_TUESDAY:{uk:'Для весілля Раман виключає вівторок.',en:'Raman excludes Tuesday for marriage.'},
 MARRIAGE_TITHI_EXCLUSION:{uk:'Весільна тітхі виключена правилами Рамана.',en:'Raman excludes this wedding Tithi.'},
 MARRIAGE_NITYA_YOGA:{uk:'Нітья-йога виключена для весілля.',en:'This Nitya Yoga is excluded for marriage.'},
 MARRIAGE_HOUSE_7_OCCUPIED:{uk:'Сьомий дім лагни події зайнятий.',en:'Event Lagna seventh house is occupied.'},
 MARRIAGE_MARS_HOUSE_8:{uk:'Марс у восьмому домі лагни події.',en:'Mars is in event Lagna eighth house.'},
 MARRIAGE_VENUS_HOUSE_6:{uk:'Венера у шостому домі лагни події.',en:'Venus is in event Lagna sixth house.'},
 MARRIAGE_MALEFICS_LAGNA:{uk:'Шкідливі планети займають лагну події.',en:'Malefics occupy the event Lagna.'},
 MARRIAGE_LAGNA_HEMMED:{uk:'Лагна події затиснута між шкідливими планетами.',en:'Event Lagna is hemmed by malefics.'},
 MARRIAGE_MOON_ASSOCIATION:{uk:'Місяць має заборонене для цієї традиції з’єднання чи аспект.',en:'Moon has a restricted conjunction or aspect.'},
 MARRIAGE_NAKSHATRA_PADA:{uk:'Пада накшатри виключена для весілля.',en:'This Nakshatra Pada is excluded for marriage.'},
 MARRIAGE_VISHTI:{uk:'Вішті виключена для весілля.',en:'Vishti is excluded for marriage.'},
 MARRIAGE_BRIGHT_TITHI:{uk:'Світла тітхі входить до рекомендованого весільного переліку.',en:'Bright-half Tithi is on the wedding preference list.'},
 MARRIAGE_LAGNA_GEMINI_VIRGO_LIBRA:{uk:'Лагна події у Близнюках, Діві або Терезах — традиційно бажана.',en:'Event Lagna in Gemini, Virgo or Libra is traditionally preferred.'},
 MARRIAGE_ARDHAMA_YOGA:{uk:'Зафіксовано спеціальну йогу Ардхама.',en:'The special Ardhama yoga is present.'},
 FOUNDATION_BEST_NAKSHATRA:{uk:'Накшатра входить до бажаного переліку для фундаменту.',en:'Nakshatra is on the preferred foundation list.'},
 FOUNDATION_MIDDLE_NAKSHATRA:{uk:'Накшатра має проміжну придатність для фундаменту.',en:'Nakshatra is in the middling foundation group.'},
 FOUNDATION_NAKSHATRA_UNLISTED:{uk:'Накшатра виключена для початку фундаменту.',en:'Nakshatra is excluded for foundation starts.'},
 FOUNDATION_TITHI:{uk:'Тітхі не рекомендована для фундаменту.',en:'Tithi is not recommended for a foundation.'},
 FOUNDATION_SATURDAY:{uk:'Субота виключена для фундаменту.',en:'Saturday is excluded for foundations.'},
 FOUNDATION_MONDAY_WANING:{uk:'Понеділок зі спадним Місяцем виключено.',en:'Waning-Moon Monday is excluded.'},
 FOUNDATION_MOVABLE_LAGNA:{uk:'Рухлива лагна виключена для фундаменту.',en:'Movable event Lagna is excluded for foundation.'},
 FOUNDATION_FIXED_LAGNA:{uk:'Стійка лагна події підтримує закладання фундаменту.',en:'Fixed event Lagna supports laying a foundation.'},
 FOUNDATION_EIGHTH_OCCUPIED:{uk:'Восьмий дім лагни події зайнятий.',en:'Event Lagna eighth house is occupied.'},
 FOUNDATION_EIGHTH_MALEFIC_ASPECT:{uk:'На восьмий дім є шкідливий аспект.',en:'The event eighth house receives a malefic aspect.'},
 FOUNDATION_RAMAN_COMBINATION_1:{uk:'Зафіксовано спеціальну рекомендовану комбінацію для фундаменту.',en:'A special recommended foundation combination is present.'},
 RAMAN_PANCHAKA_SCOPE:{uk:'Панчака виключає цей тип справи для цього моменту.',en:'Panchaka restricts this undertaking at the event moment.'}
};
export function p389WindowReason(id:string,locale:P389Locale):string|null{
 if(!id||id.length>128)return null;
 const known=WINDOW_RULES[id];
 if(known)return known[locale];
 const match=/^RAMAN_YOGA_(6|9|10|17|27)$/.exec(id);
 if(match)return localized('Йога №'+match[1]+' потребує перевірки для важливого початку.',
  'Nitya Yoga #'+match[1]+' requires caution for a major start.',locale);
 return null;
}
