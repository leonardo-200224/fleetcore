import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcryptjs';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module.js';
import { MaintenanceStatus } from '../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../common/enums/maintenance-type.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { Status } from '../common/enums/status.enum.js';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import type { Env } from '../config/env.schema.js';
import { Maintenance } from '../modules/maintenances/entities/maintenance.entity.js';
import { Mechanic } from '../modules/mechanics/entities/mechanic.entity.js';
import { User } from '../modules/users/entities/user.entity.js';
import { Vehicle } from '../modules/vehicles/entities/vehicle.entity.js';
import { Workshop } from '../modules/workshops/entities/workshop.entity.js';

/**
 * Poblado inicial de la base de datos (requisito 9).
 *
 * Se ejecuta con un solo comando: npm run seed
 *
 * Es IDEMPOTENTE: cada registro se busca primero por un dato que no se
 * repite (el correo, la placa, el nombre del taller, la descripcion del
 * mantenimiento) y solo se crea si no existe. Por eso ejecutarlo dos
 * veces no duplica nada, que es lo que pide el requisito 9.2.
 */

// Contrasena de los dos tecnicos de ejemplo. Va aqui y en el README
// porque el enunciado pide entregar credenciales de prueba.
const CLAVE_TECNICOS = 'Tecnico123';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    const dataSource = app.get(DataSource);
    const config = app.get<ConfigService<Env, true>>(ConfigService);

    const usersRepo = dataSource.getRepository(User);
    const mechanicsRepo = dataSource.getRepository(Mechanic);
    const workshopsRepo = dataSource.getRepository(Workshop);
    const vehiclesRepo = dataSource.getRepository(Vehicle);
    const maintenancesRepo = dataSource.getRepository(Maintenance);

    const creados: string[] = [];
    const existentes: string[] = [];
    const anotar = (nuevo: boolean, etiqueta: string) =>
        (nuevo ? creados : existentes).push(etiqueta);

    // ---- a. 1 usuario ADMIN y 2 TECHNICIAN (requisito 9.1.a) ----

    async function crearUsuario(name: string, email: string, clave: string, role: Role) {
        const existe = await usersRepo.findOne({ where: { email } });
        if (existe) {
            anotar(false, `usuario ${email}`);
            return existe;
        }
        const user = await usersRepo.save(
            usersRepo.create({ name, email, password: await hash(clave, 10), role }),
        );
        anotar(true, `usuario ${email}`);
        return user;
    }

    await crearUsuario(
        'Administrador FleetCore',
        config.get('ADMIN_EMAIL', { infer: true }),
        config.get('ADMIN_PASSWORD', { infer: true }),
        Role.ADMIN,
    );
    const tecnicoJuan = await crearUsuario(
        'Juan Perez', 'juan.perez@fleetcore.com', CLAVE_TECNICOS, Role.TECHNICIAN,
    );
    const tecnicaLaura = await crearUsuario(
        'Laura Gomez', 'laura.gomez@fleetcore.com', CLAVE_TECNICOS, Role.TECHNICIAN,
    );

    // ---- b. 3 mecanicos: 2 activos vinculados a los tecnicos y 1 inactivo ----
    // El tercero NO tiene usuario: por eso la relacion con User es opcional.

    async function crearMecanico(
        name: string, email: string, specialty: string, status: Status, user: User | null,
    ) {
        const existe = await mechanicsRepo.findOne({ where: { email } });
        if (existe) {
            anotar(false, `mecanico ${email}`);
            return existe;
        }
        const mechanic = await mechanicsRepo.save(
            mechanicsRepo.create({ name, email, specialty, status, user }),
        );
        anotar(true, `mecanico ${email}`);
        return mechanic;
    }

    const mecanicoJuan = await crearMecanico(
        'Juan Perez', 'juan.perez@fleetcore.com', 'Motor', Status.ACTIVE, tecnicoJuan,
    );
    const mecanicaLaura = await crearMecanico(
        'Laura Gomez', 'laura.gomez@fleetcore.com', 'Frenos', Status.ACTIVE, tecnicaLaura,
    );
    await crearMecanico(
        'Carlos Ruiz', 'carlos.ruiz@fleetcore.com', 'Electricidad', Status.INACTIVE, null,
    );

    // ---- c. 2 talleres: 1 activo y 1 inactivo ----

    async function crearTaller(name: string, address: string, status: Status) {
        const existe = await workshopsRepo.findOne({ where: { name } });
        if (existe) {
            anotar(false, `taller ${name}`);
            return existe;
        }
        const workshop = await workshopsRepo.save(
            workshopsRepo.create({ name, address, status }),
        );
        anotar(true, `taller ${name}`);
        return workshop;
    }

    const tallerNorte = await crearTaller(
        'Taller Norte', 'Calle 80 # 45-12, Medellin', Status.ACTIVE,
    );
    await crearTaller('Taller Centro', 'Carrera 50 # 10-20, Medellin', Status.INACTIVE);

    // ---- d. 4 vehiculos: 2 AVAILABLE, 1 IN_MAINTENANCE y 1 INACTIVE ----

    async function crearVehiculo(
        plate: string, brand: string, model: string,
        year: number, mileage: number, status: VehicleStatus,
    ) {
        const existe = await vehiclesRepo.findOne({ where: { plate }, withDeleted: true });
        if (existe) {
            anotar(false, `vehiculo ${plate}`);
            return existe;
        }
        const vehicle = await vehiclesRepo.save(
            vehiclesRepo.create({ plate, brand, model, year, mileage, status }),
        );
        anotar(true, `vehiculo ${plate}`);
        return vehicle;
    }

    const abc123 = await crearVehiculo(
        'ABC123', 'Chevrolet', 'NPR', 2020, 45200, VehicleStatus.AVAILABLE,
    );
    await crearVehiculo('DEF456', 'Hino', '300', 2021, 23000, VehicleStatus.AVAILABLE);
    const ghi789 = await crearVehiculo(
        'GHI789', 'Isuzu', 'ELF', 2019, 78000, VehicleStatus.IN_MAINTENANCE,
    );
    await crearVehiculo('JKL012', 'Kia', 'K2700', 2016, 150000, VehicleStatus.INACTIVE);

    // ---- e. Los mantenimientos ----
    // Uno COMPLETED para que haya historial y otro IN_PROGRESS, que es el
    // que justifica que GHI789 este IN_MAINTENANCE.

    async function crearMantenimiento(
        description: string, datos: Partial<Maintenance>,
    ) {
        const existe = await maintenancesRepo.findOne({ where: { description } });
        if (existe) {
            anotar(false, `mantenimiento "${description}"`);
            return existe;
        }
        const maintenance = await maintenancesRepo.save(
            maintenancesRepo.create({ description, ...datos }),
        );
        anotar(true, `mantenimiento "${description}"`);
        return maintenance;
    }

    await crearMantenimiento('Cambio de aceite y filtros', {
        type: MaintenanceType.PREVENTIVE,
        mileage: 45000,
        scheduledStart: new Date('2026-09-15T14:00:00.000Z'),
        scheduledEnd: new Date('2026-09-15T16:30:00.000Z'),
        status: MaintenanceStatus.COMPLETED,
        workDone: 'Se cambio el aceite del motor y los dos filtros',
        finalCost: 350000,
        finishedAt: new Date('2026-09-15T16:30:00.000Z'),
        finalMileage: 45200,
        vehicle: abc123,
        mechanic: mecanicaLaura,
        workshop: tallerNorte,
    });

    await crearMantenimiento('Reparacion de la caja de cambios', {
        type: MaintenanceType.CORRECTIVE,
        mileage: 78000,
        scheduledStart: new Date('2026-11-10T13:00:00.000Z'),
        scheduledEnd: new Date('2026-11-10T18:00:00.000Z'),
        status: MaintenanceStatus.IN_PROGRESS,
        vehicle: ghi789,
        mechanic: mecanicoJuan,
        workshop: tallerNorte,
    });

    // ---- Resumen por consola ----

    console.log('\nSeed terminado.');
    console.log(`  Creados  (${creados.length}):`);
    creados.forEach((x) => console.log(`    + ${x}`));
    console.log(`  Ya existian (${existentes.length}):`);
    existentes.forEach((x) => console.log(`    = ${x}`));
    console.log('\nCredenciales de prueba:');
    console.log(`  ADMIN      -> ${config.get('ADMIN_EMAIL', { infer: true })}`);
    console.log(`  TECHNICIAN -> juan.perez@fleetcore.com / ${CLAVE_TECNICOS}`);
    console.log(`  TECHNICIAN -> laura.gomez@fleetcore.com / ${CLAVE_TECNICOS}\n`);

    await app.close();
}

await seed();
