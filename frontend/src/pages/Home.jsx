import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, PenTool, ArrowRight } from 'lucide-react';

const Home = () => {
  // Evaluamos de forma segura si el usuario está autenticado en local
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section" style={{ 
        position: 'relative',
        margin: '2rem 0 4rem', 
        borderRadius: 'var(--radius-lg)', 
        overflow: 'hidden',
        backgroundImage: "url('/hero_bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: 'var(--shadow-glass)'
      }}>
        {/* Overlay gradient text readability */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(90deg, rgba(248, 250, 252, 0.95) 0%, rgba(248, 250, 252, 0.75) 50%, rgba(248, 250, 252, 0.4) 100%)',
          zIndex: 1
        }}></div>

        <div style={{ 
          position: 'relative', 
          zIndex: 2, 
          padding: '5rem 3rem', 
          maxWidth: '700px',
          textAlign: 'left'
        }}>
          <h1 className="heading-xl">
            Soporte <span className="text-gradient">Eficiente</span> <br />
            para tus Equipos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Sistema de gestión de incidencias técnicas de Soft Corporation. Registra reportes, recibe asistencia rápida y mantén tu entorno de trabajo seguro.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {token ? (
              <>
                {/* 1. FLUJO OPERATIVO: El usuario está logueado y ve sus herramientas según su rol */}
                <Link to="/nueva-incidencia" className="btn btn-primary">
                  Registrar Incidencia <ArrowRight size={18} />
                </Link>
                
                {currentUser.rol === 'jefe' && (
                  <Link to="/bandeja" className="btn btn-secondary">
                    Bandeja Jefatura de Soporte
                  </Link>
                )}
                
                {currentUser.rol === 'tecnico' && (
                  <Link to="/mis-tareas" className="btn btn-secondary">
                    Ver Mis Tareas Asignadas
                  </Link>
                )}
              </>
            ) : (
              <>
                {/* 2. FLUJO PÚBLICO: No hay sesión activa. Se invita a ingresar */}
                <Link to="/login" className="btn btn-primary">
                  Ingresar al Portal Técnico <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Reportar Problema Como Invitado
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 className="heading-lg" style={{ textAlign: 'center' }}>Beneficios del Servicio</h2>
        <div className="grid grid-cols-3">
          <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ padding: '1rem', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
              <Clock size={32} />
            </div>
            <h3 className="heading-md">Atención Rápida</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Asignación inmediata de técnicos para dar solución a tus problemas de hardware y software.</p>
          </div>
          <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ padding: '1rem', background: 'rgba(13, 148, 136, 0.1)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
              <PenTool size={32} />
            </div>
            <h3 className="heading-md">Reparación Local</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Nuestros técnicos se acercan a tu área o gestionan repuestos críticos velozmente.</p>
          </div>
          <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ padding: '1rem', background: 'rgba(15, 118, 110, 0.1)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
              <ShieldCheck size={32} />
            </div>
            <h3 className="heading-md">Equipos Confiables</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Mantenemos el historial de equipos para asegurar tu operatividad sin interrupciones.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap', overflow: 'hidden' }}>
        <div style={{ flex: '1 1 400px', padding: '3rem' }}>
          <h2 className="heading-lg">Comunícate <br/>Directamente</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            ¿Problemas urgentes que no pueden esperar a ser atendidos por la plataforma? Contáctate con nuestra central de soporte al <strong style={{ color: 'var(--text-primary)' }}>Anexo 5420</strong> o envía un correo a <strong style={{ color: 'var(--text-primary)' }}>soporte@softcorp.com</strong>.
          </p>
          <Link to={token ? "/nueva-incidencia" : "/login"} className="btn btn-secondary">
             Abrir Ticket
          </Link>
        </div>
        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
           <img src="/contact_icon.png" alt="Contact Support" style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', filter: 'drop-shadow(0 10px 25px rgba(13, 148, 136, 0.15))' }} />
        </div>
      </section>
    </div>
  );
};

export default Home;