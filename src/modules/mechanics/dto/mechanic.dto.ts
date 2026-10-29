import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Status } from '../../../common/enums/status.enum.js';

const toLowerTrim = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateMechanicDto {
    @ApiProperty({ example: 'Carlos Perez' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty({ example: 'carlos@fleetcore.com' })
    @Transform(toLowerTrim)
    @IsEmail({}, { message: 'El correo del mecanico no es valido' })
    email: string;

    @ApiProperty({ example: 'Motor' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    specialty: string;

    // Opcional a proposito: hay mecanicos sin cuenta de usuario.
    @ApiPropertyOptional({
        description: 'Id del usuario TECHNICIAN con el que se vincula el mecanico',
        example: '6f1c9b2e-4d3a-4c7e-9f21-8a5b3c7d1e40',
    })
    @IsOptional()
    @IsUUID()
    userId?: string;
}

// Actualizar la informacion del mecanico (requisito 3.5).
// Escribo los campos uno a uno, todos opcionales, para que se vea claro
// que se puede cambiar y que no: el estado va por su propia ruta.
export class UpdateMechanicDto {
    @ApiPropertyOptional({ example: 'Carlos Perez Gomez' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ example: 'carlos.perez@fleetcore.com' })
    @IsOptional()
    @Transform(toLowerTrim)
    @IsEmail({}, { message: 'El correo del mecanico no es valido' })
    email?: string;

    @ApiPropertyOptional({ example: 'Frenos' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    specialty?: string;
}

// Activar o inactivar un mecanico (requisito 3.6).
export class ChangeMechanicStatusDto {
    @ApiProperty({ enum: Status, example: Status.INACTIVE })
    @IsEnum(Status, { message: 'El estado debe ser ACTIVE o INACTIVE' })
    status: Status;
}
