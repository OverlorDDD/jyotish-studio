/** P3.8.8 EC2 safety: ONE expensive 7/30-day Swiss Time Finder per API process.
 * All users retain the existing per-owner hourly limit. This is a shared
 * in-process gate, not a distributed lock across multiple NestJS replicas.
 * We explicitly fail busy rather than silently queue unbounded native work.
 */
let active=0;
export function acquireP388TimeFinder():()=>void{
 if(active!==0)throw Error('P388_TIME_FINDER_BUSY');
 active=1;
 let released=false;
 return ()=>{
  if(released)throw Error('P388 Time Finder capacity released twice');
  released=true;active=0;
 };
}
