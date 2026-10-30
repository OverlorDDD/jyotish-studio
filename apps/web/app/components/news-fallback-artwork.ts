/** First-party topic illustrations used only when an article has no reusable photo.
 * These self-contained SVGs require no remote services, cookies or media grants.
 * They must never be presented as photographs of the reported event.
 */
export type NewsArtworkTopic='jyotish'|'astrology'|'tarot'|'yoga'|'meditation'|'vedic'|'self-development'|'astronomy';
const SCENES:Record<NewsArtworkTopic,{from:string;to:string;glow:string;shape:string}>={
 jyotish:{from:'#231a3b',to:'#63435f',glow:'#e8c27b',shape:
  '<circle cx="470" cy="228" r="154" fill="none" stroke="#f0d49b" stroke-width="3"/>'+
  '<circle cx="470" cy="228" r="116" fill="none" stroke="#f0d49b" stroke-opacity=".7"/>'+
  '<circle cx="470" cy="228" r="75" fill="#d5a969" fill-opacity=".22"/>'+
  '<path d="M470 74V382 M316 228H624 M361 119L579 337 M579 119L361 337" stroke="#f0d49b" stroke-opacity=".65" stroke-width="3"/>'+
  '<circle cx="470" cy="228" r="33" fill="#f2ce88"/>'},
 astrology:{from:'#171d47',to:'#3d5c8c',glow:'#91cafa',shape:
  '<ellipse cx="480" cy="224" rx="250" ry="95" transform="rotate(-27 480 224)" fill="none" stroke="#a8d8fa" stroke-width="5"/>'+
  '<ellipse cx="480" cy="224" rx="204" ry="151" transform="rotate(20 480 224)" fill="none" stroke="#b8cef6" stroke-opacity=".55" stroke-width="3"/>'+
  '<circle cx="479" cy="224" r="80" fill="#ebc48b"/><circle cx="475" cy="219" r="60" fill="#fff0bb" fill-opacity=".38"/>'+
  '<circle cx="645" cy="128" r="31" fill="#8bcce6"/><circle cx="303" cy="293" r="22" fill="#dbaac8"/>'},
 tarot:{from:'#241632',to:'#795277',glow:'#f9c985',shape:
  '<g transform="translate(293 64) rotate(-11 105 158)"><rect width="205" height="318" rx="14" fill="#2c2147" stroke="#ecd19a" stroke-width="7"/><rect x="18" y="19" width="169" height="280" rx="7" fill="none" stroke="#e4c48a" stroke-width="2"/><path d="M102 60V258 M39 160H166" stroke="#d4a65e" stroke-width="3"/><circle cx="102" cy="160" r="57" fill="none" stroke="#f4d697" stroke-width="4"/></g>'+
  '<g transform="translate(515 58) rotate(9 105 158)"><rect width="205" height="318" rx="14" fill="#46305c" stroke="#ecd19a" stroke-width="7"/><rect x="18" y="19" width="169" height="280" rx="7" fill="none" stroke="#e4c48a" stroke-width="2"/><circle cx="105" cy="145" r="58" fill="#f7d38e"/><circle cx="128" cy="129" r="55" fill="#46305c"/><path d="M50 245L105 196L158 245" fill="none" stroke="#f4d697" stroke-width="5"/></g>'},
 yoga:{from:'#143b46',to:'#387c83',glow:'#9fe9cf',shape:
  '<circle cx="477" cy="140" r="48" fill="#d4f4df"/>'+
  '<path d="M450 201Q470 187 493 205L526 293L475 317L421 291Z" fill="#a9dfc6"/>'+
  '<path d="M448 236Q371 275 318 337 M498 236Q570 274 637 337" fill="none" stroke="#b8e8ce" stroke-width="26" stroke-linecap="round"/>'+
  '<path d="M475 314Q412 331 353 371 M475 314Q534 340 604 371" fill="none" stroke="#b8e8ce" stroke-width="30" stroke-linecap="round"/>'+
  '<path d="M290 387Q477 405 664 387" fill="none" stroke="#f1d5a4" stroke-width="7"/>'},
 meditation:{from:'#17374c',to:'#547e83',glow:'#f5d49a',shape:
  '<circle cx="483" cy="150" r="104" fill="#f1cd99" fill-opacity=".65"/>'+
  '<path d="M0 325L186 154L295 282L435 138L644 332L782 191L960 325V540H0Z" fill="#234d61"/>'+
  '<path d="M0 376L195 301L346 383L537 282L726 378L960 315V540H0Z" fill="#163c50"/>'+
  '<circle cx="475" cy="282" r="25" fill="#efdbb1"/><path d="M451 315Q474 303 500 315L528 371H424Z" fill="#efdbb1"/>'+
  '<path d="M425 353Q477 395 532 353" stroke="#efdbb1" stroke-width="21" stroke-linecap="round" fill="none"/>'},
 vedic:{from:'#342343',to:'#815459',glow:'#f6d39d',shape:
  '<path d="M234 357H733V388H234Z" fill="#eac59b"/><path d="M265 331H704V356H265Z" fill="#e2b987"/>'+
  '<path d="M290 323V198H675V323Z" fill="#dab083"/>'+
  '<path d="M257 202L483 80L711 202Z" fill="#f0c991"/><path d="M356 151L482 70L609 151Z" fill="#f5d49e"/>'+
  '<path d="M440 323V248Q480 194 526 248V323Z" fill="#3c304c"/>'+
  '<path d="M325 233H364V318H325Z M596 233H636V318H596Z" fill="#674458"/>'+
  '<circle cx="482" cy="68" r="14" fill="#fff0c5"/>'},
 'self-development':{from:'#1d3556',to:'#5b858b',glow:'#f5cb8e',shape:
  '<circle cx="659" cy="128" r="83" fill="#ffdd9d"/>'+
  '<path d="M0 353L202 153L346 304L506 95L756 342L860 223L960 358V540H0Z" fill="#385c76"/>'+
  '<path d="M0 393L160 302L362 370L527 252L760 386L960 300V540H0Z" fill="#22465d"/>'+
  '<path d="M480 540Q560 396 499 350Q443 318 505 263" fill="none" stroke="#f1d59e" stroke-width="28" stroke-linecap="round"/>'+
  '<path d="M506 95L456 164L507 147L549 173Z" fill="#d7e3e9"/>'},
 astronomy:{from:'#101a3a',to:'#345884',glow:'#b8cefc',shape:
  '<circle cx="721" cy="126" r="99" fill="#d3dff7"/><circle cx="691" cy="105" r="20" fill="#afc5e1"/><circle cx="748" cy="164" r="35" fill="#aabfda"/>'+
  '<path d="M200 389L310 315L385 391L501 298L621 384L712 320L851 391V540H200Z" fill="#1b3358"/>'+
  '<g transform="rotate(-28 423 227)"><rect x="290" y="190" width="290" height="74" rx="14" fill="#c8d9ed" stroke="#769bc3" stroke-width="9"/><rect x="550" y="175" width="41" height="104" rx="8" fill="#9dc4df"/></g>'+
  '<path d="M438 269L365 409 M438 269L528 411 M438 269L438 415" stroke="#d3b986" stroke-width="16" stroke-linecap="round"/>'+
  '<circle cx="437" cy="269" r="20" fill="#f2d8a2"/>'}
};
/** Distinct, first-party editorial cover per article, never an implied source photograph.
 * Stable hash ensures SSR/CSR agree and the same story retains its artwork. */
const memo=new Map<string,string>();
function coverHash(value:string):number{
 let h=2166136261;
 for(const char of value){h=Math.imul(h^char.charCodeAt(0),16777619);}
 return h>>>0;
}
export function newsFallbackArtwork(topic:NewsArtworkTopic,storyId=''):string{
 const key=topic+'|'+storyId;
 const cached=memo.get(key);if(cached)return cached;
 const t=SCENES[topic]||SCENES.astronomy;
 const hash=coverHash(key);
 const hue=hash%360;
 const ringX=135+(hash%590),ringY=110+((hash>>>9)%240);
 const stars=Array.from({length:14},(_,i)=>{
  const x=34+((hash*(i+7)^(i*733))>>>0)%890;
  const y=24+((hash*(i+11)^(i*577))>>>0)%470;
  return '<circle cx="'+x+'" cy="'+y+'" r="'+(1+i%3)+'" fill="#ffebbe" opacity=".65"/>';
 }).join('');
 const ornament='<circle cx="'+ringX+'" cy="'+ringY+'" r="'+(50+hash%115)+
  '" fill="none" stroke="#e9d3a5" stroke-opacity=".36" stroke-width="2"/>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img">'+
  '<defs><linearGradient id="bg" x1="0" y1="1" x2="1" y2="0"><stop stop-color="'+t.from+'"/><stop offset="1" stop-color="'+t.to+'"/></linearGradient>'+
  '<radialGradient id="glow"><stop stop-color="'+t.glow+'" stop-opacity=".47"/><stop offset="1" stop-color="'+t.glow+'" stop-opacity="0"/></radialGradient></defs>'+
  '<rect width="960" height="540" fill="url(#bg)"/><rect width="960" height="540" fill="hsl('+hue+' 35% 60%)" opacity=".14"/>'+
  '<circle cx="510" cy="182" r="330" fill="url(#glow)"/>'+stars+ornament+
  '<g>'+t.shape+'</g><rect x="16" y="16" width="928" height="508" rx="18" stroke="'+t.glow+'" stroke-opacity=".32" stroke-width="2" fill="none"/>'+
  '</svg>';
 const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
 if(memo.size>=300)memo.clear();
 memo.set(key,src);
 return src;
}
