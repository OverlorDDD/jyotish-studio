/** Validate the public, server-derived 15-chart N4 addition before rendering.
 * Internal source binding is NOT an external JHora certificate or a signature.
 */
export const N4_RC_VIEW_DIVISIONS=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45] as const;
export const N4_RC_VIEW_VERSION='n4-rc-server-bound-15-v1' as const;
export type N4RcViewPlanet=Readonly<{name:string;sign:number;house:number;retrograde:boolean;boundaryDistanceArcseconds:number}>;
export type N4RcViewChart=Readonly<{division:number;lagnaSign:number;lagnaBoundaryArcseconds:number;planets:readonly N4RcViewPlanet[]}>;
export type N4RcView=Readonly<{
 version:typeof N4_RC_VIEW_VERSION;
 sourceVerificationVersion:'jyotish-integrity-v3';
 sourceDigest:string;
 status:'INTERNALLY_VERIFIED_D1_DERIVATION_NOT_EXTERNAL_LAHIRI_CERTIFICATE';
 method:'parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1';
 ruleVersion:'n4-parashari-v1.0.0';
 d2Method:'Sun/Moon Hora';d60Excluded:true;
 externalJhoraPerBirthCertified:false;
 charts:readonly N4RcViewChart[]
}>;
export type VerifiedNatalSource=Readonly<{
 verification?:{version:string;status:string;digest:string;externalReferenceChecked:boolean};
 n4?:N4RcView;
 ascendant?:{sign:number};
 lagnaD9?:{sign:number};lagnaD10?:{sign:number};
 d1?:readonly {name:string;sign:number;house:number}[];
 d9?:readonly {name:string;sign:number;house:number}[];
 d10?:readonly {name:string;sign:number;house:number}[];
}>;
const NAMES=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const ok=(condition:boolean,code:string)=>{if(!condition)throw Error('N4_RC_CLIENT_CONTRACT_REJECTED: '+code)};
const validSign=(n:number)=>Number.isInteger(n)&&n>=1&&n<=12;
export function assertN4RcView(chart:VerifiedNatalSource):asserts chart is VerifiedNatalSource & {n4:N4RcView}{
 const v=chart?.verification,n=chart?.n4;
 ok(v?.version==='jyotish-integrity-v3'&&v.status==='verified_internal'&&
  /^[a-f0-9]{64}$/.test(v.digest)&&v.externalReferenceChecked===false,'source proof');
 ok(n?.version===N4_RC_VIEW_VERSION&&n.sourceVerificationVersion==='jyotish-integrity-v3'&&
  n.sourceDigest===v!.digest&&
  n.status==='INTERNALLY_VERIFIED_D1_DERIVATION_NOT_EXTERNAL_LAHIRI_CERTIFICATE'&&
  n.method==='parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1'&&
  n.ruleVersion==='n4-parashari-v1.0.0'&&n.d2Method==='Sun/Moon Hora'&&
  n.d60Excluded===true&&n.externalJhoraPerBirthCertified===false,'N4 provenance/method');
 ok(Array.isArray(n?.charts)&&n.charts.length===15,'15 charts');
 for(let i=0;i<N4_RC_VIEW_DIVISIONS.length;i++){
  const c=n!.charts[i],expectedDivision=N4_RC_VIEW_DIVISIONS[i];
  ok(c?.division===expectedDivision&&validSign(c.lagnaSign)&&
   Number.isFinite(c.lagnaBoundaryArcseconds)&&c.lagnaBoundaryArcseconds>=0,'division order/lagna');
  ok(Array.isArray(c.planets)&&c.planets.length===9&&
   new Set(c.planets.map(p=>p.name)).size===9&&
   NAMES.every(name=>c.planets.some(p=>p.name===name)),'grahas');
  for(const p of c.planets){
   ok(validSign(p.sign)&&Number.isInteger(p.house)&&
    p.house===((p.sign-c.lagnaSign+12)%12)+1&&
    typeof p.retrograde==='boolean'&&Number.isFinite(p.boundaryDistanceArcseconds)&&
    p.boundaryDistanceArcseconds>=0,'varga body and house');
  }
 }
 for(const division of [1,9,10] as const){
  const c=n!.charts.find(x=>x.division===division)!;
  const original=division===1?chart.d1:division===9?chart.d9:chart.d10;
  const asc=division===1?chart.ascendant:division===9?chart.lagnaD9:chart.lagnaD10;
  ok(asc?.sign===c.lagnaSign&&Array.isArray(original)&&original.length===9,'existing D'+division);
  for(const p of c.planets){
   const legacy=original!.find(x=>x.name===p.name);
   ok(legacy?.sign===p.sign&&legacy.house===p.house,'existing D'+division+' '+p.name);
  }
 }
}
export function hasN4RcView(chart:VerifiedNatalSource):boolean{
 try{assertN4RcView(chart);return true}catch{return false}
}
