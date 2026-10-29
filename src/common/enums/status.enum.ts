// Estado activo/inactivo que comparten talleres y mecanicos.
// El vehiculo NO usa este enum: tiene tres estados propios
// (AVAILABLE, IN_MAINTENANCE, INACTIVE) y vive en su propio archivo.
export enum Status {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}
