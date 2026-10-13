import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
export type PracticalTip={id:string;title:string;meaning:string;example:string;action:string;evidence:string[]};
const houseThemes=[
 ['особисті цілі','personal goals','Запишіть одну невелику мету на тиждень і зробіть перший крок сьогодні.','Write a small goal for the week and take its first step today.'],
 ['ресурси й цінності','resources and values','Запишіть три пріоритети та порівняйте з ними свої витрати часу й грошей.','List three priorities and compare your time and spending with them.'],
 ['спілкування й навички','communication and skills','Поясніть важливу думку співрозмовнику в трьох простих реченнях.','Explain an important idea to someone in three clear sentences.'],
 ['дім і відпочинок','home and rest','Створіть короткий вечірній ритуал відпочинку без телефону.','Create a short evening wind-down routine without your phone.'],
 ['творчість і навчання','creativity and learning','Виділіть двадцять хвилин двічі на тиждень для нового заняття.','Set aside twenty minutes twice a week for a new activity.'],
 ['щоденні справи','daily routines','Оберіть повторювану справу та спростіть її невеликим чеклістом.','Simplify one repeated task with a small checklist.'],
 ['стосунки й домовленості','relationships and agreements','Обговоріть із близькою людиною одне очікування, не припускаючи, що вона його вже знає.','Discuss one expectation openly instead of assuming the other person knows it.'],
 ['довіра й спільні ресурси','trust and shared resources','У спільній справі уточніть із партнерами, хто за що відповідає.','Clarify who is responsible for what in a shared commitment.'],
 ['освіта й світогляд','learning and perspective','Прочитайте іншу точку зору й запишіть одну ідею, яка здалася корисною.','Explore a different point of view and write down one useful insight.'],
 ['кар’єра й професійні цілі','work and professional goals','Оберіть один вимірюваний результат на наступні сім днів та відстежте прогрес.','Pick one measurable outcome for the next seven days and track your progress.'],
 ['друзі й спільнота','friends and community','Зверніться до людини зі спільними інтересами по конкретний зворотний зв’язок.','Ask someone with similar interests for specific feedback.'],
 ['відновлення та внутрішній простір','recovery and quiet time','Заплануйте коротку щоденну перерву без сповіщень та оцініть, як почуваєтесь після неї.','Schedule a daily notification-free break and notice how you feel afterwards.']
] as const;
const SIGN_TONES=[
 ['починати нове й діяти сміливо','taking initiative'],
 ['будувати стабільність і берегти ресурси','building stability'],
 ['спілкуватися й відкривати нові ідеї','communicating and exploring ideas'],
 ['дбати про близьких і відчуття дому','caring for loved ones'],
 ['проявляти творчість та ініціативу','creative self-expression'],
 ['помічати деталі й покращувати звички','attention to detail'],
 ['шукати баланс і домовленості','balancing expectations'],
 ['заглиблюватися та переосмислювати','deep reflection and change'],
 ['навчатися й шукати ширшу перспективу','learning and broader perspective'],
 ['планувати й послідовно працювати','planning and steady effort'],
 ['експериментувати та працювати в спільноті','experimenting with others'],
 ['співпереживати й розвивати уяву','empathy and imagination']
] as const;
const planetThemes:Record<string,[string,string]>={
 Sun:['самовираження й особиста відповідальність','self-expression and responsibility'],
 Moon:['звички та внутрішній комфорт','habits and inner comfort'],
 Mars:['ініціатива й наполегливість','initiative and persistence'],
 Mercury:['спілкування й навчання','communication and learning'],
 Jupiter:['цінності й пізнання','values and learning'],
 Venus:['взаємність і гармонія','connection and harmony'],
 Saturn:['межі й довготривалі зусилля','boundaries and sustained effort'],
 Rahu:['новизна й цікавість','novelty and curiosity'],
 Ketu:['переосмислення й спрощення','reflection and simplification']
};
export function practicalGuidance(chart:CalculatedChart,lang:'uk'|'en'):PracticalTip[]{
 const uk=lang==='uk';
 const sun=chart.d1.find(p=>p.name==='Sun'),moon=chart.d1.find(p=>p.name==='Moon');
 if(!sun||!moon)throw new Error('Incomplete chart for guidance');
 const eligible=[sun,moon,...chart.d1.filter(p=>!['Sun','Moon'].includes(p.name)&&[2,4,5,6,7,10].includes(p.house))];
 const selected=eligible.filter((p,i)=>eligible.findIndex(v=>v.house===p.house)===i).slice(0,5);
 return selected.map(p=>{
  const theme=houseThemes[p.house-1],planet=planetThemes[p.name],signTone=SIGN_TONES[p.sign-1];
  return {
   id:'advice:'+p.name.toLowerCase()+':house-'+p.house,
   title:uk?theme[0][0].toUpperCase()+theme[0].slice(1):theme[1][0].toUpperCase()+theme[1].slice(1),
   meaning:uk?'За розрахованим положенням у традиції Джйотіш сфера «'+theme[0]+'» пов’язана з темою «'+planet[0]+'». Знак також додає символічний акцент на тому, щоб '+signTone[0]+'. Це нагода поміркувати, а не визначена риса чи прогноз.':
    'In the calculated chart, the tradition associates '+theme[1]+' with '+planet[1]+', with an additional symbolic theme of '+signTone[1]+'. This is a reflection prompt, not a claim about personality or the future.',
   example:uk?'Наприклад, це можна розглянути через власні рішення та звички у сфері «'+theme[0]+'».':'For example, reflect on your choices and habits around '+theme[1]+'.',
   action:uk?theme[2]:theme[3],
   evidence:['D1.'+p.name+'.house='+p.house,'D1.'+p.name+'.sign='+p.sign]
  };
 });
}
