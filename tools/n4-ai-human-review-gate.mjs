/** Pure scoring of TWO local blind reviewer exports; never claims independent human identity. */
export const N4_HUMAN_REVIEW_VERSION='n4-blind-human-review-v1';
export function evaluateN4HumanEditorialReviews(reviews){
 if(!Array.isArray(reviews)||reviews.length!==2)throw Error('Two distinct reviewer exports are required');
 const errors=[],winnerCounts={left:0,right:0,tie:0,neither:0};
 const all=[];
 for(let reviewer=0;reviewer<2;reviewer++){
  const source=reviews[reviewer];
  if(source?.schema!==N4_HUMAN_REVIEW_VERSION||!Array.isArray(source.rows)||source.rows.length!==24)
   throw Error('Missing or incompatible human review set '+(reviewer+1));
  const seen=new Set();
  for(const row of source.rows){
   const match=/^n4-(0[1-9]|1[0-2])-(uk|en)$/.exec(row.pair||'');
   if(!match||seen.has(row.pair))throw Error('Invalid or duplicated human review pair');
   seen.add(row.pair);
   if(!['left','right','tie','neither'].includes(row.preferred))
    errors.push({pair:row.pair,reviewer:reviewer+1,reason:'no_preference'});
   else winnerCounts[row.preferred]++;
   if(row.critical===true)errors.push({pair:row.pair,reviewer:reviewer+1,reason:'critical_factual_or_privacy_failure'});
   if(!Array.isArray(row.scores)||row.scores.length!==6||
      row.scores.some(n=>!Number.isInteger(n)||n<0||n>4))
    errors.push({pair:row.pair,reviewer:reviewer+1,reason:'incomplete_six_dimension_rubric'});
   else if(row.scores.some(n=>n<3))
    errors.push({pair:row.pair,reviewer:reviewer+1,reason:'one_or_more_rubric_scores_below_three'});
   if(row.preferred==='neither')errors.push({pair:row.pair,reviewer:reviewer+1,reason:'both_versions_unsatisfactory'});
   all.push(row.pair);
  }
 }
 if(new Set(all).size!==24)throw Error('Expected all 24 synthetic chart/language pairs');
 const status=errors.length?'EDITORIAL_HUMAN_GATES_NOT_MET':'ELIGIBLE_FOR_MANUAL_EDITOR_SIGNOFF';
 return {status,reviewFiles:2,pairs:24,observations:48,issues:errors,
  choices:winnerCounts,independentReviewersVerified:false,
  actualProviderCorpusVerifiedHere:false,rawTextInOutput:false,
  note:'Two exports do not prove distinct human reviewers. Review provider corpus gate separately; final approval remains manual.'};
}
