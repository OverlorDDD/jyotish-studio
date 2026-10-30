/**
 * Cache ONLY Next.js generated build artifacts after an actual Git revision change.
 * No user data, Prisma database, sources or site settings are ever removed.
 */
import {existsSync,lstatSync,readFileSync,rmSync,mkdirSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';

export function refreshDevNextCache(webDir,revision){
 if(!/^[a-f0-9]{7,40}$/i.test(revision))return {state:'no_revision'};
 const target=resolve(webDir,'.next');
 const expectedParent=realpathSync(webDir);
 if(dirname(target)!==resolve(webDir))throw Error('Unexpected Next.js cache location');
 if(existsSync(target)){
  if(lstatSync(target).isSymbolicLink())throw Error('Refusing to touch linked .next directory');
  if(realpathSync(target)!==join(expectedParent,'.next'))throw Error('Unsafe build cache location');
 }
 const marker=join(target,'.galaxiora-revision');
 const previous=existsSync(marker)?readFileSync(marker,'utf8').trim():null;
 if(previous===revision)return {state:'unchanged'};
 if(existsSync(target))rmSync(target,{recursive:true,force:true,maxRetries:5,retryDelay:200});
 mkdirSync(target,{recursive:true});
 writeFileSync(marker,revision+'\n','utf8');
 return {state:previous?'rebuild_for_updated_commit':'initial_dev_cache_cleanup'};
}
