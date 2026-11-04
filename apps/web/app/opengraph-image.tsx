import {ImageResponse} from 'next/og';
export const runtime='edge';
export const alt='Galaxiora — Jyotish, Tarot, Panchanga and mindful living';
export const size={width:1200,height:630};
export const contentType='image/png';
export default function OpenGraphImage(){
 return new ImageResponse(
  <div style={{display:'flex',width:'100%',height:'100%',position:'relative',
   background:'linear-gradient(135deg,#101b35 0%,#253357 55%,#10162b 100%)',
   color:'#f5e3bf',padding:'88px 95px',flexDirection:'column',justifyContent:'center'}}>
   <div style={{position:'absolute',width:380,height:380,borderRadius:190,right:90,top:112,
    border:'3px solid #d9b977',boxShadow:'0 0 0 25px #c1a36633,0 0 0 60px #c1a36617'}}/>
   <div style={{position:'absolute',width:170,height:170,borderRadius:85,right:194,top:222,
    background:'radial-gradient(circle at 38% 35%,#f5da9b,#d1a862 60%,#8b623f)',boxShadow:'0 0 95px #e6c78d66'}}/>
   <div style={{fontSize:25,color:'#dbbf8e',letterSpacing:8,marginBottom:28}}>EXPLORE YOUR UNIVERSE</div>
   <div style={{fontSize:108,fontWeight:700,letterSpacing:-3,lineHeight:1.12,maxWidth:790}}>Galaxiora</div>
   <div style={{fontSize:31,lineHeight:1.5,color:'#dce3f0',maxWidth:760,marginTop:26}}>
    Jyotish · Tarot · Panchanga · Yoga
   </div>
   <div style={{position:'absolute',left:95,bottom:65,width:170,height:5,background:'#dabb83',borderRadius:5}}/>
  </div>,size);
}
