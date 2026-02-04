import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDni', async: false })
export class IsDniConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'string') return false;

    // Limpiar formato (quitar guiones, espacios y pasar a mayúsculas)
    const cleanDni = value.trim().toUpperCase().replace(/[-\s]/g, '');
    
    // Verificar formato básico (8 números + 1 letra)
    if (!/^[0-9]{8}[TRWAGMYFPDXBNJZSTQVHLCKE]$/.test(cleanDni)) return false;

    // Algoritmo de validación de la letra (Módulo 23)
    const letras = 'TRWAGMYFPDXBNJZSTQVHLCKE';
    const numero = parseInt(cleanDni.substring(0, 8), 10);
    const letraEsperada = letras[numero % 23];
    const letraProporcionada = cleanDni.charAt(8);

    return letraEsperada === letraProporcionada;
  }

  defaultMessage() {
    return 'El DNI no es válido (formato incorrecto o letra no corresponde)';
  }
}

// Función del decorador
export function IsDni(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDniConstraint,
    });
  };
}