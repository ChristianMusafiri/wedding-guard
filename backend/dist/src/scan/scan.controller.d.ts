import { ScanService } from './scan.service';
import { ScanGuestDto } from './dto/scan-guest.dto';
export declare class ScanController {
    private readonly scanServive;
    constructor(scanServive: ScanService);
    scan(scanGuestDto: ScanGuestDto, req: any): Promise<{
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
