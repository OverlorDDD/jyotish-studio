import test from 'node:test';
import assert from 'node:assert/strict';
import {authorConsultationV6} from '../apps/api/src/reader-narrative-v6.ts';
import {buildDetailedReport} from '../apps/api/src/report.ts';
import {classicalLordshipTable} from '../apps/api/src/reader-classical.ts';

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const NAMES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const IDS=['portrait','configuration','tensions','relationships','career','resources','timing','conclusion'];
function fixture(ascendantSign,seed=0){
 const position=(name,sign,asc)=>({
  name,sign,signName:SIGNS[sign-1],house:((sign-asc+12)%12)+1,
  degreesInSign:13.2,longitude:(sign-1)*30+13.2,nakshatra:name==='Moon'?'Ardra':'Swati',pada:4,retrograde:false
 });
 const selected=name=>{
  const base={Sun:12,Moon:3,Mars:12,Mercury:12,Jupiter:9,Venus:1,Saturn:12,Rahu:6,Ketu:12}[name];
  if(seed===0&&ascendantSign===4)return base;
  return (base+ascendantSign+seed+NAMES.indexOf(name)*2-1)%12+1;
 };
 return {
  input:{date:'2000-01-01',time:'12:00',latitude:0,longitude:0,timeZone:'UTC'},
  utc:'2000-01-01T12:00:00Z',ayanamsa:23.8,ephemeris:'synthetic editorial test',
  ascendant:position('Ascendant',ascendantSign,ascendantSign),
  lagnaD9:position('Ascendant',9,9),lagnaD10:position('Ascendant',5,5),
  d1:NAMES.map(n=>position(n,selected(n),ascendantSign)),
  d9:NAMES.map((n,i)=>position(n,i%12+1,9)),
  d10:NAMES.map((n,i)=>position(n,(i+2)%12+1,5)),
  dasha:[{lord:'Saturn',start:'2020-01-01',end:'2035-01-01',antardashas:[
   {lord:'Moon',start:'2026-01-01',end:'2027-01-01'}]}]
 };
}
test('Reader v6 generates eight substantial distinct editorial chapters in both languages',()=>{
 for(const lang of ['uk','en']){
  const out=authorConsultationV6(fixture(4),lang,'2026-10-22');
  assert.deepEqual(out.map(c=>c.id),IDS);
  assert.ok(out.every(c=>c.paragraphs.length===3));
  assert.ok(out.every(c=>c.paragraphs.every(p=>p.length>=110)));
  assert.ok(new Set(out.map(c=>c.paragraphs.join(' '))).size===8);
  assert.ok(out.reduce((sum,c)=>sum+c.paragraphs.join(' ').length,0)>6000);
  const reading=out.map(x=>x.paragraphs.join(' ')).join('\n');
  if(lang==='uk'){
   assert.match(reading,/Навамша D9/);
   assert.match(reading,/Дашамша D10/);
   assert.match(reading,/махадаша Сатурна/);
   assert.match(reading,/антардаша Місяця/);
   assert.match(out.find(c=>c.id==='configuration').paragraphs.join(' '),/Юпітер.*у власному знаку/s);
   assert.match(reading,/йогакаракою/);
  }else{
   assert.match(reading,/Navamsha D9/);
   assert.match(reading,/Dashamsha D10/);
   assert.match(reading,/mahadasha/);
   assert.doesNotMatch(reading,/управитель|Лагна|у\s+домі/);
  }
 }
});
test('Reader v6 stays chart-specific across 24 different synthetic ascendants',()=>{
 const unique=new Set();
 for(let i=0;i<24;i++){
  const c=fixture(i%12+1,Math.floor(i/12));
  const lords=classicalLordshipTable(c.ascendant.sign);
  const out=authorConsultationV6(c,'uk','2026-10-22');
  const text=out.map(ch=>ch.paragraphs.join(' ')).join(' ');
  assert.equal(out.length,8);
  assert.ok(out.every(ch=>ch.paragraphs.length===3&&ch.paragraphs.every(p=>p.length>=110)),'chart '+i);
  const time=out.find(ch=>ch.id==='timing').paragraphs.join(' ');
  assert.match(time,/Сатурна|Сатурн/);
  assert.match(time,/Місяця|Місяць/);
  const r=buildDetailedReport(c,'uk','2026-10-22');
  assert.equal(r.editorial.version,'6.0.0');
  assert.equal(r.editorial.chapters.length,8);
  assert.ok(r.editorial.chapters.every(ch=>ch.evidence.length>0));
  if(![2,4,5,7,10,11].includes(c.ascendant.sign)){
   assert.doesNotMatch(out.find(ch=>ch.id==='configuration').paragraphs.join(' '),/є йогакаракою/);
  }
  assert.equal(lords[7],classicalLordshipTable(c.ascendant.sign)[7]);
  unique.add(text);
 }
 assert.ok(unique.size>=23);
});
test('Reader v6 does not invent a planetary cluster when positions are distributed',()=>{
 const c=fixture(1,4);
 const out=authorConsultationV6(c,'uk','2026-10-22');
 const center=out.find(ch=>ch.id==='configuration').paragraphs.join(' ');
 const max=Math.max(...Array.from({length:12},(_,i)=>c.d1.filter(p=>p.house===i+1&&NAMES.slice(0,7).includes(p.name)).length));
 if(max<3)assert.match(center,/немає домінантного скупчення/);
 assert.doesNotMatch(center,/Марс і Сатурн займають/); // does not borrow unsupported phrasing from the tension chapter
});
test('Reader v6 reports absent periods without inventing a current planet',()=>{
 const c=fixture(4);c.dasha=[];
 for(const lang of ['uk','en']){
  const out=authorConsultationV6(c,lang,'2026-10-22');
  const chapter=out.find(ch=>ch.id==='timing').paragraphs.join(' ');
  assert.match(chapter,lang==='uk'?/активної махадаші.*немає/:/No active mahadasha/);
 }
});
