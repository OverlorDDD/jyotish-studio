/** Convert every API response into JSON or a safe, actionable error.
 * Never display arbitrary HTML/plaintext returned by proxies or providers. */
export async function readApiJson<T>(response:Response):Promise<T>{
 const raw=await response.text();
 let parsed:unknown;
 try{parsed=JSON.parse(raw);}catch{parsed=null;}
 const body=parsed!==null&&typeof parsed==='object'&&!Array.isArray(parsed)
  ?parsed as Record<string,unknown>:null;
 if(!response.ok){
  const fromApi=body?.message;
  const message=typeof fromApi==='string'?fromApi:
   Array.isArray(fromApi)&&fromApi.every(x=>typeof x==='string')?fromApi.join('; '):'';
  const generic=message&&message!=='Internal Server Error'?message:null;
  const fallback=response.status>=500
   ?'The server or Next.js proxy failed. Check the Next.js and NestJS terminal logs.'
   :'The request was rejected. Check your input or demo login.';
  throw new Error(`API HTTP ${response.status}: ${(generic||fallback).slice(0,250)}`);
 }
 if(parsed===null||typeof parsed!=='object')throw new Error(`API HTTP ${response.status}: expected JSON but received an invalid response. Check server logs.`);
 // Success responses may be either a JSON object or a list (saved chart history).
 return parsed as T;
}
