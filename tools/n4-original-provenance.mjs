/** Formal source-shape validation. Never independently proves JHora binary identity. */
export function validateN4JHoraCase(c){
 const match=/^N4-SYNTH-(\d{3})$/.exec(c?.id||'');
 if(!match||Number(match[1])<1||Number(match[1])>50)throw Error('Only N4-SYNTH-001 through 050 are allowed');
 if(c.referenceTool!=='Jagannatha Hora 8.0'||c.isRealPerson!==false)
  throw Error(c.id+': genuine JHora label and synthetic case are mandatory');
 if(!/\bINI SHA256 [a-f0-9]{64}\b/i.test(String(c.referenceSettings||''))||
    !String(c.referenceSettings).includes('D10Preference=0')||
    !String(c.referenceSettings).includes('D60Preference=0'))
  throw Error(c.id+': author JHora INI hash and identical pinned calculation options required');
 if(!/^[a-f0-9]{64}$/i.test(String(c.referenceSourceSha256||'')))
  throw Error(c.id+': valid SHA256 of original clipboard export required');
 return true;
}
