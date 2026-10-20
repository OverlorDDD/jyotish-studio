/** Read-only public CMS boundary, server-side. No Prisma dependency in Next.js. */
export type Locale='uk'|'en';
export type Both={uk:string;en:string};
export type PublishedContent={kind:'ACADEMY'|'YOGA';slug:string;topic:string;publishedAt:string;
 document:{title:Both;summary:Both;body:Both;safety?:Both;
 quiz?:{question:Both;choices:[Both,Both,Both];correct:0|1|2;explanation:Both}}};
const origin=()=>process.env.INTERNAL_API_ORIGIN||'http://127.0.0.1:4000';
const timeout=2500;
function isContent(value:unknown):value is PublishedContent{
 if(!value||typeof value!=='object')return false;
 const item=value as Partial<PublishedContent>;
 return (item.kind==='ACADEMY'||item.kind==='YOGA')&&
 typeof item.slug==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)&&
 typeof item.document?.title?.uk==='string'&&typeof item.document?.title?.en==='string';
}
export async function publishedList(kind:'ACADEMY'|'YOGA'):Promise<PublishedContent[]>{
 try{
  const res=await fetch(origin()+'/api/v1/content?kind='+kind,{cache:'no-store',signal:AbortSignal.timeout(timeout)});
  if(!res.ok)return [];
  const data:unknown=await res.json();
  return Array.isArray(data)?data.filter(isContent).filter(e=>e.kind===kind).slice(0,100):[];
 }catch{return [];}
}
export async function publishedDetail(kind:'ACADEMY'|'YOGA',slug:string):Promise<PublishedContent|null>{
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80)return null;
 try{
  const res=await fetch(origin()+'/api/v1/content/'+kind+'/'+slug,{cache:'no-store',signal:AbortSignal.timeout(timeout)});
  if(!res.ok)return null;
  const data:unknown=await res.json();
  return isContent(data)&&data.kind===kind&&data.slug===slug?data:null;
 }catch{return null;}
}
