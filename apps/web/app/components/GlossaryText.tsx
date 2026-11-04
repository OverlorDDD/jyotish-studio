import {glossaryParts,type GlossaryLocale} from '../../lib/glossary';
/** The same safe plain-text renderer powers current and future content. Hover, focus or tap a term. */
export default function GlossaryText({text,locale}:{text:string;locale:GlossaryLocale}){
 return <>{glossaryParts(text).map((part,i)=>part.entry?
  <abbr key={i} className="as-glossary-term" title={part.entry[locale]}
   data-definition={part.entry[locale]} tabIndex={0}
   aria-label={part.text} aria-description={part.entry[locale]}>{part.text}</abbr>:
  <span key={i}>{part.text}</span>)}</>;
}
