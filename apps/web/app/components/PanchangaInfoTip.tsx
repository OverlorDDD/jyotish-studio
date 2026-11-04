import type {PortalLocale} from '../../lib/brand';
import styles from './PanchangaInfoTip.module.css';

/** Real hover/focus tooltip and tappable disclosure for all Panchanga terms.
 * The label stays plain-language; calculations live here, not in the card body.
 */
export default function PanchangaInfoTip({locale,text}:{locale:PortalLocale;text:string}){
 return <details className={styles.wrap}>
  <summary className={styles.trigger} aria-label={locale==='uk'?'Пояснення показника':'Explain this indicator'} title={text}>?</summary>
  <span className={styles.content} role="note">{text}</span>
 </details>;
}
