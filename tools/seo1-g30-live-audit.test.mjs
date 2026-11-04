import test from 'node:test';
import assert from 'node:assert/strict';
import {audit,originAllowed,pageSignals} from './seo1-g30-live-audit.mjs';

const origin='https://galaxiora.com';
function html(path,{wrongCanonical=false,noindex=false,noBreadcrumb=false}={}){
 const language=path.startsWith('/uk')?'uk':'en';
 const suffix=path.slice(3);
 return '<!doctype html><html lang="'+language+'"><head>'+
  '<title>Galaxiora public page</title>'+
  '<link rel="canonical" href="'+origin+(wrongCanonical?'/en':path)+'">'+
  '<link rel="alternate" hreflang="en" href="'+origin+'/en'+suffix+'">'+
  '<link rel="alternate" hreflang="uk" href="'+origin+'/uk'+suffix+'">'+
  (noindex?'<meta name="robots" content="noindex">':'')+
  '</head><body><h1>Galaxiora</h1>'+
  (path.includes('/pedia/')&&!noBreadcrumb?'<nav aria-label="Breadcrumbs">GalaxiPedia</nav>':'')+
  '</body></html>';
}
function fakeFetch(options={}){
 const calls=[];
 const required=['/en','/uk','/en/astrology/jyotish','/uk/astrology/jyotish',
 '/en/panchanga','/uk/panchanga','/en/tarot','/uk/tarot',
 '/en/pedia','/uk/pedia','/en/pedia/what-is-tithi-lunar-day','/uk/pedia/what-is-tithi-lunar-day'];
 const fetcher=async (url,init)=>{
  const path=new URL(url).pathname;
  calls.push({path,method:init.method,redirect:init.redirect});
  if(path==='/robots.txt')return new Response(
   'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /en/admin\nDisallow: /uk/admin\nDisallow: /en/personal\nDisallow: /uk/personal\nSitemap: '+origin+'/sitemap.xml\n',
   {status:200,headers:{'content-type':'text/plain'}});
  if(path==='/sitemap.xml')return new Response(
   '<?xml version="1.0"?><urlset>'+required.map(x=>'<url><loc>'+origin+x+'</loc></url>').join('')+'</urlset>',
   {status:200,headers:{'content-type':'application/xml'}});
  if(options.failPath===path)return new Response(html(path,{wrongCanonical:true,noindex:true,noBreadcrumb:true}),
   {status:200,headers:{'content-type':'text/html'}});
  return new Response(html(path),{status:200,headers:{'content-type':'text/html'}});
 };
 return {calls,fetcher};
}
test('SEO-1 live audit allows only safe production and localhost origins',()=>{
 for(const value of ['https://galaxiora.com','http://127.0.0.1:3000','http://localhost:3000'])
  assert.equal(originAllowed(value),true,value);
 for(const value of ['https://attacker.example','https://galaxiora.com.evil.com',
  'http://galaxiora.com','https://galaxiora.com/private',
  'https://user:pass@galaxiora.com','file:///etc/passwd'])
  assert.equal(originAllowed(value),false,value);
});
test('SEO-1 audit validates canonical, hreflang, sitemap and visible Pedia breadcrumbs without writes',async()=>{
 const mock=fakeFetch();
 const result=await audit({origin,requirePedia:true,fetcher:mock.fetcher});
 assert.equal(result.summary.errors,0,JSON.stringify(result.failures));
 assert.equal(result.summary.pageCount,12);
 assert.equal(result.summary.indexingInGoogle,'unknown_requires_GSC_URL_Inspection');
 assert.equal(result.summary.realUserCWV,'unknown_requires_CrUX_or_PSI');
 assert.equal(result.summary.GA4Receipt,'unknown_requires_GA4_DebugView');
 assert.equal(mock.calls.length,14);
 assert.ok(mock.calls.every(x=>x.method==='GET'&&x.redirect==='manual'));
 assert.ok(mock.calls.every(x=>!x.path.startsWith('/api/')&&!x.path.includes('/personal')));
});
test('SEO-1 audit reports broken canonical, noindex and breadcrumb navigation separately',async()=>{
 const mock=fakeFetch({failPath:'/en/pedia/what-is-tithi-lunar-day'});
 const result=await audit({origin,requirePedia:true,fetcher:mock.fetcher});
 assert.ok(result.summary.errors>=3,JSON.stringify(result.failures));
 const failed=result.failures.map(x=>x.assertion);
 for(const marker of ['CANONICAL','INDEXABLE','BREADCRUMB_NAV'])assert.ok(failed.includes(marker),marker);
});
test('SEO-1 parser rejects incorrect locale and alternate path, never mislabels GSC index status',()=>{
 const s=pageSignals(html('/en/tarot'),'/uk/tarot',origin);
 assert.equal(s.htmlLang,'en');
 assert.equal(s.languagesCorrect,false);
 assert.equal(s.canonicalCorrect,false);
 assert.equal(s.indexable,true);
});
