/**
 * N4.7 D60: bounded sign-only comparison with D1; never a birth-time certificate.
 * D60 house/lagna interpretation is prohibited even when an HH:MM value was entered.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {N4_D60_VERSION,N4_D60_METHOD,type D60Candidate} from './n4-d60-candidate.ts';
import {classicalLordshipTable} from './reader-classical.ts';
export const D60_PREVIEW_VERSION='d60-conditional-signs-n47-v1' as const;
type Lang='uk'|'en';
type Factor={planet:string;d1Sign:number;d60Sign:number;boundaryDistanceArcseconds:number;note:string};
type PlanetPosition={planet:string;label:string;d1Sign:number;d60Sign:number;
 d1SignName:string;d60SignName:string;boundaryDistanceArcseconds:number;nearBoundary:boolean};
export type D60Preview={version:typeof D60_PREVIEW_VERSION;status:'conditional_signs'|'unavailable';
 title:string;intro:string;factors:readonly Factor[];allPlanets:readonly PlanetPosition[];warning:string};
const UK_SIGNS=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const UK_SIGN_LABELS=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
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
  factors:[],allPlanets:[],warning:uk?'Особисті висновки за D60 не формуються без перевірених вихідних даних.':'No individual D60 notes without validated input.'};
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
 // Always show all nine verified computed graha signs, including those near a
 // D60 edge. A near-edge position is marked sensitive, never silently dropped.
 const nUk:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',
  Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
 const allPlanets:PlanetPosition[]=[];
 for(const original of chart.d1){
  const fine=d.planets.find(p=>p.name===original.name);
  if(!fine||![original.sign,fine.sign].every(sign=>Number.isInteger(sign)&&sign>=1&&sign<=12)||
    !Number.isFinite(fine.boundaryDistanceArcseconds)||fine.boundaryDistanceArcseconds<0)return noData(lang);
  allPlanets.push({
   planet:original.name,label:uk?nUk[original.name]||original.name:original.name,
   d1Sign:original.sign,d60Sign:fine.sign,
   d1SignName:(uk?UK_SIGN_LABELS:EN_SIGNS)[original.sign-1],
   d60SignName:(uk?UK_SIGN_LABELS:EN_SIGNS)[fine.sign-1],
   boundaryDistanceArcseconds:fine.boundaryDistanceArcseconds,
   nearBoundary:fine.boundaryDistanceArcseconds<90
  });
 }
 if(allPlanets.length!==9||new Set(allPlanets.map(p=>p.planet)).size!==9)return noData(lang);
 const natalLords=classicalLordshipTable(chart.ascendant.sign);
 const priorities=[natalLords[1],natalLords[10],natalLords[7],'Moon','Sun','Jupiter','Venus','Saturn','Mercury','Mars'];
 const role=(planet:string)=>planet===natalLords[1]?
  (uk?'Управитель вашого висхідного знака':'The ruler of your rising sign'):
  planet===natalLords[10]?(uk?'Управитель вашої професійної сфери':'The ruler of your career sector'):
  planet===natalLords[7]?(uk?'Управитель сфери партнерства':'The ruler of your partnership sector'):
  (uk?'Один із натальних показників':'One of the natal indicators');
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
   role(p.key)+' — '+p.uk+'. У D1 планета в '+from+' ('+natalTheme+
   '), у D60 — в '+to+' ('+fineTheme+
   '). Цю різницю слід читати разом із D1, а не як окремий прогноз.':
   role(p.key)+' — '+p.key+'. In D1 it is in '+from+' ('+natalTheme+
   '), in D60 '+to+' ('+fineTheme+
   '). These two placements must be read together, not as an independent prediction.';
  return {planet:p.key,d1Sign:original.sign,d60Sign:fine.sign,
   boundaryDistanceArcseconds:fine.boundaryDistanceArcseconds,note};
 }).filter((x):x is Factor=>x!==null);
 // Do not cherry-pick "good" planets. Choose the widest boundaries first and
 // avoid factors within 90 arcseconds of a nominal D60 sector edge.
 const factors=[...ordered].sort((a,b)=>priorities.indexOf(a.planet)-priorities.indexOf(b.planet)).slice(0,3);
 const warning=uk?
  'D60 показує обчислені знаки планет, а не підтверджену точність часу народження. Позначені поблизу межі знаки можуть змінитися через похибку часу. Доми та асцендент D60 тут не трактуються.':
  'D60 shows calculated planetary signs, not independently verified birth-time accuracy. Near-boundary signs may change if the time is off. D60 houses and ascendant are not interpreted.';
 return {version:D60_PREVIEW_VERSION,status:allPlanets.length===9?'conditional_signs':'unavailable',
  title:uk?'D60 · Внутрішні відтінки':'D60 · Subtle inner patterns',
  intro:uk?'Усі 9 планет мають розрахований знак D60 для введеного часу. Нижче — конкретні положення й три короткі зіставлення з основною картою.':
   'All 9 planetary D60 signs are calculated for the entered time. Below are the actual placements and three concise comparisons with D1.',
  factors,allPlanets,warning};
}
export function compactD60PreviewForAi(chart:CalculatedChart):string{
 const p=buildD60Preview(chart,'en');
 if(p.status!=='conditional_signs')return 'D60: no safe sign-level facts; exclude all D60 interpretation.';
 return ['D60 provisional SIGN-ONLY facts, not a birth time accuracy certificate:',
  ...p.factors.map(f=>f.planet+' D1.sign='+f.d1Sign+' D60.sign='+f.d60Sign+' boundaryArcsec='+Math.round(f.boundaryDistanceArcseconds)),
  'OPTIONAL concise two-sentence conditional comparison of these exact sign pairs with D1; never D60 houses, lagna, prediction, past-life, karma or definitive personal character. Explicitly label provisional; skip if other evidence is insufficient.'
 ].join('\n');
}
