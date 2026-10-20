'use client';
import {useEffect,useState} from 'react';
import {CheckCircle2,BookOpen,Edit3,FileClock,Save,Send,Archive,RotateCcw,ShieldCheck,ExternalLink} from 'lucide-react';
import Link from 'next/link';
import {readApiJson} from '../../lib/api-response';
import {parseQuizChoices,quizChoiceCountMessage} from '../../lib/editorial-quiz';
import type {PortalLocale} from '../../lib/brand';

type Both={uk:string;en:string};
type ContentDoc={title:Both;summary:Both;body:Both;safety?:Both;
 quiz?:{question:Both;choices:[Both,Both,Both];correct:0|1|2;explanation:Both}};
type Item={id:string;kind:'ACADEMY'|'YOGA';slug:string;topic:string;status:string;revision:number;document:ContentDoc;updatedAt:string;publishedAt:string|null};
type Version={id:string;revision:number;action:string;actorId:string;createdAt:string};
type Staff='ADMIN'|'SUPPORT'|'MEMBER';
type Draft={
 kind:'ACADEMY'|'YOGA';slug:string;topic:string;
 titleUk:string;titleEn:string;summaryUk:string;summaryEn:string;
 bodyUk:string;bodyEn:string;safetyUk:string;safetyEn:string;
 questionUk:string;questionEn:string;choicesUk:string;choicesEn:string;
 explanationUk:string;explanationEn:string;correct:0|1|2;
};
const fresh=():Draft=>({kind:'ACADEMY',slug:'',topic:'jyotish',titleUk:'',titleEn:'',summaryUk:'',summaryEn:'',
 bodyUk:'',bodyEn:'',safetyUk:'',safetyEn:'',questionUk:'',questionEn:'',choicesUk:'',choicesEn:'',
 explanationUk:'',explanationEn:'',correct:0});
const topics={ACADEMY:['jyotish','tarot','practice'],YOGA:['mobility','meditation']} as const;
const transitions:{[k:string]:{textUk:string;textEn:string;admin:boolean}}={
 submit:{textUk:'Надіслати на перевірку',textEn:'Submit for review',admin:false},
 approve:{textUk:'Схвалити',textEn:'Approve',admin:true},
 reject:{textUk:'Повернути в чернетки',textEn:'Return to draft',admin:true},
 publish:{textUk:'Опублікувати',textEn:'Publish',admin:true},
 archive:{textUk:'Зняти з публікації',textEn:'Archive publication',admin:true},
 reopen:{textUk:'Повернути в роботу',textEn:'Reopen draft',admin:true}
};
const actionByStatus:Record<string,string[]>={DRAFT:['submit'],IN_REVIEW:['approve','reject'],APPROVED:['publish','reject'],PUBLISHED:['archive'],ARCHIVED:['reopen']};
const both=(uk:string,en:string)=>({uk,en});
function docFrom(form:Draft):ContentDoc{
 const value:ContentDoc={title:both(form.titleUk,form.titleEn),summary:both(form.summaryUk,form.summaryEn),
  body:both(form.bodyUk,form.bodyEn)};
 if(form.kind==='YOGA'&&form.safetyUk.trim()&&form.safetyEn.trim())value.safety=both(form.safetyUk,form.safetyEn);
 if(form.kind==='ACADEMY'){
  const uk=parseQuizChoices(form.choicesUk),en=parseQuizChoices(form.choicesEn);
  value.quiz={question:both(form.questionUk,form.questionEn),choices:[0,1,2].map(i=>both(uk[i]||'',en[i]||'')) as [Both,Both,Both],
   correct:form.correct,explanation:both(form.explanationUk,form.explanationEn)};
 }
 return value;
}
function formFrom(item:Item):Draft{
 const doc=item.document;
 return {kind:item.kind,slug:item.slug,topic:item.topic,
  titleUk:doc.title.uk,titleEn:doc.title.en,summaryUk:doc.summary.uk,summaryEn:doc.summary.en,
  bodyUk:doc.body.uk,bodyEn:doc.body.en,safetyUk:doc.safety?.uk||'',safetyEn:doc.safety?.en||'',
  questionUk:doc.quiz?.question.uk||'',questionEn:doc.quiz?.question.en||'',
  choicesUk:doc.quiz?.choices.map(x=>x.uk).join('\n')||'',choicesEn:doc.quiz?.choices.map(x=>x.en).join('\n')||'',
  explanationUk:doc.quiz?.explanation.uk||'',explanationEn:doc.quiz?.explanation.en||'',
  correct:doc.quiz?.correct||0};
}
export default function EditorialWorkspace({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [role,setRole]=useState<Staff>('MEMBER'),[items,setItems]=useState<Item[]>([]),
  [form,setForm]=useState<Draft>(fresh),[selected,setSelected]=useState<Item|null>(null),
  [revisions,setRevisions]=useState<Version[]>([]),[busy,setBusy]=useState(false),
  [ready,setReady]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const isAdmin=role==='ADMIN';
 async function refresh(){
  const data=await readApiJson<Item[]>(await fetch('/api/v1/editorial/entries',{credentials:'same-origin',cache:'no-store'}));
  setItems(data);return data;
 }
 useEffect(()=>{
  let alive=true;
  Promise.all([
   fetch('/api/v1/account/me',{credentials:'same-origin',cache:'no-store'}).then(r=>readApiJson<{user:{role:Staff}|null}>(r)),
   fetch('/api/v1/editorial/entries',{credentials:'same-origin',cache:'no-store'}).then(r=>readApiJson<Item[]>(r))
  ]).then(([me,entries])=>{if(alive){setRole(me.user?.role||'MEMBER');setItems(entries);}})
   .catch(e=>{if(alive)setError(e instanceof Error?e.message:String(e))})
   .finally(()=>{if(alive)setReady(true)});
  return()=>{alive=false};
 },[]);
 function editField<K extends keyof Draft>(field:K,value:Draft[K]){
  setForm(previous=>({...previous,[field]:value}));
 }
 async function operate(fn:()=>Promise<void>){
  setBusy(true);setError('');setNotice('');
  try{await fn();await refresh();}
  catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setBusy(false);}
 }
 async function request(method:'POST'|'PATCH',path:string,body:unknown){
  return readApiJson<Item>(await fetch('/api/v1/editorial/'+path,{method,credentials:'same-origin',
   headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
 }
 async function save(){
  if(form.kind==='ACADEMY'){
   const ua=parseQuizChoices(form.choicesUk),en=parseQuizChoices(form.choicesEn);
   if(ua.length!==3||en.length!==3){
    setError(uk?'У тесті потрібно рівно 3 непорожні відповіді українською та 3 англійською. Порожні рядки можна залишати.':'The quiz needs exactly 3 non-empty Ukrainian and 3 English answers. Blank spacer lines are fine.');
    return;
   }
  }
  await operate(async()=>{
   const payload={topic:form.topic,document:docFrom(form)};
   const updated=selected?
    await request('PATCH','entries/'+selected.id,{...payload,expectedRevision:selected.revision}):
    await request('POST','entries',{...payload,kind:form.kind,slug:form.slug});
   setSelected(updated);setForm(formFrom(updated));setRevisions([]);
   setNotice(uk?'Чернетку збережено.':'Draft saved.');
  });
 }
 async function advance(action:string){
  if(!selected)return;
  await operate(async()=>{
   const updated=await request('POST','entries/'+selected.id+'/transition',{action,expectedRevision:selected.revision});
   setSelected(updated);setForm(formFrom(updated));setRevisions([]);
   setNotice(uk?'Статус змінено.':'Workflow status updated.');
  });
 }
 async function history(){
  if(!selected)return;
  await operate(async()=>{
   const data=await readApiJson<Version[]>(await fetch('/api/v1/editorial/entries/'+selected.id+'/history',{credentials:'same-origin',cache:'no-store'}));
   setRevisions(data);
  });
 }
 const field=(key:keyof Draft,label:string,multiline=false,placeholder='')=><label className="as-editorial-field" key={String(key)}>
  <span>{label}</span>
  {multiline?<textarea rows={key==='bodyUk'||key==='bodyEn'?7:3} value={String(form[key])} placeholder={placeholder}
   disabled={!!selected&&selected.status!=='DRAFT'}
   onChange={e=>editField(key,e.target.value as never)}/>:<input disabled={(key==='slug'&&!!selected)||!!selected&&selected.status!=='DRAFT'} value={String(form[key])} placeholder={placeholder}
   onChange={e=>editField(key,e.target.value as never)}/>}
  {(key==='choicesUk'||key==='choicesEn')?<span className="as-editorial-field-hint" aria-live="polite" data-testid={'quiz-count-'+key}>
   {quizChoiceCountMessage(String(form[key]),uk)}
  </span>:key==='bodyUk'||key==='bodyEn'?<span className="as-editorial-field-hint">
   {uk?'Символів: ':'Characters: '}{String(form[key]).length.toLocaleString(uk?'uk-UA':'en-US')}
   {uk?' · до 120 000':' · up to 120,000'}
  </span>:null}
 </label>;
 return <section className="as-editorial-workspace" id="editorial" aria-label={uk?'Редакційна панель':'Editorial workspace'}>
  <header><span className="as-overline">{uk?'ЕТАП A6 · РЕДАКЦІЯ':'A6 · EDITORIAL WORKSPACE'}</span>
   <h2>{uk?'Керування матеріалами':'Content management'}</h2>
   <p>{uk?'Створюй двомовні уроки та практики, погоджуй і публікуй з історією кожної редакції. Існуючі матеріали A5 залишаються окремими та незмінними.':'Create bilingual lessons and practices, review and publish with a complete revision history. Existing A5 content remains unchanged.'}</p></header>
  {!ready?<p>{uk?'Завантаження редакції…':'Loading editorial workspace…'}</p>:role!=='ADMIN'&&role!=='SUPPORT'?
   <p role="alert">{error||(uk?'Потрібен вхід з роллю ADMIN або SUPPORT.':'Sign in with ADMIN or SUPPORT role.')}</p>:<>
   <div className="as-editorial-actions">
    <button className="as-button as-button-secondary" type="button" onClick={()=>{setSelected(null);setForm(fresh());setRevisions([]);setError('')}}>{uk?'Новий матеріал':'New material'}</button>
    <button className="as-button as-button-secondary" type="button" disabled={busy} onClick={()=>operate(async()=>{await refresh()})}>{uk?'Оновити список':'Refresh list'}</button>
   </div>
   {error?<p role="alert" className="as-editorial-error">{error}</p>:null}
   {notice?<p role="status" className="as-editorial-success"><CheckCircle2 size={17}/>{notice}</p>:null}
   <div className="as-editorial-layout">
    <aside className="as-editorial-sidebar"><h3>{uk?'Редакційна черга':'Editorial queue'} · {items.length}</h3>
     {items.length===0?<p>{uk?'Матеріалів поки немає. Створи першу чернетку.':'No content yet. Create the first draft.'}</p>:items.map(item=>
      <button type="button" key={item.id} className={'as-editorial-item '+(selected?.id===item.id?'active':'')}
       onClick={()=>{setSelected(item);setForm(formFrom(item));setRevisions([]);setError('');setNotice('')}}>
       <span className="as-overline">{item.kind} · {item.status} · v{item.revision}</span>
       <strong>{item.document.title[locale]}</strong><small>/{item.kind==='ACADEMY'?'learn':'yoga'}/{item.slug}</small>
      </button>)}
    </aside>
    <div className="as-editorial-editor">
     <div className="as-editorial-editor-head"><h3>{selected?(uk?'Матеріал · редакція ':'Entry · revision ')+selected.revision:(uk?'Нова чернетка':'New draft')}</h3>
      {selected?<span className="as-editorial-pill">{selected.status}</span>:null}</div>
     {selected?.status==='PUBLISHED'?<Link href={'/'+locale+'/'+(selected.kind==='ACADEMY'?'learn':'yoga')+'/'+selected.slug} target="_blank"
      className="as-editorial-preview">{uk?'Переглянути на сайті':'Open public page'} <ExternalLink size={15}/></Link>:null}
     <div className="as-editorial-field-grid">
      <label className="as-editorial-field"><span>{uk?'Тип матеріалу':'Content type'}</span>
       <select disabled={!!selected} value={form.kind} onChange={e=>setForm(x=>({...x,kind:e.target.value as Draft['kind'],topic:e.target.value==='YOGA'?'mobility':'jyotish'}))}>
        <option value="ACADEMY">Academy</option><option value="YOGA">Yoga</option>
       </select></label>
      <label className="as-editorial-field"><span>{uk?'Категорія':'Topic'}</span>
       <select disabled={!!selected&&selected.status!=='DRAFT'} value={form.topic} onChange={e=>editField('topic',e.target.value)}>
        {topics[form.kind].map(x=><option value={x} key={x}>{x}</option>)}</select>
      </label>
      {field('slug',uk?'URL-адреса (латиницею)':'URL slug',false,'my-new-lesson')}
     </div>
     <p className="as-editorial-hint">{uk?'Slug потрібно задавати до створення; змінити URL після створення не можна. Тексти обох мов обов’язкові. Для тесту введи рівно три непорожні відповіді кожною мовою: порожні рядки можна залишати.':'Choose a slug before creating; it stays immutable. Both translations are required. For quizzes enter exactly three non-empty answers per language; blank spacer lines are fine.'}</p>
     <div className="as-editorial-dual">
      <div><h4>🇺🇦 Українська</h4>{field('titleUk','Назва')}{field('summaryUk','Короткий опис',true)}
       {field('bodyUk',form.kind==='YOGA'?'Кроки (через порожній рядок)':'Текст статті (абзаци через порожній рядок)',true)}
       {form.kind==='YOGA'?null:<>
        {field('questionUk','Запитання тесту')}{field('choicesUk','Три варіанти (кожен із нового рядка)',true)}
        {field('explanationUk','Пояснення відповіді',true)}
       </>}</div>
      <div><h4>🇬🇧 English</h4>{field('titleEn','Title')}{field('summaryEn','Short description',true)}
       {field('bodyEn',form.kind==='YOGA'?'Steps (separate by a blank line)':'Article (paragraphs separated by blank lines)',true)}
       {form.kind==='YOGA'?null:<>
        {field('questionEn','Quiz question')}{field('choicesEn','Three choices (one per line)',true)}
        {field('explanationEn','Answer explanation',true)}
       </>}</div>
     </div>
     {form.kind==='ACADEMY'?<label className="as-editorial-field as-editorial-correct"><span>{uk?'Номер правильної відповіді':'Correct answer'}</span>
      <select value={form.correct} onChange={e=>editField('correct',Number(e.target.value) as 0|1|2)}>
       <option value={0}>1</option><option value={1}>2</option><option value={2}>3</option></select></label>:null}
     <div className="as-editorial-actions">
      {(!selected||selected.status==='DRAFT')?<button type="button" disabled={busy} className="as-button as-button-primary" onClick={save}>
       <Save size={17}/>{selected?(uk?'Зберегти нову редакцію':'Save revision'):(uk?'Створити чернетку':'Create draft')}</button>:null}
      {selected&&(actionByStatus[selected.status]||[]).filter(a=>!transitions[a].admin||isAdmin).map(action=>
       <button key={action} type="button" disabled={busy} className={'as-button '+(action==='publish'?'as-button-primary':'as-button-secondary')}
        onClick={()=>advance(action)}>
        {action==='publish'?<Send size={17}/>:action==='archive'?<Archive size={16}/>:action==='reopen'?<RotateCcw size={16}/>:<ShieldCheck size={16}/>}
        {uk?transitions[action].textUk:transitions[action].textEn}</button>)}
      {selected?<button type="button" disabled={busy} onClick={history} className="as-button as-button-secondary"><FileClock size={16}/>{uk?'Історія версій':'Revision history'}</button>:null}
     </div>
     {selected&&revisions.length>0?<div className="as-editorial-history"><h4>{uk?'Журнал змін':'Audit history'}</h4>
      {revisions.map(item=><p key={item.id}>v{item.revision} · {item.action} · {new Date(item.createdAt).toLocaleString(uk?'uk-UA':'en-US')}</p>)}</div>:null}
     <p className="as-editorial-hint">{uk?'Увага: лише ADMIN може схвалювати, публікувати й знімати матеріали. Всі кроки журналюються. Ніякого автопублікування після збереження.':'Only ADMIN may approve, publish or archive. Every change is audited. Saving a draft never publishes it.'}</p>
    </div>
   </div>
  </>}
 </section>;
}
