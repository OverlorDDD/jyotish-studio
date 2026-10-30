/** Read-only, real Azure/Argos headline QA. No database, no article writes.
 * Human must evaluate natural Ukrainian before enabling scheduled translation.
 */
import {existsSync} from 'node:fs';
import {checkNewsTranslator,selectedNewsTranslationProvider,translateNewsText,
 newsTranslationScope,newsScopeApproved} from '../apps/api/src/news-translation.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const corpus=[
 ['Jyotish','Vedic astrology: Nakshatras and the Moon in the birth chart'],
 ['Tarot','Three Tarot spreads to explore your feelings'],
 ['Astrology','Mercury entered Scorpio on October 15, 2026'],
 ['Yoga','A yoga instructor explains gentle morning breathing exercises'],
 ['Astronomy','New images of Jupiter captured by a telescope on October 28, 2026'],
 ['Calendar','What is Panchanga? Tithi and Nakshatra explained'],
 ['Editorial','How to read your natal chart with confidence'],
 ['Culture','Traditional Diwali celebrations in India']
];
console.log('[GalaxiNews] provider:',selectedNewsTranslationProvider(),
 'scope:',newsTranslationScope(),
 'approved:',newsScopeApproved());
console.log('DRY RUN: makes translation API requests but NEVER writes to the news database.');
try{
 const ready=await checkNewsTranslator();
 if(!ready.available)throw Error('Selected EN->UK model is not available');
 let failed=0;
 for(const [topic,source] of corpus){
  try{
   const result=await translateNewsText(source);
   console.log('['+topic+']\n EN: '+source+'\n UK: '+result+'\n');
  }catch(error){
   failed++;
   console.error('BLOCKED ['+topic+']: '+(error instanceof Error?error.message:String(error)));
  }
 }
 console.log('Machine-validation:',corpus.length-failed+'/'+corpus.length,
  'sentences returned without known safety flags.');
 console.log('HUMAN CHECK: verify all headlines for fluency, faithful meaning, names and Sanskrit vocabulary.');
 console.log('This command does NOT enable automatic publication or certify full article teasers.');
 if(failed)process.exitCode=2;
}catch(e){console.error('BLOCKED: '+(e instanceof Error?e.message:String(e)));process.exitCode=2;}
