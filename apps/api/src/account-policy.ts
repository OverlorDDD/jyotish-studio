/** Identity domain policy: no Nest/Prisma/HTTP dependencies. */
export type EntitlementUser={
 id:string;email:string;role:string;
 subscriptionTier:'FREE'|'PREMIUM';subscriptionEndsAt:Date|null
};
export function effectiveSubscription(user:Pick<EntitlementUser,'subscriptionTier'|'subscriptionEndsAt'>,now:Date=new Date()){
 return user.subscriptionTier==='PREMIUM'&&user.subscriptionEndsAt&&
  user.subscriptionEndsAt.getTime()>now.getTime()?'PREMIUM' as const:'FREE' as const;
}
export function publicUser(user:EntitlementUser,now:Date=new Date()){
 return {id:user.id,email:user.email,role:user.role,subscription:{
  tier:effectiveSubscription(user,now),
  currentPeriodEnd:user.subscriptionEndsAt?.toISOString()||null
 }};
}
