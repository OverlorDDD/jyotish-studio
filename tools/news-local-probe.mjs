/**
 * Test real Next.js HTML on an explicitly local IPv4 endpoint, with localhost fallback.
 * No network calls during import and no interference with backend/database.
 */
export async function probeLocalNewsFrontend(fetcher=fetch,options={}){
 const urls=options.urls||['http://127.0.0.1:3000/uk/news','http://localhost:3000/uk/news'];
 const timeoutMs=options.timeoutMs||12000;
 const attempts=[];
 for(const url of urls){
  try{
   const reply=await fetcher(url,{cache:'no-store',signal:AbortSignal.timeout(timeoutMs)});
   if(!reply.ok){attempts.push(url+' HTTP '+reply.status);continue;}
   const html=await reply.text();
   const hasRelease=html.includes('data-release="world-v1.5"');
   const hasSearch=html.includes('galaxinews-search');
   return {available:true,current:hasRelease&&hasSearch,url,hasRelease,hasSearch,attempts};
  }catch(e){
   const cause=e instanceof Error?(e.cause instanceof Error?e.cause.message:e.message):String(e);
   attempts.push(url+' '+cause.slice(0,160));
  }
 }
 return {available:false,current:false,attempts};
}
