import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CarType, Prisma } from '@prisma/client';

@Injectable()
export class CarTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCarMake(data: Prisma.CarTypeCreateInput): Promise<CarType> {
    return this.prisma.carType.create({ data });
  }

  async findById(id: string): Promise<CarType | null> {
    return this.prisma.carType.findUnique({ where: { id } });
  }

  async findAll(
    skip: number,
    take: number,
    where?: any,
  ): Promise<[CarType[], number]> {
    const [makes, total] = await Promise.all([
      this.prisma.carType.findMany({
        skip,
        take,
        where,
      }),
      this.prisma.carType.count({ where }),
    ]);
    return [makes, total];
  }

  async updateCarMake(
    id: string,
    data: Prisma.CarTypeUpdateInput,
  ): Promise<CarType> {
    console.log('carudpated');
    return this.prisma.carType.update({ where: { id }, data });
  }

  async deleteCarMake(id: string): Promise<CarType> {
    return this.prisma.carType.delete({ where: { id } });
  }
}
