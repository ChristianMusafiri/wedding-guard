import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        username: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        canEdit: boolean;
        createdAt: Date;
    }[]>;
    updateUserStatus(id: string, updateDto: UpdateUserDto): Promise<{
        id: string;
        username: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        canEdit: boolean;
    }>;
    resetPassword(id: string, passwordPlain: string): Promise<{
        message: string;
    }>;
}
