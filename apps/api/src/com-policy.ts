/** GalaxiCom C0: pure policy. FREE remains able to create and reply. */
import {effectiveSubscription} from './account-policy.ts';
export const COM_THREAD_LIMIT=12,COM_REPLY_LIMIT=90;
export const COM_EDIT_WINDOW_MS=30*60*1000;
export type ComActor={id:string;role:string;subscriptionTier:'FREE'|'PREMIUM';subscriptionEndsAt:Date|null};
export function forumModerator(role:string){return role==='ADMIN'||role==='SUPPORT';}
export function forumPermissions(actor:ComActor|null){
 const premium=actor?effectiveSubscription(actor)==='PREMIUM':false;
 return {canRead:true,canCreate:Boolean(actor),canReply: Boolean(actor),
  canModerate:Boolean(actor&&forumModerator(actor.role)),canManageContext:actor?.role==='ADMIN',premiumBadge:premium,
  // Future paid features are deliberately disabled without verified subscription/payment design.
  canCreatePremiumOnlyRooms:false,canPinOwnTopics:false,canOverrideModeration:false};
}
export function validateForumText(text:string,min:number,max:number){
 const value=text.trim().replace(/\r\n/g,'\n');
 if(value.length<min||value.length>max)throw new Error('length');
 if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value))throw new Error('control_character');
 // MVP accepts plain text only. React renders without dangerouslySetInnerHTML.
 if(/<\s*\/?\s*[a-z][^>]*>/i.test(value)||/javascript\s*:/i.test(value))throw new Error('html');
 if((value.match(/https?:\/\/[^\s]+/gi)||[]).length>3)throw new Error('too_many_links');
 return value;
}
export function withinEditWindow(created:Date,now=new Date()){
 return now.getTime()-created.getTime()<=COM_EDIT_WINDOW_MS&&created.getTime()<=now.getTime();
}
export function authorView(user:{id:string;role:string;subscriptionTier:'FREE'|'PREMIUM';subscriptionEndsAt:Date|null;comProfile?:{displayName:string|null;showPremiumBadge:boolean}|null}){
 const displayName=user.comProfile?.displayName||'Дослідник '+user.id.slice(0,6);
 return {id:user.id,name:displayName,expert:user.role==='EXPERT',
  premium:effectiveSubscription(user)==='PREMIUM'&&user.comProfile?.showPremiumBadge===true};
}
