/** Public C5 growth rules. No paid privileges in posting, voting, moderation or rankings. */
export const FREE_BOOKMARK_LIMIT=20,PREMIUM_BOOKMARK_LIMIT=200;
export const PREMIUM_ACCENTS=['default','gold','violet','teal'] as const;
export type PremiumAccent=(typeof PREMIUM_ACCENTS)[number];
export function bookmarkCapacity(premium:boolean){return premium?PREMIUM_BOOKMARK_LIMIT:FREE_BOOKMARK_LIMIT;}
export function reputationLevel(count:number):'NEW'|'ACTIVE'|'HELPFUL'|'GUIDE'{
 if(count>=25)return 'GUIDE';
 if(count>=10)return 'HELPFUL';
 if(count>=3)return 'ACTIVE';
 return 'NEW';
}
export function visibleGrowthProfile(input:{signature:string|null;accent:string},premium:boolean){
 return {signature:(input.signature||'').slice(0,premium?280:80),
  accent:premium&&PREMIUM_ACCENTS.includes(input.accent as PremiumAccent)?input.accent:'default'};
}
