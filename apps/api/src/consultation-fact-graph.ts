import type {CalculatedChart,Graha} from '../../../packages/jyotish-core/src/index.ts';
import {CLASSICAL_GRAHAS,CLASSICAL_RULERS,RULESET_VERSION,dignityFor,ruleFindings,ruleFingerprint,validateRuleInput} from '../../../packages/jyotish-core/src/rules.ts';

/**
 * A8.9 foundation: lossless, machine-checkable chart evidence.
 * This is NOT a classical interpretation or an approval of OCR-derived rules.
 * No birth input, name, place, timezone, or absolute birth timestamp is serialized.
 */
export const FACT_GRAPH_VERSION='a8.9-facts-v1' as const;
export type FactNode={
 id:string;kind:'ascendant'|'placement'|'house-lord'|'dispositor'|'aspect'|'yoga'|'period';
 subject:string;scope:'D1'|'D9'|'D10'|'vimshottari';
 value:Record<string,string|number|boolean>;
 derivedFrom:string[];ruleId:string;ruleVersion:string;
};
export type ChartFactGraph={
 version:typeof FACT_GRAPH_VERSION;fingerprint:string;asOf:string;
 calculation:{ephemeris:string;ayanamsa:string;houses:string;nodes:string;rulesVersion:string};
 nodes:FactNode[];
};
const inHouse=(sign:number,lagna:number)=>((sign-lagna+12)%12)+1;
const exactDate=(date:string)=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)
  throw new Error('Invalid asOf');
 return Date.parse(date+'T12:00:00Z');
};
const placement=(p:Graha,scope:'D1'|'D9'|'D10'):FactNode=>({
 id:scope+'.'+p.name,kind:'placement',subject:p.name,scope,
 value:{sign:p.sign,house:p.house,longitude:p.longitude,degreesInSign:p.degreesInSign,
  retrograde:p.retrograde,...(scope==='D1'?{nakshatra:p.nakshatra,pada:p.pada}:{} )},
 derivedFrom:[scope+'.ascendant', 'ephemeris:'+scope+'.'+p.name],
 ruleId:scope==='D1'?'SIDEREAL_WHOLE_SIGN':'DIVISIONAL_CHART_'+scope,
 ruleVersion:RULESET_VERSION
});
export function buildChartFactGraph(chart:CalculatedChart,asOf:string):ChartFactGraph{
 const instant=exactDate(asOf);
 validateRuleInput(chart);
 for(const scope of ['D9','D10'] as const){
  const lagna=scope==='D9'?chart.lagnaD9:chart.lagnaD10;
  const positions=scope==='D9'?chart.d9:chart.d10;
  if(positions.length!==9||new Set(positions.map(p=>p.name)).size!==9)throw Error(scope+' graha count');
  for(const p of positions){
   if(!Number.isFinite(p.longitude)||p.sign<1||p.sign>12||
       Math.floor(p.longitude/30)+1!==p.sign||
       inHouse(p.sign,lagna.sign)!==p.house)throw Error(scope+' inconsistent '+p.name);
  }
 }
 const nodes:FactNode[]=[];
 const lagnas=[['D1',chart.ascendant],['D9',chart.lagnaD9],['D10',chart.lagnaD10]] as const;
 for(const [scope,asc] of lagnas){
  nodes.push({id:scope+'.ascendant',kind:'ascendant',subject:'Ascendant',scope,
   value:{sign:asc.sign,longitude:asc.longitude},derivedFrom:['ephemeris:'+scope+'.ascendant'],
   ruleId:scope==='D1'?'SIDEREAL_ASCENDANT':'DIVISIONAL_ASCENDANT_'+scope,ruleVersion:RULESET_VERSION});
  for(const p of chart[scope.toLowerCase() as 'd1'|'d9'|'d10'])nodes.push(placement(p,scope));
 }
 const placements=new Map(chart.d1.map(p=>[p.name,p]));
 for(let house=1;house<=12;house++){
  const sign=((chart.ascendant.sign+house-2)%12)+1;
  const ruler=CLASSICAL_RULERS[sign-1],p=placements.get(ruler)!;
  nodes.push({id:'D1.house-lord.'+house,kind:'house-lord',scope:'D1',subject:ruler,
   value:{house,sign,ruler,locatedHouse:p.house,locatedSign:p.sign},
   derivedFrom:['D1.ascendant','D1.'+ruler],ruleId:'PARASHARI_SIGN_LORDSHIP',ruleVersion:RULESET_VERSION});
 }
 for(const p of chart.d1){
  const ruler=CLASSICAL_RULERS[p.sign-1];
  nodes.push({id:'D1.dispositor.'+p.name,kind:'dispositor',scope:'D1',subject:p.name,
   value:{planet:p.name,dispositor:ruler,sign:p.sign},
   derivedFrom:['D1.'+p.name,'D1.'+ruler],
   ruleId:'CLASSICAL_SIGN_DISPOSITOR',ruleVersion:RULESET_VERSION});
 }
 const offsets:Record<string,number[]>={Sun:[7],Moon:[7],Mars:[4,7,8],Mercury:[7],
  Jupiter:[5,7,9],Venus:[7],Saturn:[3,7,10]};
 for(const p of chart.d1){
  for(const offset of offsets[p.name]||[]){
   const house=((p.house+offset-2)%12)+1;
   const recipients=chart.d1.filter(q=>q.house===house&&q.name!==p.name).map(q=>q.name).sort();
   nodes.push({id:'D1.aspect.'+p.name+'.'+offset,kind:'aspect',scope:'D1',subject:p.name,
    value:{offset,targetHouse:house,targetSign:((chart.ascendant.sign+house-2)%12)+1,
     occupants:recipients.join(',')},
    derivedFrom:['D1.'+p.name,...recipients.map(n=>'D1.'+n),'D1.ascendant'],
    ruleId:'PARASHARI_SIGN_DRISHTI',ruleVersion:RULESET_VERSION});
  }
 }
 for(const yoga of ruleFindings(chart).yogas)nodes.push({
  id:'D1.'+yoga.id,kind:'yoga',scope:'D1',subject:yoga.planet,
  value:{name:yoga.name,house:yoga.house,sign:yoga.sign,reason:yoga.reason},
  derivedFrom:['D1.'+yoga.planet,'D1.ascendant'],
  ruleId:'PANCHA_MAHAPURUSHA_LAGNA',ruleVersion:RULESET_VERSION
 });
 const major=chart.dasha.find(d=>Date.parse(d.start)<=instant&&instant<Date.parse(d.end));
 const minor=major?.antardashas?.find(d=>Date.parse(d.start)<=instant&&instant<Date.parse(d.end));
 if(major)nodes.push({id:'vimshottari.major',kind:'period',scope:'vimshottari',subject:major.lord,
  value:{lord:major.lord,start:major.start,end:major.end},derivedFrom:['D1.Moon'],
  ruleId:'VIMSHOTTARI_MAHADASHA',ruleVersion:RULESET_VERSION});
 if(minor)nodes.push({id:'vimshottari.minor',kind:'period',scope:'vimshottari',subject:minor.lord,
  value:{lord:minor.lord,start:minor.start,end:minor.end},derivedFrom:['vimshottari.major'],
  ruleId:'VIMSHOTTARI_ANTARDASHA',ruleVersion:RULESET_VERSION});
 const ids=new Set(nodes.map(n=>n.id));
 if(ids.size!==nodes.length||nodes.some(n=>n.derivedFrom.some(x=>!ids.has(x)&&!x.startsWith('ephemeris:'))))
  throw Error('Fact graph integrity violation');
 return {version:FACT_GRAPH_VERSION,fingerprint:ruleFingerprint(chart,asOf),asOf,
  calculation:{ephemeris:chart.ephemeris,ayanamsa:chart.config.ayanamsa,
   houses:chart.config.houses,nodes:chart.config.nodes,rulesVersion:RULESET_VERSION},
  nodes:nodes.sort((a,b)=>a.id.localeCompare(b.id,'en'))};
}
export function requireGraphFacts(graph:ChartFactGraph,ids:readonly string[]):FactNode[]{
 const index=new Map(graph.nodes.map(node=>[node.id,node]));
 return ids.map(id=>{const node=index.get(id);if(!node)throw Error('Unsupported chart fact: '+id);return node;});
}
