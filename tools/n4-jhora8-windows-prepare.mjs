#!/usr/bin/env node
/** N4.12 50 deterministic synthetic JHD INPUTS for genuine JHora8 on owner Windows.
 * NOT JHora output or mathematical certification. JHD layout from pinned
 * normalmystic/JHoraKit JHDBuilder.swift (MIT) tested against first case. */
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const N4_JHORA_INPUT_VERSION='n4-jhora8-50-synthetic-inputs-v2-decimal-minutes';
const hash=b=>createHash('sha256').update(b).digest('hex');
const banker=x=>{if(!Number.isFinite(x))throw Error('Non-finite JHD numeric input');
 const i=Math.floor(x),f=x-i;return f<.5-1e-8?i:f>.5+1e-8?i+1:i%2===0?i:i+1;};
/**
 * Original JHora8 GUI #002 proves D.MMmmmm uses decimal arcMINUTES.
 * Prior JHoraKit-style D.MMSS00 encoded 143.93° as 143.554800,
 * which original JHora interpreted as 143°55′29″, not intended 55′48″.
 * New 143.558000 encodes exactly 55.8000 decimal arcminutes.
 * Source case #001 uses whole-degree coords and remains unchanged.
 * NEVER silently overwrite existing v1 synthetic archives.
 */
const dmmff=(x,eastNeg=false)=>{
 if(!Number.isFinite(x))throw Error('Invalid JHD coordinate');
 const abs=Math.abs(x);
 let deg=Math.floor(abs),packed=banker((abs-deg)*60*10000);
 if(packed>=600000){deg++;packed=0;}
 const sign=eastNeg?(x>=0?'-':''):(x<0?'-':'');
 return sign+String(deg)+'.'+String(packed).padStart(6,'0');
};
const tzDmmff=x=>{if(!Number.isFinite(x))throw Error('Invalid JHD time zone');
 const a=Math.abs(x),h=Math.trunc(a),m=banker((a-h)*60);
 return (x>=0?'-':'')+String(h)+'.'+String(m).padStart(2,'0')+'0000';};
export function n4SyntheticJHoraCase(i){
 if(!Number.isInteger(i)||i<0||i>=50)throw Error('Case number must be 0..49');
 const year=1990+i%30,month=1+i%12,day=5+i%20,h=(i*7+5)%24,m=(i*13+11)%60;
 return Object.freeze({id:'N4-SYNTH-'+String(i+1).padStart(3,'0'),
  date:[year,String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-'),
  time:String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'),
  latitude:Number((-48+i*1.91).toFixed(4)),longitude:Number((-150+i*6.07).toFixed(4)),
  timezoneHours:i%19-9,place:'Synthetic Reference City',synthetic:true});
}
export function n4JhdContent(c){
 if(c?.synthetic!==true||!/^N4-SYNTH-\d{3}$/.test(c.id))throw Error('Synthetic-only JHD');
 const [year,month,day]=c.date.split('-').map(Number),[h,m]=c.time.split(':').map(Number),tz=tzDmmff(c.timezoneHours);
 return [month,day,year,(h+m/100).toFixed(6),tz,dmmff(c.longitude,true),
  dmmff(c.latitude,false),'0.000000',tz,tz,'0','0',c.id,c.place,
  '1','1013.250000','20.000000','0'].join('\n');
}
export function prepareN4JHoraInputCorpus(folder){
 const target=resolve(folder);
 if(target===resolve(process.cwd()))throw Error('Synthetic corpus cannot be working directory');
 mkdirSync(join(target,'cases'),{recursive:true});
 const cases=[];
 for(let i=0;i<50;i++){
  const c=n4SyntheticJHoraCase(i),raw=n4JhdContent(c),path=join(target,'cases',c.id+'.jhd');
  if(existsSync(path)){if(readFileSync(path,'utf8')!==raw)throw Error('Existing JHD differs: '+c.id);}
  else writeFileSync(path,raw,{flag:'wx',mode:0o600});
  cases.push({...c,jhdFile:'cases/'+c.id+'.jhd',jhdSha256:hash(raw)});
 }
 const manifest={generator:N4_JHORA_INPUT_VERSION,source:'Galaxiora 50 D1 synthetic cases',
  originalJHoraCertificate:false,expectedCases:50,
  methodProfile:'UNALIGNED_UNTIL_ORIGINAL_JHORA_GUI_AND_INI_PROVENANCE',cases};
 const file=join(target,'synthetic-input-manifest.json'),json=JSON.stringify(manifest,null,2)+'\n';
 if(existsSync(file)){if(readFileSync(file,'utf8')!==json)throw Error('Changed manifest; cannot overwrite');}
 else writeFileSync(file,json,{flag:'wx',mode:0o600});
 return Object.freeze({folder:target,manifest:file,caseCount:cases.length,
  first:cases[0],hashSha256:hash(json)});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const i=process.argv.indexOf('--output');
 if(i<0||!process.argv[i+1])throw Error('Usage: node tools/n4-jhora8-windows-prepare.mjs --output ABSOLUTE_DIRECTORY');
 console.log(JSON.stringify(prepareN4JHoraInputCorpus(process.argv[i+1]),null,2));
 console.log('N4_JHORA_50_SYNTHETIC_INPUTS_READY; ORIGINAL_OUTPUTS_NOT_YET_CAPTURED');
}
