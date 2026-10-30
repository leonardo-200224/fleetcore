// Estados del vehiculo (requisito 2.8). Son tres y no coinciden con el
// ACTIVE/INACTIVE de talleres y mecanicos, por eso van en su propio enum.
//
// IN_MAINTENANCE no lo pone el administrador a mano: lo pone el sistema
// cuando un mantenimiento pasa a IN_PROGRESS (requisito 6).
export enum VehicleStatus {
    AVAILABLE = 'AVAILABLE',
    IN_MAINTENANCE = 'IN_MAINTENANCE',
    INACTIVE = 'INACTIVE'
}
