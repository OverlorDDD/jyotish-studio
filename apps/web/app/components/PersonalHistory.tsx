'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';

type Note={id:string;kind:'TAROT'|'CHART'|'PRACTICE';referenceId:string;note:string;updatedAt:string};
type Practice={id:string;practiceSlug:string;completedAt:string};
const titles:Record<string,{uk:string;en:string}>={
 'gentle-breath':{uk:'Дихання без поспіху',en:'Unhurried breathing'},
 'desk-mobility':{uk:'Розминка за столом',en:'Desk mobility'},
 'five-senses':{uk:'П’ять відчуттів',en:'Five senses'},
 'evening-unwind':{uk:'Вечірнє розслаблення',en:'Evening unwind'}
};
export default function PersonalHistory({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [notes,setNotes]=useState<Note[]>([]),[practices,setPractices]=useState<Practice[]>([]);
 const [status,setStatus]=useState(''),[loading,setLoading]=useState(true);
 async function load(){
  const [n,p]=await Promise.all([
   fetch('/api/v1/personal/journal',{credentials:'same-origin',cache:'no-store'}).then(r=>readApiJson<Note[]>(r)),
   fetch('/api/v1/personal/practices',{credentials:'same-origin',cache:'no-store'}).then(r=>readApiJson<Practice[]>(r))
  ]);
  setNotes(n);setPractices(p);
 }
 useEffect(()=>{let active=true;
  load().catch(e=>{if(active)setStatus(e instanceof Error?e.message:String(e))})
   .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 async function remove(id:string){
  setStatus('');
  try{
   await readApiJson(await fetch('/api/v1/personal/journal/'+encodeURIComponent(id),
    {method:'DELETE',credentials:'same-origin'}));
   setNotes(items=>items.filter(item=>item.id!==id));
   setStatus(uk?'Нотатку видалено.':'Note deleted.');
  }catch(e){setStatus(e instanceof Error?e.message:String(e))}
 }
 return <section aria-label={uk?'Мій особистий журнал':'My personal journal'} className="as-profile-card">
  <h2>{uk?'Мій особистий журнал':'My personal journal'}</h2>
  <p className="as-muted">{uk?'Приватні записи до Таро, збережених карт і духовних практик. Ці тексти не передаються AI-провайдерам.':'Private notes for tarot, saved charts and practices. Your journal is never sent to AI providers.'}</p>
  {loading?<p>{uk?'Завантаження…':'Loading…'}</p>:<div>
   <h3>{uk?'Мої нотатки':'My notes'} · {notes.length}</h3>
   {notes.length?notes.map(n=><article className="as-draft-row" key={n.id}>
    <div>
     <small>{n.kind==='TAROT'?(uk?'Таро':'Tarot'):n.kind==='CHART'?(uk?'Натальна карта':'Birth chart'):(uk?'Практика':'Practice')} · {new Date(n.updatedAt).toLocaleDateString(uk?'uk-UA':'en-GB')}</small>
     <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{n.note}</p>
    </div>
    <button type="button" onClick={()=>void remove(n.id)} aria-label={uk?'Видалити нотатку':'Delete note'}>{uk?'Видалити':'Delete'}</button>
   </article>):<p className="as-muted">{uk?'Нотаток ще немає. Відкрий розклад Таро й запиши власне враження.':'No notes yet. Open a Tarot reading to add your reflection.'}</p>}
   <h3>{uk?'Мої практики':'My practices'} · {practices.length}</h3>
   {practices.length?practices.map(p=><p key={p.id}>
    <Link href={'/'+locale+'/yoga/'+p.practiceSlug}>{titles[p.practiceSlug]?.[locale]||p.practiceSlug}</Link>
    {' · '}{new Date(p.completedAt).toLocaleDateString(uk?'uk-UA':'en-GB')}
   </p>):<p className="as-muted">{uk?'Завершені практики з’являться після твого підтвердження.':'Practices appear only after you explicitly mark them completed.'}</p>}
  </div>}
  {status&&<p role="status">{status}</p>}
 </section>;
}
