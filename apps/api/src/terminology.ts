/** Stable Ukrainian Jyotish names. Small/free models often phoneticize the Latin labels. */
const TERMS:Record<string,string>={
 Aries:'Овен',Taurus:'Телець',Gemini:'Близнюки',Cancer:'Рак',Leo:'Лев',Virgo:'Діва',
 Libra:'Терези',Scorpio:'Скорпіон',Sagittarius:'Стрілець',Capricorn:'Козоріг',
 Aquarius:'Водолій',Pisces:'Риби',
 Sun:'Сонце',Moon:'Місяць',Mars:'Марс',Mercury:'Меркурій',Jupiter:'Юпітер',
 Venus:'Венера',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету',
 Ashwini:'Ашвіні',Bharani:'Бхарані',Krittika:'Кріттіка',Rohini:'Рохіні',
 Mrigashira:'Мрігашіра',Ardra:'Ардра',Punarvasu:'Пунарвасу',Pushya:'Пушʼя',
 Ashlesha:'Ашлеша',Magha:'Магха','Purva Phalguni':'Пурва Пхалгуні',
 'Uttara Phalguni':'Уттара Пхалгуні',Hasta:'Хаста',Chitra:'Чітра',Swati:'Сваті',
 Vishakha:'Вішакха',Anuradha:'Анурадха',Jyeshtha:'Джʼєштха',Mula:'Мула',
 'Purva Ashadha':'Пурва Ашадха','Uttara Ashadha':'Уттара Ашадха',
 Shravana:'Шравана',Dhanishta:'Дханіштха',Shatabhisha:'Шатабхіша',
 'Purva Bhadrapada':'Пурва Бхадрапада','Uttara Bhadrapada':'Уттара Бхадрапада',
 Revati:'Реваті',
 'Піссіс':'Риби','Писіс':'Риби','Пісіс':'Риби',
 'Сагітарий':'Стрілець','Сагітарій':'Стрілець',
 'Ліба':'Терези','Лібра':'Терези','Сватьі':'Сваті'
};
const normalized=Object.fromEntries(Object.entries(TERMS).map(([key,value])=>[key.toLowerCase(),value]));
const keys=Object.keys(TERMS).sort((a,b)=>b.length-a.length);
/** Dictionary words contain only alphabetic characters/spaces; Unicode boundaries prevent partial replacements. */
const pattern=new RegExp('(?<![\\p{L}])(?:'+keys.join('|')+')(?![\\p{L}])','giu');
export function ukTerm(original:string){return TERMS[original]||original;}
export function normalizeUkrainianAstroTerms(text:string){
 return text.replace(pattern,word=>normalized[word.toLowerCase()]||word);
}
