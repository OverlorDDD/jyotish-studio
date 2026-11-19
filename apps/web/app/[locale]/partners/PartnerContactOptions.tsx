'use client';

import {useRef,useState} from 'react';
import {Check,Copy,ExternalLink,Mail} from 'lucide-react';
import styles from './Partners.module.css';

type Props={locale:'en'|'uk';email:string};

const COPY={
 en:{
  address:'Partnership email',copy:'Copy address',copied:'Copied',select:'Address selected — press Ctrl+C to copy it.',
  instruction:'Choose your email service to open a draft, or copy the address and send from any provider.',
  gmail:'Write in Gmail',outlook:'Write in Outlook',desktop:'Use an email app',
  note:'Your email service opens a draft; Galaxiora does not send a message until you send it there.'
 },
 uk:{
  address:'Пошта для співпраці',copy:'Скопіювати адресу',copied:'Скопійовано',select:'Адресу виділено — натисніть Ctrl+C, щоб скопіювати.',
  instruction:'Оберіть поштовий сервіс для створення листа або скопіюйте адресу й напишіть із будь-якої пошти.',
  gmail:'Написати через Gmail',outlook:'Написати через Outlook',desktop:'Поштова програма',
  note:'Відкриється чернетка в обраному сервісі. Лист буде надіслано лише після вашого підтвердження там.'
 }
} as const;

export default function PartnerContactOptions({locale,email}:Props){
 const [copyState,setCopyState]=useState<'idle'|'copied'|'select'>('idle');
 const field=useRef<HTMLInputElement>(null);
 const c=COPY[locale];
 const subject='Galaxiora editorial collaboration';
 const gmail='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(email)+'&su='+encodeURIComponent(subject);
 const outlook='https://outlook.live.com/mail/0/deeplink/compose?to='+encodeURIComponent(email)+'&subject='+encodeURIComponent(subject);
 const native='mailto:'+email+'?subject='+encodeURIComponent(subject);
 async function copyAddress(){
  try {
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard API unavailable');
   await navigator.clipboard.writeText(email);
   setCopyState('copied');
  }catch{
   const input=field.current;
   if(!input){setCopyState('select');return;}
   input.focus();input.select();
   try{setCopyState(document.execCommand('copy')?'copied':'select');}
   catch{setCopyState('select');}
  }
 }
 return <div className={styles.contactPanel} id="contact-methods">
  <p className={styles.contactInstruction}>{c.instruction}</p>
  <label className={styles.contactEmailLabel} htmlFor="partner-contact-email">{c.address}</label>
  <div className={styles.contactEmailRow}>
   <input ref={field} id="partner-contact-email" className={styles.contactEmailField}
    type="email" value={email} readOnly onClick={event=>event.currentTarget.select()}/>
   <button className={styles.copyAction} type="button" onClick={copyAddress}
    aria-label={copyState==='copied'?c.copied:c.copy}>
    {copyState==='copied'?<Check size={17} aria-hidden="true"/>:<Copy size={17} aria-hidden="true"/>}
    {copyState==='copied'?c.copied:c.copy}
   </button>
  </div>
  <p role="status" aria-live="polite" className={styles.contactCopyFeedback}>
   {copyState==='copied'?c.copied:copyState==='select'?c.select:''}
  </p>
  <div className={styles.emailProviders}>
   <a href={gmail} target="_blank" rel="noopener noreferrer" className={styles.primaryAction}>
    <Mail size={18} aria-hidden="true"/>{c.gmail}<ExternalLink size={16} aria-hidden="true"/>
   </a>
   <a href={outlook} target="_blank" rel="noopener noreferrer" className={styles.secondaryAction}>
    {c.outlook}<ExternalLink size={16} aria-hidden="true"/>
   </a>
   <a href={native} className={styles.nativeEmailLink}>{c.desktop}</a>
  </div>
  <p className={styles.contactProviderNote}>{c.note}</p>
 </div>;
}
