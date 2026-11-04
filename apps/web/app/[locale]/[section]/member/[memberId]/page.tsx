import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import GalaxiComMember from '../../../../components/GalaxiComMember';
import {isPortalLocale,type PortalLocale} from '../../../../../lib/brand';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'GalaxiCom · Member',robots:{index:false,follow:true}};
export default async function MemberPage({params}:{params:Promise<{locale:string;section:string;memberId:string}>}){
 const {locale,section,memberId}=await params;
 if(!isPortalLocale(locale)||section!=='community'||!/^[0-9a-f-]{36}$/i.test(memberId))notFound();
 return <GalaxiComMember locale={locale as PortalLocale} memberId={memberId}/>;
}
