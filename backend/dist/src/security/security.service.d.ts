export declare class SecurityService {
    private readonly SECRET_KEY;
    private readonly SEPARATOR;
    generateSecureToken(guestId: string): string;
    verifyToken(token: string): {
        isValid: boolean;
        guestId?: string;
    };
}
