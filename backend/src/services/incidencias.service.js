const incidenciasRepository = require('../repositories/incidencias.repository');
const tecnicosRepository = require('../repositories/tecnicos.repository');

const mapIncidencia = (inc) => ({
  id: inc.id,
  codigoEquipo: inc.codigo_equipo,
  problema: inc.problema,
  usuarioResponsable: inc.usuario_responsable,
  registradoPor: inc.registrado_por,
  fechaHora: inc.fecha_hora,
  estado: inc.estado,
  tecnicoAsignado: inc.tecnico_asignado,
  informeTecnico: inc.informe_tecnico,
  repuestoSolicitado: inc.repuesto_solicitado,
  historial: inc.historial
    ? inc.historial.map((h) => ({
        fecha: h.fecha,
        evento: h.evento,
      }))
    : [],
});

/*
const listarIncidencias = async () => {
  const { data, error } = await incidenciasRepository.findAll();

  if (error) {
    throw error;
  }

  return data.map(mapIncidencia);
};
*/
const listarIncidencias = async (usuario) => {
  // 1. Jalamos la data completa desde el repositorio base
  const { data, error } = await incidenciasRepository.findAll();

  if (error) {
    throw error;
  }

  // 2. Si el usuario es un TÉCNICO, filtramos los datos EN EL BACKEND antes de responder
  if (usuario && usuario.rol === 'tecnico') {
    // Filtramos para que solo pasen las incidencias asignadas a su nombre (ej. "Carlos Tecnico")
    const datosFiltrados = data.filter(inc => inc.tecnico_asignado === usuario.nombre);
    return datosFiltrados.map(mapIncidencia);
  }

  // 3. Si es Jefe (o no viene usuario), se devuelve el listado completo empresarial
  return data.map(mapIncidencia);
};

const obtenerIncidenciaPorId = async (id) => {
  const { data, error } = await incidenciasRepository.findById(id);

  if (error) {
    const notFoundError = new Error('Incidencia no encontrada');
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  if (data.historial) {
    data.historial.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  return mapIncidencia(data);
};

const registrarIncidencia = async (payload, usuario) => {
  const { codigoEquipo, problema, usuarioResponsable, registradoPor } = payload;

  const { data: equipo } = await incidenciasRepository.findEquipoByCodigo(codigoEquipo);

  if (!equipo) {
    const error = new Error(`El equipo ${codigoEquipo} no existe en el inventario real.`);
    error.statusCode = 400;
    throw error;
  }

  const timestamp = Date.now().toString().slice(-4);
  const newId = `INC-${timestamp}`;

  const nuevaIncidencia = {
    id: newId,
    codigo_equipo: codigoEquipo,
    problema,
    usuario_responsable: usuarioResponsable,
    registrado_por: registradoPor,
  };

  const { data, error } = await incidenciasRepository.createIncidencia(nuevaIncidencia);

  if (error) {
    throw error;
  }

  const creador = usuario ? usuario.nombre : registradoPor || 'Sistema';
  await incidenciasRepository.createHistorialEvento({
    incidencia_id: newId,
    evento: `Incidencia registrada por ${creador}`,
  });

  return mapIncidencia(data);
};

const actualizarIncidencia = async (id, payload, usuario) => {
  const { tecnicoId, nuevoEstado, informe, repuesto } = payload;

  const { data: incActual } = await incidenciasRepository.findBaseById(id);

  if (!incActual) {
    const error = new Error('Incidencia no encontrada');
    error.statusCode = 404;
    throw error;
  }

  const usuarioInfo = usuario ? usuario.nombre : 'Sistema';
  const updateFields = {};
  const logs = [];

  if (tecnicoId) {
    const { data: tec } = await tecnicosRepository.findById(tecnicoId);

    if (!tec) {
      const error = new Error('Técnico no encontrado');
      error.statusCode = 404;
      throw error;
    }

    if (tec.tareas_actuales >= tec.capacidad_maxima) {
      const error = new Error('Capacidad máxima alcanzada');
      error.statusCode = 400;
      throw error;
    }

    if (incActual.tecnico_asignado) {
      const { data: pTec } = await tecnicosRepository.findByNombre(incActual.tecnico_asignado);

      if (pTec) {
        await tecnicosRepository.updateTareasActuales(
          pTec.id,
          pTec.tareas_actuales - 1
        );
      }
    }

    updateFields.tecnico_asignado = tec.nombre;
    updateFields.estado = 'Asignada';

    await tecnicosRepository.updateTareasActuales(
      tec.id,
      tec.tareas_actuales + 1
    );

    logs.push({
      incidencia_id: id,
      evento: `Asignada a ${tec.nombre} por ${usuarioInfo}`,
    });
  }

  if (nuevoEstado) {
    updateFields.estado = nuevoEstado;

    logs.push({
      incidencia_id: id,
      evento: `Estado cambiado a ${nuevoEstado} por ${usuarioInfo}`,
    });

    if (
      (nuevoEstado === 'Resuelta' || nuevoEstado === 'Cerrada') &&
      incActual.tecnico_asignado
    ) {
      const { data: tec } = await tecnicosRepository.findByNombre(incActual.tecnico_asignado);

      if (tec) {
        await tecnicosRepository.updateTareasActuales(
          tec.id,
          tec.tareas_actuales - 1
        );
      }
    }
  }

  if (informe) {
    updateFields.informe_tecnico = informe;

    logs.push({
      incidencia_id: id,
      evento: `Informe técnico registrado por ${usuarioInfo}`,
    });
  }

  if (repuesto) {
    updateFields.repuesto_solicitado = repuesto;
    updateFields.estado = 'En espera de repuesto';

    logs.push({
      incidencia_id: id,
      evento: `Repuesto solicitado: ${repuesto} por ${usuarioInfo}`,
    });
  }

  await incidenciasRepository.updateIncidencia(id, updateFields);

  if (logs.length > 0) {
    await incidenciasRepository.createHistorialEventos(logs);
  }

  const { data: final, error } = await incidenciasRepository.findById(id);

  if (error) {
    throw error;
  }

  return mapIncidencia(final);
};

module.exports = {
  listarIncidencias,
  obtenerIncidenciaPorId,
  registrarIncidencia,
  actualizarIncidencia,
};