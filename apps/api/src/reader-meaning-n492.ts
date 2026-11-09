/**
 * N4.9.2 — one concise, substantive reading per Shodashvarga, ordered D1..D60.
 * Uses existing v6 authored consultation AS EDITORIAL SOURCE, actual D1 lordship,
 * conditional yogakaraka, sign-dignity, traditional topic and verified varga.
 * No mandatory unrelated chart cross-reference. A linked chart must contribute
 * actual evidence; otherwise it is omitted.
 *
 * This is NOT an independent historical-varga or birth-time certificate.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor,ruleFindings} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {authorConsultationV6} from './reader-narrative-v6.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';

export const N492_MEANING_VERSION='n492-evidence-prioritized-16-varga-v1' as const;
export const N492_ORDER=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60] as const;
type Lang='uk'|'en';
type Card={division:number;title:string;meaning:string;connection:string|null;
 status:'notable'|'mixed'|'contextual'|'provisional';proof:string[];sourceIds:string[]};
export type MeaningfulReading={version:typeof N492_MEANING_VERSION;
 cards:readonly Card[];summary:{title:string;strength:string;attention:string;direction:string;proof:string[]};
 method:string};
const HEADS:Readonly<Record<number,[string,string,number]>>={
 1:['Особистість і життєвий напрям','Identity and direction',1],
 2:['Гроші й ресурси','Money and resources',2],
 3:['Сміливість, спілкування, рідні брати й сестри','Courage, communication and siblings',3],
 4:['Дім, нерухомість і опора','Home, property and security',4],
 7:['Діти й творча спадщина','Children and creative legacy',5],
 9:['Партнерство і зрілість союзу','Partnership and mature commitment',7],
 10:['Кар’єра та професійні здібності','Career and vocation',10],
 12:['Батьки та родинні корені','Parents and ancestry',4],
 16:['Комфорт і транспорт','Comfort and vehicles',4],
 20:['Духовна практика','Spiritual practice',9],
 24:['Навчання і майстерність','Education and mastery',5],
 27:['Витривалість і внутрішні ресурси','Resilience and capabilities',1],
 30:['Труднощі й стратегії подолання','Difficulties and how to face them',6],
 40:['Материнська лінія','Maternal lineage',4],
 45:['Батьківська лінія та принципи','Paternal lineage and values',9],
 60:['D60 · Тонкі положення планет','D60 · Fine planetary positions',1]
};
const SIGN_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const NAMES_UK:Readonly<Record<string,string>>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',
 Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const AREAS:Readonly<Record<number,[string,string]>>={
 1:['особистих рішень','personal decisions'],
 2:['грошей, мовлення та сімейних цінностей','money, speech and family values'],
 3:['навичок і спілкування','skills and communication'],
 4:['дому й внутрішньої опори','home and stability'],
 5:['творчості, навчання та дітей','creativity, learning and children'],
 6:['праці та складних завдань','work and challenges'],
 7:['партнерства і домовленостей','partnership and agreements'],
 8:['спільних зобов’язань і змін','shared responsibilities and change'],
 9:['знань, наставників і світогляду','knowledge, mentors and worldview'],
 10:['професії та відповідальності','career and responsibility'],
 11:['здобутків та однодумців','achievements and allies'],
 12:['усамітнення й відновлення','solitude and recovery']
};
const PRACTICAL:Readonly<Record<number,[string,string]>>={
 1:['Порівняйте власні цілі з тим, що справді допомагає відновлювати сили.','Compare your outward goals with what actually restores your energy.'],
 2:['Розділяйте заробіток, збереження та довготривалу цінність праці.','Separate income, stewardship and the long-term value of your work.'],
 3:['Перевіряйте ініціативу конкретною розмовою або вправою, а не лише наміром.','Test initiative with a concrete conversation or practiced skill.'],
 4:['Вивчайте, як домашня стабільність підтримує ваші інші зобов’язання.','Examine how stability at home supports your other responsibilities.'],
 7:['Відрізняйте здатність навчати й піклуватися від припущень про майбутніх дітей.','Distinguish care and mentorship from unsupported claims about future children.'],
 9:['Порівнюйте реальні умови взаємності з очікуваннями від партнера.','Compare actual mutual commitments with assumptions about a partner.'],
 10:['Зверніть увагу на завдання, у яких ваші знання стають вимірюваним результатом.','Look for work where knowledge becomes a visible, useful result.'],
 12:['Окремо досліджуйте вплив батьківських прикладів і власні теперішні рішення.','Distinguish parental examples from your own present choices.'],
 16:['Оцінюйте, чи побутові зручності допомагають відновлюватися, а не відволікають.','Notice whether practical comforts support recovery rather than distract you.'],
 20:['Підтримуйте практику, яку можете виконувати регулярно, без обіцянки швидких змін.','Choose a practice you can sustain without expecting instant transformation.'],
 24:['Поєднуйте навчання із завданнями, де знання проходять реальну перевірку.','Pair study with a task that puts knowledge to a real test.'],
 27:['Шукайте баланс між витривалістю, відпочинком і можливістю просити підтримку.','Balance endurance with rest and willingness to ask for support.'],
 30:['Визначайте способи долати складність, не ототожнюючи її з приреченістю.','Identify ways to face challenges without interpreting them as destiny.'],
 40:['Відрізняйте сімейні моделі, які допомагають, від тих, які ви бажаєте змінити.','Distinguish inherited examples worth keeping from those worth changing.'],
 45:['Перевіряйте, які родинні принципи стали вашими свідомими переконаннями.','Examine which inherited principles you have consciously chosen.'],
 60:['Розглядайте D60 лише як чутливе уточнення до основної карти.','Treat D60 only as a sensitive refinement of the birth chart.']
};
const RELEVANT:Readonly<Record<number,number>>={2:10,3:27,4:12,7:9,9:1,10:24,12:4,16:4,
 20:9,24:10,27:30,30:27,40:12,45:9};
const notable=(d:string)=>d==='own'||d==='exalted';
const statusMeaning=(d:string,uk:boolean)=>{
 if(d==='exalted')return uk?'у знаку екзальтації — виразний традиційний показник, який ще потребує перевірки іншими чинниками.':
  'in its exaltation sign, a notable traditional indicator requiring corroboration.';
 if(d==='own')return uk?'у власному знаку — додаткова традиційна підтримка теми.':
  'in its own sign, offering traditional support for this theme.';
 if(d==='debilitated')return uk?'у знаку дебілітації — можливу складність слід оцінювати разом з іншими показниками, не як вирок.':
  'in its debilitation sign; potential difficulty requires context, not a verdict.';
 return '';
};
const truncateSentences=(s:string,count:number)=>{
 const parts=s.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/gu)||[];
 return parts.slice(0,count).join(' ').replace(/\s+/g,' ').trim();
};
export function buildMeaningfulN492(chart:CalculatedChart,lang:Lang,asOf:string):MeaningfulReading|null{
 const verified=verifiedVargaSource(chart);if(!verified)return null;
 const uk=lang==='uk',idx=uk?0:1,lp=classicalLordshipTable(chart.ascendant.sign);
 const yoga=new Set(yogakarakasForLagna(chart.ascendant.sign));
 const pName=(p:string)=>uk?NAMES_UK[p]||p:p;
 const sign=(s:number)=>(uk?SIGN_UK:SIGN_EN)[s-1];
 const area=(h:number)=>AREAS[h][idx];
 const source=verified.charts;
 const authored=authorConsultationV6(chart,lang,asOf);
 const chapter=(id:string)=>authored.find(x=>x.id===id)?.paragraphs||[];
 const get=(name:string)=>chart.d1.find(p=>p.name===name);
 const same=(div:number,name:string)=>source.find(c=>c.division===div)?.planets.find(p=>p.name===name);
 const facts=ruleFindings(chart);
 const d60=buildD60Preview(chart,lang);
 const cards:Card[]=[];
 for(const div of N492_ORDER){
  const [titleUk,titleEn,topicHouse]=HEADS[div];
  const title=uk?titleUk:titleEn;
  if(div===60){
   const usable=d60.status==='conditional_signs'&&d60.allPlanets.length===9;
   const main=d60.factors[0];
   const meaning=usable?
    (uk?'За введеним часом обчислено дев’ять планетарних знаків D60. '+
      (main?main.note:'Частина положень чутлива до меж поділу; точний висновок поки не робимо.'):
     'Nine D60 planetary signs are calculated for the entered time. '+
      (main?main.note:'Some placements are near divisional boundaries, so no precise conclusion is drawn.')):
    (uk?'Немає надійно прив’язаних до D1 даних D60 для індивідуального висновку.':
      'D60 evidence cannot currently be reliably bound to the birth chart.');
   cards.push({division:60,title,meaning,connection:null,status:'provisional',
    sourceIds:[],proof:usable?d60.allPlanets.flatMap(p=>['D1.'+p.planet+'.sign='+p.d1Sign,'D60.'+p.planet+'.sign='+p.d60Sign]):[]});
   continue;
  }
  const lord=lp[topicHouse],natal=get(lord),varga=same(div,lord);
  if(!natal||!varga)throw Error('N492_MISSING_PLANET_D'+div);
  const natalQuality=dignityFor(lord,natal.sign);
  const dnQuality=dignityFor(lord,varga.sign);
  const isYoga=yoga.has(lord);
  const [t0,t1]=[natal.house,varga.house];
  const proof=['D1.ascendant.sign='+chart.ascendant.sign,'D1.house-lord.'+topicHouse+'='+lord,
    'D1.'+lord+'.sign='+natal.sign,'D1.'+lord+'.house='+t0,
    'D'+div+'.'+lord+'.sign='+varga.sign,'D'+div+'.'+lord+'.house='+t1];
  let meaning='';
  if(div===1){
   // Start from our already authored, richer D1 consultation, not D1 vs itself.
   meaning=truncateSentences(chapter('portrait')[0]||'',3);
   const moon=get('Moon');
   if(moon&&moon.name!==lord)meaning+=' '+(uk?'Місяць у '+moon.house+'-му домі додає тему '+area(moon.house)+'.':
    'The Moon in house '+moon.house+' adds the theme of '+area(moon.house)+'.');
   if(moon?.name===lord){
    const sun=get('Sun');
    if(sun)meaning+=' '+(uk?'Сонце у '+sun.house+'-му домі додає інший акцент — сферу '+area(sun.house)+'.':
     'The Sun in house '+sun.house+' introduces the distinct theme of '+area(sun.house)+'.');
   }
  }else if(div===10){
   // Core reason the v6 hidden chapter reads better: house-lord + yoga + role + real work lens.
   meaning=truncateSentences(chapter('career')[0]||'',4);
   meaning+=' '+(uk?'У D10 '+pName(lord)+' перебуває в '+t1+'-му домі, у знаку «'+sign(varga.sign)+'»':
    'In D10 the planet occupies '+sign(varga.sign)+' in house '+t1);
   const qualifier=statusMeaning(dnQuality,uk);
   meaning+=(qualifier?', '+qualifier:'.');
  }else if(div===9){
   meaning=truncateSentences(chapter('relationships')[0]||'',4);
   const venus=same(9,'Venus');
   meaning+=' '+(uk?'У D9 управитель партнерства '+pName(lord)+' перебуває у знаку «'+sign(varga.sign)+'». '+
    (lord==='Venus'?'Венера і є цим управителем, тому це не другий незалежний показник.':
      'Венера доповнює тему взаємності, перебуваючи в D9 у знаку «'+sign(venus!.sign)+'».'):
   'In D9 the partnership ruler '+lord+' occupies '+sign(varga.sign)+'. '+
    (lord==='Venus'?'Venus is itself the ruler here, not a second independent indicator.':
      'Venus adds a second relationship indicator in '+sign(venus!.sign)+'.'));
   proof.push('D9.Venus.sign='+venus!.sign);
  }else if(div===2){
   meaning=truncateSentences(chapter('resources')[0]||'',4);
   meaning+=' '+(uk?'У D2 управитель ресурсів '+pName(lord)+' у знаку «'+sign(varga.sign)+'».':
    'In D2 the resources ruler '+lord+' occupies '+sign(varga.sign)+'.');
   const gains=lp[11],g=get(gains);
   if(g)proof.push('D1.house-lord.11='+gains,'D1.'+gains+'.house='+g.house);
  }else{
   const focused=uk?'У D'+div+' '+pName(lord)+' перебуває в '+t1+'-му домі, у знаку «'+sign(varga.sign)+'».':
     'In D'+div+', '+lord+' occupies house '+t1+' in '+sign(varga.sign)+'.';
   const base=uk?
     'Управитель '+topicHouse+'-го дому '+pName(lord)+' стоїть у D1 в '+t0+'-му домі. '+
     'Тому тема цієї карти пов’язана також зі сферою '+area(t0)+'.':
     'The ruler of natal house '+topicHouse+', '+lord+', is in D1 house '+t0+
     '. This connects the chart topic with '+area(t0)+'.';
   meaning=base+' '+focused+' '+PRACTICAL[div][idx];
   const degree=statusMeaning(dnQuality,uk);
   if(degree)meaning+=' '+(uk?'Тут '+pName(lord)+' '+degree:lord+' is '+degree);
   if(isYoga)meaning+=' '+(uk?'Це також йогакарака для вашого висхідного знака — управитель кутового й тригонального дому.':
     'For this ascendant it is also a yogakaraka, ruling both an angular and a trinal house.');
  }
  const related=RELEVANT[div];
  let connection:string|null=null;
  if(related){
   const other=same(related,lord);
   if(other){
    const otherQuality=dignityFor(lord,other.sign);
    // A repeat is meaningful ONLY if supported by a concrete dignity condition;
    // otherwise don't add a comparison just to fill a UI slot.
    if((notable(dnQuality)&&notable(otherQuality))||
      ((notable(dnQuality)&&otherQuality==='debilitated')||(dnQuality==='debilitated'&&notable(otherQuality)))){
     connection=uk?
      (notable(dnQuality)&&notable(otherQuality)?
       'Додаткова підтримка: у D'+related+' '+pName(lord)+' також має сильне знакове положення («'+sign(other.sign)+'»). Обидва показники стосуються тієї самої планети.':
       'Важливий контраст: у D'+related+' '+pName(lord)+' у знаку «'+sign(other.sign)+'», і знакові оцінки різняться. Одного показника недостатньо для висновку.'):
      (notable(dnQuality)&&notable(otherQuality)?
       'Corroboration: the same '+lord+' also has supportive sign dignity in D'+related+' ('+sign(other.sign)+').':
       'Contrast: '+lord+' occupies '+sign(other.sign)+' in D'+related+' with a different sign dignity; neither placement alone settles the result.');
     proof.push('D'+related+'.'+lord+'.sign='+other.sign);
    }
   }
  }
  if(div===1){
   const special=facts.yogas.find(f=>f.planet===lord);
   if(special)proof.push(...special.evidence);
  }
  cards.push({division:div,title,meaning:meaning.trim(),connection,
   status:(dnQuality==='debilitated'&&notable(natalQuality))||(notable(dnQuality)&&natalQuality==='debilitated')?'mixed':
    notable(dnQuality)||isYoga?'notable':'contextual',proof,sourceIds:[]});
 }
 if(cards.length!==16||new Set(cards.map(c=>c.division)).size!==16)return null;
 const lagnaLord=lp[1],careerLord=lp[10],relationLord=lp[7];
 const asc=get(lagnaLord)!,career=get(careerLord)!,moon=get('Moon')!;
 const primaryYoga=[...yoga].find(g=>[lagnaLord,careerLord,lp[9],lp[5]].includes(g))||[...yoga][0];
 const d10Yoga=primaryYoga?same(10,primaryYoga):null;
 const chosenDignities=([10,9,2,24,27] as number[]).flatMap(div=>{
  const graha=lp[HEADS[div][2]],p=same(div,graha);
  return p&&notable(dignityFor(graha,p.sign))?[{div,graha,sign:p.sign,kind:dignityFor(graha,p.sign)}]:[];
 }).slice(0,2);
 const yogaPart=primaryYoga?(uk?
  pName(primaryYoga)+' керує кутовим і тригональним домами (йогакарака). '+
   (d10Yoga?'У D10 його знак «'+sign(d10Yoga.sign)+'»'+
    (dignityFor(primaryYoga,d10Yoga.sign)==='exalted'?' — екзальтація.':'.'):''):
  primaryYoga+' rules both an angular and a trinal natal house (yogakaraka). '+
   (d10Yoga?'In D10 it occupies '+sign(d10Yoga.sign)+
    (dignityFor(primaryYoga,d10Yoga.sign)==='exalted'?', its exaltation sign.':'.'):'')
 ):'';
 const dignityPart=chosenDignities.length?(uk?
   chosenDignities.map(x=>'D'+x.div+': '+pName(x.graha)+' у знаку «'+sign(x.sign)+'» ('+
     (x.kind==='exalted'?'екзальтація':'власний знак')+')').join('; ')+'.':
   chosenDignities.map(x=>'D'+x.div+': '+x.graha+' in '+sign(x.sign)+' ('+
     (x.kind==='exalted'?'exaltation':'own sign')+')').join('; ')+'.'):'';
 const strength=(yogaPart+dignityPart).trim()||
  (uk?'Основний орієнтир — управитель висхідного знака '+pName(lagnaLord)+
     ' у '+asc.house+'-му домі, а професійний — '+pName(careerLord)+' у '+career.house+'-му.':
    'The main anchors are ascendant ruler '+lagnaLord+' in house '+asc.house+
     ' and career ruler '+careerLord+' in house '+career.house+'.');
 const weak=chart.d1.find(p=>dignityFor(p.name,p.sign)==='debilitated');
 const attention=weak?(uk?
  pName(weak.name)+' у D1 в знаку «'+sign(weak.sign)+'» (традиційне падіння). '+
   'Тому не варто робити висновок про його результати без аспектів, інших управлінь і сили планети.':
  weak.name+' in D1 occupies '+sign(weak.sign)+' (traditional debilitation). '+
   'Its meaning needs aspects, lordship and fuller strength assessment.'):
  moon.house===career.house?(uk?
   'Місяць і управитель кар’єри пов’язані з '+career.house+'-м домом. '+
    'Особистий ритм і професійні вимоги мають спільну сферу, але не тотожний зміст.':
   'The Moon and career ruler both occupy house '+career.house+
    '; emotional rhythm and professional demands share an arena but are not identical.'):
   (uk?'Місяць у '+moon.house+'-му домі пов’язаний із '+area(moon.house)+
     ', а управитель кар’єри в '+career.house+'-му — зі сферою '+area(career.house)+'. '+
     'Ці потреби варто розрізняти.':
    'The Moon in house '+moon.house+' concerns '+area(moon.house)+
     ', while career ruler '+careerLord+' in house '+career.house+
     ' concerns '+area(career.house)+'. These needs need not have the same pace.');
 const direction=lagnaLord===careerLord?(uk?
  'Особистий і професійний вектори тут пов’язує '+pName(lagnaLord)+
  ': планета керує обома відповідними домами. Перевірте, як рішення у сфері '+area(asc.house)+
  ' позначаються на вашій професійній відповідальності, не підмінюючи цим усю карту.':
  'The same '+lagnaLord+' rules both personal direction and vocation. '+
  'Consider how '+area(asc.house)+' relates to your professional responsibilities without treating one planet as the whole chart.'):
  (uk?'Управитель особистого напряму '+pName(lagnaLord)+' у '+asc.house+'-му домі, '+
  'професійного — '+pName(careerLord)+' у '+career.house+'-му, '+
  'а партнерства — '+pName(relationLord)+'. Практичне завдання — знаходити місце для цих трьох сфер, не очікуючи від однієї з них відповіді за всі інші.':
  'Personal direction is ruled by '+lagnaLord+' in house '+asc.house+
  ', vocation by '+careerLord+' in house '+career.house+
  ', and partnership by '+relationLord+
  '. These three themes need room for separate decisions rather than one universal answer.');
 return {version:N492_MEANING_VERSION,cards,
  summary:{title:uk?'Що головне у вашій карті':'Your key chart takeaway',
   strength,attention,direction,proof:[
    'D1.ascendant.sign='+chart.ascendant.sign,'D1.'+lp[1]+'.house='+asc.house,
    'D1.house-lord.10='+lp[10],'D1.'+lp[10]+'.house='+get(lp[10])!.house
   ]},
  method:uk?'Традиційна інтерпретація: D1, функціональні управителі, знакові положення, тематичні варги. Знакова гідність — не повна Shadbala; D60 умовна.':
   'Traditional interpretation: D1, functional lords, sign dignity and thematic divisional charts. Sign dignity is not full Shadbala; D60 is provisional.'};
}
