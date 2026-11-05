/**
 * N4 complete-life interpretation blueprint: source facts, not automated destiny.
 * Validity remains gated by original JHora 8.0 mathematical certification.
 * All calculated D-charts are inspected; D60 is withheld from narration.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable} from './reader-classical.ts';
import {n4InternalServerSnapshot} from './n4-varga-contract.ts';

export const N4_FULL_SCOPE_VERSION='n4-full-scope-evidence-v1' as const;
const DOMAINS=Object.freeze([
 [2,2,'Jupiter','resources','Ресурси й кошти','Resources and wealth'],
 [3,3,'Mars','initiative','Сміливість та співпраця','Courage and cooperation'],
 [4,4,'Moon','home','Оселя та майно','Home and property'],
 [7,5,'Jupiter','mentoring','Діти, творчість та наставництво','Children and mentoring'],
 [9,7,'Venus','partnership','Стосунки й зрілість','Relationships and maturity'],
 [10,10,'Sun','career','Професія й покликання','Career and vocation'],
 [12,4,'Sun','parents','Батьки та родина','Parents and family'],
 [16,4,'Venus','comfort','Комфорт і транспорт','Comfort and transport'],
 [20,9,'Jupiter','practice','Духовна практика','Spiritual practice'],
 [24,5,'Mercury','learning','Освіта і майстерність','Learning and mastery'],
 [27,6,'Mars','resilience','Витривалість','Resilience'],
 [30,6,'Saturn','obstacles','Перешкоди й самокорекція','Obstacles and self-correction'],
 [40,4,'Moon','maternal','Материнська лінія','Maternal lineage'],
 [45,9,'Sun','paternal','Батьківська лінія','Paternal lineage'],
 [60,1,'Sun','fine','Тонкі кармічні теми','Fine karmic distinctions']
] as const);
export const N4_LIFE_DOMAINS=DOMAINS.map(([division,house,anchor,scope,uk,en])=>
 Object.freeze({division,house,anchor,scope,uk,en}));
export const N4_LIFE_SECTIONS=Object.freeze([
 {id:'foundation',charts:[1]},
 {id:'relationships',charts:[9,7]},
 {id:'career_skills',charts:[10,24,3]},
 {id:'resources_home',charts:[2,4,16]},
 {id:'family_lineage',charts:[12,40,45]},
 {id:'practice',charts:[20]},
 {id:'resilience',charts:[27,30]},
 {id:'timing_synthesis',charts:[]}
]);
export function buildN4LifeEvidence(chart:CalculatedChart,asOf:string){
 const stamp=Date.parse(asOf+'T12:00:00Z');
 if(!chart||chart.config?.ayanamsa!=='Lahiri'||chart.config?.houses!=='Whole sign'||
  !/^\d{4}-\d{2}-\d{2}$/.test(asOf)||!Number.isFinite(stamp))
  throw Error('N4 full reading requires intact Lahiri / whole-sign natal facts and date');
 const source=n4InternalServerSnapshot(chart),D1=source.charts.find(c=>c.division===1);
 if(source.charts.length!==16||!D1)throw Error('Complete N4 evidence needs all 16 derived charts');
 const rulerTable=classicalLordshipTable(chart.ascendant.sign);
 const byName=(xs:readonly {name:string;sign:number;house:number}[],name:string)=>{
  const found=xs.find(x=>x.name===name);
  if(!found)throw Error('N4 incomplete trusted chart: '+name);
  return found;
 };
 const scopes=N4_LIFE_DOMAINS.map(meta=>{
  const dn=source.charts.find(c=>c.division===meta.division);
  if(!dn)throw Error('N4 missing D'+meta.division);
  const domainLord=rulerTable[meta.house],dnLagnaLord=classicalLordshipTable(dn.lagnaSign)[1];
  const d1Lord=byName(D1.planets,domainLord),dnLord=byName(dn.planets,domainLord);
  const d1Anchor=byName(D1.planets,meta.anchor),dnAnchor=byName(dn.planets,meta.anchor);
  const dnAscLord=byName(dn.planets,dnLagnaLord);
  return Object.freeze({...meta,domainLord,sourceId:'N4.D'+meta.division+'.TOPICAL_LORD',
   d1Lord:Object.freeze({sign:d1Lord.sign,house:d1Lord.house,dignity:dignityFor(domainLord,d1Lord.sign)}),
   dnLord:Object.freeze({sign:dnLord.sign,house:dnLord.house,dignity:dignityFor(domainLord,dnLord.sign)}),
   dnLagna:dn.lagnaSign,dnLagnaLord,dnLagnaLordHouse:dnAscLord.house,
   d1Anchor:Object.freeze({sign:d1Anchor.sign,house:d1Anchor.house}),
   dnAnchor:Object.freeze({sign:dnAnchor.sign,house:dnAnchor.house}),
   lagnaBoundaryArcseconds:dn.lagnaBoundaryArcseconds,
   status:meta.division===60?'WITHHELD_JHORA_AND_BIRTH_TIME_PENDING':'INTERNAL_MATH_ONLY',
   rules:Object.freeze(['D1_LORDSHIP','DN_LAGNA','DN_LORDSHIP','SIGN_DIGNITY_ONLY']),
   authoritativePrediction:false});
 });
 const major=chart.dasha.find(x=>Date.parse(x.start)<=stamp&&stamp<Date.parse(x.end));
 const minor=major?.antardashas?.find(x=>Date.parse(x.start)<=stamp&&stamp<Date.parse(x.end));
 const yogas=ruleFindings(chart).yogas.map(x=>Object.freeze({name:x.name,planet:x.planet,house:x.house,sign:x.sign}));
 return Object.freeze({
  version:N4_FULL_SCOPE_VERSION,profile:source.profile,certification:source.certification,
  sourceCount:source.charts.length,availableDivisions:Object.freeze(source.charts.map(x=>x.division)),
  d1:Object.freeze({lagna:chart.ascendant.sign,
   grahas:Object.freeze(D1.planets.map(p=>Object.freeze({
    name:p.name,sign:p.sign,house:p.house,dignity:dignityFor(p.name,p.sign)}))),
   lordOfFirst:rulerTable[1],limitedYogas:Object.freeze(yogas)}),
  scopes:Object.freeze(scopes),
  dasha:Object.freeze({major:major?.lord||null,minor:minor?.lord||null,
   status:'NOT_INDEPENDENTLY_JHORA_DATE_CERTIFIED'}),
  missingMechanisms:Object.freeze(['FULL_SHADBALA','BHAVABALA','VIMSHOPAKA_BALA','ASHTAKAVARGA',
   'UNIMPLEMENTED_COMBUSTION_OR_YOGAS','ORIGINAL_JHORA_8_PARITY','BIRTH_TIME_STABILITY_D60'])
 });
}
export function buildN4CompletePrompt(chart:CalculatedChart,lang:'uk'|'en',asOf:string){
 const e=buildN4LifeEvidence(chart,asOf);
 if(lang!=='uk'&&lang!=='en')throw Error('N4 full report language unsupported');
 const system=[
  'You are a traditional Parashari Jyotish interpreter. Do NOT calculate or invent astrological positions. This is a symbolic tradition, not a scientifically established future prediction.',
  'Write ONE coherent, non-generic life interpretation in '+(lang==='uk'?'natural Ukrainian':'natural English')+
   ' with about 750-950 words and concise headings. Cover D1 foundation, relationships, career and study, resources and home, lineage, spiritual practice, difficulties, timing, summary.',
  'Integrate D1 with relevant topical charts. Refer to relevant house lords, Dn Lagna and the specific planets. Contrast support and tension only when justified by the supplied facts.',
  'Account for the whole available scope D2 D3 D4 D7 D9 D10 D12 D16 D20 D24 D27 D30 D40 D45: group them by life domain, but do not fabricate separate events for each.',
  'Give specific conditional situations, realistic opportunities and limitations, three grounded practical next actions, and a final individual synthesis rather than a list of slogans.',
  'sN means a SIGN, hN means a HOUSE counted from the relevant chart ascendant. Never confuse the two or transfer houses between D1 and Dn.',
  'D60 is withheld. Sign dignity is not Shadbala or global strength. Do not invent combustion, aspects, yogas, remedies, strengths, promises, dates or biographies not in the facts.',
  'Do not presume marriage, employment, children or illness in real life. Avoid guaranteed outcomes, investment prescriptions and medical diagnoses.',
  'Use only calculated periods if available and never invent exact event dates. Finish complete sentences. Return final report Markdown only.'
 ].join('\n');
 const graha=(p:{name:string;sign:number;house:number;dignity:string})=>p.name+':s'+p.sign+'/h'+p.house+
  (p.dignity==='other'||p.dignity==='unassigned'?'':'/'+p.dignity);
 const facts=e.scopes.filter(x=>x.status==='INTERNAL_MATH_ONLY').map(x=>
  'D'+x.division+' '+x.scope+' D1H'+x.house+'lord='+x.domainLord+
  ' D1lord:s'+x.d1Lord.sign+'/h'+x.d1Lord.house+'/'+x.d1Lord.dignity+
  ' DnLord:s'+x.dnLord.sign+'/h'+x.dnLord.house+'/'+x.dnLord.dignity+
  ' DnLagna:s'+x.dnLagna+' AscLord='+x.dnLagnaLord+'/h'+x.dnLagnaLordHouse+
  ' anchor='+x.anchor+' D1:s'+x.d1Anchor.sign+'/h'+x.d1Anchor.house+
  ' Dn:s'+x.dnAnchor.sign+'/h'+x.dnAnchor.house);
 const user=[
  'lang='+lang+'; vargaProfile='+e.profile+'; s=sign; h=house; house numbers 1-12 counted from each chart Lagna.',
  'D1 Lagna=s'+e.d1.lagna+' FirstLord='+e.d1.lordOfFirst+
   '; '+e.d1.grahas.map(graha).join(' '),
  'TOPICAL COMPUTED FACTS:',...facts,'D60=WITHHELD; do not mention D60-derived placements.',
  'Limited verified yogas ONLY: '+(e.d1.limitedYogas.map(y=>y.name+'('+y.planet+' D1h'+y.house+')').join('; ')||'none in validated subset'),
  'Mahadasha='+(e.dasha.major||'not verified')+' Antardasha='+(e.dasha.minor||'not verified')+'; precision of dates NOT independently certified.',
  'Separate domain syntheses: '+N4_LIFE_SECTIONS.map(g=>g.id+'('+g.charts.map(n=>'D'+n).join(',')+')').join('; ')
 ].join('\n');
 if(system.length+user.length>8500)throw Error('N4 complete-life prompt static preflight size exceeded');
 return Object.freeze({version:N4_FULL_SCOPE_VERSION,system,user,
  promptChars:system.length+user.length,availableCharts:16,eligibleExtraCharts:14,
  withheldDivisions:Object.freeze([60]),source:e});
}
