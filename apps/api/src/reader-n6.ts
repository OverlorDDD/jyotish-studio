/** N6 additive adapter: original Reader 10 rules and presentation remain the baseline. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildReader10,type Reader10Report,type Reader10Chapter} from './reader10.ts';
import {buildReader10Facts,PLANETS,type Planet} from './reader10-facts.ts';
import {PLANET_NAME,SIGN_NAME} from './reader10-texts.ts';
export const N6_VERSION='n6-reader-v1' as const;
type Lang='uk'|'en';
const themes=[
 ['identity and initiative','особистість та ініціатива'],['resources and speech','ресурси й спілкування'],
 ['effort and learning','зусилля й навчання'],['home and security','дім та опора'],
 ['creativity and education','творчість та освіта'],['daily work and duties','щоденна робота й обов’язки'],
 ['partnership and agreements','партнерство й домовленості'],['shared resources and change','спільні ресурси й зміни'],
 ['values and study','цінності й навчання'],['work and responsibility','робота й відповідальність'],
 ['community and goals','спільнота й цілі'],['solitude and expenditure','усамітнення й витрати']
] as const;
const planetaryThemes:Record<Planet,readonly [string,string]>={
 Sun:['responsibility and self-direction','відповідальність та самовизначення'],Moon:['emotional rhythm and security','емоційний ритм та опора'],
 Mars:['initiative and boundaries','ініціатива й межі'],Mercury:['learning and communication','навчання та спілкування'],
 Jupiter:['knowledge and meaning','знання та сенс'],Venus:['connection and values','близькість і цінності'],
 Saturn:['discipline and patience','дисципліна й терпіння'],Rahu:['ambition and unfamiliar directions','амбіції та незнайомі напрями'],Ketu:['detachment and discernment','відстороненість і розрізнення']
};
export function timingChapter(chart:CalculatedChart,lang:Lang,asOf:string):Reader10Chapter{
 const uk=lang==='uk',at=Date.parse(asOf+'T12:00:00Z'),f=buildReader10Facts(chart);
 const major=chart.dasha.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end));
 const minor=major?.antardashas?.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end));
 const title=uk?'Поточний період життя':'Current life period';
 const describe=(lord:string)=>PLANETS.includes(lord as Planet)?f.planets[lord as Planet]:null;
 const a=major&&describe(major.lord),b=minor&&describe(minor.lord);
 if(!major||!minor||!a||!b)return {id:'timing',title,lead:uk?'Для цієї дати немає підтвердженої пари періодів.':'No verified pair of periods is available for this date.',paragraphs:[uk?'Не робимо висновків про поточний період без обох розрахованих управителів.':'No current-period inference without both calculated rulers.'],details:null};
 const name=(n:Planet)=>PLANET_NAME[n][lang],topic=(h:number)=>themes[h-1][uk?1:0],nature=(p:Planet)=>planetaryThemes[p][uk?1:0];
 const facts=[a,b].map(p=>name(p.name)+' — '+SIGN_NAME[p.sign-1][lang]+', '+(uk?p.house+'-й дім':'house '+p.house)+(p.rules.length?(uk?'; управитель домів ':'; rules houses ')+p.rules.join(', '):''));
 const period=(p:{start:string;end:string},n:Planet)=>name(n)+' '+p.start.slice(0,10)+' — '+p.end.slice(0,10);
 return {id:'timing',title,lead:uk?'Зараз головна тема — '+topic(a.house)+'.':'The main current theme is '+topic(a.house)+'.',
 paragraphs:[uk?'Довгий життєвий цикл підкреслює сферу «'+topic(a.house)+'» через '+nature(a.name)+'. Коротший цикл додає тему «'+topic(b.house)+'» і «'+nature(b.name)+'».':'The longer cycle emphasizes '+topic(a.house)+' through '+nature(a.name)+'. The shorter cycle adds '+topic(b.house)+' and '+nature(b.name)+'.',
 uk?'Зверніть увагу, як ці сфери взаємодіють у ваших теперішніх рішеннях. Період не гарантує конкретної події.':'Consider how these areas interact in your current decisions. A period does not guarantee a specific event.'],
 details:{paragraphs:[(uk?'Махадаша: ':'Mahadasha: ')+period(major,a.name)+'.',(uk?'Антардаша: ':'Antardasha: ')+period(minor,b.name)+'.',...facts.map(x=>x+'.')],basis:(uk?'Основа: ':'Basis: ')+asOf+'; '+facts.join('; ')+'.',links:[{label:uk?'Вімшоттарі: життєві цикли':'Vimshottari life cycles',path:'pedia/vimshottari-life-cycle'}]}};
}
export function buildN6Reader(chart:CalculatedChart,lang:Lang,asOf:string,exactTime:boolean):Reader10Report|null{
 const base=buildReader10(exactTime?chart:{...chart,n4D60:undefined} as CalculatedChart,lang);
 if(!base)return null;
 return {...base,chapters:[...base.chapters.slice(0,-1),timingChapter(chart,lang,asOf),base.chapters[base.chapters.length-1]]};
}
type Evidence={id:string;text:string};
type BriefChapter={id:string;lead:string;paragraphs:string[];evidence:Evidence[]};
export type N6Brief={version:typeof N6_VERSION;language:Lang;chapters:BriefChapter[]};
export function buildN6Brief(reader:Reader10Report):N6Brief{
 return {version:N6_VERSION,language:reader.language,chapters:reader.chapters.map(c=>{
  const evidence:Evidence[]=(c.details?.paragraphs||[]).flatMap(text=>text.split(/\s+(?=D(?:2|3|4|7|9|10|12|16|20|24|27|30|40|45|60)\s*\()/u)).map((text,i)=>({id:c.id+'.'+i,text:c.id==='timing'?text.replace(/\b\d{4}-\d{2}-\d{2}\b/g,'[period boundary]'):text}));
  if(!evidence.length)evidence.push({id:c.id+'.reader',text:[c.lead,...c.paragraphs].join(' ')});
  return {id:c.id,lead:c.lead,paragraphs:c.paragraphs,evidence};
 })};
}
export const N6_PROMPT='You are a careful Parashari Jyotish editor. Use the supplied Reader 10 interpretation and its local evidence, never calculate or invent placements. Return ONLY JSON {chapters:[{id,lead,paragraphs:[{text,evidenceIds:[string]}]}]}. Every supplied chapter exactly once in order. Lead is one plain sentence; two or three concise paragraphs per chapter, each with evidence IDs from that chapter; collectively reference all supplied chapter evidence. Explicitly synthesize the distinct evidence in work (D10/D24), love (D9/D7), money (D2/D16), home (D4/D12/D40/D45), path (D20/D3/D27/D30) and current periods. All supplied factors should inform the reading, not a list of chart codes. No astrology jargon, chart codes, technical placement claims, raw dates, digits, Markdown, links or HTML in visible text: the server displays exact facts separately. D60 only if a supplied sign comparison is eligible, always explicitly provisional. A boundary warning is not evidence for any personality inference. Never claim destiny, karma or past lives. Never turn traditional possibilities into biography, guaranteed outcomes, medical or financial advice. If a period is unavailable, state that it is unavailable rather than inferring it. Do not infer facts or themes absent from the supplied local evidence. Natural Ukrainian or English as requested. Discuss tensions and distinct implications, no generic motivational filler. Aim for 420–600 words total; keep each substantive chapter at least thirty words, summary at least twenty. When two indicators conflict, explain the specific tension instead of listing them.';
type Draft={id:string;lead:string;paragraphs:{text:string;evidenceIds:string[]}[]};
const plain=(x:unknown,max:number):x is string=>typeof x==='string'&&x.trim()===x&&x.length>=15&&x.length<=max&&/[.!?…]$/u.test(x)&&!/[<>#\x60\[\]{}\d]|https?:|\b(?:Pluto|Uranus|Neptune|Chiron|Lilith)\b|Плутон|Уран|Нептун|Хірон|Ліліт/iu.test(x);
export function parseN6Response(raw:string,reader:Reader10Report,brief:N6Brief):Reader10Report|null{
 if(raw.length>36000)return null;
 let x:unknown;try{x=JSON.parse(raw.trim());}catch{return null;}
 const chapters=(x as {chapters?:unknown}|null)?.chapters;
 if(!Array.isArray(chapters)||chapters.length!==reader.chapters.length)return null;
 const seen=new Set<string>(),result:Reader10Chapter[]=[];
 const words=(s:string)=>s.trim().split(/\s+/u).length;
 for(let i=0;i<reader.chapters.length;i++){
  const original=reader.chapters[i],c=chapters[i] as Draft|null,allowed=new Set(brief.chapters[i].evidence.map(e=>e.id));
  if(!c||c.id!==original.id||!plain(c.lead,350)||!Array.isArray(c.paragraphs)||c.paragraphs.length<2||c.paragraphs.length>3)return null;
  const normalizedLead=c.lead.toLowerCase().replace(/\s+/g,' ');if(seen.has(normalizedLead))return null;seen.add(normalizedLead);
  const all=new Set<string>();
  for(const p of c.paragraphs){
   if(!p||!plain(p.text,900)||!Array.isArray(p.evidenceIds)||!p.evidenceIds.length||p.evidenceIds.some(id=>typeof id!=='string'||!allowed.has(id)))return null;
   for(const id of p.evidenceIds)all.add(id);
   const normalized=p.text.toLowerCase().replace(/\s+/g,' ');if(seen.has(normalized))return null;seen.add(normalized);
  }
  if(all.size!==allowed.size)return null;
  if(words([c.lead,...c.paragraphs.map(p=>p.text)].join(' '))<(original.id==='summary'||!original.details?20:30))return null;
  result.push({...original,lead:c.lead,paragraphs:c.paragraphs.map(p=>p.text),evidenceIds:c.paragraphs.map(p=>p.evidenceIds)});
 }
 return {...reader,chapters:result};
}
