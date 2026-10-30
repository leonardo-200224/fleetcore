import {
    BadRequestException, ConflictException, ForbiddenException, Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, MoreThan, Repository } from 'typeorm';
import {
    ESTADOS_ACTIVOS, MaintenanceStatus, TRANSICIONES_PERMITIDAS,
} from '../../common/enums/maintenance-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { WorkshopsService } from '../workshops/workshops.service.js';
import type {
    CompleteMaintenanceDto, CreateMaintenanceDto,
} from './dto/maintenance.dto.js';
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
     * Igual que findOne, pero comprobando que el TECHNICIAN solo pueda ver
     * los mantenimientos que tiene asignados. El RolesGuard no sirve para
     * esto: el rol es correcto, lo que falla es que el trabajo no es suyo.
     */
    async findOneForUser(id: string, user: JwtPayload) {
        const maintenance = await this.findOne(id);
        await this.validarQueEsSuyo(maintenance, user);
        return maintenance;
    }

    // ---- Consultas del requisito 5.8 ----

    // a. Todos los mantenimientos.
    findAll() {
        return this.maintenancesRepo.find({ order: { scheduledStart: 'DESC' } });
    }

    // b. Solo los activos, es decir SCHEDULED o IN_PROGRESS.
    findActive() {
        return this.maintenancesRepo.find({
            where: { status: In(ESTADOS_ACTIVOS) },
            order: { scheduledStart: 'ASC' },
        });
    }

    // c. Los de un vehiculo concreto, en cualquier estado.
    async findByVehicle(vehicleId: string) {
        await this.vehiclesService.findOne(vehicleId); // 404 si no existe
        return this.maintenancesRepo.find({
            where: { vehicle: { id: vehicleId } },
            order: { scheduledStart: 'DESC' },
        });
    }

    // d. Los asignados a un mecanico.
    async findByMechanic(mechanicId: string) {
        await this.mechanicsService.findOne(mechanicId); // 404 si no existe
        return this.maintenancesRepo.find({
            where: { mechanic: { id: mechanicId } },
            order: { scheduledStart: 'DESC' },
        });
    }

    /**
     * e. Historial de un vehiculo: solo los trabajos que de verdad se
     * hicieron, o sea los COMPLETED. Un mantenimiento cancelado o todavia
     * programado no es historial, es una intencion.
     */
    async findHistoryByVehicle(vehicleId: string) {
        await this.vehiclesService.findOne(vehicleId);
        return this.maintenancesRepo.find({
            where: {
                vehicle: { id: vehicleId },
                status: MaintenanceStatus.COMPLETED,
            },
            order: { finishedAt: 'DESC' },
        });
    }

    // Los mantenimientos del tecnico que esta conectado (criterio 1.2.b).
    async findMine(userId: string) {
        const mechanic = await this.mechanicsService.findByUserId(userId);
        if (!mechanic) return []; // el usuario aun no tiene ficha de mecanico

        return this.maintenancesRepo.find({
            where: { mechanic: { id: mechanic.id } },
            order: { scheduledStart: 'DESC' },
        });
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
    async changeStatus(id: string, nuevoEstado: MaintenanceStatus, user: JwtPayload) {
        const maintenance = await this.findOne(id);
        await this.validarQueEsSuyo(maintenance, user);
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

    /**
     * Cierra un mantenimiento (requisitos 5.9 y 6).
     *
     * Los cuatro datos de cierre son obligatorios y los exige el DTO, asi que
     * aqui solo queda comprobar el kilometraje y mover el vehiculo. Igual que
     * el cambio de estado, va en una transaccion: el mantenimiento se cierra y
     * el vehiculo se libera a la vez.
     */
    async complete(id: string, dto: CompleteMaintenanceDto, user: JwtPayload) {
        const maintenance = await this.findOne(id);
        await this.validarQueEsSuyo(maintenance, user);
        this.validarTransicion(maintenance.status, MaintenanceStatus.COMPLETED);

        const vehicle = maintenance.vehicle;

        // El odometro no puede retroceder: ni respecto a lo que se anoto al
        // programar el mantenimiento, ni respecto a lo que lleva el vehiculo.
        if (dto.finalMileage < maintenance.mileage) {
            throw new BadRequestException(
                `El kilometraje final ${dto.finalMileage} es inferior al registrado al programar (${maintenance.mileage})`,
            );
        }
        if (dto.finalMileage < vehicle.mileage) {
            throw new BadRequestException(
                `El kilometraje final ${dto.finalMileage} es inferior al actual del vehiculo (${vehicle.mileage})`,
            );
        }

        return this.dataSource.transaction(async (manager) => {
            maintenance.status = MaintenanceStatus.COMPLETED;
            maintenance.workDone = dto.workDone;
            maintenance.finalCost = dto.finalCost;
            maintenance.finishedAt = new Date(dto.finishedAt);
            maintenance.finalMileage = dto.finalMileage;

            // El vehiculo sale del taller y se queda con el kilometraje
            // que marco al terminar el trabajo.
            vehicle.status = VehicleStatus.AVAILABLE;
            vehicle.mileage = dto.finalMileage;
            await manager.save(vehicle);

            return manager.save(maintenance);
        });
    }

    /**
     * El ADMIN gestiona todo; el TECHNICIAN solo lo que tiene asignado.
     *
     * Esta comprobacion va aqui y no en un guard porque depende de los datos:
     * hay que cargar el mantenimiento y el mecanico del usuario para saber si
     * coinciden. Un tecnico que toca un trabajo ajeno recibe 403.
     */
    private async validarQueEsSuyo(maintenance: Maintenance, user: JwtPayload) {
        if (user.role === Role.ADMIN) return;

        const mechanic = await this.mechanicsService.findByUserId(user.sub);
        if (!mechanic || mechanic.id !== maintenance.mechanic.id) {
            throw new ForbiddenException('Este mantenimiento no esta asignado a ti');
        }
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
