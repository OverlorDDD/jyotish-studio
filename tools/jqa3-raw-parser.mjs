/**
 * Strict JQA-3 *narrow-scope* parser for original JHora 8 clipboard dumps.
 * JHoraKit full parser requires 71 advanced bodies; JHora short installation
 * exports 56. Reject missing D1 10 bodies, D9, D10, or 9x9 Vimshottari.
 * Never synthesize expected values from Swiss Ephemeris.
 */
import assert from 'node:assert/strict';
import {divisionalLongitude,signIndex,nakshatraOf} from '../packages/jyotish-core/src/index.ts';
import {d10JHoraFiveEight} from './jhora-independent-parity.mjs';
export const JQA3_RAW_PARSER='jhora8-ten-body-raw-v1';
const NAMES=['Lagna','Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const RASI=['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];
const NAK=['Aswi','Bhar','Krit','Rohi','Mrig','Ardr','Puna','Push','Asre','Magh','PPha','UPha','Hast','Chit','Swat','Visa','Anu','Jye','Mool','PSha','USha','Srav','Dhan','Sata','PBha','UBha','Reva'];
const ABBREV={Ket:'Ketu',Ven:'Venus',Sun:'Sun',Moon:'Moon',Mars:'Mars',Rah:'Rahu',Jup:'Jupiter',Sat:'Saturn',Merc:'Mercury'};
const sign=lon=>signIndex(lon)+1;
const rawPart=/(\d{1,2})\s+(Ar|Ta|Ge|Cn|Le|Vi|Li|Sc|Sg|Cp|Aq|Pi)\s+(\d{1,2})'\s+(\d{1,2}(?:\.\d+)?)"/;
const vargaPart=/^(\d{1,2})(Ar|Ta|Ge|Cn|Le|Vi|Li|Sc|Sg|Cp|Aq|Pi)(\d{2})$/;
const datePat=/^(?:18|19|20|21)\d{2}-\d{2}-\d{2}$/;
const verifyDate=date=>{assert.match(date,datePat);assert.equal(new Date(date+'T00:00:00Z').toISOString().slice(0,10),date);};
function sourcePositions(chartText){
 const block=chartText.split(/\r?\nBody\s+Longitude[^\n]*\n/);
 assert.equal(block.length,2,'Original JHora planet longitude table header absent');
 const lines=block[1].split(/\r?\n/).filter(Boolean);
 const result={};
 for(const name of NAMES){
  const candidates=lines.filter(l=>new RegExp('^'+name+'(?:\\s|$)').test(l));
  assert.equal(candidates.length,1,'Missing or repeated JHora original planet '+name);
  const l=candidates[0],m=l.match(rawPart);
  assert.ok(m,'Malformed original longitude '+name);
  const s=RASI.indexOf(m[2]);assert.ok(s>=0);
  const longitude=s*30+Number(m[1])+Number(m[3])/60+Number(m[4])/3600;
  assert.ok(longitude>=0&&longitude<360,'Invalid longitude '+name);
  const suffix=l.slice(m.index+m[0].length);
  const nak=suffix.match(/^\s+(\S+)\s+([1-4])\s+/);
  assert.ok(nak,'Missing JHora nakshatra and pada '+name);
  const nakIndex=NAK.indexOf(nak[1]);assert.ok(nakIndex>=0,'Unknown JHora nakshatra abbreviation '+nak[1]);
  const p=nakshatraOf(longitude);
  assert.equal(nakIndex,p.index,'Original JHora nakshatra does not follow its own longitude: '+name);
  assert.equal(Number(nak[2]),p.pada,'JHora pada mismatch '+name);
  result[name]={longitude,d1:sign(longitude),nakshatraIndex:nakIndex,pada:Number(nak[2]),
   retrograde:/\(R\)/.test(l.slice(0,m.index))};
 }
 return result;
}
function divisionals(divText,positions){
 const header=divText.split(/\r?\n/)[0];
 assert.ok(/\bD-1\s+D-9\s+D-10\s*\((?:Trd|1-9|5-8)\)/.test(header),'JHora original D9/D10 header not recognized');
 const method=/D-10\s*\(5-8\)/.test(header)?'5-8':'1-9';
 const lines=divText.split(/\r?\n/);
 for(const name of NAMES){
  const rows=lines.filter(x=>new RegExp('^'+name+'\\s+\\d').test(x));
  assert.equal(rows.length,1,'JHora D1/D9/D10 missing body '+name);
  const tokens=rows[0].trim().split(/\s+/);
  assert.ok(tokens.length>=4,'JHora varga row lacks columns '+name);
  for(const col of [1,2,3])assert.match(tokens[col],vargaPart);
  const parse=token=>{const m=token.match(vargaPart);return {degree:Number(m[1]),sign:RASI.indexOf(m[2])+1,minute:Number(m[3])};};
  const d1=parse(tokens[1]),d9=parse(tokens[2]),d10=parse(tokens[3]);
  assert.ok(d1.sign>0&&d9.sign>0&&d10.sign>0);
  assert.equal(positions[name].d1,d1.sign,'Original D1 varga sign differs '+name);
  assert.equal(sign(divisionalLongitude(positions[name].longitude,9)),d9.sign,'D9 independent varga consistency '+name);
  assert.equal(method==='1-9'?sign(divisionalLongitude(positions[name].longitude,10)):d10JHoraFiveEight(positions[name].longitude),d10.sign,'D10 independent varga consistency '+name);
  positions[name].d9=d9.sign;
  positions[name][method==='1-9'?'d10_1_9':'d10_5_8']=d10.sign;
 }
 return method;
}
function parseDasha(text){
 const section=text.match(/\bVimsottari Dasa[^\n]*\n([\s\S]*?)(?:\n\s*Moola Dasa|\n\s*Ashtottari Dasa|$)/);
 assert.ok(section,'JHora original Vimsottari dates missing');
 const rows=section[1].split(/\r?\n/);
 const results=[];
 for(const line of rows){
  const leader=line.match(/^(Merc|Ket|Ven|Sun|Moon|Mars|Rah|Jup|Sat)\s{2,}/);
  if(leader){
   const lord=ABBREV[leader[1]];
   assert.ok(!results.some(x=>x.lord===lord),'Repeated Vimshottari Mahadasha '+lord);
   results.push({lord,start:null,antardashas:{}});
  }
  const latest=results.at(-1);
  if(!latest)continue;
  for(const m of line.matchAll(/\b(Merc|Ket|Ven|Sun|Moon|Mars|Rah|Jup|Sat)\s+((?:18|19|20|21)\d{2}-\d{2}-\d{2})/g)){
   const sub=ABBREV[m[1]],date=m[2];verifyDate(date);
   assert.ok(!latest.antardashas[sub],'Duplicate original JHora antardasha '+latest.lord+'/'+sub);
   latest.antardashas[sub]=date;
  }
 }
 assert.equal(results.length,9,'Original JHora must contain 9 Mahadashas');
 for(const period of results){
  const subs=Object.keys(period.antardashas);
  assert.equal(subs.length,9,'Original JHora must contain nine antardashas under '+period.lord);
  period.start=period.antardashas[period.lord];
  assert.ok(period.start,'Missing Mahadasha start '+period.lord);
 }
 return results;
}
export function parseJHoraRaw(chartText,divisionalsText){
 assert.ok(typeof chartText==='string'&&chartText.includes('Natal Chart'));
 assert.ok(typeof divisionalsText==='string');
 const expectedDate=chartText.match(/^Date:\s*(.+)$/m)?.[1]?.trim();
 const expectedTime=chartText.match(/^Time:\s*(\d{1,2}:\d{2}:\d{2})$/m)?.[1];
 const offset=chartText.match(/^Time Zone:\s*(\d{1,2}):(\d{2}):(\d{2}) \((East|West) of GMT\)$/m);
 const ayanamsa=chartText.match(/^Ayanamsa:\s*(\d{1,2})-(\d{2})-(\d{2}(?:\.\d+)?)$/m);
 assert.ok(expectedDate&&expectedTime&&offset&&ayanamsa,'Missing original birth time/ayanamsa fields');
 const positions=sourcePositions(chartText),variant=divisionals(divisionalsText,positions);
 const vimsottari=parseDasha(chartText);
 const offsetSeconds=(+offset[1]*3600+ +offset[2]*60+ +offset[3])*(offset[4]==='West'?-1:1);
 return {birth:{date:expectedDate,time:expectedTime,utcOffsetSeconds:offsetSeconds,
  ayanamsaDegrees:+ayanamsa[1]+(+ayanamsa[2])/60+(+ayanamsa[3])/3600},
  expected:{positions,vimshottari:vimsottari},d10Variant:variant,parser:JQA3_RAW_PARSER};
}
