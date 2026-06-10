import { PrismaService } from '../prisma/prisma.service';
export declare class StatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getGlobalStats(): Promise<{
        totalInvitations: number;
        totalExpectedSeats: number;
        totalCheckedInSeats: number;
        totalMissingSeats: number;
        presencePercentage: number;
        vips: {
            total: number;
            present: number;
            missing: number;
        };
    }>;
    getRecentScans(limit?: number): Promise<({
        guest: {
            firstName: string;
            lastName: string;
            tableNumber: string | null;
            isVip: boolean;
        } | null;
    } & {
        id: string;
        status: string;
        scannedAt: Date;
        notes: string | null;
        guestId: string | null;
        scannedById: string | null;
    })[]>;
    getAuditLogs(): Promise<{
        id: string;
        createdAt: Date;
        action: string;
        targetName: string;
        userName: string;
        details: string;
    }[]>;
    getVipLiveFeed(): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        allowedSeats: number;
        tableNumber: string | null;
        checkedInSeats: number;
        checkInTime: Date | null;
        scans: {
            id: string;
            scannedAt: Date;
        }[];
    }[]>;
    getAllScanLogs(limit?: number, search?: string): Promise<({
        guest: {
            firstName: string;
            lastName: string;
            allowedSeats: number;
            tableNumber: string | null;
            isVip: boolean;
            checkedInSeats: number;
        } | null;
    } & {
        id: string;
        status: string;
        scannedAt: Date;
        notes: string | null;
        guestId: string | null;
        scannedById: string | null;
    })[]>;
}
