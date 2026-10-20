/** A7 expert listing admission: separate staff role from reviewed profile, and never imply a paid order. */
export const EXPERT_SPECIALTIES=['jyotish','tarot','yoga','meditation'] as const;
export type Specialty=typeof EXPERT_SPECIALTIES[number];
export class ExpertProfileError extends Error{
 constructor(public readonly code:'validation'|'permission'|'conflict',message:string){super(message);this.name='ExpertProfileError';}
}
function field(input:unknown,label:string,max:number,min=1):string{
 if(typeof input!=='string'||input.trim().length<min||input.length>max)throw new ExpertProfileError('validation',label+' length invalid');
 return input.trim();
}
export function validateExpertApplication(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new ExpertProfileError('validation','Invalid expert application');
 const src=value as Record<string,unknown>;
 if(Object.keys(src).some(k=>!['displayName','bioUk','bioEn','specialties','consent'].includes(k)))throw new ExpertProfileError('validation','Unexpected field');
 if(src.consent!==true)throw new ExpertProfileError('validation','Consent to publish approved bio is required');
 if(!Array.isArray(src.specialties)||src.specialties.length===0||src.specialties.length>4||
  !src.specialties.every(x=>typeof x==='string'&&EXPERT_SPECIALTIES.includes(x as Specialty))||
  new Set(src.specialties).size!==src.specialties.length)throw new ExpertProfileError('validation','Invalid specialties');
 return {displayName:field(src.displayName,'Display name',100,2),
  bioUk:field(src.bioUk,'Український опис',2400,40),
  bioEn:field(src.bioEn,'English bio',2400,40),
  specialties:src.specialties as Specialty[]};
}
export function reviewExpert(role:string,action:string,current:string){
 if(role!=='ADMIN')throw new ExpertProfileError('permission','Administrator role required');
 if(action==='verify'&&current==='SUBMITTED'||action==='reject'&&current==='SUBMITTED'||
  action==='suspend'&&current==='VERIFIED'||action==='resubmit'&&['REJECTED','SUSPENDED'].includes(current))
  return action==='verify'?'VERIFIED':action==='reject'?'REJECTED':action==='suspend'?'SUSPENDED':'SUBMITTED';
 throw new ExpertProfileError('conflict','Invalid expert review transition');
}
