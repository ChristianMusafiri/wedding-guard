"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
require("dotenv/config");
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Connexion établie ! Début du remplissage sécurisé...');
    const superAdminUsername = process.env.INITIAL_SUPERADMIN_USERNAME?.trim().toLowerCase();
    const superAdminPasswordPlain = process.env.INITIAL_SUPERADMIN_PASSWORD;
    const adminUsername = process.env.INITIAL_ADMIN_USERNAME?.trim().toLowerCase();
    const adminPasswordPlain = process.env.INITIAL_ADMIN_PASSWORD;
    if (!superAdminUsername || !superAdminPasswordPlain || !adminUsername || !adminPasswordPlain) {
        throw new Error("ERREUR : Les variables INITIAL_ADMIN_USERNAME ou INITIAL_ADMIN_PASSWORD sont absentes du fichier .env !");
    }
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPasswordPlain, 10);
    const existingSuperAdmin = await prisma.user.findUnique({
        where: { username: superAdminUsername },
    });
    if (existingSuperAdmin) {
        await prisma.user.update({
            where: { id: existingSuperAdmin.id },
            data: {
                password: hashedSuperAdminPassword,
                role: client_1.Role.SUPER_ADMIN,
                isActive: true,
                canEdit: true,
            },
        });
        console.log(`Compte ${superAdminUsername} synchronisé `);
    }
    else {
        await prisma.user.create({
            data: {
                username: superAdminUsername,
                password: hashedSuperAdminPassword,
                role: client_1.Role.SUPER_ADMIN,
                isActive: true,
                canEdit: true,
            },
        });
        console.log(`Compte SUPER_ADMIN ("${superAdminUsername}") créé.`);
    }
    const hashedPassword = await bcrypt.hash(adminPasswordPlain, 10);
    const existingAdmin = await prisma.user.findUnique({
        where: { username: adminUsername },
    });
    if (existingAdmin) {
        await prisma.user.update({
            where: { id: existingAdmin.id },
            data: {
                username: adminUsername,
                password: hashedPassword,
                role: client_1.Role.ADMIN,
                isActive: true,
            },
        });
        console.log(`Compte ADMIN ("${adminUsername}") activé et synchronisé.`);
    }
    else {
        await prisma.user.create({
            data: {
                username: adminUsername,
                password: hashedPassword,
                role: client_1.Role.ADMIN,
                isActive: true,
            },
        });
        console.log(`Compte ADMIN ("${adminUsername}") activé.`);
    }
    console.log(`Remplissage terminé avec succès !`);
    console.log(`Compte administrateur prêt.`);
}
main()
    .catch((e) => {
    console.error('Erreur lors du seeding :', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=seed.js.map