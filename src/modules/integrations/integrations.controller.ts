import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuth } from '../../common/decorators/api-key-auth.decorator.js';
import { IntegrationsService } from './integrations.service.js';

/**
 * Endpoints para sistemas externos (requisito 1.8).
 *
 * No se entra con token JWT sino con la cabecera x-api-key: al otro lado
 * no hay una persona que inicie sesion, hay un sistema.
 */
@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
    constructor(private readonly integrationsService: IntegrationsService) {}

    @ApiKeyAuth()
    @ApiOperation({
        summary: 'Ficha de un vehiculo con su historial (requiere cabecera x-api-key)',
    })
    @Get('vehicles/:plate')
    getVehicleFile(@Param('plate') plate: string) {
        return this.integrationsService.getVehicleFile(plate);
    }
}
