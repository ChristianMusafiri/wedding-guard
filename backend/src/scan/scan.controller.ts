import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ScanService } from './scan.service';
import { ScanGuestDto } from './dto/scan-guest.dto';

//imports , securisation route, ro
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
//end imports

@Controller('scan')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScanController {
    constructor (private readonly scanServive: ScanService) {}

    @Post()
    @Roles(Role.ADMIN, Role.SCANNER) // qui peuvent scanner
    scan (@Body() scanGuestDto: ScanGuestDto, @Request() req : any) {
            //  On récupère le vrai nom de l'utilisateur connecté via le JWT décodé dans req.user
            const scannerName = req.user.username;
        return this.scanServive.processScan(scanGuestDto, scannerName)
    }
}
