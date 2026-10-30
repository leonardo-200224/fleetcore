// Estados del mantenimiento (requisito 5.6). El inicial siempre es
// SCHEDULED (requisito 5.5).
export enum MaintenanceStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

// Un mantenimiento "activo" es el que todavia no termino. Lo uso en las
// reglas del requisito 6: un vehiculo no puede tener dos activos a la vez,
// y un mecanico no puede tener dos activos con horarios cruzados.
export const ESTADOS_ACTIVOS = [
    MaintenanceStatus.SCHEDULED,
    MaintenanceStatus.IN_PROGRESS,
];
