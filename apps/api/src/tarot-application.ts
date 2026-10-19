/** Application use cases: orchestration only, no Nest decorators or Prisma. */
import {drawCards,describeDraws,SPREADS,TAROT_DECK,type Spread} from './tarot-deck.ts';
import {readerReading} from './tarot-reader.ts';
import {synthesizeTarot} from './tarot-synthesis.ts';
import {aiLimitFor,isTarotSpread,limitFor,normalizeTarotQuestion,TarotDomainError,utcDayBounds} from './tarot-domain.ts';
import type {DrawnCard,TarotReadingRepository,TarotNarrativeGateway} from './tarot-ports.ts';

export class TarotUseCases{
 private readonly readings:TarotReadingRepository;
 private readonly ai:TarotNarrativeGateway;
 private readonly now:()=>Date;
 constructor(readings:TarotReadingRepository,ai:TarotNarrativeGateway,now:()=>Date=()=>new Date()){
  this.readings=readings;this.ai=ai;this.now=now;
 }
 deck(){
  return {version:'rws-v1',aiAvailable:this.ai.enabled(),total:TAROT_DECK.length,
   spreads:Object.entries(SPREADS).map(([id,positions])=>({id,cards:positions.length}))};
 }
 async history(userId:string){
  const {start}=utcDayBounds(this.now());
  const state=await this.readings.history(userId,start);
  const entries=state.readings.map(row=>{
   const spread=row.spread;
   if(!isTarotSpread(spread))return null;
   try{
    const cards=row.cards as DrawnCard[];
    return {id:row.id,createdAt:row.createdAt,spread,question:row.question,
     cards:describeDraws(cards,spread),
     synthesis:synthesizeTarot(cards,spread,row.question),
     reader:{uk:readerReading(cards,spread,row.question,'uk'),en:readerReading(cards,spread,row.question,'en')},
     aiReading:row.narrative&&row.narrativeLang&&row.narrativeModel?{
      language:row.narrativeLang,model:row.narrativeModel,reading:row.narrative}:null};
   }catch{return null;}
  }).filter(Boolean);
  const limit=limitFor(state.role);
  return {remaining:Math.max(0,limit-state.used),limit,reset:'UTC midnight',
   aiAvailable:this.ai.enabled(),readings:entries};
 }
 async draw(input:{userId:string;spread:Spread;question?:string;language?:'uk'|'en';aiConsent?:boolean}){
  if(!isTarotSpread(input.spread))throw new TarotDomainError('invalid_spread','Unsupported tarot spread');
  const question=normalizeTarotQuestion(input.question);
  const {start,end}=utcDayBounds(this.now());
  const base=await this.readings.reserve({
   userId:input.userId,spread:input.spread,question,start,end,
   drawCards:()=>drawCards(input.spread)
  });
  const reader={
   uk:readerReading(base.drawn,input.spread,question,'uk'),
   en:readerReading(base.drawn,input.spread,question,'en')
  };
  let aiReading:null|{language:'uk'|'en';model:string;reading:typeof reader.uk}=null;
  const language=input.language||'uk';
  if(input.aiConsent===true&&this.ai.enabled()&&this.ai.allowAttempt()){
   const usedAi=await this.readings.successfulAiCount(input.userId,start);
   if(usedAi<aiLimitFor(base.role)){
    try{
     const completion=await this.ai.generate({
      cards:base.drawn,spread:input.spread,question,language,
      onUsage:async event=>{
       try{await this.readings.recordAiUsage(event);}
       catch{console.warn('Tarot AI usage logging failed');}
      }
     });
     await this.readings.saveNarrative(base.row.id,language,completion.model,completion.reading);
     aiReading={language,model:completion.model,reading:completion.reading};
    }catch{
     console.warn('Tarot AI unavailable; local human-style interpretation returned');
    }
   }
  }
  return {...base.row,spread:input.spread,question,cards:describeDraws(base.drawn,input.spread),
   synthesis:synthesizeTarot(base.drawn,input.spread,question),reader,aiReading,
   remaining:base.remaining,limit:base.limit,reset:'UTC midnight'};
 }
}
