/** AE-P7: deliberately versioned Vedic observance indications.
 * Geometry (verified Swiss source) is independent of regional decisions:
 * none of these indications claims full Dharmasindhu fasting adjudication.
 */
export const VEDIC_CALENDAR_VERSION='vedic-observance-indications-v1';
export const MONTHS=[
 'Chaitra','Vaishakha','Jyeshtha','Ashadha','Shravana','Bhadrapada',
 'Ashwina','Kartika','Margashirsha','Pausha','Magha','Phalguna'
] as const;
export type MonthSystem='amanta'|'purnimanta';
export type SunMoonPosition={sun:number;moon:number};
export type DateMoonObservation={
 date:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 tithi:number;arunodayaTithi:number;pradoshaTithi:number;pradoshaEndTithi:number;
 sunLongitude:number;
};
export type NewMoonRecord={atUtc:string;sunLongitude:number};
export type Observance={id:'ekadashi_sunrise'|'ekadashi_arunodaya'|'pradosha_trayodashi'|
 'purnima_sunrise'|'amavasya_sunrise'|'sankranti'|
 'rama_navami'|'ganesh_chaturthi'|'chaitra_navratri'|'sharad_navratri'|
 'guru_purnima'|'janmashtami'|'maha_shivaratri'|'diwali_amavasya';
 date:string;atUtc:string;category:'candidate'|'astronomical_event';
 rule:string;tradition:'common_sunrise'|'vaishnava_arunodaya'|'sunset_trayodashi'|'sidereal_solar'|'regional_festival_indicator';
 metadata?:Record<string,string|number|boolean>};
const modulo=(x:number,n:number)=>((x%n)+n)%n;
export function validPosition(p:SunMoonPosition){
 if(!p||!Number.isFinite(p.sun)||!Number.isFinite(p.moon)||
  p.sun<0||p.sun>=360||p.moon<0||p.moon>=360)throw Error('Verified Swiss Sun/Moon positions required');
 return p;
}
export function tithiNumber(p:SunMoonPosition){
 const {sun,moon}=validPosition(p);
 return Math.floor(modulo(moon-sun,360)/12)+1;
}
export function sunSign(lon:number){
 if(!Number.isFinite(lon)||lon<0||lon>=360)throw Error('Verified sidereal Sun required');
 return Math.floor(lon/30)+1;
}
function monthForSun(solarSign:number){
 if(!Number.isInteger(solarSign)||solarSign<1||solarSign>12)throw Error('Invalid lunar month solar sign');
 return MONTHS[solarSign%12];
}
/** Whole lunations are bounded by authentic geocentric New Moon instants;
 * 0 Sankrantis -> adhika, 2 -> exceptional kshaya (name withheld).
 * Purnimanta shifts only ordinary Krishna-paksha month labels.
 */
export function monthAtSunrise(utc:string,tithi:number,moons:NewMoonRecord[],system:MonthSystem){
 if(system!=='amanta'&&system!=='purnimanta')throw Error('Unsupported lunar month system');
 const ms=Date.parse(utc);
 if(!Number.isFinite(ms)||!Number.isInteger(tithi)||tithi<1||tithi>30)throw Error('Invalid moon month observation');
 const arr=moons.map(m=>({...m,ms:Date.parse(m.atUtc)}));
 if(arr.length<3||arr.some(m=>!Number.isFinite(m.ms)||!Number.isFinite(m.sunLongitude))||
   arr.some((m,i)=>i>0&&m.ms<=arr[i-1].ms))
  throw Error('Unverified lunar month boundary sequence');
 const k=arr.findIndex((m,i)=>i<arr.length-1&&m.ms<=ms&&ms<arr[i+1].ms);
 if(k<0||k+2>=arr.length)throw Error('Lunar month not covered by sufficient New Moon boundaries');
 const current=sunSign(arr[k].sunLongitude),next=sunSign(arr[k+1].sunLongitude);
 const after=sunSign(arr[k+2].sunLongitude);
 const ingresses=modulo(next-current,12);
 if(ingresses>2)throw Error('Inconsistent solar month traversal');
 const adhika=ingresses===0,exceptional=ingresses===2;
 const purnimantaShift=system==='purnimanta'&&tithi>=16&&!adhika&&!exceptional;
 const displaySunSign=purnimantaShift?next:current;
 const month=monthForSun(displaySunSign);
 const nextIngresses=modulo(after-next,12);
 return {system,name:exceptional?null:month,
  amantaName:exceptional?null:monthForSun(current),
  lunarMonthStatus:exceptional?'kshaya_review_required':adhika?'adhika':'regular',
  ingresses,sourceNewMoonUtc:arr[k].atUtc,nextNewMoonUtc:arr[k+1].atUtc,
  purnimantaKrishnaShiftApplied:purnimantaShift,
  nextMonthStatus:nextIngresses===0?'adhika':nextIngresses===2?'kshaya_review_required':'regular',
  finalFestivalDateCertified:false};
}
export function sunriseObservances(day:DateMoonObservation):Observance[]{
 const {date,sunriseUtc,sunsetUtc,nextSunriseUtc,tithi,arunodayaTithi,pradoshaTithi,pradoshaEndTithi}=day;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||
   !Number.isInteger(tithi)||tithi<1||tithi>30||
   [arunodayaTithi,pradoshaTithi,pradoshaEndTithi].some(v=>!Number.isInteger(v)||v<1||v>30))
  throw Error('Invalid sunrise Vedic day');
 const sr=Date.parse(sunriseUtc),ss=Date.parse(sunsetUtc),next=Date.parse(nextSunriseUtc);
 if(![sr,ss,next].every(Number.isFinite)||sr>=ss||ss>=next||next-sr>28*3600000)
  throw Error('Invalid local sunrise/sunset sequence');
 const events:Observance[]=[];
 const put=(id:Observance['id'],atUtc:string,tradition:Observance['tradition'],rule:string,
  metadata?:Observance['metadata'])=>events.push({id,date,atUtc,category:'candidate',tradition,rule,metadata});
 if(tithi===11||tithi===26){
  put('ekadashi_sunrise',sunriseUtc,'common_sunrise','Ekadashi tithi at local sunrise: observance candidate only; no parana date certified',
   {paksha:tithi===11?'Shukla':'Krishna',tithi});
  if(arunodayaTithi===tithi)put('ekadashi_arunodaya',
   new Date(sr-96*60000).toISOString(),'vaishnava_arunodaya',
   'Ekadashi also present 96 minutes before sunrise; candidate purity marker, not full Vaishnava vrat adjudication',
   {arunodayaTithi});
 }
 if([13,28].includes(pradoshaTithi)||[13,28].includes(pradoshaEndTithi)){
  put('pradosha_trayodashi',sunsetUtc,'sunset_trayodashi',
   'Trayodashi overlaps observed post-sunset 90-minute window; local Pradosha candidate, school precedence not certified',
   {tithiAtSunset:pradoshaTithi,tithiAfter90Minutes:pradoshaEndTithi});
 }
 if(tithi===15)put('purnima_sunrise',sunriseUtc,'common_sunrise','Purnima tithi at local sunrise: lunar observance candidate');
 if(tithi===30)put('amavasya_sunrise',sunriseUtc,'common_sunrise','Amavasya tithi at local sunrise: lunar observance candidate');
 return events;
}
/** Solar sankranti: actual sidereal longitude crosses a 30-degree boundary,
 * including Pisces->Aries; bisection isolates [start,end) UTC to one second.
 */
export function solarSankrantis(startMs:number,endMs:number,sunAt:(ms:number)=>number){
 if(!Number.isSafeInteger(startMs)||!Number.isSafeInteger(endMs)||endMs<=startMs||endMs-startMs>15*86400000)
  throw Error('Invalid bounded Sankranti window');
 const events:{atUtc:string;toSign:number;fromSign:number}[]=[];
 const step=3*3600000;
 for(let left=startMs;left<endMs;){
  const right=Math.min(endMs,left+step),old=sunSign(sunAt(left)),target=sunSign(sunAt(right));
  if(old!==target){
   if(target!==old%12+1)throw Error('Unexpected solar direction or missing sampling');
   let lo=left,hi=right;
   for(let j=0;j<42&&hi-lo>1000;j++){
    const mid=Math.floor((lo+hi)/2);
    if(sunSign(sunAt(mid))===old)lo=mid;else hi=mid;
   }
   if(hi<endMs)events.push({atUtc:new Date(hi).toISOString(),fromSign:old,toSign:target});
  }
  left=right;
 }
 return events;
}
export function abhijitMuhurta(sunriseUtc:string,sunsetUtc:string,weekday:number){
 const rise=Date.parse(sunriseUtc),set=Date.parse(sunsetUtc);
 if(!Number.isFinite(rise)||!Number.isFinite(set)||set<=rise||set-rise>24*3600000||
  !Number.isInteger(weekday)||weekday<0||weekday>6)throw Error('Invalid Muhurta daylight');
 const slot=(set-rise)/15;
 return {version:'abhijit-fifteen-daylight-muhurtas-v1',
  startUtc:new Date(Math.round(rise+7*slot)).toISOString(),
  endUtc:new Date(Math.round(rise+8*slot)).toISOString(),
  weekdayCaution:weekday===3?'wednesday_traditional_exception':null,
  rule:'Eighth of fifteen equal intervals of true local daytime; not a universal electional guarantee',
  certifiedElectional:false};
}

/** Named festivals: only primary astronomical date *indicators*, not
 * religiously final fasting/puja selection. Source school-specific Madhyahna,
 * Nishita and Pradosha precedence rules still require witnessed acceptance.
 */
export function namedFestivalCandidates(input:{
 date:string;sunriseUtc:string;sunsetUtc:string;nextSunriseUtc:string;
 sunriseTithi:number;madhyahnaTithi:number;sunsetTithi:number;nightMidTithi:number;
 amantaMonth:string|null;monthStatus:'regular'|'adhika'|'kshaya_review_required';
}):Observance[]{
 const fields=[input.sunriseTithi,input.madhyahnaTithi,input.sunsetTithi,input.nightMidTithi];
 if(fields.some(v=>!Number.isInteger(v)||v<1||v>30)||
  [input.sunriseUtc,input.sunsetUtc,input.nextSunriseUtc].some(s=>!Number.isFinite(Date.parse(s))))
  throw Error('Invalid astronomical festival samples');
 if(input.monthStatus!=='regular'||!input.amantaMonth)return [];
 const rise=Date.parse(input.sunriseUtc),set=Date.parse(input.sunsetUtc),next=Date.parse(input.nextSunriseUtc);
 if(rise>=set||set>=next)throw Error('Invalid festival horizon geometry');
 const midday=new Date(Math.round((rise+set)/2)).toISOString();
 const night=new Date(Math.round((set+next)/2)).toISOString();
 const result:Observance[]=[];
 const add=(id:Observance['id'],atUtc:string,rule:string)=>result.push({
  id,date:input.date,atUtc,category:'candidate',tradition:'regional_festival_indicator',
  rule,metadata:{amantaMonth:input.amantaMonth||'unknown',traditionalRuleOnly:true}
 });
 if(input.amantaMonth==='Chaitra'&&input.sunriseTithi===1)
  add('chaitra_navratri',input.sunriseUtc,'Chaitra Shukla Pratipada at sunrise; Ghatasthapana time not certified');
 if(input.amantaMonth==='Ashwina'&&input.sunriseTithi===1)
  add('sharad_navratri',input.sunriseUtc,'Ashwina Shukla Pratipada at sunrise; local Ghatasthapana rules not certified');
 if(input.amantaMonth==='Chaitra'&&input.madhyahnaTithi===9)
  add('rama_navami',midday,'Chaitra Shukla Navami at local daylight midpoint; Madhyahna festival precedence not fully adjudicated');
 if(input.amantaMonth==='Bhadrapada'&&input.madhyahnaTithi===4)
  add('ganesh_chaturthi',midday,'Bhadrapada Shukla Chaturthi at local daylight midpoint; Madhyahna puja/date precedence not fully adjudicated');
 if(input.amantaMonth==='Ashadha'&&input.sunriseTithi===15)
  add('guru_purnima',input.sunriseUtc,'Ashadha Shukla Purnima at local sunrise; festival date may require moonrise/tradition rules');
 if(input.amantaMonth==='Shravana'&&input.nightMidTithi===23)
  add('janmashtami',night,'Shravana Krishna Ashtami at midpoint of sunset-to-next-sunrise; Rohini and regional precedences not adjudicated');
 if(input.amantaMonth==='Magha'&&input.nightMidTithi===29)
  add('maha_shivaratri',night,'Magha Krishna Chaturdashi at local night midpoint; Nishita/prahar and duplicate tithi precedence not adjudicated');
 if(input.amantaMonth==='Ashwina'&&input.sunsetTithi===30)
  add('diwali_amavasya',input.sunsetUtc,'Ashwina Krishna Amavasya at sunset; local Pradosha Lakshmi-puja/date precedence not adjudicated');
 return result;
}
