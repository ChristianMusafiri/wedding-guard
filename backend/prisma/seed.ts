import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config'; // Permet de lire le fichier .env pendant le seed

// 1. Configuration de la connexion PostgreSQL avec l'adaptateur (comme votre ami)
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Connexion établie ! Début du remplissage sécurisé...');

  // 2. Récupérer les identifiants sécurisés depuis le fichier .env
  const superAdminUsername = process.env.INITIAL_SUPERADMIN_USERNAME?.trim().toLowerCase();
  const superAdminPasswordPlain = process.env.INITIAL_SUPERADMIN_PASSWORD;

  const adminUsername = process.env.INITIAL_ADMIN_USERNAME?.trim().toLowerCase();
  const adminPasswordPlain = process.env.INITIAL_ADMIN_PASSWORD;

  if (!superAdminUsername || !superAdminPasswordPlain || !adminUsername || !adminPasswordPlain) {
    throw new Error(
      "ERREUR : Les variables INITIAL_ADMIN_USERNAME ou INITIAL_ADMIN_PASSWORD sont absentes du fichier .env !"
    );
  }

  // 3A. Crypter le mot de passe de manière sécurisée
  const hashedSuperAdminPassword = await bcrypt.hash(superAdminPasswordPlain, 10);

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { username: superAdminUsername },
  });

  if(existingSuperAdmin){
  // 4A. Insérer ou mettre à jour SUPERadmin de manière sécurisée
  await prisma.user.update({
    where: { id: existingSuperAdmin.id },
     // Permet de forcer la mise à jour si vous le modifiez dans le .env
    data: {
      password: hashedSuperAdminPassword,
      role: Role.SUPER_ADMIN,
      isActive: true, //Le super admin doit être actif immédiatement
      canEdit: true, // doit modifier immediatement
    },
  });   console.log(`Compte ${superAdminUsername} synchronisé `)
  } else {
    await prisma.user.create({
      data: {
        username: superAdminUsername,
        password: hashedSuperAdminPassword,
        role: Role.SUPER_ADMIN,
        isActive: true,
        canEdit: true,
      },
    }); console.log(`Compte SUPER_ADMIN ("${superAdminUsername}") créé.`)
  }

  // 3B. Crypter le mot de passe de manière sécurisée
  const hashedPassword = await bcrypt.hash(adminPasswordPlain, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if(existingAdmin){
  // 4B. Insérer ou mettre à jour l'admin de manière sécurisée
  // "upsert" signifie : Si l'utilisateur existe déjà, on ne l'écrase pas (on ne change pas son mot de passe modifié).
  // S'il n'existe pas (suite à un piratage ou une installation), on le crée.
  await prisma.user.update({
    where: { id: existingAdmin.id },
     // 
    data: {
      username: adminUsername,
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true, //ajout active par defaut
    },
  }); console.log(`Compte ADMIN ("${adminUsername}") activé et synchronisé.`)
  } else {
    await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
      },
    }); console.log(`Compte ADMIN ("${adminUsername}") activé.`)
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
    await pool.end(); // On ferme proprement le pool de connexion
  });