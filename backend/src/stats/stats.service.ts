import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { first } from 'rxjs';
import { contains } from 'class-validator';

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) {}

    //Calcule toutes les statistiques globales
    async getGlobalStats() {
        const guests = await this.prisma.guest.findMany();

        const totalInvitations = guests.length;  //nbr des invitations
        let totalExpectedSeats = 0;              //Somme des places autorisées
        let totalCheckedInSeats = 0;             //Somme des personnes entrées
        let totalVips = 0;
        let vipsPresent = 0;


        guests.forEach((guest) => {
            totalExpectedSeats  += guest.allowedSeats;
            totalCheckedInSeats += guest.checkedInSeats;
            if(guest.isVip) {
                totalVips++;
                if(guest.isCheckedIn) {
                    vipsPresent++;
                }
            }
        });

        const totalMissingSeats = totalExpectedSeats - totalCheckedInSeats;

        // calcul le pourcentage
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
                total : totalVips,
                present: vipsPresent,
                missing: totalVips - vipsPresent,
            },
        };
    }
    // Récupère la liste des derniers scans réussis (Flux d'activité en temps réel)
    async getRecentScans(limit: number = 10) {
        const validStatues =  ['SUCCESS', 'PARTIAL']
        return this.prisma.scanLog.findMany({
            where: { status: {in: validStatues} },
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

    // Récupère le journal d'audit (Admin & Super Admin)
    async getAuditLogs() {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    
    //  * Récupère les alertes spécifiques pour le Maître de Cérémonie (MC)
    //  * (Tous les VIPs entrés, triés par heure d'arrivée décroissante)
    async getVipLiveFeed() {
        return this.prisma.guest.findMany({
            where: {
                isVip: true,
                checkedInSeats: { gt: 0 }, //Au moins une personne du group vip est entrée
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

                //scan validé pour le comptage 
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

    // *  Récupère l'historique complet de tous les scans avec recherche optionnelle
    async getAllScanLogs(limit: number = 100, search?: string) {
        return this.prisma.scanLog.findMany({
            where: { status: { in: ['SUCCESS', 'PARTIAL', 'ALREADY_SCANNED', 'INVALID_TOKEN'] },
                    // si une recherche est specifiée, on filtre par nom et prenom de l'invité
                     guest: search ? { OR: [
                                    { firstName: { contains: search, mode: 'insensitive' } },
                                    { lastName: {  contains: search, mode: 'insensitive' } }
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
}
