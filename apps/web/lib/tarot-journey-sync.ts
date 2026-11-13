/** Keeps the Tarot journey of a signed-in member in their private profile.
 * Same-origin calls only; guests get a 401 and keep the browser-only journey. */
import {localDay,mergeJourney,readJourney,writeJourney,type ServerJourney} from './tarot-journey';

export const JOURNEY_EVENT='galaxiora:tarot-journey';
function publish(){window.dispatchEvent(new Event(JOURNEY_EVENT));}

/** Pull the profile journey and merge it in. A card of the day drawn as a guest earlier today
 * is uploaded once, so signing in never loses today's card. Returns true when signed in. */
export async function syncTarotJourney():Promise<boolean>{
 try{
  const response=await fetch('/api/v1/tarot/journey',{credentials:'same-origin',cache:'no-store'});
  if(response.status===401){
   const local=readJourney();
   if(local.profile){writeJourney({...local,profile:false});publish();}
   return false;
  }
  if(!response.ok)return false;
  let server=await response.json() as ServerJourney;
  const today=localDay(),local=readJourney();
  if(local.daily?.date===today&&!server.daily.some(d=>d.date===today)){
   const saved=await saveDailyCard(local.daily);
   if(saved)server=saved;
  }
  writeJourney(mergeJourney(readJourney(),server,today));
  publish();
  return true;
 }catch{return false;}
}
/** Save today's card in the profile. Returns the profile journey, or null for guests / errors. */
export async function saveDailyCard(card:{date:string;id:string;reversed:boolean}):Promise<ServerJourney|null>{
 try{
  const response=await fetch('/api/v1/tarot/journey/daily',{method:'POST',credentials:'same-origin',
   headers:{'Content-Type':'application/json'},body:JSON.stringify(card)});
  if(!response.ok)return null;
  return await response.json() as ServerJourney;
 }catch{return null;}
}
