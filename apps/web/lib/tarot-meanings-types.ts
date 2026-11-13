export type YesNo='yes'|'no'|'maybe';
export type MeaningText={k:readonly string[];u:string;r:string;l:string;w:string;a:string};
export type CardMeaningInput={id:string;num:string;y:YesNo;uk:MeaningText;en:MeaningText};
