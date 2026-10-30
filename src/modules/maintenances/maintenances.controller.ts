import { Body, Controller, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import {
    ChangeMaintenanceStatusDto, CreateMaintenanceDto,
} from './dto/maintenance.dto.js';
import { MaintenancesService } from './maintenances.service.js';

@ApiTags('maintenances')
@Controller('maintenances')
export class MaintenancesController {
    constructor(private readonly maintenancesService: MaintenancesService) {}

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Crear un mantenimiento (solo ADMIN)' })
    @Post()
    create(@Body() dto: CreateMaintenanceDto) {
        return this.maintenancesService.create(dto);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Iniciar o cancelar un mantenimiento (solo ADMIN)' })
    @Patch(':id/status')
    changeStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeMaintenanceStatusDto,
    ) {
        return this.maintenancesService.changeStatus(id, dto.status);
    }
}
