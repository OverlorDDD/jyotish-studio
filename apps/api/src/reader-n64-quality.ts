/** N6.4: source-bound display and cheap non-blocking editorial signals.
 * No new astrological calculation, provider request or semantic certification. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import type {Reader10Chapter,Reader10Report} from './reader10.ts';
import type {VargaIntelligence} from './reader-n63-vargas.ts';
import {buildReader10Facts,dignityOf,signLord,aspectedHouses,PLANETS,type Planet,type Dignity} from './reader10-facts.ts';
import {AREAS,SUPPORT,VARGA_NAME} from './reader10-areas.ts';
import {PLANET_NAME,SIGN_NAME,NAKSHATRA_NAME} from './reader10-texts.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';
type Lang='uk'|'en';
export type N64Presentation={base:string[];extra:Record<string,string[]>};
type Evidence={id:string;text:string};
const dignity:Record<Dignity,Record<Lang,string>>={own:{uk:'власний знак',en:'own sign'},exalted:{uk:'екзальтація',en:'exalted'},debilitated:{uk:'падіння',en:'debilitated'},neutral:{uk:'',en:''}};
const dm=(n:number)=>{const m=Math.floor(n*60+1e-9);return Math.floor(m/60)+'°'+String(m%60).padStart(2,'0')+'′';};
/** Compact factual projection keyed by division and graha; raw paragraphs,
 * basis and evidence IDs remain available in the original report. */
export function buildN64Presentation(chart:CalculatedChart,lang:Lang,c:Reader10Chapter,a:VargaIntelligence,asOf?:string,context:Evidence[]=[],local:Evidence[]=[]):N64Presentation|undefined{
 const source=verifiedVargaSource(chart);if(!source)return;
 const f=buildReader10Facts(chart),uk=lang==='uk',pname=(n:Planet)=>PLANET_NAME[n][lang],sign=(s:number)=>SIGN_NAME[s-1][lang];
 const h=(x:number)=>uk?x+'-й дім':'H'+x;
 const lord=(x:number)=>signLord((f.lagna.sign+x-2)%12+1);
 const rows:string[]=[],natal=new Set<Planet>(),varRows=new Map<number,Set<Planet>>();
 const chain=(uk?'Ланцюжок диспозиторів управителя лагни: ':'Lagna lord dispositor chain: ')+f.lagnaLordChain.map(pname).join(' → ')+'.';
 const yoga=f.yogakaraka?(uk?'Йога-карака за лагною: ':'Lagna yogakaraka: ')+pname(f.yogakaraka.name)+'.':null;
 const add=(d:number,n:Planet)=>{if(!varRows.has(d))varRows.set(d,new Set());varRows.get(d)!.add(n);natal.add(n);};
 const area=AREAS.find(x=>x.id===c.id);
 if(c.id==='self'||c.id==='summary'){
  const moon=f.planets.Moon;
  rows.push((uk?'Лагна, тобто знак, що сходив на сході в мить народження: ':'The lagna, the sign rising in the east at the moment of birth: ')+sign(f.lagna.sign)+' '+dm(f.lagna.degrees)+', '+(uk?'накшатра ':'nakshatra ')+NAKSHATRA_NAME[f.lagna.nakshatraNumber-1][lang]+'.');
  rows.push(chain);
  rows.push((uk?'Накшатра Місяця: ':'Moon nakshatra: ')+NAKSHATRA_NAME[moon.nakshatraNumber-1][lang]+', '+(uk?'пада ':'pada ')+moon.pada+'.');
  if(yoga)rows.push(yoga);
  for(const n of [...f.lagnaLordChain,'Moon' as Planet,...f.inLagna.map(p=>p.name),...f.aspectsOnLagna.map(p=>p.name),...f.withMoon.map(p=>p.name),...f.aspectsOnMoon.map(p=>p.name),...(f.yogakaraka?[f.yogakaraka.name]:f.strongest?[f.strongest.name]:[])])natal.add(n);
 }else if(area){
  const hs=area.id==='money'?[2,11,12]:[area.house];
  for(const x of hs){
   rows.push('D1: '+h(x)+' — '+sign((f.lagna.sign+x-2)%12+1)+'; '+(uk?'управитель ':'ruler ')+pname(lord(x))+'.');
   natal.add(lord(x));
   for(const n of PLANETS){const p=f.planets[n];if(p.house===x||aspectedHouses(n,p.house).includes(x))natal.add(n);}
  }
  add(area.varga,lord(area.house));
  for(const d of area.support){const n=SUPPORT[d]?.planet;if(n)add(d,n==='lagnaLord'?f.lagnaLord.name:n);}
  for(const v of a.findings.filter(v=>v.area===area.id))for(const p of v.selected)add(v.division,p.planet);

 }else if(c.id==='timing'&&c.details){
  rows.push(...c.details.paragraphs.filter(t=>!/^(?:D\d+:|(?:Сонце|Місяць|Марс|Меркурій|Юпітер|Венера|Сатурн|Раху|Кету|Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu) — )/u.test(t)));
  const at=Date.parse((asOf||'')+'T12:00:00Z');
  const major=chart.dasha.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end));
  const minor=major?.antardashas?.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end));
  const active=[major?.lord,minor?.lord].filter((n):n is Planet=>PLANETS.includes(n as Planet));
  for(const d of [9,10,...a.timing.map(e=>Number(e.id.slice('timing.v'.length)))])for(const n of active)add(d,n);
  for(const n of active)natal.add(n);
  if(active.length){const major=f.planets[active[0]],minor=f.planets[active[active.length-1]];
   for(const n of PLANETS){const p=f.planets[n];if(p.house===major.house||p.house===minor.house||aspectedHouses(n,p.house).includes(minor.house)||n===signLord(major.sign))natal.add(n);}
  }
 }else return;
 // One D1 row per planet. Whole-sign aspects and lordships are actual facts,
 // not claims about strength, fate or a person's biography.
 const d1=(n:Planet)=>{
  const p=f.planets[n],aspects=aspectedHouses(n,p.house);
  return 'D1: '+pname(n)+' — '+sign(p.sign)+' '+dm(p.degrees)+', '+h(p.house)+(p.dignity!=='neutral'?', '+dignity[p.dignity][lang]:'')+(p.rules.length?(uk?'; управитель домів ': '; rules houses ')+p.rules.join('/'):'')+(aspects.length?(uk?'; аспекти на доми ': '; aspects houses ')+aspects.join('/'):'')+'.';
 };
 rows.push(...[...natal].map(d1));
 for(const [d,names] of [...varRows].sort((x,y)=>x[0]-y[0])){
  const v=source.charts.find(x=>x.division===d);if(!v)continue;
  const facts=[...names].flatMap(n=>{
   const p=v.planets.find(x=>x.name===n);if(!p)return [];
   const q=dignityOf(n,p.sign);
   return [pname(n)+' — '+(d===2?(p.sign===5?(uk?'хора Сонця':'Sun Hora'):(uk?'хора Місяця':'Moon Hora')):sign(p.sign)+', '+h(p.house)+(q!=='neutral'?', '+dignity[q][lang]:'')+(p.boundaryDistanceArcseconds<=1?(uk?', біля межі частки':', near division boundary'):''))];
  });
  if(facts.length)rows.push(VARGA_NAME[d][lang]+': '+facts.join('; ')+'.');
 }
 if(c.id==='path'&&a.d60){
  rows.push(a.d60.text);
 }else if(c.id==='path'&&c.details?.paragraphs.some(t=>/D60\s*\(/.test(t))){
  // Preserve a precision warning even if every selected sign is excluded.
  const p=buildD60Preview(chart,lang);
  if(p.status==='conditional_signs')rows.push(p.warning);
 }
 const extra:Record<string,string[]>={};
 for(const e of context){
  let lines:string[]=[];
  if(e.id==='shared.d1Factors')lines=PLANETS.map(d1);
  else if(e.id==='shared.lordships')lines=PLANETS.filter(n=>f.planets[n].rules.some(h=>[1,2,4,5,7,9,10,11,12].includes(h))).map(d1);
  else if(e.id==='shared.lagnaChain')lines=[chain,...f.lagnaLordChain.map(d1)];
  else if(e.id==='shared.yogakaraka'&&f.yogakaraka&&yoga)lines=[yoga,d1(f.yogakaraka.name)];
  else if(e.id==='shared.moonAspects')lines=['D1: '+(uk?'аспекти на Місяць: ':'aspects on Moon: ')+f.aspectsOnMoon.map(p=>pname(p.name)).join(', ')+'.',...f.aspectsOnMoon.map(p=>d1(p.name)),d1('Moon')];
  else if(e.id.startsWith('shared.cluster')){
   const house=Number(e.id.slice('shared.cluster'.length));
   const planets=PLANETS.filter(n=>f.planets[n].house===house);
   lines=['D1: '+(uk?'концентрація в одному цілознаковому домі ':'same whole-sign house concentration ')+h(house)+', '+planets.map(pname).join(', ')+(uk?' (не обов’язково тісне з’єднання).':' (not necessarily a close conjunction).'),...planets.map(d1)];
  }else lines=[e.text]; // proximity and cross-varga comparisons are distinct facts.
  extra[e.id]=lines;
 }
 for(const e of local){
  const same=context.find(q=>q.text===e.text);
  if(same)extra[e.id]=extra[same.id];
 }
 return {base:[...new Set(rows)],extra};
}
export function renderN64Presentation(p:N64Presentation,ids:Iterable<string>=[]):string[]{
 const rows=[...new Set([...p.base,...[...ids].flatMap(id=>p.extra[id]||[])])];
 // Keep the existing details block; put natal rows before varga rows.
 const div=(t:string)=>/^D(\d+)[: (]/.exec(t);
 const intro=rows.filter(t=>!div(t)),rest=rows.filter(t=>div(t)).sort((a,b)=>Number(div(a)![1])-Number(div(b)![1]));
 return [...intro,...rest];
}
/** A lexical coverage proxy is not a semantic verifier. Keep codes finite,
 * never include model text or personal data, and never request a rewrite. */
export function reviewN64Text(reader:Reader10Report,brief:{chapters:{id:string;evidence:{id:string;text:string}[]}[];context:{id:string;text:string}[]}):string[]{
 const out=new Set<string>();
 const all=reader.chapters.map(c=>[c.lead,...c.paragraphs].join(' ').toLowerCase());
 const words=(s:string)=>s.match(/[\p{L}]+/gu)||[];
 const stock=/будь-які (?:виклики|випробування)|міцний фундамент|перетворювати труднощі на мудрість|долати будь-які|any challenges?|solid foundation|turn difficulties into wisdom|overcome anything/iu;
 const dignityWord=/падінн|екзальтац|ослаблен|власн(?:ий|ому) знак|debilitat|exalt|own sign|weaken/iu;
 const conditional=/умовн|припущ|якщо|попередн|conditional|provisional|if /iu;
 for(let i=0;i<reader.chapters.length;i++){
  const c=reader.chapters[i],s=all[i],spec=brief.chapters.find(x=>x.id===c.id);
  if(stock.test(s))out.add(c.id+'_stock_phrase');
  if(words(s).length<45&&c.id!=='summary')out.add(c.id+'_thin_editorial');
  if(c.id==='self'&&brief.context.some(e=>e.id==='shared.lagnaChain'&&/падінн|debilitat/i.test(e.text))&&!dignityWord.test(s))out.add('self_dispositor_dignity_unmentioned');
  if(spec?.evidence.some(e=>/\.v\d+$/.test(e.id)&&/контраст|contrast/.test(e.text))&&!dignityWord.test(s))out.add(c.id+'_contrast_unmentioned');
  if(c.id==='path'&&spec?.evidence.some(e=>e.id==='path.v60')&&(!conditional.test(s)||!/D60|Д60|Шаштіамш|Shashtiamsha|глибинн|conditional sign|provisional sign/iu.test(s)))out.add('path_d60_not_explicit');
  if(c.id==='timing'&&spec?.evidence.some(e=>/опосередковані зв’язки|Indirect links/i.test(e.text))&&!/опосередкован|непрям|indirect|through other/iu.test(s))out.add('timing_indirect_link_unmentioned');
 }
 return [...out];
}
