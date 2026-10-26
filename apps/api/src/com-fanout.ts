import type {PrismaClient} from '@prisma/client';
/** C4 durable, retryable fanout. Invoke from an external once-per-minute scheduler.
 * Unique ComNotification(userId,postId,kind) makes replays idempotent.
 */
export async function drainForumFanout(db:PrismaClient,maxJobs=12,batchSize=300){
 let claimed=0,delivered=0,completed=0,failed=0;
 if(maxJobs<1||maxJobs>100||batchSize<1||batchSize>500)throw new Error('Invalid batch limit');
 for(let i=0;i<maxJobs;i++){
  const now=new Date();
  const job=await db.comNotificationFanout.findFirst({where:{OR:[
   {status:'PENDING'},{status:'PROCESSING',lockedUntil:{lt:now}}
  ]},orderBy:[{createdAt:'asc'},{postId:'asc'}],select:{
   postId:true,threadId:true,cursorUserId:true,attempts:true,status:true,lockedUntil:true}});
  if(!job)break;
  const lease=await db.comNotificationFanout.updateMany({where:{postId:job.postId,
   OR:[{status:'PENDING'},{status:'PROCESSING',lockedUntil:{lt:now}}]},
   data:{status:'PROCESSING',lockedUntil:new Date(Date.now()+120_000),attempts:{increment:1}}});
  if(!lease.count)continue;
  claimed++;
  try{
   const post=await db.comPost.findFirst({where:{id:job.postId,status:'PUBLISHED',
    thread:{status:'PUBLISHED',category:{enabled:true}}},select:{
    id:true,authorId:true,threadId:true,createdAt:true}});
   if(!post){
    await db.comNotificationFanout.update({where:{postId:job.postId},data:{status:'DONE',lockedUntil:null}});
    completed++;continue;
   }
   const follows=await db.comFollow.findMany({where:{
    threadId:post.threadId,userId:{not:post.authorId,...(job.cursorUserId?{gt:job.cursorUserId}:{})},
    createdAt:{lte:post.createdAt}
   },orderBy:{userId:'asc'},take:batchSize,select:{userId:true}});
   if(follows.length){
    await db.comNotification.createMany({data:follows.map(f=>({userId:f.userId,
     threadId:post.threadId,postId:post.id,kind:'REPLY'})),skipDuplicates:true});
    delivered+=follows.length;
   }
   const done=follows.length<batchSize;
   await db.comNotificationFanout.update({where:{postId:job.postId},data:{
    status:done?'DONE':'PENDING',lockedUntil:null,
    cursorUserId:follows.at(-1)?.userId||job.cursorUserId
   }});
   if(done)completed++;
  }catch(error){
   failed++;
   // Never lose work on a transient failure; after five attempts, require manual inspection.
   await db.comNotificationFanout.updateMany({where:{postId:job.postId},data:{
    status:job.attempts>=4?'FAILED':'PENDING',lockedUntil:null
   }});
  }
 }
 return {claimed,delivered,completed,failed};
}
