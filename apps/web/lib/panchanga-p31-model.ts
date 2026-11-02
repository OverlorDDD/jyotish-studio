/** P3.1 read-only presentation model. Its advice is explicitly limited to
 * the classical Rahu Kalam start-of-new-work convention. P3.2/P3.3 own
 * multi-limb and natal synthesis; NEVER infer that "outside Rahu" is auspicious.
 */
import {calendarDateAt,withinVedicDay,needsPriorVedicDay,stateAt,type LivePanchangaDay} from './panchanga-live.ts';
export type P31Topic='work'|'money'|'relationships'|'travel'|'personal';
export type P31Verdict='calendar_only'|'mixed'|'personal'|'unavailable';
export type P31Evidence={id:string;kind:'astronomy'|'tradition'|'natal';atUtc?:string;startUtc?:string;endUtc?:string};
export type P31AdviceContract={
 version:'panchanga-advice-p31';date:string;timeZone:string;topic:P31Topic;
 verdict:P31Verdict;personalized:boolean;headline:{uk:string;en:string};
 guidance:{uk:string;en:string};evidence:P31Evidence[];
 missing:string[];
};
export type P31Day=LivePanchangaDay&{
 daytimeKalas:{rahuKalam:{fromUtc:string;untilUtc:string}};
};
const subjects:Record<P31Topic,{uk:string;en:string}>={
 work:{uk:'розмову про підвищення або нові посадові умови',en:'a salary negotiation or a new job agreement'},
 money:{uk:'нову фінансову домовленість',en:'a new financial agreement'},
 relationships:{uk:'складну розмову про стосунки',en:'a difficult relationship discussion'},
 travel:{uk:'нову важливу поїздку',en:'an important new journey'},
 personal:{uk:'нову особисту справу',en:'a new personal undertaking'}
};
export const P31_TOPICS:ReadonlyArray<P31Topic>=['work','money','relationships','travel','personal'];
export function p31DaySummary(day:P31Day,nowMs:number,topic:P31Topic){
 if(!P31_TOPICS.includes(topic))throw Error('Invalid daily advice topic');
 const sunrise=Date.parse(day.sunriseUtc),sunset=Date.parse(day.sunsetUtc),
  next=Date.parse(day.nextSunriseUtc),from=Date.parse(day.daytimeKalas.rahuKalam.fromUtc),
  until=Date.parse(day.daytimeKalas.rahuKalam.untilUtc);
 if(![sunrise,sunset,next,from,until,nowMs].every(Number.isFinite)||
  !(sunrise<from&&from<until&&until<=sunset&&sunset<next))
  throw Error('Invalid verified local sunrise or Rahu Kalam window');
 const today=calendarDateAt(nowMs,day.location.timeZone)===day.date;
 const live=today&&withinVedicDay(day,nowMs);
 const before=today&&needsPriorVedicDay(day,nowMs);
 const withinRahu=live&&nowMs>=from&&nowMs<until;
 const lunar=live?stateAt(day,nowMs)?.tithi.value:day.sunrise.tithi;
 if(!lunar||!Number.isInteger(lunar.numberWithinPaksha)||lunar.numberWithinPaksha<1||lunar.numberWithinPaksha>15||
  !['Shukla','Krishna'].includes(lunar.paksha))throw Error('Unverified lunar day');
 const moon=lunar.paksha==='Shukla'?{uk:'Місяць зростає',en:'Waxing Moon'}:
  {uk:'Місяць спадає',en:'Waning Moon'};
 const clock=(iso:string,loc:'uk'|'en')=>new Intl.DateTimeFormat(loc==='uk'?'uk-UA':'en-GB',
  {timeZone:day.location.timeZone,hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
 const action=subjects[topic],intervalUk=clock(day.daytimeKalas.rahuKalam.fromUtc,'uk')+'–'+clock(day.daytimeKalas.rahuKalam.untilUtc,'uk'),
  intervalEn=clock(day.daytimeKalas.rahuKalam.fromUtc,'en')+'–'+clock(day.daytimeKalas.rahuKalam.untilUtc,'en');
 const headline=withinRahu?{uk:'Зараз триває Раху-калам',en:'Rahu Kalam is active now'}:
  {uk:'Раху-калам: '+intervalUk,en:'Rahu Kalam: '+intervalEn};
 const guidance=withinRahu?{
  uk:'За традиційним правилом не починайте '+action.uk+' до '+clock(day.daytimeKalas.rahuKalam.untilUtc,'uk')+'.',
  en:'By the traditional rule, do not start '+action.en+' until '+clock(day.daytimeKalas.rahuKalam.untilUtc,'en')+'.'
 }:{
  uk:'За ведичною традицією не починайте '+action.uk+' у проміжку '+intervalUk+'.',
  en:'In Vedic tradition, do not start '+action.en+' during '+intervalEn+'.'
 };
 const advice:P31AdviceContract={version:'panchanga-advice-p31',date:day.date,
  timeZone:day.location.timeZone,topic,verdict:'calendar_only',personalized:false,
  headline,guidance,
  evidence:[{id:'RAHU_KALAM_DAYLIGHT_EIGHTH',kind:'tradition',startUtc:day.daytimeKalas.rahuKalam.fromUtc,
   endUtc:day.daytimeKalas.rahuKalam.untilUtc},
   {id:'VERIFIED_LOCAL_SUNRISE',kind:'astronomy',atUtc:day.sunriseUtc}],
  missing:['FIVE_LIMB_SYNTHESIS_P32','VERIFIED_NATAL_CONTEXT_P33','EXACT_TIME_RECOMMENDATION_P34']};
 return {advice,moon,vedicDay:live?'live':before?'pre_sunrise':'selected',
  isLive:live,withinRahu,rahuFromUtc:day.daytimeKalas.rahuKalam.fromUtc,
  rahuUntilUtc:day.daytimeKalas.rahuKalam.untilUtc,observedTithi:lunar.numberWithinPaksha,
  sunriseUtc:day.sunriseUtc,sunsetUtc:day.sunsetUtc,nextSunriseUtc:day.nextSunriseUtc};
}
