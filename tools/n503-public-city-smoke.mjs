/**
 * N503 production geocoder smoke. Public API only; no private chart, birth date
 * or logged-in session. Check exact GeoNames city ID + IANA TZ, not name alone.
 */
const origin=(process.env.N503_SITE_ORIGIN||'https://galaxiora.com').replace(/\/$/,'');
const probes=[
 {q:'Kryvyi Rih',lang:'en',id:'703845'},
 {q:'Krivoy Rog',lang:'en',id:'703845'},
 {q:'Кривий Ріг',lang:'en',id:'703845'},
 {q:'Кривий Ріг',lang:'uk',id:'703845'},
 {q:'Kyiv',lang:'en',id:'703448'},
 {q:'Kremenchuk',lang:'en',id:'704147'},
 {q:'London',lang:'en',id:'2643743'},
 {q:'Mumbai',lang:'en',id:'1275339'}
];
for(const probe of probes){
 const url=origin+'/api/v1/panchanga/cities?'+new URLSearchParams({q:probe.q,lang:probe.lang});
 const response=await fetch(url,{signal:AbortSignal.timeout(10000),cache:'no-store'});
 if(!response.ok)throw Error('N503_SEARCH_HTTP_'+response.status+' query='+probe.q);
 const body=await response.json();
 const first=body.items?.[0];
 if(first?.id!==probe.id||!Number.isFinite(first.latitude)||
    !Number.isFinite(first.longitude)||!first.timeZone){
  throw Error('N503_SEARCH_MISMATCH query='+probe.q+' actualID='+(first?.id||'none'));
 }
 if(probe.id==='703845'){
  if(first.timeZone!=='Europe/Kyiv'||Math.abs(first.latitude-47.90572)>0.05||
    Math.abs(first.longitude-33.39404)>0.05)
   throw Error('N503_KRYVYI_LOCATION_MISMATCH');
 }
 console.log('N503_CITY_PASS '+probe.q+' ['+probe.lang+'] '+first.id+' '+first.timeZone);
}
console.log('N503_PUBLIC_CITY_SEARCH_VERIFIED');
