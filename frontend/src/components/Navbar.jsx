import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MonitorPlay, ClipboardList, PlusCircle, UserCheck, LogOut, LogIn } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userJson = localStorage.getItem('currentUser');
  const currentUser = userJson ? JSON.parse(userJson) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/login');
    window.location.reload();
  };

  // Filtrar opciones por rol únicamente si el usuario existe (S042)
  const navItems = currentUser 
    ? [
        { name: 'Inicio', path: '/', icon: <MonitorPlay size={18} />, roles: ['jefe', 'tecnico'] },
        { name: 'Nueva Incidencia', path: '/nueva-incidencia', icon: <PlusCircle size={18} />, roles: ['jefe', 'tecnico'] },
        { name: 'Bandeja', path: '/bandeja', icon: <ClipboardList size={18} />, roles: ['jefe'] },
        { name: 'Mis Tareas', path: '/mis-tareas', icon: <UserCheck size={18} />, roles: ['tecnico'] },
      ].filter(item => item.roles.includes(currentUser.rol))
    : []; // Si no hay usuario, la lista de links de navegación queda vacía

  return (
    <nav className="navbar">
      {/* El logo corporativo siempre se visualiza (Público y Privado) */}
      <Link to="/" className="navbar-brand">
        <img src="/logo_full.svg" alt="SoftCorporation Logo" style={{ height: '34px', width: 'auto' }} />
      </Link>
      
      <div className="nav-links">
        {/* Renderizado dinámico de links operativos si el usuario está logueado */}
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
        
        {currentUser ? (
          /* 1. SECCIÓN PRIVADA: Datos del usuario activo y botón de salida */
          <div style={{ marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              👤 <strong>{currentUser.nombre}</strong> ({currentUser.rol === 'jefe' ? 'Jefe' : 'Técnico'})
            </span>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', height: 'auto' }}
              onClick={handleLogout}
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        ) : (
          /* 2. SECCIÓN PÚBLICA: Botón elegante de Login para visitantes */
          <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
            <Link 
              to="/login" 
              className="btn btn-primary" 
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', height: 'auto' }}
            >
              <LogIn size={15} /> Iniciar Sesión
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;