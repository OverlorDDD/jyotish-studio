/** Regression: production must not generate OpenAPI reflection metadata under tsx.
 * esbuild/tsx does not emit design:paramtypes and 2026-10-30 production crashed
 * at @nestjs/swagger ParameterMetadataAccessor during SwaggerModule.createDocument.
 * Swagger is not served on public Galaxiora; endpoint /api/docs stays 404.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../apps/api/src/main.ts',import.meta.url),'utf8');
const proxy=readFileSync(new URL('../apps/web/middleware.ts',import.meta.url),'utf8');
test('production bootstrap never enumerates Swagger under tsx',()=>{
 assert.doesNotMatch(main,/SwaggerModule\.createDocument\s*\(/);
 assert.doesNotMatch(main,/SwaggerModule\.setup\s*\(/);
 assert.match(main,/await app\.listen\(/);
});
test('public proxy hides Swagger docs',()=>{
 assert.match(proxy,/startsWith\('\/api\/docs'\)/);
 assert.match(proxy,/status:404/);
});
