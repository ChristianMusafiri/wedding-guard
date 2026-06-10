import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

   // Récupère la liste de tous les utilisateurs (Admin uniquement)

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        canEdit: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

   // Active/Désactive un compte et modifie son rôle (Admin uniquement)
   
  async updateUserStatus(id: string, updateDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException("Utilisateur introuvable");
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: updateDto.isActive,
        role: updateDto.role || user.role,
        canEdit: updateDto.canEdit !== undefined ? updateDto.canEdit : user.canEdit,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        canEdit: true,
      },
    });
  }

  // Réinitialise le mot de passe d'un utilisateur (Admin uniquement)
  async resetPassword(id: string, passwordPlain: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException("Utilisateur introuvable");
    }

    // Crypter le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      message: `Le mot de passe de l'utilisateur "${user.username}" a été réinitialisé avec succès.`,
    };
  }
}
