import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RegistrarIncidencia from './pages/RegistrarIncidencia';
import BandejaIncidencias from './pages/BandejaIncidencias';
import DetalleIncidencia from './pages/DetalleIncidencia';
import MisTareas from './pages/MisTareas';
import Login from './pages/Login';
import Dashboard from './components/Dashboard';

// Componente para proteger las rutas operativas
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('currentUser');

  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userJson);
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to={user.rol === 'jefe' ? '/bandeja' : '/mis-tareas'} replace />;
  }

  return children;
};

function App() {
  // Evaluamos el estado real de autenticación de forma dinámica
  const token = localStorage.getItem('token');

  return (
    <Router>
      <div className="app-container">
        {/* El Navbar ahora es inteligente, se adapta internamente si hay token o no */}
        <Navbar />
        
        <main className="main-content">
          <Routes>
            {/* 1. HOME INTELIGENTE: Accesible para todos, pero adaptativo */}
            <Route path="/" element={<Home />} />

            {/* 2. RUTA DE AUTENTICACIÓN */}
            <Route 
              path="/login" 
              element={token ? <Navigate to="/" replace /> : <Login />} 
            />

            {/* 3. RUTAS OPERATIVAS TOTALMENTE PROTEGIDAS */}
            <Route 
              path="/nueva-incidencia" 
              element={
                <ProtectedRoute allowedRoles={['jefe', 'tecnico']}>
                  <RegistrarIncidencia />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bandeja" 
              element={
                <ProtectedRoute allowedRoles={['jefe']}>
                  <BandejaIncidencias />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/incidencia/:id" 
              element={
                <ProtectedRoute allowedRoles={['jefe', 'tecnico']}>
                  <DetalleIncidencia />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mis-tareas" 
              element={
                <ProtectedRoute allowedRoles={['tecnico']}>
                  <MisTareas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" element={<Dashboard />} 
            />

            {/* Redirección limpia por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;