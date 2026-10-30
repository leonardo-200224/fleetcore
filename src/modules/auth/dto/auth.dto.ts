import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum.js';

const toLowerTrim = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
    @ApiProperty({ example: 'Ana Pérez' })
    @IsString({ message: 'El nombre debe ser texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MaxLength(100, { message: 'El nombre no puede pasar de 100 caracteres' })
    name: string;

    @ApiProperty({ example: 'ana@mail.com' })
    @Transform(toLowerTrim)
    @IsEmail({}, { message: 'El email no es válido' })
    email: string;

    @ApiProperty({ example: 'Clave1234' })
    @IsString({ message: 'La contraseña debe ser texto' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña necesita al menos una mayúscula y un número',
    })
    password: string;

    // El enunciado pide registrar usuarios con rol ADMIN o TECHNICIAN.
    // Es opcional: si no llega, la entidad lo deja en TECHNICIAN.
    @ApiPropertyOptional({ enum: Role, example: Role.TECHNICIAN })
    @IsOptional()
    @IsEnum(Role, { message: 'El rol debe ser ADMIN o TECHNICIAN' })
    role?: Role;
}

export class LoginDto {
    @ApiProperty({ example: 'ana@mail.com' })
    @Transform(toLowerTrim)
    @IsEmail({}, { message: 'El email no es valido' })
    email: string;

    @ApiProperty({ example: 'Clave1234' })
    @IsString({ message: 'La contraseña debe ser texto' })
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    password: string;
}
