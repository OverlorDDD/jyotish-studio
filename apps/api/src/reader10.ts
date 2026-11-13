/** Reader 10 — chart-specific Parashari reading in two layers.
 * Visible layer: everyday language, no astrological terms, one plain lead line per chapter.
 * "How this shows in your chart" layer: the placements, dignities, divisional charts and
 * the rule behind each statement, with links to guide pages. Deterministic: identical
 * verified chart → identical text. No LLM, no astronomy computed here. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {buildReader10Facts,dignityOf,signLord,aspectedHouses,PLANETS,
 type Planet,type PlanetFact,type Reader10Facts} from './reader10-facts.ts';
import {AREAS,AREA_LEAD,SUPPORT,VARGA_NAME,YOGA_NOTE,type AreaId,type AreaRule,type Tier} from './reader10-areas.ts';
import {ASPECT_PLAIN,FEELINGS,LIFE_THEME,TEMPERAMENT,TENSION} from './reader10-plain.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';
import {ASPECT_ON_LAGNA,ASPECT_ON_MOON,IN_LAGNA,LAGNA_LORD_HOUSE,MOON_NAKSHATRA,
 NAKSHATRA_NAME,PLANET_NAME,SIGN_IN,SIGN_NAME,WITH_MOON,type R10Locale} from './reader10-texts.ts';

export const READER10_VERSION='reader10-plain-1';
export type Reader10Link={label:string;path:string};
export type Reader10Details={paragraphs:string[];basis:string;links:Reader10Link[]};
export type Reader10Chapter={id:'self'|AreaId|'summary';title:string;lead:string;paragraphs:string[];details:Reader10Details|null};
export type Reader10Report={version:typeof READER10_VERSION;language:R10Locale;chapters:Reader10Chapter[]};

const HOUSE_IN_UK=['у першому домі','у другому домі','у третьому домі','у четвертому домі','у п’ятому домі','у шостому домі',
 'у сьомому домі','у восьмому домі','у дев’ятому домі','у десятому домі','в одинадцятому домі','у дванадцятому домі'];
const HOUSE_FROM_UK=['з першого дому','з другого дому','з третього дому','з четвертого дому','з п’ятого дому','з шостого дому',
 'з сьомого дому','з восьмого дому','з дев’ятого дому','з десятого дому','з одинадцятого дому','з дванадцятого дому'];
const ORD_NOM_UK=['перший','другий','третій','четвертий','п’ятий','шостий','сьомий','восьмий','дев’ятий','десятий','одинадцятий','дванадцятий'];
const ORD_EN=['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const houseIn=(h:number,l:R10Locale)=>l==='uk'?HOUSE_IN_UK[h-1]:'in the '+ORD_EN[h-1]+' house';
const houseFrom=(h:number,l:R10Locale)=>l==='uk'?HOUSE_FROM_UK[h-1]:'from the '+ORD_EN[h-1]+' house';
const houseShort=(h:number,l:R10Locale)=>l==='uk'?h+'-й дім':ORD_EN[h-1]+' house';
const P=(p:{name:Planet},l:R10Locale)=>PLANET_NAME[p.name][l];
const dm=(deg:number)=>{const total=Math.floor(deg*60+1e-9);return Math.floor(total/60)+'°'+String(total%60).padStart(2,'0')+'′';};
const cap=(text:string)=>text.charAt(0).toUpperCase()+text.slice(1);
/** "Planet in house: meaning." → the fact before the colon and the everyday meaning after it. */
const factOf=(text:string)=>text.slice(0,text.indexOf(': '))+'.';
const meaningOf=(text:string)=>cap(text.slice(text.indexOf(': ')+2));
const nakSlug=(n:number)=>NAKSHATRA_NAME[n-1].en.toLowerCase().replace(/\s+/g,'-');
const GOOD_HOUSES=new Set([1,4,5,7,9,10]),HARD_HOUSES=new Set([6,8,12]);
const SUN_HORA=new Set<Planet>(['Sun','Mars','Jupiter']),MOON_HORA=new Set<Planet>(['Moon','Venus','Saturn']);
const DIVISIONAL_LINK=(l:R10Locale):Reader10Link=>({label:l==='uk'?'Що таке дробові карти D2–D60':'What the divisional charts D2–D60 are',path:'astrology/divisional-charts'});
const GLOSSARY_LINK=(l:R10Locale):Reader10Link=>({label:l==='uk'?'Словник термінів':'Glossary of terms',path:'pedia/glossary'});

function dignityPhrase(p:PlanetFact,l:R10Locale):string{
 const uk=l==='uk';
 return p.dignity==='exalted'?(uk?', у знаку екзальтації':', exalted'):p.dignity==='own'?(uk?', у власному знаку':', in its own sign')
  :p.dignity==='debilitated'?(uk?', у знаку падіння':', debilitated'):'';
}
const weakNote=(p:PlanetFact,l:R10Locale)=>p.dignity!=='debilitated'?'':l==='uk'
 ?' '+P(p,l)+' при цьому у знаку падіння й діє впівсили.':' '+P(p,l)+' is debilitated here and acts at half strength.';

/** One inner tension chosen by a fixed priority, so the same chart always reads the same. */
function tension(f:Reader10Facts,l:R10Locale):{plain:string;astro:string}|null{
 const uk=l==='uk',near=(n:Planet)=>f.withMoon.some(p=>p.name===n),sees=(n:Planet)=>f.aspectsOnMoon.some(p=>p.name===n);
 if(near('Saturn')||sees('Saturn'))return {plain:TENSION.saturn[l],astro:uk
  ?'Головну напругу карти дає Сатурн '+(near('Saturn')?'поруч із Місяцем':'в аспекті на Місяць')+': розум і почуття під тиском обов’язку.'
  :'The main tension of the chart is Saturn '+(near('Saturn')?'with':'aspecting')+' the Moon: mind and feelings under the pressure of duty.'};
 if(near('Rahu'))return {plain:TENSION.rahu[l],astro:uk?'Головну напругу карти дає Раху поруч із Місяцем.':'The main tension of the chart is Rahu with the Moon.'};
 if(near('Ketu'))return {plain:TENSION.ketu[l],astro:uk?'Головну напругу карти дає Кету поруч із Місяцем.':'The main tension of the chart is Ketu with the Moon.'};
 if(near('Mars')||sees('Mars'))return {plain:TENSION.mars[l],astro:uk
  ?'Головну напругу карти дає Марс '+(near('Mars')?'поруч із Місяцем.':'в аспекті на Місяць.')
  :'The main tension of the chart is Mars '+(near('Mars')?'with':'aspecting')+' the Moon.'};
 const h=f.lagnaLord.house;
 if(h===6||h===8||h===12)return {plain:TENSION[('hard'+h) as 'hard6'|'hard8'|'hard12'][l],
  astro:uk?'Управитель лагни '+houseIn(h,l)+', тобто в одному з трьох важких домів.':'The lagna lord is '+houseIn(h,l)+', one of the three difficult houses.'};
 return null;
}

function selfChapter(f:Reader10Facts,l:R10Locale):Reader10Chapter{
 const uk=l==='uk',lord=f.lagnaLord,moon=f.planets.Moon,focus=LAGNA_LORD_HOUSE[lord.house-1].focus[l];
 const strain=tension(f,l),support=f.yogakaraka||(f.strongest&&f.strongest.name!==lord.name?f.strongest:null);
 const paragraphs=[TEMPERAMENT[f.lagna.sign-1][l],LIFE_THEME[lord.house-1][l],
  FEELINGS[moon.sign-1][l]+(uk?' А ще ви маєте '+MOON_NAKSHATRA[moon.nakshatraNumber-1].uk+'.'
   :' You also have '+MOON_NAKSHATRA[moon.nakshatraNumber-1].en+'.')];
 const closing:string[]=[];
 if(support&&support.house!==lord.house)closing.push(uk?'Найбільше сил вам дає ось що: '+LAGNA_LORD_HOUSE[support.house-1].focus.uk+'.'
  :'What gives you the most strength: '+LAGNA_LORD_HOUSE[support.house-1].focus.en+'.');
 if(strain)closing.push(strain.plain);
 if(closing.length)paragraphs.push(closing.join(' '));

 const lagnaNak=NAKSHATRA_NAME[f.lagna.nakshatraNumber-1][l],moonNak=NAKSHATRA_NAME[moon.nakshatraNumber-1][l];
 const astro:string[]=[];
 astro.push((uk?'Лагна, тобто знак, що сходив на сході в мить народження: '+SIGN_NAME[f.lagna.sign-1].uk+', '+dm(f.lagna.degrees)+', накшатра '+lagnaNak+'. Вона описує вашу вдачу.'
  :'The lagna, the sign rising in the east at the moment of birth: '+SIGN_NAME[f.lagna.sign-1].en+', '+dm(f.lagna.degrees)+', nakshatra '+lagnaNak+'. It describes your temperament.')+
  [...f.inLagna.map(p=>' '+IN_LAGNA[p.name][l]),...f.aspectsOnLagna.filter(p=>ASPECT_ON_LAGNA[p.name]).map(p=>' '+ASPECT_ON_LAGNA[p.name]![l]+weakNote(p,l))].join(''));
 let lordText=uk?'Управитель лагни, '+P(lord,l)+', стоїть '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].uk+dignityPhrase(lord,l)+'. Саме його положення задає головну тему життя.'
  :'The lagna lord, '+P(lord,l)+', stands '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].en+dignityPhrase(lord,l)+'. Its placement sets the main theme of life.';
 const next=f.lagnaLordChain[1];
 if(next&&lord.dignity!=='own'){const disp=f.planets[next];
  lordText+=uk?' Знаком, де він стоїть, керує '+P(disp,l)+' '+houseFrom(disp.house,l)+', тож ця тема завжди пов’язана зі сферою «'+LAGNA_LORD_HOUSE[disp.house-1].focus.uk+'».'
   :' The sign it occupies is ruled by '+P(disp,l)+' '+houseFrom(disp.house,l)+', so this theme is always tied to “'+LAGNA_LORD_HOUSE[disp.house-1].focus.en+'”.';}
 astro.push(lordText);
 if(support)astro.push(f.yogakaraka
  ?(uk?'Йога-карака вашої лагни, найсприятливіша планета карти: '+P(support,l)+' '+houseIn(support.house,l)+dignityPhrase(support,l)+'.'
   :'The yogakaraka of your lagna, the most favourable planet of the chart: '+P(support,l)+' '+houseIn(support.house,l)+dignityPhrase(support,l)+'.')
  :(uk?'Найсильніша планета карти: '+P(support,l)+' '+houseIn(support.house,l)+dignityPhrase(support,l)+'.'
   :'The strongest planet of the chart: '+P(support,l)+' '+houseIn(support.house,l)+dignityPhrase(support,l)+'.'));
 const influences=[...f.withMoon.map(p=>WITH_MOON[p.name as Exclude<Planet,'Moon'>][l]),
  ...f.aspectsOnMoon.filter(p=>ASPECT_ON_MOON[p.name]).map(p=>ASPECT_ON_MOON[p.name]![l]+weakNote(p,l))];
 astro.push((uk?'Місяць, ваш розум і почуття: '+SIGN_NAME[moon.sign-1].uk+', '+dm(moon.degrees)+', '+houseIn(moon.house,l)+', накшатра '+moonNak+', пада '+moon.pada+'.'
  :'The Moon, your mind and feelings: '+SIGN_NAME[moon.sign-1].en+', '+dm(moon.degrees)+', '+houseIn(moon.house,l)+', nakshatra '+moonNak+', pada '+moon.pada+'.')+
  (influences.length?' '+influences.join(' '):''));
 if(strain)astro.push(strain.astro);
 const basis=(uk?'Основа: лагна ':'Basis: lagna ')+SIGN_NAME[f.lagna.sign-1][l]+' '+dm(f.lagna.degrees)+' ('+lagnaNak+'); '+
  P(lord,l)+(uk?' — управитель лагни, ':' — lagna lord, ')+SIGN_NAME[lord.sign-1][l]+' '+dm(lord.degrees)+', '+houseShort(lord.house,l)+'; '+
  (uk?'Місяць ':'Moon ')+SIGN_NAME[moon.sign-1][l]+', '+houseShort(moon.house,l)+', '+moonNak+'-'+moon.pada+'.';
 return {id:'self',title:uk?'Хто ви':'Who you are',
  lead:uk?'Головна тема вашого життя: '+focus+'.':'The main theme of your life: '+focus+'.',
  paragraphs,details:{paragraphs:astro,basis,links:[
   {label:uk?'Що таке лагна і чим вона відрізняється від знака Сонця':'What the lagna is and how it differs from your Sun sign',path:'pedia/sun-moon-rising-signs-compared'},
   {label:(uk?'Накшатра ':'Nakshatra ')+moonNak,path:'nakshatra/'+nakSlug(moon.nakshatraNumber)},
   GLOSSARY_LINK(l)]}};
}

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
const signDignity=(planet:Planet,sign:number,l:R10Locale)=>{
 const d=dignityOf(planet,sign),uk=l==='uk';
 return d==='exalted'?(uk?', у знаку екзальтації':', exalted'):d==='own'?(uk?', у власному знаку':', in its own sign')
  :d==='debilitated'?(uk?', у знаку падіння':', debilitated'):'';
};
const TIER_WORD={strong:{uk:'сильне положення',en:'a strong placement'},mixed:{uk:'середнє положення',en:'a middling placement'},
 hard:{uk:'слабке положення',en:'a weak placement'}} as const;
type Layered={plain:string;astro:string;basis:string};
function supportLine(f:Reader10Facts,vargas:Vargas|null,division:number,l:R10Locale):Layered|null{
 const rule=SUPPORT[division];if(!rule)return null;
 const planet:Planet=rule.planet==='lagnaLord'?f.lagnaLord.name:rule.planet,spot=vargaSpot(vargas,division,planet);
 if(!spot)return null;
 const tier=vargaTier(planet,spot),name=PLANET_NAME[planet][l];
 return {plain:cap(rule.tier[tier][l]),
  astro:VARGA_NAME[division][l]+', '+rule.topic[l]+': '+name+' '+SIGN_IN[spot.sign-1][l]+signDignity(planet,spot.sign,l)+', '+houseIn(spot.house,l)+' ('+TIER_WORD[tier][l]+').',
  basis:'D'+division+': '+name+', '+SIGN_NAME[spot.sign-1][l]+', '+houseShort(spot.house,l)};
}
function d60Line(f:Reader10Facts,chart:CalculatedChart,l:R10Locale):Layered|null{
 const uk=l==='uk',preview=buildD60Preview(chart,l);
 if(preview.status!=='conditional_signs')return null;
 const lord=f.lagnaLord.name,row=preview.allPlanets.find(p=>p.planet===lord);
 if(!row)return null;
 if(row.nearBoundary)return {plain:'',astro:VARGA_NAME[60][l]+(uk
   ?': управитель лагни стоїть надто близько до межі частки. Ця карта змінюється кожні дві хвилини, тому без часу народження, точного до хвилини, ми її не трактуємо.'
   :': the lagna lord stands too close to a division boundary. This chart changes every two minutes, so without a birth time exact to the minute we do not read it.'),
  basis:'D60: '+PLANET_NAME[lord][l]+(uk?' біля межі частки':' near a division boundary')};
 const d=dignityOf(lord,row.d60Sign),name=PLANET_NAME[lord][l];
 const plain=d==='exalted'||d==='own'
  ?(uk?'Якщо час вашого народження точний до хвилини, глибинна основа вашої долі міцна.':'If your birth time is exact to the minute, the deep foundation of your destiny is firm.')
  :d==='debilitated'
  ?(uk?'Якщо час вашого народження точний до хвилини, частину давніх боргів ви сплачуєте терпінням і роботою над собою.':'If your birth time is exact to the minute, you repay some old debts with patience and work on yourself.')
  :'';
 return {plain,astro:VARGA_NAME[60][l]+': '+name+' '+SIGN_IN[row.d60Sign-1][l]+signDignity(lord,row.d60Sign,l)+
   (uk?'. Найтонша з карт; висновок чинний лише за точного до хвилини часу народження.':'. The finest of the charts; this holds only for a birth time exact to the minute.'),
  basis:'D60: '+name+', '+SIGN_NAME[row.d60Sign-1][l]};
}

function areaChapter(f:Reader10Facts,rule:AreaRule,vargas:Vargas|null,chart:CalculatedChart,l:R10Locale,
 tiers:Partial<Record<AreaId,Tier>>):Reader10Chapter{
 const uk=l==='uk',H=rule.house,sign=((f.lagna.sign+H-2)%12)+1,lord=f.planets[signLord(sign)],lordName=P(lord,l);
 const all=PLANETS.map(name=>f.planets[name]);
 const occupants=all.filter(p=>p.house===H);
 const lookers=all.filter(p=>p.house!==H&&(p.name==='Mars'||p.name==='Jupiter'||p.name==='Saturn')&&aspectedHouses(p.name,p.house).includes(H));
 const plain:string[]=[],astro:string[]=[],basis:string[]=[];

 // At most two aspect remarks in plain text, most telling first: the lord guarding its house, Jupiter, Saturn, Mars.
 const rank=(p:PlanetFact)=>p.name===lord.name?0:p.name==='Jupiter'?1:p.name==='Saturn'?2:3;
 const scene=[...occupants.map(p=>meaningOf(rule.occupants[p.name][l])),
  ...[...lookers].sort((a,b)=>rank(a)-rank(b)).slice(0,2)
   .map(p=>(p.name===lord.name?ASPECT_PLAIN.own:ASPECT_PLAIN[p.name as 'Mars'|'Jupiter'|'Saturn'])[l])];
 if(scene.length)plain.push(scene.join(' '));
 plain.push(rule.lord[lord.house-1][l]+(lord.dignity==='exalted'||lord.dignity==='own'
  ?(uk?' І це справджується повною мірою.':' And this comes true in full.')
  :lord.dignity==='debilitated'?(uk?' Щоправда, результат приходить через зусилля й пізніше, ніж хотілося б.':' Results do come, though through effort and later than you would like.'):''));

 astro.push((uk?'Ваш '+ORD_NOM_UK[H-1]+' дім, що відповідає за цю сферу: '+SIGN_NAME[sign-1].uk+'.':'Your '+ORD_EN[H-1]+' house, which governs this area: '+SIGN_NAME[sign-1].en+'.')+
  (occupants.length?' '+occupants.map(p=>factOf(rule.occupants[p.name][l])).join(' '):(uk?' Планет у ньому немає, тому сферу описує управитель дому.':' It holds no planets, so the lord of the house describes this area.'))+
  lookers.map(p=>' '+(p.name===lord.name?(uk?P(p,l)+' дивиться на власний дім і зміцнює його.':P(p,l)+' aspects its own house and strengthens it.')
   :(uk?P(p,l)+' дивиться на цей дім.':P(p,l)+' aspects this house.'))).join(''));
 basis.push(houseShort(H,l)+' — '+SIGN_NAME[sign-1][l]+(occupants.length?' ('+occupants.map(p=>P(p,l)).join(', ')+')':''));
 if(lookers.length)basis.push((uk?'аспекти на дім: ':'aspects on the house: ')+lookers.map(p=>P(p,l)).join(', '));
 const yoga=YOGA_NOTE[rule.id]?.[lord.house];
 astro.push((uk?'Управитель дому, '+lordName+', стоїть '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].uk+dignityPhrase(lord,l)+'.'
  :'The lord of the house, '+lordName+', stands '+houseIn(lord.house,l)+', '+SIGN_IN[lord.sign-1].en+dignityPhrase(lord,l)+'.')+(yoga?' '+yoga[l]:''));
 basis.push(lordName+(uk?' — управитель, ':' — lord, ')+SIGN_NAME[lord.sign-1][l]+' '+dm(lord.degrees)+', '+houseShort(lord.house,l));

 let score=(lord.dignity==='exalted'?2:lord.dignity==='own'?1:lord.dignity==='debilitated'?-2:0)+
  (GOOD_HOUSES.has(lord.house)?1:HARD_HOUSES.has(lord.house)?-1:0)+
  (occupants.some(p=>p.name==='Jupiter')||lookers.some(p=>p.name==='Jupiter')?1:0)+
  (lookers.some(p=>p.name===lord.name)?1:0)-
  (occupants.some(p=>p.name==='Saturn'||p.name==='Rahu'||p.name==='Ketu')?1:0);
 const extraPlain:string[]=[];
 const spot=vargaSpot(vargas,rule.varga,lord.name);
 if(spot){
  const vName=VARGA_NAME[rule.varga][l];
  if(rule.varga===2){
   const sunHora=spot.sign===5,fits=lord.name==='Mercury'||(sunHora?SUN_HORA.has(lord.name):MOON_HORA.has(lord.name));
   extraPlain.push((sunHora?(uk?'Заробляєте ви власними силами й авторитетом':'You earn by your own strength and authority')
    :(uk?'Гроші приходять до вас через людей і родину':'Money comes to you through people and family'))+
    (fits?'.':(uk?', але заробити вам легше, ніж утримати.':', but earning is easier for you than keeping.')));
   astro.push(uk?'У карті '+vName+' '+lordName+' стоїть у хорі '+(sunHora?'Сонця':'Місяця')+(fits?', своїй для цієї планети.':', чужій для цієї планети.')
    :'In '+vName+' '+lordName+' is in the hora of the '+(sunHora?'Sun':'Moon')+(fits?', its own hora.':', the other hora for this planet.'));
   score+=fits?1:-1;
  }else{
   const d=dignityOf(lord.name,spot.sign),same=spot.sign===lord.sign;
   let line=uk?'У карті '+vName+', яка уточнює тему «'+rule.vargaTopic.uk+'», '+lordName+' стоїть '+SIGN_IN[spot.sign-1].uk+signDignity(lord.name,spot.sign,l)+', '+houseIn(spot.house,l)+' від її лагни.'
    :'In '+vName+', which refines the theme of “'+rule.vargaTopic.en+'”, '+lordName+' stands '+SIGN_IN[spot.sign-1].en+signDignity(lord.name,spot.sign,l)+', '+houseIn(spot.house,l)+' from its lagna.';
   if(same){line+=uk?' Це варготтама: той самий знак, що й в основній карті, тому планета діє стабільно й сильно.':' This is vargottama: the same sign as in the main chart, so the planet acts steadily and strongly.';score+=1;}
   if(d==='exalted'||d==='own')score+=1;
   if(d==='debilitated')score-=1;
   if(GOOD_HOUSES.has(spot.house))score+=1;
   if(HARD_HOUSES.has(spot.house))score-=1;
   astro.push(line);
  }
  basis.push('D'+rule.varga+': '+lordName+', '+SIGN_NAME[spot.sign-1][l]+', '+houseShort(spot.house,l));
 }
 const tier:Tier=score>=2?'strong':score<=-1?'hard':'mixed';
 tiers[rule.id]=tier;
 const extra=rule.support.map(v=>supportLine(f,vargas,v,l)).filter((x):x is Layered=>!!x);
 if(rule.id==='path'){const d60=d60Line(f,chart,l);if(d60)extra.push(d60);}
 extraPlain.push(...extra.map(x=>x.plain).filter(Boolean));
 if(extraPlain.length)plain.push(extraPlain.join(' '));
 if(extra.length){astro.push(extra.map(x=>x.astro).join(' '));basis.push(...extra.map(x=>x.basis));}
 return {id:rule.id,title:rule.title[l],lead:AREA_LEAD[rule.id][tier][l],paragraphs:plain,
  details:{paragraphs:astro,basis:(uk?'Основа: ':'Basis: ')+basis.join('; ')+'.',links:[DIVISIONAL_LINK(l),GLOSSARY_LINK(l)]}};
}

/** Closing synthesis in plain words: the main theme, what to lean on, what depends on you, what asks the most. */
function closingChapter(f:Reader10Facts,tiers:Partial<Record<AreaId,Tier>>,l:R10Locale):Reader10Chapter{
 const uk=l==='uk',focus=LAGNA_LORD_HOUSE[f.lagnaLord.house-1].focus[l];
 const pick=(tier:Tier)=>AREAS.filter(rule=>tiers[rule.id]===tier);
 const strong=pick('strong'),hard=pick('hard'),mixed=pick('mixed');
 const list=(rules:readonly AreaRule[])=>rules.map(rule=>rule.short[tiers[rule.id]!][l]).join('; ');
 const paragraphs:string[]=[];
 if(mixed.length)paragraphs.push((uk?'Що залежить від вас: ':'What depends on you: ')+list(mixed)+'.');
 if(hard.length)paragraphs.push((uk?'Де життя вимагає від вас найбільше: ':'Where life asks the most of you: ')+list(hard)+'.');
 paragraphs.push(uk?'І все це так чи інакше повертає до головної теми вашого життя: '+focus+'.':'And all of it comes back to the main theme of your life: '+focus+'.');
 const names=(rules:readonly AreaRule[])=>rules.map(rule=>rule.title[l].toLowerCase()).join(', ');
 const lead=strong.length
  ?(uk?'Спиратися ви можете на ці сфери: '+names(strong)+'.':'You can lean on these areas: '+names(strong)+'.')
  :(uk?'Явно сильних сфер карта не виділяє, тому все вирішує ваша праця.':'No area stands out as clearly strong, so your own work decides.');
 return {id:'summary',title:uk?'Підсумок':'Summary',lead,paragraphs,details:null};
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
 const chapters=[selfChapter(facts,lang),...areas,closingChapter(facts,tiers,lang)];
 if(lang!=='en')return {version:READER10_VERSION,language:lang,chapters};
 return {version:READER10_VERSION,language:lang,chapters:chapters.map(c=>({...c,lead:englishArticles(c.lead),
  paragraphs:c.paragraphs.map(englishArticles),
  details:c.details?{...c.details,paragraphs:c.details.paragraphs.map(englishArticles)}:null}))};
}
