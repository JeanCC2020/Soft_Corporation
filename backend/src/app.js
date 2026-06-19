const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const incidenciasRoutes = require('./routes/incidencias.routes');
const tecnicosRoutes = require('./routes/tecnicos.routes');
const { verifyToken } = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Rutas protegidas (con autenticación)
app.use('/api/tecnicos', verifyToken, tecnicosRoutes);
app.use('/api/incidencias', verifyToken, incidenciasRoutes);

app.use(errorHandler);

module.exports = app;