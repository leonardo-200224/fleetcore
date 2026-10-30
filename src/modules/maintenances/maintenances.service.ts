import {
    BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, MoreThan, Repository } from 'typeorm';
import {
    ESTADOS_ACTIVOS, MaintenanceStatus, TRANSICIONES_PERMITIDAS,
} from '../../common/enums/maintenance-status.enum.js';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { WorkshopsService } from '../workshops/workshops.service.js';
import type { CreateMaintenanceDto } from './dto/maintenance.dto.js';
import { Maintenance } from './entities/maintenance.entity.js';

@Injectable()
export class MaintenancesService {
    constructor(
        @InjectRepository(Maintenance)
        private readonly maintenancesRepo: Repository<Maintenance>,
        private readonly vehiclesService: VehiclesService,
        private readonly mechanicsService: MechanicsService,
        private readonly workshopsService: WorkshopsService,
        private readonly dataSource: DataSource, // para las transacciones
    ) {}

    /**
     * Crea un mantenimiento (requisito 5.1) comprobando todas las reglas
     * de negocio del requisito 6 antes de guardar nada.
     */
    async create(dto: CreateMaintenanceDto) {
        const inicio = new Date(dto.scheduledStart);
        const fin = new Date(dto.scheduledEnd);
        if (fin <= inicio) {
            throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
        }

        // Estas tres busquedas lanzan 404 si no existe y 400 si esta inactivo,
        // que es justo lo que piden los requisitos 2.9, 3.7 y 4.6.
        const vehicle = await this.vehiclesService.findAssignableOrFail(dto.vehicleId);
        const mechanic = await this.mechanicsService.findActiveOrFail(dto.mechanicId);
        const workshop = await this.workshopsService.findActiveOrFail(dto.workshopId);

        // El kilometraje del mantenimiento no puede ser menor que el que
        // lleva el vehiculo: no se puede retroceder el odometro.
        if (dto.mileage < vehicle.mileage) {
            throw new BadRequestException(
                `El kilometraje ${dto.mileage} es inferior al actual del vehiculo (${vehicle.mileage})`,
            );
        }

        await this.validarVehiculoLibre(vehicle.id, vehicle.plate);
        await this.validarMecanicoSinCruce(mechanic.id, mechanic.name, inicio, fin);

        const maintenance = this.maintenancesRepo.create({
            type: dto.type,
            description: dto.description,
            mileage: dto.mileage,
            scheduledStart: inicio,
            scheduledEnd: fin,
            status: MaintenanceStatus.SCHEDULED, // estado inicial (requisito 5.5)
            vehicle,
            mechanic,
            workshop,
        });
        return this.maintenancesRepo.save(maintenance);
    }

    async findOne(id: string) {
        const maintenance = await this.maintenancesRepo.findOne({ where: { id } });
        if (!maintenance) throw new NotFoundException(`Mantenimiento ${id} no encontrado`);
        return maintenance;
    }

    /**
     * Cambia el estado del mantenimiento (requisito 5.7) y arrastra el estado
     * del vehiculo, que es lo que pide el requisito 6:
     *   - a IN_PROGRESS -> el vehiculo pasa a IN_MAINTENANCE
     *   - cancelado estando IN_PROGRESS -> el vehiculo vuelve a AVAILABLE
     *
     * Los dos cambios van dentro de una TRANSACCION: o se guardan los dos, o
     * no se guarda ninguno. Si se guardara solo uno, el vehiculo podria quedar
     * IN_MAINTENANCE sin ningun mantenimiento en curso, o al reves.
     */
    async changeStatus(id: string, nuevoEstado: MaintenanceStatus) {
        const maintenance = await this.findOne(id);
        const estadoAnterior = maintenance.status;
        this.validarTransicion(estadoAnterior, nuevoEstado);

        return this.dataSource.transaction(async (manager) => {
            maintenance.status = nuevoEstado;

            if (nuevoEstado === MaintenanceStatus.IN_PROGRESS) {
                maintenance.vehicle.status = VehicleStatus.IN_MAINTENANCE;
                await manager.save(maintenance.vehicle);
            } else if (
                nuevoEstado === MaintenanceStatus.CANCELLED &&
                estadoAnterior === MaintenanceStatus.IN_PROGRESS
            ) {
                // Se cancelo un trabajo que ya habia empezado: el vehiculo
                // tiene que volver a quedar disponible.
                maintenance.vehicle.status = VehicleStatus.AVAILABLE;
                await manager.save(maintenance.vehicle);
            }

            return manager.save(maintenance);
        });
    }

    // Comprueba el mapa de transiciones y, si no se puede, responde 409
    // con un mensaje que dice exactamente que se intento (requisito 6).
    private validarTransicion(actual: MaintenanceStatus, nuevo: MaintenanceStatus) {
        if (actual === nuevo) {
            throw new ConflictException(`El mantenimiento ya esta en estado ${actual}`);
        }

        const permitidos = TRANSICIONES_PERMITIDAS[actual];
        if (!permitidos.includes(nuevo)) {
            const detalle = permitidos.length
                ? `solo puede pasar a ${permitidos.join(' o ')}`
                : 'es un estado final y ya no puede cambiar';
            throw new ConflictException(
                `Un mantenimiento en estado ${actual} ${detalle}`,
            );
        }
    }

    /**
     * Requisito 6: "Un vehiculo no podra tener simultaneamente mas de un
     * mantenimiento activo". Aqui es una regla simple, sin horarios: basta
     * con que exista otro SCHEDULED o IN_PROGRESS.
     */
    private async validarVehiculoLibre(vehicleId: string, plate: string) {
        const activo = await this.maintenancesRepo.findOne({
            where: {
                vehicle: { id: vehicleId },
                status: In(ESTADOS_ACTIVOS),
            },
        });
        if (activo) {
            throw new ConflictException(`El vehiculo ${plate} ya tiene un mantenimiento activo`);
        }
    }

    /**
     * Requisito 3.10: el mecanico no puede tener dos mantenimientos activos
     * "cuyos horarios se crucen", sin importar el taller.
     *
     * Dos rangos se cruzan cuando el nuevo empieza antes de que termine el
     * existente Y termina despues de que el existente empieza:
     *
     *     existente.inicio < nuevo.fin   Y   existente.fin > nuevo.inicio
     *
     * Con un mantenimiento de 7:30 a 9:00 ya guardado:
     *   - otro a las 8:00 -> 7:30 < 9:00 y 9:00 > 8:00  -> se cruza, se rechaza
     *   - otro a las 9:00 -> 7:30 < 10:00 pero 9:00 > 9:00 es falso -> se permite
     *
     * Son los ejemplos c y d del enunciado.
     */
    private async validarMecanicoSinCruce(
        mechanicId: string, nombre: string, inicio: Date, fin: Date,
    ) {
        const cruce = await this.maintenancesRepo.findOne({
            where: {
                mechanic: { id: mechanicId },
                status: In(ESTADOS_ACTIVOS),
                scheduledStart: LessThan(fin),
                scheduledEnd: MoreThan(inicio),
            },
        });
        if (cruce) {
            throw new ConflictException(
                `El mecanico ${nombre} ya tiene un mantenimiento en ese horario`,
            );
        }
    }
}
