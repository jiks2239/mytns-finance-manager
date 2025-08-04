// Polyfill global crypto for Node < v19
import * as crypto from 'crypto';
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = crypto;
}
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const errorMessages = errors.map((error) => {
          const constraints = Object.values(error.constraints || {});
          return {
            field: error.property,
            message: constraints.join(', '),
          };
        });

        // Create user-friendly error messages
        const friendlyMessages = errorMessages.map((err) => {
          switch (err.field) {
            case 'account_name':
              return 'Please enter a valid account name (maximum 100 characters)';
            case 'account_number':
              return 'Please enter a valid account number for bank accounts (maximum 30 characters)';
            case 'bank_name':
              return 'Please enter a valid bank name for bank accounts (maximum 100 characters)';
            case 'account_type':
              return 'Please select a valid account type (Current, Savings, or Cash)';
            case 'opening_balance':
              return 'Please enter a valid opening balance amount';
            default:
              return err.message;
          }
        });

        return new BadRequestException(friendlyMessages.join('; '));
      },
    }),
  );

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
