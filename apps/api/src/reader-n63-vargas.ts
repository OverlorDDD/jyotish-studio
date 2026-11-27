/** N6.3.1: deterministic thematic selection over the complete verified Shodashavarga.
 * Rankings are editorial relevance, not Shadbala, independent confirmations or predictions.
 * D2 is Sun/Moon Hora, not ordinary zodiac-house dignity. D60 is conditional signs only. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';
import {buildReader10Facts,dignityOf,signLord,PLANETS,type Planet,type Dignity} from './reader10-facts.ts';
import {PLANET_NAME,SIGN_NAME} from './reader10-texts.ts';
type Lang='uk'|'en';
type Area='money'|'work'|'love'|'home'|'path';
type Evidence={id:string;text:string};
type Spec={area:Area;house:number;natural:Planet;focus:number};
const SPECS:Readonly<Record<number,Spec>>={
 2:{area:'money',house:2,natural:'Jupiter',focus:2},
 3:{area:'path',house:3,natural:'Mars',focus:3},
 4:{area:'home',house:4,natural:'Venus',focus:4},
 7:{area:'love',house:5,natural:'Jupiter',focus:5},
 9:{area:'love',house:7,natural:'Venus',focus:7},
 10:{area:'work',house:10,natural:'Sun',focus:10},
 12:{area:'home',house:4,natural:'Sun',focus:4},
 16:{area:'money',house:4,natural:'Venus',focus:4},
 20:{area:'path',house:9,natural:'Jupiter',focus:9},
 24:{area:'work',house:5,natural:'Mercury',focus:5},
 27:{area:'path',house:1,natural:'Mars',focus:1},
 30:{area:'path',house:6,natural:'Saturn',focus:6},
 40:{area:'home',house:4,natural:'Moon',focus:4},
 45:{area:'home',house:9,natural:'Sun',focus:9}
};
const DIGNITY:Record<Dignity,[string,string]>={own:['власний знак','own sign'],exalted:['екзальтація','exalted'],debilitated:['падіння','debilitated'],neutral:['без особливої знакової гідності','no special sign dignity']};
type Selected={planet:Planet;sign:number;house:number;dignity:Dignity;sameSign:boolean;boundarySensitive:boolean};
export type VargaFinding={division:number;area:Area;examined:number;selected:Selected[];text:string};
export type VargaIntelligence={findings:VargaFinding[];byArea:Partial<Record<Area,Evidence[]>>;patterns:Evidence[];timing:Evidence[];d60:Evidence|null;d60Examined:number};
export function buildVargaIntelligence(chart:CalculatedChart,lang:Lang,allowD60:boolean,asOf?:string):VargaIntelligence|null{
 const source=verifiedVargaSource(chart);if(!source)return null;
 const uk=lang==='uk',l=uk?0:1,f=buildReader10Facts(chart);
 const name=(n:Planet)=>PLANET_NAME[n][lang],sign=(n:number)=>SIGN_NAME[n-1][lang];
 const lord=(h:number)=>signLord((f.lagna.sign+h-2)%12+1);
 const strong=(d:Dignity)=>d==='own'||d==='exalted';
 const findings:VargaFinding[]=[],byArea:VargaIntelligence['byArea']={};
 for(const c of source.charts){
  const spec=SPECS[c.division];if(!spec)continue;
  const primary=lord(spec.house),vLord=signLord((c.lagnaSign+spec.focus-2)%12+1);
  const candidates=c.planets.map(p=>{
   const planet=p.name as Planet,d1=f.planets[planet],dignity=c.division===2?'neutral':dignityOf(planet,p.sign);
   const sameSign=c.division!==2&&d1.sign===p.sign;
   const contrast=c.division!==2&&(strong(d1.dignity)&&dignity==='debilitated'||d1.dignity==='debilitated'&&strong(dignity));
   // All nine considered; relevance from natal topic, significator, divisional topic and contrast.
   // Nodes may contribute occupancy; they never receive invented dignity or lordship.
   const score=(planet===primary?12:0)+(planet===spec.natural?7:0)+(c.division!==2&&planet===vLord?5:0)
    +(c.division!==2&&p.house===spec.focus?4:0)+(contrast?3:0)+(sameSign?2:0)
    +(c.division!==2&&strong(dignity)?1:0);
   return {planet,sign:p.sign,house:p.house,dignity,sameSign,boundarySensitive:p.boundaryDistanceArcseconds<=1,score};
  }).sort((a,b)=>b.score-a.score||PLANETS.indexOf(a.planet)-PLANETS.indexOf(b.planet));
  const selected=candidates.slice(0,2).map(({score,...p})=>p);
  const text='D'+c.division+': '+selected.map(p=>{
   const natal=f.planets[p.planet];
   const role=p.planet===primary?(uk?' (натальний управитель тематичного дому)':' (natal topic ruler)'):'';
   if(c.division===2)return name(p.planet)+role+' — '+(p.sign===5?(uk?'хора Сонця':'Sun Hora'):(uk?'хора Місяця':'Moon Hora'));
   return name(p.planet)+role+' — D1 '+sign(natal.sign)+'/'+(uk?'дім ':'H')+natal.house+'; D'+c.division+' '+sign(p.sign)+'/'+(uk?'дім ':'H')+p.house+
    (p.dignity!=='neutral'?', '+DIGNITY[p.dignity][l]:'')+
    (p.sameSign?(uk?', збіг знака з D1':', same sign as D1'):'')+
    (strong(natal.dignity)&&p.dignity==='debilitated'||natal.dignity==='debilitated'&&strong(p.dignity)?(uk?', контраст знакової гідності з D1':', dignity contrast with D1'):'')+
    (p.boundarySensitive?(uk?', чутливе до межі частки':', division-boundary sensitive'):'');
  }).join(' | ')+(c.division===2?(uk?'. Хора: не трактувати звичайні доми чи знакову гідність.':'. Hora: do not apply ordinary house or sign dignity.') :'.');
  findings.push({division:c.division,area:spec.area,examined:candidates.length,selected,text});
  (byArea[spec.area]??=[]).push({id:spec.area+'.v'+c.division,text});
 }
 const patterns:Evidence[]=[];
 // Compare every planet across every ordinary varga, not just the favorable ones.
 const ranked=PLANETS.filter(n=>n!=='Rahu'&&n!=='Ketu').map(n=>{
  const natal=f.planets[n];
  const relevant=source.charts.filter(c=>c.division!==1&&c.division!==2).map(c=>({division:c.division,p:c.planets.find(p=>p.name===n)!}));
  const repeats=relevant.filter(x=>x.p.sign===natal.sign&&x.p.boundaryDistanceArcseconds>1).map(x=>x.division);
  const up=relevant.filter(x=>strong(dignityOf(n,x.p.sign))&&x.p.boundaryDistanceArcseconds>1).map(x=>x.division);
  const down=relevant.filter(x=>dignityOf(n,x.p.sign)==='debilitated'&&x.p.boundaryDistanceArcseconds>1).map(x=>x.division);
  const role=(n===f.lagnaLord.name?4:0)+(n===lord(7)||n===lord(10)?3:0);
  return {n,repeats,up,down,score:role+(up.length&&down.length?4:0)+Math.min(3,repeats.length)};
 }).filter(x=>x.repeats.length>=2||x.up.length&&x.down.length).sort((a,b)=>b.score-a.score||PLANETS.indexOf(a.n)-PLANETS.indexOf(b.n));
 const fmt=(xs:number[])=>xs.map(x=>'D'+x).join('/');
 for(const x of ranked.slice(0,2)){
  patterns.push({id:'shared.vargaPattern'+x.n,text:name(x.n)+': '+(x.repeats.length>=2?(uk?'збіг знака D1 у ':'D1 sign repeated in ')+fmt(x.repeats)+'. ':'')+
   (x.up.length&&x.down.length?(uk?'Власний знак або екзальтація: ':'Own sign or exaltation: ')+fmt(x.up)+(uk?'; падіння: ': '; debilitation: ')+fmt(x.down)+'. ':'')+
   (uk?'Пов’язані тематичні показники, не незалежні докази подій.':'Related thematic factors, not independent outcome evidence.')});
 }
 const timing:Evidence[]=[];
 const at=asOf&&/^\d{4}-\d{2}-\d{2}$/.test(asOf)?Date.parse(asOf+'T12:00:00Z'):NaN;
 const major=chart.dasha.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end));
 const minor=major?.antardashas?.find(p=>Date.parse(p.start)<=at&&at<Date.parse(p.end));
 if(major&&minor&&PLANETS.includes(major.lord as Planet)&&PLANETS.includes(minor.lord as Planet)){
  const rulers=[...new Set([major.lord,minor.lord])] as Planet[];
  const relevant=[9,10,...findings.filter(x=>x.division!==2&&x.division!==9&&x.division!==10&&rulers.includes(lord(SPECS[x.division].house))).map(x=>x.division)].slice(0,4);
  for(const d of relevant){
   const c=source.charts.find(x=>x.division===d)!;
   timing.push({id:'timing.v'+d,text:'D'+d+' '+(uk?'управителі поточних періодів':'current period rulers')+': '+rulers.map(n=>{
    const p=c.planets.find(x=>x.name===n)!,q=dignityOf(n,p.sign);
    return name(n)+' '+sign(p.sign)+'/'+(uk?'дім ':'H')+p.house+(q!=='neutral'?', '+DIGNITY[q][l]:'')+(p.boundaryDistanceArcseconds<=1?(uk?', біля межі частки':', near division boundary'):'');
   }).join('; ')+'.'});
  }
 }
 let d60:Evidence|null=null,d60Examined=0;
 if(allowD60){
  const preview=buildD60Preview(chart,lang);
  if(preview.status==='conditional_signs'){
   d60Examined=preview.allPlanets.length;
   const order=[f.lagnaLord.name,lord(10),lord(7),'Moon','Sun','Jupiter','Venus','Saturn','Mercury','Mars','Rahu','Ketu'];
   const eligible=preview.allPlanets.filter(p=>!p.nearBoundary).sort((a,b)=>order.indexOf(a.planet)-order.indexOf(b.planet)).slice(0,3);
   if(eligible.length)d60={id:'path.v60',text:'D60: '+eligible.map(p=>p.label+' '+p.d1SignName+' (D1) → '+p.d60SignName+' (D60)').join('; ')+
    (uk?'. Лише умовні знаки, без домів, лагни, кармічних прогнозів чи сертифікації часу.':'. Conditional signs only; no houses, ascendant, karmic predictions or birth-time certification.')};
  }
 }
 return {findings,byArea,patterns,timing,d60,d60Examined};
}
