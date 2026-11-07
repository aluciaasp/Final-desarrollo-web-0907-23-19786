import { useState, useEffect } from 'react';

function App() {
  const [logueado, setLogueado] = useState(false);
  const [correo, setCorreo] = useState('admin@biblioteca.com');
  const [contrasena, setContrasena] = useState('123456');
  const [mensaje, setMensaje] = useState('');

  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);

  const [salaId, setSalaId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  // Carga las salas y verifica si la cookie de sesión sigue activa
  const cargarDatos = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/salas', {
        credentials: 'include'
      });

      // Si recibe un 401, redirige automáticamente a la pantalla de login
      if (respuesta.status === 401) {
        setLogueado(false);
        setMensaje('Tu sesión expiró o no has iniciado sesión.');
        return;
      }

      if (respuesta.ok) {
        const datos = await respuesta.json();
        setSalas(datos.salas);
        setReservas(datos.reservas);
        if (datos.salas.length > 0 && !salaId) {
          setSalaId(datos.salas[0].id);
        }
        setLogueado(true);
      }
    } catch (error) {
      console.error('Error al conectar con el servidor', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Inicio de sesión con cookie
  const manejarLogin = async (e) => {
    e.preventDefault();
    setMensaje('');

    const respuesta = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ correo, contrasena })
    });

    const datos = await respuesta.json();

    if (respuesta.ok) {
      setLogueado(true);
      setMensaje('');
      cargarDatos();
    } else {
      setMensaje(datos.mensaje || 'Error al iniciar sesión');
    }
  };

  // Crear reserva validando horarios y sesión activa
  const crearReserva = async (e) => {
    e.preventDefault();
    setMensaje('');

    const respuesta = await fetch('http://localhost:3000/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ salaId, fecha, horaInicio, horaFin })
    });

    // Redirige al login si recibe un error 401 tras 30 minutos de inactividad
    if (respuesta.status === 401) {
      setLogueado(false);
      setMensaje('La sesión expiró por 30 minutos de inactividad. Inicia sesión de nuevo.');
      return;
    }

    const datos = await respuesta.json();

    if (respuesta.ok) {
      setMensaje('✅ Reserva creada con éxito');
      cargarDatos();
    } else {
      setMensaje('❌ ' + datos.mensaje);
    }
  };

  // Pantalla de Login
  if (!logueado) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
        <h2>Iniciar Sesión - Biblioteca</h2>
        {mensaje && <p style={{ color: 'red' }}>{mensaje}</p>}
        <form onSubmit={manejarLogin}>
          <div style={{ marginBottom: '10px' }}>
            <label>Correo:</label><br />
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Contraseña:</label><br />
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 15px', cursor: 'pointer' }}>
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // Pantalla de Listado de Salas y Formulario de Reserva
  return (
    <div style={{ maxWidth: '700px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h2>Reserva de Salas de Biblioteca</h2>
      {mensaje && <p style={{ fontWeight: 'bold' }}>{mensaje}</p>}

      <h3>Listado de Salas</h3>
      <ul>
        {salas.map((s) => (
          <li key={s.id}>
            <strong>{s.nombre}</strong> (Capacidad: {s.capacidad} personas)
          </li>
        ))}
      </ul>

      <hr />

      <h3>Crear una Reserva</h3>
      <form onSubmit={crearReserva}>
        <div style={{ marginBottom: '10px' }}>
          <label>Sala: </label>
          <select value={salaId} onChange={(e) => setSalaId(e.target.value)} required>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Fecha: </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Hora de inicio: </label>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            required
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Hora de fin: </label>
          <input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            required
          />
        </div>

        <button type="submit" style={{ padding: '8px 15px', cursor: 'pointer' }}>
          Guardar Reserva
        </button>
      </form>

      <hr />

      <h3>Reservas Registradas</h3>
      {reservas.length === 0 ? (
        <p>Aún no hay reservas registradas.</p>
      ) : (
        <ul>
          {reservas.map((r) => (
            <li key={r.id}>
              <strong>{r.Sala?.nombre}</strong> — Fecha: {r.fecha} | De {r.horaInicio} a {r.horaFin}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;