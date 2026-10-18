import {describeDraws,type Spread} from './tarot-deck.ts';
type Lang='uk'|'en';
type Draw={id:string;position:number;reversed:boolean};
export type ReaderNarrative={
 directAnswer:string;
 development:string;
 cardExplanations:string[];
 caution:string;
 advice:string;
};
/** Distinct concrete situation cues for the classic deck; originally written for Galaxiora.
 * Predictive-sounding scenarios are POSSIBILITIES, never knowledge of future events.
 */
const MAJOR:Record<string,[string,string,string,string]>={
 fool:['неочікуваний початок, запрошення або імпровізована зустріч','поспішне рішення чи невпевненість перед новим','a spontaneous invitation, encounter or fresh beginning','a rushed choice or hesitation before a new start'],
 magician:['розмову, в якій твої слова можуть змінити хід справи','обіцянку без чіткого плану або спробу впливу','a conversation where your initiative can shift events','a promise without a plan or an attempt at control'],
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
 return sameDay?(lang==='uk'?'сьогодні ввечері':'tonight'):soon?(lang==='uk'?'найближчим часом':'in the next few days'):(lang==='uk'?'у період, про який ти запитуєш':'in the period you asked about');
}
function highStakes(q:string){
 return /вагітн|народжен|дитин|діт|діагноз|рак|смерт|помер|самогуб|хвороб|лікуван|health|medical|pregnan|fertil|suicid|death|illness/i.test(q);
}
export function readerReading(raw:ReadonlyArray<Draw>,spread:Spread,question:string|null,lang:Lang):ReaderNarrative{
 const cards=describeDraws(raw,spread);
 if(!cards.length)throw new Error('Reading without cards');
 const q=(question||'').trim();
 const first=cards[0],last=cards[cards.length-1],now=cards[Math.min(1,cards.length-1)];
 const t=period(q,lang);
 const uk=lang==='uk';
 const scenario=(i:number)=>cardScenario(cards[i].id,cards[i].reversed,lang);
 const lastEvent=scenario(cards.length-1);
 const firstEvent=scenario(0);
 const middle=cards.length>2?scenario(1):'';
 const title=(i:number)=>cards[i].name[lang]+(cards[i].reversed?(uk?' (перевернута)':' (reversed)'):'');
 const prefix=q?(uk?'На твоє запитання «'+q+'» карти відповідають так: ':'For your question “'+q+'”, the cards suggest this: '):'';
 const strong=cards.length>1?
 (uk?'спочатку може проявитися '+firstEvent+', але далі помітною темою стане '+lastEvent+'.':'you might first notice '+firstEvent+', followed by '+lastEvent+'.'):
 (uk?'найвиразнішою темою виглядає '+lastEvent+'.':'the most prominent theme is '+lastEvent+'.');
 const directAnswer=highStakes(q)?
 (uk?'Цей розклад не може встановити медичний факт, вагітність, тривалість життя чи іншу критичну подію. У символах читається тема '+lastEvent+', але за достовірною інформацією варто звернутися до відповідного джерела.':'A tarot spread cannot establish a medical fact, pregnancy, life expectancy, or other critical outcome. Its imagery suggests '+lastEvent+', but real-world evidence is needed.'):
 (uk?prefix+'Схоже, що '+t+' '+strong.charAt(0).toLowerCase()+strong.slice(1)+' Це не означає неминучої події: карти показують один можливий розвиток, а не встановлений факт.':
 prefix+'The cards lean toward this possibility '+t+': '+strong+' This is an interpretive possibility, not a guaranteed event.');
 const eventNames=cards.map((c,i)=>title(i)+' — '+scenario(i));
 const partsUk=cards.length===1?
 'Тут важлива не кількість подій, а їхній характер: '+firstEvent+'. Якщо ситуація ще не розгорнулася, зверни увагу на перший реальний сигнал, який підтвердить або спростує цю версію.':
 'Початок показує '+firstEvent+'. '+(middle?'У розвитку ситуації може втрутитися '+middle+'. ':'')+'А фінальна карта підкреслює '+lastEvent+'. Якщо плани зміняться, це не обов’язково буде катастрофою — важливо, як ти відреагуєш.';
 const partsEn=cards.length===1?
 'The key is the character of the moment: '+firstEvent+'. Look for real evidence before deciding whether this reading fits.':
 'The opening suggests '+firstEvent+'. '+(middle?'The middle stage may bring '+middle+'. ':'')+'The final card emphasizes '+lastEvent+'. A change of plans need not mean disaster; how you respond matters.';
 const cardExplanations=cards.map((c,i)=>{
  const position=c.positionName[lang].toLowerCase();
  const lead=uk?'У позиції «'+position+'» карта «'+title(i)+'» натякає на '+scenario(i)+'. ':
   'In the “'+position+'” position, '+title(i)+' suggests '+scenario(i)+'. ';
  const detail=c.detail[lang];
  const qualifier=spread==='celtic'?(uk?'Це окремий шар великого розкладу; зістав його з іншими картами.':'In this larger spread it is one strand, not the whole answer.'):
   (i===0?(uk?'Це вихідна обставина, а не фінал.':'This sets the scene rather than the outcome.'):(uk?'Це можливий поворот, на який варто звернути увагу.':'This is a potential development worth watching.'));
  return lead+detail+' '+qualifier;
 });
 const caution=cards.some(c=>c.id==='major-tower'||c.id==='swords-three'||c.id==='swords-ten')?
 (uk?'Пильнуй, щоб несподіванка не перетворилася на конфлікт через різкі слова. Карти не свідчать про буквальну катастрофу.':'Be careful not to turn an unexpected moment into a conflict with sharp words. No card proves a literal catastrophe.'):
 (uk?'Не сприймай припущення про інших людей як факти. Краще запитай напряму, перш ніж реагувати.':'Do not treat assumptions about other people as facts. Ask directly before reacting.');
 const advice=uk?'Моя порада: залиш собі простір для зміни планів. Якщо з’явиться '+lastEvent+', спершу з’ясуй подробиці, а тоді вирішуй, як діяти.':
 'My advice: leave room for plans to change. If you encounter '+lastEvent+', get the details before choosing your response.';
 return {directAnswer,development:uk?partsUk:partsEn,cardExplanations,caution,advice};
}
export const TAROT_SCENARIO_CARD_COUNT=Object.keys(MAJOR).length+Object.keys(MINOR).length;
