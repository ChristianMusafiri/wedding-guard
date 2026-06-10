import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { ScanGuestDto } from './dto/scan-guest.dto';
export declare class ScanService {
    private readonly prisma;
    private readonly securityService;
    constructor(prisma: PrismaService, securityService: SecurityService);
    processScan(scanGuestDto: ScanGuestDto, scannerName?: string): Promise<{
        status: string;
        message: string;
        guest: {
            firstName: string;
            lastName: string;
            tableNumber: string | null;
            isVip: boolean;
            guestCategory: string | null;
            allowedSeats: number;
            checkInSeats: number;
        };
    }>;
}
