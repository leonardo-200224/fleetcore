import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Status } from '../../../common/enums/status.enum.js';

export class CreateWorkshopDto {
    @ApiProperty({ example: 'Taller Norte' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty({ example: 'Calle 80 # 45-12, Medellin' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    address: string;
}

// Para activar o inactivar un taller (requisito 4.5).
export class ChangeWorkshopStatusDto {
    @ApiProperty({ enum: Status, example: Status.INACTIVE })
    @IsEnum(Status, { message: 'El estado debe ser ACTIVE o INACTIVE' })
    status: Status;
}
