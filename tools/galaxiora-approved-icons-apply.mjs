/** Deprecated name; safe compatibility installer for the round approved galaxy. */
import {copyFileSync,mkdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const from=join(root,'apps/web/brand-assets/galaxiora-circle-64.png');
for(const file of ['apps/web/app/icon.png','apps/web/public/galaxiora-favicon.png']){
 const dest=join(root,file);mkdirSync(dirname(dest),{recursive:true});copyFileSync(from,dest);
 console.log('[round-galaxy] '+file);
}
