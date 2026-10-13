/** No network/DB required. Checks the workspace wiring before first Docker setup. */
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root=JSON.parse(file('package.json'));
const api=JSON.parse(file('apps/api/package.json'));
const web=JSON.parse(file('apps/web/package.json'));
const prisma=file('apps/api/prisma/schema.prisma');
const migration=file('apps/api/prisma/migrations/20261012190000_init/migration.sql');
const accountsMigration=file('apps/api/prisma/migrations/20261013143000_user_owned_charts/migration.sql');
const nest=file('apps/api/src/nest.ts');
assert.ok(root.workspaces.includes('apps/*')&&root.workspaces.includes('packages/*'));
assert.match(root.scripts['dev:full'],/concurrently/);
assert.match(api.scripts['prisma:migrate'],/migrate deploy/);
assert.match(web.scripts.dev,/next dev/);
for(const model of ['Chart','Interpretation']){
 assert.ok(prisma.includes(`model ${model} {`));
 assert.ok(migration.includes(`CREATE TABLE "${model}"`));
}
assert.match(prisma,/model User \\{/);
assert.match(prisma,/ownerId/);
assert.match(prisma,/savedReport/);
assert.match(accountsMigration,/CREATE TABLE "User"/);
assert.match(accountsMigration,/ADD COLUMN "ownerId"/);
assert.match(nest,/PrismaService/);
assert.match(nest,/database:'connected'/);
assert.match(nest,/v1\/charts\/calculate/);
assert.ok(existsSync(new URL('../apps/api/prisma/migrations/migration_lock.toml',import.meta.url)));
console.log('PASS: workspace, Prisma migration, Nest routes, database readiness, Next.js wiring.');
console.log('NOTE: this is a static preflight, not a running PostgreSQL/Nest/Next verification.');
