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
 const primary=[
  'У головній карті '+n+' у '+x.d1House+'-му домі пов’язує цю тему зі сферою '+a+'.',
  'У D'+x.div+' '+n+' займає '+x.vHouse+'-й дім (знак «'+sign+'»), тому до розгляду додається сфера '+b+'.'
 ];
 let first='',second='';
 switch(x.div){
  case 1:
   first='Ваш висхідний знак — '+SIGN_UK[x.ascSign-1]+'. '+n+
    ' у '+x.d1House+'-му домі ставить у центр життєвого напряму сферу '+a+'.';
   second=s+' у '+x.v2House+'-му домі додає окрему тему '+other+
    ': особистий напрям і внутрішні потреби не слід змішувати в один опис.';
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
   second='D12 розміщує '+n+' у '+x.vHouse+'-му домі ('+b+
    '), а '+s+' у '+x.v2House+'-му ('+other+
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
 const a=GEN_EN[x.d1House-1],b=GEN_EN[x.vHouse-1],c=GEN_EN[x.v2House-1];
 const n=x.name,s=x.name2;
 const scope:Record<number,string>={
 1:'personal direction',2:'money and resources',3:'communication and initiative',
 4:'home and property',7:'children and creative care',9:'partnership',
 10:'vocation',12:'family roots',16:'comfort and transport',20:'spiritual practice',
 24:'learning',27:'resilience',30:'handling challenges',40:'maternal lineage',
 45:'paternal principles'
 };
 const name=scope[x.div];if(!name)throw Error('N493_UNSUPPORTED_TOPIC_'+x.div);
 const intro=x.div===1?'Your ascendant ruler '+n+' links life direction to '+a+'.':
  'In this chart, '+name+' links with '+a+' through its natal ruler '+n+'.';
 const primary=x.div===1?'':(' In D'+x.div+', '+n+' occupies house '+x.vHouse+
  ', placing a second emphasis on '+b+'.');
 const companion=' '+s+' adds the distinct factor of '+SECOND_ROLE_EN[s]+' from house '+
  x.v2House+' ('+c+') in D'+x.div+'.';
 const endings:Record<number,string>={
 1:'These are different perspectives on identity, not documented facts about someone’s past.',
 2:'This speaks to the management of resources, not guaranteed earnings.',
 3:'This highlights a style of initiative rather than a single personality label.',
 4:'The combination concerns what helps sustain a stable home base.',
 7:'These are conditions for care and growth, not a prediction about children.',
 9:'Reciprocity and responsibility require joint attention.',
 10:'The combination points to work conditions and craft, not a promised job.',
 12:'This separates inherited examples from personal decisions.',
 16:'Practical comfort is read alongside other obligations.',
 20:'This is a traditional view of sustained practice, not a promise of revelation.',
 24:'Learning needs to be considered alongside applied skills.',
 27:'Endurance is not synonymous with continuous pressure.',
 30:'Difficulties are not automatically inevitable outcomes.',
 40:'These are symbolic family themes, not biographical facts about a mother.',
 45:'The chart invites distinction between inherited values and chosen principles.'
 };
 return intro+primary+companion+' '+endings[x.div];
}
export function composeN493Topic(x:TopicInputs,lang:Lang):string{
 if(x.div===60)throw Error('N493_D60_HAS_SEPARATE_PRECISION_GATE');
 if([x.d1House,x.vHouse,x.v2House,x.vSign,x.ascSign].some(n=>!Number.isInteger(n)||n<1||n>12))
  throw Error('N493_INVALID_POSITION');
 return lang==='uk'?ukText(x):enText(x);
}
