import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ga4RealtimeConfigStatus,parseRealtimeActiveUsers,parseGa4Sessions} from '../apps/api/src/admin-ga4-realtime.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('GA4 Data API totals are parsed as genuine nonnegative integer active users',()=>{
 assert.equal(parseRealtimeActiveUsers({rows:[{metricValues:[{value:'7'}]}]}),7);
 assert.equal(parseRealtimeActiveUsers({rows:[]}),0);
 assert.equal(parseRealtimeActiveUsers({}),0);
 for(const x of [
  {rows:[{metricValues:[{value:'nan'}]}]},
  {rows:[{metricValues:[{value:'-2'}]}]},
  {rows:[{metricValues:[{value:'3.5'}]}]},
  {rows:[{metricValues:[{value:'1'}]},{metricValues:[{value:'2'}]}]},
  null
 ])assert.throws(()=>parseRealtimeActiveUsers(x));
});
test('GA4 Data API remains explicitly unavailable without server-only configuration',()=>{
 const oldId=process.env.GA4_PROPERTY_ID,oldKey=process.env.GA4_SERVICE_ACCOUNT_KEY_FILE;
 try{
  delete process.env.GA4_PROPERTY_ID;delete process.env.GA4_SERVICE_ACCOUNT_KEY_FILE;
  assert.equal(ga4RealtimeConfigStatus(),'not_configured');
  process.env.GA4_PROPERTY_ID='G-SZDVCT8TF4';
  process.env.GA4_SERVICE_ACCOUNT_KEY_FILE='/tmp/no-key.json';
  assert.equal(ga4RealtimeConfigStatus(),'invalid');
 }finally{
  if(oldId===undefined)delete process.env.GA4_PROPERTY_ID;else process.env.GA4_PROPERTY_ID=oldId;
  if(oldKey===undefined)delete process.env.GA4_SERVICE_ACCOUNT_KEY_FILE;else process.env.GA4_SERVICE_ACCOUNT_KEY_FILE=oldKey;
 }
});
test('Admin real-time endpoint cannot expose Google credentials or bypass ADMIN auth',()=>{
 const api=read('apps/api/src/admin.ts');
 const service=read('apps/api/src/admin-ga4-realtime.ts');
 const ui=read('apps/web/app/components/AdminDashboard.tsx');
 const panel=read('apps/web/app/components/AdminAnalyticsPanel.tsx');
 assert.match(api,/@Get\('traffic\/realtime'\)[\s\S]{0,220}await this\.requireAdmin\(req\)/);
 assert.match(api,/private,no-store/);
 assert.match(service,/auth\/analytics\.readonly/);
 assert.match(service,/analyticsdata\.googleapis\.com\/v1beta\/properties\//);
 assert.doesNotMatch(service,/user_id|email.*metric|birthDate|birthTime|TarotQuestion/);
 assert.match(ui,/\/api\/v1\/admin\/traffic\/realtime/);
 assert.match(panel,/traffic\?\.status==='not_configured'/);
 assert.match(panel,/gaStatus/);
 assert.match(panel,/Unavailable/);
 assert.match(panel,/activeUsers30m/);
});

test('GA4 sessions are explicitly separate from realtime active users',()=>{
 assert.equal(parseGa4Sessions({rows:[{metricValues:[{value:'19'}]}]}),19);
 assert.equal(parseGa4Sessions({rows:[]}),0);
 const ui=read('apps/web/app/components/AdminDashboard.tsx');
 const panel=read('apps/web/app/components/AdminAnalyticsPanel.tsx');
 assert.match(panel,/Visitor Analytics/);
 assert.match(panel,/sessions7d/);
 assert.match(panel,/public_html_request/);
 assert.equal((panel.match(/data-testid="ga4-active30"/g)||[]).length,1);
});
