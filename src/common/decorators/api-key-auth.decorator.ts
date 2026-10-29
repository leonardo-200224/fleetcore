import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard.js';
import { Public } from './public.decorator.js';

/**
 * Marca una ruta como de integracion externa: se entra con x-api-key, no con JWT.
 *
 * El @Public() es necesario porque el JwtAuthGuard esta puesto como guard global
 * en app.module.ts: sin el, la peticion se rechazaria por falta de token antes
 * de que el ApiKeyGuard llegara a revisar la cabecera.
 */
export const ApiKeyAuth = () =>
    applyDecorators(
        Public(),
        UseGuards(ApiKeyGuard),
        ApiSecurity('api-key'),
        ApiUnauthorizedResponse({ description: 'API Key ausente o incorrecta' }),
    );
