'use client';
import {useEffect,useState} from 'react';

const CONSENT_KEY='galaxiora-analytics-choice-v1';
type Choice='accepted'|'rejected'|null;

/** Only an inline control in the existing Privacy page; never a banner or overlay.
 * No GA4 request is possible before an explicit visitor opt-in.
 */
export default function AnalyticsPreferences({locale}:{locale:'en'|'uk'}){
 const uk=locale==='uk';
 const [choice,setChoice]=useState<Choice>(null);
 const [loaded,setLoaded]=useState(false);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const sync=()=>{
   try{
    const stored=localStorage.getItem(CONSENT_KEY);
    setChoice(stored==='accepted'||stored==='rejected'?stored:null);
   }catch{setChoice(null)}
  };
  sync();
  setLoaded(true);
  window.addEventListener('storage',sync);
  return()=>window.removeEventListener('storage',sync);
 },[]);
 function decide(value:'accepted'|'rejected'){
  try{
   localStorage.setItem(CONSENT_KEY,value);
  }catch{setError(true);return}
  const withdrawing=choice==='accepted'&&value==='rejected';
  setError(false);
  setChoice(value);
  window.dispatchEvent(new Event('galaxiora:analytics-choice'));
  // Unloading the tag script alone does not unload an already executing gtag
  // runtime. Reload immediately on withdrawal to stop it in this document.
  if(withdrawing)window.location.reload();
 }
 return <section id="analytics-settings" aria-labelledby="analytics-settings-heading"
  style={{margin:'28px 0',padding:'20px 22px',border:'1px solid #69778d',borderRadius:12}}>
  <h3 id="analytics-settings-heading">{uk?'Налаштування аналітики':'Analytics preferences'}</h3>
  <p>{uk?
   'Google Analytics необов’язкова. Без вашого дозволу ми не завантажуємо Google-тег. Серверні агреговані лічильники працюють окремо й не зберігають IP, дані народження чи унікальний ідентифікатор відвідувача.':
   'Google Analytics is optional. We do not load the Google tag unless you opt in. Separate aggregate server counters do not store IP addresses, birth details, or unique visitor identifiers.'}</p>
  <p role="status" aria-live="polite" data-testid="analytics-consent-state">
   {!loaded?(uk?'Завантаження налаштувань…':'Loading preferences…'):
    choice==='accepted'?(uk?'Google Analytics: дозволено':'Google Analytics: allowed'):
    choice==='rejected'?(uk?'Google Analytics: відхилено':'Google Analytics: declined'):
    (uk?'Google Analytics: вимкнено за замовчуванням':'Google Analytics: off by default')}
  </p>
  {error&&<p role="alert">{uk?'Не вдалося зберегти вибір у цьому браузері.':'Could not save your choice in this browser.'}</p>}
  {loaded&&<div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
   {choice!=='accepted'&&<button type="button" onClick={()=>decide('accepted')}>
    {uk?'Дозволити аналітику':'Allow analytics'}
   </button>}
   {choice!=='rejected'&&<button type="button" onClick={()=>decide('rejected')}>
    {choice==='accepted'?(uk?'Відкликати згоду':'Withdraw consent'):(uk?'Залишити вимкненою':'Keep analytics off')}
   </button>}
  </div>}
 </section>;
}
