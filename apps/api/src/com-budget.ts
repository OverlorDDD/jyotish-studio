import {createHash} from 'node:crypto';
import type {PrismaService} from './prisma.ts';
/** Atomic PostgreSQL bucket: one shared limit for every Nest instance. Keys are SHA-256 digests. */
export async function forumBudget(db:PrismaService,accountId:string,operation:string,
 limit:number,windowMs=3_600_000):Promise<boolean>{
 if(!accountId||!Number.isSafeInteger(limit)||limit<1)throw new Error('Invalid forum budget');
 const key=createHash('sha256').update('com:v1:'+operation+':'+accountId).digest('hex');
 const windowStart=new Date(Math.floor(Date.now()/windowMs)*windowMs);
 const rows=await db.$queryRaw<Array<{count:number}>>`
 INSERT INTO "ComRateBucket" ("key","windowStart","count","updatedAt")
 VALUES (${key},${windowStart},1,CURRENT_TIMESTAMP)
 ON CONFLICT ("key") DO UPDATE SET
  "count"=CASE WHEN "ComRateBucket"."windowStart" <> EXCLUDED."windowStart"
    THEN 1 ELSE "ComRateBucket"."count"+1 END,
  "windowStart"=EXCLUDED."windowStart","updatedAt"=CURRENT_TIMESTAMP
 RETURNING "count"`;
 return rows[0]?.count<=limit;
}
export function forumWriteLimit(method:string,url:string):{name:string;max:number}{
 const path=url.split('?')[0].replace(/^\/api\/v1\/com/,'');
 if(method==='POST'&&path==='/threads')return {name:'threads',max:12};
 if(method==='POST'&&/^\/threads\/[0-9a-f-]{36}\/posts$/i.test(path))return {name:'replies',max:90};
 if(method==='POST'&&path==='/reports')return {name:'reports',max:15};
 if(method==='POST'&&path==='/appeals')return {name:'appeals',max:6};
 if(method==='POST'&&path==='/privacy/requests')return {name:'privacy',max:3};
 return {name:'mutations',max:300};
}
