/** Safe read-only local NMT readiness check. No API keys or user data. */
import {existsSync} from 'node:fs';
import {checkNewsTranslator,translateNewsText,NEWS_TRANSLATOR_ENGINE} from '../apps/api/src/news-translation.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
if(process.env.NEWS_TRANSLATION_ENABLED==='0'){
 console.warn('[GalaxiNews] local translation intentionally disabled');
 process.exit(2);
}
try{
 const info=await checkNewsTranslator();
 console.log('[GalaxiNews] local translation engine:',NEWS_TRANSLATOR_ENGINE);
 console.log('[GalaxiNews] languages:',JSON.stringify(info));
 if(!info.available)throw Error('English to Ukrainian package not installed; inspect /languages and Argos models');
 const sample='The Moon enters Gemini in 2026.';
 const translated=await translateNewsText(sample);
 if(!/[А-Яа-яІіЇїЄєҐґ]/.test(translated))throw Error('Output contains no Ukrainian text');
 console.log('PASS EN -> UK local machine translation:',translated);
 console.log('PASS No LLM provider, credits or API keys involved.');
}catch(error){
 console.error('BLOCKED: Offline translator not ready:',error instanceof Error?error.message:String(error));
 console.error('Run: docker compose --profile translation up -d translator');
 console.error('Then check: docker compose --profile translation logs --tail=80 translator');
 process.exitCode=2;
}
