# Decisiones Lucia

## (a) Qué entendí del problema y qué tablas/modelos planeé

El problema fue que se necesitaba un sistema para reservar salas en una biblioteca, que no permitiera crear reservas al mismo tiempo.

Para guardar la información planeé tres tablas (modelos):
- Usuario: Guarda el correo y la contraseña protegida para poder iniciar sesión.
- Sala: Guarda el nombre de cada sala disponible y su capacidad de personas.
- Reserva: Guarda la fecha, la hora de inicio y la hora de fin, uniendo qué usuario hizo la reserva y qué sala eligió.

## (b) que partes se delegaron a la IA y por que

Le delegue que me creara el codigo de los archivos que cree y me diera las dependencias que tenia que instalar 

## (c) 
Corregi la base de datos que habia elegido porque habia elegido SQlite3 y yo prefiero trabajar con PostgreSQL y levantarlo con Docker y pues cree mi propia contrasena 