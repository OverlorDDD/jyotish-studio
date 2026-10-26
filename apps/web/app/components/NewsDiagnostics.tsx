'use client';
import {useCallback,useEffect,useState} from 'react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';
type Scan={sourceKey:string;createdAt:string;status:string;candidates:number;accepted:number;duplicates:number;
 rejected:number;errors:number;failure:string|null;durationMs:number;rejectionReasons:Record<string,number>|null};
type Publisher={domain:string;lastSeenAt:string;articleCount:number;status:string;lastTitle:string|null};
type Health={enabled:boolean;registeredSources:number;articleCount:number;publishers:number;
 untranslated:number;unsummarized:number;unillustrated:number;discoveredSources:Publisher[];editorialAiConfigured:boolean;
 last:{createdAt:string;sources:number;accepted:number;errors:number}|null;
 byTopic:{topic:string;count:number}[];sources:Scan[];history:Scan[]};
export default function NewsDiagnostics({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [data,setData]=useState<Health|null>(null),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[sending,setSending]=useState(false),[notice,setNotice]=useState('');
 const refresh=useCallback(async()=>{
  setError('');setLoading(true);
  try{setData(await readApiJson<Health>(await fetch('/api/v1/news/admin/health',{credentials:'same-origin',cache:'no-store'})));}
  catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 const date=(x:string)=>new Date(x).toLocaleString(uk?'uk-UA':'en-GB');
 async function policy(domain:string,status:'DISCOVERED'|'BLOCKED'|'TRUSTED'){
  setNotice('');setError('');
  try{
   await readApiJson(await fetch('/api/v1/news/admin/sources/'+encodeURIComponent(domain),{
    method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({status})}));
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:String(e));}
 }
 async function requestBackfill(){
  if(sending)return;
  setSending(true);setNotice('');setError('');
  try{
   const result=await readApiJson<{requested:boolean;completed:boolean}>(await fetch('/api/v1/news/admin/refresh?backfill=true',{
    method:'POST',credentials:'same-origin',headers:{Accept:'application/json'}
   }));
   setNotice(result.requested?(uk?'Перевірку замовлено; завершення ще не підтверджене. Онови діагностику після виконання.':
    'Scan requested, not yet completed. Refresh diagnostics to verify results.'):'');
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setSending(false);}
 }
 return <section className="as-detail" aria-label={uk?'Діагностика GalaxiNews':'GalaxiNews diagnostics'} data-testid="news-admin-diagnostics">
  <h2>{uk?'GalaxiNews · джерела та наповнення':'GalaxiNews · sources and coverage'}</h2>
  <p className="as-muted">{uk?'Джерела зі статусом кандидата перевіряються автоматично. Показники нижче — результати справжніх сканувань, не обіцянка кількості новин.':
   'Candidate feeds are checked automatically. Figures below reflect real scan results, not a content guarantee.'}</p>
  <p><button type="button" onClick={()=>void refresh()} disabled={loading}>{uk?'Оновити діагностику':'Refresh diagnostics'}</button>{' '}
   <button type="button" onClick={()=>void requestBackfill()} disabled={sending}>{uk?'Повторити початкове наповнення':'Run backfill again'}</button></p>
  {notice&&<p role="status">{notice}</p>}
  {error&&<p role="alert">{error}</p>}
  {loading?<p>{uk?'Завантаження…':'Loading…'}</p>:data&&<>
   <div className="as-admin-grid">
    <div className="as-admin-metric"><span>{uk?'Опублікованих':'Published'}</span><strong>{data.articleCount}</strong></div>
    <div className="as-admin-metric"><span>{uk?'Редактор AI':'AI editor'}</span><strong>{data.editorialAiConfigured?'READY':'NOT READY'}</strong></div>
    <div className="as-admin-metric"><span>{uk?'Видавців':'Publishers'}</span><strong>{data.publishers}</strong></div>
    <div className="as-admin-metric"><span>{uk?'Налаштованих каналів':'Candidate channels'}</span><strong>{data.registeredSources}</strong></div>
    <div className="as-admin-metric"><span>{uk?'Без української назви':'Missing Ukrainian titles'}</span><strong>{data.untranslated}</strong></div>
    <div className="as-admin-metric"><span>{uk?'Без опису':'Missing teasers'}</span><strong>{data.unsummarized}</strong></div>
    <div className="as-admin-metric"><span>{uk?'Без обкладинки':'Missing cover'}</span><strong>{data.unillustrated}</strong></div>
    <div className="as-admin-metric"><span>{uk?'Збір увімкнено':'Ingestion enabled'}</span><strong>{data.enabled?'ON':'OFF'}</strong></div>
   </div>
   <p className="as-muted">{data.last?(uk?'Останнє повне сканування: ':'Last completed scan: ')+date(data.last.createdAt)+
    ' · '+data.last.sources+' '+(uk?'каналів':'channels')+', '+data.last.accepted+' '+(uk?'нових':'new')+', '+data.last.errors+' '+(uk?'помилок':'errors'):
    (uk?'Завершених сканувань ще не було.':'No completed scans yet.')}</p>
   <p>{data.byTopic.map(x=><span key={x.topic} style={{display:'inline-block',margin:'0 10px 8px 0'}}>{x.topic}: <b>{x.count}</b></span>)}</p>
   <h3>{uk?'Динамічний реєстр видавців':'Discovered publishers'}</h3>
   <p className="as-muted">{uk?'Видавці виявляються через незалежний світовий індекс і нові релевантні публікації. Виявлення не означає автоматичного дозволу на зображення чи повні тексти.':
   'Publishers are discovered automatically from global indexes. Discovery does not grant rights to images or article bodies.'}</p>
   <div className="as-table-wrap"><table><thead><tr><th>{uk?'Домен':'Domain'}</th><th>{uk?'Статей':'Articles'}</th><th>{uk?'Статус':'Status'}</th><th>{uk?'Дія':'Action'}</th></tr></thead>
   <tbody>{data.discoveredSources.map(pub=><tr key={pub.domain}>
    <td><strong>{pub.domain}</strong><small style={{display:'block'}}>{date(pub.lastSeenAt)}</small></td>
    <td>{pub.articleCount}</td><td>{pub.status}</td><td>
    <button type="button" onClick={()=>void policy(pub.domain,pub.status==='BLOCKED'?'DISCOVERED':'BLOCKED')}>
     {pub.status==='BLOCKED'?(uk?'Розблокувати':'Unblock'):(uk?'Заблокувати':'Block')}</button>{' '}
    {pub.status!=='BLOCKED'&&<button type="button" onClick={()=>void policy(pub.domain,pub.status==='TRUSTED'?'DISCOVERED':'TRUSTED')}>
     {pub.status==='TRUSTED'?(uk?'Скасувати довіру':'Untrust'):(uk?'Перевірені метадані':'Trust metadata')}</button>}
    </td></tr>)}</tbody></table></div>
   <h3>{uk?'Діагностика каналів':'Feed diagnostics'}</h3>
   <div className="as-table-wrap"><table><thead><tr>
    <th>{uk?'Джерело':'Source'}</th><th>{uk?'Стан':'Status'}</th><th>{uk?'Отримано':'Received'}</th>
    <th>{uk?'Нових':'New'}</th><th>{uk?'Дублі':'Duplicates'}</th><th>{uk?'Відхилено':'Rejected'}</th>
    <th>{uk?'Причини / помилки':'Reasons / errors'}</th>
   </tr></thead><tbody>{data.sources.length?data.sources.map(x=><tr key={x.sourceKey}>
    <td><strong>{x.sourceKey}</strong><small style={{display:'block'}}>{date(x.createdAt)}</small></td>
    <td>{x.status}</td><td>{x.candidates}</td><td>{x.accepted}</td><td>{x.duplicates}</td><td>{x.rejected}</td>
    <td><small>{x.failure||Object.entries(x.rejectionReasons||{}).map(([key,n])=>key+': '+n).join(', ')||'—'}</small></td>
   </tr>):<tr><td colSpan={7}>{uk?'Немає записів. Запусти сканування.':'No source attempts yet.'}</td></tr>}</tbody></table></div>
  </>}
 </section>;
}
