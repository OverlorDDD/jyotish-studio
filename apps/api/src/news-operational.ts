/** GalaxiNews monitoring: interpret persisted dates instead of masking failures with article totals.
 * All times are UTC instants. No DB migration, personal data or external calls.
 */
export type NewsOperationalState='healthy'|'disabled'|'never_scanned'|'scan_stale'|'feed_stale'|'degraded';
export function newsOperationalHealth(input:{
 enabled:boolean;lastScanAt:Date|string|null;lastDiscoveredAt:Date|string|null;
 lastPublishedAt:Date|string|null;recentErrors?:number;
 now?:Date;scanWarnMinutes?:number;feedWarnHours?:number
}){
 const now=(input.now??new Date()).getTime();
 const time=(value:Date|string|null)=>{
  if(!value)return null;
  const n=new Date(value).getTime();
  return Number.isFinite(n)?n:null;
 };
 const scan=time(input.lastScanAt),discovered=time(input.lastDiscoveredAt),published=time(input.lastPublishedAt);
 const age=(t:number|null)=>t===null?null:Math.max(0,Math.floor((now-t)/60000));
 const scanAgeMinutes=age(scan),lastNewArticleAgeMinutes=age(discovered);
 const scanWarnMinutes=input.scanWarnMinutes??45;
 const feedWarnMinutes=(input.feedWarnHours??36)*60;
 const state:NewsOperationalState=!input.enabled?'disabled':scan===null?'never_scanned':
  scanAgeMinutes!==null&&scanAgeMinutes>scanWarnMinutes?'scan_stale':
  discovered===null||lastNewArticleAgeMinutes!==null&&lastNewArticleAgeMinutes>feedWarnMinutes?'feed_stale':
  (input.recentErrors??0)>0?'degraded':'healthy';
 return {state,generatedAt:new Date(now).toISOString(),scanAgeMinutes,lastNewArticleAgeMinutes,
  lastScanAt:scan===null?null:new Date(scan).toISOString(),
  lastNewArticleAt:discovered===null?null:new Date(discovered).toISOString(),
  latestPublisherDate:published===null?null:new Date(published).toISOString(),
  scanWarnMinutes,feedWarnHours:input.feedWarnHours??36,
  // A recent scan can be empty/duplicate-only even when the scheduler is alive.
  reason:state==='disabled'?'ingestion_disabled':state==='never_scanned'?'no_completed_scan':
   state==='scan_stale'?'scheduler_missing_or_blocked':state==='feed_stale'?'no_new_accepted_articles':
   state==='degraded'?'source_errors':'updating'};
}
