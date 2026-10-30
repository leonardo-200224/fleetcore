import {
    BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';
import type { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Vehicle) private readonly vehiclesRepo: Repository<Vehicle>,
    ) {}

    async create(dto: CreateVehicleDto) {
        // withDeleted incluye los eliminados logicamente. Si no lo pusiera, al
        // registrar la placa de un vehiculo borrado la consulta no lo encontraria
        // pero la base si lo rechazaria, y el error saldria sin explicacion.
        const existe = await this.vehiclesRepo.findOne({
            where: { plate: dto.plate },
            withDeleted: true,
        });
        if (existe) {
            const detalle = existe.deletedAt ? ' (esta eliminado)' : '';
            throw new ConflictException(`Ya hay un vehiculo con la placa ${dto.plate}${detalle}`);
        }

        return this.vehiclesRepo.save(this.vehiclesRepo.create(dto));
    }

    // find() de TypeORM no trae los que tienen deleted_at, asi que los
    // vehiculos eliminados logicamente quedan fuera sin hacer nada mas.
    findAll() {
        return this.vehiclesRepo.find({ order: { plate: 'ASC' } });
    }

    async findOne(id: string) {
        const vehicle = await this.vehiclesRepo.findOne({ where: { id } });
        if (!vehicle) throw new NotFoundException(`Vehiculo ${id} no encontrado`);
        return vehicle;
    }

    // El enunciado pide poder buscar por identificador O por placa (requisito 2.5).
    async findByPlate(plate: string) {
        const buscada = plate.trim().toUpperCase();
        const vehicle = await this.vehiclesRepo.findOne({ where: { plate: buscada } });
        if (!vehicle) throw new NotFoundException(`Vehiculo con placa ${buscada} no encontrado`);
        return vehicle;
    }

    async update(id: string, dto: UpdateVehicleDto) {
        const vehicle = await this.findOne(id);
        // Igual que en mecanicos: solo copio lo que llego en el body, porque
        // los campos ausentes vienen como undefined y borrarian los valores.
        if (dto.brand !== undefined) vehicle.brand = dto.brand;
        if (dto.model !== undefined) vehicle.model = dto.model;
        if (dto.year !== undefined) vehicle.year = dto.year;
        if (dto.mileage !== undefined) vehicle.mileage = dto.mileage;

        return this.vehiclesRepo.save(vehicle);
    }

    // Activar o inactivar (requisito 2.7).
    async changeStatus(id: string, status: VehicleStatus) {
        const vehicle = await this.findOne(id);
        vehicle.status = status;
        return this.vehiclesRepo.save(vehicle);
    }

    /**
     * Eliminacion logica (requisito 2.7).
     *
     * Uso softDelete: solo escribe la fecha en deleted_at y deja la fila en la
     * tabla. Asi los mantenimientos historicos siguen apuntando a un vehiculo
     * que existe, que es justo lo que el enunciado pide no romper.
     */
    async softRemove(id: string) {
        const vehicle = await this.findOne(id);
        await this.vehiclesRepo.softDelete(vehicle.id);
        return { message: `Vehiculo ${vehicle.plate} eliminado logicamente` };
    }

    // Lo usara mantenimientos: un vehiculo inactivo no se puede asociar
    // a un mantenimiento nuevo (requisito 2.9).
    async findAssignableOrFail(id: string) {
        const vehicle = await this.findOne(id);
        if (vehicle.status === VehicleStatus.INACTIVE) {
            throw new BadRequestException(`El vehiculo ${vehicle.plate} esta inactivo`);
        }
        return vehicle;
    }
}
