import {existsSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
// npm workspaces launches NestJS with cwd=apps/api. Resolve the shared root .env
// relative to this source file, so it works from any terminal directory.
const rootEnv=resolve(dirname(fileURLToPath(import.meta.url)),'../../../.env');
if(existsSync(rootEnv))process.loadEnvFile(rootEnv);
import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import {SwaggerModule,DocumentBuilder} from '@nestjs/swagger';
import {AppModule} from './nest.ts';
async function bootstrap(){
 const app=await NestFactory.create(AppModule,{cors:{origin:[`http://localhost:${process.env.WEB_PORT||3000}`]}});
 // Editorial articles can be much longer than Express's default 100 kB JSON body limit.
 // Keep an explicit 2 MB ceiling to prevent unlimited request-body allocations.
 app.useBodyParser('json',{limit:'2mb'});
 app.enableShutdownHooks();
 app.use((req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
  const id=randomUUID(),start=Date.now();
  res.setHeader('X-Request-Id',id);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  if(process.env.HTTP_ACCESS_LOG==='1'){
   // No URL, query, cookie, session ID or question text in access logs.
   res.on('finish',()=>console.info(JSON.stringify({
    type:'http_request',id,method:req.method,status:res.statusCode,durationMs:Date.now()-start
   })));
  }
  next();
 });
 app.useGlobalPipes(new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true}));
 const config=new DocumentBuilder().setTitle('Jyotish Studio API').setDescription('Sidereal natal charts, divisional charts, Vimshottari and AI readings. Guest calculations require no account; signed-in owners alone can save and retrieve their private chart history.').setVersion('0.1').build();
 SwaggerModule.setup('/api/docs',app,SwaggerModule.createDocument(app,config));
 const port=Number(process.env.PORT||4000);
 await app.listen(port,'127.0.0.1');
 console.log(`NestJS API ready at http://localhost:${port}/api/docs`);
}
bootstrap();
