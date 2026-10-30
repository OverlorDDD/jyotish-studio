/** Remove expired unverified signups only; never touch valid User accounts. */
import {existsSync} from 'node:fs';
import {PrismaClient} from '@prisma/client';
if(existsSync('.env'))process.loadEnvFile('.env');
const db=new PrismaClient();
try{
 const removed=await db.pendingRegistration.deleteMany({where:{expiresAt:{lt:new Date()}}});
 console.log('[signup] expired verification records deleted:',removed.count);
}catch(error){
 console.error('[signup] expiration pruning failed:',error instanceof Error?error.message:String(error));
 process.exitCode=1;
}finally{await db.$disconnect();}
