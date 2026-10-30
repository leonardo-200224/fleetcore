import { Column, Entity, ManyToOne } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/base.entity.js';
import { MaintenanceStatus } from '../../../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../../../common/enums/maintenance-type.enum.js';
import { Mechanic } from '../../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../../workshops/entities/workshop.entity.js';

// Mantenimiento realizado sobre un vehiculo (requisito 5 del enunciado).
@Entity('maintenances')
export class Maintenance extends AppBaseEntity {
    @Column({ type: 'enum', enum: MaintenanceType })
    type: MaintenanceType;

    @Column({ type: 'text' })
    description: string;

    // Kilometraje del vehiculo cuando se programa el mantenimiento.
    @Column({ type: 'int' })
    mileage: number;

    /**
     * El enunciado (5.3.d) solo pide "fecha programada", pero el requisito 3.10
     * exige rechazar dos mantenimientos del mismo mecanico "cuyos horarios se
     * crucen", con ejemplos de hora de inicio y de fin. Sin saber cuando termina
     * no hay forma de detectar el cruce, asi que guardo inicio y fin.
     * El enunciado permite anadir campos: pide esos datos "como minimo".
     */
    @Column({ name: 'scheduled_start', type: 'timestamptz' })
    scheduledStart: Date;

    @Column({ name: 'scheduled_end', type: 'timestamptz' })
    scheduledEnd: Date;

    @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
    status: MaintenanceStatus;

    // ---- Datos de cierre (requisito 5.9). Vacios hasta que se completa ----

    @Column({ name: 'work_done', type: 'text', nullable: true })
    workDone: string | null;

    // En pesos enteros, como el ejemplo del enunciado ("cost": 350000).
    @Column({ name: 'final_cost', type: 'int', nullable: true })
    finalCost: number | null;

    @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
    finishedAt: Date | null;

    @Column({ name: 'final_mileage', type: 'int', nullable: true })
    finalMileage: number | null;

    // ---- Relaciones (requisito 5.2) ----

    @ManyToOne(() => Vehicle, { eager: true, nullable: false })
    vehicle: Vehicle;

    @ManyToOne(() => Mechanic, { eager: true, nullable: false })
    mechanic: Mechanic;

    @ManyToOne(() => Workshop, { eager: true, nullable: false })
    workshop: Workshop;
}
