import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newsOperationalHealth} from '../apps/api/src/news-operational.ts';
import {newsIngestionEnabled} from '../apps/api/src/news-operational.ts';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=new Date('2026-11-01T08:00:00.000Z');
const minutes=n=>new Date(now.getTime()-n*60000);
const base={enabled:true,now,lastScanAt:minutes(10),lastDiscoveredAt:minutes(25),lastPublishedAt:minutes(30)};
test('Production API news scheduler starts by default, explicit OFF and test environment remain safe',()=>{
 assert.equal(newsIngestionEnabled({NODE_ENV:'production'},[]),true);
 assert.equal(newsIngestionEnabled({NODE_ENV:'production',NEWS_INGESTION_ENABLED:'0'},[]),false);
 assert.equal(newsIngestionEnabled({NODE_ENV:'test'},[]),false);
 assert.equal(newsIngestionEnabled({NODE_ENV:'production',CI:'true'},[]),false);
 assert.equal(newsIngestionEnabled({NODE_ENV:'development'},['/some/src/main.ts']),true);
 assert.equal(newsIngestionEnabled({NODE_ENV:'development'},['tools/news-repair.mjs']),false);
});
test('Operational status distinguishes scheduler outage from lack of accepted news',()=>{
 assert.equal(newsOperationalHealth(base).state,'healthy');
 assert.equal(newsOperationalHealth({...base,enabled:false}).state,'disabled');
 assert.equal(newsOperationalHealth({...base,lastScanAt:null}).state,'never_scanned');
 assert.equal(newsOperationalHealth({...base,lastScanAt:minutes(90)}).state,'scan_stale');
 assert.equal(newsOperationalHealth({...base,lastDiscoveredAt:minutes(36*60+1)}).state,'feed_stale');
 assert.equal(newsOperationalHealth({...base,lastDiscoveredAt:null}).state,'feed_stale');
 assert.equal(newsOperationalHealth({...base,recentErrors:3}).state,'degraded');
});
test('News dates show persisted discoveredAt instead of a source publication timestamp',()=>{
 const status=newsOperationalHealth({...base,lastPublishedAt:minutes(4*24*60)});
 assert.equal(status.lastNewArticleAgeMinutes,25);
 assert.equal(status.latestPublisherDate,minutes(4*24*60).toISOString());
 assert.equal(status.scanAgeMinutes,10);
 assert.equal(status.reason,'updating');
 assert.equal(newsOperationalHealth({...base,lastScanAt:new Date('invalid')}).state,'never_scanned');
});
test('Admin and news status are private/no-store and avoid silent manual refresh success',()=>{
 const news=src('apps/api/src/news.ts'),admin=src('apps/api/src/admin.ts');
 const panel=src('apps/web/app/components/NewsDiagnostics.tsx');
 const dashboard=src('apps/web/app/components/AdminDashboard.tsx');
 assert.match(news,/@Get\('admin\/health'\) @Header\('Cache-Control','private,no-store'\)/);
 assert.match(news,/return this\.ingestion\.requestManualRefresh\(/);
 assert.match(news,/newsOperationalHealth\(/);
 assert.match(news,/runtime:this\.ingestion\.runtimeStatus\(\)/);
 assert.match(admin,/@Get\('overview'\) @Header\('Cache-Control','private,no-store'\)/);
 assert.match(dashboard,/setInterval\(/);
 assert.match(dashboard,/newUsers7d/);
 assert.match(panel,/news-operational-health/);
 assert.match(panel,/lastNewArticleAt/);
 assert.doesNotMatch(panel,/Редактор AI/);
});
