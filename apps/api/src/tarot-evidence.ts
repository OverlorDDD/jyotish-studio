/** Bounded, deterministic Tarot evidence review.
 * Its purpose is to reject explicit contradictions about which cards were drawn,
 * card orientation and claims of certain outcomes. It does NOT adjudicate symbolism.
 * Never send a person's question/answer to an additional provider.
 */
import {TAROT_DECK} from './tarot-deck.ts';
import type {ReaderNarrative} from './tarot-reader.ts';
type Lang='uk'|'en';
export type TarotEvidenceCard={position:number;name:string;reversed:boolean};
export type TarotEvidenceResult={ok:boolean;codes:string[]};
const normal=(s:string)=>s.toLocaleLowerCase().replace(/[’‘’]/g,"'").replace(/\s+/g,' ').trim();
const named=(name:string,language:Lang)=>language==='en'
 ? new RegExp('(?:\\b|^)' + name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?:\\b|$)','iu')
 : new RegExp('(?:^|[^\\p{L}])'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^\\p{L}])','iu');
/** Explicit card references are quoted to avoid treating ordinary nouns
 * like strength, justice or death as an assertion of an extra Tarot card. */
export function validateTarotEvidence(
 reading:ReaderNarrative,
 cards:ReadonlyArray<TarotEvidenceCard>,
 language:Lang
):TarotEvidenceResult{
 const codes:string[]=[];
 if(reading.cardExplanations.length!==cards.length)return {ok:false,codes:['card_count_mismatch']};
 const known=new Set(cards.map(c=>normal(c.name)));
 const all=[reading.directAnswer,reading.development,...reading.cardExplanations,reading.caution,reading.advice].join('\n');
 const quoted=[...all.matchAll(/[«“"]([^»”"]{2,70})[»”"]/g)].map(x=>normal(x[1]));
 for(const c of TAROT_DECK){
  const name=normal(c.name[language]);
  if(!known.has(name)&&quoted.some(x=>x===name||x===name+' (reversed)'||x===name+' (перевернута)')){
   codes.push('invented_card');break;
  }
 }
 // Reject only unambiguous opposite orientations with an explicit card name.
 for(let i=0;i<cards.length;i++){
  const c=cards[i],paragraph=reading.cardExplanations[i];
  const full=normal(paragraph);
  const name=normal(c.name);
  const explicit=full.includes(name);
  if(!explicit)continue; // AI may use 'this card'; do not falsely reject.
  if(c.reversed && (new RegExp('(?:'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')\\s*\\((?:upright|пряма|пряме положення)\\)','iu').test(full)))codes.push('orientation_mismatch');
  if(!c.reversed && (new RegExp('(?:'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')\\s*\\((?:reversed|перевернута|перевернуте положення)\\)','iu').test(full)))codes.push('orientation_mismatch');
 }
 const certainty=language==='uk'
  ?/\b(?:точно|гарантовано|безсумнівно)\s+(?:помре|завагітніє|захворіє|виграє|отримаєш\s+гроші)/iu
  :/\b(?:will definitely|guaranteed to)\s+(?:die|become pregnant|fall ill|win money|make a profit)/iu;
 if(certainty.test(all))codes.push('certain_high_stakes_prediction');
 return {ok:codes.length===0,codes:[...new Set(codes)]};
}
