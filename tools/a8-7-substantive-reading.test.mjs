import test from 'node:test';
import assert from 'node:assert/strict';
import {authorConsultationV5} from '../apps/api/src/reader-narrative-v5.ts';
import {buildDetailedReport} from '../apps/api/src/report.ts';
import {buildAiChapterSpecs,parseAiConsultation} from '../apps/api/src/consultation-ai.ts';

const ukSign=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const raw=[['Sun',12],['Moon',3],['Mars',12],['Mercury',12],['Jupiter',9],['Venus',1],['Saturn',12],['Rahu',8],['Ketu',2]];
function pos(name,sign,lagna){
 return {name,sign,signName:ukSign[sign-1],house:((sign-lagna+12)%12)+1,
  longitude:(sign-1)*30+14,degreesInSign:14,nakshatra:name==='Moon'?'Ardra':'Swati',
  pada:4,retrograde:false};
}
const chart={
 input:{date:'2000-01-01',time:'12:00',timeZone:'UTC',latitude:0,longitude:0},
 utc:'2000-01-01T12:00:00.000Z',ayanamsa:23.8,ephemeris:'SYNTHETIC REGRESSION -- NOT EPHEMERIS',
 ascendant:pos('Ascendant',4,4),lagnaD9:pos('Ascendant',9,9),lagnaD10:pos('Ascendant',5,5),
 d1:raw.map(([name,sign])=>pos(name,sign,4)),
 d9:raw.map(([name,sign])=>pos(name,name==='Venus'?9:sign,9)),
 d10:raw.map(([name,sign])=>pos(name,name==='Mars'?10:sign,5)),
 dasha:[{lord:'Saturn',start:'2015-07-17T22:23:01.776Z',end:'2034-07-17T12:57:49.776Z',
  antardashas:[{lord:'Moon',start:'2026-06-20T04:58:02.376Z',end:'2028-01-19T12:10:56.376Z'}]}]
};
test('A8.7 Cancer reference chart gets eight substantial, actually different, 3-paragraph traditional readings',()=>{
 const c=authorConsultationV5(chart,'uk','2026-10-21');
 assert.deepEqual(c.map(x=>x.id),['portrait','configuration','tensions','relationships','career','resources','timing','conclusion']);
 assert.ok(c.every(x=>x.paragraphs.length===3));
 for(const chapter of c)assert.ok(chapter.paragraphs.join(' ').length>600,chapter.id+' too short');
 assert.ok(new Set(c.map(x=>x.paragraphs.join(' '))).size===8);
 const one=id=>c.find(x=>x.id===id).paragraphs.join(' ');
 assert.match(one('portrait'),/Місяць.*12-му домі/si);
 assert.match(one('configuration'),/йогакарака/);
 assert.match(one('configuration'),/Юпітер.*власному Стрільці/);
 assert.match(one('configuration'),/Юпітер є диспозитором/);
 assert.match(one('tensions'),/Меркурій.*падіння/);
 assert.match(one('relationships'),/Навамші D9/);
 assert.match(one('career'),/Дашамша D10/);
 assert.match(one('resources'),/Сонце.*Венера/s);
 assert.match(one('timing'),/Сатурна.*Місяця/s);
 assert.match(one('timing'),/2026|червня/);
 assert.match(one('conclusion'),/Два корисні/);
});
test('A8.7 Reader v5 report uses all eight substantive chapters and correct source provenance',()=>{
 const r=buildDetailedReport(chart,'uk','2026-10-21');
 assert.equal(r.editorial.version,'6.0.0');
 assert.equal(r.editorial.chapters.length,8);
 assert.ok(r.editorial.chapters.every(c=>c.paragraphs.length===3&&c.evidence.length>0));
 const specs=buildAiChapterSpecs(r.editorial);
 assert.equal(specs.length,8);
 assert.ok(specs.every(s=>s.draft?.length===3));
 assert.match(specs.find(s=>s.id==='relationships').draft.join(' '),/Навамші/);
 assert.match(specs.find(s=>s.id==='career').draft.join(' '),/Дашамша/);
});
test('A8.7 prior shallow model text cannot replace a better authored consultation',()=>{
 const r=buildDetailedReport(chart,'uk','2026-10-21');
 const specs=buildAiChapterSpecs(r.editorial);
 const shallow='Марс і Сатурн поєднують ініціативу та дисципліну, створюючи життєву напругу. Місяць додає внутрішньої рефлексії й відновлення, що проявляється у балансі між дією та спокоєм.';
 const content=specs.map(s=>'[['+s.id+']]\n'+shallow).join('\n\n');
 assert.equal(parseAiConsultation(content,specs,['yogakaraka']).length,0);
});
test('A8.7 English user gets a useful chart-linked fallback, not Ukrainian template',()=>{
 const cs=authorConsultationV5(chart,'en','2026-10-21');
 assert.equal(cs.length,8);
 assert.ok(cs.every(c=>c.paragraphs.length===3));
 assert.match(cs.find(c=>c.id==='career').paragraphs.join(' '),/Dashamsha D10/);
 assert.match(cs.find(c=>c.id==='relationships').paragraphs.join(' '),/Navamsha D9/);
});

test('A8.7 an ornate but fact-free LLM section does not displace the substantive chart-linked reading',()=>{
 const report=buildDetailedReport(chart,'uk','2026-10-21');
 const specs=buildAiChapterSpecs(report.editorial);
 const noAstrology='У різні періоди життя людина може переживати напруження між бажанням рухатися вперед і потребою зберігати обережність, що іноді підштовхує до обдуманого вибору. Такий шлях здатен допомогти уважніше розуміти свої прагнення, налагоджувати спілкування та знаходити напрямок, у якому розвиток набуває глибшого внутрішнього значення.';
 const full='[[relationships]]\\n'+noAstrology+'\\n\\n'+noAstrology+' '+noAstrology;
 const accepted=parseAiConsultation(full,specs,[],{4:'Venus',7:'Saturn'});
 assert.equal(accepted.length,0);
 assert.ok(report.editorial.chapters.find(c=>c.id==='relationships').paragraphs.join(' ').includes('Навамші'));
});
