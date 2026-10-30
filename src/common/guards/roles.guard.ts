import {
    ForbiddenException, Injectable, type CanActivate, type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { Role } from '../enums/role.enum.js';
import type { AuthRequest } from '../interfaces/jwt-payload.interface.js';

/**
 * Comprueba el rol del usuario (requisito 1.6).
 *
 * Lee los roles que pide la ruta con @Roles(...) y los compara con el rol que
 * venia dentro del token. Si la ruta no pide ninguno, deja pasar a cualquier
 * usuario autenticado: de eso ya se encargo el JwtAuthGuard, que corre antes.
 *
 * Responde 403, no 401: el usuario esta identificado, lo que le falta son
 * permisos (cuarto caso del requisito 1.10).
 *
 * Lo que este guard NO puede hacer es saber si un mantenimiento concreto es
 * del tecnico que lo pide: para eso hay que leer los datos, y esa
 * comprobacion esta en MaintenancesService.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(ctx: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!required?.length) return true;

        const { user } = ctx.switchToHttp().getRequest<AuthRequest>();
        if (!user || !required.includes(user.role)) {
            throw new ForbiddenException('No tienes permisos para esta acción');
        }
        return true;
    }
}