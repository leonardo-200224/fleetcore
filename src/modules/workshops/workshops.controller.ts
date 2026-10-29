import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorators/auth.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { ChangeWorkshopStatusDto, CreateWorkshopDto } from './dto/workshop.dto.js';
import { WorkshopsService } from './workshops.service.js';

@ApiTags('workshops')
@Controller('workshops')
export class WorkshopsController {
    constructor(private readonly workshopsService: WorkshopsService) {}

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Registrar un taller (solo ADMIN)' })
    @Post()
    create(@Body() dto: CreateWorkshopDto) {
        return this.workshopsService.create(dto);
    }

    // Cualquier usuario autenticado puede verlos: el tecnico necesita
    // saber en que taller debe hacer su mantenimiento.
    @Auth()
    @ApiOperation({ summary: 'Listar los talleres activos' })
    @Get()
    findAllActive() {
        return this.workshopsService.findAllActive();
    }

    @Auth()
    @ApiOperation({ summary: 'Consultar un taller por su id' })
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.workshopsService.findOne(id);
    }

    @Auth(Role.ADMIN)
    @ApiOperation({ summary: 'Activar o inactivar un taller (solo ADMIN)' })
    @Patch(':id/status')
    changeStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ChangeWorkshopStatusDto,
    ) {
        return this.workshopsService.changeStatus(id, dto.status);
    }
}
