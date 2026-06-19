const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'softcorp-super-secret-key-2026';

// Base de datos de usuarios simulada en memoria
const USERS = [
  { email: 'jefe@softcorp.com', password: 'jefe123', nombre: 'Jefe de Soporte', rol: 'jefe' },
  { email: 'carlos@softcorp.com', password: 'carlos123', nombre: 'Carlos Tecnico', rol: 'tecnico', tecnicoId: 'T-CARLOS' },
  { email: 'ana@softcorp.com', password: 'ana123', nombre: 'Ana Especialista', rol: 'tecnico', tecnicoId: 'T-ANA' },
  { email: 'roberto@softcorp.com', password: 'roberto123', nombre: 'Roberto Redes', rol: 'tecnico', tecnicoId: 'T-ROBERTO' }
];

// Ruta de login para autenticar usuarios y generar JWT
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const user = USERS.find(u => u.email === email.toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Firmar el JWT con los datos relevantes
  const token = jwt.sign(
    { 
      email: user.email, 
      nombre: user.nombre, 
      rol: user.rol, 
      tecnicoId: user.tecnicoId || null 
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Retornar el token y los datos del usuario (sin la contraseña)
  return res.json({
    token,
    user: {
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      tecnicoId: user.tecnicoId || null
    }
  });
});

module.exports = router;
