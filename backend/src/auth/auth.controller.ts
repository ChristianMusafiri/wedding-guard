import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(
        @Body() registerDto: { username: string; passwordPlain: string},
    ) {
        return this.authService.register(registerDto.username, registerDto.passwordPlain);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK) // Renvoie 200 ok au lieu de 201 Created pour un login
    async login(
        @Body() loginDto: { username: string; passwordPlain: string },
    ) {
        return this.authService.login(loginDto.username, loginDto.passwordPlain);
    }
}
