/** Human editorial QA sample against the REAL local Argos model.
 * No cloud traffic, no private data, no DB writes. */
import {existsSync} from 'node:fs';
import {checkNewsTranslator,translateNewsText} from '../apps/api/src/news-translation.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const corpus=[
 {kind:'jyotish',en:'Vedic astrology explains how nakshatras and the Moon are used in a traditional birth chart.'},
 {kind:'tarot',en:'Three traditional Tarot spreads are presented as exercises for personal reflection.'},
 {kind:'yoga',en:'A yoga instructor explains gentle morning breathing exercises for beginners.'},
 {kind:'astronomy',en:'A telescope captured new images of Jupiter on October 28, 2026.'},
 {kind:'dates',en:'Mercury entered Scorpio on October 15, 2026.'},
 {kind:'rights',en:'The publisher released a short excerpt under a Creative Commons Attribution license.'}
];
try{
 const ready=await checkNewsTranslator();
 if(!ready.available)throw Error('EN to UK model absent');
 let ok=0;
 for(const [index,entry] of corpus.entries()){
  try{
   const uk=await translateNewsText(entry.en);
   console.log('['+(index+1)+'/6 '+entry.kind+']');
   console.log('EN: '+entry.en+'\nUK: '+uk+'\n');
   ok++;
  }catch(e){console.error('[QA] '+entry.kind+': '+(e instanceof Error?e.message:String(e)));}
 }
 console.log('TECHNICAL:',ok+'/6 validated');
 console.log('HUMAN REVIEW REQUIRED: Are Jyotish/Tarot terms, proper nouns, calendar dates and Ukrainian sentences natural?');
 if(ok!==corpus.length)process.exitCode=2;
}catch(e){console.error('BLOCKED: '+(e instanceof Error?e.message:String(e)));process.exitCode=2;}
