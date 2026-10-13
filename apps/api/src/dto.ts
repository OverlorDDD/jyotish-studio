import {ApiProperty} from '@nestjs/swagger';
import {IsNumber,IsOptional,IsString,Matches,Max,Min,MaxLength} from 'class-validator';
export class BirthDto{
 @ApiProperty({type:String,example:'2000-01-01'}) @Matches(/^\d{4}-\d{2}-\d{2}$/) date!:string;
 @ApiProperty({type:String,example:'12:00'}) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) time!:string;
 @ApiProperty({type:String,example:'Asia/Kolkata'}) @IsString() @MaxLength(80) timeZone!:string;
 @ApiProperty({type:Number,example:28.6139}) @IsNumber() @Min(-90) @Max(90) latitude!:number;
 @ApiProperty({type:Number,example:77.209}) @IsNumber() @Min(-180) @Max(180) longitude!:number;
 @IsOptional() @IsString() @MaxLength(120) place?:string;
}
export class ReportDto extends BirthDto{
 @ApiProperty({type:String,example:'uk'}) @Matches(/^(uk|en)$/) lang!:'uk'|'en';
 @IsOptional() @Matches(/^(auto|local)$/) preferred?:'auto'|'local';
}
export class InterpretDto{
 @ApiProperty({type:String}) @IsString() id!:string;
 @ApiProperty({type:String,example:'uk'}) @Matches(/^(uk|en)$/) lang!:'uk'|'en';
 @IsOptional() @Matches(/^(auto|local)$/) preferred?:'auto'|'local';
}
