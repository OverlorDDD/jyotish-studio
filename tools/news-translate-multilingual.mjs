/** Real NMT bilingual QA, not a database repair. Uses only sample headlines. */
import {existsSync} from 'node:fs';
import {translateLocalizedHeadline} from '../apps/api/src/news-translation.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const samples=[
 'Kal Ka Rashifal 26 अक्टूबर: कल इन 5 राशियों के दिन रहेंगे रोमांचक',
 'ज्योतिष शरद पूर्णिमा: क्या आपकी कुंडली का ग्रह भाव बदल देता है चंद्रमा का पूरा फल',
 'What is Panchanga? Tithi and Nakshatra explained',
 'Three Tarot spreads to explore your feelings',
 'A yoga instructor explains gentle morning breathing exercises'
];
let errors=0;
console.log('[GalaxiNews] REAL bilingual NMT preview: no news database writes, no LLM calls.');
for(const source of samples){
 console.log('\nSOURCE:',source);
 for(const locale of ['uk','en']){
  try{console.log(locale.toUpperCase()+':',await translateLocalizedHeadline(source,locale));}
  catch(error){errors++;console.error('BLOCKED',locale,error instanceof Error?error.message:String(error))}
 }
}
console.log('Review the accuracy and fluency of both languages, especially Romanized Hindi, proper nouns, dates and Jyotish terms.');
if(errors)process.exitCode=2;
