import {ImageResponse} from 'next/og';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fetchNewsStory,storyKey} from '../../../../lib/news-public';
import {rubricArt} from '../../../../lib/news-rubric-art';

/** Rubric stories share their own artwork (read from /public, no network). */
async function rubricPicture(slug:string){
 try{
  const key=storyKey(slug);const data=key?await fetchNewsStory(key):null;
  const r=data?.item.rubric;const art=r?rubricArt(r.kind,r.key):null;
  if(!art)return null;
  const bytes=await readFile(path.join(process.cwd(),'public',art.jpg));
  return 'data:image/jpeg;base64,'+bytes.toString('base64');
 }catch{return null;}
}
/** 1200×630 share/Discover image for a GalaxiNews story. Latin-only text
 * (the bundled OG font has no Cyrillic); the art carries the subject. */
export const alt='GalaxiNews — Galaxiora';
export const size={width:1200,height:630};
export const contentType='image/png';
export default async function StoryImage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const picture=await rubricPicture(slug);
 if(picture)return new ImageResponse(
  <div style={{display:'flex',width:'100%',height:'100%',position:'relative',background:'#0A1222'}}>
   <img src={picture} width={1200} height={675} style={{position:'absolute',left:0,top:-22,width:1200,height:675}}/>
   <div style={{position:'absolute',left:40,bottom:34,display:'flex',padding:'10px 18px',borderRadius:999,background:'rgba(10,18,34,.72)',color:'#E7BD72',fontSize:28}}>GalaxiNews</div>
  </div>,size);
 return new ImageResponse(
  <div style={{display:'flex',width:'100%',height:'100%',position:'relative',background:'linear-gradient(150deg,#0B1428 0%,#16244A 55%,#0A1222 100%)',color:'#F3EEE4',padding:'70px 80px',flexDirection:'column',justifyContent:'flex-end'}}>
   <div style={{position:'absolute',width:520,height:520,borderRadius:260,right:110,top:40,background:'radial-gradient(circle,rgba(242,201,130,.55) 0%,rgba(242,201,130,0) 70%)'}}/>
   <div style={{position:'absolute',width:70,height:70,borderRadius:35,right:335,top:265,background:'#FFF4D6',boxShadow:'0 0 80px #F2C982'}}/>
   <div style={{position:'absolute',left:0,right:0,top:420,height:3,background:'rgba(231,189,114,.35)'}}/>
   <div style={{fontSize:30,color:'#E7BD72',marginBottom:14}}>GalaxiNews</div>
   <div style={{fontSize:84,fontWeight:700,letterSpacing:-2}}>Galaxiora</div>
   <div style={{fontSize:32,color:'#CED6E6',marginTop:10}}>Sky events · Jyotish · Swiss Ephemeris</div>
  </div>,size);
}
