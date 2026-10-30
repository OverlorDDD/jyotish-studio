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
