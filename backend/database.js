const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize('biblioteca_db', 'postgres', '37211', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

// 1. Tabla de Usuarios
const Usuario = sequelize.define('Usuario', {
  correo: { type: DataTypes.STRING, allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING, allowNull: false }
});

// 2. Tabla de Salas
const Sala = sequelize.define('Sala', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  capacidad: { type: DataTypes.INTEGER, defaultValue: 10 }
});

// 3. Tabla de Reservas
const Reserva = sequelize.define('Reserva', {
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  horaInicio: { type: DataTypes.STRING, allowNull: false },
  horaFin: { type: DataTypes.STRING, allowNull: false }
});

// Relaciones entre tablas
Usuario.hasMany(Reserva);
Reserva.belongsTo(Usuario);

Sala.hasMany(Reserva);
Reserva.belongsTo(Sala);

// Función para crear las tablas y meter datos iniciales de prueba
async function inicializarBD() {
  await sequelize.sync();

  // Si no hay usuarios, creamos uno de prueba
  const totalUsuarios = await Usuario.count();
  if (totalUsuarios === 0) {
    const claveOculta = await bcrypt.hash('123456', 10);
    await Usuario.create({
      correo: 'admin@biblioteca.com',
      contrasena: claveOculta
    });
  }

  // Si no hay salas, creamos 3 salas de prueba
  const totalSalas = await Sala.count();
  if (totalSalas === 0) {
    await Sala.bulkCreate([
      { nombre: 'Sala de Estudio A', capacidad: 6 },
      { nombre: 'Sala Grupal B', capacidad: 12 },
      { nombre: 'Sala Silenciosa C', capacidad: 4 }
    ]);
  }
}

module.exports = { sequelize, Usuario, Sala, Reserva, inicializarBD };