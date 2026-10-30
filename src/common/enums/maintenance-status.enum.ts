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

/**
 * Mapa de transiciones permitidas (requisito 6).
 *
 * El enunciado dice que un COMPLETED no puede volver atras y que un
 * CANCELLED no puede pasar a IN_PROGRESS ni a COMPLETED, asi que esos
 * dos son estados finales: su lista queda vacia.
 *
 * Lo que el enunciado NO dice es que pasa con el vehiculo si se cancela
 * un mantenimiento que ya estaba IN_PROGRESS. Lo decido aqui: el vehiculo
 * vuelve a AVAILABLE, porque si no quedaria IN_MAINTENANCE para siempre.
 */
export const TRANSICIONES_PERMITIDAS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
    [MaintenanceStatus.SCHEDULED]: [
        MaintenanceStatus.IN_PROGRESS,
        MaintenanceStatus.CANCELLED,
    ],
    [MaintenanceStatus.IN_PROGRESS]: [
        MaintenanceStatus.COMPLETED,
        MaintenanceStatus.CANCELLED,
    ],
    [MaintenanceStatus.COMPLETED]: [],
    [MaintenanceStatus.CANCELLED]: [],
};
