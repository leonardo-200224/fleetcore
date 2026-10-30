import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min,
} from 'class-validator';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum.js';

// La placa se guarda siempre en mayusculas y sin espacios, para que
// "abc123" y "ABC123" no entren como dos vehiculos distintos.
const toUpperTrim = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateVehicleDto {
    @ApiProperty({ example: 'ABC123' })
    @Transform(toUpperTrim)
    @IsString({ message: 'La placa debe ser texto' })
    @IsNotEmpty({ message: 'La placa es obligatoria' })
    @MaxLength(10, { message: 'La placa no puede pasar de 10 caracteres' })
    @Matches(/^[A-Z0-9-]+$/, { message: 'La placa solo admite letras, numeros y guion' })
    plate: string;

    @ApiProperty({ example: 'Chevrolet' })
    @IsString({ message: 'La marca debe ser texto' })
    @IsNotEmpty({ message: 'La marca es obligatoria' })
    @MaxLength(50, { message: 'La marca no puede pasar de 50 caracteres' })
    brand: string;

    @ApiProperty({ example: 'NPR' })
    @IsString({ message: 'El modelo debe ser texto' })
    @IsNotEmpty({ message: 'El modelo es obligatorio' })
    @MaxLength(50, { message: 'El modelo no puede pasar de 50 caracteres' })
    model: string;

    @ApiProperty({ example: 2020 })
    @IsInt({ message: 'El anio debe ser un numero entero' })
    @Min(1900, { message: 'El anio no puede ser anterior a 1900' })
    @Max(2100, { message: 'El anio no puede ser posterior a 2100' })
    year: number;

    @ApiPropertyOptional({ example: 45000, description: 'Kilometraje actual; si no se envia queda en 0' })
    @IsOptional()
    @IsInt({ message: 'El kilometraje debe ser un numero entero' })
    @Min(0, { message: 'El kilometraje no puede ser negativo' })
    mileage?: number;
}

// Actualizar la informacion del vehiculo (requisito 2.6).
// La placa no se puede cambiar: es lo que identifica al vehiculo en los
// mantenimientos que ya existen.
export class UpdateVehicleDto {
    @ApiPropertyOptional({ example: 'Chevrolet' })
    @IsOptional()
    @IsString({ message: 'La marca debe ser texto' })
    @IsNotEmpty({ message: 'La marca no puede quedar vacia' })
    @MaxLength(50, { message: 'La marca no puede pasar de 50 caracteres' })
    brand?: string;

    @ApiPropertyOptional({ example: 'NPR Reward' })
    @IsOptional()
    @IsString({ message: 'El modelo debe ser texto' })
    @IsNotEmpty({ message: 'El modelo no puede quedar vacio' })
    @MaxLength(50, { message: 'El modelo no puede pasar de 50 caracteres' })
    model?: string;

    @ApiPropertyOptional({ example: 2021 })
    @IsOptional()
    @IsInt({ message: 'El anio debe ser un numero entero' })
    @Min(1900, { message: 'El anio no puede ser anterior a 1900' })
    @Max(2100, { message: 'El anio no puede ser posterior a 2100' })
    year?: number;

    @ApiPropertyOptional({ example: 52300 })
    @IsOptional()
    @IsInt({ message: 'El kilometraje debe ser un numero entero' })
    @Min(0, { message: 'El kilometraje no puede ser negativo' })
    mileage?: number;
}

// Activar o inactivar el vehiculo (requisito 2.7).
// A proposito NO admite IN_MAINTENANCE: ese estado lo pone el sistema solo,
// cuando arranca un mantenimiento.
export class ChangeVehicleStatusDto {
    @ApiProperty({ enum: [VehicleStatus.AVAILABLE, VehicleStatus.INACTIVE] })
    @IsIn([VehicleStatus.AVAILABLE, VehicleStatus.INACTIVE], {
        message: 'El estado debe ser AVAILABLE o INACTIVE; IN_MAINTENANCE lo asigna el sistema',
    })
    status: VehicleStatus;
}
