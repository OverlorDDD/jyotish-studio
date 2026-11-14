/** Original GalaxiNews rubric artwork (tools/news-art/rubric_art.py).
 * Monthly: one scene per calendar month, reused every year.
 * Weekly: one sky chart per ISO week number (the Sun's path through its
 * sidereal sign in that week), reused every year. */
type L={uk:string;en:string};
export type RubricArt={src:string;small:string;jpg:string;alt:L;caption:L};

const MONTH:L[]=[
 {uk:'Макара-санкранті: повітряні змії над зимовим обрієм і сузір’я Козорога',en:'Makara Sankranti: kites over a winter horizon and Capricornus'},
 {uk:'Махашіваратрі: молодий місяць, тризуб Шиви й сузір’я Водолія',en:'Maha Shivaratri: a young Moon, Shiva’s trident and Aquarius'},
 {uk:'Холі: хмари кольорових фарб у сутінках і сузір’я Риб',en:'Holi: clouds of colour at dusk and Pisces'},
 {uk:'Меша-санкранті: весняний світанок і сузір’я Овна',en:'Mesha Sankranti: a spring dawn and Aries'},
 {uk:'Вайшакха-пурніма: повня над лотосовим ставком, Плеяди й Телець',en:'Vaishakha Purnima: a full Moon over a lotus pond, the Pleiades and Taurus'},
 {uk:'Міжнародний день йоги й літнє сонцестояння: світанкова практика і сузір’я Близнюків',en:'International Yoga Day and the solstice: a dawn practice and Gemini'},
 {uk:'Гуру-пурніма в сезон мусонів: повня крізь хмари і сузір’я Рака',en:'Guru Purnima in the monsoon: a full Moon through clouds and Cancer'},
 {uk:'Персеїди над нічними полями і сузір’я Лева',en:'The Perseids over night fields and Leo'},
 {uk:'Осіннє рівнодення: рівновага дня й ночі, жнива і сузір’я Діви',en:'The autumn equinox: day and night in balance, harvest and Virgo'},
 {uk:'Наваратрі: дев’ять світильників і сузір’я Терезів',en:'Navaratri: nine lamps and Libra'},
 {uk:'Картіка й Дівалі: світильники на воді і Скорпіон з червоним Антаресом',en:'Kartika and Diwali: lamps on the water and Scorpius with red Antares'},
 {uk:'Зимове сонцестояння: Гемініди над засніженим лісом і сузір’я Стрільця',en:'The winter solstice: Geminids over a snowy forest and Sagittarius'}
];
/** Sidereal sign the Sun occupies in ISO week 1…53 (generated with the art). */
const WEEK_SIGN=['sagittarius','sagittarius','capricorn','capricorn','capricorn','capricorn','capricorn','aquarius','aquarius','aquarius','aquarius','pisces','pisces','pisces','pisces','aries','aries','aries','aries','aries','taurus','taurus','taurus','taurus','gemini','gemini','gemini','gemini','cancer','cancer','cancer','cancer','cancer','leo','leo','leo','leo','virgo','virgo','virgo','virgo','virgo','libra','libra','libra','libra','scorpio','scorpio','scorpio','scorpio','sagittarius','sagittarius','sagittarius'];
const SIGN_GEN:Record<string,L>={aries:{uk:'Овна',en:'Aries'},taurus:{uk:'Тельця',en:'Taurus'},gemini:{uk:'Близнюків',en:'Gemini'},cancer:{uk:'Рака',en:'Cancer'},
 leo:{uk:'Лева',en:'Leo'},virgo:{uk:'Діви',en:'Virgo'},libra:{uk:'Терезів',en:'Libra'},scorpio:{uk:'Скорпіона',en:'Scorpio'},
 sagittarius:{uk:'Стрільця',en:'Sagittarius'},capricorn:{uk:'Козорога',en:'Capricorn'},aquarius:{uk:'Водолія',en:'Aquarius'},pisces:{uk:'Риб',en:'Pisces'}};

/** ISO week number of a Monday date (YYYY-MM-DD). */
export function isoWeek(monday:string){
 const d=new Date(monday+'T00:00:00Z');
 const thursday=new Date(d.getTime()+3*86400000);
 const yearStart=Date.UTC(thursday.getUTCFullYear(),0,1);
 return Math.floor((thursday.getTime()-yearStart)/86400000/7)+1;
}
const BASE='/news/rubrics/';
export function rubricArt(kind:'week'|'month',key:string):RubricArt|null{
 if(kind==='month'){
  const m=Number(key.slice(5,7));
  if(!(m>=1&&m<=12))return null;
  const n=String(m).padStart(2,'0'),c=MONTH[m-1];
  return {src:BASE+'month-'+n+'.webp',small:BASE+'month-'+n+'-sm.webp',jpg:BASE+'month-'+n+'.jpg',
   alt:{uk:'Ілюстрація: '+c.uk,en:'Illustration: '+c.en},caption:{uk:c.uk+'. Ілюстрація Galaxiora.',en:c.en+'. Galaxiora illustration.'}};
 }
 if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return null;
 const w=isoWeek(key);
 if(!(w>=1&&w<=53))return null;
 const n=String(w).padStart(2,'0'),sign=SIGN_GEN[WEEK_SIGN[w-1]];
 return {src:BASE+'week-'+n+'.webp',small:BASE+'week-'+n+'-sm.webp',jpg:BASE+'week-'+n+'.jpg',
  alt:{uk:'Ілюстрація: Сонце на своєму шляху крізь знак '+sign.uk,en:'Illustration: the Sun on its path through '+sign.en},
  caption:{uk:'Сонце на своєму шляху крізь знак '+sign.uk+'. Ілюстрація Galaxiora.',en:'The Sun on its path through '+sign.en+'. Galaxiora illustration.'}};
}
