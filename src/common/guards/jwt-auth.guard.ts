import {
    Injectable, UnauthorizedException, type CanActivate, type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthRequest, JwtPayload } from '../interfaces/jwt-payload.interface.js';

/**
 * Protege todas las rutas (requisito 1.5). Esta puesto como guard GLOBAL en
 * app.module.ts, asi que por defecto nada es publico: hay que marcar con
 * @Public() lo que si lo sea, como el registro y el login.
 *
 * Lee la cabecera Authorization, verifica el token y deja el contenido del
 * JWT en req.user, de donde lo sacan despues @CurrentUser() y el RolesGuard.
 *
 * Responde 401 tanto si no hay token como si es invalido o expiro, que son
 * los tres primeros casos del requisito 1.10.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (isPublic) return true;

        const req = ctx.switchToHttp().getRequest<AuthRequest>();
        const [type, token] = req.headers.authorization?.split(' ') ?? [];
        if (type !== 'Bearer' || !token) throw new UnauthorizedException('Token requerido');

        try {
            req.user = await this.jwt.verifyAsync<JwtPayload>(token);
        } catch {
            throw new UnauthorizedException('Token inválido o expirado');
        }
        return true;
    }
}