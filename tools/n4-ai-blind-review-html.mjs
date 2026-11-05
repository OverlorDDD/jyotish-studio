/** A read-only, local, blind comparison of 48 REAL synthetic-only provider responses. */
import {n4AuditSampleId,N4_LIVE_AUDIT_CORPUS_VERSION} from './n4-ai-synthetic-profiles.mjs';
import {N4_EDITORIAL_VARIANT_VERSION,auditN4PairedModelIdentity} from './n4-ai-editorial-variants.mjs';
const escape=(value)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scores=['Достовірність положень та управителів','Синтез D1, D9, D10 та двох тематичних варг','Індивідуальність щодо інших карт','Реалістичні альтернативи й практичний крок','Природність української чи англійської','Чесність щодо часу народження й меж висновків'];
export function renderN4BlindReview(rows){
 if(!Array.isArray(rows)||rows.length!==48)throw Error('N4 blind review requires 48 genuine full-corpus records');
 const indexed=new Map();
 for(const row of rows){
  if(row.corpus!==N4_LIVE_AUDIT_CORPUS_VERSION||row.editorialVersion!==N4_EDITORIAL_VARIANT_VERSION)
   throw Error('N4 blind review: invalid provenance');
  const i=Array.from({length:48},(_,index)=>n4AuditSampleId(index)).find(s=>s.id===row.id);
  if(!i||i.seed!==row.seed||i.lang!==row.lang||i.variant!==row.variant)
   throw Error('N4 blind review: unknown synthetic record');
  if(indexed.has(row.id))throw Error('N4 blind review: duplicate synthetic record');
  if(!['gemini','groq','openrouter'].includes(row.provider)||!row.model||
     typeof row.text!=='string'||row.text.trim().length<900)
   throw Error('N4 blind review: missing actual provider response');
  indexed.set(row.id,row);
 }
 const mismatch=auditN4PairedModelIdentity(rows);
 if(mismatch.length)throw Error('N4 blind review: A/B model mismatch');
 const blocks=[];
 for(let seed=0;seed<12;seed++)for(const lang of ['uk','en']){
  const a=indexed.get(n4AuditSampleId(seed*4+(lang==='uk'?0:2)).id);
  const b=indexed.get(n4AuditSampleId(seed*4+(lang==='uk'?1:3)).id);
  if(!a||!b)throw Error('N4 blind review: incomplete A/B pair');
  const flip=(seed+(lang==='uk'?1:0))%2===0;
  const left=flip?b:a,right=flip?a:b;
  const pair='n4-'+String(seed+1).padStart(2,'0')+'-'+lang;
  const fields=scores.map((label,i)=>'<label>'+escape(label)+'<select data-score="'+i+
   '"><option value="">Оцінка 0–4</option>'+
   [0,1,2,3,4].map(n=>'<option value="'+n+'">'+n+'</option>').join('')+'</select></label>').join('');
  blocks.push('<section class="pair" data-pair="'+pair+'"><h2>Карта '+(seed+1)+' · '+lang.toUpperCase()+'</h2>'+
    '<div class="comparison"><article><h3>Версія 1</h3><div class="prose">'+escape(left.text)+'</div></article>'+
    '<article><h3>Версія 2</h3><div class="prose">'+escape(right.text)+'</div></article></div>'+
    '<div class="assessment"><fieldset><legend>Яке трактування краще?</legend>'+
    ['left','right','tie','neither'].map((v,i)=>'<label><input name="'+pair+'" type="radio" value="'+v+'">'+
     ['Версія 1','Версія 2','Однаково','Обидва слабкі'][i]+'</label>').join('')+
    '</fieldset><p>Оцініть обраний кращий текст за всіма шістьма критеріями (0 — неприйнятно, 4 — відмінно).</p><div class="scores">'+fields+'</div>'+
    '<label><input type="checkbox" data-critical> Критична вигадана позиція планети, приватні дані або гарантована подія — FAIL</label>'+
    '<label>Помилки фактів / що звучить шаблонно<textarea rows="3" placeholder="Конкретні приклади, без особистих даних"></textarea></label></div></section>');
 }
 return '<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Galaxiora N4 · Сліпе A/B-оцінювання</title><style>'+
  'body{margin:0 auto;max-width:1240px;padding:clamp(12px,3vw,30px);background:#0c1021;color:#e9ecfb;font:16px/1.55 system-ui}'+
  'h1,h2,h3{line-height:1.25}p{color:#b5c0da}.pair{margin:26px 0;padding:18px;border:1px solid #414b68;border-radius:16px}'+
  '.comparison{display:grid;grid-template-columns:1fr 1fr;gap:16px}.comparison article{min-width:0;padding:16px;background:#181d36;border-radius:12px}'+
  '.prose{white-space:pre-wrap;overflow-wrap:anywhere;max-height:550px;overflow:auto}.assessment{margin-top:16px}'+
  'fieldset{display:flex;gap:20px;flex-wrap:wrap;border:1px solid #59637c;border-radius:10px}'+
  '.scores{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:15px 0}'+
  'label{display:block}input,select,textarea,button{font:inherit}select,textarea{display:block;width:100%;box-sizing:border-box;padding:8px;background:#252b44;color:white;border:1px solid #626e90;border-radius:7px}'+
  'button{padding:12px 22px;color:white;background:#425ac5;border:0;border-radius:10px;cursor:pointer}'+
  '@media(max-width:700px){.comparison,.scores{grid-template-columns:1fr}.prose{max-height:350px}}'+
  '</style></head><body><h1>Galaxiora N4 · Сліпе A/B-оцінювання</h1>'+
  '<p>24 пари, однакові синтетичні карти й моделі. Назви A/B приховані. Читайте кожну пару, оберіть кращий текст, оцініть його за шістьма критеріями 0–4 та відмітьте критичні вигадані факти. Результат зберігається лише у вашому локальному JSON-файлі. Не вводьте приватні дані.</p>'+
  '<button id="export">Зберегти мої оцінки (.json)</button><main>'+blocks.join('')+'</main>'+
  '<script>document.getElementById("export").addEventListener("click",()=>{'+
  'const rows=Array.from(document.querySelectorAll(".pair")).map(section=>({'+
  'pair:section.dataset.pair,preferred:section.querySelector("input[type=radio]:checked")?.value||null,'+
  'scores:Array.from(section.querySelectorAll("[data-score]")).map(s=>s.value===""?null:Number(s.value)),'+
  'critical:section.querySelector("[data-critical]").checked,notes:section.querySelector("textarea").value.slice(0,2000)}));'+
  'const blob=new Blob([JSON.stringify({schema:"n4-blind-human-review-v1",reviewedAt:new Date().toISOString(),rows},null,2)],{type:"application/json"});'+
  'const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="galaxiora-n4-my-blind-review.json";a.click();URL.revokeObjectURL(url);'+
  '});</script></body></html>';
}
