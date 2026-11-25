/** Durable Azure news-translation budget. Counts all reserved input characters
 * before outbound requests; failed/transient calls remain conservatively spent.
 * Not a substitute for Azure F0 resource quota or Azure cost alerts.
 */
import type {PrismaService} from './prisma.ts';

export const DEFAULT_NEWS_AZURE_MONTHLY_CHARS=100_000;
const MAX_OPERATOR_BUDGET=1_800_000; // below F0 2,000,000/month

/** The translator may spend only the share of the monthly cap accrued by UTC time.
 * Unused capacity carries forward; it never borrows from future days. This
 * deliberately needs no new database table: the existing atomic monthly meter
 * enforces the tighter ceiling across all API workers. */
export function utcNewsAccruedCharCeiling(date:Date,monthlyLimit:number):number{
 if(Number.isNaN(date.getTime())||!Number.isSafeInteger(monthlyLimit)||monthlyLimit<1)
  throw Error('Invalid UTC news budget pacing input');
 const year=date.getUTCFullYear(),month=date.getUTCMonth();
 const start=Date.UTC(year,month,1),end=Date.UTC(year,month+1,1);
 return Math.min(monthlyLimit,Math.floor(monthlyLimit*((date.getTime()-start)/(end-start))));
}

export class NewsTranslationBudgetExceeded extends Error{
 readonly period:string;
 readonly limit:number;
 constructor(period:string,limit:number){
  super('Azure monthly news character budget exhausted: '+period+' (limit '+limit+')');
  this.name='NewsTranslationBudgetExceeded';
  this.period=period;
  this.limit=limit;
 }
}

export class NewsTranslationPaceExceeded extends NewsTranslationBudgetExceeded{
 readonly availableCeiling:number;
 constructor(period:string,monthlyLimit:number,availableCeiling:number){
  super(period,monthlyLimit);
  this.name='NewsTranslationPaceExceeded';
  this.message='Azure news budget paced until more UTC month capacity accrues: '+period;
  this.availableCeiling=availableCeiling;
 }
}

export function azureNewsMonthlyCharLimit(env:NodeJS.ProcessEnv=process.env):number{
 const raw=env.NEWS_AZURE_MONTHLY_CHAR_LIMIT;
 if(!raw)return DEFAULT_NEWS_AZURE_MONTHLY_CHARS;
 if(!/^\d+$/.test(raw))throw Error('NEWS_AZURE_MONTHLY_CHAR_LIMIT must be an integer');
 const value=Number(raw);
 if(!Number.isSafeInteger(value)||value<1||value>MAX_OPERATOR_BUDGET)
  throw Error('NEWS_AZURE_MONTHLY_CHAR_LIMIT must be between 1 and '+MAX_OPERATOR_BUDGET);
 return value;
}
export function utcTranslationPeriod(date=new Date()):string{
 if(Number.isNaN(date.getTime()))throw Error('Invalid UTC date');
 return date.toISOString().slice(0,7);
}
type Meter = Pick<PrismaService,'newsTranslationUsage'>;

/** Idempotent row creation and atomic conditional increment protect multiple
 * Nest workers sharing one PostgreSQL. Reservations are NOT refunded if the
 * translation API fails, preventing accidental overuse during retries. */
export async function reserveAzureNewsCharacters(db:Meter,characters:number,now=new Date(),env:NodeJS.ProcessEnv=process.env){
 if(!Number.isSafeInteger(characters)||characters<0)throw Error('Invalid news translation character reservation');
 const limit=azureNewsMonthlyCharLimit(env),period=utcTranslationPeriod(now);
 // Pacing is on by default. The opt-out is for explicit operational recovery;
 // normal production keeps it enabled and retains its existing hard monthly cap.
 const paced=env.NEWS_AZURE_PACING_ENABLED!=='0';
 const ceiling=paced?utcNewsAccruedCharCeiling(now,limit):limit;
 if(characters===0)return {period,limit,ceiling,reserved:0};
 if(characters>limit)throw new NewsTranslationBudgetExceeded(period,limit);
 if(characters>ceiling)throw new NewsTranslationPaceExceeded(period,limit,ceiling);
 await db.newsTranslationUsage.upsert({where:{period},
  create:{period,characters:0},update:{}});
 const changed=await db.newsTranslationUsage.updateMany({
  where:{period,characters:{lte:ceiling-characters}},
  data:{characters:{increment:characters}}
 });
 if(changed.count!==1){
  if(paced&&ceiling<limit)throw new NewsTranslationPaceExceeded(period,limit,ceiling);
  throw new NewsTranslationBudgetExceeded(period,limit);
 }
 return {period,limit,ceiling,reserved:characters};
}
