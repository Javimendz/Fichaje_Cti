import { ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";


// IsDni Constraint
/**
 * * * * * IsDni
 * * * Validador personalizado para verificar la validez de un DNI español. Este validador implementa la interfaz ValidatorConstraintInterface de class-validator y se encarga de validar que el formato del DNI sea correcto (8 dígitos seguidos de una letra) y que la letra corresponda al número según el algoritmo oficial. El validador también limpia el formato del DNI, eliminando espacios y guiones, y convierte las letras a mayúsculas para asegurar una validación precisa. Este validador se utiliza en los DTOs donde se requiere validar el campo DNI, garantizando que solo se acepten valores válidos.
 * 
 */
@ValidatorConstraint({ name: 'isDni', async: false })
export class IsDni implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'string') return false;

    // 1. Limpiar formato
    const cleanDni = value.trim().toUpperCase().replace(/[-\s]/g, '');
    
    // 2. Formato: 8 números y 1 letra de las permitidas (S y T están, pero en su sitio)
    // La cadena oficial NO tiene la 'U', 'I', 'O', 'Ñ'
    if (!/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(cleanDni)) return false;

    // 3. LA CADENA CORRECTA (23 caracteres)
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE'; 
    const numero = parseInt(cleanDni.substring(0, 8), 10);
    const letraEsperada = letras[numero % 23];
    const letraProporcionada = cleanDni.charAt(8);

    return letraEsperada === letraProporcionada;
  }

  defaultMessage() {
    return 'El DNI introducido es inválido (la letra no corresponde al número)';
  }
}