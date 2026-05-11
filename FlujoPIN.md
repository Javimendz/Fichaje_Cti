Aquí tienes el mapa mental de cómo funciona todo ahora:

1. El Acto de "Bautismo" (Generación del PIN)
Este paso lo hace el Admin o Encargado para dar de alta a un trabajador en el sistema de fichaje.

Entrada: El Admin accede a la zona oculta y mete la Contraseña Maestra y el DNI del trabajador.

Validación Maestra: El servidor comprueba que la contraseña coincide con la del .env.

Identificación: El sistema busca al trabajador por su DNI para saber quién es.

Cifrado "Pimienta" (HMAC-SHA256):

El sistema genera un código aleatorio (ej: 456123).

Toma ese código y lo mezcla con la PIN_PEPPER de tu .env.

Genera un hash (una cadena larga e ilegible) y la guarda en la base de datos.

Entrega: El sistema le escupe al Admin el número 456123 por pantalla. El Admin se lo da al trabajador.

2. El Día a Día (Login del Trabajador)
Este es el flujo que usará el trabajador en la tablet de la obra. Es "estilo cajero automático".

Acción: El trabajador solo tiene que teclear su PIN de 6 dígitos.

Protección de Ataques: El Rate Limiter vigila. Si alguien intenta probar números al azar más de 5 veces, el sistema bloquea esa tablet por un tiempo.

Búsqueda Silenciosa:

El servidor recibe el PIN, le añade la "pimienta" (PIN_PEPPER) y calcula el hash.

Lanza una búsqueda en la base de datos: "¿Quién tiene este hash?".

Identificación Instantánea: Como el hash es único, la base de datos encuentra al trabajador inmediatamente.

Emisión de Llaves: El AuthService genera un Token JWT oficial.