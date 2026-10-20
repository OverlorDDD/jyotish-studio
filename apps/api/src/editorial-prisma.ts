import type {Prisma} from '@prisma/client';
import {PrismaService} from './prisma.ts';
import type {EditorialPort} from './editorial-application.ts';
import {EditorialError,mayEdit,transitionPolicy,validateEditorial,type EditorialAction,type EditorialRole,type EditorialShape} from './editorial-policy.ts';

const json=(v:unknown)=>v as Prisma.InputJsonValue;
function plain(entry:{id:string;kind:string;slug:string;topic:string;status:string;revision:number;document:unknown;publishedAt:Date|null;updatedAt:Date;createdAt:Date}){
 return {id:entry.id,kind:entry.kind,slug:entry.slug,topic:entry.topic,status:entry.status,
  revision:entry.revision,document:entry.document,publishedAt:entry.publishedAt,updatedAt:entry.updatedAt,createdAt:entry.createdAt};
}
/** Database access is isolated here. Every mutation is CAS + immutable audit in one transaction. */
export class PrismaEditorialStore implements EditorialPort{
 constructor(private readonly prisma:PrismaService){}
 async create(actor:string,shape:EditorialShape){
  try{return await this.prisma.$transaction(async tx=>{
   const entry=await tx.editorialEntry.create({data:{
    kind:shape.kind,slug:shape.slug,topic:shape.topic,document:json(shape.document),creatorId:actor
   }});
   await tx.editorialVersion.create({data:{entryId:entry.id,revision:1,action:'create',actorId:actor,snapshot:json(plain(entry))}});
   return plain(entry);
  });}
  catch(err){
   if((err as {code?:string})?.code==='P2002')throw new EditorialError('conflict','Editorial slug already exists');
   throw err;
  }
 }
 async list(){
  const records=await this.prisma.editorialEntry.findMany({take:100,orderBy:{updatedAt:'desc'}});
  return records.map(plain);
 }
 async history(id:string){
  const entry=await this.prisma.editorialEntry.findUnique({where:{id},select:{id:true}});
  if(!entry)throw new EditorialError('missing','Entry does not exist');
  return this.prisma.editorialVersion.findMany({where:{entryId:id},orderBy:{revision:'desc'},take:100,
   select:{id:true,revision:true,action:true,actorId:true,snapshot:true,createdAt:true}});
 }
 async edit(actor:string,id:string,revision:number,topic:string,document:unknown,role:EditorialRole){
  return this.prisma.$transaction(async tx=>{
   const current=await tx.editorialEntry.findUnique({where:{id}});
   if(!current)throw new EditorialError('missing','Entry does not exist');
   mayEdit(role,current.status);
   if(current.revision!==revision)throw new EditorialError('conflict','Revision conflict: refresh the editor');
   const shape=validateEditorial(current.kind,current.slug,topic,document);
   const result=await tx.editorialEntry.updateMany({where:{id,revision,status:'DRAFT'},
    data:{topic:shape.topic,document:json(shape.document),revision:{increment:1}}});
   if(result.count!==1)throw new EditorialError('conflict','Entry was changed concurrently');
   const updated=await tx.editorialEntry.findUniqueOrThrow({where:{id}});
   await tx.editorialVersion.create({data:{entryId:id,revision:updated.revision,action:'edit',actorId:actor,snapshot:json(plain(updated))}});
   return plain(updated);
  });
 }
 async transition(actor:string,id:string,revision:number,action:EditorialAction,role:EditorialRole){
  return this.prisma.$transaction(async tx=>{
   const current=await tx.editorialEntry.findUnique({where:{id}});
   if(!current)throw new EditorialError('missing','Entry does not exist');
   if(current.revision!==revision)throw new EditorialError('conflict','Revision conflict: refresh the editor');
   const next=transitionPolicy(action,current.status,role);
   const now=new Date();
   const res=await tx.editorialEntry.updateMany({
    where:{id,revision,status:current.status},
    data:{status:next,revision:{increment:1},
     ...(next==='PUBLISHED'?{publishedAt:now}:next==='ARCHIVED'||next==='DRAFT'?{publishedAt:null}:{})}
   });
   if(res.count!==1)throw new EditorialError('conflict','Entry was changed concurrently');
   const updated=await tx.editorialEntry.findUniqueOrThrow({where:{id}});
   await tx.editorialVersion.create({data:{entryId:id,revision:updated.revision,action,actorId:actor,snapshot:json(plain(updated))}});
   return plain(updated);
  });
 }
}
