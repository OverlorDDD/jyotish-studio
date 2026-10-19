import test from 'node:test';
import assert from 'node:assert/strict';
import {publicUser,effectiveSubscription} from '../apps/api/src/account-policy.ts';
import {ChangeRoleUseCase,RoleChangeError} from '../apps/api/src/admin-role-application.ts';
import {SavedChartUseCases,SavedChartError} from '../apps/api/src/chart-application.ts';
import {JyotishReportUseCases} from '../apps/api/src/jyotish-report-application.ts';

const user={id:'u1',email:'user@example.invalid',role:'MEMBER',subscriptionTier:'PREMIUM',subscriptionEndsAt:new Date('2026-11-01T00:00:00Z')};
test('A3 identity policy: subscription expiry is separate from staff role',()=>{
 const now=new Date('2026-10-19T00:00:00Z');
 assert.equal(effectiveSubscription(user,now),'PREMIUM');
 assert.equal(effectiveSubscription(user,new Date('2026-11-01T00:00:00Z')),'FREE');
 const publicRecord=publicUser(user,now);
 assert.deepEqual(publicRecord.subscription,{tier:'PREMIUM',currentPeriodEnd:'2026-11-01T00:00:00.000Z'});
 assert.equal(publicRecord.role,'MEMBER');
 assert.equal('passwordHash' in publicRecord,false);
});

test('A3 role change: application rejects self, invalid target, delegates trusted actor only',async()=>{
 const calls=[];
 const useCase=new ChangeRoleUseCase({async changeAtomically(...args){calls.push(args);return {changed:true,role:args[2]};}});
 await assert.rejects(useCase.execute('same','same','ADMIN'),err=>err instanceof RoleChangeError&&err.code==='self_change');
 await assert.rejects(useCase.execute('actor','not-uuid','ADMIN'),err=>err.code==='invalid_id');
 assert.equal(calls.length,0);
 const result=await useCase.execute('actor','12345678-1234-1234-1234-123456789abc','SUPPORT');
 assert.deepEqual(result,{changed:true,role:'SUPPORT'});
 assert.deepEqual(calls[0],['actor','12345678-1234-1234-1234-123456789abc','SUPPORT']);
});
function fakeCharts(){
 const rows=new Map();let count=0,reportCalls=0,calculateCalls=0;
 const store={
  async count(owner){return [...rows.values()].filter(x=>x.owner===owner).length;},
  async list(owner){return [...rows.values()].filter(x=>x.owner===owner);},
  async find(owner,id){const x=rows.get(id);return x?.owner===owner?x:null;},
  async create(owner,chart,report){
   count++;const id='c'+count;const saved={id,owner,createdAt:new Date('2026-10-19T10:00:00Z'),
    input:chart.input,result:chart,savedReport:report};
   rows.set(id,saved);return {id,createdAt:saved.createdAt};
  },
  async delete(owner,id){if(rows.get(id)?.owner!==owner)return false;return rows.delete(id);}
 };
 const calculator=async input=>{calculateCalls++;return {input,ascendant:{signName:'Aries'},dasha:[{lord:'Sun'}]};};
 const report=(chart,lang,asOf)=>{reportCalls++;return {language:lang,asOf,dasha:chart.dasha};};
 const now=()=>new Date('2026-10-19T10:00:00Z');
 return {app:new SavedChartUseCases(store,calculator,report,now),report,
  counters:()=>({calculateCalls,reportCalls})};
}
const birth={date:'2000-01-01',time:'12:00',timeZone:'Europe/Kyiv',latitude:48,longitude:33,place:'Kryvyi Rih'};
test('A3 chart application: deterministic report, private list/detail/legacy/dashas/delete',async()=>{
 const {app}=fakeCharts();
 const saved=await app.save('alice',{...birth,language:'uk'});
 const detail=await app.detail('alice',saved.id);
 assert.equal(detail.chart.ascendant.signName,'Aries');
 assert.equal(detail.report.language,'uk');
 assert.equal(detail.report.asOf,'2026-10-19');
 assert.equal(detail.report.ai.fallbackReason,'local_only');
 assert.equal((await app.list('alice')).length,1);
 assert.equal((await app.list('bob')).length,0);
 assert.equal((await app.legacy('alice',saved.id)).id,saved.id);
 assert.deepEqual((await app.dashas('alice',saved.id)).dasha,[{lord:'Sun'}]);
 await assert.rejects(app.detail('bob',saved.id),err=>err instanceof SavedChartError&&err.code==='not_found');
 await assert.rejects(app.remove('bob',saved.id),err=>err.code==='not_found');
 assert.deepEqual(await app.remove('alice',saved.id),{deleted:true});
 assert.equal((await app.list('alice')).length,0);
});
test('A3 chart application: limit fails before calculation; invalid birth is domain error',async()=>{
 const {app,counters}=fakeCharts();
 const input={...birth};
 for(let i=0;i<100;i++)await app.save('alice',input);
 await assert.rejects(app.save('alice',input),err=>err.code==='limit');
 assert.equal(counters().calculateCalls,100);
 const bad=new SavedChartUseCases(
  {count:async()=>0,list:async()=>[],find:async()=>null,create:async()=>({id:'x',createdAt:new Date()}),delete:async()=>false},
  async()=>{throw Error('bad location');},()=>({}));
 await assert.rejects(bad.save('alice',input),err=>err.code==='invalid_birth'&&err.message==='bad location');
});
test('A3 Jyotish report application: input passed server-side, UK/EN and asOf kept',async()=>{
 const calls=[];
 const app=new JyotishReportUseCases(async input=>{calls.push({input});return {dasha:[]};},
  (chart,lang,asOf)=>{calls.push({lang,asOf});return {lang,asOf,dasha:chart.dasha};},
  ()=>new Date('2026-10-19T12:00:00Z'));
 const outcome=await app.prepare({...birth,asOf:'2026-10-20'},'uk');
 assert.equal(outcome.report.lang,'uk');assert.equal(outcome.asOf,'2026-10-20');
 assert.deepEqual(outcome.chart.dasha,[]);
 assert.deepEqual(calls[0].input,{...birth,asOf:'2026-10-20'});
 await app.calculate(birth);
 assert.equal(calls.length,3);
});
test('A3 module borders: business/application files contain no Prisma or Nest imports',async()=>{
 const {readFileSync}=await import('node:fs');
 for(const path of ['account-policy.ts','admin-role-application.ts','chart-application.ts','jyotish-report-application.ts']){
  const src=readFileSync(new URL('../apps/api/src/'+path,import.meta.url),'utf8');
  assert.doesNotMatch(src,/from ['"]@nestjs\/|from ['"]@prisma\//,path);
 }
});
