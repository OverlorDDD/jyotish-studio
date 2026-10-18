'use client';
import {useEffect,useState} from 'react';
import {tarotArtLocal,tarotArtRemote} from '../../lib/tarot-art';

type Props={id:string;name:string;reversed:boolean;locale:'uk'|'en'};
export default function TarotCardArt({id,name,reversed,locale}:Props){
 const local=tarotArtLocal(id),remote=tarotArtRemote(id);
 const [source,setSource]=useState<string|null>(local);
 useEffect(()=>setSource(local),[local]);
 return <span className="as-rws-art-wrap">
  {source?<img className={'as-rws-art '+(reversed?'is-reversed':'')}
   src={source} alt={name+(reversed?(locale==='uk'?' — перевернута':' — reversed'):'')}
   loading="lazy" decoding="async" draggable={false}
   onError={()=>setSource(current=>current===local?remote:null)}/>:
   <span className="as-rws-missing">{name}</span>}
 </span>;
}
