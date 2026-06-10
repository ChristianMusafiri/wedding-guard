import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()

@Module({
  providers: [PrismaService],
  exports: [PrismaService] // permet de linjecter dans dautres services
})
export class PrismaModule {}
