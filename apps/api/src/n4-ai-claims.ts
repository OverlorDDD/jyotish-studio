/**
 * Strict, intentionally LIMITED verifier of explicit numeric N4 placements.
 * This catches grounded direct assertions, not every free-form astrological
 * claim. It cannot be counted as semantic certification.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {n4InternalServerSnapshot} from './n4-varga-contract.ts';
const planets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'] as const;
const ukrainian:Record<string,string>={
 'Сонце':'Sun','Місяць':'Moon','Марс':'Mars','Меркурій':'Mercury',
 'Юпітер':'Jupiter','Венера':'Venus','Сатурн':'Saturn','Раху':'Rahu','Кету':'Ketu'
};
const escape=(s:string)=>s.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');
const n=[...planets,...Object.keys(ukrainian)].map(escape).join('|'); // static known-planet alternation
const heads=new RegExp('\\bD\\s*(\\d{1,2})\\b\\s*[,;:–—-]?\\s*('+n+')(?=\\s|[.,;:]|$)\\s*(?:is\\s+|sits\\s+|stands\\s+|occupies\\s+|lies\\s+|falls\\s+|appears\\s+|перебуває\\s+|стоїть\\s+|у\\s+|в\\s+|in\\s+|at\\s+|the\\s+){0,6}(?:house|H|дім|домі|дому)\\s*=?\\s*(\\d{1,2})\\b','giu');
const feet=new RegExp('\\bD\\s*(\\d{1,2})\\b\\s*[,;:–—-]?\\s*('+n+')(?=\\s|[.,;:]|$)\\s*(?:is\\s+|sits\\s+|stands\\s+|occupies\\s+|перебуває\\s+|стоїть\\s+|у\\s+|в\\s+|in\\s+|at\\s+|the\\s+){0,6}(\\d{1,2})(?:st|nd|rd|th|-му|-м)?\\s*(?:house|домі|дому|дім)(?=\\W|$)','giu');
const numeric=new RegExp('\\bD\\s*(\\d{1,2})\\b\\s*[,;:–—-]?\\s*('+n+')(?=\\s|[.,;:]|$)\\s*(?:has\\s+)?(?:sign|знак)\\s*=?\\s*(\\d{1,2})\\b','giu');
const supported=new Set([1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]);
export type N4ClaimAudit=Readonly<{claims:readonly string[];errors:readonly string[];correct:number}>;
export function auditN4ExplicitClaims(text:string,chart:CalculatedChart):N4ClaimAudit{
 const actual=n4InternalServerSnapshot(chart).charts;
 const claims:string[]=[],errors:string[]=[];
 const known=(name:string)=>ukrainian[name]||planets.find(n=>n.toLowerCase()===name.toLowerCase());
 const read=(pattern:RegExp,field:'house'|'sign')=>{
  pattern.lastIndex=0;
  for(const m of text.matchAll(pattern)){
   const division=Number(m[1]),graha=known(m[2]),value=Number(m[3]);
   if(!graha||!Number.isInteger(division)||!Number.isInteger(value)||!supported.has(division))continue;
   const expected=actual.find(c=>c.division===division)?.planets.find(p=>p.name===graha)?.[field];
   const label='D'+division+' '+graha+' '+field;
   claims.push(label+'='+value);
   if(expected!==value)errors.push(label+' mismatched'); // never log private coordinates/real expected values
  }
 };
 read(heads,'house');read(feet,'house');read(numeric,'sign');
 // Duplicate patterns must not become artificial independent support.
 return Object.freeze({
  claims:Object.freeze([...new Set(claims)]),
  errors:Object.freeze([...new Set(errors)]),
  correct:[...new Set(claims)].length-[...new Set(errors)].length
 });
}
