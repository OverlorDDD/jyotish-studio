'use client';
/** Two sign selects → the canonical pair page. Pre-selects the remembered sign. */
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import styles from './Horoscope.module.css';
import {SIGNS,type HoroLocale} from '../../../lib/horoscope-signs';

export default function CompatPicker({locale}:{locale:HoroLocale}){
 const uk=locale==='uk',router=useRouter();
 const [a,setA]=useState('aries'),[b,setB]=useState('leo');
 useEffect(()=>{
  try{const saved=JSON.parse(localStorage.getItem('gx-horo-sign')||'{}') as {western?:string};
   if(saved.western&&SIGNS.some(s=>s.slug===saved.western))setA(saved.western);}catch{/* private mode */}
 },[]);
 const go=(e:React.FormEvent)=>{
  e.preventDefault();
  const x=SIGNS.find(s=>s.slug===a)!,y=SIGNS.find(s=>s.slug===b)!;
  const slug=x.n<=y.n?x.slug+'-'+y.slug:y.slug+'-'+x.slug;
  router.push('/'+locale+'/horoscope/compatibility/'+slug);
 };
 const options=SIGNS.map(s=><option key={s.slug} value={s.slug}>{uk?s.uk:s.en}</option>);
 return <form className={styles.picker} onSubmit={go}>
  <label>{uk?'Ваш знак':'Your sign'}<select value={a} onChange={e=>setA(e.target.value)}>{options}</select></label>
  <span className={styles.plus} aria-hidden="true">+</span>
  <label>{uk?'Знак партнера':'Partner’s sign'}<select value={b} onChange={e=>setB(e.target.value)}>{options}</select></label>
  <button type="submit" className={styles.btn}>{uk?'Показати сумісність':'Show compatibility'}</button>
 </form>;
}
