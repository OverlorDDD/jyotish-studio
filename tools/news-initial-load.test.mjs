import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('debounced search never clears loaded articles on mount or input changes',()=>{
 const code=readFileSync(new URL('../apps/web/app/components/NewsWorld.tsx',import.meta.url),'utf8');
 const start=code.indexOf('useEffect(()=>{',code.indexOf('const [search,setSearch]'));
 const end=code.indexOf('},[search]);',start);
 assert.ok(start>=0&&end>start);
 const effect=code.slice(start,end);
 assert.match(effect,/setQuery\\(/);
 assert.doesNotMatch(effect,/setItems\\(\\[\\]\\)/);
});
