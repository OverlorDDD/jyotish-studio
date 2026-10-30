/** Read-only factual launch gate. Never treat a missing publisher description
 * as an AI translation failure or invent a source-grounded teaser.
 */
import {PrismaClient} from '@prisma/client';
import {editorialPreviewState} from '../apps/api/src/news-editorial-coverage.ts';
import {disabledNewsSourceKeys} from '../apps/api/src/news-sources.ts';
import {publicTitleForLocale} from '../apps/api/src/news-localization.ts';
const db=new PrismaClient();
const headlinesOnly=process.argv.includes('--headlines-only');
if(headlinesOnly&&!(process.env.NEWS_TRANSLATION_CONTENT_SCOPE==='headlines'&&
 process.env.NEWS_TRANSLATION_HEADLINES_APPROVED==='1')){
 console.error('BLOCKED: Explicit headline-only gate requires approved headlines scope in .env');
 process.exit(2);
}
try{
 const [rows,lastScan,sources]=await Promise.all([
  db.newsArticle.findMany({where:{status:'PUBLISHED'},
   select:{id:true,source:true,title:true,titleUk:true,titleEn:true,summaryUk:true,feedDescription:true,summary:true,summaryKind:true},
   take:10000,orderBy:{discoveredAt:'desc'}}),
  db.newsScan.findFirst({orderBy:{createdAt:'desc'},select:{createdAt:true,accepted:true,sources:true,errors:true}}),
  db.newsSourceScan.findMany({orderBy:{createdAt:'desc'},take:160,select:{sourceKey:true,status:true,failure:true,createdAt:true}})
 ]);
 const disabled=disabledNewsSourceKeys();
 const latest=new Map();for(const row of sources)if(!disabled.has(row.sourceKey)&&!latest.has(row.sourceKey))latest.set(row.sourceKey,row);
 const states={ok:0,empty:0,error:0,cooldown:0,other:0};
 for(const row of latest.values()){if(Object.hasOwn(states,row.status))states[row.status]++;else states.other++;}
 const counts={ready:0,missing_source_facts:0,translation_pending:0};
 const pending=[],unsupported=[];
 for(const row of rows){
  const state=editorialPreviewState(row);counts[state]++;
  if(state==='translation_pending')pending.push({id:row.id,source:row.source,kind:row.summaryKind});
  if(state==='missing_source_facts')unsupported.push({id:row.id,source:row.source,kind:row.summaryKind});
 }
 const missingTitles=rows.filter(r=>!publicTitleForLocale(r,'uk')).length;
 const missingEnglishTitles=rows.filter(r=>!publicTitleForLocale(r,'en')).length;
 const ageMin=lastScan?(Date.now()-new Date(lastScan.createdAt).getTime())/60000:null;
 const failures=[];
 if(!rows.length)failures.push('No published news articles');
 if(rows.length===10000)failures.push('Coverage exceeded 10000 articles; audit pagination');
 if(missingTitles)failures.push(missingTitles+' published titles have no usable Ukrainian headline');
 if(missingEnglishTitles)failures.push(missingEnglishTitles+' published titles have no usable English headline');
 if(counts.translation_pending&&!headlinesOnly)
  failures.push(counts.translation_pending+' articles have factual publisher context but no Ukrainian teaser');
 if(!lastScan||ageMin===null||ageMin>90)failures.push('News ingestion has no scan within 90 minutes');
 if(states.ok===0)failures.push('No news source has a recent OK state');
 const status=failures.length?'BLOCKED':headlinesOnly&&counts.translation_pending
  ?'HEADLINES_READY_WITH_EDITORIAL_DEBT':'CONTENT_READY';
 const report={status,gate:headlinesOnly?'EXPLICIT_HEADLINES_ONLY':'STRICT_FULL_EDITORIAL',
  unlocalizedTeasersDeferred:headlinesOnly?counts.translation_pending:0,articles:rows.length,
  missingTitles,missingEnglishTitles,missingTeasers:counts.missing_source_facts+counts.translation_pending,
  previewCoverage:counts,
  noSourceContextExamples:unsupported.slice(0,25),actionableMissingExamples:pending.slice(0,25),
  latestScan:lastScan?{at:lastScan.createdAt,ageMinutes:Math.round(ageMin),accepted:lastScan.accepted,
   sources:lastScan.sources,errors:lastScan.errors}:null,
  sourceStates:states,disabledSourceKeys:[...disabled].sort(),sourceDegraded:states.error>0||states.cooldown>0,
  degradedSources:[...latest.values()].filter(r=>r.status==='error').map(r=>({key:r.sourceKey,error:r.failure?.slice(0,120)})),
  note:headlinesOnly
   ?'HEADLINES_READY is not full editorial certification: source-backed missing Ukrainian teasers are visible as an explicit backlog. Do NOT claim CONTENT_READY.'
   :'CONTENT_READY allows only provenance-safe title/link cards when the original source supplies no usable description. It does not mean every article has a teaser or each RSS publisher is healthy.',
  failures};
 console.log(JSON.stringify(report,null,2));
 if(failures.length)process.exitCode=2;
}catch(error){console.error('[GalaxiNews] quality gate could not inspect the local database:',error instanceof Error?error.message:String(error));process.exitCode=1}
finally{await db.$disconnect()}
