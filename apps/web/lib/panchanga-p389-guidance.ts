/** P3.8.9: Evidence-led activity guidance, not a flattened status headline.
 * Never turn a missing classical rule into a negative result or a fabricated
 * "favorable" certificate. An analogy is explicitly an analogy. A partial
 * ceremonial election cannot be represented as fully verified.
 */
import {P38_ACTIVITIES,p38Activity,type P38Moment,type P38ActivityId}
 from './panchanga-p38-decision.ts';
import {scoreP390} from './panchanga-p390-scoring.ts';

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
 fierce:{uk:'сувора',en:'fierce'},
 ordinary:{uk:'змішана',en:'mixed'},
};
const localized=(uk:string,en:string,locale:P389Locale)=>locale==='uk'?uk:en;
const list=(xs:string[],locale:P389Locale)=>xs.join(locale==='uk'?', ':', ');
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
  throw Error('P389 requires verified calendar screening');
 const activity=p38Activity(moment.activityId),rating=scoreP390({
  activityId:activity.id,method:activity.method,
  observations:moment.observations,personalized:moment.personalized
 });
 const uk=locale==='uk',name=activity.name[locale];
 const support=moment.observations.find(e=>e.scope==='activity'&&e.polarity==='supports');
 const restriction=moment.observations.find(e=>e.polarity==='excludes');
 const caution=moment.observations.find(e=>e.polarity==='cautions');
 const label=(e:typeof support)=>e?.description[locale]||'';
 const match=activity.matchingNakshatra.map(c=>CLASS[c]?.[locale]||c);
 const current=CLASS[moment.matchedNakshatraClass]?.[locale]||moment.matchedNakshatraClass;
 // One detail in the summary, one optional actionable caution; never
 // interpolate the same observation into reason, guidance and footer.
 const reason=restriction?label(restriction):
  support?localized('Накшатра '+current+' відповідає обраній справі.',
    'The '+current+' Nakshatra matches this undertaking.',locale):
  match.length?localized('Накшатра '+current+'; відповідні класи: '+list(match,locale)+'.',
    'Current Nakshatra: '+current+'; matching classes: '+list(match,locale)+'.',locale):
  localized('Окремого збігу з накшатрою для цієї справи не виявлено.',
   'No distinct Nakshatra match is verified for this undertaking.',locale);
 const sharedActivities=p389SharedRuleActivities(activity.id);
 const scope=localized('Індекс традиційних показників, не ймовірність успіху.',
   'Traditional-factor index, not an outcome probability.',locale);
 if(activity.method==='routine')
  return {headline:localized('Практику можна продовжувати сьогодні.',
   'You can continue your regular practice today.',locale),
   reason:localized('Щоденна практика не потребує окремого нового старту.',
    'Ongoing daily practice does not need a new electional start.',locale),
   nextStep:localized('Оберіть зручний час.','Choose a practical time.',locale),scope,sharedActivities};
 if(restriction)
  return {headline:localized('Цей момент не підходить для початку.',
   'This start moment has a specific restriction.',locale),
   reason,nextStep:localized('Перевірте іншу годину або дату.',
    'Try another hour or date.',locale),scope,sharedActivities};
 if(activity.method==='special_election'){
  const heading=rating.score!==null&&rating.score>=60&&rating.hasActivitySupport?
   localized('Попередньо сприятливо для: '+name+'.',
    'Preliminarily favorable for: '+name+'.',locale):
   localized('Для цієї події потрібна додаткова спеціальна перевірка.',
    'This event needs additional specialist verification.',locale);
  return {headline:heading,reason,
   nextStep:localized('Календарний індекс є попереднім. Повну мухурту тут ще не сертифіковано — вимоги нижче.',
    'Calendar index is preliminary. Full Muhurta is not certified here; see the requirements below.',locale),
   scope,sharedActivities};
 }
 if(activity.method==='analogy')
  return {headline:rating.score!==null&&rating.score>=60&&support?
    localized('Попередньо сприятливо за аналогією.',
      'Preliminarily favorable by analogy.',locale):
    localized('Поки немає достатніх ознак для впевненого висновку.',
      'Not enough verified activity-specific evidence yet.',locale),
   reason,nextStep:caution?label(caution):
    localized('Використано аналогію з традиційними правилами; порівняйте сусідні години.',
     'Compare nearby hours; analogy is not a separate classical rule.',locale),
   scope,sharedActivities};
 const headline=rating.score!==null&&rating.hasActivitySupport&&rating.score>=68?
  localized('Сприятливо для: '+name+'.','Favorable for: '+name+'.',locale):
  rating.score!==null&&rating.hasActivitySupport&&rating.score>=60?
  localized('Переважно сприятливо для: '+name+'.','Mostly favorable for: '+name+'.',locale):
  rating.score!==null&&rating.hasActivitySupport?
  localized('Змішані показники для: '+name+'.','Mixed factors for: '+name+'.',locale):
  localized('Недостатньо позитивних ознак саме для цієї справи.',
   'Not enough verified positive factors for this undertaking.',locale);
 return {headline,reason,
  nextStep:caution?label(caution):
   localized('Порівняйте інші доступні години.',
    'Compare other available hours.',locale),
  scope,sharedActivities};
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
