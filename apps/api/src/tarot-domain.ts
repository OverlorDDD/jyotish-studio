/** Framework-free Tarot rules. No database, NestJS, HTTP or AI SDK dependencies. */
import {SPREADS,type Spread} from './tarot-deck.ts';

export const FREE_LIMIT=3;
export const ADMIN_LIMIT=100;
export function limitFor(role:string|null|undefined){return role==='ADMIN'?ADMIN_LIMIT:FREE_LIMIT;}
export function aiLimitFor(role:string|null|undefined){return role==='ADMIN'?10:2;}
export function isTarotSpread(value:unknown):value is Spread{
 return typeof value==='string'&&Object.hasOwn(SPREADS,value);
}
export function normalizeTarotQuestion(value:string|undefined):string|null{
 const question=value?.trim()||null;
 if(question&&question.length>600)throw new TarotDomainError('question_too_long','Question too long');
 return question;
}
export function utcDayBounds(now:Date){
 const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
 return {start,end:new Date(start.getTime()+86400000)};
}
export type TarotErrorCode='invalid_spread'|'question_too_long'|'account_missing'|'daily_limit';
export class TarotDomainError extends Error{
 constructor(public readonly code:TarotErrorCode,message:string){super(message);this.name='TarotDomainError';}
}
