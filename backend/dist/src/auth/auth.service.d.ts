import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(username: string, passwordPlain: string): Promise<{
        message: string;
        username: string;
    }>;
    login(username: string, passwordPlain: string): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            role: import("@prisma/client").$Enums.Role;
            canEdit: boolean;
        };
    }>;
}
