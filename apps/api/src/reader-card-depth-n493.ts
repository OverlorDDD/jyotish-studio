/**
 * Topic-specific SECOND factor gate. This is a refinement of existing N492
 * cards, not a second 16-paragraph report. Emit a note only if a relevant
 * independent karaka has notable sign dignity or aligns within a varga house
 * with the actually relevant house lord. Never infer events, child count,
 * longevity or real family history from these symbolic positions.
 */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {dignityFor} from '../../../packages/jyotish-core/src/rules.ts';
import {verifiedVargaSource} from './reader-varga-n4.ts';
type Lang='uk'|'en';
const RELATION:Readonly<Record<number,readonly string[]>>={
 3:['Mars'],4:['Moon'],7:['Jupiter'],9:['Venus'],10:['Sun','Mercury'],
 12:['Sun','Moon'],16:['Venus','Moon'],20:['Jupiter','Moon'],
 24:['Mercury','Jupiter'],27:['Mars','Saturn'],30:['Saturn','Mars'],
 40:['Moon'],45:['Sun']
};
const THEMES:Readonly<Record<number,[string,string]>>={
 3:['ініціатива та навички','initiative and follow-through'],
 4:['емоційна опора','emotional need for stability'],
 7:['наставництво та передавання досвіду','mentoring and passing on knowledge'],
 9:['взаємність у партнерстві','reciprocity in partnership'],
 10:['професійна репутація','visibility and professional conduct'],
 12:['батьківські приклади','symbolic parental themes'],
 16:['побутовий комфорт','everyday comfort'],
 20:['послідовність практики','sustained inner practice'],
 24:['спосіб навчання','learning methods and comprehension'],
 27:['витривалість і навантаження','the balance between effort and endurance'],
 30:['реакція на труднощі','responses to setbacks and restoring structure'],
 40:['материнська лінія та родинна опора','maternal examples and family roots'],
 45:['батьківська лінія та принципи','values associated with paternal lineage']
};
const NAMES_UK:Readonly<Record<string,string>>={Sun:'Сонце',Moon:'Місяць',Mars:'Марс',
 Mercury:'Меркурій',Jupiter:'Юпітер',Venus:'Венера',Saturn:'Сатурн'};
const SIGNS_UK=['Овен','Телець','Близнюки','Рак','Лев','Діва','Терези','Скорпіон','Стрілець','Козоріг','Водолій','Риби'];
const SIGNS_EN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
export type TopicDepth={note:string;proof:readonly string[];comparisonPlanet:string}|null;
export function n493TopicDepth(chart:CalculatedChart,lang:Lang,division:number,lord:string):TopicDepth{
 const source=verifiedVargaSource(chart);if(!source)return null;
 const relevant=source.charts.find(c=>c.division===division);if(!relevant)return null;
 const main=relevant.planets.find(x=>x.name===lord);if(!main)return null;
 const choices=(RELATION[division]||[]).filter(p=>p!==lord);
 const candidates=choices.map(name=>({name,place:relevant.planets.find(x=>x.name===name)!}))
  .filter(x=>x.place&&Number.isInteger(x.place.house)&&x.place.sign>=1&&x.place.sign<=12)
  .map(x=>({...x,dignity:dignityFor(x.name,x.place.sign),
    together:x.place.house===main.house}));
 // A second factor must actually change the interpretation. Do not add plain
 // irrelevant "Planet X is in house Y" filler with no sign/house relationship.
 const secondary=candidates.find(x=>x.dignity==='exalted'||x.dignity==='debilitated'||x.dignity==='own')||
  candidates.find(x=>x.together);
 if(!secondary)return null;
 const uk=lang==='uk',zodiac=uk?SIGNS_UK:SIGNS_EN;
 const quality=secondary.dignity==='exalted'?
  (uk?'у знаку екзальтації':'in an exaltation sign'):
  secondary.dignity==='own'?(uk?'у власному знаку':'in its own sign'):
  secondary.dignity==='debilitated'?(uk?'у знаку традиційного падіння':'in a traditional debilitation sign'):
  (uk?'в одному домі варги з управителем теми':'in the same divisional house as the topical ruler');
 const note=uk?
  'Для теми «'+THEMES[division][0]+'» ще один показник — '+NAMES_UK[secondary.name]+
  '. У D'+division+' він перебуває у знаку «'+zodiac[secondary.place.sign-1]+'» ('+quality+'). '+
  (secondary.together?
   'Він і тематичний управитель перебувають в одному домі цієї варги; це спільна сфера, а не доказ точного з’єднання.':
   'Це уточнення тематичної карти; загальна оцінка залежить і від D1.'):
  'A distinct indicator for '+THEMES[division][1]+' is '+secondary.name+
  ' in D'+division+' '+zodiac[secondary.place.sign-1]+', '+quality+'. '+
  (secondary.together?
   'Both factors occupy the same divisional house, a shared arena rather than proof of an exact conjunction.':
   'This is a separate factor to compare with D1, not another automatic vote for success.');
 return {note,comparisonPlanet:secondary.name,proof:[
  'D'+division+'.'+lord+'.house='+main.house,
  'D'+division+'.'+secondary.name+'.sign='+secondary.place.sign,
  'D'+division+'.'+secondary.name+'.house='+secondary.place.house
 ]};
}
