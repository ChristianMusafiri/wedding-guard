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
exports.ScanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const security_service_1 = require("../security/security.service");
let ScanService = class ScanService {
    prisma;
    securityService;
    constructor(prisma, securityService) {
        this.prisma = prisma;
        this.securityService = securityService;
    }
    async processScan(scanGuestDto, scannerName = 'Hotesse Accueil') {
        const { token, enteringSeats } = scanGuestDto;
        const verification = this.securityService.verifyToken(token);
        if (!verification.isValid || !verification.guestId) {
            await this.prisma.scanLog.create({
                data: {
                    status: 'INVALID_TOKEN',
                    notes: `Tentative d'accès avec faux QR Code. Contenu: ${token.substring(0, 50)}...`,
                },
            });
            throw new common_1.BadRequestException({
                status: 'ERROR',
                message: 'QR Code invalide ou falsifié!',
            });
        }
        const guest = await this.prisma.guest.findUnique({
            where: { id: verification.guestId },
        });
        if (!guest) {
            throw new common_1.NotFoundException({
                status: 'ERROR',
                message: 'Invité introuvable dans la base de données.',
            });
        }
        if (guest.isCheckedIn) {
            await this.prisma.scanLog.create({
                data: {
                    guestId: guest.id,
                    status: 'ALREADY_SCANNED',
                    notes: `Tentative de réutilisation du code pour ${guest.firstName} ${guest.lastName}.`,
                },
            });
            throw new common_1.BadRequestException({
                status: 'ALREADY_SCANNED',
                message: `Accès réfusé! Cet invité est déjà entré (Toutes les ${guest.allowedSeats} places ont été validées).`
            });
        }
        const remainingSeats = guest.allowedSeats - guest.checkedInSeats;
        if (enteringSeats > remainingSeats) {
            throw new common_1.BadRequestException({
                status: 'SEATS_EXCEEDED',
                message: `Impossible de valider ${enteringSeats} places.Il ne reste que ${remainingSeats} place(s) disponible(s) pour ce groupe`,
                remainingSeats,
            });
        }
        const newCkeckedIndSeats = guest.checkedInSeats + enteringSeats;
        const isFullyCheckedIn = newCkeckedIndSeats === guest.allowedSeats;
        const updatedGuest = await this.prisma.guest.update({
            where: { id: guest.id },
            data: {
                checkedInSeats: newCkeckedIndSeats,
                isCheckedIn: isFullyCheckedIn,
                checkInTime: new Date(),
                checkedInBy: scannerName,
            },
        });
        const logStatus = isFullyCheckedIn ? 'SUCCESS' : 'PARTIAL';
        await this.prisma.scanLog.create({
            data: {
                guestId: guest.id,
                status: logStatus,
                notes: `${enteringSeats} personne(s) validée(s) par ${scannerName}. Total= ${newCkeckedIndSeats}/${guest.allowedSeats}`,
            },
        });
        return {
            status: logStatus,
            message: isFullyCheckedIn
                ? `Bienvenu! Entrée validée pour tout le groupe (${enteringSeats} personnes).`
                : `Entrée partielle validée (${enteringSeats}) personnes. Il reste ${guest.allowedSeats - guest.checkedInSeats} place(s)`,
            guest: {
                firstName: updatedGuest.firstName,
                lastName: updatedGuest.lastName,
                tableNumber: updatedGuest.tableNumber,
                isVip: updatedGuest.isVip,
                guestCategory: updatedGuest.guestCategory,
                allowedSeats: updatedGuest.allowedSeats,
                checkInSeats: updatedGuest.checkedInSeats,
            },
        };
    }
};
exports.ScanService = ScanService;
exports.ScanService = ScanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        security_service_1.SecurityService])
], ScanService);
//# sourceMappingURL=scan.service.js.map