import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {CLASSICAL_GRAHAS,CLASSICAL_RULERS,dignityFor,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';

/** A8 bibliographic method ledger. A bibliographic reference is NOT a verified verse citation. */
export const CLASSICAL_METHOD_SOURCES=[
 {id:'LAGHU-PARASHARI-JHA-1900',work:'Laghu Parashari',edition:'Sitaram Jha (1900)',
  uri:'https://github.com/maximally0/jyotisha-corpus',status:'bibliography_review_only'},
 {id:'BRIHAT-JATAKA-IYER-1885',work:'Brihat Jataka',edition:'N. Chidambaram Iyer (1885)',
  uri:'https://wellcomecollection.org/works/afmgm695',status:'historical_public_domain_edition'},
 {id:'RULESET-D1-2.0.0',work:'Galaxiora deterministic Parashari whole-sign rules',
  edition:'packages/jyotish-core/src/rules.ts',uri:'',status:'machine_verified_chart_calculation'}
] as const;

export type FunctionalD1Ruler={graha:string;houses:number[];locatedHouse:number;locatedSign:number;
 dignity:string;roles:string[];evidence:string[];sourceIds:ReadonlyArray<string>};
export type ReaderClassicalContext={ascendant:number;lords:Record<number,string>;
 functional:FunctionalD1Ruler[];yogakarakas:string[];evidence:string[];
 dasha:{major:string;minor:string|null;majorHouses:number[];minorHouses:number[]}|null};

/** Exact sign-to-ruler arithmetic, no inferred birth facts from the LLM. */
export function classicalLordshipTable(ascendantSign:number):Record<number,string>{
 if(!Number.isInteger(ascendantSign)||ascendantSign<1||ascendantSign>12)
  throw new Error('Invalid ascendant sign');
 return Object.fromEntries(Array.from({length:12},(_,i)=>{
  const sign=((ascendantSign+i-1)%12)+1;
  return [i+1,CLASSICAL_RULERS[sign-1]];
 })) as Record<number,string>;
}
export function yogakarakasForLagna(ascendantSign:number):string[]{
 const lords=classicalLordshipTable(ascendantSign);
 // Parashari kendra + trikona union: angular 4/7/10 and trinal 5/9.
 // The lagna house (1) alone cannot make a planet a special yogakaraka.
 return CLASSICAL_GRAHAS.filter(graha=>
  [4,7,10].some(h=>lords[h]===graha)&&[5,9].some(h=>lords[h]===graha));
}
export function readerClassicalContext(chart:CalculatedChart,asOf:string):ReaderClassicalContext{
 const rules=ruleFindings(chart);
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const grouped=new Map<string,number[]>();
 for(let i=1;i<=12;i++)grouped.set(lords[i],[...(grouped.get(lords[i])||[]),i]);
 const yogakarakas=yogakarakasForLagna(chart.ascendant.sign);
 const functional=[...grouped].map(([graha,houses])=>{
  const position=chart.d1.find(p=>p.name===graha)!;
  const roles=[
   ...(yogakarakas.includes(graha)?['yogakaraka']:[]),
   ...([5,9].some(h=>houses.includes(h))?['trikona_lord']:[]),
   ...([4,7,10].some(h=>houses.includes(h))?['kendra_lord']:[]),
   ...([6,8,12].some(h=>houses.includes(h))?['dusthana_lord']:[])
  ];
  return {graha,houses,locatedHouse:position.house,locatedSign:position.sign,
   dignity:dignityFor(graha,position.sign),roles,
   evidence:[...houses.map(h=>'house-lord:'+h+'='+graha),'D1.'+graha+'.house='+position.house,
    'D1.'+graha+'.sign='+position.sign],
   sourceIds:['RULESET-D1-2.0.0','LAGHU-PARASHARI-JHA-1900']
  };
 });
 const at=Date.parse(asOf+'T12:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||!Number.isFinite(at))throw Error('Invalid asOf');
 const major=chart.dasha.find(d=>Date.parse(d.start)<=at&&at<Date.parse(d.end));
 const minor=major?.antardashas?.find(d=>Date.parse(d.start)<=at&&at<Date.parse(d.end));
 const group=(name:string)=>grouped.get(name)||[];
 return {ascendant:chart.ascendant.sign,lords,functional,yogakarakas,evidence:rules.lords.flatMap(l=>l.evidence),
  dasha:major?{major:major.lord,minor:minor?.lord||null,
   majorHouses:group(major.lord),minorHouses:minor?group(minor.lord):[]}:null};
}

/** 4th, 7th, 10th and "family/home" aliases for suspicious LLM lord claims.
 * A pass is a MECHANICAL subset, not a human expert's content certification. */
const LEXICON:Record<string,string>={
 'сонце':'Sun','сонця':'Sun','місяць':'Moon','місяця':'Moon',
 'марс':'Mars','марса':'Mars','меркурій':'Mercury','меркурія':'Mercury',
 'юпітер':'Jupiter','юпітера':'Jupiter','венера':'Venus','венери':'Venus',
 'сатурн':'Saturn','сатурна':'Saturn',
 sun:'Sun',moon:'Moon',mars:'Mars',mercury:'Mercury',jupiter:'Jupiter',venus:'Venus',saturn:'Saturn'
};
const planets='(?:Сонце|Сонця|Місяць|Місяця|Марс|Марса|Меркурій|Меркурія|Юпітер|Юпітера|Венера|Венери|Сатурн|Сатурна|Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)';
const familyAlias='(?:сімейного|родинного|домашнього|батьківського|дом[ау]|home|family|fourth)';
function extractedPlanet(x:string|undefined){return x?LEXICON[x.toLowerCase()]||null:null;}
function houseNumber(x:string|undefined):number|null{
 if(!x)return null;
 const v=x.toLowerCase();
 if(/сімей|родин|домаш|батьків|family|home|fourth/.test(v))return 4;
 if(/партнер|шлюб|partnership|marriage|seventh/.test(v))return 7;
 if(/профес|кар.?єр|career|profession|tenth/.test(v))return 10;
 const number=/(?:^|[^0-9])(1[0-2]|[1-9])(?:-?(?:го|му|й|ий|th|st|nd|rd))?/u.exec(v);
 return number?Number(number[1]):null;
}

/** Strictly test detected explicit ruler claims. Unrecognized idioms are NOT proof. */
export function checkNarrativeLordClaims(text:string,lords:Record<number,string>){
 // Ruler of the [number/home/etc] house = Planet, both English and Ukrainian.
 const place='(?:1[0-2]|[1-9])(?:-?(?:го|му|й|ий|th|st|nd|rd))?|'+familyAlias+
 '|(?:партнерства|шлюбу|професії|кар’єри|career|partnership|seventh|tenth)';
 const patterns=[
  new RegExp('(?:управител[ьяем]*|володар[ьяем]*|ruler|lord)\\s+(?:(?:of|the|на)\\s+)*(' +
   place + ')\\s*(?:[-–]?го|[-–]?му|[-–]?й)?\\s*(?:(?:дому|домі|дім|house))?[\\s,.:—-]{0,15}('+planets+')','giu'),
  new RegExp('(?:управител[ьяем]*|володар[ьяем]*|ruler|lord)\\s+(?:(?:of|the|на)\\s+)*(?:дому|house)\\s*('+
   place + ')[\\s,.:—-]{0,15}('+planets+')','giu'),
  new RegExp('('+planets+')\\s*(?:—|–|-|є|is|as)\\s*(?:управител[ьяем]*|володар[ьяем]*|ruler|lord)\\s+(?:(?:of|the)\\s+)?(?:дому|house)?\\s*('+
   place + ')','giu')
 ];
 const errors:string[]=[];
 for(let i=0;i<patterns.length;i++)for(const m of text.matchAll(patterns[i])){
  const graha=extractedPlanet(m[i===2?1:2]);
  const house=houseNumber(m[i===2?2:1]);
  if(house&&graha&&lords[house]!==graha)
   errors.push('house_lord_mismatch:'+house+':'+graha+':expected_'+lords[house]);
 }
 // More common Ukrainian: "управитель сімейного дому, Сатурн" (explicit bad real-world report).
 const family=new RegExp('(?:управител[ьяем]*|володар[ьяем]*|ruler|lord)\\s+(?:' +familyAlias+
  ')\\s*(?:дому|house)?[,\\s:—–-]{1,15}('+planets+')','giu');
 for(const m of text.matchAll(family)){
  const g=extractedPlanet(m[1]);
  if(g&&g!==lords[4])errors.push('house_lord_mismatch:4:'+g+':expected_'+lords[4]);
 }
 return {ok:errors.length===0,errors:[...new Set(errors)]};
}
