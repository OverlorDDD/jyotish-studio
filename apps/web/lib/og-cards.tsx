/** 1200×630 share images for horoscope and compatibility pages.
 * Fonts are bundled subsets (assets/og, OFL / DejaVu licences) because the
 * default next/og font has no Cyrillic. No network, no personal data. */
import {ImageResponse} from 'next/og';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {HORO_YEAR,SIGNS,glyph,signBySlug,type HoroPeriod,type HoroSystem,type SignInfo} from './horoscope-signs';
import {bandLabel,parsePair,westernScores} from './compatibility';
import {TAGLINE} from './compatibility-texts';

export const OG_SIZE={width:1200,height:630};
const EL:Record<string,string>={fire:'#F0A06B',earth:'#B8C98A',air:'#9EC1F0',water:'#7FD3D9'};
type Font={name:string;data:Buffer;weight:500|700;style:'normal'};
let fontsPromise:Promise<Font[]>|null=null;
function fonts(){
 if(!fontsPromise){
  const dir=path.join(process.cwd(),'assets','og');
  fontsPromise=Promise.all([
   readFile(path.join(dir,'Inter-Bold.otf')).then(data=>({name:'Inter',data,weight:700 as const,style:'normal' as const})),
   readFile(path.join(dir,'Inter-Medium.otf')).then(data=>({name:'Inter',data,weight:500 as const,style:'normal' as const})),
   readFile(path.join(dir,'DejaVuSans-zodiac.ttf')).then(data=>({name:'Zodiac',data,weight:500 as const,style:'normal' as const}))
  ]);
  fontsPromise.catch(()=>{fontsPromise=null;});
 }
 return fontsPromise;
}

function Medal({s,size}:{s:SignInfo;size:number}){
 const c=EL[s.element.en]||'#E7BD72';
 return <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:size,height:size,borderRadius:size/2,
  border:'3px solid '+c,background:'radial-gradient(circle at 35% 30%,'+c+'40,#0F1A35 70%)',boxShadow:'0 0 80px '+c+'55',
  color:c,fontFamily:'Zodiac',fontSize:Math.round(size*.5)}}>{glyph(s).replace('︎','')}</div>;
}
function Frame({children,accent}:{children:React.ReactNode;accent:string}){
 return <div style={{display:'flex',width:'100%',height:'100%',position:'relative',fontFamily:'Inter',color:'#F3EEE4',
  background:'linear-gradient(150deg,#0B1428 0%,#16244A 58%,#0A1222 100%)',padding:'64px 76px'}}>
  <div style={{position:'absolute',left:-120,top:-160,width:640,height:640,borderRadius:320,background:'radial-gradient(circle,'+accent+'2e 0%,transparent 70%)'}}/>
  <div style={{position:'absolute',left:76,right:76,bottom:58,height:2,background:'rgba(231,189,114,.28)'}}/>
  <div style={{position:'absolute',left:76,bottom:20,display:'flex',fontSize:24,fontWeight:500,color:'#E7BD72'}}>galaxiora.com</div>
  {children}
 </div>;
}

/** Sign page card: «Скорпіон — гороскоп на 2027 рік». */
export async function signCard(locale:string,system:HoroSystem,slug:string,period:HoroPeriod){
 const s=signBySlug(slug)||SIGNS[0],uk=locale!=='en';
 const when:Record<HoroPeriod,string>=uk?{today:'на сьогодні',tomorrow:'на завтра',week:'на тиждень',month:'на місяць',year:'на '+HORO_YEAR+' рік'}:
  {today:'for today',tomorrow:'for tomorrow',week:'for the week',month:'for the month',year:'for '+HORO_YEAR};
 const kind=system==='vedic'?(uk?'Ведичний гороскоп':'Vedic horoscope'):(uk?'Гороскоп':'Horoscope');
 const sub=period==='year'?(uk?'Тема року · найкращі місяці · затемнення':'Theme of the year · best months · eclipses'):(uk?'Кохання · робота · гроші · здоров’я':'Love · work · money · health');
 const accent=EL[s.element.en];
 return image(<Frame accent={accent}>
  <div style={{display:'flex',alignItems:'center',gap:64,width:'100%',paddingBottom:40}}>
   <Medal s={s} size={300}/>
   <div style={{display:'flex',flexDirection:'column',flex:1}}>
    <div style={{display:'flex',fontSize:30,fontWeight:500,color:'#E7BD72'}}>{kind+' '+when[period]}</div>
    <div style={{display:'flex',fontSize:118,fontWeight:700,letterSpacing:-3,lineHeight:1.05,marginTop:8}}>{uk?s.uk:s.en}</div>
    <div style={{display:'flex',fontSize:30,fontWeight:500,color:'#CED6E6',marginTop:18}}>{sub}</div>
   </div>
  </div>
 </Frame>);
}

/** Pair card: two medals, the score and the pair's own line. */
export async function pairCard(locale:string,slug:string){
 const p=parsePair(slug),uk=locale!=='en';
 if(!p)return signCard(locale,'western',SIGNS[0].slug,'today');
 const w=westernScores(p.a,p.b),tag=TAGLINE[p.slug];
 return image(<Frame accent={EL[p.a.element.en]}>
  <div style={{display:'flex',flexDirection:'column',width:'100%',paddingBottom:40,justifyContent:'center'}}>
   <div style={{display:'flex',alignItems:'center',gap:28}}>
    <Medal s={p.a} size={190}/>
    <div style={{display:'flex',fontSize:70,color:'#E7BD72',fontWeight:500}}>+</div>
    <Medal s={p.b} size={190}/>
    <div style={{display:'flex',flexDirection:'column',marginLeft:40}}>
     <div style={{display:'flex',fontSize:120,fontWeight:700,letterSpacing:-4,lineHeight:1}}>{w.overall+'%'}</div>
     <div style={{display:'flex',fontSize:30,fontWeight:500,color:'#E7BD72',marginTop:6}}>{bandLabel(w.overall,uk?'uk':'en')}</div>
    </div>
   </div>
   <div style={{display:'flex',fontSize:62,fontWeight:700,letterSpacing:-1.5,marginTop:44}}>{uk?p.a.uk+' + '+p.b.uk:p.a.en+' + '+p.b.en}</div>
   <div style={{display:'flex',fontSize:32,fontWeight:500,color:'#CED6E6',marginTop:10}}>{tag?(uk?tag.uk:tag.en):''}</div>
  </div>
 </Frame>);
}

/** Compatibility hub card. */
export async function compatCard(locale:string){
 const uk=locale!=='en',a=SIGNS[0],b=SIGNS[4],c=SIGNS[8];
 return image(<Frame accent="#E7BD72">
  <div style={{display:'flex',alignItems:'center',gap:60,width:'100%',paddingBottom:40}}>
   <div style={{display:'flex',flexDirection:'column',flex:1}}>
    <div style={{display:'flex',fontSize:30,fontWeight:500,color:'#E7BD72'}}>{uk?'Сумісність знаків':'Sign compatibility'}</div>
    <div style={{display:'flex',fontSize:92,fontWeight:700,letterSpacing:-3,lineHeight:1.05,marginTop:10}}>{uk?'78 пар і 36 гун':'78 pairs and 36 gunas'}</div>
    <div style={{display:'flex',fontSize:30,fontWeight:500,color:'#CED6E6',marginTop:18}}>{uk?'Західна астрологія й ведична Ашта-кута':'Western astrology and Vedic Ashtakoota'}</div>
   </div>
   <div style={{display:'flex',flexDirection:'column',gap:18}}><Medal s={a} size={150}/><Medal s={b} size={150}/></div>
   <Medal s={c} size={150}/>
  </div>
 </Frame>);
}

async function image(el:React.ReactElement){
 try{return new ImageResponse(el,{...OG_SIZE,fonts:await fonts()});}
 catch{
  // Fonts unavailable: a plain branded card is better than a broken preview.
  return new ImageResponse(<div style={{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',background:'#0F1A35',color:'#E7BD72',fontSize:96,fontWeight:700}}>Galaxiora</div>,OG_SIZE);
 }
}
