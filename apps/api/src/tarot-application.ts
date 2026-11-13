/** Application use cases: orchestration only, no Nest decorators or Prisma. */
import {drawCards,describeDraws,SPREADS,TAROT_DECK,type Spread} from './tarot-deck.ts';
import {readerReading} from './tarot-reader.ts';
import {synthesizeTarot} from './tarot-synthesis.ts';
import {aiLimitFor,isTarotSpread,limitFor,normalizeTarotQuestion,TarotDomainError,utcDayBounds} from './tarot-domain.ts';
import type {DailyTarotCard,DrawnCard,TarotReadingRepository,TarotNarrativeGateway} from './tarot-ports.ts';

const DAY=/^\d{4}-\d{2}-\d{2}$/;
const DECK_IDS=new Set(TAROT_DECK.map(c=>c.id));

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
 /** Guest reading: same cards, reader and synthesis as members; never stored, no AI. */
 guestDraw(input:{spread:Spread;question?:string}){
  if(!isTarotSpread(input.spread))throw new TarotDomainError('invalid_spread','Unsupported tarot spread');
  const question=normalizeTarotQuestion(input.question);
  const drawn=drawCards(input.spread);
  return {id:null,createdAt:this.now().toISOString(),spread:input.spread,question,guest:true,
   cards:describeDraws(drawn,input.spread),synthesis:synthesizeTarot(drawn,input.spread,question),
   reader:{uk:readerReading(drawn,input.spread,question,'uk'),en:readerReading(drawn,input.spread,question,'en')},
   aiReading:null};
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
 /** Signed-in Tarot journey: every day with a card of the day, those cards, and how often
 * each of the 78 cards appeared in the person's own spreads. Private to the owner. */
 async journey(userId:string){
  const state=await this.readings.journey(userId);
  const seen:Record<string,number>={};
  const add=(id:string)=>{if(DECK_IDS.has(id))seen[id]=(seen[id]??0)+1;};
  for(const d of state.daily)add(d.id);
  for(const cards of state.spreads)for(const c of cards)if(c&&typeof c.id==='string')add(c.id);
  const byDate=new Map<string,DailyTarotCard>();
  for(const d of state.daily)if(!byDate.has(d.date))byDate.set(d.date,d);
  const daily=[...byDate.values()].sort((a,b)=>a.date<b.date?1:-1).slice(0,120);
  return {days:daily.map(d=>d.date).reverse(),daily,seen};
 }
 async saveDaily(userId:string,card:DailyTarotCard){
  if(!DAY.test(card.date))throw new TarotDomainError('invalid_spread','Invalid date');
  const noon=Date.parse(card.date+'T12:00:00Z');
  // A local calendar day is at most ~14h away from UTC; allow a little clock drift.
  if(!Number.isFinite(noon)||Math.abs(noon-this.now().getTime())>40*3600000)throw new TarotDomainError('invalid_spread','Card of the day must be for today');
  if(!DECK_IDS.has(card.id))throw new TarotDomainError('invalid_spread','Unknown card');
  const stored=await this.readings.saveDaily(userId,{date:card.date,id:card.id,reversed:card.reversed===true});
  return {stored,...await this.journey(userId)};
 }
}
