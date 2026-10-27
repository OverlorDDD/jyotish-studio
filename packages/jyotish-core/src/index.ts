/** Reproducible traditional Jyotish calculations. Astronomy supplied by an ephemeris adapter. */
export const RASHIS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'] as const;
export const NAKSHATRAS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'] as const;
export const DASHA_LORDS = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'] as const;
export const DASHA_YEARS = [7,20,6,10,7,18,16,19,17] as const;
export type GrahaName = 'Sun'|'Moon'|'Mercury'|'Venus'|'Mars'|'Jupiter'|'Saturn'|'Rahu'|'Ketu';
export type BirthInput = {date:string;time:string;timeZone:string;latitude:number;longitude:number;place?:string};
export type Position = {name:string;longitude:number;speed?:number};
export type EphemerisData = {ayanamsa:number;ascendant:number;positions:Position[];julianDay:number;backend:string};
export type Graha = {name:string;longitude:number;sign:number;signName:string;degreesInSign:number;house:number;nakshatra:string;pada:number;retrograde:boolean};
export type DashaPeriod = {lord:string;start:string;end:string;antardashas?:{lord:string;start:string;end:string}[]};
export type CalculatedChart = {input:BirthInput;utc:string;ayanamsa:number;ascendant:Graha;lagnaD9:Graha;lagnaD10:Graha;d1:Graha[];d9:Graha[];d10:Graha[];dasha:DashaPeriod[];config:{ayanamsa:string;houses:string;nodes:string;dashaYearDays:number;ascendantConvention?:string};ephemeris:string};
const NAK_LEN = 360/27;
export const mod = (x:number,n=360)=>((x%n)+n)%n;
export function signIndex(lon:number):number { return Math.min(11,Math.floor(mod(lon)/30)); }
export function nakshatraOf(lon:number){ const p=mod(lon);const index=Math.min(26,Math.floor(p/NAK_LEN));return {index,name:NAKSHATRAS[index],pada:Math.min(4,Math.floor((p%NAK_LEN)/(NAK_LEN/4))+1),fraction:(p-index*NAK_LEN)/NAK_LEN}; }
/** Parashari navamsa; indices 0..11 for Aries..Pisces. */
export function divisionalLongitude(longitude:number,division:9|10):number {
  const lon=mod(longitude), s=signIndex(lon), part=Math.min(division-1,Math.floor((lon-s*30)/(30/division)+1e-11));
  if(division===9){ const navSign=mod(s*9+part,12);return navSign*30+((lon-s*30)*9)%30; }
  const start=s%2===0?s:mod(s+8,12);
  const dSign=mod(start+part,12);
  return dSign*30+((lon-s*30)*10)%30;
}
export function graha(name:string,lon:number,ascLon:number,speed=0):Graha {
  const s=signIndex(lon),nak=nakshatraOf(lon);
  return {name,longitude:mod(lon),sign:s+1,signName:RASHIS[s],degreesInSign:mod(lon)%30,house:mod(s-signIndex(ascLon),12)+1,nakshatra:nak.name,pada:nak.pada,retrograde:speed<0};
}
/** Historical Lahiri mean ayanamsa shift between Swiss 2.02.01 (JHora 8)
 * and Swiss 2.10.03, in arcseconds (modern minus historical).
 * Derived from the two authentic DLL/library outputs on identical DE431
 * input at jqa3-01, verified unchanged to <0.000001" on 19 held-out cards.
 * Swiss 2.09 documented an explicit Lahiri convention correction.
 * IMPORTANT: this is a VERSIONED HISTORICAL ASTROMETRY CONVENTION, not
 * adjustment against a desired chart longitude or a blanket correction.
 * Do not apply to graha positions or to apparent-ayanamsa metadata.
 */
export const JHORA8_MEAN_LAHIRI_VERSION_DIFF_ARCSECONDS=0.13823494055031915;
export const JHORA8_ASCENDANT_CONVENTION='jhora8-swiss20201-mean-lahiri-v3';
export const DASHA_YEAR_DAYS=365.2425;
const dashaDuration=(years:number)=>years*DASHA_YEAR_DAYS*86400000;
/** Mahadasha + antardasha. The active-at-birth mahadasha begins before birth. */
export function vimshottari(moonLongitude:number,birthUtc:string):DashaPeriod[]{
  const nak=nakshatraOf(moonLongitude),first=nak.index%9;
  let cursor=Date.parse(birthUtc)-dashaDuration(DASHA_YEARS[first]*nak.fraction);
  const result:DashaPeriod[]=[];
  for(let i=0;i<9;i++){
    const idx=(first+i)%9,years=DASHA_YEARS[idx],start=cursor,end=start+dashaDuration(years);
    const subs=[];let subStart=start;
    for(let j=0;j<9;j++){
      const subIdx=(idx+j)%9,subEnd=j===8?end:subStart+dashaDuration(years*DASHA_YEARS[subIdx]/120);
      subs.push({lord:DASHA_LORDS[subIdx],start:new Date(subStart).toISOString(),end:new Date(subEnd).toISOString()});subStart=subEnd;
    }
    result.push({lord:DASHA_LORDS[idx],start:new Date(start).toISOString(),end:new Date(end).toISOString(),antardashas:subs});cursor=end;
  }
  return result;
}
/** Reject ambiguous/nonexistent civil times at DST transitions rather than guessing. */
export function localToUTC(date:string,time:string,timeZone:string):string {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw new Error('Expected date YYYY-MM-DD and time HH:mm');
  const [y,m,d]=date.split('-').map(Number),[h,min]=time.split(':').map(Number);
  const wall=Date.UTC(y,m-1,d,h,min);
  const constructed=new Date(wall);
  if(constructed.getUTCFullYear()!==y||constructed.getUTCMonth()!==m-1||constructed.getUTCDate()!==d||constructed.getUTCHours()!==h||constructed.getUTCMinutes()!==min)throw new Error('Invalid calendar date or time');
  let formatter:Intl.DateTimeFormat;
  try {formatter=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});}catch{throw new Error('Unknown IANA time zone');}
  const partsAt=(ms:number)=>Object.fromEntries(formatter.formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  // IANA historical offsets may include seconds (e.g. Dublin -00:25:21).
  // Sampling actual zone offsets handles them without a misleading 15-minute grid.
  // Probe on BOTH sides of civil-time transitions to detect DST folds/gaps.
  const matching=new Set<number>();
  for(const hours of [-36,-12,0,12,36]){
    const probe=wall+hours*3600000,p=partsAt(probe);
    const zoneLocalMs=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
    const candidateUtc=wall-(zoneLocalMs-probe);
    const actual=partsAt(candidateUtc);
    if(actual.year===y&&actual.month===m&&actual.day===d&&actual.hour===h&&actual.minute===min&&actual.second===0)matching.add(candidateUtc);
  }
  if(matching.size!==1)throw new Error(matching.size?'Ambiguous local time (DST): specify a different time':'Nonexistent local time (DST gap)');
  return new Date([...matching][0]).toISOString();
}
export function validateBirth(input:BirthInput){
  if(!Number.isFinite(input.latitude)||Math.abs(input.latitude)>90||!Number.isFinite(input.longitude)||Math.abs(input.longitude)>180)throw new Error('Latitude must be -90..90 and longitude -180..180');
  return localToUTC(input.date,input.time,input.timeZone);
}
export function calculateChart(input:BirthInput,eph:EphemerisData):CalculatedChart {
  const utc=validateBirth(input);
  if(!Number.isFinite(eph.ascendant)||!Number.isFinite(eph.ayanamsa))throw new Error('Invalid ephemeris response');
  const byName=new Map(eph.positions.map(p=>[p.name,p]));
  const required=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  if(required.some(p=>!byName.has(p)))throw new Error('Missing required graha from ephemeris');
  const positions=required.map(name=>byName.get(name)!);
  if(positions.some(p=>!Number.isFinite(p.longitude)))throw new Error('Invalid planetary longitude');
  const asc=graha('Ascendant',eph.ascendant,eph.ascendant);
  const convert=(n:1|9|10)=>{
    const a=n===1?eph.ascendant:divisionalLongitude(eph.ascendant,n);
    return positions.map(p=>{const result=graha(p.name,n===1?p.longitude:divisionalLongitude(p.longitude,n),a,p.speed);return n===1?result:{...result,nakshatra:'—',pada:0};});
  };
  return {input,utc,ayanamsa:eph.ayanamsa,ascendant:asc,lagnaD9:graha('Ascendant',divisionalLongitude(eph.ascendant,9),divisionalLongitude(eph.ascendant,9)),lagnaD10:graha('Ascendant',divisionalLongitude(eph.ascendant,10),divisionalLongitude(eph.ascendant,10)),d1:convert(1),d9:convert(9),d10:convert(10),dasha:vimshottari(byName.get('Moon')!.longitude,utc),ephemeris:eph.backend,config:{ayanamsa:'Lahiri',houses:'Whole sign',nodes:'Mean Rahu / opposite Ketu',dashaYearDays:DASHA_YEAR_DAYS,ascendantConvention:'tropical-apparent-minus-mean-lahiri-v2'}};
}
