/**
 * A conservative UK/EN assertion extractor for localized planet/house claims.
 * Zero API calls. Absence of a parsed claim is NOT semantic certification.
 */
export type N4NaturalHouseClaim=Readonly<{division:number;planet:string;house:number}>;
const supported=new Set([1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60]);
const planetForms:Readonly<Record<string,string>>={
 sun:'Sun','сонце':'Sun','сонця':'Sun','сонцем':'Sun',
 moon:'Moon','місяць':'Moon','місяця':'Moon','місяцем':'Moon',
 mars:'Mars','марс':'Mars','марса':'Mars','марсом':'Mars',
 mercury:'Mercury','меркурій':'Mercury','меркурія':'Mercury','меркурієм':'Mercury',
 jupiter:'Jupiter','юпітер':'Jupiter','юпітера':'Jupiter','юпітером':'Jupiter',
 venus:'Venus','венера':'Venus','венеру':'Venus','венери':'Venus','венерою':'Venus',
 saturn:'Saturn','сатурн':'Saturn','сатурна':'Saturn','сатурном':'Saturn',
 rahu:'Rahu','раху':'Rahu',ketu:'Ketu','кету':'Ketu'
};
const ordinalForms:Readonly<Record<string,number>>={
 'першому':1,'першім':1,'другому':2,'третьому':3,'четвертому':4,'пятому':5,
 'шостому':6,'сьомому':7,'сімому':7,'восьмому':8,'девятому':9,'десятому':10,
 'одинадцятому':11,'дванадцятому':12,
 first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,
 tenth:10,eleventh:11,twelfth:12
};
const normalize=(s:string)=>s.normalize('NFKC').toLowerCase()
 .replace(/[’‘\u0060´]/g,"'").replace(/[‐‑‒–—−]/g,'-')
 .replace(/[\*_#]/g,' ').replace(/\u00a0/g,' ');
const pforms=Object.keys(planetForms).sort((a,b)=>b.length-a.length).join('|');
const ords=Object.keys(ordinalForms).map(s=>s.replace(/'/g,"['’]?"))
 .sort((a,b)=>b.length-a.length).join('|');
const chartRe=/(?:d|д)\s*(\d{1,2})(?!\d)/giu;
const houseRe=new RegExp(
 '(?<![\\p{L}\\p{N}])('+pforms+')(?=[^\\p{L}]|$)[^.!?;\\n]{0,76}?'+
 '(?<![\\p{L}\\p{N}])((?:[1-9]|1[0-2])(?:\\s*-?\\s*(?:й|ий|ій|го|му|м|st|nd|rd|th))?|'+ords+')'+
 '\\s*(?:-?\\s*)?(?:домі|дому|домом|дім|доме|house|houses)(?=[^\\p{L}]|$)','giu');
function houseValue(s:string):number|undefined{
 const normalized=s.toLowerCase().replace(/[’‘\u0060´]/g,"'");
 const digit=/^(\d{1,2})/.exec(normalized);
 return digit?Number(digit[1]):ordinalForms[normalized.replace(/'/g,'')];
}
export function extractN4NaturalHouseClaims(source:string):readonly N4NaturalHouseClaim[]{
 if(typeof source!=='string'||source.length>100000)return [];
 const claims:N4NaturalHouseClaim[]=[],unique=new Set<string>();
 for(const raw of normalize(source).split(/[\n.!?;]+/g)){
  const line=raw.slice(0,800);
  const charts=[...line.matchAll(chartRe)].map(m=>({division:Number(m[1]),at:m.index??0}));
  if(!charts.length)continue;
  houseRe.lastIndex=0;
  for(const m of line.matchAll(houseRe)){
   const planet=planetForms[m[1].toLowerCase()],house=houseValue(m[2]);
   if(!planet||!house||house<1||house>12)continue;
   const claimAt=m.index??0;
   const near=charts.map(c=>({...c,distance:Math.abs(c.at-claimAt)}))
    .filter(c=>supported.has(c.division)&&c.distance<=120)
    .sort((a,b)=>a.distance-b.distance);
   if(!near.length||(near.length>1&&near[0].distance===near[1].distance))continue;
   const division=near[0].division,key=division+':'+planet+':'+house;
   if(!unique.has(key)){unique.add(key);claims.push({division,planet,house});}
  }
 }
 return Object.freeze(claims.map(c=>Object.freeze(c)));
}
