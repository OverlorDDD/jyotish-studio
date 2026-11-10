/**
 * N4.9.6 — Reader presentation adapter.
 * Uses only the 16 already-verified authored cards; never guesses new
 * planetary claims. A person reads five life themes first. All 16 cards,
 * raw source keys and classical provenance remain accessible on demand.
 */
export type LifeCard={division:number;title:string;meaning:string;proof:readonly string[]};
export const LIFE_GROUPS=[
 {id:'identity',main:1,related:[27,30],uk:'Особистість і внутрішня сила',en:'Identity and inner strength'},
 {id:'money',main:2,related:[16],uk:'Гроші та ресурси',en:'Money and resources'},
 {id:'career',main:10,related:[3,24],uk:'Кар’єра та здібності',en:'Career and talents'},
 {id:'relationships',main:9,related:[7],uk:'Стосунки й близькість',en:'Relationships and intimacy'},
 {id:'roots',main:4,related:[12,20,40,45,60],uk:'Дім, родина і внутрішня опора',en:'Home, family and grounding'}
] as const;
export type ReaderLang='uk'|'en';
const technical=/\b(?:D(?:1|2|3|4|7|9|10|12|16|20|24|27|30|40|45|60)\.[\w.-]+|house-lord|ascendant\.sign|[\w.-]+=[\w.-]+)\b/iu;
export function splitLifeReading(meaning:string,lang:ReaderLang){
 const basisLabel=lang==='uk'?'Астрологічна основа:':'Astrological basis:';
 const actionLabel=lang==='uk'?'Практичний крок:':'Practical step:';
 const basisAt=meaning.lastIndexOf(basisLabel);
 const withoutBasis=(basisAt<0?meaning:meaning.slice(0,basisAt)).trim();
 const actionAt=withoutBasis.lastIndexOf(actionLabel);
 let narrative=(actionAt<0?withoutBasis:withoutBasis.slice(0,actionAt)).trim();
 const action=actionAt<0?'':withoutBasis.slice(actionAt+actionLabel.length).trim();
 // Reader 8 historically emitted raw data keys in some narratives. Never
 // pass raw identifiers through the life-facing layer.
 narrative=narrative.split(/(?<=\.)\s+/u).filter(s=>!technical.test(s)).join(' ').trim();
 return {narrative,action,basis:basisAt<0?'':meaning.slice(basisAt).trim()};
}
export function makeLifeThemes(cards:readonly LifeCard[],lang:ReaderLang){
 const byDivision=new Map(cards.map(c=>[c.division,c]));
 if(cards.length!==16||!LIFE_GROUPS.every(g=>byDivision.has(g.main)))return [];
 const said=new Set<string>();
 return LIFE_GROUPS.map(g=>{
  const primary=byDivision.get(g.main)!;
  const reading=splitLifeReading(primary.meaning,lang);
  // A shared lord may generate the same lived-experience sentence in several
  // chart sections. Say it once; don't make the visitor read it five times.
  const sentences=reading.narrative.match(/[^.!?]+[.!?]+|[^.!?]+$/gu)||[];
  reading.narrative=sentences.filter(sentence=>{
   const key=sentence.toLocaleLowerCase().replace(/\s+/gu,' ').trim();
   if(!key||said.has(key))return false;
   said.add(key);return true;
  }).join(' ').replace(/\s+/gu,' ').trim();
  return {id:g.id,title:lang==='uk'?g.uk:g.en,primary,reading,
   related:g.related.map(d=>byDivision.get(d)).filter((c):c is LifeCard=>Boolean(c))};
 });
}
