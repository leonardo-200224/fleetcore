import { Column, Entity } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/base.entity.js';
import { Status } from '../../../common/enums/status.enum.js';

// Taller donde se realizan los mantenimientos (requisito 4 del enunciado).
// Hereda de AppBaseEntity el id uuid y las fechas de creacion/actualizacion.
@Entity('workshops')
export class Workshop extends AppBaseEntity {
    @Column({ length: 100 })
    name: string;

    @Column({ length: 150 })
    address: string;

    // Un taller no se borra: se inactiva, para no perder el historial
    // de los mantenimientos que ya se hicieron en el.
    @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
    status: Status;
}
