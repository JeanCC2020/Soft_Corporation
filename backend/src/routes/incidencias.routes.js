/*
const express = require('express');
const incidenciasController = require('../controllers/incidencias.controller');
const { validateRegistrarIncidencia, validateActualizarIncidencia } = require('../middleware/validation.middleware');

const router = express.Router();

router.get('/', incidenciasController.listarIncidencias);
router.post('/', validateRegistrarIncidencia, incidenciasController.registrarIncidencia);
router.get('/:id', incidenciasController.obtenerIncidenciaPorId);
router.patch('/:id', validateActualizarIncidencia, incidenciasController.actualizarIncidencia);


module.exports = router;
*/

// Definimos rutas para gestion de incidencias 
const express = require('express');
const incidenciasController = require('../controllers/incidencias.controller');
const { validateRegistrarIncidencia, validateActualizarIncidencia } = require('../middleware/validation.middleware');

// 1. IMPORTAMOS LOS CANDADOS DE SEGURIDAD (MIDDLEWARES): verificación de token y control de roles
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// 2. MIDDLEWARE PARA ELIMINAR LA CACHÉ DEL NAVEGADOR (Bfcache)
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// 3. INYECTAMOS LOS CANDADOS EN CADA RUTA ANTES DEL CONTROLADOR

// LISTAR: Requiere token válido Y que el rol sea 'jefe'
//router.get('/', verifyToken, requireRole(['jefe']), incidenciasController.listarIncidencias);
router.get('/', verifyToken, requireRole(['jefe', 'tecnico']), incidenciasController.listarIncidencias);

// REGISTRAR: Requiere token válido Y que el rol sea 'jefe' (o 'tecnico' si así lo deciden)
router.post('/', verifyToken, requireRole(['jefe']), validateRegistrarIncidencia, incidenciasController.registrarIncidencia);

// VER DETALLE: Lo puede usar tanto el 'jefe' como los 'tecnico' asignados
router.get('/:id', verifyToken, requireRole(['jefe', 'tecnico']), incidenciasController.obtenerIncidenciaPorId);

// ACTUALIZAR: Lo puede usar tanto el 'jefe' como los 'tecnico' para cambiar el estado
router.patch('/:id', verifyToken, requireRole(['jefe', 'tecnico']), validateActualizarIncidencia, incidenciasController.actualizarIncidencia);

module.exports = router;

