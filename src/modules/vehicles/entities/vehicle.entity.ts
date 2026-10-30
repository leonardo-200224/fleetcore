import { Column, Entity } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/base.entity.js';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum.js';

// Vehiculo de la flota (requisito 2 del enunciado).
@Entity('vehicles')
export class Vehicle extends AppBaseEntity {
    // No puede haber dos vehiculos con la misma placa (requisito 2.4).
    @Column({ unique: true, length: 10 })
    plate: string;

    @Column({ length: 50 })
    brand: string;

    @Column({ length: 50 })
    model: string;

    @Column({ type: 'int' })
    year: number;

    // Kilometraje actual del vehiculo. Se actualiza al cerrar un mantenimiento.
    @Column({ type: 'int', default: 0 })
    mileage: number;

    @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
    status: VehicleStatus;
}
