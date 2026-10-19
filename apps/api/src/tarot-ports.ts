/** Application-owned ports; adapters implement these without leaking HTTP/Prisma. */
import type {Spread} from './tarot-deck.ts';
import type {ReaderNarrative} from './tarot-reader.ts';

export type DrawnCard={id:string;position:number;reversed:boolean};
export type TarotAiUsageEvent={
 provider:'openai'|'openrouter'|'ollama';model:string;
 outcome:'returned'|'provider_error'|'request_error';
 promptTokens?:number;completionTokens?:number;totalTokens?:number;costUsd?:number;
};
export type StoredTarotReading={
 id:string;createdAt:Date;spread:string;question:string|null;cards:unknown;
 narrative:unknown;narrativeLang:string|null;narrativeModel:string|null;
};
export type ReservedTarotReading={
 row:{id:string;createdAt:Date};drawn:DrawnCard[];
 limit:number;remaining:number;role:string;
};
export interface TarotReadingRepository{
 reserve(input:{userId:string;spread:Spread;question:string|null;start:Date;end:Date;
  drawCards:()=>DrawnCard[]}):Promise<ReservedTarotReading>;
 history(userId:string,start:Date):Promise<{role:string|null;used:number;readings:StoredTarotReading[]}>;
 successfulAiCount(userId:string,start:Date):Promise<number>;
 saveNarrative(id:string,language:'uk'|'en',model:string,reading:ReaderNarrative):Promise<void>;
 recordAiUsage(event:TarotAiUsageEvent):Promise<void>;
}
export interface TarotNarrativeGateway{
 enabled():boolean;
 allowAttempt():boolean;
 generate(input:{cards:ReadonlyArray<DrawnCard>;spread:Spread;question:string|null;
  language:'uk'|'en';onUsage:(event:TarotAiUsageEvent)=>Promise<void>}):
  Promise<{reading:ReaderNarrative;model:string}>;
}
