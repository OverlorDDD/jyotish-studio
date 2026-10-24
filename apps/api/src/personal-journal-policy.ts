/** A9.2 pure private-journal policy — unit tested without a database or Nest. */
export const PRACTICE_SLUGS=['gentle-breath','desk-mobility','five-senses','evening-unwind'] as const;
export const JOURNAL_KINDS=['TAROT','CHART','PRACTICE'] as const;
export type JournalKind=(typeof JOURNAL_KINDS)[number];
type Counter={count(args:{where:Record<string,string>}):Promise<number>};
export type JournalReferenceLookup={tarotReading:Counter;chart:Counter};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isPublishedPractice(slug:string):boolean{
 return (PRACTICE_SLUGS as readonly string[]).includes(slug);
}
export function normalizedJournalText(value:unknown):string|null{
 if(typeof value!=='string')return null;
 const note=value.trim();
 return note&&note.length<=2000?note:null;
}
export async function ownsJournalReference(
 db:JournalReferenceLookup,userId:string,kind:JournalKind,ref:string
):Promise<boolean>{
 if(kind==='PRACTICE')return isPublishedPractice(ref);
 if(!UUID.test(ref))return false;
 if(kind==='TAROT')return (await db.tarotReading.count({where:{id:ref,userId}}))===1;
 if(kind==='CHART')return (await db.chart.count({where:{id:ref,ownerId:userId}}))===1;
 return false;
}
