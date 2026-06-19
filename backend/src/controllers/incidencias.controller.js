// validacion de acceso a las incidencias segun el rol del usuario

const incidenciasService = require('../services/incidencias.service');

const listarIncidencias = async (req, res, next) => {
  try {
    // Le pasamos el usuario autenticado (req.user) al servicio para que decida qué filtrar
    const fieldUser = req.user; 
    const incidencias = await incidenciasService.listarIncidencias(fieldUser);
    res.json(incidencias);
  } catch (error) {
    next(error);
  }
};

const obtenerIncidenciaPorId = async (req, res, next) => {
  try {
    const incidencia = await incidenciasService.obtenerIncidenciaPorId(req.params.id);
    res.json(incidencia);
  } catch (error) {
    next(error);
  }
};

const registrarIncidencia = async (req, res, next) => {
  try {
    const incidencia = await incidenciasService.registrarIncidencia(req.body, req.user);
    res.status(201).json(incidencia);
  } catch (error) {
    next(error);
  }
};

const actualizarIncidencia = async (req, res, next) => {
  try {
    const { tecnicoId } = req.body;

    // Control de acceso para asignación de técnico (S048 / S042)
    if (tecnicoId && (!req.user || req.user.rol !== 'jefe')) {
      const error = new Error('Acceso denegado: Solo la jefatura de soporte puede asignar técnicos.');
      error.statusCode = 403;
      throw error;
    }

    const incidencia = await incidenciasService.actualizarIncidencia(
      req.params.id,
      req.body,
      req.user
    );

    res.json(incidencia);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarIncidencias,
  obtenerIncidenciaPorId,
  registrarIncidencia,
  actualizarIncidencia,
};