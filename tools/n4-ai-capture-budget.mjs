/** Limit actual opt-in SYNTHETIC editor API attempts across the entire batch. */
export function createN4SyntheticCaptureBudget(max=2,globalPermit=()=>true){
 if(!Number.isInteger(max)||max<1||max>2||typeof globalPermit!=='function')
  throw Error('Synthetic audit has a strict 1-2 total-attempt cap');
 let used=0;
 const limit=()=>{
  if(used>=max)return false;
  if(!globalPermit())return false;
  used++;
  return true;
 };
 return Object.freeze({limit,used:()=>used});
}
