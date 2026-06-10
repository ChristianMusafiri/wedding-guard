import { Controller, Get, Query, Request, Search, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { PrismaService } from '../prisma/prisma.service';

//imports , securisation route, ro
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
//end imports

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
    constructor(
        private readonly statsService: StatsService,
        private readonly prisma: PrismaService,
    ) {}

    // Route : GET /stats/global

    @Get('global')
    @Roles(Role.ADMIN, Role.MC, Role.SUPER_ADMIN) 
    getGlobalStats() {
        return this.statsService.getGlobalStats();
    }

    // Route : Get /stats/recent?limit=5
    @Get('recent')
    @Roles(Role.ADMIN, Role.MC, Role.SUPER_ADMIN)
    getRecentScans(@Query('limit') limit? : string) {
        const parsedLimit = limit ? parseInt(limit, 10) : 10;
        return this.statsService.getRecentScans(parsedLimit);
    }

    @Get('mc-feed')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MC) // 🌟 Ajout de SUPER_ADMIN
    getVipLiveFeed() {
        return this.statsService.getVipLiveFeed();
    }

    // route: GET/stats/logs? limit=100 & search=Dpont
    @Get('logs')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    getAllScanLogs(
        @Query('limit') limit? : string,
        @Query('search') search? : string,
    ) {
        const parsedLimit = limit ? parseInt(limit, 10) : 100;
        return this.statsService.getAllScanLogs(parsedLimit, search);
    }

     // Route : GET /stats/audit-logs
  @Get('audit-logs')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN) // Le Super Admin et l'Admin peuvent auditer
  getAuditLogs() {
    return this.statsService.getAuditLogs()
  }
}
