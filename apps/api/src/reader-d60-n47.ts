/**
 * N4.7 D60: bounded sign-only comparison with D1; never a birth-time certificate.
 * D60 house/lagna interpretation is prohibited even when an HH:MM value was entered.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {N4_D60_VERSION,N4_D60_METHOD,type D60Candidate} from './n4-d60-candidate.ts';
export const D60_PREVIEW_VERSION='d60-conditional-signs-n47-v1' as const;
type Lang='uk'|'en';
type Factor={planet:string;d1Sign:number;d60Sign:number;boundaryDistanceArcseconds:number;note:string};
export type D60Preview={version:typeof D60_PREVIEW_VERSION;status:'conditional_signs'|'unavailable';
 title:string;intro:string;factors:readonly Factor[];warning:string};
const UK_SIGNS=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const EN_SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGNS_UK_MEANING=[
 'пряме починання','терпіння й стабільність','гнучкий обмін думками','потребу в безпечній опорі',
 'творчий самовираз','увагу до деталей','взаємність і домовленості','готовність проходити зміни',
 'пошук сенсу й простору','структуру та довгий шлях','незалежне мислення','уяву й співчуття'
] as const;
const SIGNS_EN_MEANING=[
 'direct initiative','patience and stability','flexible exchange of ideas','a need for a secure base',
 'creative expression','attention to detail','reciprocity and agreements','the ability to move through change',
 'seeking meaning and space','structure and the long view','independent thinking','imagination and compassion'
] as const;
const PRACTICE_UK:Readonly<Record<string,string>>={
 Sun:'Особиста позиція може ставати сильнішою там, де сміливість поєднується з відповідальністю, а не з потребою довести перевагу.',
 Moon:'Емоційна чутливість може поглиблювати розуміння людей, але надмірна вразливість до настрою оточення стирає власний ритм.',
 Mars:'Сила волі проявляється найкраще, коли напір має напрям; без нього рішучість може ставати зайвим спротивом.',
 Mercury:'Гнучкий розум допомагає знайти несподіваний зв’язок, але справжня ясність вимагає відрізняти точне слово від швидкої відповіді.',
 Jupiter:'Пошук сенсу може вести до глибоких знань, проте красива ідея набуває ваги лише тоді, коли витримує живий досвід.',
 Venus:'Прагнення гармонії дарує тонке відчуття іншого, але спокій, куплений постійним замовчуванням, рідко буває справжнім.',
 Saturn:'Витривалість стає опорою, доки обов’язок має сенс; без цього навіть сильна дисципліна перетворюється на тягар.'
};
const PRACTICE_EN:Readonly<Record<string,string>>={
 Sun:'When taking responsibility, separate your own view from the need for approval.',
 Moon:'On a difficult day, check what makes you feel secure before absorbing another person’s mood.',
 Mars:'Before a difficult conversation, name the desired outcome and your boundary.',
 Mercury:'Clarify two concrete facts in an important agreement so both sides mean the same thing.',
 Jupiter:'Test a cherished piece of advice against a real example.',
 Venus:'Name one relationship need directly instead of hiding it to maintain harmony.',
 Saturn:'Check which responsibility is really yours and what can be done without exhaustion.'
};
const PLANETS=[
 {key:'Sun',uk:'Сонце',ukTheme:'відповідальності й особистій позиції',enTheme:'responsibility and self-direction'},
 {key:'Moon',uk:'Місяць',ukTheme:'емоційному ритмі й потребі в безпеці',enTheme:'emotional rhythms and feeling secure'},
 {key:'Mars',uk:'Марс',ukTheme:'рішучості, зусиллях і межах',enTheme:'initiative, effort and boundaries'},
 {key:'Mercury',uk:'Меркурій',ukTheme:'мовленні, навчанні й переговорах',enTheme:'communication, learning and negotiations'},
 {key:'Jupiter',uk:'Юпітер',ukTheme:'навчанні, сенсі та наставництві',enTheme:'learning, meaning and mentoring'},
 {key:'Venus',uk:'Венера',ukTheme:'близькості, згоді та почутті міри',enTheme:'connection, harmony and proportion'},
 {key:'Saturn',uk:'Сатурн',ukTheme:'обов’язках, терпінні та життєвому ритмі',enTheme:'responsibility, patience and sustainable pace'}
] as const;
function noData(lang:Lang):D60Preview{
 const uk=lang==='uk';
 return {version:D60_PREVIEW_VERSION,status:'unavailable',
  title:uk?'D60 · Внутрішні відтінки':'D60 · Subtle inner patterns',
  intro:uk?'Перевіреної прив’язки D60 до цієї натальної карти немає.':'No verified D60-to-birth-chart binding is available.',
  factors:[],warning:uk?'Особисті висновки за D60 не формуються без перевірених вихідних даних.':'No individual D60 notes without validated input.'};
}
export function buildD60Preview(chart:CalculatedChart,lang:Lang):D60Preview{
 const uk=lang==='uk',source=chart as CalculatedChart&{
  verification?:{version:string;status:string;digest:string;externalReferenceChecked:boolean};
  n4D60?:D60Candidate};
 const v=source.verification,d=source.n4D60;
 if(v?.version!=='jyotish-integrity-v3'||v.status!=='verified_internal'||
    !/^[a-f0-9]{64}$/.test(v.digest)||v.externalReferenceChecked!==false||
    d?.version!==N4_D60_VERSION||d.sourceDigest!==v.digest||
    d.method!==N4_D60_METHOD||d.division!==60||
    d.status!=='PROVISIONAL_D60_INDIVIDUAL_BIRTH'||
    d.birthTimePrecision!=='NOT_INFERRED_FROM_HH_MM'||
    d.d60HouseInterpretationEligible!==false||d.continuousTimeStabilityCertified!==false||
    d.planets?.length!==9)return noData(lang);
 const ordered=PLANETS.map((p):Factor|null=>{
  const original=chart.d1.find(x=>x.name===p.key);
  const fine=d.planets.find(x=>x.name===p.key);
  if(!original||!fine||original.sign<1||original.sign>12||
     fine.sign<1||fine.sign>12||!Number.isFinite(fine.boundaryDistanceArcseconds)||
     fine.boundaryDistanceArcseconds<90)return null;
  const from=(uk?UK_SIGNS:EN_SIGNS)[original.sign-1],to=(uk?UK_SIGNS:EN_SIGNS)[fine.sign-1];
  const natalTheme=(uk?SIGNS_UK_MEANING:SIGNS_EN_MEANING)[original.sign-1];
  const fineTheme=(uk?SIGNS_UK_MEANING:SIGNS_EN_MEANING)[fine.sign-1];
  const note=uk?
   'У D1 '+p.uk+' перебуває у '+from+', а в D60 — у '+to+
   '. За традиційною символікою це зустріч двох способів прояву: '+natalTheme+' та '+fineTheme+
   '. '+PRACTICE_UK[p.key]:
   'In D1, '+p.key+' occupies '+from+', while in D60 it occupies '+to+
   '. The traditional symbolism places '+natalTheme+' beside '+fineTheme+
   '. '+PRACTICE_EN[p.key];
  return {planet:p.key,d1Sign:original.sign,d60Sign:fine.sign,
   boundaryDistanceArcseconds:fine.boundaryDistanceArcseconds,note};
 }).filter((x):x is Factor=>x!==null);
 // Do not cherry-pick "good" planets. Choose the widest boundaries first and
 // avoid factors within 90 arcseconds of a nominal D60 sector edge.
 const factors=[...ordered].sort((a,b)=>b.boundaryDistanceArcseconds-a.boundaryDistanceArcseconds).slice(0,3);
 const warning=uk?
  'Методика: розраховано лише планетарні знаки D60 за введеним моментом. Лагна й доми D60 не сертифіковані для особистого часу народження і тут не трактуються. Це символічне читання, не доказ життєвих подій.':
  'Method: D60 planetary signs for the entered instant only. Individual D60 houses and ascendant are not certified or interpreted. These symbolic themes are not evidence of specific life events.';
 return {version:D60_PREVIEW_VERSION,status:factors.length?'conditional_signs':'unavailable',
  title:uk?'D60 · Внутрішні відтінки':'D60 · Subtle inner patterns',
  intro:uk?'Кожна планета має загальну роль у D1 та тонший відтінок у D60. Нижче — три найвиразніші зіставлення знаків, обчислені для введеного часу народження.':
   'Each planet has a broad expression in D1 and a finer symbolic color in D60. These three sign comparisons are calculated for the entered birth time.',
  factors,warning};
}
export function compactD60PreviewForAi(chart:CalculatedChart):string{
 const p=buildD60Preview(chart,'en');
 if(p.status!=='conditional_signs')return 'D60: no safe sign-level facts; exclude all D60 interpretation.';
 return ['D60 provisional SIGN-ONLY facts, not a birth time accuracy certificate:',
  ...p.factors.map(f=>f.planet+' D1.sign='+f.d1Sign+' D60.sign='+f.d60Sign+' boundaryArcsec='+Math.round(f.boundaryDistanceArcseconds)),
  'OPTIONAL concise two-sentence conditional comparison of these exact sign pairs with D1; never D60 houses, lagna, prediction, past-life, karma or definitive personal character. Explicitly label provisional; skip if other evidence is insufficient.'
 ].join('\n');
}
