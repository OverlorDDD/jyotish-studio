/**
 * Only contracts consumed by the Natal/Reader web UI determine compatibility.
 * `pipeline` is the OPTIONAL external-LLM writer implementation version.
 * Changing it from direct-v2 to direct-v3 must never disable local reading
 * or the AI CTA when the actual reader, data and integrity contracts match.
 */
export type JyotishRuntimeContract={
 readerVersion?:unknown;pipeline?:unknown;readerEdition?:unknown;
 editorialEdition?:unknown;interpretationEdition?:unknown;
 presentationEdition?:unknown;verificationContract?:unknown
};
export function isJyotishRuntimeCompatible(value:unknown):boolean{
 if(!value||typeof value!=='object')return false;
 const data=value as JyotishRuntimeContract;
 return data.readerVersion==='6.0.0'&&
  data.readerEdition==='reader-v8.0.0-n44'&&
  data.editorialEdition==='n48-poetic-evidence-1.0.0'&&
  data.interpretationEdition==='n49-unified-evidence-v1'&&
  data.presentationEdition==='n493-ranked-patterns-1.0.0'&&
  data.verificationContract==='jyotish-integrity-v3';
}
