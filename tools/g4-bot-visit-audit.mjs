#!/usr/bin/env node
/** G4 read-only Caddy JSON access-log audit.
 * Example:
 *   sudo journalctl -u caddy --since "24 hours ago" -o cat | node tools/g4-bot-visit-audit.mjs --verify-openai
 * A User-Agent string alone is NEVER verified proof of bot identity.
 * Prints no IPs, query strings, paths or user identifiers.
 */
import {createInterface} from 'node:readline';
import {isIP} from 'node:net';
const UAS=['OAI-SearchBot','ChatGPT-User','Googlebot','bingbot','PerplexityBot',
 'Perplexity-User','Claude-SearchBot','Claude-User','Applebot','DuckDuckBot','Meta-WebIndexer'];
export function ipv4InCidr(ip,cidr){
 if(isIP(ip)!==4||!/^\d{1,3}(?:\.\d{1,3}){3}\/\d{1,2}$/.test(cidr))return false;
 const [net,prefixRaw]=cidr.split('/'),prefix=Number(prefixRaw);
 if(isIP(net)!==4||prefix<0||prefix>32)return false;
 const n=a=>a.split('.').reduce((v,x)=>((v<<8)|Number(x))>>>0,0);
 const mask=prefix===0?0:(0xffffffff << (32-prefix))>>>0;
 return (n(ip)&mask)===(n(net)&mask);
}
export function classifyCaddyAccess(obj,cidrs=[]){
 const req=obj?.request||{};
 const ua=Array.isArray(req.headers?.['User-Agent'])?req.headers['User-Agent'][0]:'';
 const name=UAS.find(x=>typeof ua==='string'&&ua.toLowerCase().includes(x.toLowerCase()));
 if(!name)return null;
 const uri=typeof req.uri==='string'?req.uri:'';
 const path=uri.split('?')[0];
 const isPrivate=/^\/api\/|^\/(en|uk)\/(?:account|admin|personal)(?:\/|$)/.test(path);
 const status=Number(obj?.status);
 const ip=typeof req.remote_ip==='string'?req.remote_ip:'';
 const verified=name==='OAI-SearchBot'&&cidrs.some(cidr=>ipv4InCidr(ip,cidr));
 const validStatus=Number.isInteger(status)&&status>=100&&status<600;
 return {name,verified,private:isPrivate,status:validStatus?status:0};
}
export function aggregateCaddyLog(lines,cidrs=[]){
 const summary={parsed:0,matching:0,verifiedOpenAISearchbot:0,unverifiedByUserAgent:0,
  public2xx:0,blocked403or429:0,privateRequests:0,bots:{}};
 for(const line of lines){
  let item;try{item=JSON.parse(line);}catch{continue;}
  summary.parsed++;
  const hit=classifyCaddyAccess(item,cidrs);
  if(!hit)continue;
  summary.matching++;
  if(hit.verified)summary.verifiedOpenAISearchbot++;
  else summary.unverifiedByUserAgent++;
  if(hit.private)summary.privateRequests++;
  else if(hit.status>=200&&hit.status<300)summary.public2xx++;
  if(hit.status===403||hit.status===429)summary.blocked403or429++;
  const k=hit.name;
  summary.bots[k]??={requests:0,public2xx:0,blocked:0,verified:0};
  summary.bots[k].requests++;
  if(!hit.private&&hit.status>=200&&hit.status<300)summary.bots[k].public2xx++;
  if(hit.status===403||hit.status===429)summary.bots[k].blocked++;
  if(hit.verified)summary.bots[k].verified++;
 }
 return summary;
}
async function main(){
 const verify=process.argv.includes('--verify-openai');
 let cidrs=[];
 if(verify){
  try{
   const response=await fetch('https://openai.com/searchbot.json',{signal:AbortSignal.timeout(7000)});
   if(!response.ok)throw Error(String(response.status));
   const data=await response.json();
   cidrs=(data.prefixes||[]).map(x=>x.ipv4Prefix).filter(x=>typeof x==='string'&&x.includes('/'));
   if(!cidrs.length)throw Error('empty IP list');
  }catch{console.error('OPENAI_IP_LIST_UNAVAILABLE: results remain user-agent-only (unverified)');}
 }
 const lines=[];
 for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity}))lines.push(line);
 const report=aggregateCaddyLog(lines,cidrs);
 console.log(JSON.stringify({audit:'G4_AI_CRAWLER_ACCESS',ipListFetched:cidrs.length>0,
  ...report,note:'No raw IP, request URL or personal data emitted. UA strings are spoofable; only matching official OpenAI IPv4 CIDRs count as verified OAI-SearchBot. No access logs means no evidence of visits, not proof of zero visits.'},null,2));
 if(report.parsed===0)console.error('NO_CADDY_JSON_ACCESS_LOGS: configure structured Caddy access logging before interpreting visit counts.');
}
if(process.argv[1]?.endsWith('g4-bot-visit-audit.mjs'))main().catch(e=>{console.error(e.message);process.exitCode=2;});
