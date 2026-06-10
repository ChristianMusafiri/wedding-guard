import { Injectable, ConflictException,ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import * as crypto from 'crypto';
import { operate } from 'rxjs/internal/util/lift';

@Injectable()
export class GuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService,
  ) {}

  
   // Enregistre un nouvel invité et génère son QR code sécurisé
   
  async create(createGuestDto: CreateGuestDto, operatorName: string) {
    // verification de doublon
    const cleanFirstName = createGuestDto.firstName.trim()
    const cleanLastName = createGuestDto.lastName.trim().toUpperCase()

    //on verifie les deux noms et prenom (couplés)
    const existingGuest = await this.prisma.guest.findFirst({
      where: {
        firstName: { equals: cleanFirstName, mode: 'insensitive' },
        lastName: { equals: cleanLastName, mode: 'insensitive' },
      },
    });

    if (existingGuest) {
      throw new ConflictException(`L'invité "${cleanFirstName} ${cleanLastName}" est déjà enregistré sur la liste.`)
    }

    // -Générer un UUID propre pour l'invité avant l'insertion( si pas de doublon on y va)
    const guestId = crypto.randomUUID();

    // -Générer le Token de sécurité inviolable lié à cet ID 
    const qrCodeToken = this.securityService.generateSecureToken(guestId);

    // -Sauvegarder l'invité dans PostgreSQL
    const guest = await this.prisma.guest.create({
      data: {
        id: guestId,
        firstName: createGuestDto.firstName,
        lastName: createGuestDto.lastName.toUpperCase(), // On force le nom en majuscules
        allowedSeats: createGuestDto.allowedSeats,
        tableNumber: createGuestDto.tableNumber || null,
        isVip: createGuestDto.isVip || false,
        guestCategory: createGuestDto.guestCategory || 'Général',
        qrCodeToken: qrCodeToken,
      },
    });

    await this.prisma.auditLog.create({
      data : {
        action: 'CREATE',
        targetName: `${cleanFirstName} ${cleanLastName}`,
        userName: operatorName,
        details:`Création de l'invité avec ${guest.allowedSeats} places. Table : ${guest.tableNumber || 'Libre'}.`
      }
    });

    return guest
  }

  // modification guest information (role attribué)
  async update (id: string, updateDto: any, operator: { username: string; role: string; canEdit: boolean }) {
    const guest = await this.findOne(id);

       if (operator.role === 'ADMIN' && !operator.canEdit) {
      throw new ForbiddenException("Vous n'avez pas le droit de modifier les invités. Demandez l'autorisation au Concepteur.");
    }

    const newFirstName = updateDto.firstName !== undefined ? updateDto.firstName.trim() : guest.firstName;
    const newLastName = updateDto.lastName !== undefined ? updateDto.lastName.trim().toUpperCase() : guest.lastName;

    // SÉCURITÉ ANTI-DOUBLON SUR LES MODIFICATIONS :
    // On vérifie s'il existe une AUTRE ligne (id != id de l'invité) ayant le même couple Nom + Prénom
    const duplicate = await this.prisma.guest.findFirst({
      where: {
        id: { not: id }, // On s'assure d'exclure l'invité actuel de la recherche
        firstName: { equals: newFirstName, mode: 'insensitive' },
        lastName: { equals: newLastName, mode: 'insensitive' },
      },
    });

    if (duplicate) {
      throw new ConflictException(
        `Impossible d'enregistrer : Un autre invité nommé "${newFirstName} ${newLastName}" existe déjà sur la liste.`
      );
    }

    const changes: string[] = [];
    if (updateDto.firstName && updateDto.firstName !== guest.firstName) changes.push(`Prénom : ${guest.firstName} -> ${updateDto.firstName}`);
    if (updateDto.lastName && updateDto.lastName.toUpperCase() !== guest.lastName) changes.push(`Nom : ${guest.lastName} -> ${updateDto.lastName.toUpperCase()}`);
    if (updateDto.allowedSeats && Number(updateDto.allowedSeats) !== guest.allowedSeats) changes.push(`Places : ${guest.allowedSeats} -> ${updateDto.allowedSeats}`);
    if (updateDto.tableNumber !== undefined && updateDto.tableNumber !== guest.tableNumber) changes.push(`Table : ${guest.tableNumber || 'Libre'} -> ${updateDto.tableNumber || 'Libre'}`);
    if (updateDto.isVip !== undefined && updateDto.isVip !== guest.isVip) changes.push(`VIP : ${guest.isVip} -> ${updateDto.isVip}`);





    const updated = await this.prisma.guest.update({
      where: { id },
      data: {
        firstName: updateDto.firstName !== undefined ? updateDto.firstName.trim() : guest.firstName,
        lastName: updateDto.lastName !== undefined ? updateDto.lastName.trim().toUpperCase() : guest.lastName,
        allowedSeats: updateDto.allowedSeats !== undefined ? Number(updateDto.allowedSeats) : guest.allowedSeats,
        tableNumber: updateDto.tableNumber !== undefined ? updateDto.tableNumber :guest.tableNumber,
        isVip : updateDto.isVip !== undefined ? updateDto.isVip : guest.isVip,
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
  
  

  async remove(id: string, operatorName: string) {
    const guest = await this.findOne(id); // on verifie sil existe

    await this.prisma.guest.delete({
      where: { id },
    });
        // HISTORIQUE : Créer un Log d'audit de suppression définitive
    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        targetName: ` ${guest.firstName} ${guest.lastName}`,
        userName: operatorName,
        details: `Suppression définitive de la base de données par le Super Admin.`,
      },
    });

     return { message: "L'invité a été supprimé de la BD" }
  }

     // Récupère tous les invités

  async findAll() {
    return this.prisma.guest.findMany({
      orderBy: { firstName :'asc' }

    });
  }

   // Récupère un invité par son ID

  async findOne(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
    });
    if (!guest) {
      throw new NotFoundException(`Invité avec l'ID ${id} introuvable`);
    }
    return guest;
  }
}
