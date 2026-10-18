import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TAROT_DECK,SPREADS,drawCards,describeDraws} from '../apps/api/src/tarot-deck.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Tarot: exactly 78 unique cards, full localized upright/reversed meanings',()=>{
 assert.equal(TAROT_DECK.length,78);
 assert.equal(new Set(TAROT_DECK.map(c=>c.id)).size,78);
 for(const card of TAROT_DECK)for(const field of ['name','upright','reversed']){
  assert.ok(card[field].uk.length>=(field==='name'?2:5),card.id+' '+field+' uk');
  assert.ok(card[field].en.length>=(field==='name'?2:5),card.id+' '+field+' en');
 }
});
test('Tarot: 1 / 3 / 10 cards never repeat within a spread, correct labels',()=>{
 for(const spread of ['one','three','celtic']){
  assert.equal(SPREADS[spread].length,spread==='one'?1:spread==='three'?3:10);
  for(let sample=0;sample<20;sample++){
   const drawn=drawCards(spread);
   assert.equal(drawn.length,SPREADS[spread].length);
   assert.equal(new Set(drawn.map(c=>c.id)).size,drawn.length);
   assert.ok(drawn.every(c=>typeof c.reversed==='boolean'));
   const complete=describeDraws(drawn,spread);
   assert.ok(complete.every(c=>c.positionName.uk&&c.meaning.en));
  }
 }
});
test('Admin: role updates require DB-backed ADMIN session and produce audit',()=>{
 const code=read('apps/api/src/admin.ts');
 for(const needle of ["user.role!=='ADMIN'","actor?.role!=='ADMIN'","sameOrigin(req)","actorId===targetId","admins<=1","tx.roleChange.create","isolationLevel:'Serializable'"]){
  assert.ok(code.includes(needle),needle);
 }
 assert.ok(code.includes("select:{id:true,email:true,role:true,createdAt:true"));
 assert.ok(!code.includes('passwordHash'));
});
test('Bootstrap admin only through local terminal and explicit account confirmation',()=>{
 const code=read('tools/setup-owner.mjs');
 for(const needle of ["process.stdin.isTTY","users.forEach","PROMOTE ","role:'ADMIN'","existing!==0"]){
  assert.ok(code.includes(needle),needle);
 }
 assert.ok(!code.includes('http.createServer'));
});
test('Tarot quota requires authenticated user and locks row before count/create',()=>{
 const code=read('apps/api/src/tarot.ts');
 for(const needle of ["requireUser(req)","cookieUser(req)","FOR UPDATE","FREE_LIMIT=3","used>=FREE_LIMIT","sameOrigin(req)","this.prisma.$transaction","describeDraws(drawn"]){
  assert.ok(code.includes(needle),needle);
 }
 assert.ok(code.includes("where:{userId}"));
 const page=read('apps/web/app/components/PortalSection.tsx');
 assert.ok(page.includes("<TarotStudio locale={locale}/>"));
});
test('Database migrations add roles audit and Tarot without dropping charts',()=>{
 const sql=read('apps/api/prisma/migrations/20261018193000_role_audit_tarot/migration.sql');
 assert.ok(sql.includes('CREATE TABLE "RoleChange"'));
 assert.ok(sql.includes('CREATE TABLE "TarotReading"'));
 assert.ok(!sql.includes('DROP TABLE'));
});
