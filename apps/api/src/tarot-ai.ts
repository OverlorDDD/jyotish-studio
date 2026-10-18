import {createHourlyLimiter,type AiUsageEvent} from './ai.ts';
import {describeDraws,type Spread} from './tarot-deck.ts';

const canRequest=createHourlyLimiter(12);
type Raw={id:string;position:number;reversed:boolean};
export type TarotAiResult={text:string;provider:string;model:string};
export type TarotAiAttempt={result:TarotAiResult|null;reason:'disabled'|'not_configured'|'rate_limited'|'provider_unavailable'|'invalid_response'|'success'};
/** Explicitly FREE OpenRouter routing. No paid OpenAI or auto-switch to paid model. */
export async function generateTarotNarrative(
 cards:Raw[],spread:Spread,question:string|null,lang:'uk'|'en',
 onUsage?:(event:AiUsageEvent)=>Promise<void>|void,
 fetcher:typeof fetch=fetch
):Promise<TarotAiAttempt>{
 if(process.env.TAROT_AI_ENABLED!=='1')return {result:null,reason:'disabled'};
 const key=process.env.OPENROUTER_API_KEY?.trim();
 if(!key)return {result:null,reason:'not_configured'};
 if(!canRequest())return {result:null,reason:'rate_limited'};
 const details=describeDraws(cards,spread);
 const facts=details.map((c,i)=>({
  position:i+1,role:c.positionName[lang],card:c.name[lang],reversed:c.reversed,
  interpretation:c.detail[lang]
 }));
 const instruction=lang==='uk'?
  'Ти — досвідчена українська тарологиня. Відповідай ПРИРОДНО, живою українською мовою, наче на особистій консультації. Дай СПОЧАТКУ короткий конкретний прогноз за запитанням: що може відбутися, через яку подію, як може закінчитись. Потім 2–4 абзаци пояснення КОМБІНАЦІЇ карт з чіткими ролями, прямими та перевернутими положеннями, особливо фінальної карти. Ніяких списків банальностей, жодних шаблонних фраз про рефлексію. Трактуй карти ворожильною мовою: «за цими картами ймовірно...», «схоже, що...», «якщо...». Не видавай прогнози за факти й не гарантуй події, вагітність, смерть, медичний діагноз чи фінансову вигоду. Не вигадуй карт, подій з біографії чи точних дат. 220–330 слів.':
  'You are a skilled personal tarot reader. Give a DIRECT, concrete possible outcome first, then 2–4 natural paragraphs about the whole card combination, with each position and reversal meaningfully connected. Use warm vivid everyday language, no self-help platitudes or checklists. Say what may happen, how it could develop, what may change the outcome. Frame as a tarot interpretation, never factual certainty; no invented cards, identity facts, exact dates, pregnancy, diagnosis or guaranteed money. 220–330 words.';
 const model='openrouter/free';
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),19000);
 let recorded=false;
 async function usage(outcome:AiUsageEvent['outcome'],body?:{usage?:{prompt_tokens?:number;completion_tokens?:number;total_tokens?:number;cost?:number};model?:string}){
  if(recorded)return;recorded=true;
  const valid=(x:unknown)=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0?x:undefined;
  const cost=body?.usage?.cost;
  try{await onUsage?.({provider:'openrouter',model:body?.model||model,outcome,
   promptTokens:valid(body?.usage?.prompt_tokens),completionTokens:valid(body?.usage?.completion_tokens),
   totalTokens:valid(body?.usage?.total_tokens),
   costUsd:typeof cost==='number'&&Number.isFinite(cost)&&cost>=0?cost:undefined
  });}catch{console.warn('Tarot AI token metering unavailable')}
 }
 try{
  const response=await fetcher('https://openrouter.ai/api/v1/chat/completions',{
   method:'POST',signal:controller.signal,
   headers:{'Content-Type':'application/json',Authorization:'Bearer '+key,'HTTP-Referer':'https://galaxiora.example','X-Title':'Galaxiora Tarot'},
   body:JSON.stringify({model,temperature:0.75,max_tokens:950,messages:[
    {role:'system',content:instruction},
    {role:'user',content:JSON.stringify({question:question||'General spread',spread,cards:facts})}
   ]})
  });
  if(!response.ok){await usage('provider_error');return {result:null,reason:'provider_unavailable'};}
  const json=await response.json() as {model?:string;usage?:{prompt_tokens?:number;completion_tokens?:number;total_tokens?:number;cost?:number};
    choices?:Array<{message?:{content?:string}}>};
  await usage('returned',json);
  const text=json.choices?.[0]?.message?.content?.trim();
  if(!text||text.length<280||text.length>6500)return {result:null,reason:'invalid_response'};
  return {result:{text,provider:'openrouter',model:json.model||model},reason:'success'};
 }catch{await usage('request_error');return {result:null,reason:'provider_unavailable'};}
 finally{clearTimeout(timeout);}
}
