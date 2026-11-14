/** Card art. The site shows the Galaxiora deck: Pamela Colman Smith's 1909 Rider–Waite–Smith cards
 * (public domain) as printed, every colour re-tuned to the site palette by tools/tarot-art/build_deck.py
 * (theme 'classic'; other themes, e.g. for a light site theme, are one command away).
 * Files: apps/web/public/tarot/galaxiora/<card-id>.webp (600×940) and <card-id>-sm.webp (300×470), back.svg.
 * The scan map below is the source of the pipeline (pinned revision) and of the optional asset tooling. */
export const TAROT_DECK_PATH='/tarot/galaxiora/';
const DECK_ID=/^(major-(fool|magician|priestess|empress|emperor|hierophant|lovers|chariot|strength|hermit|wheel|justice|hanged|death|temperance|devil|tower|star|moon|sun|judgement|world)|(wands|cups|swords|pentacles)-(ace|two|three|four|five|six|seven|eight|nine|ten|page|knight|queen|king))$/;
export function tarotDeckArt(id:string):{src:string;srcSet:string}|null{
 if(!DECK_ID.test(id))return null;
 const base=TAROT_DECK_PATH+id;
 return {src:base+'.webp',srcSet:base+'-sm.webp 300w, '+base+'.webp 600w'};
}
export const TAROT_DECK_BACK=TAROT_DECK_PATH+'back.svg';
export const TAROT_ART_REVISION='840b84d012c6b74dc1634fa2d00d1b21f5b28093';
export const TAROT_ART_REMOTE='https://raw.githubusercontent.com/mixvlad/TarotCards/'+TAROT_ART_REVISION+'/tarot/rider-waite/720px/';
const MAJOR:Record<string,string>={
 fool:'00_Fool.jpg',magician:'01_Magician.jpg',priestess:'02_High_Priestess.jpg',
 empress:'03_Empress.jpg',emperor:'04_Emperor.jpg',hierophant:'05_Hierophant.jpg',
 lovers:'06_Lovers.jpg',chariot:'07_Chariot.jpg',strength:'08_Strength.jpg',
 hermit:'09_Hermit.jpg',wheel:'10_Wheel_of_Fortune.jpg',justice:'11_Justice.jpg',
 hanged:'12_Hanged_Man.jpg',death:'13_Death.jpg',temperance:'14_Temperance.jpg',
 devil:'15_Devil.jpg',tower:'16_Tower.jpg',star:'17_Star.jpg',moon:'18_Moon.jpg',
 sun:'19_Sun.jpg',judgement:'20_Judgement.jpg',world:'21_World.jpg'
};
const SUITS:Record<string,string>={wands:'Wands',cups:'Cups',swords:'Swords',pentacles:'Pents'};
const RANKS=['ace','two','three','four','five','six','seven','eight','nine','ten','page','knight','queen','king'] as const;
export function tarotArtFilename(id:string):string|null{
 if(id.startsWith('major-'))return MAJOR[id.slice(6)]??null;
 const [suit,rank]=id.split('-');
 if(!SUITS[suit])return null;
 const i=RANKS.indexOf(rank as typeof RANKS[number]);
 if(i<0)return null;
 return SUITS[suit]+String(i+1).padStart(2,'0')+'.jpg';
}
export function tarotArtLocal(id:string):string|null{
 const file=tarotArtFilename(id);
 return file?'/tarot/rws/'+file:null;
}
export function tarotArtRemote(id:string):string|null{
 const file=tarotArtFilename(id);
 return file?TAROT_ART_REMOTE+file:null;
}
