import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { ScanGuestDto } from './dto/scan-guest.dto';

@Injectable()
export class ScanService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly securityService: SecurityService,
    ) {}

    // Processus complet de validation dun scan de QR Code
    async processScan(scanGuestDto: ScanGuestDto, scannerName: string = 'Hotesse Accueil') {
        const { token, enteringSeats } = scanGuestDto;

        // ÉTAPE DE SÉCURITÉ : Vérifier si la signature HMAC est valide
        const verification = this.securityService.verifyToken(token);

        if(!verification.isValid || !verification.guestId) {
            //Sécurité : On enregistre la tentative de fraude dans les logs
            await this.prisma.scanLog.create({
                data: {
                    status: 'INVALID_TOKEN',
                    notes: `Tentative d'accès avec faux QR Code. Contenu: ${token.substring(0,50)}...`,
                },
            });

            throw new BadRequestException({
                status: 'ERROR',
                message: 'QR Code invalide ou falsifié!',
            });
        }
        // ÉTAPE DE RECHERCHE : Trouver l'invité dans la base de données
        const guest = await this.prisma.guest.findUnique({
           where: { id: verification.guestId }, 
        });
        if(!guest) {
            throw new NotFoundException({
                status: 'ERROR',
                message: 'Invité introuvable dans la base de données.',
            });
        }

        // ÉTAPE DE VÉRIFICATION DU STATUS (Déjà complet ?)
        if(guest.isCheckedIn) {
            await this.prisma.scanLog.create({
                data: {
                    guestId: guest.id,
                    status: 'ALREADY_SCANNED',
                    notes:  `Tentative de réutilisation du code pour ${guest.firstName} ${guest.lastName}.`,
                },
            });

            throw new BadRequestException({
                status: 'ALREADY_SCANNED',
                message: `Accès réfusé! Cet invité est déjà entré (Toutes les ${guest.allowedSeats} places ont été validées).` 
            });
        }

        //ETAPE DU COMPTEUR DE PLACES (Gestion des retardataires)
        const remainingSeats = guest.allowedSeats - guest.checkedInSeats;

        if(enteringSeats > remainingSeats) {
            throw new BadRequestException({
                status: 'SEATS_EXCEEDED',
                message: `Impossible de valider ${enteringSeats} places.Il ne reste que ${remainingSeats} place(s) disponible(s) pour ce groupe`,
                remainingSeats,
            });
        }

        //mise à jour de l'invité
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
        // Enregistrement du log de succes
        const logStatus = isFullyCheckedIn ? 'SUCCESS' : 'PARTIAL';
        await this.prisma.scanLog.create({
            data: {
                guestId: guest.id,
                status: logStatus,
                notes: `${enteringSeats} personne(s) validée(s) par ${scannerName}. Total= ${newCkeckedIndSeats}/${guest.allowedSeats}`,
            },
        });

        // Retour du Résultat
        return {
            status: logStatus, // Success (complet) ou (Partiel)= il reste de place
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
}
