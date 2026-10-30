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
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 45000, description: 'Kilometraje del vehiculo al programar' })
    @IsInt()
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
