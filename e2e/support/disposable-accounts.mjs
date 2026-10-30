/** Only disposable CI fixtures. Never bypass public signup on production. */
import {PrismaClient} from '@prisma/client';
import {randomBytes,scrypt as scryptCallback} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);

async function hashTestPassword(password){
 const salt=randomBytes(16).toString('hex');
 const derived=await scrypt(password,salt,64);
 return ['scrypt',salt,derived.toString('hex')].join('$');
}
export async function fixtureIdentity({data}){
 const raw=process.env.DATABASE_URL||'';
 let url;
 try{url=new URL(raw)}
 catch{throw new Error('Fixtures require an isolated disposable PostgreSQL database')}
 if(!['postgres:','postgresql:'].includes(url.protocol)||
    !['localhost','127.0.0.1'].includes(url.hostname)||
    url.pathname!=='/galaxiora_a1_test'||
    process.env.CI!=='true')
  throw new Error('Refusing browser account fixtures outside disposable CI PostgreSQL');
 const {email,password}=data||{};
 if(!/^[-\w.+]+@example\.invalid$/i.test(email||'')||
    typeof password!=='string'||password.length<12)
  throw new Error('Fixture must use example.invalid email and 12+ character password');
 const client=new PrismaClient();
 try{
  await client.user.create({data:{email:email.toLowerCase(),
    passwordHash:await hashTestPassword(password)}});
 }finally{await client.$disconnect()}
 return {email,password};
}
export async function fixtureAccount(pageOrRequest,{data}){
 const {email,password}=await fixtureIdentity({data});
 const request=pageOrRequest.request||pageOrRequest;
 return request.post('/api/v1/account/login',{data:{email,password}});
}
