/** Download the exact 78 pinned RWS scans into this app's static public directory.
 * Optional for online preview (remote fallback), recommended for stable and private hosting. */
import {mkdir,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const BASE='https://raw.githubusercontent.com/mixvlad/TarotCards/840b84d012c6b74dc1634fa2d00d1b21f5b28093/tarot/rider-waite/720px/';
const out=join(process.cwd(),'apps','web','public','tarot','rws');
const majors=['00_Fool','01_Magician','02_High_Priestess','03_Empress','04_Emperor','05_Hierophant','06_Lovers','07_Chariot','08_Strength','09_Hermit','10_Wheel_of_Fortune','11_Justice','12_Hanged_Man','13_Death','14_Temperance','15_Devil','16_Tower','17_Star','18_Moon','19_Sun','20_Judgement','21_World'].map(x=>x+'.jpg');
const suits=['Wands','Cups','Swords','Pents'].flatMap(s=>Array.from({length:14},(_,i)=>s+String(i+1).padStart(2,'0')+'.jpg'));
const files=[...majors,...suits];
if(files.length!==78||new Set(files).size!==78)throw new Error('Expected exactly 78 unique cards');
await mkdir(out,{recursive:true});
let updated=0,skipped=0,failed=[];
async function get(file){
 const destination=join(out,file);
 try{
  const old=await stat(destination);
  if(old.size>4000){skipped++;return;}
 }catch{}
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(BASE+file,{signal:AbortSignal.timeout(18000)});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const data=Buffer.from(await response.arrayBuffer());
   if(data.length<4000||data[0]!==0xff||data[1]!==0xd8||data.at(-2)!==0xff||data.at(-1)!==0xd9)throw new Error('Not valid JPEG');
   await writeFile(destination,data);updated++;return;
  }catch(e){
   if(attempt===2){failed.push(file+': '+String(e));return;}
  }
 }
}
for(let i=0;i<files.length;i+=6)await Promise.all(files.slice(i,i+6).map(get));
console.log('RWS images: downloaded '+updated+', retained '+skipped+', expected '+files.length);
if(failed.length){console.error(failed.join('\n'));process.exitCode=1;}
else console.log('All 78 classic cards ready under apps/web/public/tarot/rws.');
