import {PrismaClient} from '@prisma/client';
import {drainForumFanout} from '../apps/api/src/com-fanout.ts';
const db=new PrismaClient();
try{
 const result=await drainForumFanout(db);
 console.info(JSON.stringify({operation:'galaxicom-fanout',...result}));
 if(result.failed)process.exitCode=1;
}finally{await db.$disconnect();}
