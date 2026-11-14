/** Small shared pieces for Horoscopes v3 (server-safe, no hooks). */
import styles from './Horoscope.module.css';
import type {SignInfo} from '../../../lib/horoscope-signs';
export const elClass=(s:SignInfo)=>styles[s.element.en as 'fire'|'earth'|'air'|'water'];
export function Dots({n,label}:{n:number;label:string}){
 return <span className={styles.dots} role="img" aria-label={label+': '+n+'/5'}>{[1,2,3,4,5].map(i=><i key={i} data-on={i<=n?'1':'0'}/>)}</span>;
}
