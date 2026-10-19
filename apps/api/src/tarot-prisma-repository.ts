/** Prisma infrastructure adapter: owns transaction boundaries and persisted data. */
import {Prisma} from '@prisma/client';
import type {PrismaService} from './prisma.ts';
import {TarotDomainError,limitFor} from './tarot-domain.ts';
import type {TarotReadingRepository,StoredTarotReading} from './tarot-ports.ts';

export class PrismaTarotReadingRepository implements TarotReadingRepository{
 constructor(private readonly prisma:PrismaService){}
 async reserve(input:Parameters<TarotReadingRepository['reserve']>[0]){
  return this.prisma.$transaction(async tx=>{
   // PostgreSQL user-row lock serializes this person's simultaneous quota checks.
   const lock=await tx.$queryRaw<Array<{id:string}>>`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;
   if(!lock.length)throw new TarotDomainError('account_missing','Account no longer exists');
   const user=await tx.user.findUnique({where:{id:input.userId},select:{role:true}});
   const role=user?.role||'MEMBER';
   const limit=limitFor(role);
   const used=await tx.tarotReading.count({
    where:{userId:input.userId,createdAt:{gte:input.start,lt:input.end}}
   });
   if(used>=limit)throw new TarotDomainError('daily_limit','Daily tarot limit reached');
   const drawn=input.drawCards();
   const row=await tx.tarotReading.create({
    data:{userId:input.userId,spread:input.spread,question:input.question,cards:drawn},
    select:{id:true,createdAt:true}
   });
   return {row,drawn,limit,remaining:limit-used-1,role};
  });
 }
 async history(userId:string,start:Date){
  const [user,used,readings]=await Promise.all([
   this.prisma.user.findUnique({where:{id:userId},select:{role:true}}),
   this.prisma.tarotReading.count({where:{userId,createdAt:{gte:start}}}),
   this.prisma.tarotReading.findMany({where:{userId},orderBy:{createdAt:'desc'},take:20,
    select:{id:true,createdAt:true,spread:true,question:true,cards:true,
     narrative:true,narrativeLang:true,narrativeModel:true}})
  ]);
  return {role:user?.role||null,used,readings:readings as StoredTarotReading[]};
 }
 async successfulAiCount(userId:string,start:Date){
  return this.prisma.tarotReading.count({
   where:{userId,createdAt:{gte:start},narrativeModel:{not:null}}
  });
 }
 async saveNarrative(id:string,language:'uk'|'en',model:string,reading:Parameters<TarotReadingRepository['saveNarrative']>[3]){
  await this.prisma.tarotReading.update({where:{id},data:{
   narrative:reading as unknown as Prisma.InputJsonValue,
   narrativeLang:language,narrativeModel:model
  }});
 }
 async recordAiUsage(event:Parameters<TarotReadingRepository['recordAiUsage']>[0]){
  await this.prisma.aiUsage.create({data:{
   provider:event.provider,model:event.model,operation:'tarot_reading',outcome:event.outcome,
   promptTokens:event.promptTokens,completionTokens:event.completionTokens,
   totalTokens:event.totalTokens,costUsd:event.costUsd
  }});
 }
}
