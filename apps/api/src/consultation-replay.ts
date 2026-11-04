/**
 * Successful-only bounded replay + single-flight deduplication.
 * Stores calculated-fact keyed responses, never birth input or account IDs.
 */
export class SuccessfulConsultationCache<T extends {result:unknown|null}>{
 private readonly saved=new Map<string,{expires:number;outcome:T}>();
 private readonly running=new Map<string,Promise<T>>();
 private readonly ttlMs:number;
 private readonly maxEntries:number;
 private readonly now:()=>number;
 constructor(ttlMs=30*60*1000,maxEntries=40,now:()=>number=()=>Date.now()){
  this.ttlMs=ttlMs;
  this.maxEntries=maxEntries;
  this.now=now;
 }
 async obtain(key:string,work:()=>Promise<T>):Promise<{outcome:T;reused:boolean}>{
  const existing=this.saved.get(key);
  if(existing&&existing.expires>this.now())
   return {outcome:existing.outcome,reused:true};
  if(existing)this.saved.delete(key);
  const pending=this.running.get(key);
  if(pending)return {outcome:await pending,reused:true};
  const job=Promise.resolve().then(work).then(result=>{
   if(result.result){
    // TTL is measured from successful completion, not the initial request.
    for(const [k,v] of this.saved)if(v.expires<=this.now())this.saved.delete(k);
    if(this.saved.size>=this.maxEntries)this.saved.delete(this.saved.keys().next().value!);
    this.saved.set(key,{expires:this.now()+this.ttlMs,outcome:result});
   }
   return result;
  }).finally(()=>this.running.delete(key));
  this.running.set(key,job);
  return {outcome:await job,reused:false};
 }
}
