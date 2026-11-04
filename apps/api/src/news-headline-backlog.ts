/** Shared non-destructive classification of public bilingual headline debt.
 * A native, safe English source title is already a valid English public title;
 * titleEn may legitimately be null. This module performs NO network/DB writes.
 */
import {isLocalizedNewsTitle,publicTitleForLocale} from './news-localization.ts';
export type HeadlineDebtRow={
 title:string;titleUk?:string|null;titleEn?:string|null;
 editorialAttempts?:number|null;editorialNextAttemptAt?:Date|string|null;
};
export const NEWS_HEADLINE_RETRY_LIMIT=6;
export function headlineNeedsWork(row:HeadlineDebtRow):boolean{
 return !publicTitleForLocale(row,'uk')||!publicTitleForLocale(row,'en');
}
export function headlineDebtState(row:HeadlineDebtRow,now=new Date()){
 const needsUk=!publicTitleForLocale(row,'uk');
 const needsEn=!publicTitleForLocale(row,'en');
 const needsWork=needsUk||needsEn;
 const attempts=row.editorialAttempts??0;
 const retry=row.editorialNextAttemptAt==null?null:new Date(row.editorialNextAttemptAt);
 const waiting=needsWork&&retry!==null&&!Number.isNaN(retry.getTime())&&retry.getTime()>now.getTime();
 return {needsUk,needsEn,needsWork,attempts,
  state:!needsWork?'ready':attempts>=NEWS_HEADLINE_RETRY_LIMIT?'manual_review':waiting?'cooldown':'eligible',
  nextAttemptAt:retry&&!Number.isNaN(retry.getTime())?retry.toISOString():null};
}
export function headlineDebtSummary(rows:readonly HeadlineDebtRow[],now=new Date()){
 const out={sampled:rows.length,ready:0,missingUk:0,missingEn:0,
  eligible:0,cooldown:0,manualReview:0};
 for(const row of rows){
  const s=headlineDebtState(row,now);
  if(s.needsUk)out.missingUk++;
  if(s.needsEn)out.missingEn++;
  if(s.state==='ready')out.ready++;
  else if(s.state==='eligible')out.eligible++;
  else if(s.state==='cooldown')out.cooldown++;
  else out.manualReview++;
 }
 return out;
}
