const fastify = require('fastify')({ logger: false });
const cors = require('@fastify/cors');
const cookie = require('@fastify/cookie');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { Usuario, Sala, Reserva, inicializarBD } = require('./database');

// Permiso para que el frontend en React pueda comunicarse y enviar cookies
fastify.register(cors, {
  origin: 'http://localhost:5173', // Puerto estándar de React (Vite)
  credentials: true
});

fastify.register(cookie);

// Guardaremos las sesiones activas aquí para vigilar los 30 minutos de inactividad
const sesionesActivas = new Map();
const TIEMPO_LIMITE = 30 * 60 * 1000; // 30 minutos en milisegundos

// Guardia de seguridad: revisa si la cookie existe y si no han pasado 30 minutos sin uso
async function verificarSesion(request, reply) {
  const token = request.cookies.sesion_id;
  if (!token || !sesionesActivas.has(token)) {
    return reply.code(401).send({ mensaje: 'No has iniciado sesión' });
  }

  const sesion = sesionesActivas.get(token);
  const ahora = Date.now();

  // Si pasaron más de 30 minutos desde su última acción, borramos la sesión y damos error 401
  if (ahora - sesion.ultimaActividad > TIEMPO_LIMITE) {
    sesionesActivas.delete(token);
    reply.clearCookie('sesion_id');
    return reply.code(401).send({ mensaje: 'La sesión expiró por 30 minutos de inactividad' });
  }

  // Si sigue activo, reiniciamos su reloj de 30 minutos
  sesion.ultimaActividad = ahora;
  reply.setCookie('sesion_id', token, {
    path: '/',
    httpOnly: true,
    maxAge: 1800 // 30 minutos en segundos
  });

  request.usuarioId = sesion.usuarioId;
}

// 1. Ruta para iniciar sesión (Login)
fastify.post('/api/login', async (request, reply) => {
  const { correo, contrasena } = request.body;
  const usuario = await Usuario.findOne({ where: { correo } });

  if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
    return reply.code(401).send({ mensaje: 'Correo o contraseña incorrectos' });
  }

  const token = crypto.randomUUID();
  sesionesActivas.set(token, {
    usuarioId: usuario.id,
    ultimaActividad: Date.now()
  });

  reply.setCookie('sesion_id', token, {
    path: '/',
    httpOnly: true,
    maxAge: 1800 // 30 minutos
  });

  return { mensaje: 'Bienvenido', correo: usuario.correo };
});

// 2. Ruta para obtener las salas y las reservas actuales
fastify.get('/api/salas', { preHandler: verificarSesion }, async () => {
  const salas = await Sala.findAll();
  const reservas = await Reserva.findAll({ include: [Sala] });
  return { salas, reservas };
});

// 3. Ruta para crear una reserva (revisando que no se crucen los horarios)
fastify.post('/api/reservas', { preHandler: verificarSesion }, async (request, reply) => {
  const { salaId, fecha, horaInicio, horaFin } = request.body;

  if (horaInicio >= horaFin) {
    return reply.code(400).send({ mensaje: 'La hora de fin debe ser después de la hora de inicio' });
  }

  // Buscamos si ya hay una reserva en esa misma sala y fecha cuyo horario se cruce
  const reservaCruzada = await Reserva.findOne({
    where: {
      SalaId: salaId,
      fecha: fecha,
      horaInicio: { [Op.lt]: horaFin },
      horaFin: { [Op.gt]: horaInicio }
    }
  });

  if (reservaCruzada) {
    return reply.code(400).send({ mensaje: 'Esa sala ya está ocupada en ese horario' });
  }

  const nuevaReserva = await Reserva.create({
    SalaId: salaId,
    UsuarioId: request.usuarioId,
    fecha,
    horaInicio,
    horaFin
  });

  return { mensaje: 'Reserva creada con éxito', reserva: nuevaReserva };
});

// Encendemos el servidor
async function iniciar() {
  try {
    await inicializarBD();
    await fastify.listen({ port: 3000 });
    console.log('Servidor listo en http://localhost:3000');
    console.log('Usuario de prueba: admin@biblioteca.com | Clave: 123456');
  } catch (error) {
    console.error('Error al iniciar:', error);
  }
}

iniciar();