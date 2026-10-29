import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import {
    ChangeMechanicStatusDto, CreateMechanicDto, UpdateMechanicDto,
} from './dto/mechanic.dto.js';
import { MechanicsService } from './mechanics.service.js';

@ApiTags('mechanics')
@Controller('mechanics')
export class MechanicsController {
    constructor(private readonly mechanicsService: MechanicsService) {}

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Registrar un mecanico (solo ADMIN)' })
    @Post()
    create(@Body() dto: CreateMechanicDto) {
        return this.mechanicsService.create(dto);
    }

    @Auth()
    @ApiOperation({ summary: 'Listar todos los mecanicos registrados' })
    @Get()
    findAll() {
        return this.mechanicsService.findAll();
    }

    @Auth()
    @ApiOperation({ summary: 'Consultar un mecanico por su id' })
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.mechanicsService.findOne(id);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Actualizar la informacion de un mecanico (solo ADMIN)' })
    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMechanicDto) {
        return this.mechanicsService.update(id, dto);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Activar o inactivar un mecanico (solo ADMIN)' })
    @Patch(':id/status')
    changeStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeMechanicStatusDto,
    ) {
        return this.mechanicsService.changeStatus(id, dto.status);
    }
}
