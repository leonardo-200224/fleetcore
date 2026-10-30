import {
    BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { Status } from '../../common/enums/status.enum.js';
import { UsersService } from '../users/users.service.js';
import type {
    CreateMechanicDto, UpdateMechanicDto,
} from './dto/mechanic.dto.js';
import { Mechanic } from './entities/mechanic.entity.js';

@Injectable()
export class MechanicsService {
    constructor(
        @InjectRepository(Mechanic) private readonly mechanicsRepo: Repository<Mechanic>,
        private readonly usersService: UsersService,
    ) {}

    async create(dto: CreateMechanicDto) {
        await this.validarEmailLibre(dto.email);

        const { userId, ...datos } = dto;
        const mechanic = this.mechanicsRepo.create(datos);
        mechanic.user = userId ? await this.buscarTecnicoLibre(userId) : null;

        return this.mechanicsRepo.save(mechanic);
    }

    // El enunciado pide TODOS los mecanicos registrados, activos e inactivos
    // (requisito 3.3). Es distinto de los talleres, donde pide solo los activos.
    findAll() {
        return this.mechanicsRepo.find({ order: { name: 'ASC' } });
    }

    async findOne(id: string) {
        const mechanic = await this.mechanicsRepo.findOne({ where: { id } });
        if (!mechanic) throw new NotFoundException(`Mecanico ${id} no encontrado`);
        return mechanic;
    }

    async update(id: string, dto: UpdateMechanicDto) {
        const mechanic = await this.findOne(id);
        // Si cambia el correo, hay que revisar que no lo tenga otro mecanico.
        if (dto.email && dto.email !== mechanic.email) {
            await this.validarEmailLibre(dto.email);
        }
        // Copio solo los campos que llegaron en el body. Con Object.assign(mechanic, dto)
        // tambien se copian los que no se enviaron, que llegan como undefined, y el
        // mecanico se quedaba sin nombre ni correo en la respuesta.
        if (dto.name !== undefined) mechanic.name = dto.name;
        if (dto.email !== undefined) mechanic.email = dto.email;
        if (dto.specialty !== undefined) mechanic.specialty = dto.specialty;

        return this.mechanicsRepo.save(mechanic);
    }

    // Activar o inactivar (requisito 3.6). No se borra nada, asi que su
    // historial de mantenimientos se conserva (requisito 3.8).
    async changeStatus(id: string, status: Status) {
        const mechanic = await this.findOne(id);
        mechanic.status = status;
        return this.mechanicsRepo.save(mechanic);
    }

    // Lo usara mantenimientos: no se puede asignar un mecanico
    // inexistente o inactivo (requisito 3.7).
    async findActiveOrFail(id: string) {
        const mechanic = await this.findOne(id);
        if (mechanic.status !== Status.ACTIVE) {
            throw new BadRequestException(`El mecanico ${mechanic.name} esta inactivo`);
        }
        return mechanic;
    }

    /**
     * Devuelve el mecanico vinculado a una cuenta de usuario.
     *
     * Lo usa mantenimientos para saber que trabajos son "los suyos" cuando
     * entra un TECHNICIAN. Puede no existir: un usuario tecnico recien
     * registrado todavia no tiene ficha de mecanico.
     */
    findByUserId(userId: string) {
        return this.mechanicsRepo.findOne({ where: { user: { id: userId } } });
    }

    private async validarEmailLibre(email: string) {
        const existe = await this.mechanicsRepo.findOne({ where: { email } });
        if (existe) throw new ConflictException('Ya hay un mecanico con ese correo');
    }

    // El usuario que se vincula tiene que existir, ser TECHNICIAN y no
    // estar ya ocupado por otro mecanico (la relacion es uno a uno).
    private async buscarTecnicoLibre(userId: string) {
        const user = await this.usersService.findOne(userId);
        if (user.role !== Role.TECHNICIAN) {
            throw new BadRequestException('Solo se puede vincular un usuario con rol TECHNICIAN');
        }

        const ocupado = await this.mechanicsRepo.findOne({ where: { user: { id: userId } } });
        if (ocupado) {
            throw new ConflictException(`El usuario ya esta vinculado al mecanico ${ocupado.name}`);
        }
        return user;
    }
}
