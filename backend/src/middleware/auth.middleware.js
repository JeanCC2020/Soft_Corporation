const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'softcorp-super-secret-key-2026';

// Middleware para verificar el token JWT en las rutas protegidas
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Acceso denegado: Formato de token inválido (debe ser Bearer <token>)' });
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adjuntar payload al request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para verificar el rol del usuario autenticado
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: No tienes los permisos requeridos' });
    }

    next();
  };
};

// Exportamos ambos middlewares para usarlos en las rutas protegidas
module.exports = {
  verifyToken,
  requireRole
};
