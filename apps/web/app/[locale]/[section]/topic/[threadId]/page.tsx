import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import GalaxiCom from '../../../../components/GalaxiCom';
import {isPortalLocale,type PortalLocale} from '../../../../../lib/brand';

export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{locale:string;section:string;threadId:string}>}):Promise<Metadata>{
 const {locale,section}=await params;
 if(!isPortalLocale(locale)||section!=='community')return {};
 return {title:'GalaxiCom · '+(locale==='uk'?'Обговорення':'Discussion'),
  robots:{index:false,follow:true}};
}
export default async function DiscussionPage({params}:{params:Promise<{locale:string;section:string;threadId:string}>}){
 const {locale,section,threadId}=await params;
 if(!isPortalLocale(locale)||section!=='community'||!/^[0-9a-f-]{36}$/i.test(threadId))notFound();
 return <GalaxiCom locale={locale as PortalLocale} threadId={threadId}/>;
}
