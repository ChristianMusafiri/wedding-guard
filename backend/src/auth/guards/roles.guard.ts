import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupérer les rôles autorisés pour cette route spécifique
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si aucun rôle n'est spécifié, la route est publique par défaut
    if (!requiredRoles) {
      return true;
    }

    // Récupérer l'utilisateur (qui a été attaché par le JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException("Vous n'avez pas les autorisations nécessaires.");
    }

    // Vérifier si le rôle de l'utilisateur correspond à un des rôles requis
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Accès refusé. Rôle requis : ${requiredRoles.join(' ou ')}`);
    }

    return true;
  }
}