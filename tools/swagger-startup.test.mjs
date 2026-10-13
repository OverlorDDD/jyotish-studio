/**
 * Regression for Nest Swagger startup under tsx (esbuild does not emit
 * design:paramtypes). Does not open ports or need a running PostgreSQL.
 *
 * Run: npm run test:swagger
 */
import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import {NestFactory} from '@nestjs/core';
import {SwaggerModule,DocumentBuilder} from '@nestjs/swagger';
import {AppModule,JyotishController} from '../apps/api/src/nest.ts';

test('tsx emits usable controller metadata for Swagger and DTO validation',async()=>{
  const expected={
    calculate:'BirthDto',
    get:'String',
    dashas:'String',
    interpret:'InterpretDto',
    detailedReport:'InterpretDto',
  };
  for(const [method,type] of Object.entries(expected)){
    const types=Reflect.getMetadata('design:paramtypes',JyotishController.prototype,method);
    assert.ok(Array.isArray(types),`Missing design:paramtypes for ${method}`);
    assert.equal(types.length,1,`Unexpected arity for ${method}`);
    assert.equal(types[0]?.name,type,`Wrong DTO type for ${method}`);
  }

  // SwaggerModule.createDocument() was the exact operation crashing on Windows.
  const app=await NestFactory.create(AppModule,{logger:false});
  try{
    const document=SwaggerModule.createDocument(app,
      new DocumentBuilder().setTitle('Jyotish Studio').setVersion('0.1').build());
    for(const path of [
      '/api/health',
      '/api/v1/charts/calculate',
      '/api/v1/charts/{id}',
      '/api/v1/charts/{id}/dashas',
      '/api/v1/interpretations',
      '/api/v1/reports'
    ])assert.ok(document.paths[path],`Swagger route missing: ${path}`);
    assert.ok(document.paths['/api/v1/charts/calculate'].post?.requestBody,
      'Swagger must document birth input request body');
    console.log('PASS: Nest Swagger document generated with all six routes.');
  } finally {
    await app.close();
  }
});
