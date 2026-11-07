/** Synthetic E2E adapter. No astronomical or JHora source claims.
 * Keep old Reader v6/geometry browser regression fixtures compatible
 * with the new 15-card transport contract, avoiding fake external evidence.
 */
const DIVS=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45];
function house(sign,lagna){return ((sign-lagna+12)%12)+1}
export function withN4UiFixture(source){
 const chart=structuredClone(source);
 for(const [key,lagna] of [['d9','lagnaD9'],['d10','lagnaD10']]){
  const sign=chart[lagna].sign;
  chart[key]=chart[key].map(p=>({...p,house:house(p.sign,sign)}));
 }
 const sourceDigest=chart.verification.digest;
 const charts=DIVS.map(division=>{
  const key='d'+division,lagna=division===1?chart.ascendant:
   division===9?chart.lagnaD9:division===10?chart.lagnaD10:chart.ascendant;
  const legacy=[1,9,10].includes(division);
  const planets=legacy?chart[key]:chart.d1;
  return {
   division,lagnaSign:lagna.sign,lagnaBoundaryArcseconds:300,
   planets:planets.map(p=>({
    name:p.name,sign:p.sign,house:house(p.sign,lagna.sign),
    retrograde:!!p.retrograde,boundaryDistanceArcseconds:300
   }))
  };
 });
 chart.n4={
  version:'n4-rc-server-bound-15-v1',
  sourceVerificationVersion:'jyotish-integrity-v3',
  sourceDigest,
  status:'INTERNALLY_VERIFIED_D1_DERIVATION_NOT_EXTERNAL_LAHIRI_CERTIFICATE',
  method:'parashari-sunmoon-hora-unequal-trimsamsa-jhora-style-d60-v1',
  ruleVersion:'n4-parashari-v1.0.0',
  d2Method:'Sun/Moon Hora',d60Excluded:true,
  externalJhoraPerBirthCertified:false,
  charts
 };
 return chart;
}
export async function enterSyntheticBirthFields(page,details={
 date:'2000-01-01',time:'12:00',latitude:28.6139,longitude:77.2090,timeZone:'Asia/Kolkata'
}){
 await page.locator('input[type="date"]').fill(details.date);
 await page.locator('input[type="time"]').fill(details.time);
 const advanced=page.locator('.jy-n4-advanced');
 await advanced.locator('summary').click();
 await advanced.locator('input').nth(0).fill(String(details.latitude));
 await advanced.locator('input').nth(1).fill(String(details.longitude));
 await advanced.locator('input').nth(2).fill(details.timeZone);
}
