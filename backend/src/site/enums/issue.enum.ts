// src/site/enums/incidencia.enum.ts

export enum TipoIncidencia {
  CLIMA = 'CLIMA',               // Lluvia, nieve, calor extremo, etc.
  MATERIAL = 'MATERIAL',         // Falta de suministros o material defectuoso
  MAQUINARIA = 'MAQUINARIA',     // Avería de herramientas o maquinaria pesada
  ACCIDENTE = 'ACCIDENTE',       // Accidente laboral o situación de riesgo
  ERROR_PLANOS = 'ERROR_PLANOS', // Incongruencias en instrucciones o planos
  OTRO = 'OTRO',                 // Otros imprevistos
}

export enum GravedadIncidencia {
  BAJA = 'BAJA',   // Molestia menor, la obra continúa normalmente
  MEDIA = 'MEDIA', // El ritmo de trabajo se ve afectado o ralentizado
  ALTA = 'ALTA',   // ¡OBRA PARADA! Requiere atención inmediata
}