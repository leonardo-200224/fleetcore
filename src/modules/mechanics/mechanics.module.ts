import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import { Mechanic } from './entities/mechanic.entity.js';
import { MechanicsController } from './mechanics.controller.js';
import { MechanicsService } from './mechanics.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Mechanic]),
        UsersModule, // para validar el usuario TECHNICIAN que se vincula
    ],
    controllers: [MechanicsController],
    providers: [MechanicsService],
    exports: [MechanicsService], // lo usara el modulo de mantenimientos
})
export class MechanicsModule {}
