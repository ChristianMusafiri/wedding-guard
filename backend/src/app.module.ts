import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SecurityModule } from './security/security.module';
import { GuestsModule } from './guests/guests.module';
import { ScanModule } from './scan/scan.module';
import { StatsModule } from './stats/stats.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, SecurityModule,
            ConfigModule.forRoot({ isGlobal: true }),
            GuestsModule,
            ScanModule,
            StatsModule,
            AuthModule,
            UsersModule,
        ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
