import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';
import {classicalLordshipTable,checkNarrativeLordClaims} from './reader-classical.ts';

export type ConsultationReview={
 codes:string[];words:number;d9Mentioned:boolean;d10Mentioned:boolean;
};

/** Nonblocking evaluation: transparent diagnostics instead of the retired eight-chapter rejection gate.
 * A passing check is NEVER proof that all traditional interpretations are true.
 * Never log the customer's text or birth details.
 */
export function reviewGeneratedConsultation(
 text:string,chart:CalculatedChart,lang:'uk'|'en',asOf:string
):ConsultationReview{
 const codes:string[]=[];
 const normalized=text.trim();
 const uk=lang==='uk';
 const words=normalized.split(/\s+/u).filter(Boolean).length;
 if(words<450)codes.push('short_consultation');
 const d9Mentioned=/(?:\bD\s*9\b|\bД\s*9\b|навамш|navamsh)/iu.test(normalized);
 const d10Mentioned=/(?:\bD\s*10\b|\bД\s*10\b|дашамш|dashamsh)/iu.test(normalized);
 if(!d9Mentioned)codes.push('missing_d9_analysis');
 if(!d10Mentioned)codes.push('missing_d10_analysis');
 const major=chart.dasha.find(x=>Date.parse(x.start)<=Date.parse(asOf+'T12:00:00Z')&&Date.parse(asOf+'T12:00:00Z')<Date.parse(x.end));
 const minor=major?.antardashas?.find(x=>Date.parse(x.start)<=Date.parse(asOf+'T12:00:00Z')&&Date.parse(asOf+'T12:00:00Z')<Date.parse(x.end));
 const localized:Record<string,string>={Sun:'Сонц',Moon:'Місяц|Міся',Mars:'Марс',Mercury:'Меркур',Jupiter:'Юпітер|Юпітер',Venus:'Венер',Saturn:'Сатурн',Rahu:'Раху',Ketu:'Кету'};
 const mentions=(name:string)=>new RegExp(uk?'(?:'+(localized[name]||name)+')':name,'iu').test(normalized);
 if(major&&!mentions(major.lord))codes.push('missing_major_period_lord');
 if(minor&&!mentions(minor.lord))codes.push('missing_minor_period_lord');
 const lords=checkNarrativeLordClaims(normalized,classicalLordshipTable(chart.ascendant.sign));
 if(!lords.ok)codes.push('potential_house_lord_mismatch');
 if(/(?:це\s+не\s+час\s+для\s+(?:нових\s+)?(?:великих\s+)?інвестиц|не\s+інвестуйте|do\s+not\s+invest|avoid\s+all\s+investments|guaranteed\s+returns)/iu.test(normalized))
  codes.push('unsupported_financial_directive');
 if(/(?:ваша\s+місяць|десята\s+хапа|єдиний\s+мірило)/iu.test(normalized))
  codes.push('uk_language_defects');
 if(!/^#{1,3}\s+\S/mu.test(normalized))codes.push('missing_section_headings');
 return {codes:[...new Set(codes)],words,d9Mentioned,d10Mentioned};
}
/** Safe micro-corrections only: these exact Ukrainian strings are unambiguous typos.
 * Never rewrite a planet, sign, yoga, house, dasha or substantive recommendation.
 */
export function polishConsultationText(text:string,lang:'uk'|'en'):string{
 if(lang!=='uk')return text.trim();
 return text.trim()
  .replace(/\b[Вв]аша Місяць\b/gu,m=>m[0]==='В'?'Ваш Місяць':'ваш Місяць')
  .replace(/\bдесята хапа\b/giu,'десятий дім')
  .replace(/\bєдиний мірило\b/giu,'єдине мірило');
}
