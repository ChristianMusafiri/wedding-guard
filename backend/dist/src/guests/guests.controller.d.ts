import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
export declare class GuestsController {
    private readonly guestsService;
    constructor(guestsService: GuestsService);
    create(createGuestDto: CreateGuestDto, request: any): Promise<{
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
    update(id: string, updateDto: any, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
