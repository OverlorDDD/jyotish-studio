/**
 * N4.9.3 editorial composer. 15 separate topical rules, never a generic
 * "two contexts" formula. Every named factor is verified BEFORE this call.
 * Each topical sentence is a traditional conditional reading, NOT life history.
 */
type Lang='uk'|'en';
export type TopicInputs={div:number;name:string;name2:string;d1House:number;vHouse:number;
 v2House:number;vSign:number;dignity:string;ascSign:number};
const GEN_UK=[
 'особистого вибору','грошей і сімейних пріоритетів','навичок і спілкування',
 'дому та відчуття опори','творчості, дітей та освіти','щоденної праці й подолання складних завдань',
 'партнерства і домовленостей','довіри та спільних зобов’язань','освіти, наставників і світогляду',
 'професійної відповідальності','результатів і кола однодумців','усамітнення та відновлення'];
const GEN_EN=[
 'personal decisions','money and family priorities','skills and communication',
 'home and stability','creativity, children and education','daily work and problem-solving',
 'partnership and agreements','trust and shared responsibilities','education and worldview',
 'professional responsibility','achievements and community','privacy and recovery'];
const SIGN_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон',
 'Стрілець','Козоріг','Водолій','Риби'];
const SIGN_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio',
 'Sagittarius','Capricorn','Aquarius','Pisces'];
const NAMES:Record<string,string>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',
 Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
const SECOND_ROLE_UK:Record<string,string>={
 Sun:'особистої відповідальності',Moon:'емоційної безпеки',Mars:'ініціативних дій',
 Mercury:'аналізу й діалогу',Jupiter:'знань і наставництва',Venus:'взаємності та співпраці',
 Saturn:'дисципліни й довготривалих обов’язків',Rahu:'нових підходів',
 Ketu:'внутрішнього пошуку'};
const SECOND_ROLE_EN:Record<string,string>={
 Sun:'personal responsibility',Moon:'emotional security',Mars:'decisive initiative',
 Mercury:'analysis and dialogue',Jupiter:'knowledge and mentoring',Venus:'reciprocity and cooperation',
 Saturn:'discipline and long-term duties',Rahu:'unconventional approaches',
 Ketu:'inner inquiry'};
function ukText(x:TopicInputs):string{
 const n=NAMES[x.name]||x.name,s=NAMES[x.name2]||x.name2;
 const a=GEN_UK[x.d1House-1],b=GEN_UK[x.vHouse-1],other=GEN_UK[x.v2House-1];
 const sign=SIGN_UK[x.vSign-1];
 let first='',second='';
 switch(x.div){
  case 1:
   first='Ваш висхідний знак — '+SIGN_UK[x.ascSign-1]+'. '+n+
    ' у '+x.d1House+'-му домі ставить у центр життєвого напряму сферу '+a+'.';
   second=s+' у '+x.v2House+'-му домі додає тему '+other+
    '. Цей акцент потрібно читати поруч із положенням '+n+', а не замість нього.';
   break;
  case 2:
   first='Фінанси тут пов’язані не лише з накопиченням: управитель ресурсів '+n+
    ' у D1 звертає увагу на сферу '+a+'.';
   second='У D2 його '+x.vHouse+'-й дім додає питання '+b+
    ', а '+s+' у '+x.v2House+'-му домі — '+other+
    '. Таке поєднання описує пріоритети поводження з ресурсами, а не гарантований дохід.';
   break;
  case 3:
   first='Спілкування та ініціатива спираються на '+n+
    ', що в D1 пов’язує їх зі сферою '+a+'.';
   second='У D3 '+n+' у '+x.vHouse+'-му домі підкреслює '+b+
    '; '+s+' у '+x.v2House+'-му домі додає роль '+SECOND_ROLE_UK[x.name2]+
    '. Разом це акцент стилю дій і взаємодії, а не оцінка характеру за одним знаком.';
   break;
  case 4:
   first='Почуття дому та рішення щодо власності пов’язані з '+n+
    ' у D1: до сімейної теми долучається сфера '+a+'.';
   second='У D4 '+n+' у '+x.vHouse+'-му домі виводить її до '+b+
    '. '+s+' у '+x.v2House+'-му домі додає потребу '+SECOND_ROLE_UK[x.name2]+
    '. Це спосіб зрозуміти, що підтримує відчуття опори.';
   break;
  case 7:
   first='Тема дітей, наставництва й творчої спадщини в D1 проходить через '+n+
    ' і сферу '+a+'.';
   second='У D7 '+n+' у '+x.vHouse+'-му домі переносить акцент на '+b+
    ', а '+s+' у '+x.v2House+'-му домі — на '+SECOND_ROLE_UK[x.name2]+
    '. Це опис умов турботи й розвитку, а не передбачення народження дитини.';
   break;
  case 9:
   first='У стосунках важливі не лише почуття: управитель сьомого дому '+n+
    ' у D1 пов’язує партнерство зі сферою '+a+'.';
   second='У D9 його '+x.vHouse+'-й дім підкреслює '+b+
    ', а '+s+' у '+x.v2House+'-му домі — '+SECOND_ROLE_UK[x.name2]+
    '. Питання взаємності й відповідальності варто розглядати разом.';
   break;
  case 10:
   first='Професійний розвиток у D1 пов’язаний із '+n+
    ': його положення включає тему '+a+'.';
   second='У D10 '+n+' у '+x.vHouse+'-му домі переводить її в площину '+b+
    '. '+s+' у '+x.v2House+'-му домі додає потребу '+SECOND_ROLE_UK[x.name2]+
    '. Це підказує, які умови праці й розвитку варті уваги, без обіцянки посади.';
   break;
  case 12:
   first='У родинних моделях важливий зв’язок четвертого дому через '+n+
    ' зі сферою '+a+'.';
   second='D12 розміщує '+n+' у '+x.vHouse+'-му домі (сфера '+b+
    '), а '+s+' у '+x.v2House+'-му (сфера '+other+
    '). Це допомагає окремо розглядати батьківські впливи та власні життєві рішення.';
   break;
  case 16:
   first='Теми комфорту й транспорту в D1 пов’язані через '+n+
    ' зі сферою '+a+'.';
   second='У D16 '+n+' у '+x.vHouse+'-му домі додає питання '+b+
    ', а '+s+' у '+x.v2House+'-му — '+SECOND_ROLE_UK[x.name2]+
    '. Побутові рішення тут варто розглядати через їхній зв’язок з іншими обов’язками.';
   break;
  case 20:
   first='Духовна практика у D1 спирається на управителя дев’ятого дому '+n+
    ', пов’язаного зі сферою '+a+'.';
   second='У D20 його '+x.vHouse+'-й дім виводить на тему '+b+
    '. '+s+' у '+x.v2House+'-му домі додає аспект '+SECOND_ROLE_UK[x.name2]+
    '. Це традиційне прочитання способу підтримувати практику, не обіцянка одкровень.';
   break;
  case 24:
   first='Стиль навчання тут пов’язаний з управителем п’ятого дому '+n+
    ' та сферою '+a+'.';
   second='У D24 '+n+' у '+x.vHouse+'-му домі зміщує увагу до '+b+
    '; '+s+' у '+x.v2House+'-му домі додає тему '+SECOND_ROLE_UK[x.name2]+
    '. Знання й практичні навички потрібно оцінювати разом.';
   break;
  case 27:
   first='Внутрішня витривалість у D1 пов’язана з управителем висхідного знака '+n+
    ' та сферою '+a+'.';
   second='У D27 він у '+x.vHouse+'-му домі виводить на тему '+b+
    ', тоді як '+s+' у '+x.v2House+'-му домі додає '+SECOND_ROLE_UK[x.name2]+
    '. Сила тут не тотожна постійному навантаженню.';
   break;
  case 30:
   first='Труднощі й спосіб їх подолання розглядаються через '+n+
    ' — управителя шостого дому, розташованого в D1 у сфері '+a+'.';
   second='У D30 його '+x.vHouse+'-й дім акцентує '+b+
    ', а '+s+' у '+x.v2House+'-му домі — '+SECOND_ROLE_UK[x.name2]+
    '. Це символічні умови реагування на складнощі, не прогноз неминучих втрат.';
   break;
  case 40:
   first='Для материнської лінії важливі зв’язки четвертого дому: у D1 '+n+
    ' привертає увагу до сфери '+a+'.';
   second='У D40 його '+x.vHouse+'-й дім додає тему '+b+
    ', а '+s+' у '+x.v2House+'-му — '+SECOND_ROLE_UK[x.name2]+
    '. Це можливі родинні акценти, а не факт про конкретну матір.';
   break;
  case 45:
   first='Батьківські принципи й передані цінності в D1 пов’язані через '+n+
    ' зі сферою '+a+'.';
   second='У D45 його '+x.vHouse+'-й дім підкреслює '+b+
    ', а '+s+' у '+x.v2House+'-му — '+SECOND_ROLE_UK[x.name2]+
    '. У такому прочитанні важливо розрізняти успадковані правила й власний вибір.';
   break;
  default:throw Error('N493_UNSUPPORTED_TOPIC_'+x.div);
 }
 // Avoid quoting a sign just to fill text. The evidence disclosure contains
 // exact sign and house; surface the sign in the interpretation if meaningful.
 if(x.div!==1&&(x.dignity==='exalted'||x.dignity==='own'||x.dignity==='debilitated')){
  const signStatus=x.dignity==='exalted'?'екзальтації':
   x.dignity==='own'?'власного управління':'падіння';
  second+=' '+n+' у D'+x.div+' у знаку «'+sign+'» ('+signStatus+
   '); це знакова умова, не повна оцінка сили планети.';
 }
 return first+' '+second;
}
function enText(x:TopicInputs):string{
 const a=GEN_EN[x.d1House-1],b=GEN_EN[x.vHouse-1],other=GEN_EN[x.v2House-1];
 const n=x.name,s=x.name2,role=SECOND_ROLE_EN[s];
 const sign=SIGN_EN[x.vSign-1];
 let first='',second='';
 switch(x.div){
  case 1:
   first='Your rising sign is '+sign+' with '+n+' as its ruler in D1 house '+x.d1House+
    ', connecting personal direction to '+a+'.';
   second=s+' in house '+x.v2House+' adds the distinct context of '+other+
    '. These two roles should be considered together, not collapsed into one personality label.';
   break;
  case 2:
   first='The way resources are managed is linked through '+n+
    ', ruler of the second house, to '+a+' in D1.';
   second='In D2 its house '+x.vHouse+' connects resources with '+b+
    ', while '+s+' in house '+x.v2House+' brings in '+other+
    '. This concerns financial priorities, not a promise of income.';
   break;
  case 3:
   first='Communication and initiative follow the D1 third-house ruler '+n+
    ', linking this theme to '+a+'.';
   second='Its D3 placement in house '+x.vHouse+' emphasizes '+b+
    '; '+s+' in house '+x.v2House+' adds '+role+
    '. Together they describe a style of effort, not a predetermined personality.';
   break;
  case 4:
   first='The home and property theme meets '+a+' through its D1 ruler '+n+'.';
   second='In D4 '+n+' occupies house '+x.vHouse+' ('+b+
    '), while '+s+' in house '+x.v2House+' adds '+role+
    '. The two strands show what may matter for a sense of stability.';
   break;
  case 7:
   first='Children, teaching and creative legacy are linked to '+a+
    ' through the D1 fifth-house ruler '+n+'.';
   second='Its D7 house '+x.vHouse+' highlights '+b+', while '+s+
    ' in house '+x.v2House+' adds '+role+
    '. This is a framework for care and growth, not a prediction of children.';
   break;
  case 9:
   first='Partnership is not just attraction: the D1 seventh-house ruler '+n+
    ' connects it to '+a+'.';
   second='In D9 the ruler moves to house '+x.vHouse+' ('+b+
    '), while '+s+' in house '+x.v2House+' introduces '+role+
    '. These dimensions need to be read together when considering commitment.';
   break;
  case 10:
   first='Career develops through '+n+', the tenth-house ruler whose D1 position relates to '+a+'.';
   second='D10 places '+n+' in house '+x.vHouse+', connecting vocation to '+b+
    '. '+s+' in house '+x.v2House+' adds '+role+
    '. This guides an examination of work conditions, not a guaranteed job title.';
   break;
  case 12:
   first='Family roots and parental examples meet '+a+' through the D1 fourth-house ruler '+n+'.';
   second='D12 places it in house '+x.vHouse+' ('+b+
    ') and '+s+' in house '+x.v2House+' ('+other+
    '). Distinguish inherited examples from your own present decisions.';
   break;
  case 16:
   first='Comfort, conveniences and transport meet '+a+' through the D1 fourth-house ruler '+n+'.';
   second='Its D16 house '+x.vHouse+' adds '+b+', while '+s+' in house '+
    x.v2House+' adds '+role+
    '. Practical comfort is meaningful in relation to wider responsibilities.';
   break;
  case 20:
   first='The spiritual-practice theme follows the D1 ninth-house ruler '+n+
    ' into the area of '+a+'.';
   second='In D20 its house '+x.vHouse+' emphasizes '+b+
    ', while '+s+' in house '+x.v2House+' brings in '+role+
    '. This concerns sustaining practice, not promising revelation.';
   break;
  case 24:
   first='Learning and mastery relate to '+a+' through the D1 fifth-house ruler '+n+'.';
   second='Its D24 house '+x.vHouse+' connects study with '+b+
    ', while '+s+' in house '+x.v2House+' adds '+role+
    '. Study and the practical use of skills require joint attention.';
   break;
  case 27:
   first='Resilience is read through the ascendant ruler '+n+
    ', which brings the D1 area of '+a+' into focus.';
   second='D27 places the ruler in house '+x.vHouse+' ('+b+
    '), while '+s+' in house '+x.v2House+' adds '+role+
    '. Endurance is not the same as unbroken pressure.';
   break;
  case 30:
   first='Challenges are examined through the D1 sixth-house ruler '+n+
    ' and its connection with '+a+'.';
   second='In D30 its house '+x.vHouse+' highlights '+b+
    ', while '+s+' in house '+x.v2House+' adds '+role+
    '. This is a traditional view of how obstacles are faced, not an inevitable loss.';
   break;
  case 40:
   first='The maternal-line theme looks at the D1 fourth-house ruler '+n+
    ' and its connection with '+a+'.';
   second='D40 places the ruler in house '+x.vHouse+' ('+b+
    ') and '+s+' in house '+x.v2House+' contributes '+role+
    '. These are symbolic family emphases, not facts about an individual mother.';
   break;
  case 45:
   first='The paternal-line theme follows the D1 ninth-house ruler '+n+
    ' and its connection with '+a+'.';
   second='D45 places the ruler in house '+x.vHouse+' ('+b+
    '), while '+s+' in house '+x.v2House+' adds '+role+
    '. Inherited principles and chosen values should be distinguished.';
   break;
  default:throw Error('N493_UNSUPPORTED_TOPIC_'+x.div);
 }
 if(x.div!==1&&['exalted','own','debilitated'].includes(x.dignity)){
  second+=' '+n+' occupies '+sign+' in D'+x.div+' ('+(
   x.dignity==='exalted'?'exaltation':x.dignity==='own'?'own sign':'debilitation')+
   '); this describes sign dignity, not full planetary strength.';
 }
 return first+' '+second;
}
export function composeN493Topic(x:TopicInputs,lang:Lang):string{
 if(x.div===60)throw Error('N493_D60_HAS_SEPARATE_PRECISION_GATE');
 if([x.d1House,x.vHouse,x.v2House,x.vSign,x.ascSign].some(n=>!Number.isInteger(n)||n<1||n>12))
  throw Error('N493_INVALID_POSITION');
 return lang==='uk'?ukText(x):enText(x);
}
