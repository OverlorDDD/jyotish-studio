'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,MessageCircle,ShieldCheck,Star} from 'lucide-react';
import PortalShell from './PortalShell';
import styles from './GalaxiCom.module.css';
import type {PortalLocale} from '../../lib/brand';
type Growth={signature:string;accent:string;helpful:number;reputation:string};
type Profile={member:{id:string;name:string;expert:boolean;premium:boolean};
 threadCount:number;replyCount:number;
 threads:{id:string;title:string;createdAt:string}[];
 replies:{id:string;threadId:string;title:string;createdAt:string}[]};
export default function GalaxiComMember({locale,memberId}:{locale:PortalLocale;memberId:string}){
 const [data,setData]=useState<Profile|null>(null),[growth,setGrowth]=useState<Growth|null>(null),[error,setError]=useState(false);
 const uk=locale==='uk',root='/'+locale+'/community';
 useEffect(()=>{
  let live=true;
  fetch('/api/v1/com/profiles/'+memberId,{cache:'no-store'}).then(async res=>{
   if(!res.ok)throw new Error('Not found');return res.json() as Promise<Profile>;
  }).then(x=>{if(live)setData(x)}).catch(()=>{if(live)setError(true)});
  fetch('/api/v1/com/growth/members/'+memberId,{cache:'no-store'})
   .then(r=>r.ok?r.json():null).then(x=>{if(live)setGrowth(x as Growth|null)}).catch(()=>{});
  return()=>{live=false};
 },[memberId]);
 return <PortalShell locale={locale} active="community" languagePath={'community/member/'+memberId}>
  <div className={styles.wrap}>
   <Link href={root} className={styles.back}><ArrowLeft size={16}/>{uk?'До форуму':'Back to forum'}</Link>
   {!data?<p className={styles.empty}>{error?(uk?'Профіль не знайдено':'Profile unavailable'):
    (uk?'Завантаження…':'Loading…')}</p>:
    <section className={styles.profileCard} data-testid="com-public-profile" data-accent={growth?.accent||'default'}>
     <h1>{data.member.name}</h1>
     <div className={styles.actions}>
      {data.member.expert&&<span className={styles.expert}><ShieldCheck size={14}/>{uk?'Перевірений експерт':'Verified expert'}</span>}
      {data.member.premium&&<span className={styles.premium}><Star size={14}/>PREMIUM</span>}
     </div>
     {growth&&<div data-testid="com-reputation">
      <strong>{uk?'Репутація':'Reputation'}: {({NEW:uk?'Новачок':'Newcomer',ACTIVE:uk?'Активний учасник':'Active member',HELPFUL:uk?'Корисний дописувач':'Helpful contributor',GUIDE:uk?'Провідний учасник':'Leading contributor'} as Record<string,string>)[growth.reputation]||growth.reputation} · {growth.helpful} {uk?'позначок «Корисно»':'helpful votes'}</strong>
      {growth.signature&&<p>{growth.signature}</p>}
     </div>}
     <p>{uk?'Тем':'Threads'}: {data.threadCount} · {uk?'Відповідей':'Replies'}: {data.replyCount}</p>
     <h2>{uk?'Останні теми':'Recent topics'}</h2>
     {data.threads.length?data.threads.map(t=><p key={t.id}><Link href={root+'/topic/'+t.id}>
      {t.title}</Link></p>):<p>{uk?'Опублікованих тем ще немає':'No published topics'}</p>}
     <h2>{uk?'Участь в обговореннях':'Recent replies'}</h2>
     {data.replies.length?data.replies.map(p=><p key={p.id}><MessageCircle size={14} aria-hidden="true"/> <Link href={root+'/topic/'+p.threadId}>
      {p.title}</Link></p>):<p>{uk?'Опублікованих відповідей ще немає':'No published replies'}</p>}
    </section>}
  </div>
 </PortalShell>;
}
