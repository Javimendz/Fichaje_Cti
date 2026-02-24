// src/absence/dto/ausencia-estado.enum.ts
// El enum AusenciaEstado define los posibles estados de una solicitud de ausencia: PENDIENTE, APROBADA o RECHAZADA. Este enum se utiliza para validar y restringir los valores que pueden asignarse al campo estado en la entidad Ausencia, asegurando que solo se puedan usar estos tres estados específicos para representar el estado de una solicitud de ausencia en el sistema.

export enum AusenciaEstado {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA'
}

// src/absence/dto/create-absence.dto.ts
// DTO para crear una nueva solicitud de ausencia. Incluye validaciones para asegurar que los datos ingresados sean correctos y consistentes, como el tipo de ausencia, las fechas de inicio y fin, y un motivo opcional con longitud limitada. Este DTO se utiliza en el controlador de ausencias para recibir y validar los datos enviados por los usuarios al crear una nueva solicitud de ausencia.
/**
 * * * * CreateAbsenceDto
 * DTO para crear una nueva solicitud de ausencia. Incluye validaciones para asegurar que los datos ingresados sean correctos y consistentes, como el tipo de ausencia, las fechas de inicio y fin, y un motivo opcional con longitud limitada. Este DTO se utiliza en el controlador de ausencias para recibir y validar los datos enviados por los usuarios al crear una nueva solicitud de ausencia.
 * * El campo tipo es obligatorio y debe ser uno de los valores definidos en el enum TipoAusencia (VACACIONES, ENFERMEDAD, PERMISO o ASUNTOS_PROPIOS). Las fechas de inicio y fin son obligatorias y deben estar en formato de fecha ISO (AAAA-MM-DD). El motivo es opcional pero si se proporciona, debe ser una cadena de texto con una longitud mínima de 5 caracteres y máxima de 500 caracteres. Además, se aplican transformaciones para limpiar espacios accidentales en las entradas de texto.
 * */
export enum TipoAusencia {
  VACACIONES = 'VACACIONES',
  ENFERMEDAD = 'ENFERMEDAD',
  PERMISO = 'PERMISO',
  ASUNTOS_PROPIOS = 'ASUNTOS_PROPIOS',
}