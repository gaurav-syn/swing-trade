import { IsNumber, IsInt, Min, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExitTradeDto {
  @ApiProperty({ example: 2600.00 })
  @IsNumber()
  @Min(0.01)
  exitPrice: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  exitQuantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  exitNotes?: string;
}
