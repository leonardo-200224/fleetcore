import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString, IsEnum, IsIn, IsInt, IsNotEmpty, IsString, IsUUID, Min,
} from 'class-validator';
import { MaintenanceStatus } from '../../../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../../../common/enums/maintenance-type.enum.js';

export class CreateMaintenanceDto {
    @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
    @IsEnum(MaintenanceType, { message: 'El tipo debe ser PREVENTIVE o CORRECTIVE' })
    type: MaintenanceType;

    @ApiProperty({ example: 'Cambio de aceite y filtros' })
    @IsString({ message: 'La descripcion debe ser texto' })
    @IsNotEmpty({ message: 'La descripcion del mantenimiento es obligatoria' })
    description: string;

    @ApiProperty({ example: 45000, description: 'Kilometraje del vehiculo al programar' })
    @IsInt({ message: 'El kilometraje debe ser un numero entero' })
    @Min(0, { message: 'El kilometraje no puede ser negativo' })
    mileage: number;

    @ApiProperty({ example: '2026-11-05T07:30:00.000Z' })
    @IsDateString({}, { message: 'La fecha de inicio no es valida' })
    scheduledStart: string;

    @ApiProperty({ example: '2026-11-05T09:00:00.000Z' })
    @IsDateString({}, { message: 'La fecha de fin no es valida' })
    scheduledEnd: string;

    @ApiProperty({ example: '6f1c9b2e-4d3a-4c7e-9f21-8a5b3c7d1e40' })
    @IsUUID('4', { message: 'El id del vehiculo no es valido' })
    vehicleId: string;

    @ApiProperty({ example: '6f1c9b2e-4d3a-4c7e-9f21-8a5b3c7d1e41' })
    @IsUUID('4', { message: 'El id del mecanico no es valido' })
    mechanicId: string;

    @ApiProperty({ example: '6f1c9b2e-4d3a-4c7e-9f21-8a5b3c7d1e42' })
    @IsUUID('4', { message: 'El id del taller no es valido' })
    workshopId: string;
}

/**
 * Cambio de estado del mantenimiento (requisito 5.7).
 *
 * Solo admite IN_PROGRESS y CANCELLED. Para COMPLETED hay una ruta aparte,
 * porque el requisito 5.9 exige registrar los datos de cierre y aqui no
 * habria donde enviarlos.
 */
export class ChangeMaintenanceStatusDto {
    @ApiProperty({ enum: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED] })
    @IsIn([MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED], {
        message: 'El estado debe ser IN_PROGRESS o CANCELLED; para COMPLETED usa el cierre',
    })
    status: MaintenanceStatus;
}

/**
 * Datos obligatorios para cerrar un mantenimiento (requisito 5.9).
 *
 * Los cuatro son obligatorios a proposito: el requisito 6 dice que "no se
 * podra completar un mantenimiento si no contiene la informacion obligatoria
 * de cierre", y al declararlos asi el ValidationPipe ya responde 400 sin que
 * el servicio tenga que comprobar nada.
 */
export class CompleteMaintenanceDto {
    @ApiProperty({ example: 'Se cambio el aceite y los dos filtros' })
    @IsString({ message: 'Debes registrar el trabajo realizado' })
    @IsNotEmpty({ message: 'Debes registrar el trabajo realizado' })
    workDone: string;

    @ApiProperty({ example: 350000, description: 'Costo final en pesos' })
    @IsInt({ message: 'Debes registrar el costo final, en pesos enteros' })
    @Min(0, { message: 'El costo final no puede ser negativo' })
    finalCost: number;

    @ApiProperty({ example: '2026-11-05T09:00:00.000Z' })
    @IsDateString({}, { message: 'Debes registrar una fecha de finalizacion valida' })
    finishedAt: string;

    @ApiProperty({ example: 45200, description: 'Kilometraje del vehiculo al terminar' })
    @IsInt({ message: 'Debes registrar el kilometraje final' })
    @Min(0, { message: 'El kilometraje final no puede ser negativo' })
    finalMileage: number;
}
