// rental-request.entity.ts
// Simple "car with driver" flow: the customer requests one or more cars for
// a trip, the admin calls them, negotiates the price and records payments.
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RentalPaymentMethod, RentalRequestStatus } from '@prisma/client';

export const MAX_DESTINATIONS = 5;

export class CreateRentalRequestDto {
  @ApiProperty({ type: [String], description: 'Cars the customer wants' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one car' })
  @IsString({ each: true })
  carIds: string[];

  @ApiProperty({ example: 'Addis Ababa' })
  @IsString()
  @IsNotEmpty()
  pickupCity: string;

  @ApiProperty({
    type: [String],
    example: ['Afar', 'Oromia'],
    description: 'Names from the Locations list',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one destination' })
  @ArrayMaxSize(MAX_DESTINATIONS, {
    message: `You can add up to ${MAX_DESTINATIONS} destinations`,
  })
  @IsString({ each: true })
  destinations: string[];

  @ApiProperty({ example: 'Vacation' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ruralAccess?: boolean;

  @ApiProperty({ example: '2026-12-01T08:00:00.000Z' })
  @IsDateString()
  pickupDate: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  // Contact info: required only when the customer is not signed in
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'Email must be valid' })
  contactEmail?: string;
}

export class UpdateRentalRequestDto {
  @ApiPropertyOptional({ enum: RentalRequestStatus })
  @IsOptional()
  @IsEnum(RentalRequestStatus)
  status?: RentalRequestStatus;

  @ApiPropertyOptional({ description: 'Negotiated total price (ETB)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}

export class AddRentalPaymentDto {
  @ApiProperty({ example: 10000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({ enum: RentalPaymentMethod })
  @IsEnum(RentalPaymentMethod)
  method: RentalPaymentMethod;

  @ApiPropertyOptional({ description: 'Receipt / transaction number' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

export class RentalRequestListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: 'Tracking code, name or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RentalRequestStatus })
  @IsOptional()
  @IsEnum(RentalRequestStatus)
  status?: RentalRequestStatus;
}

export class RentalPaymentListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({
    description: 'Tracking code, customer, phone or reference',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RentalPaymentMethod })
  @IsOptional()
  @IsEnum(RentalPaymentMethod)
  method?: RentalPaymentMethod;
}
