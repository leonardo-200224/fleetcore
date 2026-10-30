import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MechanicsModule } from '../mechanics/mechanics.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { WorkshopsModule } from '../workshops/workshops.module.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenancesController } from './maintenances.controller.js';
import { MaintenancesService } from './maintenances.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Maintenance]),
        // Los tres modulos de catalogo, para validar que vehiculo, mecanico
        // y taller existan y esten disponibles antes de crear nada.
        VehiclesModule,
        MechanicsModule,
        WorkshopsModule,
    ],
    controllers: [MaintenancesController],
    providers: [MaintenancesService],
    exports: [MaintenancesService],
})
export class MaintenancesModule {}
