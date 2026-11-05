'use client';
import {useCallback,useEffect,useState} from 'react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';
import RoleManagement from './RoleManagement';
import EditorialWorkspace from './EditorialWorkspace';
import NewsDiagnostics from './NewsDiagnostics';
import AdminExpertRequests from './AdminExpertRequests';
import AdminAnalyticsPanel,{type Traffic,type VisitorTraffic} from './AdminAnalyticsPanel';

type Dashboard={generatedAt?:string;newUsers7d?:number;newCharts7d?:number;newOrders7d?:number;editorialPipeline?:{status:string;count:number}[];windowDays:number;users:number;charts:number;subscribers:number;freeMembers:number;unpaidDrafts:number;tarotReadings:number;expertRequestsUnread:number;orders:{status:string;count:number}[];ai:{
 requests:number;requestsWithTokenUsage:number;promptTokensReported:number;completionTokensReported:number;totalTokensReported:number;
 costUsdReported:number|null;byProvider:{provider:string;model:string;requests:number;requestsWithTokenUsage:number;promptTokensReported:number;completionTokensReported:number;totalTokensReported:number;costUsdReported:number|null}[]
}};
export default function AdminDashboard({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [data,setData]=useState<Dashboard|null>(null);
 const [busy,setBusy]=useState(true),[refreshing,setRefreshing]=useState(false),[error,setError]=useState('');
 const [traffic,setTraffic]=useState<Traffic|null>(null),[trafficError,setTrafficError]=useState('');
 const [visitors,setVisitors]=useState<VisitorTraffic|null>(null),[visitorError,setVisitorError]=useState('');
 const [days,setDays]=useState<7|30>(7);
 const refresh=useCallback(async()=>{
  setRefreshing(true);
  try{
   const response=await fetch('/api/v1/admin/overview',{cache:'no-store',credentials:'same-origin'});
   setData(await readApiJson<Dashboard>(response));setError('');
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setBusy(false);setRefreshing(false);}
 },[]);
 const refreshVisitors=useCallback(async()=>{
  try{
   const response=await fetch('/api/v1/admin/traffic/visitor-analytics?days='+days,{cache:'no-store',credentials:'same-origin'});
   setVisitors(await readApiJson<VisitorTraffic>(response));setVisitorError('');
  }catch(e){setVisitorError(e instanceof Error?e.message:String(e));}
 },[days]);
 const refreshTraffic=useCallback(async()=>{
  try{
   const response=await fetch('/api/v1/admin/traffic/realtime',{cache:'no-store',credentials:'same-origin'});
   setTraffic(await readApiJson<Traffic>(response));setTrafficError('');
  }catch(e){setTrafficError(e instanceof Error?e.message:String(e));}
 },[]);
 useEffect(()=>{
  void refresh();void refreshTraffic();void refreshVisitors();
  const check=()=>{if(document.visibilityState==='visible'){void refresh();void refreshTraffic();void refreshVisitors();}};
  const timer=setInterval(check,60000);
  window.addEventListener('focus',check);
  return()=>{clearInterval(timer);window.removeEventListener('focus',check)};
 },[refresh,refreshTraffic,refreshVisitors]);
 const shownAt=(iso:string|undefined)=>iso?new Date(iso).toLocaleString(uk?'uk-UA':'en-GB'):'—';
 const count=(x:number)=>x.toLocaleString(uk?'uk-UA':'en-US');
 const fields=data?[
  {label:uk?'Акаунти · загалом':'Accounts · all time',value:count(data.users)},
  {label:uk?'Нові акаунти · 7 днів':'New accounts · 7 days',value:count(data.newUsers7d??0)},
  {label:uk?'Збережені карти · загалом':'Saved charts · all time',value:count(data.charts)},
  {label:uk?'Нові карти · 7 днів':'New charts · 7 days',value:count(data.newCharts7d??0)},
  {label:uk?'Premium · загалом':'Premium · all time',value:count(data.subscribers)},
  {label:uk?'Нові замовлення · 7 днів':'New orders · 7 days',value:count(data.newOrders7d??0)},
  {label:uk?'Непрочитані експертні запити':'Unread expert requests',value:count(data.expertRequestsUnread)},
  {label:uk?'AI-запити · 30 днів':'AI calls · 30 days',value:count(data.ai.requests)}
 ]:[];
 return <section className="as-profile">
  <h1>{uk?'Панель адміністратора':'Admin overview'}</h1>
  <p className="as-muted">{uk?
   'Доступ лише ADMIN. Загальна статистика — за весь час, витрати AI — за 30 днів. Особисті тексти звернень і натальні дані не відображаються.':
   'ADMIN only. Totals are all time, AI usage covers 30 days. Private requests and natal data are never shown.'}</p>
  <p className="as-muted" aria-live="polite">
   {uk?'Актуальність даних: ':'Data as of: '}<strong>{shownAt(data?.generatedAt)}</strong>{' '}
   <button type="button" onClick={()=>{void refresh();void refreshTraffic();void refreshVisitors()}} disabled={refreshing}>
    {refreshing?(uk?'Оновлення…':'Refreshing…'):(uk?'Оновити зараз':'Refresh now')}
   </button>{' · '}{uk?'Автооновлення кожні 60 с':'Auto-refresh every 60s'}
  </p>
  {busy&&!data?<p>{uk?'Завантаження…':'Loading…'}</p>:null}
  {error?<p role="alert">{uk?'Помилка отримання актуальних даних: ':'Fresh data unavailable: '}
   {error}{data?(uk?' · Показано попередній знімок':' · Showing previous snapshot'):''}</p>:null}
  {data&&<>
   <AdminAnalyticsPanel locale={locale} days={days} onDaysChange={setDays}
    visitors={visitors?.days===days?visitors:null} traffic={traffic}
    visitorError={visitorError} trafficError={trafficError}/>
   <h2>{uk?'Акаунти й операції':'Accounts & operations'}</h2>
   <p className="as-muted">{uk?'Ці показники не є відвідуваннями: акаунти та збережені карти враховуються окремо від анонімної активності.':'These are not visits: accounts and saved charts are separate from anonymous site activity.'}</p>
   <div className="as-admin-grid">{fields.map(f=><div className="as-admin-metric" key={f.label}><span>{f.label}</span><strong>{f.value}</strong></div>)}</div>
   <p className="as-muted">{uk?'Запитів із підтвердженими загальними токенами: ':'Calls with provider-reported total tokens: '}{count(data.ai.requestsWithTokenUsage)} / {count(data.ai.requests)}</p>
   <h2>{uk?'AI: провайдери та моделі':'AI provider and model usage'}</h2>
   <div className="as-table-wrap"><table><thead><tr>
     <th>{uk?'Провайдер':'Provider'}</th><th>{uk?'Модель':'Model'}</th><th>{uk?'Запити':'Calls'}</th><th>{uk?'З usage':'With usage'}</th><th>Input</th><th>Output</th><th>Total</th><th>{uk?'Відома вартість USD':'Reported USD'}</th>
   </tr></thead><tbody>{data.ai.byProvider.length?data.ai.byProvider.map(p=><tr key={p.provider+':'+p.model}>
    <td>{p.provider}</td><td>{p.model}</td><td>{count(p.requests)}</td><td>{count(p.requestsWithTokenUsage)}</td><td>{count(p.promptTokensReported)}</td>
    <td>{count(p.completionTokensReported)}</td><td>{count(p.totalTokensReported)}</td>
    <td>{p.costUsdReported===null?'—':p.costUsdReported.toFixed(5)}</td>
   </tr>):<tr><td colSpan={8}>{uk?'Ще немає записів.':'No metered requests yet.'}</td></tr>}</tbody></table></div>
   <p className="as-muted">{uk?'Нуль у токенах може означати, що провайдер не передав usage. Пропущені значення та витрати не оцінюються вигаданими числами.':'Some providers omit usage. Missing token figures and expenses must not be mistaken for confirmed zero cost.'}</p>
   <h2>{uk?'Цикл відеозамовлень':'Video order pipeline'}</h2>
   <div className="as-admin-grid">{data.orders.length?data.orders.map(o=><div className="as-admin-metric" key={o.status}><span>{o.status}</span><strong>{count(o.count)}</strong></div>):<p>{uk?'Оплачені замовлення ще не підключені.':'Payment and order intake are not enabled yet.'}</p>}</div>
   <h2>{uk?'Редакційний конвеєр':'Editorial workflow'}</h2>
   <p className="as-muted">{uk?'Кількість матеріалів у реальних статусах: чернетки, перевірка, схвалення, публікація.':'Actual article counts across drafts, review, approval and publication.'}</p>
   <div className="as-admin-grid" data-testid="admin-editorial-pipeline">
    {(data.editorialPipeline||[]).length?(data.editorialPipeline||[]).map(e=>
     <div className="as-admin-metric" key={e.status}><span>{e.status}</span><strong>{count(e.count)}</strong></div>):
     <p>{uk?'Редакційні записи ще не створені.':'No editorial entries yet.'}</p>}
   </div>
   <AdminExpertRequests locale={locale}/>
   <NewsDiagnostics locale={locale}/>
   <EditorialWorkspace locale={locale}/>
   <RoleManagement locale={locale}/>
  </>}
 </section>;
}
