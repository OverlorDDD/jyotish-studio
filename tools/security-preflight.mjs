/** Safe non-mutating production-readiness checks (no secrets printed). */
import {existsSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
const errors=[];
if(!process.env.DATABASE_URL)errors.push('DATABASE_URL is missing');
else {
 try{
  const database=new URL(process.env.DATABASE_URL);
  if(!['postgresql:','postgres:'].includes(database.protocol))errors.push('DATABASE_URL must be PostgreSQL');
 }catch{errors.push('DATABASE_URL is invalid');}
}
if((process.env.AUTH_SECRET||'').length<32)errors.push('AUTH_SECRET needs at least 32 characters');
if(process.env.SESSION_COOKIE_SECURE==='1')console.log('Session: HTTPS-only cookies explicitly enabled.');
else console.log('Session: auto-detected HTTPS via proxy; use SESSION_COOKIE_SECURE=1 for stable HTTPS deployments.');
if(process.env.TAROT_AI_ENABLED==='true')console.log('NOTICE: paid/remote Tarot AI enabled; verify provider keys, quota and budget before public exposure.');
if(errors.length){for(const error of errors)console.error('BLOCKED: '+error);process.exitCode=1;}
else console.log('PASS: required database/session environment variables are configured (secrets withheld).');
