import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from '../../common/enums/status.enum.js';
import type { CreateWorkshopDto } from './dto/workshop.dto.js';
import { Workshop } from './entities/workshop.entity.js';

@Injectable()
export class WorkshopsService {
    constructor(
        @InjectRepository(Workshop) private readonly workshopsRepo: Repository<Workshop>,
    ) {}

    create(dto: CreateWorkshopDto) {
        return this.workshopsRepo.save(this.workshopsRepo.create(dto));
    }

    // El enunciado pide listar los talleres ACTIVOS (requisito 4.3).
    findAllActive() {
        return this.workshopsRepo.find({
            where: { status: Status.ACTIVE },
            order: { name: 'ASC' },
        });
    }

    // Busca uno cualquiera, activo o inactivo (requisito 4.4).
    async findOne(id: string) {
        const workshop = await this.workshopsRepo.findOne({ where: { id } });
        if (!workshop) throw new NotFoundException(`Taller ${id} no encontrado`);
        return workshop;
    }

    // Activar o inactivar (requisito 4.5).
    async changeStatus(id: string, status: Status) {
        const workshop = await this.findOne(id);
        workshop.status = status;
        return this.workshopsRepo.save(workshop);
    }

    // Lo usara el modulo de mantenimientos: no se puede asignar un mantenimiento
    // a un taller inexistente o inactivo (requisito 4.6).
    async findActiveOrFail(id: string) {
        const workshop = await this.findOne(id);
        if (workshop.status !== Status.ACTIVE) {
            throw new BadRequestException(`El taller ${workshop.name} esta inactivo`);
        }
        return workshop;
    }
}
