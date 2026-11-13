/** Honest overall tone of a spread. Each card has a classic "light/shadow" weight
 * (+2 clearly supportive … −2 clearly difficult); a reversal blocks or delays a supportive
 * card and only softens a difficult one — it never turns a hard spread into a good one.
 * Original Galaxiora weighting of common Rider–Waite–Smith reading practice. */
export type TarotTone='favourable'|'mostlyGood'|'mixed'|'challenging'|'difficult';
type Draw={id:string;reversed:boolean};

const MAJOR:Record<string,number>={fool:1,magician:2,priestess:1,empress:2,emperor:1,hierophant:1,lovers:2,chariot:2,strength:2,
 hermit:0,wheel:1,justice:1,hanged:0,death:-1,temperance:2,devil:-2,tower:-2,star:2,moon:-1,sun:2,judgement:1,world:2};
const RANKS=['ace','two','three','four','five','six','seven','eight','nine','ten','page','knight','queen','king'];
const SUITS:Record<string,number[]>={
 wands:    [2,1,2,2,-1,2,0,1,-1,-2,1,1,2,2],
 cups:     [2,2,2,-1,-2,1,-1,-1,2,2,1,1,2,1],
 swords:   [1,-1,-2,0,-2,0,-2,-2,-2,-2,0,-1,0,1],
 pentacles:[2,0,2,-1,-2,1,0,1,2,2,1,1,2,2]
};
export function baseWeight(id:string):number{
 if(id.startsWith('major-'))return MAJOR[id.slice(6)]??0;
 const [suit,rank]=id.split('-');
 return SUITS[suit]?.[RANKS.indexOf(rank)]??0;
}
/** Weight of a card as drawn: reversed supportive cards lose their support (+2→0, +1→−1),
 * reversed neutral cards lean difficult (−1), reversed difficult cards ease by one step. */
export function cardWeight(card:Draw):number{
 const base=baseWeight(card.id);
 if(!card.reversed)return base;
 if(base>0)return base-2;
 if(base===0)return -1;
 return base+1;
}
export function spreadTone(cards:ReadonlyArray<Draw>):{tone:TarotTone;score:number;reversed:number;hard:number;light:number}{
 const weights=cards.map(cardWeight);
 const score=weights.reduce((a,b)=>a+b,0)/Math.max(1,weights.length);
 const reversed=cards.filter(c=>c.reversed).length;
 const hard=weights.filter(w=>w<0).length,light=weights.filter(w=>w>0).length;
 let tone:TarotTone=score>=1.1?'favourable':score>=.35?'mostlyGood':score>-.35?'mixed':score>-1.1?'challenging':'difficult';
 // Most cards reversed is never presented as a good spread.
 if(cards.length>1&&reversed*2>cards.length&&(tone==='favourable'||tone==='mostlyGood'))tone='mixed';
 // A spread where difficult cards outnumber supportive ones is never "mostly good".
 if(hard>light&&(tone==='favourable'||tone==='mostlyGood'))tone='mixed';
 // A difficult outcome (last) card is never presented as a good ending.
 if(cards.length>1&&cardWeight(cards[cards.length-1])<0&&(tone==='favourable'||tone==='mostlyGood'))tone='mixed';
 return {tone,score,reversed,hard,light};
}
export const TONE_LABEL:Record<TarotTone,{uk:string;en:string}>={
 favourable:{uk:'сприятливий',en:'favourable'},
 mostlyGood:{uk:'радше сприятливий',en:'mostly favourable'},
 mixed:{uk:'неоднозначний',en:'mixed'},
 challenging:{uk:'складний',en:'challenging'},
 difficult:{uk:'важкий',en:'difficult'}
};
