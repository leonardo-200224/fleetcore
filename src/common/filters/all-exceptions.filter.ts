import {
    Catch, HttpException, HttpStatus, Logger, type ArgumentsHost, type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Atrapa cualquier error y lo devuelve con el formato del requisito 7.2:
 * codigo HTTP, mensaje, ruta y fecha.
 *
 * @Catch() sin argumentos significa "todos los errores", no solo los de Nest.
 * Eso importa por el requisito 7.4: los errores de validacion, de permisos y
 * los conflictos de la base de datos NO pueden salir como 500. Por eso los
 * errores de PostgreSQL se traducen aqui:
 *   23505 (clave unica repetida)   -> 409 Conflict
 *   23503 (clave foranea invalida) -> 400 Bad Request
 *
 * Solo se escribe en el log lo que de verdad quedo como 500, que es lo unico
 * que indica un fallo del servidor y no del cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Error interno del servidor';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            message = typeof body === 'string'
                ? body
                : ((body as { message?: string | string[] }).message ?? exception.message);
        } else if (exception instanceof QueryFailedError) {
            const code = (exception.driverError as { code?: string }).code;
            if (code === '23505') {
                status = HttpStatus.CONFLICT;
                message = 'El registro ya existe';
            } else if (code === '23503') {
                status = HttpStatus.BAD_REQUEST;
                message = 'Se referencia un registro que no existe';
            }
        }

        if (status === HttpStatus.INTERNAL_SERVER_ERROR) this.logger.error(exception);

        res.status(status).json({
            success: false,
            statusCode: status,
            message,
            path: req.url,
            timestamp: new Date().toISOString(),
        });
    }
}