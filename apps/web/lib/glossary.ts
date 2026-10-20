/** Shared terms for current and future bilingual content. No remote lookups or HTML. */
export type GlossaryLocale='uk'|'en';
export type GlossaryEntry={id:string;uk:string;en:string;forms:string[]};
export const GLOSSARY:GlossaryEntry[]=[
 {id:'lagna',uk:'Лагна — висхідний знак у момент народження; у Джйотіш задає перший дім та будову всієї карти.',en:'Lagna is the rising sign at birth, setting the first house and chart framework.',forms:['лагна','лагни','лагною','лагну','lagna','ascendant','асцендент','асцендента']},
 {id:'navamsa',uk:'Навамша (D9) — дробова карта для глибшого традиційного трактування стосунків, дгарми й зрілості планет.',en:'Navamsha (D9) is a divisional chart used to deepen readings of relationships, dharma and planetary maturity.',forms:['навамша','навамші','навамшу','navamsa','navamsha','d9']},
 {id:'dashamsa',uk:'Дашамша (D10) — дробова карта, що доповнює основну D1 у питаннях професії й суспільної ролі.',en:'Dashamsha (D10) is a divisional chart supplementing D1 in readings of vocation and public roles.',forms:['дашамша','дашамші','дашамшу','dashamsha','dasamsa','d10']},
 {id:'rashi',uk:'Раші (D1) — основна натальна карта Джйотіш, що містить дванадцять знаків і домів.',en:'Rashi (D1) is the main natal Jyotish chart of twelve signs and houses.',forms:['раші','rashi','d1']},
 {id:'nakshatra',uk:'Накшатра — один із 27 місячних зоряних секторів. Накшатра Місяця використовується для відліку даш.',en:'Nakshatra is one of 27 lunar sectors; the Moon’s nakshatra is used to derive dasha periods.',forms:['накшатра','накшатри','накшатру','nakshatra','nakshatras']},
 {id:'dasha',uk:'Даша — традиційний планетний період, який визначає часовий акцент трактування.',en:'Dasha is a traditional planetary period used to time interpretive emphases.',forms:['даша','даші','дашу','dasha']},
 {id:'mahadasha',uk:'Махадаша — великий планетний період системи Вімшоттарі; включає коротші антардаші.',en:'Mahadasha is a major Vimshottari planetary period containing shorter antardashas.',forms:['махадаша','махадаші','махадашу','mahadasha']},
 {id:'antardasha',uk:'Антардаша — підперіод усередині великого планетного періоду (махадаші).',en:'Antardasha is a subperiod within a major mahadasha.',forms:['антардаша','антардаші','антардашу','antardasha']},
 {id:'vimshottari',uk:'Вімшоттарі — система планетних періодів загальною тривалістю 120 років, що відраховується від накшатри Місяця.',en:'Vimshottari is a 120-year sequence of planetary periods calculated from the Moon’s nakshatra.',forms:['вімшоттарі','вимшоттарі','vimshottari']},
 {id:'graha',uk:'Граха — планетний чинник карти Джйотіш: Сонце, Місяць, п’ять класичних планет, Раху або Кету.',en:'Graha is a Jyotish planetary factor: luminaries, five classical planets or lunar nodes.',forms:['граха','грахи','грах','грахою','graha','grahas']},
 {id:'drishti',uk:'Дрішті — астрологічний аспект, тобто традиційний зв’язок планети з домами або іншими планетами.',en:'Drishti is a Jyotish aspect connecting a planet with particular houses or other planets.',forms:['дрішті','дришті','drishti']},
 {id:'house-ruler',uk:'Управитель дому — планета, яка в цій традиції керує знаком дому. Її положення зв’язує теми різних домів.',en:'A house ruler is the planet traditionally governing a sign, linking different life areas.',forms:['управитель дому','управителя дому','управителі домів','управителями домів','house ruler','house lords']},
 {id:'ayanamsha',uk:'Айанамша — кутове зміщення між тропічним і сидеричним зодіаками.',en:'Ayanamsha is the angular offset between tropical and sidereal zodiacs.',forms:['айанамша','айанамші','ayanamsha','ayanamsa']},
 {id:'lahiri',uk:'Лахірі — стандарт айанамші, використаний для сидеричного розрахунку в Galaxiora.',en:'Lahiri is the ayanamsha standard used for Galaxiora sidereal calculations.',forms:['лахірі','lahiri']},
 {id:'rahu',uk:'Раху — північний місячний вузол; у Джйотіш його пов’язують із бажанням і новими досвідами.',en:'Rahu is the north lunar node, traditionally associated with desire and novelty.',forms:['раху','rahu']},
 {id:'ketu',uk:'Кету — південний місячний вузол; у Джйотіш його пов’язують із відстороненням і пошуком сенсу.',en:'Ketu is the south lunar node, associated with detachment and inquiry.',forms:['кету','ketu']},
 {id:'arcana',uk:'Аркан — карта Таро з особливим символічним значенням.',en:'An arcana is a Tarot card with a symbolic meaning.',forms:['аркан','аркани','арканів','arcana','arcanum']},
 {id:'celtic',uk:'Кельтський хрест — класичний розклад Таро з десяти позицій, кожна з яких має власне значення.',en:'Celtic Cross is a ten-position Tarot spread with a meaning for each position.',forms:['кельтський хрест','celtic cross']},
 {id:'pranayama',uk:'Пранаяма — йогічна практика регуляції дихання. Не всі інтенсивні техніки підходять кожному.',en:'Pranayama is yogic breath regulation; intensive exercises may not suit everyone.',forms:['пранаяма','пранаями','pranayama']},
 {id:'asana',uk:'Асана — положення тіла в йозі.',en:'Asana is a yoga posture.',forms:['асана','асани','asana','asanas']},
 {id:'dharma',uk:'Дгарма — в індійських традиціях поняття обов’язку, етичного шляху та належної дії.',en:'Dharma refers to duty, ethical order and proper conduct in Indian traditions.',forms:['дгарма','дгарми','дгарму','dharma']}
];
const forms=GLOSSARY.flatMap(entry=>entry.forms.map(form=>({form,entry}))).sort((a,b)=>b.form.length-a.form.length);
const pattern=new RegExp('(?<![\\p{L}\\p{N}])('+forms.map(x=>x.form).join('|')+')(?![\\p{L}\\p{N}])','giu');
const byForm=new Map(forms.map(item=>[item.form.toLowerCase(),item.entry]));
export function glossaryParts(text:string):{text:string;entry?:GlossaryEntry}[]{
 const parts:{text:string;entry?:GlossaryEntry}[]=[];
 let cursor=0;
 for(const match of text.matchAll(pattern)){
  const offset=match.index||0;
  if(offset>cursor)parts.push({text:text.slice(cursor,offset)});
  parts.push({text:match[0],entry:byForm.get(match[0].toLowerCase())});
  cursor=offset+match[0].length;
 }
 if(cursor<text.length||!parts.length)parts.push({text:text.slice(cursor)});
 return parts;
}
