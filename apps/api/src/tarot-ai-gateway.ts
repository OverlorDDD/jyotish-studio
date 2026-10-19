/** External AI adapter. Does not choose the cards or own persistence. */
import {createHourlyLimiter} from './ai.ts';
import {createHumanAiTarot,tarotAiConfig} from './tarot-ai.ts';
import type {TarotNarrativeGateway} from './tarot-ports.ts';

export function createTarotAiGateway():TarotNarrativeGateway{
 // One instance per NestJS app. Existing process-local 12/hour behavior retained.
 const allowTarotAi=createHourlyLimiter(12);
 return {
  enabled:()=>tarotAiConfig().enabled,
  allowAttempt:()=>allowTarotAi(),
  generate:input=>createHumanAiTarot(input.cards,input.spread,input.question,input.language,{
   onUsage:input.onUsage
  })
 };
}
