/** GalaxiCom C3: public-only content provenance. Never accept saved chart, reading or journal IDs. */
export type CommunitySourceKind='ACADEMY'|'YOGA';
export function communitySource(inputKind:unknown,inputSlug:unknown):{kind:CommunitySourceKind;slug:string}{
 if(inputKind!=='ACADEMY'&&inputKind!=='YOGA')throw new Error('Only public Academy and Practice materials are supported');
 if(typeof inputSlug!=='string'||inputSlug.length>80||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(inputSlug))
  throw new Error('Invalid public content slug');
 return {kind:inputKind,slug:inputSlug};
}
export function discussionCategory(kind:CommunitySourceKind,topic:string){
 if(kind==='YOGA')return 'practices';
 return topic==='tarot'?'tarot':topic==='jyotish'?'jyotish':'practices';
}
export function isApprovedContentLink(role:string){return role==='ADMIN';}
