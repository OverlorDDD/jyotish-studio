/** G3.2.3 read-only editorial content plan. Never publishes or writes routes. */
import {ORGANIC_INTENTS} from '../apps/web/lib/organic-intents.ts';
import {PEDIA_ARTICLES} from '../apps/web/lib/pedia-content.ts';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const publishedSlugs=new Set(PEDIA_ARTICLES.map(x=>x.slug));
export function organicContentPlan(){
 return {stage:'G3.2.3',mode:'CURATED_EXISTING_PAGES',publishAutomatically:false,
  newIndexablePages:0,requiresEditorialApprovalForNewPages:true,
  assets:ORGANIC_INTENTS.map(topic=>({
   id:topic.id,existingLanding:['en','uk'].map(lang=>'/'+lang+'/'+topic.toolPath),
   value:'original bilingual practical explanation and crawlable internal links',
   validatedGuides:topic.guides.map(g=>{
    const isArticle=g.path.startsWith('pedia/');
    return {path:g.path,alreadyExists:!isArticle||publishedSlugs.has(g.path.split('/').pop())};
   }),
   futureNewArticlePolicy:'require verified search intent, distinct original value, methodology and editorial approval'
  })),
  constraints:['no city/date doorway pages','no keyword-stuffed templated pages','no invented lastmod',
   'no unverified calculations or muhurta','no new routes without distinct user utility']};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 console.log(JSON.stringify(organicContentPlan(),null,2));
}
