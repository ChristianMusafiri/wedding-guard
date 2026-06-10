import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {}

    // CREATE ACCOUNT - free access to all
    async register(username: string, passwordPlain: string) {
        //on verifie si le nom exixte deja
        const existingUser = await this.prisma.user.findUnique({
            where: { username},
        });

        if(existingUser) {throw new UnauthorizedException("ce nom est deja pris")};

        // crypter le mot de passe
        const hashedPassword = await bcrypt.hash(passwordPlain, 10);

        const newUser = await this.prisma.user.create({
            data: {
                username,
                password : hashedPassword,
                role: 'SCANNER' // par defaut
            },
        });

        return {
            message: "Inscription réussie. Votre compte est en attente d'activation.",
            username: newUser.username
        }
    }


    // valide les identifiants et genere un badget dacces JWT
    async login(username: string, passwordPlain: string) {
        // CHERCHE User par son nom
        const user = await this.prisma.user.findUnique({
            where: { username },
        });

        if(!user) { throw new BadRequestException("nom d'utilisateur incorrect") }

        // Compare le mot de passe saisi avec de la bd crypté
        const isPasswordValid = await bcrypt.compare(passwordPlain, user.password);
        if(!isPasswordValid) { throw new UnauthorizedException("nom d'utilisateur ou mot de passe incorrect"); }
        // verification de lactivation par ladministrateur
        if(!user.isActive) {throw new UnauthorizedException( "Votre compte est en attente d'approbation par l'administrateur.")}

        // Préparer les données à crypter dans le JWT (le Payload)
        const payload = {
            sub: user.id,             //"sub" est le standard JWT pour l'ID de l'utilisateur
            username: user.username,  
            role: user.role,          //SCANNER,MC
            canEdit: user.canEdit,    //le badge contient lr droit dedition
        }

        //GERER ET RENVOYER LE TOKEN
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                canEdit: user.canEdit,
            },
        };
    }
}
