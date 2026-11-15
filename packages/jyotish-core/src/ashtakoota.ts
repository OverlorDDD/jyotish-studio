/** Ashtakoota (Guna Milan): the classical North Indian 36-point comparison of
 * two Moon positions (sidereal Lahiri). Pure tables, no ephemeris, no I/O.
 *
 * Tables follow the widely used Muhurta Chintamani-based convention:
 * Varna, Vashya, Gana and Graha Maitri as published by OnlineJyotish
 * (bride rows × groom columns), Yoni as the common 14×14 matrix. Variants
 * exist between schools; the version string identifies this one.
 *
 * Signs are 1..12 (Aries..Pisces); nakshatras are 0..26 (Ashwini..Revati).
 * The classical text distinguishes bride and groom for Varna, Vashya and
 * Gana. When roles are not given we score both orientations and average,
 * so the result never depends on who typed their date first. */
export const ASHTAKOOTA_VERSION='ashtakoota-mc-v1';

export type Koota='varna'|'vashya'|'tara'|'yoni'|'grahaMaitri'|'gana'|'bhakoot'|'nadi';
export const KOOTA_MAX:Record<Koota,number>={varna:1,vashya:2,tara:3,yoni:4,grahaMaitri:5,gana:6,bhakoot:7,nadi:8};
export const KOOTA_ORDER:Koota[]=['varna','vashya','tara','yoni','grahaMaitri','gana','bhakoot','nadi'];

/* ---------- Varna (1) ---------- */
// 0 Brahmin, 1 Kshatriya, 2 Vaishya, 3 Shudra
export const SIGN_VARNA=[1,2,3,0,1,2,3,0,1,2,3,0] as const;
export const VARNA_NAMES=['Brahmin','Kshatriya','Vaishya','Shudra'] as const;
const varnaScore=(bride:number,groom:number)=>SIGN_VARNA[groom-1]<=SIGN_VARNA[bride-1]?1:0;

/* ---------- Vashya (2) ---------- */
// 0 Chatushpada, 1 Nara (Manava), 2 Jalachara, 3 Vanachara, 4 Keeta
export const VASHYA_NAMES=['Chatushpada','Nara','Jalachara','Vanachara','Keeta'] as const;
/** Sagittarius: first half Nara, second Chatushpada. Capricorn: first half
 * Chatushpada, second Jalachara. `deg` is the position inside the sign. */
export function vashyaGroup(sign:number,deg=0):number{
 if(sign===9)return deg<15?1:0;
 if(sign===10)return deg<15?0:2;
 return [0,0,1,2,3,1,1,4,-1,-1,1,2][sign-1];
}
const VASHYA:number[][]=[ // bride row × groom column
 [2,1,1,0,1],
 [1,2,0.5,0,1],
 [1,0.5,2,1,1],
 [0,0,1,2,0],
 [1,0,1,0,2]
];

/* ---------- Tara (3) ---------- */
/** Tara (1..9) of `to` counted from `from`; 3 Vipat, 5 Pratyari, 7 Vadha are adverse. */
export function taraFrom(from:number,to:number){const n=((to-from+27)%27)+1;return ((n-1)%9)+1;}
const goodTara=(t:number)=>t!==3&&t!==5&&t!==7;

/* ---------- Yoni (4) ---------- */
export const YONI_NAMES=['Horse','Elephant','Sheep','Serpent','Dog','Cat','Rat','Cow','Buffalo','Tiger','Deer','Monkey','Mongoose','Lion'] as const;
export const NAKSHATRA_YONI=[0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1] as const;
export const YONI:number[][]=[
 [4,2,2,3,2,2,2,1,0,1,3,3,2,1],
 [2,4,3,3,2,2,2,2,3,1,2,3,2,0],
 [2,3,4,2,1,2,1,3,3,1,2,0,3,1],
 [3,3,2,4,2,1,1,1,1,2,2,2,0,2],
 [2,2,1,2,4,2,1,2,2,1,0,2,1,1],
 [2,2,2,1,2,4,0,2,2,1,3,3,2,1],
 [2,2,1,1,1,0,4,2,2,2,2,2,1,2],
 [1,2,3,1,2,2,2,4,3,0,3,2,2,1],
 [0,3,3,1,2,2,2,3,4,1,2,2,2,1],
 [1,1,1,2,1,1,2,0,1,4,1,1,2,1],
 [3,2,2,2,0,3,2,3,2,1,4,2,2,1],
 [3,3,0,2,2,3,2,2,2,1,2,4,3,2],
 [2,2,3,0,1,2,1,2,2,2,2,3,4,2],
 [1,0,1,2,1,1,2,1,1,1,1,2,2,4]
];

/* ---------- Graha Maitri (5) ---------- */
export type Lord='Sun'|'Moon'|'Mars'|'Mercury'|'Jupiter'|'Venus'|'Saturn';
export const SIGN_LORD:Lord[]=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
/** Natural (naisargika) friendship, BPHS: 1 friend, 0 neutral, -1 enemy. */
const NATURAL:Record<Lord,Record<Lord,number>>={
 Sun:{Sun:1,Moon:1,Mars:1,Mercury:0,Jupiter:1,Venus:-1,Saturn:-1},
 Moon:{Sun:1,Moon:1,Mars:0,Mercury:1,Jupiter:0,Venus:0,Saturn:0},
 Mars:{Sun:1,Moon:1,Mars:1,Mercury:-1,Jupiter:1,Venus:0,Saturn:0},
 Mercury:{Sun:1,Moon:-1,Mars:0,Mercury:1,Jupiter:0,Venus:1,Saturn:0},
 Jupiter:{Sun:1,Moon:1,Mars:1,Mercury:-1,Jupiter:1,Venus:-1,Saturn:0},
 Venus:{Sun:-1,Moon:-1,Mars:0,Mercury:1,Jupiter:0,Venus:1,Saturn:1},
 Saturn:{Sun:-1,Moon:-1,Mars:-1,Mercury:1,Jupiter:0,Venus:1,Saturn:1}
};
export const naturalRelation=(of:Lord,toward:Lord)=>NATURAL[of][toward];
/** 5 mutual friends (or same lord), 4 friend+neutral, 3 both neutral,
 * 1 friend+enemy, 0.5 neutral+enemy, 0 mutual enemies. Symmetric. */
export function grahaMaitri(a:Lord,b:Lord):number{
 if(a===b)return 5;
 const x=NATURAL[a][b],y=NATURAL[b][a],s=[x,y].sort().join(',');
 return ({'1,1':5,'0,1':4,'0,0':3,'-1,1':1,'-1,0':0.5,'-1,-1':0} as Record<string,number>)[s];
}

/* ---------- Gana (6) ---------- */
// 0 Deva, 1 Manushya, 2 Rakshasa
export const GANA_NAMES=['Deva','Manushya','Rakshasa'] as const;
export const NAKSHATRA_GANA=[0,1,2,1,0,1,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0] as const;
const GANA:number[][]=[[6,6,0],[5,6,0],[1,0,6]]; // bride row × groom column

/* ---------- Bhakoot (7) ---------- */
/** Sign distance counted inclusively from `a` to `b` (1..12). */
export const signDistance=(a:number,b:number)=>((b-a+12)%12)+1;
/** 2/12, 5/9 and 6/8 placements carry Bhakoot dosha; 1/1, 1/7, 3/11, 4/10 score 7. */
export function bhakoot(a:number,b:number){
 const d=signDistance(a,b),pair=[d,signDistance(b,a)].sort((x,y)=>x-y).join('/');
 const dosha=pair==='2/12'||pair==='5/9'||pair==='6/8';
 const la=SIGN_LORD[a-1],lb=SIGN_LORD[b-1];
 // Classical parihara: same lord or mutually friendly lords neutralise the dosha.
 const cancelled=dosha&&(la===lb||(NATURAL[la][lb]===1&&NATURAL[lb][la]===1));
 return {score:dosha?0:7,pair,dosha,cancelled};
}

/* ---------- Nadi (8) ---------- */
// 0 Adi (Vata), 1 Madhya (Pitta), 2 Antya (Kapha) — the boustrophedon pattern.
export const NADI_NAMES=['Adi','Madhya','Antya'] as const;
export function nadiOf(nak:number){const r=nak%6;return r===0||r===5?0:r===1||r===4?1:2;}

/* ---------- Sign-level and full matching ---------- */
export type MoonPoint={sign:number;nakshatra?:number;degInSign?:number};
export type Roles='none'|'aBride'|'bBride';
const avg=(x:number,y:number)=>Math.round((x+y)*2)/4; // average, rounded to 0.25

function oriented(bride:MoonPoint,groom:MoonPoint){
 const out:Partial<Record<Koota,number>>={
  varna:varnaScore(bride.sign,groom.sign),
  vashya:VASHYA[vashyaGroup(bride.sign,bride.degInSign)][vashyaGroup(groom.sign,groom.degInSign)]
 };
 if(bride.nakshatra!==undefined&&groom.nakshatra!==undefined)
  out.gana=GANA[NAKSHATRA_GANA[bride.nakshatra]][NAKSHATRA_GANA[groom.nakshatra]];
 return out;
}

/** Full 36-point matching when both nakshatras are known; otherwise only the
 * four sign-level kootas (Varna, Vashya, Graha Maitri, Bhakoot: 15 points). */
export function ashtakoota(a:MoonPoint,b:MoonPoint,roles:Roles='none'){
 const full=a.nakshatra!==undefined&&b.nakshatra!==undefined;
 const ab=oriented(roles==='bBride'?b:a,roles==='bBride'?a:b);
 const ba=oriented(roles==='bBride'?a:b,roles==='bBride'?b:a);
 const pick=(k:'varna'|'vashya'|'gana')=>roles==='none'?avg(ab[k]!,ba[k]!):ab[k]!;
 const scores:Partial<Record<Koota,number>>={
  varna:pick('varna'),
  vashya:pick('vashya'),
  grahaMaitri:grahaMaitri(SIGN_LORD[a.sign-1],SIGN_LORD[b.sign-1])
 };
 const bk=bhakoot(a.sign,b.sign);
 scores.bhakoot=bk.score;
 let tara:{ab:number;ba:number}|null=null,nadiDosha=false,nadiException=false;
 if(full){
  const na=a.nakshatra!,nb=b.nakshatra!;
  tara={ab:taraFrom(na,nb),ba:taraFrom(nb,na)};
  scores.tara=(goodTara(tara.ab)?1.5:0)+(goodTara(tara.ba)?1.5:0);
  scores.yoni=YONI[NAKSHATRA_YONI[na]][NAKSHATRA_YONI[nb]];
  scores.gana=pick('gana');
  nadiDosha=nadiOf(na)===nadiOf(nb);
  // Widely cited exceptions: same nakshatra in different signs, or same sign with different nakshatras.
  nadiException=nadiDosha&&((na===nb&&a.sign!==b.sign)||(a.sign===b.sign&&na!==nb));
  scores.nadi=nadiDosha?0:8;
 }
 const keys=KOOTA_ORDER.filter(k=>scores[k]!==undefined);
 const total=keys.reduce((s,k)=>s+scores[k]!,0);
 const max=keys.reduce((s,k)=>s+KOOTA_MAX[k],0);
 return {version:ASHTAKOOTA_VERSION,full,roles,scores,total:Math.round(total*4)/4,max,
  bhakoot:bk,tara,nadi:full?{dosha:nadiDosha,exception:nadiException}:null,
  detail:{
   varna:[VARNA_NAMES[SIGN_VARNA[a.sign-1]],VARNA_NAMES[SIGN_VARNA[b.sign-1]]],
   vashya:[VASHYA_NAMES[vashyaGroup(a.sign,a.degInSign)],VASHYA_NAMES[vashyaGroup(b.sign,b.degInSign)]],
   lords:[SIGN_LORD[a.sign-1],SIGN_LORD[b.sign-1]],
   ...(full?{yoni:[YONI_NAMES[NAKSHATRA_YONI[a.nakshatra!]],YONI_NAMES[NAKSHATRA_YONI[b.nakshatra!]]],
    gana:[GANA_NAMES[NAKSHATRA_GANA[a.nakshatra!]],GANA_NAMES[NAKSHATRA_GANA[b.nakshatra!]]],
    nadi:[NADI_NAMES[nadiOf(a.nakshatra!)],NADI_NAMES[nadiOf(b.nakshatra!)]]}:{})
  }};
}
export type AshtakootaResult=ReturnType<typeof ashtakoota>;

/** Classical reading bands for the 36-point total. */
export function gunaBand(total:number):'excellent'|'good'|'average'|'low'{
 return total>=28?'excellent':total>=21?'good':total>=18?'average':'low';
}
