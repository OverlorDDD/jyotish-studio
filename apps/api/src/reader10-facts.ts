/** Reader 10 fact layer: deterministic Parashari facts derived only from the verified D1.
 * No text lives here and nothing is estimated. Whole-sign houses, classical graha drishti
 * (Mars 4/8, Jupiter 5/9, Saturn 3/10, every graha 7). Rahu and Ketu cast no aspect here. */
import type {CalculatedChart} from '../../../packages/jyotish-core/src/index.ts';

export type Planet='Sun'|'Moon'|'Mars'|'Mercury'|'Jupiter'|'Venus'|'Saturn'|'Rahu'|'Ketu';
export type Dignity='exalted'|'own'|'debilitated'|'neutral';
export type PlanetFact={name:Planet;sign:number;house:number;degrees:number;nakshatra:string;nakshatraNumber:number;
 pada:number;retrograde:boolean;dignity:Dignity;rules:number[]};
export type Reader10Facts={
 lagna:{sign:number;degrees:number;nakshatra:string;nakshatraNumber:number};
 planets:Record<Planet,PlanetFact>;
 lagnaLord:PlanetFact;
 yogakaraka:PlanetFact|null;
 inLagna:PlanetFact[];
 aspectsOnLagna:PlanetFact[];
 withMoon:PlanetFact[];
 aspectsOnMoon:PlanetFact[];
 strongest:PlanetFact|null;
 /** Dispositor chain of the lagna lord, ending at a planet in its own sign or when a loop closes. */
 lagnaLordChain:Planet[];
};

export const PLANETS:readonly Planet[]=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const SIGN_LORD:readonly Planet[]=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const EXALTED:Partial<Record<Planet,number>>={Sun:1,Moon:2,Mars:10,Mercury:6,Jupiter:4,Venus:12,Saturn:7};
const EXTRA_ASPECTS:Partial<Record<Planet,readonly number[]>>={Mars:[4,8],Jupiter:[5,9],Saturn:[3,10]};
const YOGAKARAKA:Partial<Record<number,Planet>>={2:'Saturn',7:'Saturn',4:'Mars',5:'Mars',10:'Venus',11:'Venus'};
const NAKSHATRA_ORDER=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha',
 'Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha',
 'Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const KENDRA_TRIKONA=new Set([1,4,5,7,9,10]);

export const signLord=(sign:number):Planet=>SIGN_LORD[sign-1];
export function dignityOf(name:Planet,sign:number):Dignity{
 const high=EXALTED[name];
 if(high===sign)return 'exalted';
 if(high!==undefined&&((high+5)%12)+1===sign)return 'debilitated';
 if(name!=='Rahu'&&name!=='Ketu'&&SIGN_LORD[sign-1]===name)return 'own';
 return 'neutral';
}
/** Houses (1..12) a planet in `house` looks at. */
export function aspectedHouses(name:Planet,house:number):number[]{
 if(name==='Rahu'||name==='Ketu')return [];
 return [7,...(EXTRA_ASPECTS[name]||[])].map(step=>((house-1+step-1)%12)+1);
}
const nakNumber=(name:string)=>{
 const index=NAKSHATRA_ORDER.indexOf(name);
 if(index<0)throw Error('Reader 10: unknown nakshatra '+name);
 return index+1;
};

export function buildReader10Facts(chart:CalculatedChart):Reader10Facts{
 const lagnaSign=chart.ascendant?.sign;
 if(!Number.isInteger(lagnaSign)||lagnaSign<1||lagnaSign>12)throw Error('Reader 10: invalid lagna');
 const planets={} as Record<Planet,PlanetFact>;
 for(const name of PLANETS){
  const g=chart.d1.find(item=>item.name===name);
  if(!g||!Number.isInteger(g.sign)||g.sign<1||g.sign>12)throw Error('Reader 10: missing '+name);
  const house=((g.sign-lagnaSign+12)%12)+1;
  if(g.house!==house)throw Error('Reader 10: whole-sign house mismatch for '+name);
  const rules=name==='Rahu'||name==='Ketu'?[]:
   SIGN_LORD.map((lord,index)=>lord===name?((index+1-lagnaSign+12)%12)+1:0).filter(Boolean).sort((a,b)=>a-b);
  planets[name]={name,sign:g.sign,house,degrees:g.degreesInSign,nakshatra:g.nakshatra,nakshatraNumber:nakNumber(g.nakshatra),
   pada:g.pada,retrograde:Boolean(g.retrograde)&&name!=='Rahu'&&name!=='Ketu',dignity:dignityOf(name,g.sign),rules};
 }
 const all=PLANETS.map(name=>planets[name]);
 const lagnaLord=planets[signLord(lagnaSign)],moon=planets.Moon;
 const yk=YOGAKARAKA[lagnaSign];
 const looksAt=(target:number)=>all.filter(p=>aspectedHouses(p.name,p.house).includes(target));
 // Strongest: exalted or own-sign planet in a kendra or trikona; exalted first, then lowest house.
 const strong=all.filter(p=>p.name!=='Rahu'&&p.name!=='Ketu'&&(p.dignity==='exalted'||p.dignity==='own')&&KENDRA_TRIKONA.has(p.house))
  .sort((a,b)=>(a.dignity===b.dignity?0:a.dignity==='exalted'?-1:1)||a.house-b.house||PLANETS.indexOf(a.name)-PLANETS.indexOf(b.name));
 const chain:Planet[]=[lagnaLord.name];
 for(let current=lagnaLord;chain.length<8;){
  const next=planets[signLord(current.sign)];
  if(chain.includes(next.name))break;
  chain.push(next.name);current=next;
 }
 return {lagna:{sign:lagnaSign,degrees:chart.ascendant.degreesInSign,nakshatra:chart.ascendant.nakshatra,
   nakshatraNumber:nakNumber(chart.ascendant.nakshatra)},
  planets,lagnaLord,yogakaraka:yk?planets[yk]:null,
  inLagna:all.filter(p=>p.house===1),aspectsOnLagna:looksAt(1),
  withMoon:all.filter(p=>p.name!=='Moon'&&p.house===moon.house),
  aspectsOnMoon:looksAt(moon.house).filter(p=>p.name!=='Moon'),
  strongest:strong[0]||null,lagnaLordChain:chain};
}
