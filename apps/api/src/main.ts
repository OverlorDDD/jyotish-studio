import {existsSync} from 'node:fs';
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
 const app=await NestFactory.create(AppModule,{cors:{origin:['http://localhost:3000']}});
 app.enableShutdownHooks();
 app.useGlobalPipes(new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true}));
 const config=new DocumentBuilder().setTitle('Jyotish Studio API').setDescription('Sidereal natal charts, divisional charts, Vimshottari and AI readings. Local-only prototype; authentication required before public exposure.').setVersion('0.1').build();
 SwaggerModule.setup('/api/docs',app,SwaggerModule.createDocument(app,config));
 await app.listen(Number(process.env.PORT||4000),'127.0.0.1');
 console.log('NestJS API ready at http://localhost:4000/api/docs');
}
bootstrap();
