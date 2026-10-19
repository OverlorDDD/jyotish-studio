/** PostgreSQL transaction adapter for the ChangeRole application use case. */
import type {PrismaService} from './prisma.ts';
import {RoleChangeError,type RoleChangePort,type StaffRole} from './admin-role-application.ts';
export class PrismaRoleChangeStore implements RoleChangePort{
 constructor(private readonly prisma:PrismaService){}
 async changeAtomically(actorId:string,targetId:string,role:StaffRole){
  return this.prisma.$transaction(async tx=>{
   const actor=await tx.user.findUnique({where:{id:actorId},select:{role:true}});
   if(actor?.role!=='ADMIN')throw new RoleChangeError('not_admin','Administrator role required');
   const target=await tx.user.findUnique({where:{id:targetId},select:{role:true}});
   if(!target)throw new RoleChangeError('target_missing','User not found');
   if(target.role===role)return {changed:false,role:target.role};
   if(target.role==='ADMIN'){
    const admins=await tx.user.count({where:{role:'ADMIN'}});
    if(admins<=1)throw new RoleChangeError('last_admin','Cannot remove the last administrator');
   }
   const result=await tx.user.update({where:{id:targetId},data:{role},select:{role:true}});
   await tx.roleChange.create({data:{actorId,targetId,previousRole:target.role,newRole:role}});
   return {changed:true,role:result.role};
  },{isolationLevel:'Serializable'});
 }
}
