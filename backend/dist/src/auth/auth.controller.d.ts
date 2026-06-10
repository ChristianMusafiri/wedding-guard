import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: {
        username: string;
        passwordPlain: string;
    }): Promise<{
        message: string;
        username: string;
    }>;
    login(loginDto: {
        username: string;
        passwordPlain: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            role: import("@prisma/client").$Enums.Role;
            canEdit: boolean;
        };
    }>;
}
