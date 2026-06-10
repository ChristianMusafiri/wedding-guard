// intercepte le requete,extrait le header token, decode avec jwtservice - attache le user à la requete(hopr you get)

import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate{
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if(!token) { throw new UnauthorizedException("Accés Refusé. Lackof TKn") }
        try {
            //  On décode et vérifie le token avec notre clé secrète
            const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET, });

            // On attache l'utilisateur décodé à la requête pour que les autres services y aient accès
            request['user'] = payload;
        } catch { throw new UnauthorizedException("Session expirée ou TKn invalid.") }

        return true;
    }

    private extractTokenFromHeader(request: Request) : string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
