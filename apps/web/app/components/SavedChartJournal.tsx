'use client';
import {useEffect,useState} from 'react';
import {readApiJson} from '../../lib/api-response';
import type {PortalLocale} from '../../lib/brand';
import JournalNoteEditor from './JournalNoteEditor';
type SavedChart={id:string;place:string;date:string;ascendant:string;createdAt:string};
export default function SavedChartJournal({locale}:{locale:PortalLocale}){
 const uk=locale==='uk';
 const [charts,setCharts]=useState<SavedChart[]>([]);
 const [selected,setSelected]=useState('');
 const [status,setStatus]=useState('');
 useEffect(()=>{let active=true;
  fetch('/api/v1/account/charts',{credentials:'same-origin',cache:'no-store'})
   .then(r=>readApiJson<SavedChart[]>(r))
   .then(items=>{if(active)setCharts(items)})
   .catch(e=>{if(active)setStatus(e instanceof Error?e.message:String(e))});
  return()=>{active=false};
 },[]);
 return <section aria-label={uk?'Нотатки до натальних карт':'Birth chart journal'}>
  <h2>{uk?'Спостереження до натальних карт':'Birth chart reflections'}</h2>
  {charts.length?<>
   <label htmlFor="journal-chart">{uk?'Обери збережену карту':'Select a saved chart'}</label>
   <select id="journal-chart" value={selected} onChange={e=>setSelected(e.target.value)}>
    <option value="">{uk?'Оберіть карту…':'Choose a chart…'}</option>
    {charts.map(c=><option key={c.id} value={c.id}>
     {(c.place||c.ascendant||'Jyotish')+' · '+c.date}
    </option>)}
   </select>
   {selected&&<JournalNoteEditor kind="CHART" referenceId={selected} locale={locale}/>}
  </>:<p className="as-muted">{uk?'Збережи натальну карту, щоб додати власні нотатки до трактування.':'Save a birth chart to write reflections about its reading.'}</p>}
  {status&&<p role="status">{status}</p>}
 </section>;
}
