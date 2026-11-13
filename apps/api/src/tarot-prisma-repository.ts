/** Prisma infrastructure adapter: owns transaction boundaries and persisted data. */
import {Prisma} from '@prisma/client';
import type {PrismaService} from './prisma.ts';
import {TarotDomainError,limitFor} from './tarot-domain.ts';
import type {DailyTarotCard,DrawnCard,TarotReadingRepository,StoredTarotReading} from './tarot-ports.ts';

/** Cards of the day reuse TarotReading (spread is a plain string column): no schema change.
 * They never count toward the spread quota and never appear in the reading journal. */
export const DAILY_SPREAD='daily';
function dailyFrom(row:{cards:unknown;narrative:unknown}):DailyTarotCard|null{
 const meta=row.narrative as {kind?:unknown;date?:unknown}|null;
 const card=(row.cards as DrawnCard[]|null)?.[0];
 if(!meta||meta.kind!=='daily'||typeof meta.date!=='string'||!card||typeof card.id!=='string')return null;
 return {date:meta.date,id:card.id,reversed:card.reversed===true};
}

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
    where:{userId:input.userId,spread:{not:DAILY_SPREAD},createdAt:{gte:input.start,lt:input.end}}
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
   this.prisma.tarotReading.count({where:{userId,spread:{not:DAILY_SPREAD},createdAt:{gte:start}}}),
   this.prisma.tarotReading.findMany({where:{userId,spread:{not:DAILY_SPREAD}},orderBy:{createdAt:'desc'},take:20,
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
 async journey(userId:string){
  const [daily,spreads]=await Promise.all([
   this.prisma.tarotReading.findMany({where:{userId,spread:DAILY_SPREAD},orderBy:{createdAt:'desc'},take:400,select:{cards:true,narrative:true}}),
   this.prisma.tarotReading.findMany({where:{userId,spread:{not:DAILY_SPREAD}},orderBy:{createdAt:'desc'},take:300,select:{cards:true}})
  ]);
  return {daily:daily.map(dailyFrom).filter((d):d is DailyTarotCard=>!!d),
   spreads:spreads.map(r=>Array.isArray(r.cards)?r.cards as DrawnCard[]:[])};
 }
 async saveDaily(userId:string,card:DailyTarotCard){
  return this.prisma.$transaction(async tx=>{
   // Same per-user row lock as spreads: two devices drawing at once still get one card.
   const lock=await tx.$queryRaw<Array<{id:string}>>`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
   if(!lock.length)throw new TarotDomainError('account_missing','Account no longer exists');
   const recent=await tx.tarotReading.findMany({where:{userId,spread:DAILY_SPREAD},orderBy:{createdAt:'desc'},take:5,select:{cards:true,narrative:true}});
   const existing=recent.map(dailyFrom).find(d=>d?.date===card.date);
   if(existing)return existing;
   await tx.tarotReading.create({data:{userId,spread:DAILY_SPREAD,question:null,
    cards:[{id:card.id,position:0,reversed:card.reversed}],
    narrative:{kind:'daily',date:card.date} as Prisma.InputJsonValue}});
   return card;
  });
 }
}
