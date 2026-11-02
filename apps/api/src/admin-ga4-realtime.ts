/**
 * Admin-only GA4 Data API reader. No client-side secrets, no user identity fields,
 * and no database changes. Real-time is Google's consented 30-minute users,
 * NOT the count of registered accounts in PostgreSQL.
 */
import {readFile} from 'node:fs/promises';
import {sign} from 'node:crypto';

export type Ga4Traffic={
 status:'ok'|'not_configured'|'unavailable';
 activeUsers30m:number|null;
 generatedAt:string;
 provider:'ga4_data_api';
 message?:string;
};
type ServiceKey={type?:string;client_email?:string;private_key?:string};
let tokenCache:{token:string;until:number}|null=null;
let cached:{data:Ga4Traffic;until:number}|null=null;
const output=(status:Ga4Traffic['status'],activeUsers30m:number|null,message?:string):Ga4Traffic=>({
 status,activeUsers30m,generatedAt:new Date().toISOString(),provider:'ga4_data_api',...(message?{message}:{})
});
const b64=(x:object)=>Buffer.from(JSON.stringify(x)).toString('base64url');
function config(){
 const propertyId=process.env.GA4_PROPERTY_ID?.trim()||'';
 const keyFile=process.env.GA4_SERVICE_ACCOUNT_KEY_FILE?.trim()||'';
 if(!propertyId&&!keyFile)return null;
 if(!/^\d{4,20}$/.test(propertyId)||!keyFile.startsWith('/'))
  throw new Error('Invalid GA4 server credentials configuration');
 return {propertyId,keyFile};
}
export function ga4RealtimeConfigStatus(): 'configured'|'not_configured'|'invalid'{
 try{return config()?'configured':'not_configured'}catch{return 'invalid'}
}
async function token(keyFile:string):Promise<string>{
 if(tokenCache&&tokenCache.until>Date.now()+120000)return tokenCache.token;
 // Never interpolate a user-provided Google Cloud endpoint or external hostname.
 const key=JSON.parse(await readFile(keyFile,'utf8')) as ServiceKey;
 if(key.type!=='service_account'||!key.client_email?.endsWith('.gserviceaccount.com')||
  !key.private_key?.includes('BEGIN PRIVATE KEY'))throw Error('Invalid service account key');
 const now=Math.floor(Date.now()/1000);
 const payload=b64({iss:key.client_email,scope:'https://www.googleapis.com/auth/analytics.readonly',
  aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3300});
 const assertion=b64({alg:'RS256',typ:'JWT'})+'.'+payload;
 const signature=sign('RSA-SHA256',Buffer.from(assertion),key.private_key).toString('base64url');
 const body=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:assertion+'.'+signature});
 const response=await fetch('https://oauth2.googleapis.com/token',{
  method:'POST',body,signal:AbortSignal.timeout(7000),
  headers:{'Content-Type':'application/x-www-form-urlencoded'}
 });
 if(!response.ok)throw Error('GA4 OAuth token unavailable');
 const data=await response.json() as {access_token?:string;expires_in?:number};
 if(!data.access_token||typeof data.expires_in!=='number')throw Error('GA4 OAuth token malformed');
 tokenCache={token:data.access_token,until:Date.now()+Math.min(data.expires_in,3300)*1000};
 return data.access_token;
}
export function parseRealtimeActiveUsers(body:unknown):number{
 if(!body||typeof body!=='object')throw Error('Invalid realtime response');
 const rows=(body as {rows?:{metricValues?:{value?:string}[]}[]}).rows;
 if(rows===undefined)return 0; // An empty report means zero active users, not missing credentials
 if(!Array.isArray(rows)||rows.length>1)throw Error('Unexpected realtime response');
 if(rows.length===0)return 0;
 const raw=rows[0]?.metricValues?.[0]?.value;
 const n=Number(raw);
 if(typeof raw!=='string'||!Number.isSafeInteger(n)||n<0)throw Error('Invalid activeUsers metric');
 return n;
}
export async function readGa4Realtime():Promise<Ga4Traffic>{
 let cfg:ReturnType<typeof config>;
 try{cfg=config()}catch{return output('unavailable',null,'invalid_server_configuration')}
 if(!cfg)return output('not_configured',null,'connect_ga4_data_api');
 if(cached&&cached.until>Date.now())return cached.data;
 try{
  const bearer=await token(cfg.keyFile);
  const response=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+cfg.propertyId+':runRealtimeReport',{
   method:'POST',signal:AbortSignal.timeout(9000),
   headers:{Authorization:'Bearer '+bearer,'Content-Type':'application/json'},
   body:JSON.stringify({metrics:[{name:'activeUsers'}]})
  });
  if(!response.ok)throw Error('GA4 Data API returned HTTP '+response.status);
  const count=parseRealtimeActiveUsers(await response.json());
  const data=output('ok',count);
  cached={data,until:Date.now()+30000};
  return data;
 }catch{
  // Generic error only. OAuth tokens, private keys, and Google error bodies never reach browser/logs.
  const data=output('unavailable',null,'verify_ga4_api_permissions');
  cached={data,until:Date.now()+15000};
  return data;
 }
}
