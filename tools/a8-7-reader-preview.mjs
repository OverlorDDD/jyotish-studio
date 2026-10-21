// A8.7 offline reader preview using synthetic data and reported D1/D9/D10 facts.
// No keys, no external LLM, and no personal birth coordinates or records.
import {buildDetailedReport} from '../apps/api/src/report.ts';
const names=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const natal=[12,3,12,12,9,1,12,8,2];
const loc=(name,sign,asc)=>({
 name,sign,signName:signs[sign-1],house:((sign-asc+12)%12)+1,
 longitude:(sign-1)*30+14,degreesInSign:14,retrograde:false,
 nakshatra:name==='Moon'?'Ardra':'Swati',pada:4
});
const chart={
 input:{date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},
 utc:'2000-01-01T12:00:00.000Z',ephemeris:'SYNTHETIC QUALITY PREVIEW',ayanamsa:23.8,
 ascendant:loc('Ascendant',4,4),
 lagnaD9:loc('Ascendant',9,9),lagnaD10:loc('Ascendant',5,5),
 d1:names.map((n,i)=>loc(n,natal[i],4)),
 d9:names.map((n,i)=>loc(n,n==='Venus'?9:natal[i],9)),
 d10:names.map((n,i)=>loc(n,n==='Mars'?10:natal[i],5)),
 dasha:[{lord:'Saturn',start:'2015-07-17T22:23:01.776Z',end:'2034-07-17T12:57:49.776Z',
 antardashas:[{lord:'Moon',start:'2026-06-20T04:58:02.376Z',end:'2028-01-19T12:10:56.376Z'}]}]
};
const reading=buildDetailedReport(chart,'uk','2026-10-21').editorial;
console.log('GALAXIORA '+reading.version+' — SYNTHETIC CHART, SELECTED DERIVED FACTS ONLY');
for(const c of reading.chapters){
 console.log('\n### '+c.title+'\n');
 console.log(c.paragraphs.join('\n\n'));
}
