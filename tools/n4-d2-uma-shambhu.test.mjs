import test from 'node:test';
import assert from 'node:assert/strict';
import {n4UmaShambhuHoraSign} from '../packages/jyotish-core/src/hora-uma-shambhu.ts';
import {vargaSign} from '../packages/jyotish-core/src/vargas.ts';
// Original author P.V.R. Narasimha Rao 2012, "Uma-Shambhu Hora", 24 half-sign table.
const expected=[[0,1],[3,2],[4,5],[7,6],[8,9],[11,10],[0,1],[3,2],[4,5],[7,6],[8,9],[11,10]];
test('author Uma-Shambhu D2: all 24 half-sign cells and exact 15° boundaries',()=>{
 for(let sign=0;sign<12;sign++){
  assert.equal(n4UmaShambhuHoraSign(sign*30+0.01),expected[sign][0]);
  assert.equal(n4UmaShambhuHoraSign(sign*30+14.999999),expected[sign][0]);
  assert.equal(n4UmaShambhuHoraSign(sign*30+15),expected[sign][1]);
  assert.equal(n4UmaShambhuHoraSign(sign*30+29.999999),expected[sign][1]);
 }
 assert.equal(n4UmaShambhuHoraSign(360),n4UmaShambhuHoraSign(0));
 assert.throws(()=>n4UmaShambhuHoraSign(Number.NaN),/Non-finite/);
 assert.throws(()=>n4UmaShambhuHoraSign(Infinity),/Non-finite/);
});
// These 10 positions and 10 D2 signs were transcribed from a single genuine
// original JHora8 synthetic GUI capture, 1990-01-05 05:11, and are NOT
// representations of a real person's birth data.
const natal=[
 ['Lagna',260.420275,6],['Sun',261.2848416667,6],
 ['Moon',6.364875,1],['Mars',229.187875,3],
 ['Mercury',269.1490916667,6],['Jupiter',70.8960805556,5],
 ['Venus',281.6329,8],['Saturn',262.4442027778,6],
 ['Rahu',294.5130916667,7],['Ketu',114.5130916667,7]
];
test('original JHora8 N4-SYNTH-001 D-2 (US) matches author method for all 10 bodies',()=>{
 assert.equal(natal.length,10);
 assert.equal(natal.filter(([,lon,sign])=>n4UmaShambhuHoraSign(lon)+1===sign).length,10);
 assert.equal(natal.filter(([,lon,sign])=>vargaSign(lon,2)+1===sign).length,1);
});
