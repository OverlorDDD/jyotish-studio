import test from 'node:test';
import assert from 'node:assert/strict';
import {NAKSHATRAS} from './index.ts';
import {ashtakoota,bhakoot,grahaMaitri,gunaBand,nadiOf,taraFrom,vashyaGroup,KOOTA_MAX,NAKSHATRA_GANA,NAKSHATRA_YONI,YONI,YONI_NAMES} from './ashtakoota.ts';

const nak=(name:string)=>NAKSHATRAS.indexOf(name as typeof NAKSHATRAS[number]);

test('Ashtakoota: maxima add up to 36 and tables are well formed',()=>{
 assert.equal(Object.values(KOOTA_MAX).reduce((a,b)=>a+b,0),36);
 assert.equal(NAKSHATRA_YONI.length,27);
 assert.equal(NAKSHATRA_GANA.length,27);
 for(let i=0;i<14;i++)for(let j=0;j<14;j++)assert.equal(YONI[i][j],YONI[j][i],'yoni matrix is symmetric '+YONI_NAMES[i]+'/'+YONI_NAMES[j]);
 for(let i=0;i<14;i++)assert.equal(YONI[i][i],4);
 // Each gana has exactly nine nakshatras.
 for(const g of [0,1,2])assert.equal(NAKSHATRA_GANA.filter(x=>x===g).length,9);
});

test('Ashtakoota: classical sworn-enemy yonis score zero',()=>{
 const y=(a:string,b:string)=>YONI[YONI_NAMES.indexOf(a as never)][YONI_NAMES.indexOf(b as never)];
 for(const [a,b] of [['Cat','Rat'],['Serpent','Mongoose'],['Cow','Tiger'],['Elephant','Lion'],['Horse','Buffalo'],['Dog','Deer'],['Sheep','Monkey']])assert.equal(y(a,b),0,a+'/'+b);
});

test('Ashtakoota: nakshatra classes match the classical lists',()=>{
 for(const n of ['Ashwini','Ardra','Punarvasu','Uttara Phalguni','Hasta','Jyeshtha','Mula','Shatabhisha','Purva Bhadrapada'])assert.equal(nadiOf(nak(n)),0,n);
 for(const n of ['Krittika','Rohini','Ashlesha','Magha','Swati','Vishakha','Uttara Ashadha','Shravana','Revati'])assert.equal(nadiOf(nak(n)),2,n);
 for(const n of ['Krittika','Ashlesha','Magha','Chitra','Vishakha','Jyeshtha','Mula','Dhanishta','Shatabhisha'])assert.equal(NAKSHATRA_GANA[nak(n)],2,n);
 assert.equal(YONI_NAMES[NAKSHATRA_YONI[nak('Uttara Ashadha')]],'Mongoose');
 assert.equal(YONI_NAMES[NAKSHATRA_YONI[nak('Pushya')]],'Sheep');
});

test('Ashtakoota: Graha Maitri follows natural friendship both ways',()=>{
 assert.equal(grahaMaitri('Sun','Moon'),5);
 assert.equal(grahaMaitri('Sun','Mercury'),4);
 assert.equal(grahaMaitri('Mars','Venus'),3);
 assert.equal(grahaMaitri('Moon','Mercury'),1);
 assert.equal(grahaMaitri('Moon','Venus'),0.5);
 assert.equal(grahaMaitri('Sun','Saturn'),0);
 assert.equal(grahaMaitri('Venus','Venus'),5);
 assert.equal(grahaMaitri('Jupiter','Mercury'),grahaMaitri('Mercury','Jupiter'));
});

test('Ashtakoota: Bhakoot doshas and Tara counting',()=>{
 assert.deepEqual(bhakoot(1,7),{score:7,pair:'7/7',dosha:false,cancelled:false});
 assert.equal(bhakoot(1,2).pair,'2/12');
 assert.equal(bhakoot(1,6).pair,'6/8');
 assert.equal(bhakoot(1,5).dosha,true);
 assert.equal(bhakoot(4,10).score,7,'Cancer–Capricorn (7/7) is favourable');
 assert.equal(bhakoot(2,7).cancelled,true,'Taurus–Libra share Venus: dosha is neutralised');
 assert.equal(taraFrom(0,0),1);
 assert.equal(taraFrom(nak('Pushya'),nak('Shravana')),6);
 assert.equal(taraFrom(nak('Shravana'),nak('Pushya')),5);
});

test('Ashtakoota: Sagittarius and Capricorn change Vashya class at 15°',()=>{
 assert.equal(vashyaGroup(9,5),1);
 assert.equal(vashyaGroup(9,20),0);
 assert.equal(vashyaGroup(10,5),0);
 assert.equal(vashyaGroup(10,20),2);
 assert.equal(vashyaGroup(8),4);
 assert.equal(vashyaGroup(5),3);
});

test('Ashtakoota: same nakshatra scores 28 with Nadi dosha',()=>{
 const r=ashtakoota({sign:1,nakshatra:0,degInSign:5},{sign:1,nakshatra:0,degInSign:6});
 assert.equal(r.full,true);
 assert.equal(r.max,36);
 assert.equal(r.total,28);
 assert.equal(r.scores.nadi,0);
 assert.equal(r.nadi?.dosha,true);
});

test('Ashtakoota: Capricorn/Shravana groom with Cancer/Pushya bride, classical orientation',()=>{
 const groom={sign:10,nakshatra:nak('Shravana'),degInSign:16};
 const bride={sign:4,nakshatra:nak('Pushya'),degInSign:10};
 const r=ashtakoota(bride,groom,'aBride');
 assert.equal(r.scores.varna,0,'a Vaishya groom with a Brahmin bride gets no Varna point');
 assert.equal(r.scores.tara,1.5);
 assert.equal(r.scores.yoni,0,'Sheep and Monkey are sworn enemies');
 assert.equal(r.scores.grahaMaitri,0.5);
 assert.equal(r.scores.gana,6);
 assert.equal(r.scores.bhakoot,7);
 assert.equal(r.scores.nadi,8);
});

test('Ashtakoota: without roles the score does not depend on input order',()=>{
 for(let a=1;a<=12;a++)for(let b=1;b<=12;b++){
  const x=ashtakoota({sign:a,nakshatra:(a*2)%27},{sign:b,nakshatra:(b*2+1)%27});
  const y=ashtakoota({sign:b,nakshatra:(b*2+1)%27},{sign:a,nakshatra:(a*2)%27});
  assert.equal(x.total,y.total,a+'/'+b);
  assert.ok(x.total>=0&&x.total<=36);
 }
});

test('Ashtakoota: sign-level matching uses only the four sign kootas (15 points)',()=>{
 const r=ashtakoota({sign:1},{sign:5});
 assert.equal(r.full,false);
 assert.equal(r.max,15);
 assert.equal(r.scores.tara,undefined);
 assert.equal(r.scores.bhakoot,0);
 assert.equal(r.bhakoot.cancelled,true,'Mars and Sun are mutual friends');
 assert.equal(gunaBand(30),'excellent');
 assert.equal(gunaBand(17.5),'low');
});
