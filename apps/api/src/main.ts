import {existsSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import {SwaggerModule,DocumentBuilder} from '@nestjs/swagger';
import {AppModule} from './nest.ts';
async function bootstrap(){
 const app=await NestFactory.create(AppModule,{cors:{origin:['http://localhost:3000']}});
 app.useGlobalPipes(new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true}));
 const config=new DocumentBuilder().setTitle('Jyotish Studio API').setDescription('Sidereal natal charts, divisional charts, Vimshottari and AI readings. Local-only prototype; authentication required before public exposure.').setVersion('0.1').build();
 SwaggerModule.setup('/api/docs',app,SwaggerModule.createDocument(app,config));
 await app.listen(Number(process.env.PORT||4000),'127.0.0.1');
 console.log('NestJS API ready at http://localhost:4000/api/docs');
}
bootstrap();
