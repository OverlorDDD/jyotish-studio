import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {normalizeIndexNowUrls,parseIndexNowArgs,parseIndexNowSitemap} from './r43-indexnow-core.mjs';

const SITE='https://galaxiora.com';

test('R4.3 accepts only same-origin localized, query-free public URLs',()=>{
 assert.deepEqual(normalizeIndexNowUrls([
  '/en/panchanga','https://galaxiora.com/uk/astrology/jyotish','/en/panchanga'
 ],SITE),['https://galaxiora.com/en/panchanga','https://galaxiora.com/uk/astrology/jyotish']);
 for(const bad of [
  'https://other.site/en/panchanga','https://www.galaxiora.com/en/panchanga',
  '/en/account','/uk/admin','/en/personal/chart','/en/news?token=abc',
  '/en/tarot#secret','/en/../api/private','/en/%2e%2e/account',
  'javascript:alert(1)','/uk/redirect\\path','/uk/too much','/en//admin'
 ]){
  assert.throws(()=>normalizeIndexNowUrls([bad],SITE),bad);
 }
});
test('R4.3 refuses implicit whole-site submission and mixing bootstrap with changed URLs',()=>{
 assert.deepEqual(parseIndexNowArgs(['--url','/en/panchanga']).urls,['/en/panchanga']);
 assert.equal(parseIndexNowArgs(['--bootstrap']).bootstrap,true);
 assert.throws(()=>parseIndexNowArgs(['--submit']),/Refusing/);
 assert.throws(()=>parseIndexNowArgs(['--submit','--bootstrap','--url','/en']),/cannot be combined/);
 assert.throws(()=>parseIndexNowArgs(['--url']),/Expected a value/);
 assert.throws(()=>parseIndexNowArgs(['--force']),/Unknown/);
});
test('R4.3 extracts only localized URL locs, unique and same origin',()=>{
 const xml='<urlset><url><loc>https://galaxiora.com/en</loc></url><url><loc>https://galaxiora.com/uk/learn</loc></url>'+
 '<url><loc>https://galaxiora.com/en</loc></url><url><loc>https://other.site/en</loc></url>'+
 '<url><loc>https://galaxiora.com/en/account</loc></url></urlset>';
 assert.deepEqual(parseIndexNowSitemap(xml,SITE),[
  'https://galaxiora.com/en','https://galaxiora.com/uk/learn'
 ]);
 assert.throws(()=>parseIndexNowSitemap('<urlset></urlset>',SITE),/no loc/);
});
test('R4.3 dry-run does not contact remote endpoint or require IndexNow key',()=>{
 const result=spawnSync(process.execPath,['--experimental-strip-types','tools/r3-indexnow.mjs','--url','/en/panchanga'],{
  encoding:'utf8',env:{...process.env,SITE_NOINDEX:'0',NEXT_PUBLIC_SITE_URL:SITE,INDEXNOW_KEY:''},
  timeout:10000
 });
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/DRY RUN/);
 assert.match(result.stdout,/https:\/\/galaxiora.com\/en\/panchanga/);
 assert.match(result.stdout,/no HTTP requests sent/);
});
