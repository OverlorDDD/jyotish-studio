/** Reader 10 — direct, chart-specific Parashari reading.
 * Stage 1–2: "Core of the chart" and "Who you are". Every paragraph opens with a fact of
 * this chart and then states what the classical rule says about it. Deterministic:
 * identical verified D1 → identical text. No LLM, no astronomy computed here. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildReader10Facts,type PlanetFact,type Reader10Facts} from './reader10-facts.ts';
import {AREAS,SUPPORT,VARGA_NAME,type AreaId,type AreaRule,type Tier} from './reader10-areas.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';
import {dignityOf,signLord,aspectedHouses,PLANETS,type Planet} from './reader10-facts.ts';
import {ASPECT_ON_LAGNA,ASPECT_ON_MOON,IN_LAGNA,LAGNA,LAGNA_LORD_HOUSE,MOON_NAKSHATRA,MOON_SIGN,
 NAKSHATRA_NAME,PLANET_NAME,SIGN_IN,SIGN_NAME,WITH_MOON,type R10Locale} from './reader10-texts.ts';

export const READER10_VERSION='reader10-full-1';
export type Reader10Chapter={id:'core'|'self'|AreaId|'summary';title:string;paragraphs:string[];summary:string;basis:string};
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
 let first=uk?'Центральна тема вашої карти задана положенням управителя лагни: '+lordName+' стоїть '+houseIn(lord.house,l)+'. Головна тема вашого життя: '+rule.focus.uk+'.'
  :'The central theme of your chart is set by the lagna lord: '+lordName+' stands '+houseIn(lord.house,l)+'. The main theme of your life: '+rule.focus.en+'.';
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
 return {id:'core',title:uk?'Центральна тема вашої карти':'The central theme of your chart',paragraphs,
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

const ORD_NOM_UK=['перший','другий','третій','четвертий','п’ятий','шостий','сьомий','восьмий','дев’ятий','десятий','одинадцятий','дванадцятий'];
const GOOD_HOUSES=new Set([1,4,5,7,9,10]),HARD_HOUSES=new Set([6,8,12]);
const SUN_HORA=new Set<Planet>(['Sun','Mars','Jupiter']),MOON_HORA=new Set<Planet>(['Moon','Venus','Saturn']);
type Vargas=NonNullable<ReturnType<typeof verifiedVargaSource>>;
type VargaSpot={sign:number;house:number};
function vargaSpot(vargas:Vargas|null,division:number,planet:Planet):VargaSpot|null{
 const c=vargas?.charts.find(item=>item.division===division),p=c?.planets.find(item=>item.name===planet);
 if(!c||!p||!Number.isInteger(p.sign)||p.sign<1||p.sign>12)return null;
 return {sign:p.sign,house:((p.sign-c.lagnaSign+12)%12)+1};
}
/** Strength of a planet inside one divisional chart: dignity plus house from that chart's lagna. */
function vargaTier(planet:Planet,spot:VargaSpot):Tier{
 const d=dignityOf(planet,spot.sign);
 const score=(d==='exalted'||d==='own'?1:d==='debilitated'?-1:0)+(GOOD_HOUSES.has(spot.house)?1:HARD_HOUSES.has(spot.house)?-1:0);
 return score>=1?'strong':score<=-1?'hard':'mixed';
}
const dignityWord=(planet:Planet,sign:number,l:R10Locale)=>{
 const d=dignityOf(planet,sign),uk=l==='uk';
 return d==='exalted'?(uk?', у знаку екзальтації':', exalted'):d==='own'?(uk?', у власному знаку':', in its own sign')
  :d==='debilitated'?(uk?', у знаку падіння':', debilitated'):'';
};
function supportSentence(f:Reader10Facts,vargas:Vargas|null,division:number,l:R10Locale):{text:string;basis:string}|null{
 const rule=SUPPORT[division];if(!rule)return null;
 const planet:Planet=rule.planet==='lagnaLord'?f.lagnaLord.name:rule.planet,spot=vargaSpot(vargas,division,planet);
 if(!spot)return null;
 const uk=l==='uk',tier=vargaTier(planet,spot),name=PLANET_NAME[planet][l];
 return {text:VARGA_NAME[division][l]+', '+rule.topic[l]+': '+name+' '+SIGN_IN[spot.sign-1][l]+dignityWord(planet,spot.sign,l)+
   (uk?' — ':' — ')+rule.tier[tier][l],
  basis:'D'+division+': '+name+', '+SIGN_NAME[spot.sign-1][l]+', '+houseShort(spot.house,l)};
}
function d60Sentence(f:Reader10Facts,chart:CalculatedChart,l:R10Locale):{text:string;basis:string}|null{
 const uk=l==='uk',preview=buildD60Preview(chart,l);
 if(preview.status!=='conditional_signs')return null;
 const lord=f.lagnaLord.name,row=preview.allPlanets.find(p=>p.planet===lord);
 if(!row)return null;
 if(row.nearBoundary)return {text:VARGA_NAME[60][l]+(uk
   ?': управитель лагни стоїть надто близько до межі частки. Ця карта змінюється кожні дві хвилини, тому без часу народження, точного до хвилини, ми її не трактуємо.'
   :': the lagna lord stands too close to a division boundary. This chart changes every two minutes, so without a birth time exact to the minute we do not read it.'),
  basis:'D60: '+PLANET_NAME[lord][l]+(uk?' біля межі частки':' near a division boundary')};
 const d=dignityOf(lord,row.d60Sign),name=PLANET_NAME[lord][l];
 const body=d==='exalted'||d==='own'
  ?(uk?'найтонша з карт підтверджує силу управителя лагни: глибинна основа вашої долі міцна.':'the finest of the charts confirms the strength of the lagna lord: the deep foundation of your destiny is firm.')
  :d==='debilitated'
  ?(uk?'найтонша з карт показує давні борги, які ви сплачуєте терпінням і працею над собою.':'the finest of the charts shows old debts that you repay with patience and work on yourself.')
  :(uk?'найтонша з карт не додає й не забирає: вирішує те, що ви робите в цьому житті.':'the finest of the charts neither adds nor takes away: what you do in this life decides.');
 return {text:VARGA_NAME[60][l]+': '+name+' '+SIGN_IN[row.d60Sign-1][l]+dignityWord(lord,row.d60Sign,l)+' — '+body+
   (uk?' Цей висновок чинний лише за точного до хвилини часу народження.':' This holds only for a birth time exact to the minute.'),
  basis:'D60: '+name+', '+SIGN_NAME[row.d60Sign-1][l]};
}
function areaChapter(f:Reader10Facts,rule:AreaRule,vargas:Vargas|null,chart:CalculatedChart,l:R10Locale,
 tiers:Partial<Record<AreaId,Tier>>):Reader10Chapter{
 const uk=l==='uk',H=rule.house,sign=((f.lagna.sign+H-2)%12)+1,lord=f.planets[signLord(sign)],lordName=P(lord,l);
 const all=PLANETS.map(name=>f.planets[name]);
 const occupants=all.filter(p=>p.house===H);
 const lookers=all.filter(p=>p.house!==H&&(p.name==='Mars'||p.name==='Jupiter'||p.name==='Saturn')&&aspectedHouses(p.name,p.house).includes(H));
 const paragraphs:string[]=[],basis:string[]=[];
 let first=uk?'Ваш '+ORD_NOM_UK[H-1]+' дім — '+SIGN_NAME[sign-1].uk+'.':'Your '+ORD_EN[H-1]+' house is '+SIGN_NAME[sign-1].en+'.';
 first+=occupants.length?' '+occupants.map(p=>rule.occupants[p.name][l]).join(' ')
  :(uk?' Планет у ньому немає, тому про цю сферу говорить управитель дому.':' There are no planets in it, so the lord of the house speaks for this area.');
 for(const p of lookers)first+=' '+(p.name===lord.name
  ?(uk?P(p,l)+' дивиться на власний дім і зміцнює його.':P(p,l)+' aspects its own house and strengthens it.')
  :p.name==='Jupiter'
  ?(uk?'Юпітер дивиться на цей дім і оберігає його.':'Jupiter aspects this house and protects it.')
  :p.name==='Saturn'
  ?(uk?'Сатурн дивиться на цей дім: усе тут приходить із затримкою й вимагає терпіння.':'Saturn aspects this house: everything here arrives with delay and asks for patience.')
  :(uk?'Марс дивиться на цей дім і додає поспіху та суперечок.':'Mars aspects this house and adds haste and disputes.'));
 paragraphs.push(first);
 basis.push(houseShort(H,l)+' — '+SIGN_NAME[sign-1][l]+(occupants.length?' ('+occupants.map(p=>P(p,l)).join(', ')+')':''));
 if(lookers.length)basis.push((uk?'аспекти на дім: ':'aspects on the house: ')+lookers.map(p=>P(p,l)).join(', '));
 let second=(uk?'Управитель дому, '+lordName+', стоїть '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].uk+'. '
  :'The lord of the house, '+lordName+', stands '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].en+'. ')+rule.lord[lord.house-1][l];
 if(lord.dignity==='exalted'||lord.dignity==='own')second+=uk
  ?' '+lordName+' тут '+(lord.dignity==='exalted'?'у знаку екзальтації':'у власному знаку')+', тож обіцяне справджується повною мірою.'
  :' '+lordName+' is '+(lord.dignity==='exalted'?'exalted':'in its own sign')+' here, so what is promised comes true in full.';
 if(lord.dignity==='debilitated')second+=uk
  ?' '+lordName+' тут у знаку падіння: результат приходить через зусилля й пізніше, ніж хотілося б.'
  :' '+lordName+' is debilitated here: results come through effort and later than you would like.';
 paragraphs.push(second);
 basis.push(lordName+(uk?' — управитель, ':' — lord, ')+SIGN_NAME[lord.sign-1][l]+' '+dm(lord.degrees)+', '+houseShort(lord.house,l));
 let score=(lord.dignity==='exalted'?2:lord.dignity==='own'?1:lord.dignity==='debilitated'?-2:0)+
  (GOOD_HOUSES.has(lord.house)?1:HARD_HOUSES.has(lord.house)?-1:0)+
  (occupants.some(p=>p.name==='Jupiter')||lookers.some(p=>p.name==='Jupiter')?1:0)+
  (lookers.some(p=>p.name===lord.name)?1:0)-
  (occupants.some(p=>p.name==='Saturn'||p.name==='Rahu'||p.name==='Ketu')?1:0);
 const spot=vargaSpot(vargas,rule.varga,lord.name);
 if(spot){
  const vName=VARGA_NAME[rule.varga][l];
  let third:string;
  if(rule.varga===2){
   const sunHora=spot.sign===5,fits=lord.name==='Mercury'||(sunHora?SUN_HORA.has(lord.name):MOON_HORA.has(lord.name));
   third=(uk?'У карті '+vName+' '+lordName+' стоїть у хорі '+(sunHora?'Сонця: гроші ви заробляєте власними зусиллями й авторитетом.':'Місяця: гроші приходять через людей, родину й уміння зберігати.')
    :'In '+vName+' '+lordName+' is in the hora of the '+(sunHora?'Sun: you earn money by your own effort and authority.':'Moon: money comes through people, family and the ability to keep it.'))+
    (fits?(uk?' Для цієї планети це своя хора, і вона працює на повну силу.':' For this planet it is its own hora, and it works at full strength.')
     :(uk?' Для цієї планети це чужа хора, тому заробити вам легше, ніж утримати.':' For this planet it is the other hora, so earning is easier for you than keeping.'));
   score+=fits?1:-1;
  }else{
   const d=dignityOf(lord.name,spot.sign),same=spot.sign===lord.sign;
   third=uk?'У карті '+vName+', яка уточнює тему «'+rule.vargaTopic.uk+'», '+lordName+' стоїть '+SIGN_IN[spot.sign-1].uk+', '+houseIn(spot.house,l)+' від її лагни.'
    :'In '+vName+', which refines the theme of “'+rule.vargaTopic.en+'”, '+lordName+' stands '+SIGN_IN[spot.sign-1].en+', '+houseIn(spot.house,l)+' from its lagna.';
   if(same){third+=uk?' Це варготтама: планета займає той самий знак, що й в основній карті, тому діє стабільно й сильно.'
     :' This is vargottama: the planet holds the same sign as in the main chart, so it acts steadily and strongly.';score+=1;}
   if(d==='exalted'||d==='own'){third+=uk?' Тут планета у силі, і це підтверджує обіцянку основної карти.':' The planet is strong here, which confirms the promise of the main chart.';score+=1;}
   if(d==='debilitated'){third+=uk?' Тут планета ослаблена: зовні ця сфера виглядає краще, ніж ви відчуваєте її зсередини.'
     :' The planet is weak here: from outside this area looks better than it feels to you from within.';score-=1;}
   if(GOOD_HOUSES.has(spot.house)){third+=uk?' Сильний дім дробової карти додає стійкості.':' A strong house of the divisional chart adds stability.';score+=1;}
   if(HARD_HOUSES.has(spot.house)){third+=uk?' Важкий дім дробової карти показує перешкоди, які доведеться пройти.':' A hard house of the divisional chart shows obstacles you will have to pass.';score-=1;}
  }
  paragraphs.push(third);
  basis.push('D'+rule.varga+': '+lordName+', '+SIGN_NAME[spot.sign-1][l]+', '+houseShort(spot.house,l));
 }
 const tier:Tier=score>=2?'strong':score<=-1?'hard':'mixed';
 tiers[rule.id]=tier;
 const extra=rule.support.map(v=>supportSentence(f,vargas,v,l)).filter((x):x is {text:string;basis:string}=>!!x);
 if(rule.id==='path'){const d60=d60Sentence(f,chart,l);if(d60)extra.push(d60);}
 if(extra.length){paragraphs.push(extra.map(x=>x.text).join(' '));basis.push(...extra.map(x=>x.basis));}
 const verdict=rule.verdict[tier][l];
 return {id:rule.id,title:rule.title[l],paragraphs,
  summary:(uk?'Коротко: ':'In short: ')+verdict.charAt(0).toLowerCase()+verdict.slice(1),
  basis:(uk?'Основа: ':'Basis: ')+basis.join('; ')+'.'};
}
/** Closing synthesis: the central theme with the strongest and the most demanding areas side by side. */
function closingChapter(f:Reader10Facts,tiers:Partial<Record<AreaId,Tier>>,l:R10Locale):Reader10Chapter{
 const uk=l==='uk',focus=LAGNA_LORD_HOUSE[f.lagnaLord.house-1].focus[l];
 const pick=(tier:Tier)=>AREAS.filter(rule=>tiers[rule.id]===tier);
 const strong=pick('strong'),hard=pick('hard'),mixed=pick('mixed');
 const list=(rules:readonly AreaRule[])=>rules.map(rule=>rule.short[tiers[rule.id]!][l]).join('; ');
 const paragraphs=[uk?'Усе в цій карті обертається навколо однієї теми: '+focus+'. Решту сфер варто читати саме через неї.'
  :'Everything in this chart turns around one theme: '+focus+'. The other areas are best read through it.'];
 if(strong.length)paragraphs.push((uk?'На що ви можете спиратися: ':'What you can lean on: ')+list(strong)+'.');
 if(mixed.length)paragraphs.push((uk?'Що залежить від вас: ':'What depends on you: ')+list(mixed)+'.');
 if(hard.length)paragraphs.push((uk?'Де карта вимагає найбільше: ':'Where the chart asks the most: ')+list(hard)+'.');
 const names=(rules:readonly AreaRule[])=>rules.map(rule=>rule.title[l].toLowerCase()).join(', ');
 const summary=(uk?'Коротко: ':'In short: ')+(strong.length
  ?(uk?'ваші сильні сфери — '+names(strong):'your strong areas are '+names(strong))
  :(uk?'виразно сильних сфер карта не виділяє, усе вирішує ваша праця':'the chart singles out no clearly strong area; your own work decides'))+
  (hard.length?(uk?'; найбільшої уваги вимагає — '+names(hard):'; the most attention is needed in '+names(hard)):'')+'.';
 return {id:'summary',title:uk?'Підсумок':'Summary',paragraphs,summary,
  basis:(uk?'Основа: синтез D1 і дробових карт D2–D60 за розділами вище.':'Basis: synthesis of D1 and the divisional charts D2–D60 from the chapters above.')};
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
 const vargas=verifiedVargaSource(chart);
 const tiers:Partial<Record<AreaId,Tier>>={};
 const areas=AREAS.map(rule=>areaChapter(facts,rule,vargas,chart,lang,tiers));
 const chapters=[coreChapter(facts,lang),selfChapter(facts,lang),...areas,closingChapter(facts,tiers,lang)];
 return {version:READER10_VERSION,language:lang,chapters:lang==='en'?chapters.map(c=>({...c,
  paragraphs:c.paragraphs.map(englishArticles),summary:englishArticles(c.summary)})):chapters};
}
