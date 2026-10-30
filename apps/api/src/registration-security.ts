/** Fail-closed public signup: Cloudflare Turnstile + verified delivery through Resend. */
import {createHmac,randomInt,timingSafeEqual} from 'node:crypto';
import {ServiceUnavailableException,ForbiddenException} from '@nestjs/common';

export function registrationReady(env:NodeJS.ProcessEnv=process.env):boolean{
 return env.PUBLIC_REGISTRATION_ENABLED==='1'&&Boolean(env.AUTH_SECRET&&env.AUTH_SECRET.length>=32&&
  env.TURNSTILE_SECRET_KEY&&env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&
  env.RESEND_API_KEY&&env.RESEND_FROM_EMAIL&&env.NEXT_PUBLIC_SITE_URL);
}
export const registrationExpiryMs=15*60_000;
export const registrationCooldownMs=2*60_000;
export function registrationCode():string{return randomInt(0,1_000_000).toString().padStart(6,'0')}
export function registrationCodeDigest(email:string,code:string,secret=process.env.AUTH_SECRET||''):string{
 if(secret.length<32)throw new ServiceUnavailableException('Registration not configured');
 return createHmac('sha256',secret).update('galaxiora:signup:v1:'+email.toLowerCase()+':'+code).digest('hex');
}
export function secureCodeMatches(stored:string,input:string):boolean{
 if(!/^[a-f0-9]{64}$/.test(stored)||!/^[a-f0-9]{64}$/.test(input))return false;
 return timingSafeEqual(Buffer.from(stored,'hex'),Buffer.from(input,'hex'));
}
export async function verifySignupTurnstile(token:string,fetcher:typeof fetch=fetch,env=process.env):Promise<void>{
 if(!registrationReady(env))throw new ServiceUnavailableException('Public signup is not yet configured');
 if(!token||token.length>2048)throw new ForbiddenException('Complete the security check');
 let response:Response;
 try{
  response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
   method:'POST',signal:AbortSignal.timeout(10000),
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token})
  });
 }catch{throw new ServiceUnavailableException('Security verification unavailable; try again');}
 if(!response.ok)throw new ServiceUnavailableException('Security verification unavailable; try again');
 const result=await response.json() as {success?:boolean;hostname?:string;action?:string};
 const host=new URL(env.NEXT_PUBLIC_SITE_URL!).hostname;
 if(!result.success||result.action!=='register'||result.hostname!==host)
  throw new ForbiddenException('Security check failed; please retry');
}
export async function sendSignupVerification(email:string,code:string,
 fetcher:typeof fetch=fetch,env=process.env):Promise<void>{
 if(!registrationReady(env))throw new ServiceUnavailableException('Public signup is not yet configured');
 const from=env.RESEND_FROM_EMAIL!.trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from))
  throw new ServiceUnavailableException('Signup sender is misconfigured');
 let response:Response;
 try{
  response=await fetcher('https://api.resend.com/emails',{
   method:'POST',signal:AbortSignal.timeout(12000),
   headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.RESEND_API_KEY},
   body:JSON.stringify({from,to:[email],
    subject:'Galaxiora — email verification / підтвердження пошти',
    text:'Galaxiora verification code / Код підтвердження: '+code+
     '\nValid for 15 minutes / Дійсний 15 хвилин. If you did not request this, ignore this email.'})
  });
 }catch{throw new ServiceUnavailableException('Verification email could not be sent. Try again later');}
 if(!response.ok)throw new ServiceUnavailableException('Verification email could not be sent. Try again later');
}
