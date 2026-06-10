"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StatsService = class StatsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getGlobalStats() {
        const guests = await this.prisma.guest.findMany();
        const totalInvitations = guests.length;
        let totalExpectedSeats = 0;
        let totalCheckedInSeats = 0;
        let totalVips = 0;
        let vipsPresent = 0;
        guests.forEach((guest) => {
            totalExpectedSeats += guest.allowedSeats;
            totalCheckedInSeats += guest.checkedInSeats;
            if (guest.isVip) {
                totalVips++;
                if (guest.isCheckedIn) {
                    vipsPresent++;
                }
            }
        });
        const totalMissingSeats = totalExpectedSeats - totalCheckedInSeats;
        const presencePercentage = totalExpectedSeats > 0
            ? Math.round((totalCheckedInSeats / totalExpectedSeats) * 100)
            : 0;
        return {
            totalInvitations,
            totalExpectedSeats,
            totalCheckedInSeats,
            totalMissingSeats,
            presencePercentage,
            vips: {
                total: totalVips,
                present: vipsPresent,
                missing: totalVips - vipsPresent,
            },
        };
    }
    async getRecentScans(limit = 10) {
        const validStatues = ['SUCCESS', 'PARTIAL'];
        return this.prisma.scanLog.findMany({
            where: { status: { in: validStatues } },
            take: limit,
            orderBy: { scannedAt: 'desc' },
            include: {
                guest: { select: {
                        firstName: true,
                        lastName: true,
                        tableNumber: true,
                        isVip: true,
                    }, },
            },
        });
    }
    async getAuditLogs() {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async getVipLiveFeed() {
        return this.prisma.guest.findMany({
            where: {
                isVip: true,
                checkedInSeats: { gt: 0 },
            },
            orderBy: { checkInTime: 'desc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                tableNumber: true,
                checkedInSeats: true,
                allowedSeats: true,
                checkInTime: true,
                scans: {
                    where: { status: { in: ['SUCCESS', 'PARTIAL'] } },
                    select: {
                        id: true,
                        scannedAt: true,
                    }
                }
            },
        });
    }
    async getAllScanLogs(limit = 100, search) {
        return this.prisma.scanLog.findMany({
            where: { status: { in: ['SUCCESS', 'PARTIAL', 'ALREADY_SCANNED', 'INVALID_TOKEN'] },
                guest: search ? { OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } }
                    ] } : undefined
            },
            take: limit,
            orderBy: { scannedAt: 'desc' },
            include: { guest: { select: {
                        firstName: true,
                        lastName: true,
                        tableNumber: true,
                        isVip: true,
                        allowedSeats: true,
                        checkedInSeats: true
                    } } }
        });
    }
};
exports.StatsService = StatsService;
exports.StatsService = StatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StatsService);
//# sourceMappingURL=stats.service.js.map