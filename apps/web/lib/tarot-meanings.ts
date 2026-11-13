/** Galaxiora Tarot library: all 78 cards with names, slugs and original bilingual meanings.
 * Card ids match the GalaxiTarot deck and the art map (lib/tarot-art.ts).
 */
import {MAJOR_MEANINGS} from './tarot-meanings-major.ts';
import {WANDS_MEANINGS} from './tarot-meanings-wands.ts';
import {CUPS_MEANINGS} from './tarot-meanings-cups.ts';
import {SWORDS_MEANINGS} from './tarot-meanings-swords.ts';
import {PENTACLES_MEANINGS} from './tarot-meanings-pentacles.ts';
import type {CardMeaningInput,MeaningText,YesNo} from './tarot-meanings-types.ts';
export type {YesNo,MeaningText} from './tarot-meanings-types.ts';

export type TarotGroup='major'|'wands'|'cups'|'swords'|'pentacles';
export type TarotLibraryCard={id:string;slug:string;group:TarotGroup;num:string;
 name:{uk:string;en:string};yesNo:YesNo;uk:MeaningText;en:MeaningText};

const MAJOR_NAMES:Record<string,[string,string,string]>={
 fool:['fool','Блазень','The Fool'],magician:['magician','Маг','The Magician'],priestess:['high-priestess','Верховна Жриця','The High Priestess'],
 empress:['empress','Імператриця','The Empress'],emperor:['emperor','Імператор','The Emperor'],hierophant:['hierophant','Ієрофант','The Hierophant'],
 lovers:['lovers','Закохані','The Lovers'],chariot:['chariot','Колісниця','The Chariot'],strength:['strength','Сила','Strength'],
 hermit:['hermit','Відлюдник','The Hermit'],wheel:['wheel-of-fortune','Колесо Фортуни','Wheel of Fortune'],justice:['justice','Справедливість','Justice'],
 hanged:['hanged-man','Повішений','The Hanged Man'],death:['death','Смерть','Death'],temperance:['temperance','Помірність','Temperance'],
 devil:['devil','Диявол','The Devil'],tower:['tower','Вежа','The Tower'],star:['star','Зірка','The Star'],moon:['moon','Місяць','The Moon'],
 sun:['sun','Сонце','The Sun'],judgement:['judgement','Суд','Judgement'],world:['world','Світ','The World']};
const SUIT:Record<Exclude<TarotGroup,'major'>,[string,string]>={wands:['Жезлів','Wands'],cups:['Кубків','Cups'],swords:['Мечів','Swords'],pentacles:['Пентаклів','Pentacles']};
const RANK:Record<string,[string,string]>={ace:['Туз','Ace'],two:['Двійка','Two'],three:['Трійка','Three'],four:['Четвірка','Four'],five:['П’ятірка','Five'],
 six:['Шістка','Six'],seven:['Сімка','Seven'],eight:['Вісімка','Eight'],nine:['Дев’ятка','Nine'],ten:['Десятка','Ten'],
 page:['Паж','Page'],knight:['Лицар','Knight'],queen:['Королева','Queen'],king:['Король','King']};

function toCard(m:CardMeaningInput):TarotLibraryCard{
 if(m.id.startsWith('major-')){
  const [slug,uk,en]=MAJOR_NAMES[m.id.slice(6)];
  return {id:m.id,slug,group:'major',num:m.num,name:{uk,en},yesNo:m.y,uk:m.uk,en:m.en};
 }
 const [suit,rank]=m.id.split('-') as [Exclude<TarotGroup,'major'>,string];
 return {id:m.id,slug:rank+'-of-'+suit,group:suit,num:m.num,
  name:{uk:RANK[rank][0]+' '+SUIT[suit][0],en:RANK[rank][1]+' of '+SUIT[suit][1]},yesNo:m.y,uk:m.uk,en:m.en};
}
export const TAROT_LIBRARY:readonly TarotLibraryCard[]=[
 ...MAJOR_MEANINGS,...WANDS_MEANINGS,...CUPS_MEANINGS,...SWORDS_MEANINGS,...PENTACLES_MEANINGS
].map(toCard);
export const tarotCardBySlug=(slug:string)=>TAROT_LIBRARY.find(c=>c.slug===slug)??null;
export const tarotCardById=(id:string)=>TAROT_LIBRARY.find(c=>c.id===id)??null;
export const TAROT_GROUPS:readonly {id:TarotGroup;uk:string;en:string}[]=[
 {id:'major',uk:'Старші Аркани',en:'Major Arcana'},{id:'wands',uk:'Жезли',en:'Wands'},{id:'cups',uk:'Кубки',en:'Cups'},
 {id:'swords',uk:'Мечі',en:'Swords'},{id:'pentacles',uk:'Пентаклі',en:'Pentacles'}];
export const YES_NO:Record<YesNo,{uk:string;en:string}>={yes:{uk:'Так',en:'Yes'},no:{uk:'Ні',en:'No'},maybe:{uk:'Можливо',en:'Maybe'}};
/** "У коханні — ніжність…" → "Ніжність…": drop the area prefix for labelled boxes. */
export function aspectText(text:string){
 const t=text.replace(/^(У коханні|У роботі|In love|At work)\s*[—:–-]\s*/,'');
 return t.charAt(0).toUpperCase()+t.slice(1);
}
