/** Client helper: the signed-in owner's signs and saved natal charts for the
 * public horoscope tools. The server derives everything from the account's
 * saved charts, so birth details are never sent from or stored in the browser.
 * Anonymous visitors get a 401; we then skip the request for a few minutes. */
export type MySigns={status:'available'|'requires_verified_chart'|'no_chart';
 chart:{id:string;date:string;place:string;primary:boolean}|null;
 signs:{westernSun:number;vedicSun:number;moon:number;lagna:number|null;nakshatra:{index:number;name:string;pada:number}}|null;
 charts:{id:string;date:string;place:string}[]};
const ANON_KEY='gx-anon-until';
let pending:Promise<MySigns|null>|null=null;
export function loadMySigns():Promise<MySigns|null>{
 if(pending)return pending;
 try{if(Number(sessionStorage.getItem(ANON_KEY)||0)>Date.now())return Promise.resolve(null);}catch{/* storage blocked */}
 pending=fetch('/api/v1/personal/horoscope/signs',{credentials:'same-origin',cache:'no-store'})
  .then(async r=>{
   // Always drain the body: an unread 401 body keeps the request open in the browser.
   if(!r.ok){
    await r.text().catch(()=>'');
    if(r.status===401){try{sessionStorage.setItem(ANON_KEY,String(Date.now()+5*60*1000));}catch{/* ignore */}}
    return null;
   }
   return await r.json() as MySigns;
  }).catch(()=>null);
 return pending;
}
/** Call after a successful sign-in so the tools pick up the account at once. */
export function forgetAnonymous(){try{sessionStorage.removeItem(ANON_KEY);}catch{/* ignore */}pending=null;}
