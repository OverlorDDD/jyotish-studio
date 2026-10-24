import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownsJournalReference,normalizedJournalText,isPublishedPractice,PRACTICE_SLUGS} from '../apps/api/src/personal-journal-policy.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const id='123e4567-e89b-42d3-a456-426614174000';
test('A9.2 notes are bounded, trimmed and never accept empty or oversized text',()=>{
 assert.equal(normalizedJournalText('   особиста нотатка  '),'особиста нотатка');
 assert.equal(normalizedJournalText('    '),null);
 assert.equal(normalizedJournalText('x'.repeat(2001)),null);
 assert.equal(normalizedJournalText(null),null);
 assert.equal(normalizedJournalText('x'.repeat(2000)).length,2000);
});
test('A9.2 private journal references must belong to authenticated user',async()=>{
 let checked=[];
 const owner='user-123';
 const db={
  tarotReading:{count:async ({where})=>{checked.push(where);return where.userId===owner&&where.id===id?1:0;}},
  chart:{count:async ({where})=>{checked.push(where);return where.ownerId===owner&&where.id===id?1:0;}}
 };
 assert.equal(await ownsJournalReference(db,owner,'TAROT',id),true);
 assert.equal(await ownsJournalReference(db,owner,'CHART',id),true);
 assert.equal(await ownsJournalReference(db,'attacker','TAROT',id),false);
 assert.equal(await ownsJournalReference(db,'attacker','CHART',id),false);
 assert.equal(await ownsJournalReference(db,owner,'TAROT','not-a-uuid'),false);
 assert.equal(checked.length,4);
 assert.ok(checked.every(x=>x.userId||x.ownerId));
});
test('A9.2 yoga slugs exactly match published practice catalogue',async()=>{
 assert.equal(PRACTICE_SLUGS.length,4);
 const practice=read('apps/web/lib/yoga-content.ts');
 for(const slug of PRACTICE_SLUGS){
  assert.ok(practice.includes("slug:'"+slug+"'"),slug);
  assert.equal(isPublishedPractice(slug),true);
  assert.equal(await ownsJournalReference({},'signed','PRACTICE',slug),true);
 }
 assert.equal(isPublishedPractice('../admin'),false);
 assert.equal(await ownsJournalReference({},'signed','PRACTICE','fake'),false);
});
test('A9.2 migration owns journal and activity by User with cascading deletion',()=>{
 const sql=read('apps/api/prisma/migrations/20261024110000_a9_personal_journal/migration.sql');
 const schema=read('apps/api/prisma/schema.prisma');
 assert.ok(sql.includes('CREATE TABLE "PersonalJournalEntry"'));
 assert.ok(sql.includes('CREATE TABLE "PracticeCompletion"'));
 assert.ok(sql.includes('ON DELETE CASCADE'));
 assert.ok(sql.includes('"PersonalJournalEntry_ownerId_kind_referenceId_key"'));
 assert.ok(schema.includes('journalEntries PersonalJournalEntry[]'));
 assert.ok(schema.includes('practiceCompletions PracticeCompletion[]'));
 assert.ok(!sql.includes('DROP TABLE'));
});
test('A9.2 private API checks signed cookie and CSRF before writes',()=>{
 const src=read('apps/api/src/personal-journal.ts');
 for(const verb of ["@Put('journal')","@Delete('journal/:id')","@Post('practices')"])
  assert.ok(src.includes(verb),verb);
 assert.equal(src.split('ensureOrigin(req);').length-1,3);
 assert.ok(src.includes("signedIn(req)"));
 assert.ok(src.includes("ownsJournalReference(this.prisma,ownerId"));
 assert.ok(src.includes("deleteMany({where:{id,ownerId}})"));
 assert.ok(!src.includes('createHumanAiTarot'));
});
