#!/usr/bin/env node
/**
 * Galaxiora Google-facing favicon source audit.
 * Checks actual served binary bytes and root discovery; not Google SERP cache.
 * Usage: node tools/google-favicon-production-audit.mjs [https://galaxiora.com]
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const origin=(process.argv[2]||'https://galaxiora.com').replace(/\\/$/,'');
if(!/^https?:\/\//.test(origin))throw Error('URL must have http(s) origin');
const source=readFileSync(new URL('../apps/web/brand-assets/galaxiora-approved-spiral-6.png',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
const known=sha(source);
const log={origin,approvedSha256:known,checks:[]};
function check(name,truth){if(!truth)throw Error('FAVICON_SOURCE_BLOCKED '+name);log.checks.push(name);}
async function request(path,{agent}={}){
 const headers={'cache-control':'no-cache',...(agent?{'user-agent':agent}:{})};
 const res=await fetch(origin+path,{headers,signal:AbortSignal.timeout(18000)});
 check('HTTP_'+res.status+'_'+path,res.ok);
 const b=Buffer.from(await res.arrayBuffer());
 return {b,headers:res.headers,txt:b.toString('utf8')};
}
const root=await request('/');
check('canonical_root_http_200',root.txt.includes('Free Vedic Birth Chart Calculator'));
check('indexable_root',!/<meta[^>]+name="robots"[^>]+content="noindex/i.test(root.txt));
const tags=[...root.txt.matchAll(/<link\b[^>]*\brel="icon"[^>]*>/gi)].map(x=>x[0]);
check('single_icon_link',tags.length===1);
check('canonical_stable_png',tags[0].includes('/galaxiora-favicon.png')&&!tags[0].includes('?'));
check('no_shortcut_icon_link',!/<link\b[^>]*\brel="shortcut icon"/i.test(root.txt));
check('no_retired_svg_link',!/<link\b[^>]*href="[^"]*icon\.svg"/i.test(root.txt));
const robots=await request('/robots.txt');
check('robots_no_block_all',!/User-Agent:\s*\*\s*Disallow:\s*\//i.test(robots.txt));
const primary=await request('/galaxiora-favicon.png');
check('png_matches_approved_source',sha(primary.b)===known);
check('png_content_type',primary.headers.get('content-type')?.includes('image/png'));
const google=await request('/galaxiora-favicon.png',{agent:'Googlebot-Image/1.0'});
check('googlebot_image_access',sha(google.b)===known);
const next=await request('/icon.png');
check('next_icon_matches_approved_source',sha(next.b)===known);
const ico=await request('/favicon.ico');
check('ico_embeds_approved_64px_frame',ico.b.includes(source));
check('ico_mime',/(image\/(vnd\.microsoft\.icon|x-icon|ico)|application\/octet-stream)/i.test(ico.headers.get('content-type')||''));
for(const path of ['/apple-touch-icon.png','/galaxiora-logo-128.png']){
 const b=await request(path);
 check('image_png_'+path,b.headers.get('content-type')?.includes('image/png')&&b.b.length>200);
}
console.log(JSON.stringify(log,null,2));
console.log('GALAXIORA_FAVICON_SOURCE_VERIFIED');
console.log('GOOGLE_SEARCH_RESULT_CACHE_NOT_VERIFIED: Google decides when to refresh its SERP icon');
