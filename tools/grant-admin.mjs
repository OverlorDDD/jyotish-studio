import {PrismaClient} from '@prisma/client';
/** One-time, explicit local owner grant. Never available through HTTP or browser. */
const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();
if(process.env.CONFIRM_ADMIN_PROMOTION!=='YES'||!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
 console.error('BLOCKED: set ADMIN_EMAIL to an existing login and CONFIRM_ADMIN_PROMOTION=YES explicitly.');
 process.exit(1);
}
const db=new PrismaClient();
try{
 const user=await db.user.findUnique({where:{email},select:{id:true,email:true,role:true}});
 if(!user)throw new Error('Account not found. Register using the website first.');
 if(user.role==='ADMIN'){console.log('Already an administrator. No change.');}
 else{
  await db.user.update({where:{id:user.id},data:{role:'ADMIN'}});
  console.log('Administrator role granted to existing registered account.');
 }
}catch(e){console.error('BLOCKED:',e instanceof Error?e.message:String(e));process.exitCode=1}
finally{await db.$disconnect()}
