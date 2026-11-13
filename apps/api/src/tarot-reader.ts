import {describeDraws,type Spread} from './tarot-deck.ts';
import {cardWeight,spreadTone,type TarotTone} from './tarot-tone.ts';
type Lang='uk'|'en';
type Draw={id:string;position:number;reversed:boolean};
export type ReaderNarrative={
 directAnswer:string;
 development:string;
 cardExplanations:string[];
 caution:string;
 advice:string;
 /** Honest overall tone of the cards (local reader only; AI narratives may omit it). */
 tone?:TarotTone;
};
/** Distinct concrete situation cues for the classic deck; originally written for Galaxiora.
 * Predictive-sounding scenarios are POSSIBILITIES, never knowledge of future events.
 */
const MAJOR:Record<string,[string,string,string,string]>={
 fool:['неочікуваний початок, запрошення або імпровізована зустріч','поспішне рішення чи невпевненість перед новим','a spontaneous invitation, encounter or fresh beginning','a rushed choice or hesitation before a new start'],
 magician:['розмову, в якій ваші слова можуть змінити хід справи','обіцянку без чіткого плану або спробу впливу','a conversation where your initiative can shift events','a promise without a plan or an attempt at control'],
 priestess:['паузу, приховану інформацію або тонкий натяк','мовчання, за яким криється нез’ясоване питання','a pause, a quiet clue or information not yet shared','silence around an unresolved issue'],
 empress:['затишок, турботу або приємну зустріч із близькими','надмірні очікування уваги чи образу через нестачу турботи','comfort, generosity or a warm meeting with loved ones','an imbalance in care or expectations'],
 emperor:['серйозну домовленість чи впорядкування планів','жорстку вимогу, суперечку про правила або контроль','a firm agreement or plans becoming structured','a strict demand or dispute over control'],
 hierophant:['пораду старшої людини або розмову про традиції','суперечку через правила чи чужі очікування','advice from a mentor or a conventional commitment','pressure from rules or other people’s expectations'],
 lovers:['важливе особисте рішення, зближення або чесне зізнання','непорозуміння між бажанням і вибором','an important choice, intimacy or honest disclosure','mixed motives or a mismatch of intentions'],
 chariot:['швидкий розвиток, дорогу або рішучу дію','поспіх і ризик втратити керування ситуацією','rapid progress, travel or a determined move','rushing ahead without enough control'],
 strength:['можливість спокійно владнати напружену розмову','нестримані емоції або втому від самоконтролю','a chance to handle tension through patience','tiredness or emotion overwhelming restraint'],
 hermit:['тихий вечір, усамітнення або корисну розмову із собою','самотність, відкладений контакт або відсутність відповіді','a quiet evening, solitude or useful reflection','isolation, delayed contact or missing response'],
 wheel:['зміну планів, випадковий збіг або новий поворот','затримку або повторення старої ситуації','a changed plan, coincidence or sudden opportunity','a delay or a familiar pattern repeating'],
 justice:['необхідність зважити факти чи прийняти тверезе рішення','несправедливу претензію або суперечку про відповідальність','a fact-based decision or fair reckoning','an accusation or dispute about accountability'],
 hanged:['паузу, перенесення зустрічі або переосмислення очікувань','застрягання в очікуванні чужої ініціативи','a pause, postponement or shift of viewpoint','waiting too long for another person to act'],
 death:['завершення старого плану та несподіваний новий формат','небажання завершити незручну історію','an old plan ending so a new one can begin','resistance to a necessary ending'],
 temperance:['мирну домовленість, компроміс або спокійний ритм','невчасну реакцію або порушення міри','a compromise, balanced pace or a calm discussion','bad timing or an emotional imbalance'],
 devil:['сильну спокусу, залежну домовленість або ревнощі','усвідомлення шкідливої прив’язаності і спробу вийти з неї','a tempting offer, attachment or jealousy','recognizing an unhealthy bond and wanting out'],
 tower:['раптову новину, різку розмову або зміну домовленостей','накопичену напругу, яка може проявитися поступово','a sudden message, sharp conversation or disrupted plan','building tension that may surface more quietly'],
 star:['обнадійливу новину, підтримку або відчуття полегшення','розчарування через завищені очікування','encouraging news, support or renewed hope','discouragement caused by high expectations'],
 moon:['невизначену ситуацію, двозначне повідомлення або здогади','поступове з’ясування прихованого непорозуміння','an ambiguous message or uncertain situation','a confusing situation slowly becoming clearer'],
 sun:['приємну зустріч, ясну відповідь або добру новину','радість, яку може зіпсувати завищене очікування','a cheerful encounter, clear answer or good news','good moments shadowed by unrealistic expectations'],
 judgement:['дзвінок з минулого, важливе усвідомлення або повернення теми','затримане рішення і старе почуття провини','an important call, reflection or a return from the past','a postponed decision or unresolved regret'],
 world:['успішне завершення справи або підбиття підсумків','незакриту деталь перед новим кроком','a satisfying conclusion or completed arrangement','an unfinished detail delaying closure']
};
const MINOR:Record<string,[string,string,string,string]>={
 'wands-ace':['імпульс діяти або нове запрошення','план, який відкладають через сумнів','an exciting invitation or a fresh idea','an initiative delayed by doubt'],
 'wands-two':['планування поїздки чи майбутньої зустрічі','вагання між двома планами','planning a visit or future direction','hesitating between plans'],
 'wands-three':['очікування відповіді ззовні або нову перспективу','затримку домовленості чи повідомлення','a message arriving from afar or widening options','a delayed arrangement or message'],
 'wands-four':['зустріч удома, святкування або комфорт у знайомому колі','незручність удома чи перенесення святкування','a gathering at home or a small celebration','a strained gathering or plans changing'],
 'wands-five':['жваву суперечку або конкуренцію за увагу','затяжне непорозуміння, яке ніхто не хоче розв’язати','a spirited argument or competing priorities','friction left unspoken'],
 'wands-six':['увагу, похвалу або маленьку перемогу','бажання визнання без очікуваної реакції','recognition, praise or a small victory','a hoped-for compliment not quite arriving'],
 'wands-seven':['необхідність відстояти свою позицію','втому від пояснення і захисту меж','standing up for a choice','feeling worn down by defending a choice'],
 'wands-eight':['швидке повідомлення, запрошення або зміну темпу','плутанину з часом чи запізнення','a quick message or rapidly changing plans','mixed messages or delayed timing'],
 'wands-nine':['обережність після минулих переживань','втому й небажання знову сперечатися','guardedness after past experience','fatigue and reluctance to engage'],
 'wands-ten':['багато справ і відповідальності наприкінці дня','можливість відмовитися від зайвого навантаження','a demanding schedule or added responsibilities','putting down an unnecessary burden'],
 'wands-page':['новину, флірт або цікаву ідею','ентузіазм, за яким не стоїть план','a playful message, flirtation or novel idea','a promising message without follow-through'],
 'wands-knight':['раптовий візит, дорогу або сміливу ініціативу','поспішну обіцянку й мінливі плани','a spontaneous visit, drive or bold invitation','a hasty promise and unreliable timing'],
 'wands-queen':['увагу впевненої людини та тепле спілкування','ревнощі чи боротьбу за увагу','warm attention from a confident person','jealousy or competition for attention'],
 'wands-king':['рішучу пропозицію, ініціативу лідера','спробу нав’язати свій сценарій','a decisive offer or confident organizer','someone insisting on their own agenda'],
 'cups-ace':['нове почуття, приємний жест або душевну розмову','складність відверто сказати про почуття','an affectionate gesture or heartfelt conversation','feelings withheld or hard to express'],
 'cups-two':['зближення, побачення або щиру домовленість','розбіжність у взаємних очікуваннях','a date, reconciliation or honest mutual exchange','misaligned feelings or expectations'],
 'cups-three':['зустріч із друзями або дружнє святкування','незручну ситуацію серед знайомих','a friendly celebration or gathering','awkwardness or exclusion in a group'],
 'cups-four':['нудьгу чи відмову від пропозиції','помічений шанс, який раніше ігнорували','boredom or overlooking an invitation','an opportunity finally noticed'],
 'cups-five':['розчарування або сум через нездійснені плани','поступове примирення після неприємності','disappointment over plans that did not happen','gradual healing after a disappointment'],
 'cups-six':['зустріч зі старим знайомим або теплий спогад','болісну ностальгію чи повтор минулого','contact from an old friend or warm memories','nostalgia keeping you stuck'],
 'cups-seven':['кілька спокусливих варіантів і плутанину','вибір одного реального варіанта з багатьох','too many tempting possibilities','choosing one realistic possibility'],
 'cups-eight':['небажання залишатися на події або зміну планів','складність залишити неприємну ситуацію','leaving an unsatisfying meeting or plan','staying despite wanting to leave'],
 'cups-nine':['приємне здійснення маленького бажання','свято без очікуваного задоволення','a small wish fulfilled or a pleasant treat','a celebration that feels less satisfying'],
 'cups-ten':['спокій удома або теплий сімейний вечір','розбіжність у родинних очікуваннях','a warm family evening or shared comfort','family tension behind a cheerful surface'],
 'cups-page':['ніжне повідомлення чи щире вибачення','заплутаний флірт або незрілі почуття','a sweet message or apology','confusing flirtation or immature feelings'],
 'cups-knight':['романтичне запрошення або красивий жест','занадто ідеалізовану обіцянку','a romantic invitation or charming gesture','an idealized promise without action'],
 'cups-queen':['щиру підтримку та глибоку розмову','емоційну перевтому через чужі переживання','a compassionate conversation or support','emotional overload from others’ feelings'],
 'cups-king':['спокійну відвертість і зрілий контакт','стримані почуття чи пасивний контроль','a measured, emotionally honest exchange','suppressed feelings or passive control'],
 'swords-ace':['ясну новину, правду або пряме рішення','різкі слова чи помилковий висновок','a clear message, truth or direct decision','sharp words or a premature judgment'],
 'swords-two':['відкладений вибір або мовчання','нарешті необхідну розмову','a stalled choice or unresolved silence','a decision or conversation finally moving'],
 'swords-three':['образливі слова або неприємне зізнання','розмову, що починає знімати старий біль','hurtful words or an upsetting truth','a conversation that begins easing old pain'],
 'swords-four':['відпочинок, відкладену зустріч або тишу','втому, через яку важко по-справжньому розслабитись','rest, quiet or a postponed meeting','exhaustion preventing true rest'],
 'swords-five':['суперечку, де правота дорого коштує','можливість припинити безплідну сварку','an argument where winning costs too much','a chance to leave a pointless conflict'],
 'swords-six':['дорогу, зміну обстановки або спокійний відхід','затримку в дорозі чи повернення до старої проблеми','a journey, change of scene or a calmer exit','a delayed transition or a return to old problems'],
 'swords-seven':['недоговореність чи чиєсь ухиляння','викриття неповної правди або чесну розмову','an omission, evasion or quiet workaround','an omission becoming visible'],
 'swords-eight':['відчуття обмеженості вибору','несподіване розуміння, що вихід існує','feeling stuck between limited options','noticing an available way forward'],
 'swords-nine':['тривожні думки перед сном','полегшення після розмови про страх','worry and overthinking before sleep','relief after naming a fear'],
 'swords-ten':['неприємний фінал старого конфлікту','перший крок від виснаження до відновлення','an exhausting chapter reaching its end','the beginning of recovery'],
 'swords-page':['уважне запитання або несподівану інформацію','чутки й підозри без доказів','a pointed question or interesting information','rumors and suspicion without proof'],
 'swords-knight':['різку розмову або швидке рішення','нерозуміння через поспіх і слова','a fast decision or blunt confrontation','misunderstanding caused by haste'],
 'swords-queen':['чесне, хоч і холодне пояснення','критичні слова, які сприймуть болісно','a clear but emotionally cool explanation','criticism that lands painfully'],
 'swords-king':['офіційну відповідь або тверезу оцінку','жорсткий контроль або надмірно категоричний висновок','a formal response or rational assessment','an overly harsh conclusion'],
 'pentacles-ace':['невелику практичну можливість або конкретну пропозицію','відкладену покупку чи фінансову нерішучість','a practical offer or tangible opportunity','a delayed purchase or practical hesitation'],
 'pentacles-two':['необхідність змінити графік і поєднати справи','плутанину в планах через перевантаження','juggling plans and making a schedule work','an overloaded schedule and mixed priorities'],
 'pentacles-three':['спільну справу чи конструктивну домовленість','незлагоджену співпрацю','cooperation or practical teamwork','poor coordination or missed details'],
 'pentacles-four':['бажання залишитися вдома і зберегти стабільність','страх втратити контроль або зайві витрати','a conservative choice and protecting comfort','fear of losing control or overspending'],
 'pentacles-five':['необхідність просити підтримку через нестачу ресурсів','виявлену допомогу в непростій ситуації','a need for practical support','unexpected assistance during hardship'],
 'pentacles-six':['обмін послугою, подарунок або справедливу домовленість','нерівний обмін чи борг вдячності','a gift, fair exchange or helpful favor','unequal giving or strings attached'],
 'pentacles-seven':['очікування результатів і перевірку зробленого','нетерпіння через повільний розвиток','waiting for a result and assessing progress','frustration at slow development'],
 'pentacles-eight':['зосереджену роботу або навчання ввечері','монотонність, що не дає задоволення','focused work or evening study','tedious effort without much reward'],
 'pentacles-nine':['приємний особистий час і відчуття самостійності','дорогу покупку чи самотність за красивою картинкою','an independent treat or personal comfort','an expensive indulgence or hidden loneliness'],
 'pentacles-ten':['родинні плани, домашню зустріч або розмову про стабільність','суперечку через гроші, дім чи очікування родини','family plans, a home meeting or discussion of stability','tension around money, home or family expectations'],
 'pentacles-page':['нову практичну новину або перспективу навчання','відкладену справу через невпевненість','a practical message or learning opportunity','a promising task postponed through uncertainty'],
 'pentacles-knight':['повільний, але надійний розвиток плану','затягування справ через надмірну обережність','steady, reliable progress','a situation slowed by excessive caution'],
 'pentacles-queen':['допомогу в побутових справах і комфорт','перевтому через турботу про всіх','practical care and a comfortable setting','exhaustion from taking care of everyone'],
 'pentacles-king':['серйозну розмову про справи, фінанси чи надійність','надмірний контроль ресурсів або вимогливість','a serious talk about work, resources or security','over-control of resources or demands']
};
export function cardScenario(id:string,reversed:boolean,lang:Lang):string{
 const values=(id.startsWith('major-')?MAJOR[id.slice(6)]:MINOR[id]);
 if(!values)throw new Error('Missing tarot scenario for '+id);
 const index=lang==='uk'?(reversed?1:0):(reversed?3:2);
 return values[index];
}
function period(question:string,lang:Lang):string{
 const sameDay=/вечір|сьогодн|вечером|tonight|today|this evening/i.test(question);
 const soon=/завтра|tomorrow|weekend|вихідн/i.test(question);
 return sameDay?(lang==='uk'?'сьогодні ввечері':'tonight'):soon?(lang==='uk'?'найближчим часом':'in the next few days'):(lang==='uk'?'у період, про який ви питаєте':'in the period you asked about');
}
function highStakes(q:string){
 return /вагітн|народжен|дитин|діт|діагноз|рак|смерт|помер|самогуб|хвороб|лікуван|health|medical|pregnan|fertil|suicid|death|illness/i.test(q);
}
/** Honest opening line: says plainly whether the spread is supportive or hard. */
function toneLine(cards:ReadonlyArray<{reversed:boolean}>,info:ReturnType<typeof spreadTone>,lang:Lang):string{
 const uk=lang==='uk',n=cards.length;
 const lead:Record<TarotTone,[string,string]>={
  favourable:['Розклад сприятливий: карти здебільшого на вашому боці.','This is a favourable spread: most cards are on your side.'],
  mostlyGood:['Розклад радше сприятливий, але в ньому є карти, які просять обережності.','The spread is mostly favourable, but some cards ask for caution.'],
  mixed:['Розклад неоднозначний: можливості тут стоять поруч із реальними перешкодами.','The spread is mixed: real opportunities sit next to real obstacles.'],
  challenging:['Скажу чесно: розклад складний. Карти говорять більше про перешкоди, затримки й напругу, ніж про легкий результат.','To be honest, this is a challenging spread. The cards speak more of obstacles, delays and tension than of an easy outcome.'],
  difficult:['Скажу чесно: це важкий розклад. Карти прямо попереджають про проблеми, і прикрашати їх не варто.','To be honest, this is a difficult spread. The cards clearly warn about problems, and it would be wrong to sugar-coat them.']
 };
 let line=lead[info.tone][uk?0:1];
 if(n>1&&info.reversed===n)line+=uk?' Усі '+n+' карти перевернуті — енергія заблокована: щось затримується, іде не так, як хочеться, або ви самі опираєтеся змінам.':' All '+n+' cards are reversed — the energy is blocked: something is delayed, going differently than you hope, or meeting your own resistance.';
 else if(n>1&&info.reversed*2>n)line+=uk?' Більшість карт перевернуті ('+info.reversed+' з '+n+'): багато що зараз блокується або затримується.':' Most cards are reversed ('+info.reversed+' of '+n+'): much is blocked or delayed right now.';
 else if(n===1&&cards[0].reversed)line+=uk?' Карта перевернута: її сила зараз заблокована або проявляється через труднощі.':' The card is reversed: its strength is blocked or comes through difficulty.';
 return line;
}
export function readerReading(raw:ReadonlyArray<Draw>,spread:Spread,question:string|null,lang:Lang):ReaderNarrative{
 const cards=describeDraws(raw,spread);
 if(!cards.length)throw new Error('Reading without cards');
 const q=(question||'').trim();
 const t=period(q,lang);
 const uk=lang==='uk';
 const info=spreadTone(cards);
 const hardTone=info.tone==='challenging'||info.tone==='difficult';
 const lastWeight=cardWeight(cards[cards.length-1]);
 const scenario=(i:number)=>cardScenario(cards[i].id,cards[i].reversed,lang);
 const lastEvent=scenario(cards.length-1);
 const firstEvent=scenario(0);
 const middle=cards.length>2?scenario(1):'';
 const title=(i:number)=>uk?'«'+cards[i].name.uk+'»'+(cards[i].reversed?' (перевернута)':''):cards[i].name.en+(cards[i].reversed?' (reversed)':'');
 const honest=toneLine(cards,info,lang);
 const prefix=q?(uk?'Ваше питання: «'+q+'». ':'Your question: “'+q+'”. '):'';
 const strong=cards.length>1?
 (uk?'сам початок може принести '+firstEvent+', а згодом розклад натякає на '+lastEvent+'.':'you may first notice '+firstEvent+', and then the spread points to '+lastEvent+'.'):
 (uk?'карта звертає увагу на '+lastEvent+'.':'the card points to '+lastEvent+'.');
 const directAnswer=highStakes(q)?
 (uk?prefix+'Цей розклад не може встановити медичний факт, вагітність, тривалість життя чи іншу критичну подію. У символах читається тема '+lastEvent+', але за достовірною інформацією варто звернутися до відповідного джерела.':prefix+'A tarot spread cannot establish a medical fact, pregnancy, life expectancy, or other critical outcome. Its imagery suggests '+lastEvent+', but real-world evidence is needed.'):
 (uk?prefix+honest+' '+(t==='у період, про який ви питаєте'?strong.charAt(0).toUpperCase()+strong.slice(1):t.charAt(0).toUpperCase()+t.slice(1)+' '+strong):
 prefix+honest+' '+(t==='in the period you asked about'?strong.charAt(0).toUpperCase()+strong.slice(1):t.charAt(0).toUpperCase()+t.slice(1)+' '+strong));
 const partsUk=cards.length===1?
 'Тут важлива не кількість подій, а їхній характер: '+firstEvent+'. '+(hardTone?'Не відмахуйтеся від цього сигналу — краще помітити проблему зараз, ніж коли вона виросте.':'Якщо ситуація ще не розгорнулася, зверніть увагу на перший реальний сигнал, який підтвердить або спростує цю версію.'):
 'Початок вказує на '+firstEvent+'. '+(middle?'Далі розклад натякає на '+middle+'. ':'')+'Фінальна карта підкреслює '+lastEvent+'. '+(lastWeight<0?(hardTone?'Якщо нічого не змінювати, ситуація найімовірніше піде саме цим непростим шляхом.':'Попри добрий початок, фінал розкладу тривожний: саме тут варто бути найуважнішими.'):hardTone?'Фінал м’якший за решту розкладу, але дістатися до нього буде непросто.':info.tone==='mixed'?'Куди переважить ситуація, залежить від того, як ви впораєтеся з перешкодами.':'Розвиток виглядає добрим, якщо ви не пропустите момент для дії.');
 const partsEn=cards.length===1?
 'The key is the character of the moment: '+firstEvent+'. '+(hardTone?'Do not brush this signal aside — it is better to notice the problem now than when it grows.':'Look for the first real sign that confirms or contradicts this reading.'):
 'The opening suggests '+firstEvent+'. '+(middle?'The middle stage may bring '+middle+'. ':'')+'The final card emphasizes '+lastEvent+'. '+(lastWeight<0?(hardTone?'If nothing changes, the situation is most likely to follow this difficult path.':'Despite a good start, the ending of the spread is worrying: this is where to be most careful.'):hardTone?'The ending is softer than the rest of the spread, but getting there will not be easy.':info.tone==='mixed'?'Which way it tips depends on how you handle the obstacles.':'The development looks good as long as you do not miss the moment to act.');
 const cardExplanations=cards.map((c,i)=>{
  const position=c.positionName[lang].toLowerCase();
  const w=cardWeight(c);
  const lead=uk?'У позиції «'+position+'» карта '+title(i)+' вказує на '+scenario(i)+'. ':
   'In the “'+position+'” position, '+title(i)+' points to '+scenario(i)+'. ';
  const detail=c.detail[lang];
  const verdict=w<=-2?(uk?'Це прямо тривожний знак.':'This is a clear warning sign.'):w<0?(uk?'Тут є складність, яку не варто применшувати.':'There is a difficulty here that should not be played down.'):w>=2?(uk?'Це сильна підтримка.':'This is strong support.'):w>0?(uk?'Це радше добрий знак.':'This is mostly a good sign.'):(uk?'Карта нейтральна: усе залежить від ваших дій.':'The card is neutral: it depends on your actions.');
  const qualifier=spread==='celtic'?(uk?'Це окремий шар великого розкладу; зіставте його з іншими картами.':'In this larger spread it is one strand, not the whole answer.'):
   (i===0?(uk?'Це вихідна обставина, а не фінал.':'This sets the scene rather than the outcome.'):(uk?'Це можливий поворот, на який варто зважати.':'This is a potential development worth watching.'));
  return lead+detail+' '+verdict+' '+qualifier;
 });
 const difficult=cards.find(c=>c.id==='major-tower'||c.id==='swords-three'||c.id==='swords-ten');
 const sharp=difficult?(uk?' Найгостріша нота — «'+difficult.name.uk+'»: '+(difficult.reversed?'перевернуте положення говорить, що напруга вже накопичилася, а зміни відкладаються — і від цього вони не стануть легшими.':'це переломний момент; важливо зберегти ясність і не робити різких кроків зопалу.'):
  ' The sharpest note is '+difficult.name.en+': '+(difficult.reversed?'reversed, the tension has built up while change is being postponed — and postponing will not make it easier.':'it marks a turning point; keep a clear head and avoid rash moves.')):'';
 const risky=cards.map((c,i)=>({c,i,w:cardWeight(c)})).filter(x=>x.w<0).sort((a,b)=>a.w-b.w);
 const caution=risky.length?
  (uk?'Що може піти не так: '+risky.map(x=>title(x.i)+' натякає на '+scenario(x.i)).join('; ')+'. '+(risky.length>1?'Це не дрібниці, а реальні ризики, про які розклад попереджає.':'Поставтеся до цього попередження серйозно.')+sharp:
   'What could go wrong: '+risky.map(x=>title(x.i)+' points to '+scenario(x.i)).join('; ')+'. '+(risky.length>1?'These are real risks the spread warns about, not small details.':'Take this warning seriously.')+sharp):
  (uk?'Явно тривожних карт у розкладі немає. Та все ж стежте за темою '+title(cards.length-1)+': '+lastEvent+' — саме вона задає тон завершенню.':'There are no clearly worrying cards here. Still, watch the theme of '+title(cards.length-1)+': '+lastEvent+' — it sets the tone of the outcome.');
 const step=hardTone?(uk?' Зараз краще не поспішати з важливими рішеннями: перевірте факти, обговоріть складне відверто й майте запасний план.':' Do not rush important decisions now: check the facts, talk openly about what is hard, and keep a plan B.'):
  info.tone==='mixed'?(uk?' Спирайтеся на сильні карти, але не ігноруйте слабкі місця.':' Lean on the strong cards, but do not ignore the weak spots.'):
  (uk?' Використайте цю підтримку й зробіть конкретний крок, поки момент сприятливий.':' Use this support and take a concrete step while the moment is right.');
 const advice=uk?
  (cards.length===1?'Порада таролога: '+title(0)+' підкреслює тему '+scenario(0)+'. Придивіться, як вона проявляється у вашій ситуації.'+step:
  'Порада таролога: '+title(0)+' відкриває сюжет через '+scenario(0)+', а '+title(cards.length-1)+' натякає на '+scenario(cards.length-1)+'. Саме зв’язок між цими двома образами показує головний рух розкладу.'+step):
  (cards.length===1?'The reader’s advice: '+title(0)+' highlights '+scenario(0)+'. Notice how this theme shows up in your situation.'+step:
  'The reader’s advice: '+title(0)+' opens through '+scenario(0)+', while '+title(cards.length-1)+' points to '+scenario(cards.length-1)+'. The thread between these two images shows the main movement of the spread.'+step);
 return {directAnswer,development:uk?partsUk:partsEn,cardExplanations,caution,advice,tone:info.tone};
}
export const TAROT_SCENARIO_CARD_COUNT=Object.keys(MAJOR).length+Object.keys(MINOR).length;
