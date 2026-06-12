import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Supprime les données qui ne sont pas dans le DTO
    forbidNonWhitelisted: true, // Rejette la requête si des données inconnues sont envoyées
    transform: true, // Transforme les types automatiquement
  }));

  app.enableCors({
    origin: ['https://wedding-guard-frontend.onrender.com', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }); // Active le CORS pour que notre futur Frontend React puisse communiquer avec le Backend
  
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
