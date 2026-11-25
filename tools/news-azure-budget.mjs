/** Read-only quota report. No Azure HTTP request, secrets or news writes. */
import {existsSync} from 'node:fs';
import {PrismaClient} from '@prisma/client';
import {azureNewsMonthlyCharLimit,utcTranslationPeriod,utcNewsAccruedCharCeiling} from '../apps/api/src/news-translation-budget.ts';
if(existsSync('.env'))process.loadEnvFile('.env');
const db=new PrismaClient();
try{
 const period=utcTranslationPeriod();
 const limit=azureNewsMonthlyCharLimit();
 const item=await db.newsTranslationUsage.findUnique({where:{period}});
 const reserved=item?.characters??0;
 const pacingEnabled=process.env.NEWS_AZURE_PACING_ENABLED!=='0';
 const accruedCeiling=pacingEnabled?utcNewsAccruedCharCeiling(new Date(),limit):limit;
 console.log(JSON.stringify({provider:process.env.NEWS_TRANSLATION_PROVIDER||'local',
  monthUTC:period,monthlyInternalLimit:limit,charactersReserved:reserved,
  charactersRemaining:Math.max(0,limit-reserved),
  utcPacingEnabled:pacingEnabled,utcAccruedCeiling:accruedCeiling,
  charactersAvailableNow:Math.max(0,accruedCeiling-reserved),
  translationEnabled:process.env.NEWS_TRANSLATION_ENABLED==='1',
  editorialQualityApproved:process.env.NEWS_TRANSLATION_QUALITY_APPROVED==='1',
  note:'Internal GalaxiNews reservation ledger only; real Azure resource usage can include manual samples and other apps. Confirm Azure Metrics and F0 pricing in portal.'},null,2));
}catch(error){console.error('BLOCKED: Translation budget report:',error instanceof Error?error.message:String(error));process.exitCode=2}
finally{await db.$disconnect()}
