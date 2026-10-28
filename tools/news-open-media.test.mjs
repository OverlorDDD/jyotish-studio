import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newsFallbackArtwork} from '../apps/web/app/components/news-fallback-artwork.ts';
import {selectOpenImage,findOpenImage} from '../apps/api/src/news-open-media.ts';
import {safeImageUrl} from '../apps/api/src/news-domain.ts';
const photo=(license='CC BY 4.0',url='https://creativecommons.org/licenses/by/4.0/',author='<a>Original Photographer</a>')=>({
 query:{pages:[{pageid:42,title:'File:Sunrise meditation.jpg',imageinfo:[{
  thumburl:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Sunrise_meditation.jpg/760px-Sunrise_meditation.jpg',
  descriptionurl:'https://commons.wikimedia.org/wiki/File:Sunrise_meditation.jpg',
  mime:'image/jpeg',width:1800,height:1150,
  extmetadata:{LicenseShortName:{value:license},LicenseUrl:{value:url},Artist:{value:author}}
 }]}]}
});
test('real Wikimedia Commons photo is accepted only with matching creator, CC terms and source link',async()=>{
 const p=photo(),found=selectOpenImage({query:{pages:{42:p.query.pages[0]}}});
 assert.ok(found);
 assert.equal(found.imageLicense,'CC BY 4.0');
 assert.ok(found.imageCredit.includes('Original Photographer'));
 assert.match(found.imagePageUrl,/commons\.wikimedia\.org/);
 assert.match(found.imageLicenseUrl,/creativecommons\.org/);
 assert.equal(safeImageUrl(found.imageUrl,found.imageLicenseUrl),found.imageUrl);
 const result=await findOpenImage('yoga','story-seed',async(url,opts)=>{
  assert.match(String(url),/commons\.wikimedia\.org\/w\/api\.php/);
  assert.match(String(url),/iiprop=url%7Csize%7Cmime%7Cextmetadata/);
  assert.equal(opts.redirect,'error');
  return new Response(JSON.stringify(p),{status:200,headers:{'Content-Type':'application/json'}});
 });
 assert.deepEqual(result,found);
});
test('reject noncommercial or no-derivatives licensing, missing artist, wrong photo host and invalid source page',()=>{
 assert.equal(selectOpenImage({query:{pages:{a:photo('CC BY-NC 4.0','https://creativecommons.org/licenses/by-nc/4.0/').query.pages[0]}}}),null);
 assert.equal(selectOpenImage({query:{pages:{a:photo('CC BY-ND 4.0','https://creativecommons.org/licenses/by-nd/4.0/').query.pages[0]}}}),null);
 assert.equal(selectOpenImage({query:{pages:{a:photo('CC BY 4.0','https://creativecommons.org/licenses/by/4.0/','').query.pages[0]}}}),null);
 const bad=photo();bad.query.pages[0].imageinfo[0].thumburl='https://example.com/external.jpg';
 assert.equal(selectOpenImage({query:{pages:{a:bad.query.pages[0]}}}),null);
});
test('invalid topic, provider errors and non-JSON responses never invent photos',async()=>{
 assert.equal(await findOpenImage('whatever','seed',async()=>{throw Error('must not fetch')}),null);
 assert.equal(await findOpenImage('yoga','seed',async()=>new Response('<html>error</html>',{status:200})),null);
 assert.equal(await findOpenImage('yoga','seed',async()=>new Response('limit',{status:429})),null);
});

test('all eight news topics have self-contained, genuinely distinct offline artwork',()=>{
 const topics=['jyotish','astrology','tarot','yoga','meditation','vedic','self-development','astronomy'];
 const sources=topics.map(topic=>newsFallbackArtwork(topic));
 assert.equal(new Set(sources).size,topics.length,'A theme-specific visual must not be a reused placeholder');
 for(const src of sources){
  assert.match(src,/^data:image\/svg\+xml;charset=utf-8,/);
  const svg=decodeURIComponent(src.substring(src.indexOf(',')+1));
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/<rect width="960" height="540"/);
  assert.doesNotMatch(svg.replace('xmlns="http://www.w3.org/2000/svg"',''),/<script|<foreignObject|<image|https?:\/\//i);
 }
 const ui=readFileSync(new URL('../apps/web/app/components/NewsWorld.tsx',import.meta.url),'utf8');
 assert.match(ui,/src=\{showingPhoto\?imageUrl!:newsFallbackArtwork\(topic\)\}/);
 assert.match(ui,/onError=\{\(\)=>\{if\(showingPhoto\)setBroken\(true\);\}\}/);
});
