import {EditorialError,mayEdit,transitionPolicy,validateEditorial,type EditorialAction,type EditorialRole,type EditorialShape} from './editorial-policy.ts';
export const EDITORIAL_USE_CASES='EDITORIAL_USE_CASES';
export interface EditorialPort{
 create(actor:string,shape:EditorialShape):Promise<unknown>;
 list():Promise<unknown>;
 history(id:string):Promise<unknown>;
 edit(actor:string,id:string,revision:number,topic:string,document:unknown,role:EditorialRole):Promise<unknown>;
 transition(actor:string,id:string,revision:number,action:EditorialAction,role:EditorialRole):Promise<unknown>;
}
export class EditorialUseCases{
 constructor(private readonly store:EditorialPort){}
 create(actor:string,role:EditorialRole,kind:unknown,slug:unknown,topic:unknown,document:unknown){
  if(role!=='ADMIN'&&role!=='SUPPORT')throw new EditorialError('permission','Editorial access required');
  return this.store.create(actor,validateEditorial(kind,slug,topic,document));
 }
 list(role:EditorialRole){
  if(role!=='ADMIN'&&role!=='SUPPORT')throw new EditorialError('permission','Editorial access required');
  return this.store.list();
 }
 history(role:EditorialRole,id:string){
  if(role!=='ADMIN'&&role!=='SUPPORT')throw new EditorialError('permission','Editorial access required');
  return this.store.history(id);
 }
 edit(actor:string,role:EditorialRole,id:string,revision:number,topic:string,document:unknown){
  if(!Number.isSafeInteger(revision)||revision<1)throw new EditorialError('validation','Invalid expected revision');
  return this.store.edit(actor,id,revision,topic,document,role);
 }
 transition(actor:string,role:EditorialRole,id:string,revision:number,action:EditorialAction){
  if(!Number.isSafeInteger(revision)||revision<1)throw new EditorialError('validation','Invalid expected revision');
  if(!Object.hasOwn({submit:1,approve:1,reject:1,publish:1,archive:1,reopen:1},action))
   throw new EditorialError('validation','Unknown editorial action');
  return this.store.transition(actor,id,revision,action,role);
 }
}
