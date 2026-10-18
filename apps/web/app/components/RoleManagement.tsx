'use client';
import {useEffect,useState} from 'react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';
type Role='MEMBER'|'EXPERT'|'SUPPORT'|'ADMIN';
type Entry={id:string;email:string;role:Role;createdAt:string;subscription:'FREE'|'PREMIUM'};
type Page={page:number;pageSize:number;total:number;users:Entry[]};
type Audit={id:string;createdAt:string;previousRole:Role;newRole:Role;actor:{email:string};target:{email:string}};
const ROLES:Role[]=['MEMBER','EXPERT','SUPPORT','ADMIN'];
export default function RoleManagement({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [page,setPage]=useState(1),[data,setData]=useState<Page|null>(null),[audit,setAudit]=useState<Audit[]>([]);
 const [self,setSelf]=useState(''),[editing,setEditing]=useState<Record<string,Role>>({});
 const [saving,setSaving]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function refresh(p=page){
  const [people,history,me]=await Promise.all([
   fetch('/api/v1/admin/users?page='+p,{credentials:'same-origin',cache:'no-store'}).then(r=>readApiJson<Page>(r)),
   fetch('/api/v1/admin/role-audit',{credentials:'same-origin',cache:'no-store'}).then(r=>readApiJson<Audit[]>(r)),
   fetch('/api/v1/account/me',{credentials:'same-origin',cache:'no-store'}).then(r=>readApiJson<{user:{id:string}|null}>(r))
  ]);
  setData(people);setAudit(history);setSelf(me.user?.id||'');
  setEditing(Object.fromEntries(people.users.map(u=>[u.id,u.role])));
 }
 useEffect(()=>{let valid=true;
  refresh(page).catch(e=>{if(valid)setError(e instanceof Error?e.message:String(e))});
  return()=>{valid=false};
 },[page]);
 async function update(user:Entry){
  const role=editing[user.id];
  if(!role||role===user.role)return;
  if(!confirm((uk?'Змінити роль для ':'Change role for ')+user.email+' → '+role+'?'))return;
  setSaving(user.id);setError('');setMessage('');
  try{
   const r=await fetch('/api/v1/admin/users/'+encodeURIComponent(user.id)+'/role',{
    method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({role})
   });
   await readApiJson(r);
   await refresh();
   setMessage(uk?'Роль змінено, дію записано в журнал.':'Role changed and logged.');
  }catch(e){setError(e instanceof Error?e.message:String(e))}
  finally{setSaving('')}
 }
 return <section className="as-role-panel">
  <h2>{uk?'Користувачі та ролі':'Users and permissions'}</h2>
  <p className="as-muted">{uk?'Доступне тільки адміністратору. Підписка FREE/PREMIUM не надає прав EXPERT або ADMIN. Власну роль тут змінити не можна.':'Admin-only. FREE/PREMIUM subscriptions do not grant EXPERT or ADMIN privileges. You cannot change your own role here.'}</p>
  {error&&<p className="as-account-error" role="alert">{error}</p>}
  {message&&<p role="status">{message}</p>}
  <div className="as-table-wrap"><table>
   <thead><tr><th>Email</th><th>{uk?'Підписка':'Plan'}</th><th>{uk?'Поточна роль':'Current role'}</th><th>{uk?'Нова роль':'Set role'}</th><th>{uk?'Дія':'Action'}</th></tr></thead>
   <tbody>{data?.users.map(u=><tr key={u.id}>
    <td>{u.email}{u.id===self?' ('+(uk?'ви':'you')+')':''}</td><td>{u.subscription}</td><td>{u.role}</td>
    <td><select aria-label={(uk?'Нова роль для ':'Role for ')+u.email} disabled={u.id===self||saving!==''} value={editing[u.id]||u.role}
      onChange={e=>setEditing(v=>({...v,[u.id]:e.target.value as Role}))}>{ROLES.map(r=><option value={r} key={r}>{r}</option>)}</select></td>
    <td><button type="button" disabled={u.id===self||saving!==''||editing[u.id]===u.role} onClick={()=>update(u)}>{uk?'Зберегти':'Save'}</button></td>
   </tr>)}</tbody>
  </table></div>
  <div className="as-pagination">
   <button type="button" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← {uk?'Назад':'Previous'}</button>
   <span>{uk?'Сторінка':'Page'} {page} / {Math.max(1,Math.ceil((data?.total||0)/50))}</span>
   <button type="button" disabled={page*50>=(data?.total||0)} onClick={()=>setPage(p=>p+1)}>{uk?'Далі':'Next'} →</button>
  </div>
  <h2>{uk?'Журнал змін ролей':'Role change audit'}</h2>
  {audit.length?<div className="as-table-wrap"><table><thead><tr><th>{uk?'Коли':'When'}</th><th>{uk?'Хто змінив':'Actor'}</th><th>{uk?'Користувач':'User'}</th><th>{uk?'Зміна':'Change'}</th></tr></thead>
  <tbody>{audit.map(a=><tr key={a.id}><td>{new Date(a.createdAt).toLocaleString(uk?'uk-UA':'en-US')}</td><td>{a.actor.email}</td><td>{a.target.email}</td><td>{a.previousRole} → {a.newRole}</td></tr>)}</tbody></table></div>:
  <p className="as-muted">{uk?'Змін через адмінпанель ще не було.':'No role changes via the dashboard yet.'}</p>}
 </section>;
}
