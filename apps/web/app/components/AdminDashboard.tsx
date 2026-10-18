'use client';
import {useEffect,useState} from 'react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';

type Dashboard={windowDays:number;users:number;charts:number;subscribers:number;freeMembers:number;unpaidDrafts:number;orders:{status:string;count:number}[];ai:{
 requests:number;requestsWithTokenUsage:number;promptTokensReported:number;completionTokensReported:number;totalTokensReported:number;
 costUsdReported:number|null;byProvider:{provider:string;model:string;requests:number;requestsWithTokenUsage:number;promptTokensReported:number;completionTokensReported:number;totalTokensReported:number;costUsdReported:number|null}[]
}};
export default function AdminDashboard({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [data,setData]=useState<Dashboard|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  let alive=true;
  fetch('/api/v1/admin/overview',{cache:'no-store',credentials:'same-origin'})
   .then(r=>readApiJson<Dashboard>(r)).then(x=>{if(alive)setData(x)})
   .catch(e=>{if(alive)setError(e instanceof Error?e.message:String(e))})
   .finally(()=>{if(alive)setBusy(false)});
  return()=>{alive=false};
 },[]);
 const count=(x:number)=>x.toLocaleString(uk?'uk-UA':'en-US');
 const fields=data?[
  {label:uk?'Користувачі':'Users',value:count(data.users)},
  {label:uk?'Без підписки':'Free accounts',value:count(data.freeMembers)},
  {label:uk?'Платні підписники':'Premium accounts',value:count(data.subscribers)},
  {label:uk?'Чернетки до оплати':'Pending drafts',value:count(data.unpaidDrafts)},
  {label:uk?'Натальні карти':'Saved charts',value:count(data.charts)},
  {label:uk?'Запити AI / 30 днів':'AI calls / 30 days',value:count(data.ai.requests)},
  {label:uk?'Токени (підтверджені провайдером)':'Provider-reported tokens',value:count(data.ai.totalTokensReported)}
 ]:[];
 return <section className="as-profile">
  <h1>{uk?'Панель адміністратора':'Admin overview'}</h1>
  <p className="as-muted">{uk?'Доступ лише ADMIN. Статистика за останні 30 днів; запитання клієнтів, персональні карти та паролі сюди не надходять.':'ADMIN only. Last 30 days; no private birth charts, reading questions or passwords are exposed.'}</p>
  {busy?<p>{uk?'Завантаження…':'Loading…'}</p>:error?<p role="alert">{uk?'Доступ відхилено або сервер недоступний: ':'Access denied or API unavailable: '}{error}</p>:data&&<>
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
  </>}
 </section>;
}
