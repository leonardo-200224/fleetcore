import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Status } from '../../../common/enums/status.enum.js';

export class CreateWorkshopDto {
    @ApiProperty({ example: 'Taller Norte' })
    @IsString({ message: 'El nombre del taller debe ser texto' })
    @IsNotEmpty({ message: 'El nombre del taller es obligatorio' })
    @MaxLength(100, { message: 'El nombre no puede pasar de 100 caracteres' })
    name: string;

    @ApiProperty({ example: 'Calle 80 # 45-12, Medellin' })
    @IsString({ message: 'La direccion debe ser texto' })
    @IsNotEmpty({ message: 'La direccion del taller es obligatoria' })
    @MaxLength(150, { message: 'La direccion no puede pasar de 150 caracteres' })
    address: string;
}

// Para activar o inactivar un taller (requisito 4.5).
export class ChangeWorkshopStatusDto {
    @ApiProperty({ enum: Status, example: Status.INACTIVE })
    @IsEnum(Status, { message: 'El estado debe ser ACTIVE o INACTIVE' })
    status: Status;
}
