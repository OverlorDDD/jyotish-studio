/** Explicit one-time, non-destructive Wikimedia Commons image repair.
 * Safe to run while API is online; only updates PUBLISHED stories lacking images.
 * Wikimedia photographs are illustrative and independently licensed.
 */
import {PrismaClient} from '@prisma/client';
import {enrichOpenNewsPhotos} from '../apps/api/src/news-open-media.ts';
const prisma=new PrismaClient();
try{
 await prisma.$connect();
 const before=await prisma.newsArticle.count({where:{status:'PUBLISHED',imageUrl:null}});
 let checked=0,restored=0;
 for(let n=0;n<6;n++){
  const row=await enrichOpenNewsPhotos(prisma);
  checked+=row.checked;restored+=row.filled;
  console.log('[open media] batch',n+1,': checked',row.checked,'licensed photos saved',row.filled);
  if(row.checked===0)break;
 }
 const after=await prisma.newsArticle.count({where:{status:'PUBLISHED',imageUrl:null}});
 console.log('[open media] Before:',before,'without images. After:',after,
  'without images. Saved real Commons photos:',restored,'.');
 if(restored===0&&before>0){
  console.log('[open media] No verified photos available from Wikimedia Commons. Check HTTPS/DNS/proxy access from this computer. Existing Galaxiora artwork remains visible.');
 }
 console.log('[open media] Source and CC license must be displayed with each photo. No publisher rights restrictions bypassed.');
}catch(error){console.error('[open media] ERROR:',error instanceof Error?error.message:String(error));process.exitCode=1;}
finally{await prisma.$disconnect();}
