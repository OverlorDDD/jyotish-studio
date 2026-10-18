import {PrismaClient} from '@prisma/client';
/** Operational cleanup command. Schedule daily after deploying. No private content is logged. */
const prisma=new PrismaClient();
try{
 const result=await prisma.readingDraft.deleteMany({where:{expiresAt:{lte:new Date()}}});
 console.log('Expired draft records deleted: '+result.count);
}catch(error){console.error('Draft cleanup failed; check PostgreSQL and migration status.');process.exitCode=1}
finally{await prisma.$disconnect()}
