import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/base.entity.js';
import { Status } from '../../../common/enums/status.enum.js';
import { User } from '../../users/entities/user.entity.js';

/**
 * Mecanico que realiza los mantenimientos (requisito 3 del enunciado).
 *
 * OJO: mecanico NO es lo mismo que el usuario con rol TECHNICIAN.
 * El seeder pide "3 mecanicos: 2 activos vinculados a los tecnicos y 1 inactivo",
 * o sea que el tercero no tiene usuario. Por eso la relacion con User es
 * opcional: el mecanico existe en la flota aunque no tenga cuenta para entrar.
 */
@Entity('mechanics')
export class Mechanic extends AppBaseEntity {
    @Column({ length: 100 })
    name: string;

    @Column({ unique: true, length: 150 })
    email: string;

    // Ej: "Motor", "Frenos", "Electricidad". El enunciado no da una lista
    // cerrada de especialidades, asi que la dejo como texto libre.
    @Column({ length: 100 })
    specialty: string;

    // Se inactiva, no se borra: su historial de mantenimientos debe quedar
    // intacto (requisito 3.8).
    @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
    status: Status;

    // Relacion opcional con la cuenta de usuario, para que el tecnico
    // pueda consultar los mantenimientos que tiene asignados.
    @OneToOne(() => User, { nullable: true, eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User | null;
}
