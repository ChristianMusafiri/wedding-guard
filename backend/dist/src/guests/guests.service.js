"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const security_service_1 = require("../security/security.service");
const crypto = __importStar(require("crypto"));
let GuestsService = class GuestsService {
    prisma;
    securityService;
    constructor(prisma, securityService) {
        this.prisma = prisma;
        this.securityService = securityService;
    }
    async create(createGuestDto, operatorName) {
        const cleanFirstName = createGuestDto.firstName.trim();
        const cleanLastName = createGuestDto.lastName.trim().toUpperCase();
        const existingGuest = await this.prisma.guest.findFirst({
            where: {
                firstName: { equals: cleanFirstName, mode: 'insensitive' },
                lastName: { equals: cleanLastName, mode: 'insensitive' },
            },
        });
        if (existingGuest) {
            throw new common_1.ConflictException(`L'invité "${cleanFirstName} ${cleanLastName}" est déjà enregistré sur la liste.`);
        }
        const guestId = crypto.randomUUID();
        const qrCodeToken = this.securityService.generateSecureToken(guestId);
        const guest = await this.prisma.guest.create({
            data: {
                id: guestId,
                firstName: createGuestDto.firstName,
                lastName: createGuestDto.lastName.toUpperCase(),
                allowedSeats: createGuestDto.allowedSeats,
                tableNumber: createGuestDto.tableNumber || null,
                isVip: createGuestDto.isVip || false,
                guestCategory: createGuestDto.guestCategory || 'Général',
                qrCodeToken: qrCodeToken,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                action: 'CREATE',
                targetName: `${cleanFirstName} ${cleanLastName}`,
                userName: operatorName,
                details: `Création de l'invité avec ${guest.allowedSeats} places. Table : ${guest.tableNumber || 'Libre'}.`
            }
        });
        return guest;
    }
    async update(id, updateDto, operator) {
        const guest = await this.findOne(id);
        if (operator.role === 'ADMIN' && !operator.canEdit) {
            throw new common_1.ForbiddenException("Vous n'avez pas le droit de modifier les invités. Demandez l'autorisation au Concepteur.");
        }
        const newFirstName = updateDto.firstName !== undefined ? updateDto.firstName.trim() : guest.firstName;
        const newLastName = updateDto.lastName !== undefined ? updateDto.lastName.trim().toUpperCase() : guest.lastName;
        const duplicate = await this.prisma.guest.findFirst({
            where: {
                id: { not: id },
                firstName: { equals: newFirstName, mode: 'insensitive' },
                lastName: { equals: newLastName, mode: 'insensitive' },
            },
        });
        if (duplicate) {
            throw new common_1.ConflictException(`Impossible d'enregistrer : Un autre invité nommé "${newFirstName} ${newLastName}" existe déjà sur la liste.`);
        }
        const changes = [];
        if (updateDto.firstName && updateDto.firstName !== guest.firstName)
            changes.push(`Prénom : ${guest.firstName} -> ${updateDto.firstName}`);
        if (updateDto.lastName && updateDto.lastName.toUpperCase() !== guest.lastName)
            changes.push(`Nom : ${guest.lastName} -> ${updateDto.lastName.toUpperCase()}`);
        if (updateDto.allowedSeats && Number(updateDto.allowedSeats) !== guest.allowedSeats)
            changes.push(`Places : ${guest.allowedSeats} -> ${updateDto.allowedSeats}`);
        if (updateDto.tableNumber !== undefined && updateDto.tableNumber !== guest.tableNumber)
            changes.push(`Table : ${guest.tableNumber || 'Libre'} -> ${updateDto.tableNumber || 'Libre'}`);
        if (updateDto.isVip !== undefined && updateDto.isVip !== guest.isVip)
            changes.push(`VIP : ${guest.isVip} -> ${updateDto.isVip}`);
        const updated = await this.prisma.guest.update({
            where: { id },
            data: {
                firstName: updateDto.firstName !== undefined ? updateDto.firstName.trim() : guest.firstName,
                lastName: updateDto.lastName !== undefined ? updateDto.lastName.trim().toUpperCase() : guest.lastName,
                allowedSeats: updateDto.allowedSeats !== undefined ? Number(updateDto.allowedSeats) : guest.allowedSeats,
                tableNumber: updateDto.tableNumber !== undefined ? updateDto.tableNumber : guest.tableNumber,
                isVip: updateDto.isVip !== undefined ? updateDto.isVip : guest.isVip,
                guestCategory: updateDto.guestCategory !== undefined ? updateDto.guestCategory : guest.guestCategory,
            },
        });
        if (changes.length > 0) {
            await this.prisma.auditLog.create({
                data: {
                    action: 'UPDATE',
                    targetName: `${updated.firstName} ${updated.lastName}`,
                    userName: operator.username,
                    details: `Modifications apportées : ${changes.join(' | ')}`,
                },
            });
        }
        return updated;
    }
    async remove(id, operatorName) {
        const guest = await this.findOne(id);
        await this.prisma.guest.delete({
            where: { id },
        });
        await this.prisma.auditLog.create({
            data: {
                action: 'DELETE',
                targetName: ` ${guest.firstName} ${guest.lastName}`,
                userName: operatorName,
                details: `Suppression définitive de la base de données par le Super Admin.`,
            },
        });
        return { message: "L'invité a été supprimé de la BD" };
    }
    async findAll() {
        return this.prisma.guest.findMany({
            orderBy: { firstName: 'asc' }
        });
    }
    async findOne(id) {
        const guest = await this.prisma.guest.findUnique({
            where: { id },
        });
        if (!guest) {
            throw new common_1.NotFoundException(`Invité avec l'ID ${id} introuvable`);
        }
        return guest;
    }
};
exports.GuestsService = GuestsService;
exports.GuestsService = GuestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        security_service_1.SecurityService])
], GuestsService);
//# sourceMappingURL=guests.service.js.map