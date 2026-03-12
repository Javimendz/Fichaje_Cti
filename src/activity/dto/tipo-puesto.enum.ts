
/**
 *  Enum para representar los diferentes tipos de puestos de trabajo en la fábrica.
 * 
 * Este enum define los posibles roles o puestos que pueden tener los trabajadores en la fábrica,
 * incluyendo puestos de producción, planta, ingeniería y administrativos.  
 * 
 * Cada valor en este enum representa un tipo específico de puesto de trabajo,
 * lo cual ayuda a organizar y gestionar los diferentes roles dentro de la fábrica. 
 */export enum TipoPuesto {
  DIRECCION_GESTION = 'DIRECCION_GESTION',
  ADMINISTRACION_OFICINA = 'ADMINISTRACION_OFICINA',
  COMERCIAL_VENTAS = 'COMERCIAL_VENTAS',
  ATENCION_CLIENTE = 'ATENCION_CLIENTE',
  TECNOLOGIA_IT = 'TECNOLOGIA_IT',
  PRODUCCION_OPERACIONES = 'PRODUCCION_OPERACIONES',
  SALUD_SERVICIOS_SOCIALES = 'SALUD_SERVICIOS_SOCIALES',
  EDUCACION_FORMACION = 'EDUCACION_FORMACION',
  CREATIVO_MARKETING = 'CREATIVO_MARKETING',
  OFICIOS_TRABAJOS_TECNICOS = 'OFICIOS_TRABAJOS_TECNICOS',
  OTROS = 'OTROS'
}