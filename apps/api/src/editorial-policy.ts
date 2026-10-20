/** A6 editorial domain/application policy — framework-free; no ORM or HTTP dependencies. */
export type EditorialKind='ACADEMY'|'YOGA';
export type EditorialStatus='DRAFT'|'IN_REVIEW'|'APPROVED'|'PUBLISHED'|'ARCHIVED';
export type EditorialRole='MEMBER'|'EXPERT'|'SUPPORT'|'ADMIN';
export type EditorialAction='submit'|'approve'|'reject'|'publish'|'archive'|'reopen';
export type Both={uk:string;en:string};
export type EditorialDocument={
 title:Both;summary:Both;body:Both;
 safety?:Both;
 quiz?:{question:Both;choices:[Both,Both,Both];correct:0|1|2;explanation:Both};
};
export type EditorialShape={kind:EditorialKind;slug:string;topic:string;document:EditorialDocument};
export class EditorialError extends Error{
 readonly code:'validation'|'permission'|'conflict'|'missing';
 constructor(code:'validation'|'permission'|'conflict'|'missing',message:string){super(message);this.code=code;this.name='EditorialError';}
}
export const EDITORIAL_KIND=['ACADEMY','YOGA'] as const;
export const EDITORIAL_TOPICS:{[key in EditorialKind]:readonly string[]}={
 ACADEMY:['jyotish','tarot','practice'],YOGA:['mobility','meditation']
};
export const EDITORIAL_TRANSITIONS:Record<EditorialAction,{from:readonly EditorialStatus[];to:EditorialStatus;admin:boolean}>={
 submit:{from:['DRAFT'],to:'IN_REVIEW',admin:false},
 approve:{from:['IN_REVIEW'],to:'APPROVED',admin:true},
 reject:{from:['IN_REVIEW','APPROVED'],to:'DRAFT',admin:true},
 publish:{from:['APPROVED'],to:'PUBLISHED',admin:true},
 archive:{from:['PUBLISHED'],to:'ARCHIVED',admin:true},
 reopen:{from:['ARCHIVED'],to:'DRAFT',admin:true}
};
function fail(reason:string):never{throw new EditorialError('validation',reason);}
function required(value:unknown,label:string,min:number,max:number){
 if(typeof value!=='string'||value.trim().length<min||value.length>max)fail(label+' must contain '+min+'–'+max+' characters');
 if(/\u0000|\u000b|\u000c/.test(value))fail(label+' contains invalid control characters');
 return value.trim();
}
function both(input:unknown,label:string,min:number,max:number):Both{
 if(!input||typeof input!=='object'||Array.isArray(input))fail(label+' must contain uk and en');
 const src=input as Record<string,unknown>;
 if(Object.keys(src).some(key=>!['uk','en'].includes(key)))fail(label+' has unknown language');
 return {uk:required(src.uk,label+'.uk',min,max),en:required(src.en,label+'.en',min,max)};
}
export function validateEditorial(kind:unknown,slug:unknown,topic:unknown,input:unknown):EditorialShape{
 if(kind!=='ACADEMY'&&kind!=='YOGA')fail('Invalid content kind');
 if(typeof slug!=='string'||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80)
  fail('Slug must contain lowercase ASCII words separated by hyphens (up to 80 characters)');
 const reserved:Record<EditorialKind,readonly string[]>={
  ACADEMY:['sidereal-and-tropical','nakshatras','divisional-charts','tarot-questions','tarot-reversals','mindful-practice','yoga-roots-and-safety'],
  YOGA:['gentle-breath','desk-mobility','five-senses','evening-unwind']
 };
 if(reserved[kind].includes(slug))fail('This slug belongs to the protected A5 content library');
 if(typeof topic!=='string'||!EDITORIAL_TOPICS[kind].includes(topic))fail('Topic not allowed for content kind');
 if(!input||typeof input!=='object'||Array.isArray(input))fail('Invalid editorial document');
 const doc=input as Record<string,unknown>;
 const allowed=kind==='ACADEMY'?['title','summary','body','quiz']:['title','summary','body','safety'];
 if(Object.keys(doc).some(k=>!allowed.includes(k)))fail('Unexpected editorial field');
 const title=both(doc.title,'title',5,150),summary=both(doc.summary,'summary',20,480);
 const body=both(doc.body,'body',kind==='ACADEMY'?150:80,18000);
 if(kind==='ACADEMY'){
  const q=doc.quiz;
  if(!q||typeof q!=='object'||Array.isArray(q))fail('Academy quiz required');
  const quiz=q as Record<string,unknown>;
  if(Object.keys(quiz).some(k=>!['question','choices','correct','explanation'].includes(k)))fail('Unexpected quiz field');
  if(!Array.isArray(quiz.choices)||quiz.choices.length!==3)fail('Exactly three quiz choices required');
  if(![0,1,2].includes(quiz.correct as number))fail('Quiz correct answer must be 0, 1 or 2');
  return {kind,slug,topic,document:{title,summary,body,quiz:{
   question:both(quiz.question,'quiz.question',10,300),
   choices:quiz.choices.map((c,i)=>both(c,'quiz.choice'+i,2,160)) as [Both,Both,Both],
   correct:quiz.correct as 0|1|2,
   explanation:both(quiz.explanation,'quiz.explanation',15,500)
  }}};
 }
 return {kind,slug,topic,document:{title,summary,body,safety:both(doc.safety,'safety',30,700)}};
}
export function canWrite(role:EditorialRole){return role==='ADMIN'||role==='SUPPORT';}
export function transitionPolicy(action:EditorialAction,status:EditorialStatus,role:EditorialRole){
 const rule=EDITORIAL_TRANSITIONS[action];
 if(!rule)throw new EditorialError('validation','Unknown editorial action');
 if(!canWrite(role)||rule.admin&&role!=='ADMIN')throw new EditorialError('permission','Insufficient editorial permission');
 if(!rule.from.includes(status))throw new EditorialError('conflict','Cannot '+action+' while status is '+status);
 return rule.to;
}
export function mayEdit(role:EditorialRole,status:EditorialStatus){
 if(!canWrite(role))throw new EditorialError('permission','Editor role required');
 if(status!=='DRAFT')throw new EditorialError('conflict','Only draft content may be edited');
}
