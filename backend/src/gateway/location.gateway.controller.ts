import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LocationType } from '@prisma/client';
import { PATTERNS } from '../contracts';
import {
  LocationDto,
  LocationUpdateDto,
} from '../operations/location/location.entity';

@ApiTags('Locations')
@ApiBearerAuth('access-token')
@Controller('locations')
export class LocationGatewayController {
  constructor(@Inject('USER_SERVICE') private readonly client: ClientProxy) {}

  private headers(req) {
    return { authorization: req.headers['authorization'] || null };
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: LocationType })
  @ApiQuery({ name: 'active', required: false, type: String, description: '"true" | "false"' })
  @ApiQuery({ name: 'pickup', required: false, type: String, description: '"true" → pickup cities only' })
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('type') type?: LocationType,
    @Query('active') active?: string,
    @Query('pickup') pickup?: string,
  ) {
    return this.client.send(PATTERNS.LOCATION_FIND_ALL, {
      headers: this.headers(req),
      query: {
        page: page ? Number(page) : 1,
        pageSize: pageSize ? Number(pageSize) : 10,
        search: search || undefined,
        type: type || undefined,
        active,
        pickup,
      },
    });
  }

  @Get(':id')
  findById(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.LOCATION_FIND_BY_ID, {
      headers: this.headers(req),
      id,
    });
  }

  @Post()
  create(@Req() req, @Body() dto: LocationDto) {
    return this.client.send(PATTERNS.LOCATION_CREATE, {
      headers: this.headers(req),
      data: dto,
    });
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: LocationUpdateDto) {
    return this.client.send(PATTERNS.LOCATION_UPDATE, {
      headers: this.headers(req),
      id,
      data: dto,
    });
  }

  @Delete(':id')
  delete(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.LOCATION_DELETE, {
      headers: this.headers(req),
      id,
    });
  }
}
