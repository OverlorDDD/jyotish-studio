/** Original first-party Galaxiora astronomy news, never syndicated fiction.
 * Every fact derives from Swiss AE-P5/AE-P6 event endpoints. No user profiles.
 * Disabled until a real HTTPS site URL is configured, preventing wrong links.
 */
import {createHash} from 'node:crypto';
import type {PrismaService} from './prisma.ts';
import {astronomicalEventsWindow} from './astronomical-events.ts';
import {observerEclipses} from './astronomy-eclipses.ts';
import {eventInsight} from '../../../packages/jyotish-core/src/astro-education.ts';
import {localToday} from './personal-transits.ts';
const BODIES_UK:Record<string,string>={Sun:'Сонця',Moon:'Місяця',Mercury:'Меркурія',
 Venus:'Венери',Mars:'Марса',Jupiter:'Юпітера',Saturn:'Сатурна'};
const title=(kind:string,body?:string)=>{
 const planet=BODIES_UK[body||'']||'планети';
 if(kind==='new_moon')return {uk:'Наближається молодик: астрономічний момент і ведична традиція',en:'Upcoming New Moon: astronomical moment and Vedic tradition'};
 if(kind==='full_moon')return {uk:'Повня: точний астрономічний час і традиція Пурніми',en:'Full Moon: precise astronomical moment and Purnima tradition'};
 if(kind==='first_quarter')return {uk:'Перша чверть Місяця: час переходу й практичний орієнтир',en:'First Quarter Moon: exact transition and practical orientation'};
 if(kind==='last_quarter')return {uk:'Остання чверть Місяця: що означає ця фаза',en:'Last Quarter Moon: what this lunar phase means'};
 if(kind==='sidereal_ingress')return {uk:'Перехід '+planet+' у новий сидеричний знак — астрономічна подія',en:(body||'Planet')+' enters a new sidereal sign'};
 return {uk:(kind==='retrograde_station'?'Початок видимого ретроградного руху ':'Завершення ретроградності ')+planet,
  en:(body||'Planet')+(kind==='retrograde_station'?' stations retrograde':' stations direct')};
};
const NOM_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mercury:'Меркурій',Venus:'Венера',
 Mars:'Марс',Jupiter:'Юпітер',Saturn:'Сатурн'};
const SIGN_GEN_UK=['Овна','Тельця','Близнюків','Рака','Лева','Діви','Терезів','Скорпіона','Стрільця','Козорога','Водолія','Риб'];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const MONTH_GEN_UK=['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
const MONTH_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
/** Civil date of an instant in Kyiv, as [year, monthIndex, day]. */
function kyivDate(atUtc:string):[number,number,number]{
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'})
  .format(new Date(atUtc)).split('-').map(Number);
 return [p[0],p[1]-1,p[2]];
}
export type SkyEvent={kind:string;body?:string;atUtc:string;sign?:number;longitude?:number;fromSign?:number;toSign?:number;eclipseKind?:string;visibleHere?:boolean};
/** Specific, dated headlines: «Венера розвертається в прямий рух 14 листопада 2026». */
export function skyHeadline(e:SkyEvent):{uk:string;en:string}{
 const [y,m,d]=kyivDate(e.atUtc),dUk=d+' '+MONTH_GEN_UK[m]+' '+y,dEn=d+' '+MONTH_EN[m]+' '+y;
 const nom=NOM_UK[e.body||'']||'Планета',en=e.body||'Planet',fem=e.body==='Venus',neut=e.body==='Sun';
 switch(e.kind){
  case 'new_moon':return {uk:'Молодик '+dUk,en:'New Moon on '+dEn};
  case 'full_moon':return {uk:'Повня '+dUk,en:'Full Moon on '+dEn};
  case 'first_quarter':return {uk:'Перша чверть Місяця '+dUk,en:'First Quarter Moon on '+dEn};
  case 'last_quarter':return {uk:'Остання чверть Місяця '+dUk,en:'Last Quarter Moon on '+dEn};
  case 'direct_station':return {uk:nom+' розвертається в прямий рух '+dUk,en:en+' stations direct on '+dEn};
  case 'retrograde_station':return {uk:nom+' стає '+(fem?'ретроградною':neut?'ретроградним':'ретроградним')+' '+dUk,en:en+' stations retrograde on '+dEn};
  case 'sidereal_ingress':{
   const to=e.toSign&&e.toSign>=1&&e.toSign<=12?e.toSign:0;
   return to?{uk:nom+' входить у знак '+SIGN_GEN_UK[to-1]+' '+dUk,en:en+' enters sidereal '+SIGN_EN[to-1]+' on '+dEn}
    :{uk:nom+' змінює знак '+dUk,en:en+' changes sign on '+dEn};
  }
  default:return {uk:'Подія неба '+dUk,en:'Sky event on '+dEn};
 }
}
/** Event facts travel with the row as internal tags (no schema change).
 * Public API strips them from `tags` and returns `event` instead. */
export function skyTags(e:SkyEvent):string[]{
 const out=['ev:'+e.kind,'evt:'+e.atUtc];
 if(e.body)out.push('evb:'+e.body);
 if(typeof e.sign==='number')out.push('evs:'+e.sign);
 if(typeof e.longitude==='number'&&Number.isFinite(e.longitude))out.push('evl:'+e.longitude.toFixed(3));
 if(typeof e.fromSign==='number')out.push('evf:'+e.fromSign);
 if(typeof e.toSign==='number')out.push('evto:'+e.toSign);
 if(e.eclipseKind&&/^[a-z]{3,12}$/.test(e.eclipseKind))out.push('evk:'+e.eclipseKind);
 if(typeof e.visibleHere==='boolean')out.push('evv:'+(e.visibleHere?1:0));
 return out;
}
export function skyEventFromTags(tags:readonly string[]):SkyEvent|null{
 const get=(k:string)=>tags.find(t=>t.startsWith(k+':'))?.slice(k.length+1);
 const kind=get('ev'),atUtc=get('evt');
 if(!kind||!/^[a-z_-]{3,30}$/.test(kind)||!atUtc||!Number.isFinite(Date.parse(atUtc)))return null;
 const num=(k:string)=>{const v=get(k);const n=v===undefined?NaN:Number(v);return Number.isFinite(n)?n:undefined;};
 const body=get('evb'),ek=get('evk'),ev=get('evv');
 return {kind,atUtc,...(ek&&/^[a-z]{3,12}$/.test(ek)?{eclipseKind:ek}:{}),...(ev==='1'||ev==='0'?{visibleHere:ev==='1'}:{}),...(body&&/^[A-Z][a-z]{2,8}$/.test(body)?{body}:{}),
  ...(num('evs')!==undefined?{sign:num('evs')}:{}),...(num('evl')!==undefined?{longitude:num('evl')}:{}),
  ...(num('evf')!==undefined?{fromSign:num('evf')}:{}),...(num('evto')!==undefined?{toSign:num('evto')}:{})};
}
export function astronomicalNewsSiteOrigin(raw=process.env.NEXT_PUBLIC_SITE_URL){
 if(!raw)return null;
 try{const u=new URL(raw);return u.protocol==='https:'&&u.pathname==='/'&&
  !u.port&&!u.search&&!u.hash&&!u.username&&!u.password&&u.hostname!=='localhost'?u.origin:null;}
 catch{return null;}
}
export async function publishAstronomicalNews(prisma:PrismaService){
 const origin=astronomicalNewsSiteOrigin();
 if(!origin)return {created:0,reason:'public_https_site_url_not_configured'};
 const today=localToday('Europe/Kyiv'), now=new Date();
 const [phases,eclipses]=await Promise.allSettled([
  astronomicalEventsWindow({start:today,days:14,timeZone:'Europe/Kyiv'}),
  observerEclipses({start:today,days:90,timeZone:'Europe/Kyiv',latitude:50.4501,longitude:30.5234})
 ]);
 const articles:{key:string;atUtc:string;kind:string;uk:string;en:string;summaryUk:string;summaryEn:string;tags:string[]}[]=[];
 if(phases.status==='fulfilled'){
  for(const e of phases.value.events.filter(x=>x.kind!=='sidereal_ingress'||x.body!=='Moon').slice(0,5)){
   const t=skyHeadline(e),insight=eventInsight(e.kind,'uk'),en=eventInsight(e.kind,'en');
   void title;
   articles.push({key:e.kind+':'+(e.body||'')+':'+e.atUtc,kind:e.kind,atUtc:e.atUtc,tags:skyTags(e),
    uk:t.uk,en:t.en,
    summaryUk:'Час події за Swiss Ephemeris: '+e.atUtc+'. '+insight.meaning+' '+insight.practice,
    summaryEn:'Swiss Ephemeris event time: '+e.atUtc+'. '+en.meaning+' '+en.practice});
  }
 }
 if(eclipses.status==='fulfilled'){
  for(const x of eclipses.value.events.slice(0,2)){
   const k=x.type+'-eclipse',visual=x.visibleHere?'Видиме з координат Києва за обчисленою моделлю.':'За моделлю не видиме з Києва.';
   articles.push({key:k+':'+x.maximumUtc,kind:k,atUtc:x.maximumUtc,tags:skyTags({kind:k,atUtc:x.maximumUtc,eclipseKind:String(x.eclipseKind||'').toLowerCase()||undefined,visibleHere:Boolean(x.visibleHere)}),
    uk:(({total:'Повне ',annular:'Кільцеподібне ',partial:'Часткове ',penumbral:'Напівтіньове ',hybrid:'Гібридне '} as Record<string,string>)[String(x.eclipseKind).toLowerCase()]||'')+
     (x.type==='solar'?(x.eclipseKind?'сонячне':'Сонячне'):(x.eclipseKind?'місячне':'Місячне'))+' затемнення '+skyHeadline({kind:'x',atUtc:x.maximumUtc}).uk.replace(/^Подія неба /,''),
    en:(x.eclipseKind?String(x.eclipseKind).charAt(0).toUpperCase()+String(x.eclipseKind).slice(1)+' ':'')+(x.type==='solar'?'solar':'lunar')+' eclipse on '+skyHeadline({kind:'x',atUtc:x.maximumUtc}).en.replace(/^Sky event on /,''),
    summaryUk:'Swiss Ephemeris обчислює максимум '+x.maximumUtc+'. '+visual+
     ' Локальна видимість залежить від обраної місцевості; це не прогноз затемнення за самою фазою Місяця.',
    summaryEn:'Swiss Ephemeris calculates the maximum at '+x.maximumUtc+'. '+
     (x.visibleHere?'Modelled visible from Kyiv.':'Not modelled visible from Kyiv.')+
     ' Local visibility varies by observer; an ordinary new or full Moon is not an eclipse.'});
  }
 }
 if(!articles.length)return {created:0,reason:'no_verified_upcoming_events'};
 const input=articles.slice(0,6).map(a=>{
  const hash=createHash('sha256').update('galaxiora-astro-original-v1:'+a.key).digest('hex');
  return {urlHash:hash,url:origin+'/uk/panchanga?date='+a.atUtc.slice(0,10)+'#astronomical-events',
   title:a.en.slice(0,240),titleUk:a.uk.slice(0,300),source:'Galaxiora Astronomical Calendar',language:'uk',
   topic:'astronomy',tags:['astronomy','jyotish',...a.tags],score:78,
   summary:a.summaryEn.slice(0,500),summaryKind:'ai_editorial',summaryUk:a.summaryUk.slice(0,700),
   summaryEn:a.summaryEn.slice(0,700),publishedAccuracy:'published',publishedAt:now,
   imageCredit:'Original Galaxiora thematic illustration'};
 });
 const created=await prisma.newsArticle.createMany({data:input,skipDuplicates:true});
 // Rows created by older releases get the dated headline and event facts too.
 let upgraded=0;
 for(const row of input){
  const r=await prisma.newsArticle.updateMany({where:{urlHash:row.urlHash,source:row.source,
   NOT:{tags:{has:row.tags.find(t=>t.startsWith('evt:'))!}}},
   data:{title:row.title,titleUk:row.titleUk,tags:row.tags}});
  upgraded+=r.count;
 }
 return {created:created.count,upgraded,reason:'verified_original_astronomy'};
}
