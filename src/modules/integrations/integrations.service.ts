import { Injectable } from '@nestjs/common';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';
import { MaintenancesService } from '../maintenances/maintenances.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';

@Injectable()
export class IntegrationsService {
    constructor(
        private readonly vehiclesService: VehiclesService,
        private readonly maintenancesService: MaintenancesService,
    ) {}

    /**
     * Ficha de un vehiculo para un sistema externo (requisito 1.8).
     *
     * Devuelvo solo lo que el ejemplo del enunciado muestra, no la entidad
     * entera: un tercero no tiene por que recibir las fechas internas ni el
     * correo del mecanico.
     *
     * El ejemplo muestra "available": true, un booleano, pero el vehiculo
     * tiene tres estados (requisito 2.8). Lo resuelvo asi: por dentro sigue
     * siendo el enum, y aqui lo traduzco a "esta disponible o no". El enum
     * completo viaja igual en "status", por si al otro sistema le sirve.
     */
    async getVehicleFile(plate: string) {
        const vehicle = await this.vehiclesService.findByPlate(plate);
        const history = await this.maintenancesService.findHistoryByVehicle(vehicle.id);

        return {
            vehicle: {
                id: vehicle.id,
                plate: vehicle.plate,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                mileage: vehicle.mileage,
                status: vehicle.status,
                available: vehicle.status === VehicleStatus.AVAILABLE,
            },
            maintenances: history.map((m) => ({
                id: m.id,
                type: m.type,
                status: m.status,
                description: m.description,
                mileage: m.finalMileage,
                cost: m.finalCost,
                finishedAt: m.finishedAt,
                mechanic: { id: m.mechanic.id, name: m.mechanic.name },
                workshop: { id: m.workshop.id, name: m.workshop.name },
            })),
        };
    }
}
