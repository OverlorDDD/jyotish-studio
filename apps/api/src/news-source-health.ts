/** Pure source retry policy; a bad public feed must not stall every 15-minute scan. */
export function sourceCooldownMs(reason:string,failures=1){
 const message=String(reason).toLowerCase();
 if(/\bhttp (?:404|410)\b/.test(message))return 24*60*60*1000;
 if(/\bhttp 403\b/.test(message))return 12*60*60*1000;
 if(/\bhttp 429\b|rate.?limit|limit requests/.test(message))return 60*60*1000;
 if(/\bhttp 5\d\d\b/.test(message))return 45*60*1000;
 if(/timeout|aborted|fetch failed|econnreset|enotfound|econnrefused/.test(message))
  return Math.min(3*60*60*1000,(30*60*1000)*Math.max(1,failures));
 return 30*60*1000;
}
export function gdeltCircuitFailure(reason:string){
 return /timeout|aborted|fetch failed|http 429|http 5\d\d|rate.?limit|unexpected content type|non-json/i.test(reason);
}

/** Rehydrate the latest source backoffs after systemd restart using existing
 * newsSourceScan audit rows. Avoid hammering providers just because we deployed.
 * This is deliberately fail-open for healthy/expired sources and requires no migration.
 */
export function sourceRetryStateFromHistory(rows:readonly {
 sourceKey:string;status:string;failure:string|null;createdAt:Date|string
}[],nowMs=Date.now()){
 const seen=new Set<string>(),retryUntil=new Map<string,number>();let gdeltRetryUntil=0;
 for(const row of rows){
  if(seen.has(row.sourceKey))continue;
  seen.add(row.sourceKey);
  let until=0;
  if(row.status==='error'&&row.failure){
   const date=new Date(row.createdAt).getTime();
   if(Number.isFinite(date))until=date+sourceCooldownMs(row.failure,1);
  }else if(row.status==='cooldown'&&row.failure?.startsWith('Retry after ')){
   const date=Date.parse(row.failure.slice('Retry after '.length));
   if(Number.isFinite(date))until=date;
  }
  if(until>nowMs){
   retryUntil.set(row.sourceKey,until);
   if(row.sourceKey.startsWith('gdelt-'))gdeltRetryUntil=Math.max(gdeltRetryUntil,until);
  }
 }
 return {retryUntil,gdeltRetryUntil};
}
