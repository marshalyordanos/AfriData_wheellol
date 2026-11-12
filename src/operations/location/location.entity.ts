import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
} from '@nestjs/swagger';
import { LocationType } from '@prisma/client';

export class LocationDto {
  @ApiProperty({ example: 'Afar' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'አፋር' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nameAm?: string;

  @ApiPropertyOptional({ enum: LocationType, default: LocationType.REGION })
  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @ApiPropertyOptional({ example: 'Somali', description: 'Parent region of a city' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 11.7559 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 40.9587 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPickup?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class LocationUpdateDto extends PartialType(LocationDto) {}

export interface LocationListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: LocationType;
  /** "true" → only active, "false" → only inactive */
  active?: string;
  /** "true" → only pickup cities */
  pickup?: string;
}
