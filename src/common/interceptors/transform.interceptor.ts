import {
    Injectable, type CallHandler, type ExecutionContext, type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';

export interface ApiResponse<T> {
    success: true;
    statusCode: number;
    data: T;
    timestamp: string;
}

/**
 * Da a TODAS las respuestas correctas la misma forma (requisito 7.1).
 *
 * El controlador devuelve solo los datos; este interceptor los envuelve en
 * success / statusCode / data / timestamp. Asi ningun controlador tiene que
 * acordarse del formato, y si manana cambia se cambia en un solo sitio.
 *
 * El statusCode se lee de la respuesta de Express, no se inventa: asi un POST
 * sale con 201 y un GET con 200 sin tener que pasarlo a mano.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(ctx: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
        const res = ctx.switchToHttp().getResponse<Response>();
        return next.handle().pipe(
            map((data) => ({
                success: true as const,
                statusCode: res.statusCode,
                data,
                timestamp: new Date().toISOString(),
            })),
        );
    }
}