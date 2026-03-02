
/**
 *  Enum para representar los diferentes tipos de puestos de trabajo en la fábrica.
 * 
 * Este enum define los posibles roles o puestos que pueden tener los trabajadores en la fábrica,
 * incluyendo puestos de producción, planta, ingeniería y administrativos.  
 * 
 * Cada valor en este enum representa un tipo específico de puesto de trabajo,
 * lo cual ayuda a organizar y gestionar los diferentes roles dentro de la fábrica. 
 */
export enum TipoPuesto {
  // --- Puestos de Producción y Planta ---
  OPERARIO_PRODUCCION = 'OPERARIO_PRODUCCION',
  TECNICO_MANTENIMIENTO = 'TECNICO_MANTENIMIENTO',
  SUPERVISOR_TURNO = 'SUPERVISOR_TURNO',
  INSPECTOR_CALIDAD = 'INSPECTOR_CALIDAD',
  MOZO_ALMACEN = 'MOZO_ALMACEN',
  CARRETILLERO = 'CARRETILLERO',
  JEFE_PLANTA = 'JEFE_PLANTA',
  PREVENCION_RIESGOS = 'PREVENCION_RIESGOS',
  ADMINISTRATIVO = 'ADMINISTRATIVO',

  // --- Puestos de Ingeniería ---
  INGENIERO_PROCESOS = 'INGENIERO_PROCESOS',
  INGENIERO_PRODUCCION = 'INGENIERO_PRODUCCION',
  INGENIERO_MANTENIMIENTO = 'INGENIERO_MANTENIMIENTO',
  INGENIERO_CALIDAD = 'INGENIERO_CALIDAD',
  INGENIERO_AUTOMATIZACION = 'INGENIERO_AUTOMATIZACION',
  INGENIERO_PROYECTOS = 'INGENIERO_PROYECTOS',
  JEFE_INGENIERIA = 'JEFE_INGENIERIA',

  // --- Otros ---
  OTRO = 'OTRO'
}