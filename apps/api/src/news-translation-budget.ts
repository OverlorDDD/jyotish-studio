/** Durable Azure news-translation budget. Counts all reserved input characters
 * before outbound requests; failed/transient calls remain conservatively spent.
 * Not a substitute for Azure F0 resource quota or Azure cost alerts.
 */
import type {PrismaService} from './prisma.ts';

export const DEFAULT_NEWS_AZURE_MONTHLY_CHARS=100_000;
const MAX_OPERATOR_BUDGET=1_800_000; // below F0 2,000,000/month

export class NewsTranslationBudgetExceeded extends Error{
 constructor(public readonly period:string,public readonly limit:number){
  super('Azure monthly news character budget exhausted: '+period+' (limit '+limit+')');
  this.name='NewsTranslationBudgetExceeded';
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
 if(characters===0)return {period,limit,reserved:0};
 if(characters>limit)throw new NewsTranslationBudgetExceeded(period,limit);
 await db.newsTranslationUsage.upsert({where:{period},
  create:{period,characters:0},update:{}});
 const changed=await db.newsTranslationUsage.updateMany({
  where:{period,characters:{lte:limit-characters}},
  data:{characters:{increment:characters}}
 });
 if(changed.count!==1)throw new NewsTranslationBudgetExceeded(period,limit);
 return {period,limit,reserved:characters};
}
