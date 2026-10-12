import {existsSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
/** Zero-dependency development fallback. Run with `npm run dev` on Node 22+.
 * Real NestJS API is in main.ts and is used by `npm run dev:full` after npm install. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {runCalculation,interpretChart} from './logic.ts';
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../');
const maxSize=15000;
const charts=new Map<string,CalculatedChart>();
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const send=(res:any,status:number,payload:unknown)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'http://localhost:3000'});res.end(JSON.stringify(payload));};
async function readBody(req:any){let body='';for await(const buf of req){body+=buf.toString();if(body.length>maxSize)throw new Error('Request too large');}return JSON.parse(body);}
const server=createServer(async(req,res)=>{
 const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
 if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'http://localhost:3000','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});return res.end();}
 try{
  if(url.pathname==='/api/health')return send(res,200,{status:'ok',service:'jyotish-standalone',chartsInMemory:charts.size});
  if(req.method==='POST'&&url.pathname==='/api/v1/charts/calculate'){
   const chart=await runCalculation(await readBody(req));const id=crypto.randomUUID();charts.set(id,chart);
   if(charts.size>50)charts.delete(charts.keys().next().value!);
   return send(res,200,{id,...chart});
  }
  const idMatch=url.pathname.match(/^\/api\/v1\/charts\/([a-f0-9-]+)$/);
  if(idMatch&&req.method==='GET'){const chart=charts.get(idMatch[1]);return send(res,chart?200:404,chart||{error:'Not found'});}
  if(url.pathname==='/api/v1/interpretations'&&req.method==='POST'){
   const {id,lang}=await readBody(req);const chart=charts.get(id);if(!chart)return send(res,404,{error:'Chart not found / restart cleared temporary history'});
   return send(res,200,await interpretChart(chart,lang==='uk'?'uk':'en'));
  }
  const files:Record<string,string>={'/':'apps/web/public/demo.html','/demo.css':'apps/web/public/demo.css','/demo.js':'apps/web/public/demo.js'};
  if(req.method==='GET'&&files[url.pathname]){
   const ext=url.pathname.split('.').pop();const mimeType=ext==='css'?'text/css':ext==='js'?'text/javascript':'text/html';
   res.writeHead(200,{'Content-Type':mimeType+'; charset=utf-8','Cache-Control':'no-store'});return res.end(await readFile(resolve(root,files[url.pathname])));
  }
  return send(res,404,{error:'Not found'});
 }catch(error){return send(res,400,{error:error instanceof Error?error.message:String(error)});}
});
const port=Number(process.env.PORT||4000);
server.listen(port,'127.0.0.1',()=>console.log(`Jyotish Studio standalone ready: http://localhost:${port}`));
