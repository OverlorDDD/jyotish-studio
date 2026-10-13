/** Strict gate for free-model prose in long-form reports.
 * Never treat AI prose as authority for factual measurements or formal yoga names.
 * Fact-linked prose can still be subjectively wrong: preserve "AI commentary" label. */
const measured=/(?:\d+(?:[.,]\d+)?)\s*(?:°|градус(?:ів|и|а)?|degrees?|°C)/iu;
const numericHouse=/\b(?:\d{1,2})(?:-?(?:й|ий|му|го))?\s*(?:дім|домі|дому|house)\b/iu;
const date=/\b(?:19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/u;
const prohibitedClaims=/(?:екзальт(?:ація|ований|оване|ується)|дебіліт(?:ація|ований|овано)|exalt(?:ed|ation)|debilitat(?:ed|ion)|мулатрикона|moolatrikona|шадбал(?:а|и)|shadbala)/iu;
const yogaWords=/(?:ruchaka|badra|bhadra|hamsa|malavya|shasha|ручак[а-я]*|бхадр[а-я]*|хамс[а-я]*|малав[а-я]*|шаш[а-я]*)/giu;
const signNames='(?:Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|Овен|Овні|Телець|Тельці|Близнюки|Близнюках|Рак|Раку|Лев|Леві|Діва|Діві|Терези|Терезах|Скорпіон|Скорпіоні|Стрілець|Стрільці|Козоріг|Козорозі|Водолій|Водолії|Риби|Рибах)';
const planetNames='(?:Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|Сонце|Сонця|Місяць|Місяця|Марс|Меркурій|Юпітер|Венера|Венери|Сатурн|Раху|Кету)';
const precisePlacements=new RegExp(planetNames+'[^.!?;]{0,70}?(?:\\s+у\\s+|\\s+в\\s+|\\s+in\\s+|\\s+is\\s+in\\s+)'+signNames,'iu');
const yogaGeneric=/\b(?:yoga|yogas)\b|йог[а-яіїєґ]*/iu;
const yogaNames=['ruchaka','bhadra','hamsa','malavya','shasha'] as const;
function listedYoga(token:string):typeof yogaNames[number]|null{
 const word=token.toLowerCase();
 if(word.startsWith('ruch')||word.startsWith('ручак'))return 'ruchaka';
 if(word.startsWith('bad')||word.startsWith('bha')||word.startsWith('бхадр'))return 'bhadra';
 if(word.startsWith('ham')||word.startsWith('хамс'))return 'hamsa';
 if(word.startsWith('mal')||word.startsWith('малав'))return 'malavya';
 if(word.startsWith('sha')||word.startsWith('шаш'))return 'shasha';
 return null;
}
export function verifyFreeProse(text:string,approvedYogas:ReadonlyArray<string>=[]){
 if(text.length>4000||text.length<20)return {ok:false as const,reason:'size'};
 if(measured.test(text)||numericHouse.test(text)||date.test(text))
  return {ok:false as const,reason:'unverified_numeric_claim'};
 if(precisePlacements.test(text))
  return {ok:false as const,reason:'planet_sign_statement_from_model'};
 if(prohibitedClaims.test(text))
  return {ok:false as const,reason:'strength_claim_requires_rule_engine'};
 const active=new Set(approvedYogas.map(x=>x.toLowerCase()));
 if(yogaGeneric.test(text)&&![...text.matchAll(yogaWords)].some(x=>listedYoga(x[0])&&active.has(listedYoga(x[0])!)))
  return {ok:false as const,reason:'unverified_yoga_claim'};
 for(const match of text.matchAll(yogaWords)){
  const name=listedYoga(match[0]);
  if(!name||!active.has(name))return {ok:false as const,reason:'unverified_yoga_claim'};
 }
 return {ok:true as const};
}
