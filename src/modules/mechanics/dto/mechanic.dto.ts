import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Status } from '../../../common/enums/status.enum.js';

const toLowerTrim = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateMechanicDto {
    @ApiProperty({ example: 'Carlos Perez' })
    @IsString({ message: 'El nombre debe ser texto' })
    @IsNotEmpty({ message: 'El nombre del mecanico es obligatorio' })
    @MaxLength(100, { message: 'El nombre no puede pasar de 100 caracteres' })
    name: string;

    @ApiProperty({ example: 'carlos@fleetcore.com' })
    @Transform(toLowerTrim)
    @IsEmail({}, { message: 'El correo del mecanico no es valido' })
    email: string;

    @ApiProperty({ example: 'Motor' })
    @IsString({ message: 'La especialidad debe ser texto' })
    @IsNotEmpty({ message: 'La especialidad es obligatoria' })
    @MaxLength(100, { message: 'La especialidad no puede pasar de 100 caracteres' })
    specialty: string;

    // Opcional a proposito: hay mecanicos sin cuenta de usuario.
    @ApiPropertyOptional({
        description: 'Id del usuario TECHNICIAN con el que se vincula el mecanico',
        example: '6f1c9b2e-4d3a-4c7e-9f21-8a5b3c7d1e40',
    })
    @IsOptional()
    @IsUUID('4', { message: 'El id del usuario no es valido' })
    userId?: string;
}

// Actualizar la informacion del mecanico (requisito 3.5).
// Escribo los campos uno a uno, todos opcionales, para que se vea claro
// que se puede cambiar y que no: el estado va por su propia ruta.
export class UpdateMechanicDto {
    @ApiPropertyOptional({ example: 'Carlos Perez Gomez' })
    @IsOptional()
    @IsString({ message: 'El nombre debe ser texto' })
    @IsNotEmpty({ message: 'El nombre no puede quedar vacio' })
    @MaxLength(100, { message: 'El nombre no puede pasar de 100 caracteres' })
    name?: string;

    @ApiPropertyOptional({ example: 'carlos.perez@fleetcore.com' })
    @IsOptional()
    @Transform(toLowerTrim)
    @IsEmail({}, { message: 'El correo del mecanico no es valido' })
    email?: string;

    @ApiPropertyOptional({ example: 'Frenos' })
    @IsOptional()
    @IsString({ message: 'La especialidad debe ser texto' })
    @IsNotEmpty({ message: 'La especialidad no puede quedar vacia' })
    @MaxLength(100, { message: 'La especialidad no puede pasar de 100 caracteres' })
    specialty?: string;
}

// Activar o inactivar un mecanico (requisito 3.6).
export class ChangeMechanicStatusDto {
    @ApiProperty({ enum: Status, example: Status.INACTIVE })
    @IsEnum(Status, { message: 'El estado debe ser ACTIVE o INACTIVE' })
    status: Status;
}
