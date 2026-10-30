/** Safe read-only local NMT readiness check. No API keys or user data. */
import {existsSync} from 'node:fs';
import {checkNewsTranslator,translateNewsText,selectedNewsTranslationProvider,newsTranslationApproved} from '../apps/api/src/news-translation.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
if(process.env.NEWS_TRANSLATION_ENABLED==='0')
 console.warn('[GalaxiNews] Auto-publication disabled. Checking translator candidate without writing any articles.');
try{
 const info=await checkNewsTranslator();
 console.log('[GalaxiNews] machine translation provider:',selectedNewsTranslationProvider());
 console.log('[GalaxiNews] languages:',JSON.stringify(info));
 if(!info.available)throw Error('EN-UK translation unavailable; check local language models or Azure credentials');
 const sample='The Moon enters Gemini in 2026.';
 const translated=await translateNewsText(sample);
 if(!/[А-Яа-яІіЇїЄєҐґ]/.test(translated))throw Error('Output contains no Ukrainian text');
 console.log('PASS EN -> UK machine translation API:',translated);
 console.log('No generative LLM involved. This is a connectivity check, NOT language certification.');
 console.log('Auto-publication quality approval:',newsTranslationApproved()?'APPROVED':'NOT APPROVED');
}catch(error){
 console.error('BLOCKED: Selected NMT translator not ready:',error instanceof Error?error.message:String(error));
 if(selectedNewsTranslationProvider()==='local'){
  console.error('Local: docker compose --profile translation up -d translator');
  console.error('Local logs: docker compose --profile translation logs --tail=80 translator');
 }else console.error('Azure: verify key, region, chosen plan, service permissions and request budget.');
 process.exitCode=2;
}
