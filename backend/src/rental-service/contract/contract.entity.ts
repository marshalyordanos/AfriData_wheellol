// contract.entity.ts
import {
  IsNumber,
  Min,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContractTemplateDto {
  @ApiProperty({ example: 'Car Rental Service Agreement' })
  @IsString()
  @IsNotEmpty({ message: 'Give the contract a title' })
  @MaxLength(160)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '{ version, settings, fields, blocks }' })
  @IsOptional()
  @IsObject()
  document?: Record<string, any>;

  /** Start from: "default" (WHEELLOL agreement), "blank", or a template id to copy */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;
}

export class UpdateContractTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Give the contract a title' })
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  document?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateRentalContractDto {
  @ApiPropertyOptional({
    description: 'Template to start from (default template if empty)',
  })
  @IsOptional()
  @IsString()
  templateId?: string;
}

export class SaveRentalContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  document?: Record<string, any>;

  @ApiPropertyOptional({ description: '{ meta, fields, schedule }' })
  @IsOptional()
  @IsObject()
  values?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Rendered HTML (from the admin renderer)',
  })
  @IsOptional()
  @IsString()
  html?: string;

  /** Price sent with the contract (becomes the booking's agreed price) */
  @ApiPropertyOptional({ example: 225000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  /** save = keep as draft / update; send = send (or re-send) to the customer */
  @ApiPropertyOptional({ enum: ['save', 'send'] })
  @IsOptional()
  @IsIn(['save', 'send'])
  action?: 'save' | 'send';
}

export class SignContractDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Type your full name' })
  @MaxLength(120)
  name: string;

  @ApiProperty({ description: 'PNG data URL of the drawn signature' })
  @IsString()
  @IsNotEmpty({ message: 'Draw your signature' })
  signature: string;

  @ApiProperty()
  @IsBoolean()
  agree: boolean;

  /** Contract fields the customer fills when signing (e.g. position) */
  @ApiPropertyOptional({ example: { lessee_position: 'Director' } })
  @IsOptional()
  @IsObject()
  fields?: Record<string, string>;
}

export class DeclineContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class SaveSignatureDto {
  @ApiProperty({ description: 'PNG or SVG data URL of the signature' })
  @IsString()
  @IsNotEmpty({ message: 'Draw your signature' })
  signature: string;
}
