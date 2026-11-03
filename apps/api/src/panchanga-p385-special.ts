/**
 * P3.8.5: source-scoped classical wedding/foundation election filters.
 * NOT a prediction of marital happiness or structural safety; incomplete
 * traditional exceptions remain explicit review gates, never "PASS".
 *
 * B.V. Raman, Muhurtha: Chapter 9 Marriage, Chapter 12 House Building,
 * Chapter 3 Marriage Kuta/Dina. Source: ved.bz/_jyotish/books/muhurtha.html
 */
import type {P32Day} from '../../web/lib/panchanga-p32-engine.ts';
import type {P38ActivityId} from '../../web/lib/panchanga-p38-decision.ts';
import type {P384Evaluation} from './panchanga-event-election.ts';
import type {RecoveredChart} from './personal-chart-recovery.ts';

const RAMAN='https://ved.bz/_jyotish/books/muhurtha.html';
const MARRIAGE=RAMAN+'#chapter-9',FOUNDATION=RAMAN+'#chapter-12',KUTAS=RAMAN+'#chapter-9';
type RuleState='preferred'|'excluded'|'context'|'needs_review';
export type P385Rule={id:string;state:RuleState;source:string;detail:string};
export type P385Natal={
 provenance:'VERIFIED_OWNED_JQA3_D1_D9_D10';
 moonNakshatra:number;moonSign:number;birthLagnaSign:number;
 d9LagnaSign:number;d10LagnaSign:number;
 d9SeventhOccupied:boolean;d10TenthOccupied:boolean;
};
export type P385DoshaReport={
 version:'p385-source-scoped-special-v1';
 activityId:P38ActivityId;
 state:'excluded'|'screened_requires_review'|'not_applicable';
 rules:P385Rule[];
 owner:P385Natal;
 partner:P385Natal|null;
 dinaKuta:null|{ownerToPartner:number;partnerToOwner:number;
  ownerToPartnerAllowed:boolean;partnerToOwnerAllowed:boolean;
  status:'both_directions_reported_role_not_assumed'};
 remainingGates:string[];
 certification:'NOT_A_COMPLETE_CEREMONIAL_MUHURTA';
};
const NAK_LEN=360/27;
const mk=(id:string,state:RuleState,source:string,detail:string):P385Rule=>({id,state,source,detail});
const inRange=(value:number,min:number,max:number)=>Number.isFinite(value)&&value>=min&&value<max;
export function p385NatalFromVerified(chart:RecoveredChart):P385Natal{
 if(chart?.verification?.status!=='verified_internal'||!chart.d1?.length||
  !chart.d9?.length||!chart.d10?.length||!chart.ascendant?.sign||
  !chart.lagnaD9?.sign||!chart.lagnaD10?.sign)
  throw Error('P385 only accepts integrity-certified D1/D9/D10 natal charts');
 const moon=chart.d1.find(p=>p.name==='Moon');
 if(!moon||!inRange(moon.longitude,0,360)||moon.sign!==Math.floor(moon.longitude/30)+1)
  throw Error('P385 natal Moon geometry inconsistent');
 const valid=(list:RecoveredChart['d1'],asc:number)=>
  list.length===9&&list.every(p=>inRange(p.longitude,0,360)&&p.sign===Math.floor(p.longitude/30)+1&&
   p.house===(p.sign-asc+12)%12+1);
 if(!valid(chart.d1,chart.ascendant.sign)||!valid(chart.d9,chart.lagnaD9.sign)||
    !valid(chart.d10,chart.lagnaD10.sign))
  throw Error('P385 D1/D9/D10 planets and their house labels must agree');
 const moonNakshatra=Math.floor(moon.longitude/NAK_LEN)+1;
 return {provenance:'VERIFIED_OWNED_JQA3_D1_D9_D10',
  moonNakshatra,moonSign:moon.sign,birthLagnaSign:chart.ascendant.sign,
  d9LagnaSign:chart.lagnaD9.sign,d10LagnaSign:chart.lagnaD10.sign,
  d9SeventhOccupied:chart.d9.some(p=>p.house===7),
  d10TenthOccupied:chart.d10.some(p=>p.house===10)};
}
const house=(planet:{houseFromEventLagna:number})=>planet.houseFromEventLagna;
const has=(name:string,houseNum:number,planets:{name:string;houseFromEventLagna:number}[])=>
 planets.some(p=>p.name===name&&house(p)===houseNum);
const any=(houses:readonly number[],names:readonly string[],sky:{name:string;houseFromEventLagna:number}[])=>
 sky.some(p=>houses.includes(house(p))&&names.includes(p.name));
const MARRIAGE_GOOD_NAK=new Set([4,5,10,12,13,15,17,19,21,26,27]);
const FOUNDATION_BEST_NAK=new Set([4,5,14,13,18,12,21,22]);
const FOUNDATION_MIDDLE_NAK=new Set([15,8,17,1,24,26,27]);
const MARRIAGE_BAD_YOGAS=new Set(['Vyatipata','Dhruva','Ganda','Vajra','Shoola',
 'Vishkumbha','Atiganda','Vyaghata','Parigha']);
const RESTRICTED_MARRIAGE_TITHIS=new Set([4,6,8,9,12,14]);
const GOOD_FOUNDATION_TITHIS=new Set([1,2,3,5,6,7,10,11,13,15]);
const FIXED_SIGNS=new Set([2,5,8,11]),MOVABLE_SIGNS=new Set([1,4,7,10]);
function starCount(from:number,to:number){return (to-from+27)%27+1;}
function dinaAllowed(n:number){return [2,4,6,8,0].includes(n%9);}
export function p385Aspects(planetName:string,fromHouse:number,toHouse:number){
 if(!Number.isInteger(fromHouse)||!Number.isInteger(toHouse)||fromHouse<1||
  fromHouse>12||toHouse<1||toHouse>12)throw Error('P385 whole-sign house numbers required');
 // Classical Parashari graha drishti: 7th for all, special 4/8 Mars,
 // 5/9 Jupiter, 3/10 Saturn. Nodes' drishti differs by school: not inferred.
 const distance=(toHouse-fromHouse+12)%12+1;
 return distance===7||(
  planetName==='Mars'&&[4,8].includes(distance))||(
  planetName==='Jupiter'&&[5,9].includes(distance))||(
  planetName==='Saturn'&&[3,10].includes(distance));
}
export function evaluateP385Special(input:{
 event:P384Evaluation;day:P32Day;owner:P385Natal;partner?:P385Natal|null;
 nodes:{Rahu:number;Ketu:number;source:'JQA3_NATIVE_SWIEPH_MEAN_NODE_AND_OPPOSITE'};
}):P385DoshaReport{
 const {event,day,owner,nodes}=input,partner=input.partner||null;
 if(event.status!=='evaluated'||event.eventLagna.status!=='available'||
  day.sunriseUtc>event.eventAtUtc||day.nextSunriseUtc<=event.eventAtUtc)
  throw Error('P385 verified event must belong to supplied sunrise day');
 if(owner.provenance!=='VERIFIED_OWNED_JQA3_D1_D9_D10'||
  (partner&&partner.provenance!=='VERIFIED_OWNED_JQA3_D1_D9_D10'))
  throw Error('P385 unverified natal D1/D9/D10');
 const at=Date.parse(event.eventAtUtc);
 const get=(k:'tithi'|'nakshatra'|'yoga'|'karana')=>{
  const found=day.periods[k].filter(p=>Date.parse(p.startUtc)<=at&&at<Date.parse(p.endUtc));
  if(found.length!==1)throw Error('P385 incomplete '+k+' UTC periods');
  return found[0].value as {number?:number;name?:string;slot?:number;numberWithinPaksha?:number;paksha?:string};
 };
 const tithi=get('tithi'),nak=get('nakshatra'),yoga=get('yoga'),karana=get('karana');
 if(!Number.isInteger(tithi.number)||!Number.isInteger(nak.number)||!yoga.name||
  !karana.name||!Number.isInteger(day.sunrise.vara.number))
  throw Error('P385 malformed trusted five-limb data');
 if(!inRange(nodes.Rahu,0,360)||!inRange(nodes.Ketu,0,360)||
  Math.abs((nodes.Rahu+180)%360-nodes.Ketu)>0.0000001||
  nodes.source!=='JQA3_NATIVE_SWIEPH_MEAN_NODE_AND_OPPOSITE')
  throw Error('P385 verified Swiss event nodes required');
 const planets=[...event.eventSky,
  {name:'Rahu',longitude:nodes.Rahu,sign:Math.floor(nodes.Rahu/30)+1,
    houseFromEventLagna:(Math.floor(nodes.Rahu/30)+1-event.eventLagna.lagnaSign+12)%12+1},
  {name:'Ketu',longitude:nodes.Ketu,sign:Math.floor(nodes.Ketu/30)+1,
    houseFromEventLagna:(Math.floor(nodes.Ketu/30)+1-event.eventLagna.lagnaSign+12)%12+1}];
 if(planets.length!==9||new Set(planets.map(p=>p.name)).size!==9||
  planets.some(p=>p.sign!==(Math.floor(p.longitude/30)+1)||
    p.houseFromEventLagna!==(p.sign-event.eventLagna.lagnaSign+12)%12+1))
  throw Error('P385 nine event planet sign/whole-sign house mismatch');
 const rules:P385Rule[]=[];
 const add=(id:string,yes:boolean,source:string,detail:string)=>
  rules.push(mk(id,yes?'excluded':'context',source,detail));
 const prefer=(id:string,yes:boolean,source:string,detail:string)=>
  rules.push(mk(id,yes?'preferred':'context',source,detail));
 const natalGates=['D1_D9_OWNER_CONTEXT_RECORDED_NOT_WEIGHTED','D10_CAREER_CONTEXT_RECORDED_NOT_WEIGHTED'];
 let dinaKuta:P385DoshaReport['dinaKuta']=null;
 if(event.activityId==='wedding'||event.activityId==='engagement'){
  if(!partner)throw Error('P385 wedding/engagement requires second VERIFIED owned natal chart');
  const p=starCount(owner.moonNakshatra,partner.moonNakshatra);
  const q=starCount(partner.moonNakshatra,owner.moonNakshatra);
  dinaKuta={ownerToPartner:p,partnerToOwner:q,
   ownerToPartnerAllowed:dinaAllowed(p),partnerToOwnerAllowed:dinaAllowed(q),
   status:'both_directions_reported_role_not_assumed'};
  rules.push(mk('MARRIAGE_DINA_KUTA_REQUIRES_ROLE','needs_review',KUTAS,
   'Raman Chap. 9: count Janma Nakshatra from one partner to the other; no sex/role assumed. Both counts supplied; full Kuta review pending.'));
  const seventh=planets.filter(p=>p.houseFromEventLagna===7);
  add('MARRIAGE_HOUSE_7_OCCUPIED',seventh.length>0,MARRIAGE,'Raman Chap. 9: the 7th election house must be unoccupied');
  add('MARRIAGE_MARS_HOUSE_8',has('Mars',8,planets),MARRIAGE,'Raman Chap. 9: Mars not in 8th');
  add('MARRIAGE_VENUS_HOUSE_6',has('Venus',6,planets),MARRIAGE,'Raman Chap. 9: Venus not in 6th');
  add('MARRIAGE_MALEFICS_LAGNA',any([1],['Sun','Mars','Saturn','Rahu','Ketu'],planets),
    MARRIAGE,'Raman Chap. 9: malefics should not occupy Lagna');
  const hemmed=any([12],['Sun','Mars','Saturn','Rahu','Ketu'],planets)&&
    any([2],['Sun','Mars','Saturn','Rahu','Ketu'],planets);
  add('MARRIAGE_LAGNA_HEMMED',hemmed,MARRIAGE,'Raman Chap. 9: Lagna should not be hemmed between malefics');
  const moon=planets.find(p=>p.name==='Moon')!;
  const moonRelated=planets.some(p=>p.name!=='Moon'&&
    (p.sign===moon.sign||(['Sun','Mars','Mercury','Venus','Jupiter','Saturn'].includes(p.name)&&
      p385Aspects(p.name,p.houseFromEventLagna,moon.houseFromEventLagna))));
  add('MARRIAGE_MOON_ASSOCIATION',moonRelated,MARRIAGE,
   'Raman Chap. 9 Moon should have no association; same-sign conjunction or established graha-drishti only. Other aspects not inferred.');
  add('MARRIAGE_TUESDAY',day.sunrise.vara.number===3,MARRIAGE,'Raman Chap. 9 explicitly avoids Tuesday');
  const n=nak.number!,pada=Math.min(4,Math.floor(
   (moon.longitude%NAK_LEN)/(NAK_LEN/4))+1);
  if(Math.floor(moon.longitude/NAK_LEN)+1!==n)
   throw Error('P385 Moon exact Nakshatra does not match five limbs');
  add('MARRIAGE_NAKSHATRA_UNLISTED',!MARRIAGE_GOOD_NAK.has(n),MARRIAGE,
   'Raman Chap. 9 lists 11 eligible wedding Nakshatras');
  add('MARRIAGE_NAKSHATRA_PADA',((n===10||n===19)&&pada===1)||
   (n===27&&pada===4),MARRIAGE,'Raman Chap. 9 rejects first pada of Magha/Mula and last Revati');
  add('MARRIAGE_TITHI_EXCLUSION',RESTRICTED_MARRIAGE_TITHIS.has(tithi.numberWithinPaksha!)||
   (tithi.paksha==='Krishna'&&tithi.numberWithinPaksha!>=11),MARRIAGE,
   'Raman Chap. 9 excludes Rikta, 6/8/12 and dark-half 11–Amavasya');
  prefer('MARRIAGE_BRIGHT_TITHI',tithi.paksha==='Shukla'&&
   [2,3,5,7,10,11,13].includes(tithi.numberWithinPaksha!),MARRIAGE,
   'Raman Chap. 9 preferred Shukla Tithis 2/3/5/7/10/11/13');
  add('MARRIAGE_NITYA_YOGA',MARRIAGE_BAD_YOGAS.has(yoga.name!),MARRIAGE,
   'Raman Chap. 9 adverse Nitya Yogas (Mrityu not present in standard 27 yoga index)');
  add('MARRIAGE_VISHTI',karana.name==='Vishti',MARRIAGE,'Raman Chap. 9 avoids Vishti');
  prefer('MARRIAGE_LAGNA_GEMINI_VIRGO_LIBRA',[3,6,7].includes(event.eventLagna.lagnaSign),
    MARRIAGE,'Raman Chap. 9 favours Gemini/Virgo/Libra election Lagna');
  if(has('Venus',1,planets)&&has('Jupiter',11,planets))
   rules.push(mk('MARRIAGE_ARDHAMA_YOGA','preferred',MARRIAGE,
    'Raman Chap. 9 Ardhama Yoga: Venus in Lagna, Jupiter in 11th'));
  natalGates.push('FULL_EIGHT_KUTA_AND_SEVENTH_EIGHTH_NATAL_HOUSE_REVIEW',
   'D9_SEVENTH_LORD_ASPECT_AND_BOTH_PARTNER_COMPATIBILITY_REVIEW',
   '21_DOSHA_SET_AND_REMEDIES_NOT_COMPLETE');
 }else if(event.activityId==='foundation'){
  const n=nak.number!,t=tithi.numberWithinPaksha!,lagna=event.eventLagna.lagnaSign;
  prefer('FOUNDATION_BEST_NAKSHATRA',FOUNDATION_BEST_NAK.has(n),FOUNDATION,
   'Raman Chap. 12 explicitly named 8 preferred foundation Nakshatras');
  prefer('FOUNDATION_MIDDLE_NAKSHATRA',FOUNDATION_MIDDLE_NAK.has(n),FOUNDATION,
   'Raman Chap. 12 lists 7 middling foundation Nakshatras');
  add('FOUNDATION_NAKSHATRA_UNLISTED',!FOUNDATION_BEST_NAK.has(n)&&
    !FOUNDATION_MIDDLE_NAK.has(n),FOUNDATION,
   'Raman Chap. 12 says other 12 Nakshatras should be avoided');
  add('FOUNDATION_TITHI',!GOOD_FOUNDATION_TITHIS.has(t),FOUNDATION,
   'Raman Chap. 12 odd tithis except 9, even 2/6/10');
  add('FOUNDATION_SATURDAY',day.sunrise.vara.number===7,FOUNDATION,
   'Raman Chap. 12 advises avoiding Saturday');
  add('FOUNDATION_MONDAY_WANING',day.sunrise.vara.number===2&&tithi.paksha==='Krishna',
    FOUNDATION,'Raman Chap. 12 rejects Monday when Moon is waning');
  add('FOUNDATION_MOVABLE_LAGNA',MOVABLE_SIGNS.has(lagna),FOUNDATION,
   'Raman Chap. 12 rejects movable election Lagna');
  prefer('FOUNDATION_FIXED_LAGNA',FIXED_SIGNS.has(lagna),FOUNDATION,
   'Raman Chap. 12 fixed Lagna preferred; common may need benefics');
  add('FOUNDATION_EIGHTH_OCCUPIED',planets.some(p=>p.houseFromEventLagna===8),
   FOUNDATION,'Raman Chap. 12 requires 8th house empty, including verified nodes');
  const eighthAspect=planets.some(p=>['Sun','Mars','Saturn'].includes(p.name)&&
    p385Aspects(p.name,p.houseFromEventLagna,8));
  add('FOUNDATION_EIGHTH_MALEFIC_ASPECT',eighthAspect,FOUNDATION,
   'Raman Chap. 12 no malefic Graha Drishti to election 8th whole-sign house');
  const strong=has('Moon',10,planets)&&has('Jupiter',4,planets)&&
   has('Mars',11,planets)&&has('Saturn',11,planets);
  if(strong)rules.push(mk('FOUNDATION_RAMAN_COMBINATION_1','preferred',FOUNDATION,
    'Raman Chap. 12: Moon 10th, Jupiter 4th, Mars and Saturn 11th'));
  natalGates.push('OWNER_NATAL_FOURTH_HOUSE_AND_D4_NOT_PRESENT',
   'VAS TU_LOCATION_SITE_AND_LOCAL_TRADITION_REVIEW'.replace(' ',''),
   'SEASON_SOLAR_MONTH_DOSHAS_AND_SPECIAL_REMEDIES_NOT_COMPLETE');
 }else{
  // The same natal D10 is useful career context, not a fabricated "good"
  // hour. No special wedding/foundation dosha rule may spill into other acts.
  return {version:'p385-source-scoped-special-v1',activityId:event.activityId,
   state:'not_applicable',rules:[],owner,partner:null,dinaKuta:null,
   remainingGates:event.remainingRuleGates,
   certification:'NOT_A_COMPLETE_CEREMONIAL_MUHURTA'};
 }
 if(event.panchaka?.forbiddenForScope)
  rules.push(mk('RAMAN_PANCHAKA_SCOPE','excluded',event.panchaka.source,
   'Source-scoped Panchaka remainder '+event.panchaka.remainder));
 const excluded=rules.some(x=>x.state==='excluded');
 return {version:'p385-source-scoped-special-v1',activityId:event.activityId,
  state:excluded?'excluded':'screened_requires_review',
  rules,owner,partner,dinaKuta,remainingGates:natalGates,
  certification:'NOT_A_COMPLETE_CEREMONIAL_MUHURTA'};
}
