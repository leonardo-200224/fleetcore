import { Exclude } from 'class-transformer';
import { Column, Entity } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/base.entity.js';
import { Role } from '../../../common/enums/role.enum.js';

@Entity('users')
export class User extends AppBaseEntity {
    @Column({ length: 100 })
    name: string;

    @Column({ unique: true, length: 150 })
    email: string;

    @Exclude()                       // nunca sale en una respuesta
    @Column({ select: false })       // no se trae en los find normales
    password: string;

    // Si no se envia rol al registrarse, queda como TECHNICIAN:
    // el ADMIN se crea desde el seeder, no por registro abierto.
    @Column({ type: 'enum', enum: Role, default: Role.TECHNICIAN })
    role: Role;
}
