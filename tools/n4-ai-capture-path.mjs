import path from 'node:path';
/** Cross-platform absolute destination, always outside the current source checkout. */
export function n4SafeLocalOutput(file,cwd=process.cwd(),paths=path){
 if(typeof file!=='string'||!paths.isAbsolute(file))
  throw Error('Require an absolute local output path (Windows drive or POSIX path)');
 const dest=paths.resolve(file),root=paths.resolve(cwd),rel=paths.relative(root,dest);
 if(!rel||(!paths.isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+paths.sep)))
  throw Error('Refusing to store model responses under Git repository');
 if(paths.sep===String.fromCharCode(92)&&dest.startsWith(String.fromCharCode(92,92)))
  throw Error('Network share is not an approved local audit destination');
 return dest;
}
