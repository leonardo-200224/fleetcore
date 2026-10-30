import {
    Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import {
    ChangeVehicleStatusDto, CreateVehicleDto, UpdateVehicleDto,
} from './dto/vehicle.dto.js';
import { VehiclesService } from './vehicles.service.js';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) {}

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Registrar un vehiculo (solo ADMIN)' })
    @Post()
    create(@Body() dto: CreateVehicleDto) {
        return this.vehiclesService.create(dto);
    }

    @Auth()
    @ApiOperation({ summary: 'Listar los vehiculos registrados' })
    @Get()
    findAll() {
        return this.vehiclesService.findAll();
    }

    // Esta ruta va ANTES que ':id', o ':id' se traga la palabra "plate".
    @Auth()
    @ApiOperation({ summary: 'Consultar un vehiculo por su placa' })
    @Get('plate/:plate')
    findByPlate(@Param('plate') plate: string) {
        return this.vehiclesService.findByPlate(plate);
    }

    @Auth()
    @ApiOperation({ summary: 'Consultar un vehiculo por su id' })
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.vehiclesService.findOne(id);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Actualizar la informacion de un vehiculo (solo ADMIN)' })
    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
        return this.vehiclesService.update(id, dto);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Activar o inactivar un vehiculo (solo ADMIN)' })
    @Patch(':id/status')
    changeStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeVehicleStatusDto,
    ) {
        return this.vehiclesService.changeStatus(id, dto.status);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Eliminacion logica de un vehiculo (solo ADMIN)' })
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.vehiclesService.softRemove(id);
    }
}
