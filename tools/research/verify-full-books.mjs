import {readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const books=[
 {name:'Brihat Jataka (1905 OCR)',path:'brihat-jataka-iyer-1905-ocr.txt',min:500000},
 {name:'Laghu Parashari (1900 OCR)',path:'laghu-parashari-jha-1900-ocr.txt',min:125000},
 {name:'Brihat Samhita (1884 OCR)',path:'brihat-samhita-iyer-1884-ocr.txt',min:900000}
];
let passed=0;
for(const book of books){
 const path=join(root,'research-library','primary-texts',book.path);
 try{
  const bytes=statSync(path).size;
  const text=readFileSync(path,'utf8');
  const lines=text.split(/\r?\n/).length;
  if(bytes<book.min||text.length<book.min*0.9||lines<2500)throw Error('Truncated historical OCR source');
  console.log('PASS '+book.name+': '+bytes+' bytes, '+text.length+' characters, '+lines+' lines');
  passed++;
 }catch{
  console.error('FAIL '+book.name+': missing/incomplete full text in '+book.path);
  process.exitCode=1;
 }
}
if(passed===books.length)console.log('PASS: all three full OCR books are present. OCR is NOT editorially verified.');
