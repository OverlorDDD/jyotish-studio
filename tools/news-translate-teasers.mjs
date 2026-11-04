/** Real Azure bilingual publisher RSS preview. No article or DB writes, no LLM.
 * A nonzero exit refuses a full-scope production rollout.
 */
import {existsSync} from 'node:fs';
import {translateLocalizedTeaser,validNewsTeaser} from '../apps/api/src/news-teaser-nmt.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const samples=[
 {name:'EN publisher excerpt',source:'The publisher explains how three Tarot spreads can support thoughtful reflection, careful questions, and everyday journaling without presenting a personal prediction as a verified fact.'},
 {name:'Hindi publisher excerpt',source:'ज्योतिष के अनुसार 5 राशियों के लिए 26 अक्टूबर का दिन खास हो सकता है। इस लेख में ग्रहों की स्थिति और पारंपरिक व्याख्या के बारे में बताया गया है।'},
 {name:'Mixed Hindi/Latin excerpt',source:'Panchanga और नक्षत्र: इस लेख में तिथि और नक्षत्र के अर्थ को समझाया गया है, और 2026 में उनके पारंपरिक प्रयोग का परिचय दिया गया है।'}
];
let failed=0;
console.log('[GalaxiNews] BILINGUAL SOURCE-EXCERPT AZURE NMT PREVIEW — no database writes, no LLM');
for(const item of samples){
 console.log('\nSOURCE SAMPLE:',item.name);
 for(const locale of ['uk','en']){
  try{
   const output=await translateLocalizedTeaser(item.source,locale);
   if(!validNewsTeaser(output,locale))throw Error('Output locale failed review');
   console.log(locale.toUpperCase()+':',output);
  }catch(error){failed++;console.error('BLOCKED',item.name,locale,error instanceof Error?error.message:String(error));}
 }
}
console.log('Review both output languages for fidelity, dates, source facts and Jyotish terms before enabling full mode.');
if(failed)process.exitCode=2;
