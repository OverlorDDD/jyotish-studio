/** The ONLY permitted source for the N4 live-text audit is synthetic chart data. */
import {calculateChart} from '../packages/jyotish-core/src/index.ts';
const bodies=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
export const N4_LIVE_AUDIT_CORPUS_VERSION='n4-synthetic-prose-12x2x2-v2';
export function n4SyntheticAuditChart(seed){
 if(!Number.isInteger(seed)||seed<0||seed>11)throw Error('Only twelve explicitly synthetic profiles allowed');
 return calculateChart({
  date:'1994-05-17',time:'08:16',timeZone:'Etc/UTC',
  latitude:0,longitude:0,place:'SYNTHETIC_TEST_ONLY_NEVER_REAL_BIRTH'
 },{
  julianDay:2450000,ayanamsa:23.851,backend:'independent_editorial_synthetic_not_ephemeris',
  ascendant:(19.13+seed*28.371)%360,
  positions:bodies.map((name,i)=>({
   name,longitude:(13.51+seed*10.312+i*37.132+seed*i*i*0.31)%360,
   speed:i%3===1?-0.01:1
  }))
 });
}
export function n4AuditSampleId(i){
 if(!Number.isInteger(i)||i<0||i>=48)throw Error('N4 audit index 0..47 only');
 const seed=Math.floor(i/4);
 const lang=i%4<2?'uk':'en';
 const variant=i%2===0?'A':'B';
 return {seed,lang,variant,id:'N4-SYNTH-'+String(seed+1).padStart(2,'0')+'-'+lang+'-'+variant};
}
