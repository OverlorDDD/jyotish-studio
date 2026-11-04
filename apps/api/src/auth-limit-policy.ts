/** Test-only authentication budget override: impossible on a non-disposable CI database.
 * This never changes production's existing conservative authentication guard.
 */
export function authAttemptCeiling(env:Readonly<Record<string,string|undefined>>):number{
 let disposable=false;
 try{
  const value=new URL(env.DATABASE_URL||'');
  disposable=['postgres:','postgresql:'].includes(value.protocol)&&
   ['127.0.0.1','localhost'].includes(value.hostname)&&
   value.pathname==='/galaxiora_a1_test';
 }catch{return 60;}
 return disposable&&env.CI==='true'&&env.GALAXIORA_E2E_TEST_AUTH==='1'?600:60;
}
