/**
 * N4.9: one evidence-linked life reading built from ONE internally verified
 * D1 → Dn chart. No LLM, inferred biography, birth metadata, or new astronomy.
 * A sign dignity is a limited traditional indicator, never full Shadbala.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {CLASSICAL_RULERS,dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {classicalLordshipTable} from './reader-classical.ts';
import {extractN44Evidence} from './reader-classical-n44.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';

export const N49_UNIFIED_VERSION='n49-unified-evidence-v1' as const;
type Lang='uk'|'en';
type Polarity='reinforced'|'contradictory'|'cautious'|'unresolved';
type Scope='d1_direct'|'cross_varga_modern_extension';
export type N49Link={
 division:number;lord:string;d1House:number;d1Sign:number;dnHouse:number;dnSign:number;
 polarity:Polarity;scope:Scope;
 evidence:readonly string[];directSourceIds:readonly string[];extensionSourceIds:readonly string[];
};
export type N49Thread={id:'foundation'|'career'|'partnership'|'resource'|'tension';
 title:string;text:string;evidence:readonly string[];sourceIds:readonly string[];
 directSourceIds:readonly string[];extensionSourceIds:readonly string[];scope:Scope};
export type N49Unified={
 version:typeof N49_UNIFIED_VERSION;title:string;opening:string;threads:readonly N49Thread[];
 closing:string;method:string;links:readonly N49Link[];
};
const ALL=[1,2,3,4,7,9,10,12,16,20,24,27,30,40,45] as const;
const THEME_HOUSE:Readonly<Record<number,number>>={1:1,2:2,3:3,4:4,7:5,9:7,10:10,
 12:4,16:4,20:9,24:5,27:1,30:6,40:4,45:9};
const AREA_UK=['особистого вибору','ресурсів і цінностей','спілкування й зусиль','дому й опори',
 'творчості та навчання','щоденної праці','партнерства','змін і спільних ресурсів',
 'пошуку знань і сенсу','професії та суспільної ролі','спільнот і результатів','усамітнення та відновлення'];
const AREA_EN=['personal direction','resources and values','communication and effort','home and belonging',
 'creativity and learning','daily work','partnership','change and shared resources',
 'learning and meaning','career and public contribution','networks and long-term results','solitude and recovery'];
const SIGN_UK=['Овні','Тельці','Близнюках','Раку','Леві','Діві','Терезах','Скорпіоні','Стрільці','Козорозі','Водолії','Рибах'];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANET_UK:Readonly<Record<string,string>>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',
 Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const dSupport=(d:string)=>d==='own'||d==='exalted';
const dDifficulty=(d:string)=>d==='debilitated';
export function n49Polarity(d1:string,dn:string):Polarity{
 if((dSupport(d1)&&dDifficulty(dn))||(dDifficulty(d1)&&dSupport(dn)))return 'contradictory';
 if(dSupport(d1)&&dSupport(dn))return 'reinforced';
 if(dDifficulty(d1)||dDifficulty(dn))return 'cautious';
 return 'unresolved'; // Unknown is NOT bad; no invented strength/percentage.
}
function explanatoryTone(p:Polarity,uk:boolean):string{
 const x:Record<Polarity,[string,string]>={
  reinforced:['Два знакові показники підтримують тему, але без оцінки всієї сили планет це не гарантує результат.','The two sign indicators reinforce this topic, but do not establish full planetary strength or an outcome.'],
  contradictory:['У D1 та тематичній карті різна якість положення: це суперечність, яку не можна приховати позитивним підсумком.','D1 and the divisional chart point in different directions. The disagreement should not be concealed by a positive summary.'],
  cautious:['Є конкретний знак, який традиція читає обережніше; він не доводить невдачі чи особистого недоліку.','One sign placement traditionally calls for care; it does not establish failure or a personal defect.'],
  unresolved:['Знакових показників замало для однозначної оцінки: відсутність сильного правила не означає негативного висновку.','Sign dignities alone do not decide this topic; a missing strong rule is not a negative verdict.']
 };
 return x[p][uk?0:1];
}
export function buildUnifiedN49(chart:CalculatedChart,lang:Lang,asOf:string,
 resourceDivision:number,tensionDivision:number):N49Unified|null{
 const src=verifiedVargaSource(chart);
 if(!src||!/^\d{4}-\d{2}-\d{2}$/.test(asOf))return null;
 const uk=lang==='uk',lords=classicalLordshipTable(chart.ascendant.sign);
 const pName=(s:string)=>uk?(PLANET_UK[s]||s):s;
 const sign=(n:number)=>(uk?SIGN_UK:SIGN_EN)[n-1];
 const area=(n:number)=>(uk?AREA_UK:AREA_EN)[n-1];
 const links:N49Link[]=ALL.map(division=>{
  const h=THEME_HOUSE[division],lord=lords[h];
  const original=chart.d1.find(p=>p.name===lord);
  const dn=src.charts.find(c=>c.division===division);
  const placement=dn?.planets.find(p=>p.name===lord);
  if(!original||!placement)throw Error('N49_MISSING_VERIFIED_VARGA_LINK_'+division);
  const rules=extractN44Evidence(chart,division,asOf);
  const distinct=(application:string)=>[...new Set(rules.filter(r=>r.application===application)
   .map(r=>r.sourceId))];
  return {division,lord,d1House:original.house,d1Sign:original.sign,
   dnHouse:placement.house,dnSign:placement.sign,
   polarity:n49Polarity(dignityFor(lord,original.sign),dignityFor(lord,placement.sign)),
   scope:(division===1?'d1_direct':'cross_varga_modern_extension') as Scope,
   evidence:['D1.house-lord.'+h+'='+lord,'D1.'+lord+'.house='+original.house,
    'D1.'+lord+'.sign='+original.sign,'D'+division+'.'+lord+'.house='+placement.house,
    'D'+division+'.'+lord+'.sign='+placement.sign],
   directSourceIds:distinct('direct_natal'),extensionSourceIds:distinct('modern_varga_extension')};
 });
 if(new Set(links.map(l=>l.division)).size!==15)return null;
 const byDivision=(n:number)=>links.find(x=>x.division===n)!;
 const moon=chart.d1.find(p=>p.name==='Moon');
 const ascLord=lords[1],ascPlanet=chart.d1.find(p=>p.name===ascLord);
 const sun=chart.d1.find(p=>p.name==='Sun');
 if(!moon||!sun||!ascPlanet)return null;
 const getEvidence=(...items:(N49Link|undefined)[])=>[...new Set(items.filter((v):v is N49Link=>!!v)
  .flatMap(v=>v.evidence))];
 const thread=(id:N49Thread['id'],title:string,text:string,links:N49Link[],
   extra:readonly string[]=[]):N49Thread=>({
  id,title,text,scope:id==='foundation'?'d1_direct':'cross_varga_modern_extension',
  evidence:[...new Set([...getEvidence(...links),...extra])],
  sourceIds:[...new Set(links.flatMap(l=>[...l.directSourceIds,...l.extensionSourceIds]))],
  directSourceIds:[...new Set(links.flatMap(l=>l.directSourceIds))],
  extensionSourceIds:[...new Set(links.flatMap(l=>l.extensionSourceIds))]
 });
 const r=byDivision(resourceDivision),t=byDivision(tensionDivision);
 if(!r||!t||r.division===t.division||r.division===10||t.division===10) return null;
 const career=byDivision(10),relation=byDivision(9);
 const navCareer=chart.d9.find(p=>p.name===career.lord);
 if(!navCareer)return null;
 const rulerOfNavamsa=CLASSICAL_RULERS[navCareer.sign-1];
 const tenthFrom=(origin:number)=>((origin+8)%12)+1;
 const fromMoon=tenthFrom(moon.sign),fromSun=tenthFrom(sun.sign);
 const tenthOccupants=(origin:number)=>chart.d1.filter(p=>
  ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].includes(p.name)&&
  p.sign===tenthFrom(origin)).map(p=>p.name);
 const occupants=[...new Set([...tenthOccupants(chart.ascendant.sign),...tenthOccupants(moon.sign)])];
 const venusD1=chart.d1.find(p=>p.name==='Venus')!;
 const venusD9=chart.d9.find(p=>p.name==='Venus')!;
 const threads:N49Thread[]=[
  thread('foundation',uk?'Вихідна нитка: характер і мотивація':'The starting thread: temperament and motive',
   uk?'Висхідний знак задає базовий ракурс, а його управитель '+pName(ascLord)+
     ' стоїть у '+ascPlanet.house+'-му домі — сфері '+area(ascPlanet.house)+
     '. Місяць стоїть у '+moon.house+'-му домі ('+area(moon.house)+
     '). Ці два обчислені акценти варто читати разом: зовнішній напрям і потреби не завжди збігаються, і жодна варга не може підмінити D1.':
    'The rising sign sets the foundation. Its ruler '+ascLord+' is in house '+ascPlanet.house+
     ' ('+area(ascPlanet.house)+'), while the Moon is in house '+moon.house+
     ' ('+area(moon.house)+'). Read direction and emotional priorities together; a divisional chart cannot replace D1.',
   [byDivision(1)],['D1.ascendant.sign='+chart.ascendant.sign,'D1.Moon.sign='+moon.sign,
    'D1.Moon.house='+moon.house,'D1.'+ascLord+'.house='+ascPlanet.house]),
  thread('career',uk?'Професія: D1, D9 і D10 в одному реченні':'Vocation: D1, D9 and D10 in one argument',
   (uk?'Управитель десятого дому D1 — '+pName(career.lord)+
    ': у головній карті він у '+career.d1House+'-му домі, а в D10 — у '+career.dnHouse+
    '-му ('+area(career.dnHouse)+'). У D9 той самий управитель потрапляє в '+sign(navCareer.sign)+
    ', управитель цієї навамші — '+pName(rulerOfNavamsa)+'. Десятий знак від Місяця — '+
    sign(fromMoon)+', від Сонця — '+sign(fromSun)+'. ':
    'The D1 tenth-house ruler is '+career.lord+': in house '+career.d1House+' of the main chart and house '+
    career.dnHouse+' ('+area(career.dnHouse)+') of D10. In D9 it occupies '+sign(navCareer.sign)+
    ', ruled by '+rulerOfNavamsa+'. The tenth sign from the Moon is '+sign(fromMoon)+
    ', and from the Sun '+sign(fromSun)+'. ')+
   (occupants.length?(uk?'У десятому домі від Лагни або Місяця є класичні планети ('+
    occupants.map(pName).join(', ')+'), отже навамша-управителі не замінюють цей первинний показник. ':
    'Classical planets occupy the tenth from Lagna or Moon ('+occupants.join(', ')+
    '); navamsa dispositors do not replace these primary indicators. '):
    (uk?'Обидва десяті доми без класичних планет: правило Brihat Jataka X.1 тоді звертається до управителів навамш від Лагни, Місяця і Сонця. ':
    'Both tenth houses lack classical planets, so Brihat Jataka X.1 turns to the navamsa dispositors from Lagna, Moon and Sun. '))+
    explanatoryTone(career.polarity,uk),
   [career],[ 'D9.'+career.lord+'.sign='+navCareer.sign,
    'D9.sign-ruler.'+navCareer.sign+'='+rulerOfNavamsa,
    'D1.Moon.tenth.sign='+fromMoon,'D1.Sun.tenth.sign='+fromSun]),
  thread('partnership',uk?'Стосунки: D1 не суперечить D9 автоматично':'Relationships: D9 refines rather than cancels D1',
   (uk?'Управитель сьомого дому D1 — '+pName(relation.lord)+
    ' — перебуває в '+relation.d1House+'-му домі ('+area(relation.d1House)+
    '). У D9 він переходить у '+relation.dnHouse+'-й дім ('+area(relation.dnHouse)+
    '). Венера в D1 і D9: '+venusD1.house+'-й і '+venusD9.house+
    '-й доми відповідно. Це зіставлення умов взаємності, а не твердження про шлюб чи конкретного партнера. ':
    'The D1 seventh-house ruler '+relation.lord+' is in house '+relation.d1House+
    ' ('+area(relation.d1House)+'), and in D9 house '+relation.dnHouse+
    ' ('+area(relation.dnHouse)+'). Venus occupies houses '+venusD1.house+
    ' and '+venusD9.house+' in D1 and D9. These are relationship lenses, not a marriage or partner prediction. ')+
    explanatoryTone(relation.polarity,uk),
   [relation],['D1.Venus.house='+venusD1.house,'D9.Venus.house='+venusD9.house]),
  thread('resource',uk?(r.polarity==='reinforced'?'Підкріплений ресурс: від D1 до Dn':'Помітний потенціал: від D1 до Dn'):
   (r.polarity==='reinforced'?'Reinforced resource: from D1 to Dn':'An area to examine: from D1 to Dn'),
   (uk?'Для тематичної карти D'+r.division+' управитель відповідного дому '+pName(r.lord)+
    ' стоїть у D1 в '+r.d1House+'-му домі, а в D'+r.division+' — у '+
    r.dnHouse+'-му ('+area(r.dnHouse)+'). Це не окреме передбачення: варга уточнює ту саму планету, яку вже видно в D1. ':
    'For D'+r.division+', the relevant D1 house ruler '+r.lord+' occupies D1 house '+
    r.d1House+' and D'+r.division+' house '+r.dnHouse+
    ' ('+area(r.dnHouse)+'). This is not a separate prediction: the varga refines the same natal planet. ')+
    explanatoryTone(r.polarity,uk),
   [r]),
  thread('tension',uk?(['contradictory','cautious'].includes(t.polarity)?'Виявлена напруга: що врахувати':'Інший ракурс без підтвердженого конфлікту'):
   (['contradictory','cautious'].includes(t.polarity)?'A visible tension worth examining':'A second lens, not a proven conflict'),
   (uk?'Інший ракурс дає D'+t.division+': управитель '+pName(t.lord)+
    ' стоїть у D1 у '+t.d1House+'-му домі, а в D'+t.division+
    ' — у '+t.dnHouse+'-му ('+area(t.dnHouse)+'). Підсумкове читання не повинно оголошувати цю сферу благополучною лише через підтримку в іншій карті. ':
    'A different lens comes from D'+t.division+': '+t.lord+
    ' occupies house '+t.d1House+' in D1 and house '+t.dnHouse+
    ' ('+area(t.dnHouse)+') in D'+t.division+
    '. A positive indication elsewhere cannot automatically erase this theme. ')+
    explanatoryTone(t.polarity,uk),
   [t])
 ];
 const opening=uk?
  'У цій карті головний сюжет починається з управителя Лагни '+pName(ascLord)+
  ' і Місяця: саме від D1 ми переходимо до професії (D10), стосунків (D9) та двох інших тематичних зрізів D'+
  r.division+' і D'+t.division+'. Кожний наступний висновок нижче прив’язано до фактичного положення управителя, а не до загального опису знака.':
  'This chart begins with the rising ruler '+ascLord+' and the Moon. From D1 we trace the same planetary evidence into work (D10), partnership (D9), and the additional D'+
  r.division+' and D'+t.division+' lenses. Each conclusion below follows a specified placement, not a generic Sun-sign profile.';
 // The closing checks all fifteen links, not merely the selected five stories.
 // Select auditable examples; no percentage, weighted 'good chart' score or
 // assumption that lack of a supportive rule implies a difficult chart.
 const allReinforcements=links.filter(l=>l.division!==1&&l.polarity==='reinforced');
 const allContrasts=links.filter(l=>l.division!==1&&l.polarity==='contradictory');
 const allCautions=links.filter(l=>l.division!==1&&l.polarity==='cautious');
 const example=(link:N49Link)=>'D'+link.division+' ('+pName(link.lord)+
  (uk?', D1 дім '+link.d1House+' → D'+link.division+' дім '+link.dnHouse:
      ', D1 house '+link.d1House+' → D'+link.division+' house '+link.dnHouse)+')';
 const reinforcedText=allReinforcements.length?
  (uk?'Узгоджені знакові свідчення є, зокрема, для '+allReinforcements.slice(0,2).map(example).join(' та ')+'. ':
      'Some sign indications align, including '+allReinforcements.slice(0,2).map(example).join(' and ')+'. '):
  (uk?'Серед перевірених знакових гідностей немає однозначно подвійного підкріплення; це не означає відсутності ресурсу. ':
      'No double reinforcement emerged from this limited sign-dignity check; that does not mean there are no resources. ');
 const opposite=allContrasts.length?allContrasts:allCautions;
 const cautionText=opposite.length?
  (uk?(allContrasts.length?'Суперечливі показники не замовчуються: ':'Обережного читання потребує, зокрема, ')+
       opposite.slice(0,2).map(example).join(' та ')+'. ':
      (allContrasts.length?'Contradictory indicators stay visible: ':'One area requiring care is ')+
       opposite.slice(0,2).map(example).join(' and ')+'. '):
  (uk?'За цією вузькою перевіркою суперечність не виявлена; це не гарантує відсутності труднощів. ':
      'No contradiction appears under this narrow check; that does not guarantee an absence of challenges. ');
 const closing=uk?
  reinforcedText+cautionText+
  'Ми переглянули всі 15 зв’язків D1→Dn, але не підсумовуємо їх голосуванням: D1 лишається основою, інші карти уточнюють її. Повна сила планет, аспекти, йоги та похибка часу ще потребують окремої перевірки.':
  reinforcedText+cautionText+
  'All 15 D1→Dn links were examined, not voted into a single score. D1 remains primary; other charts qualify it. Full strengths, aspects, yogas and birth-time uncertainty still need separately validated checks.';
 const method=uk?
  'Дані: лише підтверджені знаки й доми D1 та 15 пов’язаних варг. Оцінка показує статус планети у знаку, не Shadbala/Vimsopaka. Книжкові правила позначені окремо від сучасного перенесення на Dn. D60 не використовується для цього цілісного портрета.':
  'Inputs: internally verified D1 placements and 15 related vargas, no birth metadata. Sign dignity is not full Shadbala/Vimsopaka. Reviewed historical rules are distinguished from modern Dn extensions. D60 is excluded from this whole-life portrait.';
 return {version:N49_UNIFIED_VERSION,title:uk?'Єдиний портрет: від D1 до тематичних карт':'One portrait: from D1 to its divisional lenses',
  opening,threads,closing,method,links};
}
