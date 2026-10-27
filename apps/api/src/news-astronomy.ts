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
 const articles:{key:string;atUtc:string;kind:string;uk:string;en:string;summaryUk:string;summaryEn:string}[]=[];
 if(phases.status==='fulfilled'){
  for(const e of phases.value.events.filter(x=>x.kind!=='sidereal_ingress'||x.body!=='Moon').slice(0,5)){
   const t=title(e.kind,e.body),insight=eventInsight(e.kind,'uk'),en=eventInsight(e.kind,'en');
   articles.push({key:e.kind+':'+(e.body||'')+':'+e.atUtc,kind:e.kind,atUtc:e.atUtc,
    uk:t.uk,en:t.en,
    summaryUk:'Час події за Swiss Ephemeris: '+e.atUtc+'. '+insight.meaning+' '+insight.practice,
    summaryEn:'Swiss Ephemeris event time: '+e.atUtc+'. '+en.meaning+' '+en.practice});
  }
 }
 if(eclipses.status==='fulfilled'){
  for(const x of eclipses.value.events.slice(0,2)){
   const k=x.type+'-eclipse',visual=x.visibleHere?'Видиме з координат Києва за обчисленою моделлю.':'За моделлю не видиме з Києва.';
   articles.push({key:k+':'+x.maximumUtc,kind:k,atUtc:x.maximumUtc,
    uk:(x.type==='solar'?'Сонячне':'Місячне')+' затемнення: '+x.eclipseKind+' — час максимуму',
    en:(x.type==='solar'?'Solar':'Lunar')+' eclipse: '+x.eclipseKind+' and maximum time',
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
   topic:'astronomy',tags:['astronomy','jyotish'],score:78,
   summary:a.summaryEn.slice(0,500),summaryKind:'ai_editorial',summaryUk:a.summaryUk.slice(0,700),
   summaryEn:a.summaryEn.slice(0,700),publishedAccuracy:'published',publishedAt:now,
   imageCredit:'Original Galaxiora thematic illustration'};
 });
 const created=await prisma.newsArticle.createMany({data:input,skipDuplicates:true});
 return {created:created.count,reason:'verified_original_astronomy'};
}
