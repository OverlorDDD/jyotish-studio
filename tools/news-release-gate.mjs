/** Read-only GalaxiNews launch gate: measure real local DB coverage.
 * Never claims that a successful public web route certifies the private archive.
 */
import {PrismaClient} from '@prisma/client';
const db=new PrismaClient();
try{
 const [articles,missingTitles,missingTeasers,lastScan,sources]=await Promise.all([
  db.newsArticle.count({where:{status:'PUBLISHED'}}),
  db.newsArticle.count({where:{status:'PUBLISHED',OR:[{titleUk:null},{titleUk:''}]}}),
  db.newsArticle.count({where:{status:'PUBLISHED',OR:[{summaryUk:null},{summaryUk:''}]}}),
  db.newsScan.findFirst({orderBy:{createdAt:'desc'},select:{createdAt:true,accepted:true,sources:true,errors:true}}),
  db.newsSourceScan.findMany({orderBy:{createdAt:'desc'},take:160,select:{sourceKey:true,status:true,failure:true}})
 ]);
 const latest=new Map();for(const row of sources)if(!latest.has(row.sourceKey))latest.set(row.sourceKey,row);
 const states={ok:0,empty:0,error:0,cooldown:0,other:0};
 for(const row of latest.values()){if(row.status in states)states[row.status]++;else states.other++;}
 const ageMin=lastScan?(Date.now()-new Date(lastScan.createdAt).getTime())/60000:null;
 const failing=[];
 if(!articles)failing.push('No published news articles');
 if(missingTitles)failing.push(missingTitles+' published titles have no Ukrainian translation');
 if(missingTeasers)failing.push(missingTeasers+' published articles have no Ukrainian teaser');
 if(!lastScan||ageMin===null||ageMin>90)failing.push('News ingestion has no scan within 90 minutes');
 if(states.ok===0)failing.push('No news source has a recent OK state');
 const report={status:failing.length?'BLOCKED':'CONTENT_READY',articles,missingTitles,missingTeasers,
  latestScan:lastScan?{at:lastScan.createdAt,ageMinutes:Math.round(ageMin),accepted:lastScan.accepted,
   sources:lastScan.sources,errors:lastScan.errors}:null,
  sourceStates:states,sourceDegraded:states.error>0||states.cooldown>0,
  note:'An OK gate does not mean every RSS publisher is reachable or that real photos exist.',
  failures:failing};
 console.log(JSON.stringify(report,null,2));
 if(failing.length)process.exitCode=2;
}catch(error){console.error('[GalaxiNews] quality gate could not inspect the local database:',error instanceof Error?error.message:String(error));process.exitCode=1}
finally{await db.$disconnect()}
