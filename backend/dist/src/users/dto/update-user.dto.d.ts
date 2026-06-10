import { Role } from '@prisma/client';
export declare class UpdateUserDto {
    isActive?: boolean;
    role?: Role;
    canEdit?: boolean;
}
