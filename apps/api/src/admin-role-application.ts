/** Application-owned role-change use case; framework and database independent. */
export const ADMIN_ROLE_USE_CASE='ADMIN_ROLE_USE_CASE';
export type StaffRole='MEMBER'|'EXPERT'|'SUPPORT'|'ADMIN';
export type RoleErrorCode='self_change'|'invalid_id'|'not_admin'|'target_missing'|'last_admin';
export class RoleChangeError extends Error{
 readonly code:RoleErrorCode;
 constructor(code:RoleErrorCode,message:string){super(message);this.code=code;this.name='RoleChangeError';}
}
export interface RoleChangePort{
 changeAtomically(actorId:string,targetId:string,role:StaffRole):Promise<{changed:boolean;role:StaffRole}>;
}
export class ChangeRoleUseCase{
 private readonly store:RoleChangePort;
 constructor(store:RoleChangePort){this.store=store;}
 async execute(actorId:string,targetId:string,role:StaffRole){
  if(actorId===targetId)throw new RoleChangeError('self_change','You cannot change your own role');
  if(!/^[0-9a-f-]{36}$/i.test(targetId))throw new RoleChangeError('invalid_id','Invalid user id');
  return this.store.changeAtomically(actorId,targetId,role);
 }
}
