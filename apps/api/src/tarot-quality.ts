/** A9 Tarot Quality v1: bounded structural evidence check, never an oracle.
 * It checks exact source-card/position grounding and reversal language, not
 * untestable claims about a client's circumstances or the future.
 */
import {describeDraws,TAROT_DECK,type Spread} from './tarot-deck.ts';
import type {ReaderNarrative} from './tarot-reader.ts';

type Card={id:string;position:number;reversed:boolean};
export type TarotEvidenceIssue={
 code:'card_count'|'missing_card_anchor'|'missing_reversal'|'contradictory_orientation'|'invented_card';
 cardIndex?:number;
};
const normalize=(text:string)=>text.normalize('NFC').toLocaleLowerCase()
 .replace(/[\s\u00a0]+/g,' ').trim();
const wrapped=(value:string)=>value.replace(/[.*+?^$|[\]\\]/g,'\\$&');
export function reviewTarotEvidence(
 reading:ReaderNarrative,cards:ReadonlyArray<Card>,spread:Spread,locale:'uk'|'en'
):TarotEvidenceIssue[]{
 const described=describeDraws(cards,spread),issues:TarotEvidenceIssue[]=[];
 if(reading.cardExplanations.length!==cards.length)
  return [{code:'card_count'}];
 const allText=normalize([reading.directAnswer,reading.development,
  ...reading.cardExplanations,reading.caution,reading.advice].join(' '));
 for(const [i,card] of described.entries()){
  const p=normalize(reading.cardExplanations[i]);
  const name=normalize(card.name[locale]);
  const position=normalize(card.positionName[locale]);
  if(!p.includes(name)&&!p.includes(position))issues.push({code:'missing_card_anchor',cardIndex:i});
  const mentionsReversed=locale==='uk'?/перевернут/.test(p):/\brevers(?:ed|al)\b/.test(p);
  const explicitlyUpright=locale==='uk'?/\bпрям(?:а|ий|е|ому|ій)\b/.test(p):/\bupright\b/.test(p);
  if(card.reversed&&!mentionsReversed)issues.push({code:'missing_reversal',cardIndex:i});
  if(card.reversed&&explicitlyUpright&&!mentionsReversed)
   issues.push({code:'contradictory_orientation',cardIndex:i});
  if(!card.reversed&&mentionsReversed&&/\b(?:ця|the|this)\b/.test(p))
   issues.push({code:'contradictory_orientation',cardIndex:i});
 }
 // Only block *explicit* references to a named extra card in quotation marks
 // after 'card/карта'. Natural words like "world", "moon" or "sun" alone must
 // never trigger hallucination detection.
 const allowed=new Set(described.map(x=>normalize(x.name[locale])));
 for(const deckCard of TAROT_DECK){
  const name=normalize(deckCard.name[locale]);
  if(allowed.has(name))continue;
  const pattern=locale==='uk'
   ?new RegExp('(?:карта|аркан)\\s+[«"“]'+wrapped(name)+'[»"”]','iu')
   :new RegExp('(?:card|arcana)\\s+[«"“]'+wrapped(name)+'[»"”]','iu');
  if(pattern.test(allText)){issues.push({code:'invented_card'});break;}
 }
 return issues;
}
