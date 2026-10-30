import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js';
import {
    ChangeMaintenanceStatusDto, CompleteMaintenanceDto, CreateMaintenanceDto,
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

    // ---- Consultas (requisito 5.8) ----
    // Todas las rutas con palabra fija van ANTES de ':id', o ':id' se las traga.

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Listar todos los mantenimientos (solo ADMIN)' })
    @Get()
    findAll() {
        return this.maintenancesService.findAll();
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Listar los mantenimientos activos (solo ADMIN)' })
    @Get('active')
    findActive() {
        return this.maintenancesService.findActive();
    }

    // El tecnico consulta los suyos sin necesitar su id de mecanico:
    // se saca del token (criterio 1.2.b).
    @Auth(Role.TECHNICIAN)
    @ApiOperation({ summary: 'Listar los mantenimientos asignados a mi (solo TECHNICIAN)' })
    @Get('mine')
    findMine(@CurrentUser('sub') userId: string) {
        return this.maintenancesService.findMine(userId);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Listar los mantenimientos de un vehiculo (solo ADMIN)' })
    @Get('vehicle/:vehicleId')
    findByVehicle(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
        return this.maintenancesService.findByVehicle(vehicleId);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Historial de un vehiculo: solo los completados (solo ADMIN)' })
    @Get('vehicle/:vehicleId/history')
    findHistory(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
        return this.maintenancesService.findHistoryByVehicle(vehicleId);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Listar los mantenimientos de un mecanico (solo ADMIN)' })
    @Get('mechanic/:mechanicId')
    findByMechanic(@Param('mechanicId', ParseUUIDPipe) mechanicId: string) {
        return this.maintenancesService.findByMechanic(mechanicId);
    }

    // El tecnico solo puede abrir los suyos; el admin, cualquiera.
    @Auth(Role.ADMIN, Role.TECHNICIAN)
    @ApiOperation({ summary: 'Consultar un mantenimiento por su id' })
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
        return this.maintenancesService.findOneForUser(id, user);
    }

    // ---- Cambios de estado ----
    // El tecnico tambien puede actualizarlos, pero solo los que tiene
    // asignados: eso se comprueba dentro del servicio.

    @Auth(Role.ADMIN, Role.TECHNICIAN)
    @ApiOperation({ summary: 'Iniciar o cancelar un mantenimiento' })
    @Patch(':id/status')
    changeStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeMaintenanceStatusDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.maintenancesService.changeStatus(id, dto.status, user);
    }

    @Auth(Role.ADMIN, Role.TECHNICIAN)
    @ApiOperation({ summary: 'Cerrar un mantenimiento con sus datos finales' })
    @Patch(':id/complete')
    complete(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CompleteMaintenanceDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.maintenancesService.complete(id, dto, user);
    }
}
