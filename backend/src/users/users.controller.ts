import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';

//imports , securisation route, dto
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
//end imports

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN) // TOUTES ces routes sont réservées exclusivement à l'ADMIN (Le Boss)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  updateUserStatus(
    @Param('id') id: string,
    @Body() updateUserDto : UpdateUserDto,
  ) {
    return this.usersService.updateUserStatus(id, updateUserDto);
  }

    @Patch(':id/reset-password')
  @Roles(Role.SUPER_ADMIN) // Seul le -ADMIN- peut réinitialiser un mot de passe
  resetPassword(
    @Param('id') id: string,
    @Body() body: { passwordPlain: string },
  ) {
    return this.usersService.resetPassword(id, body.passwordPlain);
  }
}

