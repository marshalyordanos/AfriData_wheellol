import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BookingMessageController } from './booking/booking.controller';
import { BookingUseCasesImp } from './booking/booking.usecase.impl';
import { BookingRepository } from './booking/booking.repository';
import { ReviewUseCasesImpl } from './review/review.usecase.impl';
import { ReviewRepository } from './review/review.repository';
import { ReviewMessageController } from './review/review.controller';
import { DisputeMessageController } from './dispute/dispute.controller';
import { DisputeUseCasesImpl } from './dispute/dispute.usecase.impl';
import { DisputeRepository } from './dispute/dispute.repository';
import { CancellationPolicyMessageController } from './cancellation-policy/cancellation-policy.controller';
import { CancellationPolicyUseCasesImp } from './cancellation-policy/cancellation-policy.usecase.impl';
import { CancellationPolicyRepository } from './cancellation-policy/cancellation-policy.repository';
import { CarRepository } from '../operations/car/car.repository';
import { MessageMessageController } from './message/message.controller';
import { MessageUseCasesImp } from './message/message.usecase.impl';
import { MessageRepository } from './message/message.repository';
import { NotifyHubModule } from '../notify-hub/notify-hub.module';
import { redisProvider } from '../notify-hub/redis/redis.provider';
import { PaymentMessageController } from './payment/payment.controller';
import { PaymentUseCasesImpl } from './payment/payment.usecase.impl';
import { PaymentRepository } from './payment/payment.repository';
import { RentalRequestMessageController } from './rental-request/rental-request.controller';
import { RentalRequestUseCasesImpl } from './rental-request/rental-request.usecase.impl';
import { RentalRequestRepository } from './rental-request/rental-request.repository';
import { NotifierService } from './notification/notifier.service';
import { NotificationMessageController } from './notification/notification.controller';
import { ContractMessageController } from './contract/contract.controller';
import { ContractUseCasesImpl } from './contract/contract.usecase.impl';
import { ContractRepository } from './contract/contract.repository';
import { SupplierMessageController } from './supplier/supplier.controller';
import { SupplierUseCases } from './supplier/supplier.usecase';
import { CommissionService } from './supplier/commission.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'yourSecret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [
    BookingMessageController,
    BookingMessageController,
    ReviewMessageController,
    DisputeMessageController,
    CancellationPolicyMessageController,
    MessageMessageController,
    PaymentMessageController,
    RentalRequestMessageController,
    NotificationMessageController,
    ContractMessageController,
    SupplierMessageController,
  ],

  providers: [
    CarRepository,
    PrismaService,
    BookingUseCasesImp,
    BookingRepository,
    ReviewUseCasesImpl,
    ReviewRepository,
    DisputeUseCasesImpl,
    DisputeRepository,
    CancellationPolicyUseCasesImp,
    CancellationPolicyRepository,
    MessageUseCasesImp,
    MessageRepository,
    redisProvider,
    PaymentUseCasesImpl,
    PaymentRepository,
    RentalRequestUseCasesImpl,
    RentalRequestRepository,
    NotifierService,
    ContractUseCasesImpl,
    ContractRepository,
    SupplierUseCases,
    CommissionService,
  ],
  exports: [
    BookingUseCasesImp,
    ReviewUseCasesImpl,
    DisputeUseCasesImpl,
    CancellationPolicyUseCasesImp,
    MessageUseCasesImp,
    PaymentUseCasesImpl,
    redisProvider,
  ],
})
export class RentalServiceModule {}
