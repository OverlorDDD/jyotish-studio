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
  title:uk?'D60: додатковий ракурс, що потребує точного часу':'D60: an optional time-sensitive lens',
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
 const ordered=PLANETS.map(p=>{
  const original=chart.d1.find(x=>x.name===p.key);
  const fine=d.planets.find(x=>x.name===p.key);
  if(!original||!fine||original.sign<1||original.sign>12||
     fine.sign<1||fine.sign>12||!Number.isFinite(fine.boundaryDistanceArcseconds)||
     fine.boundaryDistanceArcseconds<90)return null;
  const from=(uk?UK_SIGNS:EN_SIGNS)[original.sign-1],to=(uk?UK_SIGNS:EN_SIGNS)[fine.sign-1];
  const note=uk?
   p.uk+': основна карта показує знак в '+from+', а символічна D60 — у '+to+
    '. Якщо час народження точний, це можна обережно зіставити в темі '+p.ukTheme+
    '. Сам по собі цей збіг або контраст не визначає характер чи події.':
   p.key+': the natal sign is '+from+', while the provisional D60 sign is '+to+
    '. If the recorded birth time is accurate, compare these as a tentative theme in '+
    p.enTheme+'. This contrast alone does not establish personality or events.';
  return {planet:p.key,d1Sign:original.sign,d60Sign:fine.sign,
   boundaryDistanceArcseconds:fine.boundaryDistanceArcseconds,note};
 }).filter((x):x is Factor=>x!==null);
 // Do not cherry-pick "good" planets. Choose the widest boundaries first and
 // avoid factors within 90 arcseconds of a nominal D60 sector edge.
 const factors=[...ordered].sort((a,b)=>b.boundaryDistanceArcseconds-a.boundaryDistanceArcseconds).slice(0,3);
 const warning=uk?
  'Це умовне прочитання лише планетарних ЗНАКІВ D60 за введеним моментом. Навіть час, записаний до хвилини, не сертифікує точність; доми та Лагна D60, карма, минулі життя й конкретні події тут НЕ трактуються. За неточного часу перевірте D60 після ректифікації.':
  'Conditional D60 PLANETARY SIGNS only, for the entered birth instant. A time recorded to the minute is not a precision certificate. D60 houses, ascendant, karma, past lives and events are NOT interpreted. Recheck after birth-time rectification.';
 return {version:D60_PREVIEW_VERSION,status:factors.length?'conditional_signs':'unavailable',
  title:uk?'D60: тонкі акценти, які ще потрібно перевірити':'D60: fine details to verify',
  intro:uk?'Порівняння з основною картою, а не самостійний прогноз. У цьому зрізі обираємо лише показники, не близькі до межі їхнього розрахованого сегмента.':
   'A comparison against D1, not a stand-alone prediction. Only factors sufficiently far from their calculated segment boundary are displayed.',
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
