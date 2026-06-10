import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, Req } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';

//imports , securisation route, ro
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
// removed unused imports
//end imports

@Controller('guests')
@UseGuards(JwtAuthGuard, RolesGuard) // Appliquer les deux vigiles à TOUTES les routes de ce contrôleur
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @Roles(Role.ADMIN) // Seul Admin peut ajouter linvité
  create(@Body() createGuestDto: CreateGuestDto, @Req() request: any) {
    const operatorName = request.user.username; // On extrait le nom de l'Admin connecté
    return this.guestsService.create(createGuestDto, operatorName);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SCANNER, Role.MC, Role.SUPER_ADMIN)  // peuvent voir la liste
  findAll() {
    return this.guestsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SCANNER, Role.MC)
  findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN) // peut modifier
  update(@Param('id') id: string, @Body() updateDto: any, @Req() req: any) {
    // On passe l'objet complet de l'opérateur (username, role, canEdit) pour vérifier ses droits
    const operator = {
      username: req.user?.username,
      role: req.user?.role,
      canEdit: req.user?.canEdit || false,
    };
    return this.guestsService.update(id, updateDto, operator);
  }
  

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string, @Req() req: any) {
    const operatorName = req.user.username;
    return this.guestsService.remove(id, operatorName);
  }
}
