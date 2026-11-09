/**
 * N4.9.3 evidence-ranked reading. The ranking selects MEANINGFUL independent
 * themes, never 3 versions of the same planetary placement. All statements
 * cite verified D1/N4 facts, not guessed life events or astrological scores.
 * D60 is intentionally excluded from the primary ranking.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor,classicalSignRuler} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable,yogakarakasForLagna} from './reader-classical.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
export const N493_PATTERN_VERSION='n493-ranked-multifactor-v1' as const;
type Lang='uk'|'en';
export type ChartPattern={
 id:'vocation'|'inner-life'|'partnership'|'learning'|'money'|'caution';
 title:string;reading:string;implication:string;
 /** Number of separately calculated FACTS, not statistical confidence. */
 evidence:string[]; divisions:number[]; score:number;
 tier:'prominent'|'contextual'|'requires-review';
};
const H_UK=[
 'особистих рішень','ресурсів і мовлення','спілкування й навичок',
 'дому та внутрішньої опори','творчості й навчання','праці й перешкод',
 'партнерства','спільних зобов’язань','знань і наставників',
 'професійної відповідальності','спільнот і результатів','відновлення та приватності'
];
const H_EN=[
 'personal decisions','resources and speech','communication and skills',
 'home and stability','creativity and study','work and obstacles',
 'partnership','shared responsibilities','knowledge and mentors',
 'professional responsibility','community and results','recovery and privacy'
];
const SIGNS_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const P_UK:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const meaningful=(d:string)=>d==='own'||d==='exalted'||d==='debilitated';
const isSupport=(d:string)=>d==='own'||d==='exalted';
const uniq=(e:string[])=>[...new Set(e)];
export function rankN493Patterns(chart:CalculatedChart,lang:Lang):readonly ChartPattern[]|null{
 const n4=verifiedVargaSource(chart);if(!n4)return null;
 const uk=lang==='uk',houses=uk?H_UK:H_EN,signs=uk?SIGNS_UK:SIGNS_EN;
 const lords=classicalLordshipTable(chart.ascendant.sign);
 const yogas=new Set(yogakarakasForLagna(chart.ascendant.sign));
 const find=(p:string)=>chart.d1.find(x=>x.name===p)!;
 const varga=(d:number,p:string)=>n4.charts.find(c=>c.division===d)!.planets.find(x=>x.name===p)!;
 const name=(p:string)=>uk?P_UK[p]||p:p;
 const where=(h:number)=>houses[h-1],zodiac=(s:number)=>signs[s-1];
 const candidate:ChartPattern[]=[];
 const add=(x:ChartPattern)=>candidate.push({...x,evidence:uniq(x.evidence)});
 const lord10=lords[10],p10=find(lord10),v10=varga(10,lord10),v24=varga(24,lord10);
 const status10=dignityFor(lord10,v10.sign),status24=dignityFor(lord10,v24.sign);
 // Brihat Jataka X.1: compare the tenth from Lagna, Moon and Sun; the
 // navamsa sign-lords of those rulers refine the vocational picture.
 const moonNatal=find('Moon'),sunNatal=find('Sun');
 const tenthFrom=(sign:number)=>((sign+8)%12)+1;
 const moonTenthLord=classicalSignRuler(tenthFrom(moonNatal.sign));
 const sunTenthLord=classicalSignRuler(tenthFrom(sunNatal.sign));
 const moonNav=classicalSignRuler(varga(9,moonTenthLord).sign);
 const sunNav=classicalSignRuler(varga(9,sunTenthLord).sign);
 const bothSame=moonTenthLord===sunTenthLord;
 const classicCrossCheck=uk?
  'За додатковим класичним методом від Місяця десятою сферою керує '+name(moonTenthLord)+
   (bothSame?' — та сама планета, що й від Сонця; не два незалежні підтвердження.':
    ', а від Сонця — '+name(sunTenthLord)+'.')+
   ' Управителі їхніх знаків у D9: '+name(moonNav)+' та '+name(sunNav)+
   '. Це уточнює професійну символіку, але не визначає посаду.':
  'The tenth-from-Moon ruler is '+moonTenthLord+
   (bothSame?', the same ruler as from the Sun—not independent evidence.':
    ', while the tenth-from-Sun ruler is '+sunTenthLord+'.')+
   ' The rulers of their D9 signs are '+moonNav+' and '+sunNav+
   '. This refines vocational symbolism without specifying a job title.';
 const yoga=yogas.has(lord10);
 const role=yoga?Array.from({length:12},(_,i)=>i+1).filter(h=>lords[h]===lord10):[];
 const sector10=where(v10.house),root10=where(p10.house);
 const careerAgree=isSupport(status10)&&isSupport(status24);
 const careerTension=(isSupport(status10)&&status24==='debilitated')||(status10==='debilitated'&&isSupport(status24));
 const profession=uk?
  'Професійною сферою керує '+name(lord10)+'. У D1 він у '+p10.house+'-му домі ('+root10+
  '); у D10 — у '+v10.house+'-му ('+sector10+'), у знаку «'+zodiac(v10.sign)+'». '+
  (yoga?'Для вашого висхідного знака він є йогакаракою — керує домами '+role.join(' і ')+'. ':'')+
  (status10==='exalted'?'У D10 це знак його екзальтації. ':
   status10==='own'?'У D10 це власний знак планети. ':
   status10==='debilitated'?'У D10 це знак традиційного падіння; необхідна перевірка інших чинників. ':'')+
  (careerAgree?'У D24 той самий управитель має підтримувальне знакове положення, що додає тему навчання.':
   careerTension?'D24 показує контрастну знакову оцінку: навчання та робота не мають однакових умов.':
   'D24 є окремою темою навчання; її положення саме по собі не підтверджує професійного успіху.'):
  'Career is ruled by '+lord10+' in D1 house '+p10.house+' ('+root10+
  '). In D10 it occupies house '+v10.house+' ('+sector10+') in '+zodiac(v10.sign)+'. '+
  (yoga?'For this ascendant it is a yogakaraka, ruling houses '+role.join(' and ')+'. ':'')+
  (status10==='exalted'?'It is exalted by sign in D10. ':
   status10==='own'?'It occupies its own sign in D10. ':
   status10==='debilitated'?'Its D10 debilitation calls for additional checks. ':'')+
  (careerAgree?'The same ruler has supportive sign dignity in D24, adding an educational perspective.':
   careerTension?'D24 yields a contrasting sign assessment: career and learning do not carry identical indications.':
   'D24 concerns education and cannot independently guarantee vocational outcomes.');
 add({id:'vocation',title:uk?'Професійні здібності: де знання стають дією':'Vocation: knowledge and practice',
  reading:profession+' '+classicCrossCheck,
  implication:uk?(v10.house===6?
   'Варто перевіряти напрями, де цінують майстерність, дисципліну та вирішення складних задач.':
   v10.house===9?'Навчання, передавання знань і робота з наставниками заслуговують на особливу увагу.':
   'Порівнюйте різні професійні ролі за характером завдань цього дому, а не за однією назвою професії.'):
   v10.house===6?'Consider roles built around disciplined craft and solving demanding problems.':
   v10.house===9?'Teaching, study and mentoring are prominent vocational possibilities.':
   'Compare work roles by their actual responsibilities rather than a predetermined job title.',
  score:40+(yoga?22:0)+(meaningful(status10)?12:0)+(careerAgree?8:careerTension?7:0),
  tier:yoga||meaningful(status10)?'prominent':'contextual',
  evidence:['D1.ascendant.sign='+chart.ascendant.sign,'D1.house-lord.10='+lord10,
   'D1.'+lord10+'.house='+p10.house,'D10.'+lord10+'.house='+v10.house,
   'D10.'+lord10+'.sign='+v10.sign,'D24.'+lord10+'.sign='+v24.sign,
   'D1.Moon.sign='+moonNatal.sign,'D1.Sun.sign='+sunNatal.sign,
   'D9.'+moonTenthLord+'.sign='+varga(9,moonTenthLord).sign,
   'D9.'+sunTenthLord+'.sign='+varga(9,sunTenthLord).sign,
   ...role.map(h=>'D1.house-lord.'+h+'='+lord10)],divisions:[1,9,10,24]});
 const ascLord=lords[1],pAsc=find(ascLord),moon=find('Moon'),sun=find('Sun');
 const self=uk?
  'Ваш висхідний знак має управителя '+name(ascLord)+' у '+pAsc.house+'-му домі ('+
   where(pAsc.house)+'). Місяць перебуває у '+moon.house+'-му домі ('+where(moon.house)+
   '), а Сонце — у '+sun.house+'-му ('+where(sun.house)+'). '+
   (pAsc.name==='Moon'?'У цьому випадку управитель висхідного знака і Місяць — одна планета, а не два незалежні підтвердження.':
    'Це окремі натальні чинники, тому їх не слід підміняти одним психологічним ярликом.'):
  'The ascendant ruler '+ascLord+' occupies house '+pAsc.house+' ('+where(pAsc.house)+
  '). The Moon occupies house '+moon.house+' ('+where(moon.house)+
  '), while the Sun is in house '+sun.house+' ('+where(sun.house)+'). '+
  (pAsc.name==='Moon'?'The ascendant ruler and Moon are the same factor here, not two independent confirmations.':
   'These are distinct chart indicators rather than a single personality label.');
 add({id:'inner-life',title:uk?'Ваш ритм: зовнішні цілі та внутрішні потреби':'Personal rhythm and private needs',
  reading:self,
  implication:uk?(moon.house===12||pAsc.house===12?
    'Відновлення й власний простір — помітний символічний акцент карти; перевірте, як він поєднується з професійними вимогами.':
    'Порівнюйте спосіб приймати рішення з тим, як відновлюєте сили, не вважаючи їх обов’язково протилежними.'):
    (moon.house===12||pAsc.house===12?
     'Privacy and recovery are pronounced traditional themes; compare them with work demands.':
     'Distinguish decision-making from recovery needs without assuming they must conflict.'),
  score:34+((moon.house===12||pAsc.house===12)?19:0)+((pAsc.house===moon.house&&ascLord!=='Moon')?8:0),
  tier:(moon.house===12||pAsc.house===12)?'prominent':'contextual',
  evidence:['D1.house-lord.1='+ascLord,'D1.'+ascLord+'.house='+pAsc.house,
   'D1.Moon.house='+moon.house,'D1.Sun.house='+sun.house],divisions:[1]});
 const lord7=lords[7],p7=find(lord7),v9=varga(9,lord7),venus=varga(9,'Venus');
 const relationDignity=dignityFor(lord7,v9.sign);
 const self7=lord7==='Venus';
 add({id:'partnership',title:uk?'Партнерство: домовленості й спільні цінності':'Partnership: trust and values',
  reading:uk?
   'Сьомим домом керує '+name(lord7)+' у '+p7.house+'-му домі ('+where(p7.house)+
   '). У D9 він перебуває у знаку «'+zodiac(v9.sign)+'».'+
   (lords[8]===lord7?' Ця сама планета керує восьмим домом, тож довіра та спільні зобов’язання входять у те саме традиційне прочитання.':'')+
   (self7?' Венера тут є тим самим управителем — її не можна вважати окремим підтвердженням.':
    ' Окремий показник — Венера у D9 в знаку «'+zodiac(venus.sign)+'».'):
   'The seventh-house ruler '+lord7+' occupies natal house '+p7.house+' ('+where(p7.house)+
   '). In D9 it is in '+zodiac(v9.sign)+'.'+
   (lords[8]===lord7?' The same planet also rules the eighth house, adding shared trust and commitments.':'')+
   (self7?' Venus is the same ruler and should not count as independent evidence.':
    ' A separate indicator is Venus in D9 in '+zodiac(venus.sign)+'.'),
  implication:uk?'Для оцінки близькості варто зіставити сталість домовленостей, особисті принципи й стан обох показників, а не обіцяти конкретного партнера.':
   'Consider commitments, shared values and both indicators rather than predicting a specific partner.',
  score:32+(lords[8]===lord7?16:0)+(meaningful(relationDignity)?9:0)+((p7.house===9)?8:0),
  tier:(lords[8]===lord7||meaningful(relationDignity))?'prominent':'contextual',
  evidence:['D1.house-lord.7='+lord7,'D1.'+lord7+'.house='+p7.house,
    'D9.'+lord7+'.sign='+v9.sign,'D9.Venus.sign='+venus.sign,
    ...(lords[8]===lord7?['D1.house-lord.8='+lord7]:[])],divisions:[1,9]});
 const lord5=lords[5],p5=find(lord5),v24learning=varga(24,lord5),q24=dignityFor(lord5,v24learning.sign);
 add({id:'learning',title:uk?'Навчання: як розвивається майстерність':'Learning and the growth of skill',
  reading:uk?
   'Управитель п’ятого дому '+name(lord5)+' у D1 перебуває в '+p5.house+'-му домі ('+
    where(p5.house)+'). У D24 він займає знак «'+zodiac(v24learning.sign)+'»'+
    (q24==='exalted'?' — знак екзальтації.':q24==='own'?' — власний знак.':
      q24==='debilitated'?' — знак традиційного падіння, що вимагає перевірки інших умов.':'.'):
   'The fifth-house ruler '+lord5+' occupies D1 house '+p5.house+' ('+where(p5.house)+
    '). In D24 it occupies '+zodiac(v24learning.sign)+
    (q24==='exalted'?', its exaltation sign.':q24==='own'?', its own sign.':
      q24==='debilitated'?', its debilitation sign, requiring other checks.':'.'),
  implication:uk?'Це окрема тема освіти й практики: відповідність D10 не слід автоматично вважати незалежним доказом кар’єрного успіху.':
   'This concerns learning and practice; an apparent match to D10 is not an independent promise of career success.',
  score:27+(meaningful(q24)?15:0)+(lord5===lord10?12:0),
  tier:meaningful(q24)?'prominent':'contextual',
  evidence:['D1.house-lord.5='+lord5,'D1.'+lord5+'.house='+p5.house,
   'D24.'+lord5+'.sign='+v24learning.sign,'D24.'+lord5+'.house='+v24learning.house],divisions:[1,24]});
 const lord2=lords[2],p2=find(lord2),lord11=lords[11],p11=find(lord11),v2=varga(2,lord2);
 add({id:'money',title:uk?'Ресурси: заробіток і накопичення':'Resources: earnings and stewardship',
  reading:uk?
   'За другий дім відповідає '+name(lord2)+' у '+p2.house+'-му домі ('+where(p2.house)+
   '), за одинадцятий — '+name(lord11)+' у '+p11.house+'-му. У D2 управитель другого дому перебуває у знаку «'+zodiac(v2.sign)+'». '+
   (lord2===lord11?'Це спільний управитель, а не два незалежні свідчення.':'Обидва доми дають різні показники ресурсів.'):
   'The second-house ruler '+lord2+' occupies house '+p2.house+' ('+where(p2.house)+
   '), and eleventh-house ruler '+lord11+' occupies house '+p11.house+
   '. In D2 the second ruler occupies '+zodiac(v2.sign)+'. '+
   (lord2===lord11?'This is the same planet, not independent corroboration.':'These houses describe distinct resource considerations.'),
  implication:uk?'Відрізняйте джерела доходу від способу збереження ресурсів; з одного знака не можна вивести суму заробітку.':
   'Distinguish sources of gain from how resources are managed; one placement cannot quantify income.',
  score:26+(meaningful(dignityFor(lord2,v2.sign))?13:0)+(p2.house===11||p11.house===2?12:0),
  tier:'contextual',
  evidence:['D1.house-lord.2='+lord2,'D1.'+lord2+'.house='+p2.house,'D1.house-lord.11='+lord11,
   'D1.'+lord11+'.house='+p11.house,'D2.'+lord2+'.sign='+v2.sign],divisions:[1,2]});
 const weak=chart.d1.filter(p=>dignityFor(p.name,p.sign)==='debilitated');
 // Do not infer a diagnosis/personality defect from a single debilitated sign.
 if(weak.length){
  const p=weak.find(x=>[lords[1],lords[7],lords[10],lords[5]].includes(x.name))||weak[0];
  const roles=Array.from({length:12},(_,i)=>i+1).filter(h=>lords[h]===p.name);
  add({id:'caution',title:uk?'Слабке місце в розрахунках, яке ще слід перевірити':'A placement that needs closer checking',
   reading:uk?
    name(p.name)+' у D1 перебуває у знаку «'+zodiac(p.sign)+'» (традиційне падіння). '+
     'Він керує домами '+roles.join(' і ')+'. Сам знак не враховує скасування падіння, аспектів і повної сили планети.':
    p.name+' in D1 occupies '+zodiac(p.sign)+' (traditional debilitation), while ruling houses '+
     roles.join(' and ')+'. Sign dignity alone does not establish cancellation, aspects or full strength.',
   implication:uk?'Сприймайте це як питання для поглибленої перевірки, а не як невдачу чи особистий недолік.':
    'Treat this as a prompt for more complete interpretation, not a personal flaw or forecast.',
   score:32+([lords[1],lords[7],lords[10],lords[5]].includes(p.name)?18:0),
   tier:'requires-review',evidence:['D1.'+p.name+'.sign='+p.sign,...roles.map(h=>'D1.house-lord.'+h+'='+p.name)],
   divisions:[1]});
 }
 // Always keep broad life-area diversity; order by explicit interpretive priority,
 // NOT false statistical probabilities. The 6th candidate is omitted.
 const sorted=[...candidate].sort((a,b)=>b.score-a.score||
  ['vocation','inner-life','partnership','learning','money','caution'].indexOf(a.id)-
  ['vocation','inner-life','partnership','learning','money','caution'].indexOf(b.id));
 // Always present three; add a fourth/fifth only when it has actual measured
 // rule evidence close to the third, not merely because it exists.
 const cutoff=Math.max(37,sorted[2].score-4);
 const eligible=sorted.filter(x=>x.score>=cutoff).slice(0,5);
 const picked=eligible.length>=3?eligible:sorted.slice(0,3);
 if(picked.length<3||picked.length>5||new Set(picked.map(x=>x.id)).size!==picked.length)return null;
 // Never let a provisional D60 sign score a top insight.
 if(picked.some(p=>p.divisions.includes(60)))throw Error('N493_D60_PRIMARY_INSIGHT_FORBIDDEN');
 return picked;
}
