/** ASE-3 fact-linked opt-in AI writer. Astronomy remains deterministic.
 * No names, birth instants, locations or account IDs sent to the model.
 * Output checks establish structural grounding, not full semantic proof.
 */
import {consumeFreeAiRequest} from './free-ai.ts';
type Locale='uk'|'en';
export type ASEFact={id:string;tradition:'western'|'vedic';fact:string;topic:string};
const BANNED=/(?:гарантован|неодмінно|неминуч|точно станеть|обов’язково стан|смерт|вагітн|хвороб|діагноз|розлучиш|одружиш|guarantee|inevitab|will definitely|death|diagnos|pregnan|certain to happen)/iu;
const NUMERIC=/\d|[°%$€]/u;
const PLANET_MENTIONS:readonly [RegExp,RegExp][]=[
 [/\bSun\b|сонц/iu,/\bSun\b|сонц/iu],
 [/\bMoon\b|місяц/iu,/\bMoon\b|місяц/iu],
 [/\bMercury\b|меркур/iu,/\bMercury\b|меркур/iu],
 [/\bVenus\b|венер/iu,/\bVenus\b|венер/iu],
 [/\bMars\b|марс/iu,/\bMars\b|марс/iu],
 [/\bJupiter\b|юпітер/iu,/\bJupiter\b|юпітер/iu],
 [/\bSaturn\b|сатурн/iu,/\bSaturn\b|сатурн/iu],
 [/\bRahu\b|раху/iu,/\bRahu\b|раху/iu],
 [/\bKetu\b|кету/iu,/\bKetu\b|кету/iu]
];
export function selectASEFacts(advanced:{
 western:{contacts:ReadonlyArray<{id:string;planet:string;target:string;aspect:string;applying:string}>};
 vedic:{gochara:ReadonlyArray<{graha:string;houseFromLagna:number;houseFromMoon:number;bav:number;sav:number}>;
 periodContext?:{lord:string;antardasha?:string|null}|null}
},locale:Locale):ASEFact[]{
 const uk=locale==='uk';
 const western=advanced.western.contacts.slice(0,6).map(c=>({
  id:c.id,tradition:'western' as const,topic:c.planet,
  fact:(uk?'Тропічний транзит ':'Tropical transit ')+c.planet+
   (uk?' утворює ':' makes ')+c.aspect+(uk?' до натального ':' to natal ')+c.target+
   (uk?'; фаза ':'; phase ')+c.applying+'.'}));
 const vedic=advanced.vedic.gochara.slice(0,5).map(c=>({
  id:'V:GOCHARA:'+c.graha,tradition:'vedic' as const,topic:c.graha,
  fact:(uk?'Ведична гочара: ':'Sidereal gochara: ')+c.graha+
    (uk?' дім ':' house ')+c.houseFromMoon+
    (uk?' від Місяця і ':' from Moon and ')+c.houseFromLagna+
    (uk?' від Лагни; BAV ':' from Lagna; BAV ')+c.bav+', SAV '+c.sav+'.'}));
 const all=[...western,...vedic];
 const period=advanced.vedic.periodContext;
 if(period?.lord)all.push({id:'V:DASHA',tradition:'vedic',topic:'timing',
  fact:(uk?'Перевірена махадаша ':'Verified mahadasha ')+period.lord+
   (uk?', антардаша ':', antardasha ')+(period.antardasha||'unknown')+'.'});
 return all;
}
export function validateASE3Output(raw:unknown,allowed:ReadonlyArray<ASEFact>){
 if(!raw||typeof raw!=='object'||!Array.isArray((raw as {paragraphs?:unknown}).paragraphs))
  throw Error('AI JSON contract violation');
 const a=(raw as {paragraphs:unknown[]}).paragraphs;
 if(a.length<2||a.length>3)throw Error('AI paragraph count');
 const index=new Map(allowed.map(f=>[f.id,f]));
 const used=new Set<string>();
 const paragraphs=a.map((p,i)=>{
  const row=p as {text?:unknown;evidenceIds?:unknown};
  if(!row||typeof row.text!=='string'||!Array.isArray(row.evidenceIds)||
   row.text.length<110||row.text.length>650||
   /[<>]|https?:\/\/|\[\[|\{\{/.test(row.text)||
   NUMERIC.test(row.text)||BANNED.test(row.text))
   throw Error('AI unsupported freeform claims or length');
  if(row.evidenceIds.length<1||row.evidenceIds.length>4||
   row.evidenceIds.some(id=>typeof id!=='string'||!index.has(id))||
   new Set(row.evidenceIds).size!==row.evidenceIds.length)
   throw Error('AI unsupported evidence identifier');
  const linked=row.evidenceIds.map(id=>index.get(id as string)!.fact).join(' ');
  if(PLANET_MENTIONS.some(([mention,source])=>mention.test(row.text as string)&&!source.test(linked)))
   throw Error('AI mentioned planetary actor not established in cited facts');
  for(const id of row.evidenceIds)used.add(id);
  return {id:'ase3-paragraph-'+(i+1),text:row.text.trim(),evidenceIds:row.evidenceIds as string[]};
 });
 if(![...used].some(id=>index.get(id)?.tradition==='western')||
    ![...used].some(id=>index.get(id)?.tradition==='vedic'))
  throw Error('AI must represent both traditions');
 if(new Set(paragraphs.map(x=>x.text.toLowerCase())).size!==paragraphs.length)
  throw Error('AI repeated paragraphs');
 return paragraphs;
}
function providerConfig(){
 const groq=process.env.GROQ_API_KEY?.trim();
 if(groq&&process.env.GROQ_FREE_TIER_CONFIRMED==='1')
  return {provider:'groq',url:'https://api.groq.com/openai/v1/chat/completions',
   model:'openai/gpt-oss-120b',key:groq};
 const gemini=process.env.GEMINI_API_KEY?.trim();
 if(gemini&&process.env.GEMINI_FREE_TIER_CONFIRMED==='1')
  return {provider:'gemini',url:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
   model:'gemini-3.1-flash-lite',key:gemini};
 const router=process.env.OPENROUTER_API_KEY?.trim();
 if(router){
  const custom=process.env.OPENROUTER_FREE_MODEL?.trim()||'';
  const model=/^[a-z0-9_.-]+\/[a-z0-9_.:-]+:free$/i.test(custom)?custom:'openrouter/free';
  return {provider:'openrouter',url:'https://openrouter.ai/api/v1/chat/completions',
   model,key:router};
 }
 return null;
}
export async function generateASE3Reading(facts:ReadonlyArray<ASEFact>,locale:Locale,
 fetcher:typeof fetch=fetch){
 if(process.env.ASE_AI_ENABLED!=='1')
  return {status:'disabled' as const,reason:'ASE_AI_NOT_OPTED_IN'};
 const config=providerConfig();
 if(!config)return {status:'unavailable' as const,reason:'NO_CONFIRMED_FREE_PROVIDER'};
 if(!consumeFreeAiRequest())
  return {status:'unavailable' as const,reason:'FREE_AI_HOURLY_BUDGET'};
 if(facts.length>12||!facts.length||new Set(facts.map(f=>f.id)).size!==facts.length||
    facts.some(f=>!/^([TV]:[A-Za-z0-9:_-]+)$/.test(f.id)||f.fact.length>240))
  throw Error('Invalid evidence for ASE-3');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),22000);
 try{
  const response=await fetcher(config.url,{
   method:'POST',signal:controller.signal,
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+config.key},
   body:JSON.stringify({model:config.model,temperature:0.2,max_tokens:950,
    messages:[
     {role:'system',content:[
      'You are Galaxiora astrological synthesis editor. Use ONLY supplied source evidence. Separate Western tropical from Jyotish sidereal methods.',
      'Write 2-3 substantial fluent paragraphs in '+(locale==='uk'?'Ukrainian':'English')+
       '. Each paragraph must cite 1-4 exact evidenceIds from the supplied facts.',
      'Explain a shared theme only with actual Western and Vedic supporting facts, otherwise explain distinct emphases. Explain tensions between signals.',
      'Never invent planetary signs, houses, exact dates, numbers, events, planet positions, biographies, health, legal or financial outcomes. No certainty or fate claims. No new celestial facts. No extra names.',
      'Respond strictly JSON with paragraphs array, each containing text (110-650 chars; no digits), evidenceIds array. No Markdown.'
     ].join(' ')},
     {role:'user',content:JSON.stringify({facts})}
    ]})});
  if(!response.ok)throw Error('AI provider HTTP error');
  const raw=await response.text();
  if(raw.length>50000)throw Error('Oversized AI response');
  const body=JSON.parse(raw) as {choices?:{message?:{content?:string}}[]};
  const message=body.choices?.[0]?.message?.content;
  if(!message)throw Error('Empty AI response');
  const parsed=JSON.parse(message.trim());
  const paragraphs=validateASE3Output(parsed,facts);
  return {status:'available' as const,version:'ASE_V3' as const,
   provenance:'AI_EDITED_SERVER_VERIFIED_EVIDENCE_IDS_NOT_ASTRONOMY',
   model:config.provider,paragraphs,
   evidence:facts.map(f=>({id:f.id,tradition:f.tradition,fact:f.fact}))};
 }catch{
  return {status:'unavailable' as const,reason:'AI_RESPONSE_NOT_VERIFIED'};
 }finally{clearTimeout(timeout);}
}
