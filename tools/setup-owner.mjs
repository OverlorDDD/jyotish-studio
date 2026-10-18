import {PrismaClient} from '@prisma/client';
import {createInterface} from 'node:readline/promises';
import {stdin as input,stdout as output} from 'node:process';

/** Local interactive one-time OWNER bootstrap; no HTTP route and no password bypass. */
if(!process.stdin.isTTY){
 console.error('Run this from an interactive PowerShell session on the computer with your local PostgreSQL database.');
 process.exit(1);
}
const db=new PrismaClient();
const rl=createInterface({input,output});
try{
 const admins=await db.user.count({where:{role:'ADMIN'}});
 if(admins>0)throw new Error('An administrator already exists. Grant other roles through /uk/admin.');
 const users=await db.user.findMany({orderBy:{createdAt:'asc'},select:{id:true,email:true,role:true}});
 if(!users.length)throw new Error('No registered users in this database. Register on the site first.');
 console.log('Select the account to grant administrator rights. This is a LOCAL DATABASE operation.');
 users.forEach((u,i)=>console.log((i+1)+'. '+u.email+'  ['+u.role+']'));
 const selection=users.length===1?'1':await rl.question('Account number: ');
 const index=Number(selection)-1;
 if(!Number.isInteger(index)||index<0||index>=users.length)throw new Error('Invalid selection');
 const chosen=users[index];
 const consent=await rl.question('Type PROMOTE '+chosen.email+' to confirm: ');
 if(consent!==('PROMOTE '+chosen.email))throw new Error('No change: confirmation did not match.');
 const count=await db.$transaction(async tx=>{
  const existing=await tx.user.count({where:{role:'ADMIN'}});
  if(existing!==0)throw new Error('Admin already created by another process.');
  await tx.user.update({where:{id:chosen.id},data:{role:'ADMIN'}});
  return 1;
 },{isolationLevel:'Serializable'});
 if(count)console.log('SUCCESS: this existing account is now ADMIN. Sign out and sign back in to refresh the UI.');
}catch(e){console.error('NO CHANGE:',e instanceof Error?e.message:String(e));process.exitCode=1}
finally{rl.close();await db.$disconnect()}
