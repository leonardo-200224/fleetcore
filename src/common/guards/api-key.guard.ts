import {
    Injectable, UnauthorizedException, type CanActivate, type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../../config/env.schema.js';

/**
 * Guard de los endpoints de integracion externa (requisito 1.8 y 1.9).
 *
 * En lugar de un token JWT, estas rutas se identifican con la cabecera
 * "x-api-key". Las claves validas viven en la variable de entorno API_KEYS,
 * nunca escritas en el codigo, y el envSchema ya las deja convertidas en array.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly config: ConfigService<Env, true>) { }

    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest<Request>();
        const clave = req.headers['x-api-key'];

        // Si la cabecera no viene, o viene repetida (ahi express devuelve un array),
        // no hay nada que comparar.
        if (typeof clave !== 'string' || !clave) {
            throw new UnauthorizedException('Falta la cabecera x-api-key');
        }

        const clavesValidas = this.config.get('API_KEYS', { infer: true });
        if (!clavesValidas.includes(clave)) {
            throw new UnauthorizedException('La API Key no es valida');
        }
        return true;
    }
}
