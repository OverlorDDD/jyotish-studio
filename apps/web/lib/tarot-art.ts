/** 1909 Pamela Colman Smith artwork, publicly hosted by sixseeds/tarot-api.
 * https://github.com/sixseeds/tarot-api/blob/main/cards.json
 * Original deck artwork public domain; present-day repaints may have separate rights.
 * Failure to load retains an accessible illustrated CSS fallback.
 */
const major=[
 'fool','magician','priestess','empress','emperor','hierophant','lovers','chariot',
 'strength','hermit','wheel','justice','hanged','death','temperance','devil','tower',
 'star','moon','sun','judgement','world'
] as const;
const suitPrefix:Record<string,string>={wands:'wa',cups:'cu',swords:'sw',pentacles:'pe'};
const rankOrder=['ace','two','three','four','five','six','seven','eight','nine','ten','page','knight','queen','king'];
const BASE='https://petaloverflow.github.io/tarot-api/cards/';
/** Maps exactly the same card IDs used by the calculation engine to scan filenames. */
export function tarotCardArt(id:string):string|null{
 if(id.startsWith('major-')){
  const index=major.findIndex(name=>name===id.slice(6));
  return index<0?null:BASE+'ar'+String(index).padStart(2,'0')+'.jpg';
 }
 const [suit,rank]=id.split('-'),prefix=suitPrefix[suit],index=rankOrder.indexOf(rank);
 return prefix&&index>=0?BASE+prefix+String(index+1).padStart(2,'0')+'.jpg':null;
}
