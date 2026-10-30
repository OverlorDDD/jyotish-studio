/** Browser-only identity fixture: no bypass in public HTTP endpoints.
 * Refuses any real production or non-disposable database. */
import {PrismaClient} from '@prisma/client';
import {randomBytes,scrypt as scryptCallback} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
async function passwordHash(password){
 const salt=randomBytes(16).toString('hex');
 return 'scrypt
export async function fixtureIdentity({data}){
 const raw=process.env.DATABASE_URL||'';
 let url;
 try{url=new URL(raw)}catch{throw new Error('Fixture requires isolated disposable CI database')}
 if(!['postgres:','postgresql:'].includes(url.protocol)||
    !['localhost','127.0.0.1'].includes(url.hostname)||
    url.pathname!=='/galaxiora_a1_test'||
    process.env.CI!=='true')
  throw new Error('Refusing browser account fixtures on a real user database');
 const {email,password}=data||{};
 if(!/^[-\w.+]+@example\.invalid$/i.test(email||'')||
    !password||password.length<12)
  throw new Error('Test account must be on reserved example.invalid domain with valid password');
 const client=new PrismaClient();
 try{
  await client.user.create({data:{email:email.toLowerCase(),passwordHash:await passwordHash(password)}});
 }finally{await client.$disconnect()}
 return {email,password};
}
export async function fixtureAccount(pageOrRequest,{data}){
 const {email,password}=await fixtureIdentity({data});
 const request=pageOrRequest.request||pageOrRequest;
 return request.post('/api/v1/account/login',{data:{email,password}});
}
+salt+'
export async function fixtureAccount(pageOrRequest,{data}){
 const raw=process.env.DATABASE_URL||'';
 let url;
 try{url=new URL(raw)}catch{throw new Error('Fixture requires isolated disposable CI database')}
 if(!['postgres:','postgresql:'].includes(url.protocol)||
    !['localhost','127.0.0.1'].includes(url.hostname)||
    url.pathname!=='/galaxiora_a1_test'||
    process.env.CI!=='true')
  throw new Error('Refusing browser account fixtures on a real user database');
 const {email,password}=data||{};
 if(!/^[-\w.+]+@example\.invalid$/i.test(email||'')||
    !password||password.length<12)
  throw new Error('Test account must be on reserved example.invalid domain with valid password');
 const client=new PrismaClient();
 try{
  await client.user.create({data:{email:email.toLowerCase(),passwordHash:await passwordHash(password)}});
 }finally{await client.$disconnect()}
 const request=pageOrRequest.request||pageOrRequest;
 return request.post('/api/v1/account/login',{data:{email,password}});
}
+(await scrypt(password,salt,64)).toString('hex');
}
export async function fixtureAccount(pageOrRequest,{data}){
 const raw=process.env.DATABASE_URL||'';
 let url;
 try{url=new URL(raw)}catch{throw new Error('Fixture requires isolated disposable CI database')}
 if(!['postgres:','postgresql:'].includes(url.protocol)||
    !['localhost','127.0.0.1'].includes(url.hostname)||
    url.pathname!=='/galaxiora_a1_test'||
    process.env.CI!=='true')
  throw new Error('Refusing browser account fixtures on a real user database');
 const {email,password}=data||{};
 if(!/^[-\w.+]+@example\.invalid$/i.test(email||'')||
    !password||password.length<12)
  throw new Error('Test account must be on reserved example.invalid domain with valid password');
 const client=new PrismaClient();
 try{
  await client.user.create({data:{email:email.toLowerCase(),passwordHash:await passwordHash(password)}});
 }finally{await client.$disconnect()}
 const request=pageOrRequest.request||pageOrRequest;
 return request.post('/api/v1/account/login',{data:{email,password}});
}
