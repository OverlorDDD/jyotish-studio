import Link from 'next/link';
import {ArrowUpRight,MessageCircle} from 'lucide-react';
import type {PortalLocale} from '../../lib/brand';
import styles from './GalaxiComBridge.module.css';
export default function GalaxiComModuleLink({locale,kind}:{
 locale:PortalLocale;kind:'jyotish'|'tarot'
}){
 const uk=locale==='uk';
 return <aside className={styles.module} data-testid="community-module-link">
  <MessageCircle size={22} aria-hidden="true"/>
  <div>
   <h2>{uk?'Обговорити у спільноті':'Discuss with the community'}</h2>
   <p>{uk?'Постав тематичне запитання без автоматичної публікації натальної карти, розкладу чи приватного журналу.':
    'Ask a general question. Your chart, reading and private journal are never shared automatically.'}</p>
   <Link href={'/'+locale+'/community?category='+kind}>
    {uk?'Перейти до GalaxiCom':'Open GalaxiCom'} <ArrowUpRight size={17}/>
   </Link>
  </div>
 </aside>;
}
