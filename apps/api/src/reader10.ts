/** Reader 10 — direct, chart-specific Parashari reading.
 * Stage 1–2: "Core of the chart" and "Who you are". Every paragraph opens with a fact of
 * this chart and then states what the classical rule says about it. Deterministic:
 * identical verified D1 → identical text. No LLM, no astronomy computed here. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildReader10Facts,type PlanetFact,type Reader10Facts} from './reader10-facts.ts';
import {ASPECT_ON_LAGNA,ASPECT_ON_MOON,IN_LAGNA,LAGNA,LAGNA_LORD_HOUSE,MOON_NAKSHATRA,MOON_SIGN,
 NAKSHATRA_NAME,PLANET_NAME,SIGN_IN,SIGN_NAME,WITH_MOON,type R10Locale} from './reader10-texts.ts';

export const READER10_VERSION='reader10-core-self-1';
export type Reader10Chapter={id:'core'|'self';title:string;paragraphs:string[];summary:string;basis:string};
export type Reader10Report={version:typeof READER10_VERSION;language:R10Locale;chapters:Reader10Chapter[]};

const HOUSE_IN_UK=['у першому домі','у другому домі','у третьому домі','у четвертому домі','у п’ятому домі','у шостому домі',
 'у сьомому домі','у восьмому домі','у дев’ятому домі','у десятому домі','в одинадцятому домі','у дванадцятому домі'];
const HOUSE_FROM_UK=['з першого дому','з другого дому','з третього дому','з четвертого дому','з п’ятого дому','з шостого дому',
 'з сьомого дому','з восьмого дому','з дев’ятого дому','з десятого дому','з одинадцятого дому','з дванадцятого дому'];
const ORD_EN=['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const houseIn=(h:number,l:R10Locale)=>l==='uk'?HOUSE_IN_UK[h-1]:'in the '+ORD_EN[h-1]+' house';
const houseFrom=(h:number,l:R10Locale)=>l==='uk'?HOUSE_FROM_UK[h-1]:'from the '+ORD_EN[h-1]+' house';
const houseShort=(h:number,l:R10Locale)=>l==='uk'?h+'-й дім':ORD_EN[h-1]+' house';
const P=(p:PlanetFact|{name:PlanetFact['name']},l:R10Locale)=>PLANET_NAME[p.name][l];
const dm=(deg:number)=>{const total=Math.floor(deg*60+1e-9);return Math.floor(total/60)+'°'+String(total%60).padStart(2,'0')+'′';};

function dignityClause(p:PlanetFact,l:R10Locale):string{
 const uk=l==='uk';
 if(p.dignity==='exalted')return uk?' у знаку екзальтації':' in its sign of exaltation';
 if(p.dignity==='own')return uk?' у власному знаку':' in its own sign';
 if(p.dignity==='debilitated')return uk?' у знаку падіння':' in its sign of debilitation';
 return '';
}
function lordDignitySentence(p:PlanetFact,l:R10Locale):string{
 const uk=l==='uk',name=P(p,l);
 if(p.dignity==='exalted')return uk?name+' стоїть у знаку екзальтації, тому ця лінія життя дається вам природно й приносить найкращі плоди.'
  :name+' is exalted, so this line of life comes naturally to you and bears its best fruit.';
 if(p.dignity==='own')return uk?name+' стоїть у власному знаку, і це додає вам стійкості та впевненості в цій сфері.'
  :name+' is in its own sign, which adds steadiness and confidence in this area.';
 if(p.dignity==='debilitated')return uk?name+' стоїть у знаку падіння: саме тут від вас вимагається найбільше зусиль, і саме тут ви найбільше виростаєте.'
  :name+' is debilitated: this is where the most effort is asked of you, and where you grow the most.';
 return '';
}
const weakNote=(p:PlanetFact,l:R10Locale)=>p.dignity!=='debilitated'?'':l==='uk'
 ?' '+P(p,l)+' при цьому стоїть у знаку падіння й діє впівсили.':' '+P(p,l)+' is debilitated here and acts at half strength.';
/** One named inner tension, chosen by a fixed priority so the same chart always reads the same. */
function tension(f:Reader10Facts,l:R10Locale):{text:string;basis:string}|null{
 const uk=l==='uk',near=(n:PlanetFact['name'])=>f.withMoon.some(p=>p.name===n),sees=(n:PlanetFact['name'])=>f.aspectsOnMoon.some(p=>p.name===n);
 if(near('Saturn')||sees('Saturn'))return {text:uk
  ?'Головна напруга карти — Сатурн і Місяць: потреба в теплі постійно стикається зі звичкою тримати все в собі.'
  :'The main tension of the chart is Saturn and the Moon: a need for warmth keeps meeting the habit of holding everything in.',
  basis:(uk?'Сатурн ':'Saturn ')+(near('Saturn')?(uk?'поруч із Місяцем':'with the Moon'):(uk?'аспектує Місяць':'aspects the Moon'))};
 if(near('Rahu'))return {text:uk
  ?'Головна напруга карти — Раху поруч із Місяцем: ненаситне «хочу більше» проти потреби в спокої.'
  :'The main tension of the chart is Rahu with the Moon: an insatiable “I want more” against the need for peace.',basis:uk?'Раху поруч із Місяцем':'Rahu with the Moon'};
 if(near('Ketu'))return {text:uk
  ?'Головна напруга карти — Кету поруч із Місяцем: потяг відійти вбік проти потреби в близькості.'
  :'The main tension of the chart is Ketu with the Moon: the pull to step aside against the need for closeness.',basis:uk?'Кету поруч із Місяцем':'Ketu with the Moon'};
 if(near('Mars')||sees('Mars'))return {text:uk
  ?'Головна напруга карти — Марс і Місяць: гаряча реакція випереджає обдумане рішення.'
  :'The main tension of the chart is Mars and the Moon: the hot reaction arrives before the considered decision.',
  basis:(uk?'Марс ':'Mars ')+(near('Mars')?(uk?'поруч із Місяцем':'with the Moon'):(uk?'аспектує Місяць':'aspects the Moon'))};
 const h=f.lagnaLord.house;
 if(h===6||h===8||h===12){
  const through=h===6?(uk?'боротьбу й працю':'struggle and work'):h===8?(uk?'кризи й переродження':'crises and renewal')
   :(uk?'відпускання й віддаленість':'letting go and distance');
  return {text:uk?'Головна напруга карти — управитель лагни '+houseIn(h,l)+': життя веде вас через '+through+', а не прямою дорогою.'
   :'The main tension of the chart is the lagna lord '+houseIn(h,l)+': life leads you through '+through+' rather than by a straight road.',
   basis:(uk?'управитель лагни: ':'lagna lord: ')+houseShort(h,l)};
 }
 return null;
}

function coreChapter(f:Reader10Facts,l:R10Locale):Reader10Chapter{
 const uk=l==='uk',lord=f.lagnaLord,rule=LAGNA_LORD_HOUSE[lord.house-1],lordName=P(lord,l);
 const paragraphs:string[]=[],basis:string[]=[];
 let first=uk?'Стрижень вашої карти — '+lordName+', управитель лагни, '+houseIn(lord.house,l)+'. Головна тема вашого життя: '+rule.focus.uk+'.'
  :'The core of your chart is '+lordName+', the lagna lord, '+houseIn(lord.house,l)+'. The main theme of your life: '+rule.focus.en+'.';
 const dignity=lordDignitySentence(lord,l);
 if(dignity)first+=' '+dignity;
 const next=f.lagnaLordChain[1];
 if(next&&lord.dignity!=='own'){
  const disp=f.planets[next];
  const via=LAGNA_LORD_HOUSE[disp.house-1].focus;
  first+=uk?' Знаком, де стоїть '+lordName+', керує '+P(disp,l)+' '+houseFrom(disp.house,l)+', тож ця тема у вас завжди пов’язана зі сферою «'+via.uk+'».'
   :' The sign '+lordName+' occupies is ruled by '+P(disp,l)+' '+houseFrom(disp.house,l)+', so for you this theme is always tied to the area of “'+via.en+'”.';
  basis.push((uk?'диспозитор: ':'dispositor: ')+P(disp,l)+', '+houseShort(disp.house,l));
 }
 paragraphs.push(first);
 basis.unshift(lordName+(uk?' — управитель лагни, ':' — lagna lord, ')+SIGN_NAME[lord.sign-1][l]+' '+dm(lord.degrees)+', '+houseShort(lord.house,l));
 const yk=f.yogakaraka,strong=f.strongest;
 if(yk){
  const weak=yk.dignity==='debilitated';
  paragraphs.push(uk
   ?'Найсильніша планета карти — '+P(yk,l)+'. Для вашої лагни це йога-карака: одна планета керує і кутовим, і трикутним домом, тому приносить найкращі результати. '+P(yk,l)+' стоїть '+houseIn(yk.house,l)+dignityClause(yk,l)+(weak?' і тому працює не на повну силу: результат приходить через зусилля.':'.')+' Найбільше ця планета дає у сфері «'+LAGNA_LORD_HOUSE[yk.house-1].focus.uk+'».'
   :'The strongest planet of the chart is '+P(yk,l)+'. For your lagna it is the yogakaraka: one planet rules both an angular and a trinal house and therefore brings the best results. '+P(yk,l)+' stands '+houseIn(yk.house,l)+dignityClause(yk,l)+(weak?' and so does not work at full strength: results come through effort.':'.')+' This planet gives the most in the area of “'+LAGNA_LORD_HOUSE[yk.house-1].focus.en+'”.');
  basis.push((uk?'йога-карака: ':'yogakaraka: ')+P(yk,l)+', '+SIGN_NAME[yk.sign-1][l]+', '+houseShort(yk.house,l));
 }else if(strong&&strong.name!==lord.name){
  paragraphs.push(uk
   ?'Головна опора карти — '+P(strong,l)+' '+houseIn(strong.house,l)+dignityClause(strong,l)+'. Сильна планета в сильному домі: на неї ви можете спиратися все життя.'
   :'The main support of the chart is '+P(strong,l)+' '+houseIn(strong.house,l)+dignityClause(strong,l)+'. A strong planet in a strong house: you can lean on it all your life.');
  basis.push(P(strong,l)+', '+SIGN_NAME[strong.sign-1][l]+', '+houseShort(strong.house,l));
 }
 const strain=tension(f,l);
 if(strain){paragraphs.push(strain.text);basis.push(strain.basis);}
 else paragraphs.push(uk?'Гострої внутрішньої суперечності карта не показує: ваші сили діють в одному напрямку.'
  :'The chart shows no sharp inner contradiction: your forces act in one direction.');
 return {id:'core',title:uk?'Стрижень вашої карти':'The core of your chart',paragraphs,
  summary:uk?'Коротко: головна тема вашого життя — '+rule.focus.uk+'.':'In short: the main theme of your life is '+rule.focus.en+'.',
  basis:(uk?'Основа: ':'Basis: ')+basis.join('; ')+'.'};
}

function selfChapter(f:Reader10Facts,l:R10Locale):Reader10Chapter{
 const uk=l==='uk',lord=f.lagnaLord,moon=f.planets.Moon,lagnaRule=LAGNA[f.lagna.sign-1],lordRule=LAGNA_LORD_HOUSE[lord.house-1];
 const paragraphs:string[]=[],basis:string[]=[];
 const lagnaNak=NAKSHATRA_NAME[f.lagna.nakshatraNumber-1][l];
 paragraphs.push((uk?'Ваша лагна — '+SIGN_NAME[f.lagna.sign-1].uk+', '+dm(f.lagna.degrees)+', накшатра '+lagnaNak+'. '
  :'Your lagna is '+SIGN_NAME[f.lagna.sign-1].en+', '+dm(f.lagna.degrees)+', nakshatra '+lagnaNak+'. ')+lagnaRule.text[l]);
 basis.push((uk?'лагна ':'lagna ')+SIGN_NAME[f.lagna.sign-1][l]+' '+dm(f.lagna.degrees)+' ('+lagnaNak+')');
 const onLagna=[...f.inLagna.map(p=>IN_LAGNA[p.name][l]),
  ...f.aspectsOnLagna.filter(p=>ASPECT_ON_LAGNA[p.name]).map(p=>ASPECT_ON_LAGNA[p.name]![l]+weakNote(p,l))];
 if(onLagna.length){
  paragraphs.push(onLagna.join(' '));
  if(f.inLagna.length)basis.push((uk?'у лагні: ':'in the lagna: ')+f.inLagna.map(p=>P(p,l)).join(', '));
  const lookers=f.aspectsOnLagna.filter(p=>ASPECT_ON_LAGNA[p.name]);
  if(lookers.length)basis.push((uk?'аспекти на лагну: ':'aspects on the lagna: ')+lookers.map(p=>P(p,l)+' ('+houseShort(p.house,l)+')').join(', '));
 }
 if(lord.name==='Moon'){
  paragraphs.push((uk?'Управитель вашої лагни, Місяць, стоїть '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].uk+'. Це головне положення карти. '
   :'Your lagna lord, the Moon, stands '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].en+'. This is the key placement of the chart. ')+lordRule.text[l]);
 }else{
  paragraphs.push((uk?'Управитель вашої лагни, '+P(lord,l)+', стоїть '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].uk+'. Це головне положення карти. '
   :'Your lagna lord, '+P(lord,l)+', stands '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].en+'. This is the key placement of the chart. ')+lordRule.text[l]);
  basis.push(P(lord,l)+(uk?' — управитель лагни, ':' — lagna lord, ')+SIGN_NAME[lord.sign-1][l]+' '+dm(lord.degrees)+', '+houseShort(lord.house,l));
 }
 const moonNak=NAKSHATRA_NAME[moon.nakshatraNumber-1][l];
 paragraphs.push((lord.name==='Moon'?'':(uk?'Місяць, ваш розум і почуття, стоїть '+houseIn(moon.house,l)+'. ':'The Moon, your mind and feelings, stands '+houseIn(moon.house,l)+'. '))+
  MOON_SIGN[moon.sign-1][l]+(uk?' Накшатра '+moonNak+' (пада '+moon.pada+') додає '+MOON_NAKSHATRA[moon.nakshatraNumber-1].uk+'.'
   :' The nakshatra '+moonNak+' (pada '+moon.pada+') adds '+MOON_NAKSHATRA[moon.nakshatraNumber-1].en+'.'));
 basis.push((uk?'Місяць'+(lord.name==='Moon'?' — управитель лагни':'')+', ':'Moon'+(lord.name==='Moon'?' — lagna lord':'')+', ')+
  SIGN_NAME[moon.sign-1][l]+' '+dm(moon.degrees)+', '+houseShort(moon.house,l)+', '+moonNak+'-'+moon.pada);
 const influences=[...f.withMoon.map(p=>({p,text:WITH_MOON[p.name as Exclude<PlanetFact['name'],'Moon'>][l]})),
  ...f.aspectsOnMoon.filter(p=>ASPECT_ON_MOON[p.name]).map(p=>({p,text:ASPECT_ON_MOON[p.name]![l]+weakNote(p,l)}))];
 if(influences.length){
  paragraphs.push(influences.map(item=>item.text).join(' '));
  if(f.withMoon.length)basis.push((uk?'поруч із Місяцем: ':'with the Moon: ')+f.withMoon.map(p=>P(p,l)).join(', '));
  const lookers=f.aspectsOnMoon.filter(p=>ASPECT_ON_MOON[p.name]);
  if(lookers.length)basis.push((uk?'аспекти на Місяць: ':'aspects on the Moon: ')+lookers.map(p=>P(p,l)+' ('+SIGN_NAME[p.sign-1][l]+', '+houseShort(p.house,l)+')').join(', '));
 }
 return {id:'self',title:uk?'Хто ви':'Who you are',paragraphs,
  summary:uk?'Коротко: ви '+lagnaRule.short.uk+', '+lordRule.short.uk+'.':'In short: you are '+lagnaRule.short.en+', and you '+lordRule.short.en+'.',
  basis:(uk?'Основа: ':'Basis: ')+basis.join('; ')+'.'};
}

/** English prose says "the Moon" and "the Sun"; the compact basis line keeps bare names. */
export function englishArticles(text:string):string{
 return text.replace(/(^|[.!?] )(?:The )?(Moon|Sun)\b/g,(_m,pre:string,name:string)=>pre+'The '+name)
  .replace(/(?<![Tt]he )\b(Moon|Sun)\b/g,'the $1');
}
export function buildReader10(chart:CalculatedChart,lang:R10Locale):Reader10Report|null{
 // Text is produced only for an internally verified chart; otherwise nothing is claimed.
 if((chart as CalculatedChart&{verification?:{status?:string}}).verification?.status!=='verified_internal')return null;
 let facts:Reader10Facts;
 try{facts=buildReader10Facts(chart);}catch{return null;}
 const chapters=[coreChapter(facts,lang),selfChapter(facts,lang)];
 return {version:READER10_VERSION,language:lang,chapters:lang==='en'?chapters.map(c=>({...c,
  paragraphs:c.paragraphs.map(englishArticles),summary:englishArticles(c.summary)})):chapters};
}
