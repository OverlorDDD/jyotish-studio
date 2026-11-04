import test from 'node:test';
import assert from 'node:assert/strict';
import {healthOrigin,validateOrganicHtml,runOrganicHealth} from './g32-organic-health.mjs';
const origin='https://galaxiora.com';
function html(path,links=''){
 const lang=path.split('/')[1],suffix=path.slice(3);
 return '<!doctype html><html lang="'+lang+'"><head><title>Galaxiora</title>'+
 '<meta name="description" content="Original calculations and guides"/>'+
 '<link rel="canonical" href="'+origin+path+'"/>'+
 ['en','uk'].map(l=>'<link rel="alternate" hreflang="'+l+'" href="'+origin+'/'+l+suffix+'"/>').join('')+
 '</head><body><h1>Galaxiora</h1>'+links+'</body></html>';
}
test('rejects arbitrary remote hosts and path-bearing targets',()=>{
 for(const u of ['http://galaxiora.com','https://evil.example','https://galaxiora.com/uk',
  'https://galaxiora.com@evil.example/','http://169.254.169.254/']){
  assert.throws(()=>healthOrigin(u));
 }
 assert.equal(healthOrigin(origin),origin);
 assert.equal(healthOrigin('http://127.0.0.1:3000'),'http://127.0.0.1:3000');
});
test('detects missing guide links, canonical, noindex and languages without leaking raw HTML',()=>{
 const path='/en/panchanga';
 const good=html(path,'<a href="/en/pedia/panchanga-time-by-city">City</a>'+
 '<a href="/en/pedia/what-is-tithi-lunar-day">Tithi</a>');
 assert.deepEqual(validateOrganicHtml(good,path).failures,[]);
 assert.ok(validateOrganicHtml(good.replace('rel="canonical"','rel="other"'),path)
  .failures.includes('CANONICAL_MISMATCH'));
 assert.ok(validateOrganicHtml(good.replace('lang="en"','lang="de"'),path)
  .failures.includes('LANG_MISMATCH'));
 assert.ok(validateOrganicHtml(good+'<meta name="robots" content="noindex">',path)
  .failures.includes('META_NOINDEX'));
 assert.ok(validateOrganicHtml(html(path),path).failures.some(x=>x.startsWith('GUIDE_LINK_MISSING')));
});
test('full read-only runner only GETs allowlisted paths; does not confuse SEO with indexing',async()=>{
 const seen=[];
 const fetcher=async(url,options)=>{
  seen.push({url,options});
  const path=new URL(url).pathname;
  const routes=['/en','/uk','/en/pedia','/uk/pedia'];
  const body=path==='/robots.txt'?'User-agent: *\nDisallow: /account\nSitemap: '+origin+'/sitemap.xml':
   path==='/sitemap.xml'?'<urlset>'+[
    ...routes,'/en/panchanga','/uk/panchanga','/en/tarot','/uk/tarot',
    '/en/astrology/jyotish','/uk/astrology/jyotish',
    '/en/pedia/what-is-tithi-lunar-day','/uk/pedia/what-is-tithi-lunar-day']
    .map(r=>'<loc>'+origin+r+'</loc>').join('')+'</urlset>':
   html(path,path.includes('panchanga')?
    '<a href="/'+path.split('/')[1]+'/pedia/panchanga-time-by-city">City</a>'+
    '<a href="/'+path.split('/')[1]+'/pedia/what-is-tithi-lunar-day">Tithi</a>':
   path.includes('astrology/jyotish')?
    '<a href="/'+path.split('/')[1]+'/pedia/vedic-ascendant-birth-time">Birth</a>'+
    '<a href="/'+path.split('/')[1]+'/pedia/how-to-read-vedic-d1-chart">D1</a>':
   path.includes('/tarot')?
    '<a href="/'+path.split('/')[1]+'/tarot/cards">Cards</a>'+
    '<a href="/'+path.split('/')[1]+'/tarot/cards/moon">Moon</a>':'');
  return {status:200,headers:new Headers({'content-type':path.endsWith('.xml')?'application/xml':'text/html'}),text:async()=>body};
 };
 const result=await runOrganicHealth({fetcher});
 assert.equal(result.errors.length,0,JSON.stringify(result.errors));
 assert.equal(result.indexingStatus,'unknown_requires_GSC_URL_Inspection');
 assert.ok(seen.every(x=>x.options.redirect==='manual'&&!x.options.body&&x.url.startsWith(origin+'/')));
 assert.equal(seen.length,14);
});
