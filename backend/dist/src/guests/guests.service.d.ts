import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { CreateGuestDto } from './dto/create-guest.dto';
export declare class GuestsService {
    private readonly prisma;
    private readonly securityService;
    constructor(prisma: PrismaService, securityService: SecurityService);
    create(createGuestDto: CreateGuestDto, operatorName: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        allowedSeats: number;
        checkedInSeats: number;
        qrCodeToken: string;
        status: string;
        tableNumber: string | null;
        isVip: boolean;
        guestCategory: string | null;
        isCheckedIn: boolean;
        checkInTime: Date | null;
        checkedInBy: string | null;
    }>;
    update(id: string, updateDto: any, operator: {
        username: string;
        role: string;
        canEdit: boolean;
    }): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        allowedSeats: number;
        checkedInSeats: number;
        qrCodeToken: string;
        status: string;
        tableNumber: string | null;
        isVip: boolean;
        guestCategory: string | null;
        isCheckedIn: boolean;
        checkInTime: Date | null;
        checkedInBy: string | null;
    }>;
    remove(id: string, operatorName: string): Promise<{
        message: string;
    }>;
    findAll(): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        allowedSeats: number;
        checkedInSeats: number;
        qrCodeToken: string;
        status: string;
        tableNumber: string | null;
        isVip: boolean;
        guestCategory: string | null;
        isCheckedIn: boolean;
        checkInTime: Date | null;
        checkedInBy: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        allowedSeats: number;
        checkedInSeats: number;
        qrCodeToken: string;
        status: string;
        tableNumber: string | null;
        isVip: boolean;
        guestCategory: string | null;
        isCheckedIn: boolean;
        checkInTime: Date | null;
        checkedInBy: string | null;
    }>;
}
