import {
  IsString, IsNumber, IsEnum, IsOptional,
  IsInt, Min, IsArray, MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTradeDto {
  @ApiProperty({ example: 'RELIANCE' })
  @IsString()
  symbol: string;

  @ApiProperty({ example: 'NSE', enum: ['NSE', 'BSE'] })
  @IsEnum(['NSE', 'BSE'])
  @IsOptional()
  exchange?: 'NSE' | 'BSE' = 'NSE';

  @ApiProperty({ example: 'LONG', enum: ['LONG', 'SHORT'] })
  @IsEnum(['LONG', 'SHORT'])
  @IsOptional()
  tradeType?: 'LONG' | 'SHORT' = 'LONG';

  @ApiProperty({ example: 2450.50 })
  @IsNumber()
  @Min(0.01)
  entryPrice: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  entryQuantity: number;

  @ApiProperty({ example: 2380.00, required: false })
  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @ApiProperty({ example: 2600.00, required: false })
  @IsOptional()
  @IsNumber()
  target1?: number;

  @ApiProperty({ example: 2750.00, required: false })
  @IsOptional()
  @IsNumber()
  target2?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  entryNotes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scannerRunId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  confidenceScore?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  strategy?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
