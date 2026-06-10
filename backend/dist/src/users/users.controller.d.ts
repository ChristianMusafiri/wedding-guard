import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        username: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        canEdit: boolean;
        createdAt: Date;
    }[]>;
    updateUserStatus(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        username: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
        canEdit: boolean;
    }>;
    resetPassword(id: string, body: {
        passwordPlain: string;
    }): Promise<{
        message: string;
    }>;
}
