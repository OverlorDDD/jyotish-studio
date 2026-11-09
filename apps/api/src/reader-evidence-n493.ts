/**
 * N4.9.3 Evidence-ranked reading — no LLM and no extra unverified horoscopic facts.
 * What is actually established: sign, whole-sign house, functional lordship,
 * natal sign dignity, verified derived Dn sign/house, yogakaraka and calculated dasha.
 * What is NOT established: degree-specific shadbala, cancellation of debilitation,
 * exact conjunction/aspect strength, event predictions or a certified D60 Lagna.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor,ruleFindings,CLASSICAL_GRAHAS} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
import {buildD60Preview} from './reader-d60-n47.ts';
import {N492_ORDER} from './reader-meaning-n492.ts';

export const N493_VERSION='n493-ranked-evidence-16-varga-v1' as const;
type Lang='uk'|'en';
type Status='support'|'tension'|'mixed'|'context'|'provisional';
type Theme='identity'|'career'|'relationships'|'resources'|'learning'|'home'|'discipline'|'timing';
export type N493Pattern={id:string;theme:Theme;division:number;title:string;insight:string;
 context:string;status:Status;score:number;planetKeys:string[];
 evidence:string[];ruleIds:string[]};
export type N493Card={division:number;title:string;meaning:string;context:string|null;
 findingIds:readonly string[];status:Status;proof:readonly string[];ruleIds:readonly string[]};
export type N493Reading={version:typeof N493_VERSION;patterns:readonly N493Pattern[];
 cards:readonly N493Card[];summary:{title:string;portrait:string;focus:string;proof:string[]};
 method:string};

const NAMES_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',
 Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const NAMES_GU:Record<string,string>={Sun:'Сонця',Moon:'Місяця',Mars:'Марса',Mercury:'Меркурія',
 Jupiter:'Юпітера',Venus:'Венери',Saturn:'Сатурна',Rahu:'Раху',Ketu:'Кету'};
const SIGNS_UK_NOM=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const SIGNS_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні',
 'Стрільці','Козорозі','Водолії','Рибах'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio',
 'Sagittarius','Capricorn','Aquarius','Pisces'];
const LOC_UK=[
 'особистих рішеннях','ресурсах і сімейних цінностях','комунікації й навичках',
 'домі й внутрішній опорі','творчості, дітях і навчанні','повсякденній праці й складних завданнях',
 'партнерстві й домовленостях','довірі та спільних зобов’язаннях','освіті й світогляді',
 'професії й відповідальності','результатах і колі однодумців','усамітненні й відновленні'];
const PLANET_ROLE_UK:Record<string,string>={
 Sun:'самостійність, відповідальність і ставлення до авторитету',
 Moon:'внутрішній ритм і потребу у відчутті безпеки',
 Mars:'ініціативу, сміливість і спосіб діяти',
 Mercury:'мовлення, навчання та аналіз',
 Jupiter:'знання, наставництво і розуміння смислу',
 Venus:'взаємність, співпрацю та естетику',
 Saturn:'дисципліну, тривалі зобов’язання й витримку',
 Rahu:'незвичний досвід і пошук нових рішень',
 Ketu:'дистанціювання і внутрішній пошук'
};
const PLANET_ROLE_EN:Record<string,string>={
 Sun:'personal agency, responsibility and authority',
 Moon:'emotional rhythm and safety',
 Mars:'initiative, courage and decisive action',
 Mercury:'communication, learning and analysis',
 Jupiter:'knowledge, mentoring and meaning',
 Venus:'reciprocity, cooperation and aesthetics',
 Saturn:'discipline, long-term duties and endurance',
 Rahu:'unusual experience and new approaches',
 Ketu:'detachment and internal reflection'
};
const LOC_EN=[
 'personal choices','resources and family values','communication and skills',
 'home and inner stability','creativity, children and learning','daily work and problem-solving',
 'partnership and agreements','trust and shared responsibilities','education and worldview',
 'career and responsibility','achievements and communities','privacy and recovery'];
const TOPIC:Record<number,[string,string,number,string]> = {
 1:['Особистість і життєвий напрям','Identity and direction',1,'Sun'],
 2:['Гроші й ресурси','Money and resources',2,'Jupiter'],
 3:['Сміливість і спілкування','Courage and communication',3,'Mars'],
 4:['Дім і власність','Home and property',4,'Moon'],
 7:['Діти й творча реалізація','Children and creative legacy',5,'Jupiter'],
 9:['Стосунки і зрілість союзу','Relationships and commitment',7,'Venus'],
 10:['Кар’єра і покликання','Career and vocation',10,'Saturn'],
 12:['Батьки й родинні корені','Parents and ancestry',4,'Sun'],
 16:['Комфорт і транспорт','Comfort and vehicles',4,'Venus'],
 20:['Духовна практика','Spiritual practice',9,'Jupiter'],
 24:['Навчання й майстерність','Learning and mastery',5,'Mercury'],
 27:['Витривалість','Resilience',1,'Mars'],
 30:['Перешкоди та подолання','Challenges and recovery',6,'Saturn'],
 40:['Материнська лінія','Maternal lineage',4,'Moon'],
 45:['Батьківська лінія','Paternal lineage',9,'Sun'],
 60:['Тонкі положення планет','Fine planetary positions',1,'Moon']
};
const unique=(xs:string[])=>[...new Set(xs)];
const posStatus=(d:string):Status=>d==='own'||d==='exalted'?'support':d==='debilitated'?'tension':'context';
const leadStatus=(a:Status,b:Status):Status=>
 (a==='support'&&b==='tension'||a==='tension'&&b==='support')?'mixed':
 a==='tension'||b==='tension'?'tension':a==='support'||b==='support'?'support':'context';
const dignityTerm=(d:string,uk:boolean)=>d==='exalted'?(uk?'у знаку екзальтації':'in its exaltation sign'):
 d==='own'?(uk?'у власному знаку':'in its own sign'):
 d==='debilitated'?(uk?'у знаку падіння':'in its debilitation sign'):'';
const interpretPair=(div:number,h:number,vh:number,uk:boolean)=>{
 // The inference is about the TWO calculated areas; never an invented event.
 if(div===10&&h===9&&vh===6)return uk?
  'Це поєднує навчання та світогляд із дисципліною щоденної роботи: знання мають переходити в конкретну майстерність.':
  'Education and worldview meet practical discipline: knowledge needs a craft to become useful.';
 if(div===10&&h===10&&vh===10)return uk?
  'Обидві карти підкреслюють професійну роль, але показують її в різних астрологічних контекстах.':
  'Both lenses emphasize vocation, although they describe distinct chart contexts.';
 if(div===9&&h===9)return uk?
  'Для партнерства помітна тема спільних принципів, навчання та життєвого світогляду.':
  'Shared principles and worldview become relevant in the traditional partnership reading.';
 if(div===2&&h===9)return uk?
  'Ресурси пов’язані з освітою, наставництвом чи передаванням знань; це тема для перевірки, а не обіцянка доходу.':
  'Resources meet education and the sharing of knowledge; this is a topic to evaluate, not promised income.';
 if(div===4&&h===10)return uk?
  'Тема житла і відчуття опори пов’язана з професійною відповідальністю, а не лише зі зручністю побуту.':
  'Home and a sense of stability meet professional responsibilities rather than comfort alone.';
 if(div===24&&h===9&&vh===6)return uk?
  'У навчанні важливий перехід від теорії й наставництва до повторюваної практики.':
  'Education is connected with turning theory and mentoring into repeatable practice.';
 if(div===20&&h===6)return uk?
  'Духовна практика тут пов’язана з регулярністю й дисципліною, а не лише з рідкісними сильними переживаннями.':
  'Spiritual practice relates to steady discipline, not only rare intense experiences.';
 if(div===27&&h===12)return uk?
  'Витривалість варто читати разом із потребою у відновленні; постійна напруга не є тотожною силі.':
  'Resilience must be considered alongside the need for recovery; continuous strain is not strength.';
 if(div===30&&h===6)return uk?
  'Основна тематична вісь — спосіб зустрічати повсякденні труднощі, не перебільшуючи їхньої неминучості.':
  'This connects everyday challenges with the way they are handled, not with inevitable failure.';
 return uk?
  'Для цієї сфери суттєвий зв’язок двох різних контекстів: '+LOC_UK[h-1]+' у D1 та '+LOC_UK[vh-1]+' у D'+div+'.':
  'This joins two distinct contexts: '+LOC_EN[h-1]+' in D1 and '+LOC_EN[vh-1]+' in D'+div+'.';
};
export function buildEvidenceN493(chart:CalculatedChart,lang:Lang,asOf:string):N493Reading|null{
 const source=verifiedVargaSource(chart);if(!source)return null;
 const uk=lang==='uk',l=classicalLordshipTable(chart.ascendant.sign);
 const yoga=new Set(yogakarakasForLagna(chart.ascendant.sign));
 const name=(n:string)=>uk?NAMES_UK[n]||n:n;
 const gen=(n:string)=>uk?NAMES_GU[n]||n:n;
 const sign=(n:number)=>(uk?SIGNS_UK:SIGNS_EN)[n-1];
 const locPrep=(n:number)=>uk&&[1,11].includes(n)?'в ':'у ';
 const planetRole=(n:string)=>uk?PLANET_ROLE_UK[n]:PLANET_ROLE_EN[n];
 const signName=(n:number)=>(uk?SIGNS_UK_NOM:SIGNS_EN)[n-1];
 const area=(h:number)=>(uk?LOC_UK:LOC_EN)[h-1];
 const get=(n:string)=>chart.d1.find(x=>x.name===n);
 const v=(d:number,n:string)=>source.charts.find(c=>c.division===d)?.planets.find(p=>p.name===n);
 const natalProof=(n:string)=>{const p=get(n);return p?['D1.'+n+'.sign='+p.sign,'D1.'+n+'.house='+p.house]:[]};
 const vProof=(d:number,n:string)=>{const p=v(d,n);return p?['D'+d+'.'+n+'.sign='+p.sign,'D'+d+'.'+n+'.house='+p.house]:[]};
 const d60=buildD60Preview(chart,lang);
 const candidates:N493Pattern[]=[];
 const add=(p:N493Pattern)=>{if(p.evidence.length>=2)candidates.push({...p,evidence:unique(p.evidence)});};
 const lagna=l[1],a=get(lagna)!,moon=get('Moon')!,career=l[10],c=get(career)!;
 const d9Moon=v(9,'Moon'),d10Career=v(10,career),d24Career=v(24,career);
 const ascSpecial=a.house===12||a.house===6||a.house===8;
 add({id:'life-axis',theme:'identity',division:1,planetKeys:unique([lagna,'Moon']),
  title:uk?'Внутрішній ритм і життєвий напрям':'Inner rhythm and life direction',
  insight:uk?'Висхідним знаком керує '+name(lagna)+' у '+a.house+'-му домі ('+area(a.house)+
   '). '+(lagna==='Moon'?'Місяць описує тут водночас особистий напрям і внутрішній ритм: його дім стає особливо важливим для розуміння потреб.':
   'Місяць у '+moon.house+'-му домі додає окремий показник внутрішніх потреб.'):
   'Your rising sign is ruled by '+lagna+' in house '+a.house+' ('+area(a.house)+
   '). '+(lagna==='Moon'?'As both rising-sign ruler and Moon, it connects your outward direction with the need for emotional stability.':
   'The Moon in house '+moon.house+' provides a distinct emotional context.'),
  context:uk?(ascSpecial?'Потреба в особистому просторі та відновленні потребує місця поруч з іншими життєвими цілями.':
   'Сильний життєвий напрям не зводиться до одного показника: його треба зіставляти з іншими сферами.'):
   (ascSpecial?'The need for recovery and private space deserves room alongside outward ambitions.':
    'Personal direction still needs checking against other chart factors.'),
  status:'context',score:ascSpecial?92:78,evidence:unique([
   'D1.ascendant.sign='+chart.ascendant.sign,...natalProof(lagna),
   ...natalProof('Moon'),...(d9Moon?vProof(9,'Moon'):[])]),
  ruleIds:['PARASHARI_SIGN_LORDSHIP','NAKSHATRA_D1']});
 const careerYoga=yoga.has(career),careerDignity=d10Career?dignityFor(career,d10Career.sign):'other';
 const careerDom=d10Career?.house||0;
 const yH=Array.from({length:12},(_,i)=>i+1).filter(h=>l[h]===career);
 add({id:'career-capacity',theme:'career',division:10,planetKeys:[career],
  title:uk?'Професійна сила та спосіб реалізації':'Vocational strengths and execution',
  insight:uk?'Професією керує '+name(career)+'. У D1 планета у '+c.house+'-му домі ('+area(c.house)+
   '), у D10 — в '+careerDom+'-му ('+(careerDom?area(careerDom):'')+'). '+
   (careerYoga?'Вона також керує домами '+yH.join(' і ')+' — це йогакарака. ':'')+
   (careerDignity==='exalted'||careerDignity==='own'?name(career)+' '+dignityTerm(careerDignity,true)+' у D10.':''):
   'Career is ruled by '+career+'. In D1 it occupies house '+c.house+' ('+area(c.house)+
   ') and in D10 house '+careerDom+' ('+(careerDom?area(careerDom):'')+'). '+
   (careerYoga?'It rules houses '+yH.join(' and ')+' (yogakaraka). ':'')+
   (careerDignity==='exalted'||careerDignity==='own'?career+' is '+dignityTerm(careerDignity,false)+' in D10.':''),
  context:interpretPair(10,c.house,careerDom||c.house,uk),
  status:careerDignity==='debilitated'?'tension':careerYoga||posStatus(careerDignity)==='support'?'support':'context',
  score:85+(careerYoga?11:0)+(posStatus(careerDignity)==='support'?7:0),
  evidence:unique(['D1.house-lord.10='+career,...natalProof(career),...vProof(10,career),
   ...(careerYoga?yH.map(h=>'D1.house-lord.'+h+'='+career):[])]),
  ruleIds:['PARASHARI_FUNCTIONAL_LORDSHIP','N4_D10_SIGN_HOUSE']});
 const partner=l[7],pt=get(partner)!,d9Pt=v(9,partner),d9Venus=v(9,'Venus');
 add({id:'commitment',theme:'relationships',division:9,
  title:uk?'Партнерство, довіра і спільні правила':'Partnership, trust and mutual expectations',
  insight:uk?'Сьомим домом керує '+name(partner)+' у '+pt.house+'-му домі ('+area(pt.house)+
   '). '+(l[8]===partner?'Той самий управитель відповідає і за восьмий дім спільних зобов’язань. ':
    'Восьмим домом керує '+name(l[8])+'. ')+
   'У D9 '+name(partner)+' у '+(d9Pt?.house||0)+'-му домі.':
   'The seventh house is ruled by '+partner+' in house '+pt.house+' ('+area(pt.house)+
   '). '+(l[8]===partner?'It also rules the eighth house of shared commitments. ':
    'The eighth house is ruled by '+l[8]+'. ')+
   'In D9 '+partner+' occupies house '+(d9Pt?.house||0)+'.',
  context:uk?'У такому прочитанні важливі не лише романтичні очікування, а й спосіб домовлятися про відповідальність і довіру.':
   'This reading involves trust and shared obligations, not just attraction.',
  planetKeys:unique([partner,l[8],'Venus']),
  status:d9Pt&&dignityFor(partner,d9Pt.sign)==='debilitated'?'tension':'context',
  score:(l[8]===partner?85:72)+(d9Venus&&dignityFor('Venus',d9Venus.sign)==='exalted'?4:0),
  evidence:unique(['D1.house-lord.7='+partner,'D1.house-lord.8='+l[8],
   ...natalProof(partner),...vProof(9,partner),...natalProof('Venus'),
   ...(partner!=='Venus'?vProof(9,'Venus'):[])]),
  ruleIds:['PARASHARI_FUNCTIONAL_LORDSHIP','N4_D9_SIGN_HOUSE']});
 const weak=CLASSICAL_GRAHAS.filter(p=>dignityFor(p,get(p)!.sign)==='debilitated');
 for(const n of weak){
  const p=get(n)!;
  const owned=Array.from({length:12},(_,i)=>i+1).filter(h=>l[h]===n);
  add({id:'needs-context-'+n.toLowerCase(),theme:'discipline',division:1,
   title:uk?'Показник, який потребує перевірки':'A placement that needs context',
   insight:uk?name(n)+' у D1 перебуває '+dignityTerm('debilitated',true)+
    '. Планета керує домами '+owned.join(' і ')+'; її роль не можна звести до слова «слабка».':
    n+' is '+dignityTerm('debilitated',false)+' in D1 and rules houses '+owned.join(' and ')+
    '. A sign label alone cannot settle its role.',
   context:uk?'Потрібно перевірити скасування падіння, аспекти, градуси та інші показники; поки це обережне традиційне застереження.':
    'Debilitation cancellation, aspects, degrees and other factors are not yet fully verified; this is a caution, not a verdict.',
   planetKeys:[n],status:'tension',score:81+(owned.includes(1)||owned.includes(10)?7:0),
   evidence:unique([...natalProof(n),...owned.map(h=>'D1.house-lord.'+h+'='+n),...vProof(9,n)]),
   ruleIds:['SEVEN_GRAHA_SIGN_DIGNITY','PARASHARI_FUNCTIONAL_LORDSHIP']});
 }
 const major=chart.dasha.find(d=>Date.parse(d.start)<=Date.parse(asOf+'T12:00:00Z')&&Date.parse(asOf+'T12:00:00Z')<Date.parse(d.end));
 if(major&&get(major.lord))add({id:'current-period',theme:'timing',division:1,
  title:uk?'Активний життєвий період':'Current planetary period',
  insight:uk?'Зараз триває махадаша '+gen(major.lord)+'. У D1 її управитель у '+
   get(major.lord)!.house+'-му домі ('+area(get(major.lord)!.house)+').':
   'The current major period is ruled by '+major.lord+', located in D1 house '+
   get(major.lord)!.house+' ('+area(get(major.lord)!.house)+').',
  context:uk?'Це часовий контекст до натальної карти, а не підтвердження конкретної події.':
   'This adds timing context; it is not confirmation of an event.',
  planetKeys:[major.lord],status:'context',score:66,
  evidence:['dasha.major='+major.lord,'dasha.start='+major.start,'dasha.end='+major.end,...natalProof(major.lord)],
  ruleIds:['VIMSHOTTARI_VERIFIED_PERIOD']});
 const cluster=Array.from({length:12},(_,i)=>({house:i+1,
  names:CLASSICAL_GRAHAS.filter(n=>get(n)?.house===i+1)}))
  .sort((x,y)=>y.names.length-x.names.length||x.house-y.house)[0];
 if(cluster.names.length>=3)add({id:'house-cluster',theme:'learning',division:1,
  title:uk?'Зосередження кількох планет':'Multiple planets in one life area',
  insight:uk?'У '+cluster.house+'-му домі ('+area(cluster.house)+') перебувають '+
   cluster.names.map(name).join(', ')+'. Це спільний дім, але не доказ тісного з’єднання за градусами.':
   'House '+cluster.house+' ('+area(cluster.house)+') contains '+
   cluster.names.join(', ')+'. Sharing a whole-sign house does not establish a tight degree conjunction.',
  context:uk?'Планети мають різні управління та значення; цей акцент потрібно читати разом із ними.':
   'The planets have different rulerships and roles; their meanings require separate checks.',
  planetKeys:cluster.names,status:'context',score:80+cluster.names.length,
  evidence:cluster.names.flatMap(n=>natalProof(n)),ruleIds:['WHOLE_SIGN_COHABITATION']});
 const ascPos=chart.ascendant.sign;
 const strongNatal=CLASSICAL_GRAHAS.filter(n=>['exalted','own'].includes(dignityFor(n,get(n)!.sign)));
 for(const n of strongNatal){
  if(n===career&&careerYoga)continue; // Do not double-count a top career pattern.
  const p=get(n)!;const owned=Array.from({length:12},(_,i)=>i+1).filter(h=>l[h]===n);
  add({id:'natal-resource-'+n.toLowerCase(),theme:'resources',division:1,
   title:uk?'Виразне натальне положення':'A notable natal resource',
   insight:uk?name(n)+' '+locPrep(p.sign)+sign(p.sign)+' '+dignityTerm(dignityFor(n,p.sign),true)+
    ', перебуває в '+p.house+'-му домі й керує '+owned.join('-м і ')+'-м домами. '+
    'Це пов’язує '+area(owned[0])+' із '+area(p.house)+'.':
    n+' in '+sign(p.sign)+' is '+dignityTerm(dignityFor(n,p.sign),false)+
     ', located in house '+p.house+' and ruling houses '+owned.join(' and ')+
     '. It connects '+area(owned[0])+' with '+area(p.house)+'.',
   context:uk?'Це виразний знаковий показник, не повна сила планети або гарантія подій.':
    'Sign dignity is only one traditional indicator, not full strength or a prediction.',
   planetKeys:[n],status:'support',score:73+(owned.includes(1)||owned.includes(9)?7:0),
   evidence:[...natalProof(n),...owned.map(h=>'D1.house-lord.'+h+'='+n)],
   ruleIds:['SEVEN_GRAHA_SIGN_DIGNITY','PARASHARI_FUNCTIONAL_LORDSHIP']});
 }
 // Never show two "findings" that are identical planetary evidence in different wrappers.
 const ranked=[...candidates].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const chosen:N493Pattern[]=[];const themes=new Set<Theme>();
 for(const p of ranked){
  if(chosen.length>=5)break;
  if(themes.has(p.theme))continue;
  // If one planetary sign is the only support, the heading is not promoted.
  chosen.push(p);themes.add(p.theme);
 }
 if(chosen.length<3){
  // The three foundational life areas each have independent premises even when
  // the chart has no strong dignity or cluster. Their content remains chart-specific.
  for(const theme of ['identity','career','relationships'] as Theme[]){
   const p=ranked.find(x=>x.theme===theme);if(p&&!themes.has(theme)){chosen.push(p);themes.add(theme);}
  }
 }
 const cards:N493Card[]=[];
 for(const division of N492_ORDER){
  const [ukTitle,enTitle,homeHouse,natural]=TOPIC[division];
  if(division===60){
   const usable=d60.status==='conditional_signs'&&d60.allPlanets.length===9;
   const primary=d60.factors[0];
   cards.push({division,title:uk?ukTitle:enTitle,status:'provisional',
    meaning:usable?(uk?'D60 показує дев’ять обчислених знаків планет для введеного моменту. '+
      (primary?primary.note:'Близькі до межі положення не використовуються для певного висновку.'):
     'D60 contains nine calculated planetary signs for the entered time. '+
      (primary?primary.note:'Near-boundary placements are not promoted into definitive claims.')):
      (uk?'Немає достатньої перевіреної прив’язки D60 до цієї карти. Тематичні висновки не робимо.':
       'D60 lacks a verified chart binding, so no thematic conclusion is made.'),
    context:null,findingIds:[],proof:usable?d60.allPlanets.flatMap(p=>
     ['D1.'+p.planet+'.sign='+p.d1Sign,'D60.'+p.planet+'.sign='+p.d60Sign]):[],
    ruleIds:['D60_SIGN_ONLY_PROVISIONAL']});continue;
  }
  const lord=l[homeHouse],first=get(lord)!,position=v(division,lord);
  if(!position)throw Error('N493_MISSING_VERIFIED_D'+division+'_'+lord);
  let second=natural;
  if(second===lord){
   second=division===9?'Moon':division===24?'Jupiter':
    division===20?'Saturn':division===2?'Venus':
    division===16?'Moon':division===7?'Moon':'Sun';
   if(second===lord)second='Jupiter';
  }
  const other=get(second)!,otherV=v(division,second);
  if(!otherV)throw Error('N493_MISSING_SECONDARY_D'+division+'_'+second);
  const dignity=dignityFor(lord,position.sign);
  const secondDignity=dignityFor(second,otherV.sign);
  const related=chosen.filter(f=>f.division===division||f.planetKeys.includes(lord)||
    f.planetKeys.includes(second)).slice(0,2);
  const proof=unique([
   'D1.ascendant.sign='+ascPos,'D1.house-lord.'+homeHouse+'='+lord,
   ...natalProof(lord),...vProof(division,lord),
   ...natalProof(second),...vProof(division,second)
  ]);
  let meaning='';
  if(division===1){
   meaning=uk?'Ваш висхідний знак — '+signName(ascPos)+'. Його управитель '+name(lord)+
    ' у '+first.house+'-му домі ('+area(first.house)+'); '+name(second)+
    ' у '+other.house+'-му домі додає іншу сферу — '+area(other.house)+'.':
    'Your rising sign is '+sign(ascPos)+'. Its ruler '+lord+' occupies house '+
    first.house+' ('+area(first.house)+'), while '+second+' adds the distinct area of '+
    area(other.house)+' from house '+other.house+'.';
  }else{
   meaning=uk?'Для теми «'+ukTitle+'» перший показник — управитель '+homeHouse+
    '-го дому '+name(lord)+' у D1 в '+first.house+'-му домі ('+area(first.house)+'). '+
    'У D'+division+' він у '+position.house+'-му домі ('+area(position.house)+'), '+
    'знак «'+signName(position.sign)+'».':
    'For '+enTitle.toLowerCase()+', natal house '+homeHouse+' is ruled by '+lord+
    ' in D1 house '+first.house+' ('+area(first.house)+'). In D'+division+
    ' it occupies house '+position.house+' ('+area(position.house)+'), '+sign(position.sign)+'.';
   meaning+=' '+interpretPair(division,first.house,position.house,uk);
  }
  // Natural indicator must be a different planet from the actual house lord.
  // Its actual division placement adds a DIFFERENT traditional role, not a
  // fabricated second occurrence of the same original longitude.
  meaning+=' '+(uk?'Водночас '+name(second)+' у D'+division+' в '+otherV.house+
   '-му домі ('+area(otherV.house)+') додає тему '+planetRole(second)+'.':
   'Meanwhile '+second+' in D'+division+' house '+otherV.house+' ('+
   area(otherV.house)+') adds the theme of '+planetRole(second)+'.');
  if(position.house===otherV.house){
   meaning+=' '+(uk?'Обидві планети акцентують одну сферу, але їхні традиційні ролі різні.':
    'Both planets emphasize one house, but play different traditional roles.');
  }
  if(yoga.has(lord)&&[7,10,24].includes(division)){
   const owned=Array.from({length:12},(_,i)=>i+1).filter(h=>l[h]===lord);
   meaning+=' '+(uk?name(lord)+' також є йогакаракою: керує домами '+owned.join(' і ')+'.':
    lord+' is also a yogakaraka, ruling houses '+owned.join(' and ')+'.');
   proof.push(...owned.map(h=>'D1.house-lord.'+h+'='+lord));
  }
  let context:string|null=null;
  if(dignity==='exalted'||dignity==='own')context=uk?
   name(lord)+' у D'+division+' '+dignityTerm(dignity,true)+
    '. Це підтримує тему за знаком, але не визначає результат без інших перевірок.':
   lord+' is '+dignityTerm(dignity,false)+' in D'+division+
    '. This supports the theme by sign, not by a complete strength assessment.';
  else if(dignity==='debilitated')context=uk?
   name(lord)+' у D'+division+' перебуває у знаку падіння; без інших перевірок це не негативний прогноз.':
   lord+' occupies its debilitation sign in D'+division+'; no negative prediction follows from this alone.';
  // A second aspect can qualify but not be converted into a fake categorical score.
  if(secondDignity==='debilitated'&&dignity!=='debilitated')context=(context?context+' ':'')+
    (uk?'Другий показник потребує додаткової перевірки: '+name(second)+' у знаку падіння.':
     'The second indicator '+second+' is in a debilitation sign and requires contextual checks.');
  if(division===10){
   // Brihat Jataka X.1: compare the 10th counted from Lagna, Moon and Sun.
   // This is a verified SIGN calculation only; do not invent career titles.
   const moon10=((moon.sign+8)%12)+1;
   const sun=get('Sun')!,sun10=((sun.sign+8)%12)+1;
   const in10=CLASSICAL_GRAHAS.filter(n=>[moon10,sun10].includes(get(n)!.sign));
   if(in10.length){
    meaning+=' '+(uk?'За додатковою класичною перевіркою десятого знака від Місяця і Сонця там розташовані '+
      in10.map(name).join(', ')+'. Це інші ракурси професії, не другий підрахунок D10.':
      'A separate classical tenth-sign check from the Moon and Sun finds '+
       in10.join(', ')+'. These are additional natal lenses, not another count of D10.');
    proof.push('D1.Moon.tenth.sign='+moon10,'D1.Sun.tenth.sign='+sun10,
     ...in10.map(n=>'D1.'+n+'.sign='+get(n)!.sign));
   }
  }
  cards.push({division,title:uk?ukTitle:enTitle,meaning,context,
   findingIds:related.map(r=>r.id),status:leadStatus(posStatus(dignity),posStatus(secondDignity)),
   proof:unique(proof),ruleIds:['PARASHARI_SIGN_LORDSHIP','N4_VERIFIED_VARGA_D'+division,
    ...(division===10?['BJ_X_1_TENTH_FROM_LAGNA_MOON_SUN']:[])]});
 }
 if(cards.length!==16||chosen.length<3||chosen.length>5)return null;
 const focus=chosen.filter(p=>p.status==='tension')[0]||chosen.find(p=>p.theme==='identity')||chosen[0];
 const lead=chosen.find(p=>p.theme==='career')||chosen[0];
 const relation=chosen.find(p=>p.theme==='relationships');
 const portrait=uk?
  'Головна закономірність цієї карти — '+lead.insight+' '+lead.context+
   (relation&&relation.id!==lead.id?' Паралельно тема партнерства має власний показник: '+relation.insight:''):
  'The main theme of this chart: '+lead.insight+' '+lead.context+
   (relation&&relation.id!==lead.id?' Partnership adds a distinct concern: '+relation.insight:'');
 const summaryFocus=uk?'Зверніть особливу увагу на '+focus.title.toLowerCase()+
   ': '+focus.context+' Це напрям для усвідомленого рішення, не готовий вирок.':
  'Pay particular attention to '+focus.title.toLowerCase()+': '+focus.context+
   ' This is a direction for reflection, not a fixed outcome.';
 return {version:N493_VERSION,patterns:chosen,cards,
  summary:{title:uk?'Що найважливіше у вашій карті':'Your most meaningful chart pattern',
   portrait,focus:summaryFocus,proof:unique([...lead.evidence,...focus.evidence,
    ...(relation?.evidence||[])])},
  method:uk?'Показники відбираються за астрологічною роллю, кількома розрахованими чинниками та тематичною доречністю. Це не відсоток успіху. Джерела й межі точності відкриваються в кожній картці. D60 — умовні знаки без сертифікованих домів.':
   'Themes are prioritized by verified chart roles, multiple calculated factors and topical relevance, not percentages. Detailed evidence remains available. D60 uses provisional signs, without certified houses.'};
}
