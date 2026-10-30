# Evidencias de pruebas

Capturas de Swagger probando los escenarios principales de la API.

| Captura | Que muestra |
|---|---|
| 01 | La documentacion Swagger en `/docs` |
| 02 | Login de un tecnico: devuelve el token con `"role": "TECHNICIAN"` |
| 03 | Pedir los mantenimientos sin token: **401** `"Token requerido"` |
| 04 | El mismo endpoint con el token del tecnico: **403** `"No tienes permisos para esta accion"`, porque la lista completa es solo del ADMIN |
| 05 | `GET /maintenances/mine`: el tecnico si ve el mantenimiento que tiene asignado, con el taller donde debe hacerlo |
| 06 | Crear un mantenimiento para un vehiculo que ya tiene uno activo: **409** `"El vehiculo GHI789 ya tiene un mantenimiento activo"` |
| 07 | El vehiculo ABC123 antes de empezar: `AVAILABLE` |
| 08 | Se pasa su mantenimiento a `IN_PROGRESS` |
| 09 | El mismo vehiculo despues: `IN_MAINTENANCE`. Las capturas 07, 08 y 09 juntas muestran la transaccion: el mantenimiento y el vehiculo cambian a la vez |
| 10 | El endpoint de integracion con la cabecera `x-api-key`: la ficha del vehiculo con su historial, y `available` calculado a partir del estado |
