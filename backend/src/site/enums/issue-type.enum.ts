export enum IncidentType {
  WEATHER = 'WEATHER',       // Lluvia, viento fuerte, etc.
  MATERIAL = 'MATERIAL',     // Falta de suministros
  EQUIPMENT = 'EQUIPMENT',   // Avería de maquinaria
  ACCIDENT = 'ACCIDENT',     // Accidente laboral o daño
  PLAN_ERROR = 'PLAN_ERROR', // Error en planos o instrucciones
  OTHER = 'OTHER',
}

export enum     IncidentSeverity {
  LOW = 'LOW',       // No detiene la obra
  MEDIUM = 'MEDIUM', // Ralentiza el trabajo
  HIGH = 'HIGH',     // Obra parada totalmente
}