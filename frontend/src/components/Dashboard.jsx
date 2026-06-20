//
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { api } from '../lib/api';

const Dashboard = () => {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/incidencias')
      .then(data => {
        console.log('📦 Incidencias recibidas:', data);
        setIncidencias(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando métricas:", err);
        setLoading(false);
      });
  }, []);

  // ============================================================
  // 1_PROCESAMIENTO DE DATOS 
  // ============================================================
  const estadosValidos = incidencias.map(i => {
    // Detectamos dinamicamente si el backend manda el ID, el nombre o un objeto
    let nombreTecnico = 'Sin Asignar';
    if (i.tecnicoAsignado) nombreTecnico = i.tecnicoAsignado;
    else if (i.tecnicoNombre) nombreTecnico = i.tecnicoNombre;
    else if (i.tecnicoId) nombreTecnico = i.tecnicoId; 

    // Mapeo estetico por si vienen los codigos crudos de la base de datos
    if (nombreTecnico === 'T-CARLOS') nombreTecnico = 'Carlos Técnico';
    if (nombreTecnico === 'T-ANA') nombreTecnico = 'Ana Especialista';
    if (nombreTecnico === 'T-ROBERTO') nombreTecnico = 'Roberto Redes';

    return {
      ...i,
      estadoLimpio: i.estado ? i.estado.trim().toLowerCase() : 'sin estado',
      tecnicoNombre: nombreTecnico
    };
  });

  const pendientes = estadosValidos.filter(i => i.estadoLimpio === 'pendiente').length;
  const asignadas = estadosValidos.filter(i => i.estadoLimpio === 'asignada').length;
  const enEspera = estadosValidos.filter(i => 
    i.estadoLimpio.includes('espera') || i.estadoLimpio.includes('repuesto')
  ).length;
  const resueltas = estadosValidos.filter(i => 
    i.estadoLimpio === 'resuelta' || i.estadoLimpio === 'resuelto'
  ).length;
  const totalIncidencias = estadosValidos.length;

  // ============================================================
  // 2_CONTEO POR EQUIPO
  // ============================================================
  const mapeoEquipos = {};
  incidencias.forEach(i => {
    const equipo = i.codigoEquipo || 'No Especificado';
    mapeoEquipos[equipo] = (mapeoEquipos[equipo] || 0) + 1;
  });
  const equiposCategorias = Object.keys(mapeoEquipos);
  const equiposData = Object.values(mapeoEquipos);

  // ============================================================
  // 3_PRODUCTIVIDAD POR TECNICO (Conteo de incidencias asignadas)
  // ============================================================
  const tecnicosNombres = [];
  const tecnicosValores = [];

  estadosValidos.forEach(i => {
    const nombre = i.tecnicoNombre; // Usamos la variable ya normalizada arriba
    const index = tecnicosNombres.indexOf(nombre);
    if (index === -1) {
      tecnicosNombres.push(nombre);
      tecnicosValores.push(1);
    } else {
      tecnicosValores[index] += 1;
    }
  });

  // Algoritmo de ordenamiento Burbuja (Mayor a Menor productividad)
  for (let i = 0; i < tecnicosValores.length; i++) {
    for (let j = i + 1; j < tecnicosValores.length; j++) {
      if (tecnicosValores[i] < tecnicosValores[j]) {
        const tempVal = tecnicosValores[i];
        tecnicosValores[i] = tecnicosValores[j];
        tecnicosValores[j] = tempVal;
        
        const tempNom = tecnicosNombres[i];
        tecnicosNombres[i] = tecnicosNombres[j];
        tecnicosNombres[j] = tempNom;
      }
    }
  }

  // ============================================================
  // 4_CONFIGURACIONES DE GRAFICOS
  // ============================================================
  const coloresCorporativos = ['#EAB308', '#3B82F6', '#F97316', '#10B981'];

  const donutOptions = {
    chart: { type: 'donut', background: 'transparent' },
    labels: ['Pendientes', 'Asignadas', 'En Espera', 'Resueltas'],
    colors: coloresCorporativos,
    theme: { mode: 'light' },
    legend: { position: 'bottom', labels: { colors: '#64748b' } },
    dataLabels: { enabled: true, style: { colors: ['#fff'] } }
  };

  const barEquiposOptions = {
    chart: { type: 'bar', background: 'transparent' },
    xaxis: { 
      categories: equiposCategorias.length > 0 ? equiposCategorias : ['Sin Datos'],
      labels: { style: { colors: '#64748b' } }
    },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    colors: ['#3B82F6'],
    theme: { mode: 'light' },
    plotOptions: { bar: { borderRadius: 4, horizontal: false } }
  };

  const barTecnicosOptions = {
    chart: { 
      type: 'bar', 
      background: 'transparent',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
        barHeight: '55%'
      }
    },
    xaxis: {
      labels: { style: { colors: '#64748b' } },
      tickAmount: 4 
    },
    yaxis: {
      labels: {
        style: { colors: '#0f172a', fontSize: '13px', fontWeight: 500 },
        show: true
      }
    },
    colors: ['#10B981'], 
    dataLabels: {
      enabled: true,
      style: { colors: ['#fff'], fontSize: '11px' },
      formatter: function (val) {
        return val + ' tickets';
      }
    },
    grid: { show: true, strokeDashArray: 4 }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        Cargando métricas del dashboard corporativo...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', color: '#1e293b' }}>
      
      {/* Encabezado Gerencial */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem' }}>Dashboard de Control Operativo</h2>
        <span style={{ color: '#64748b' }}>Métricas en tiempo real basadas en la bandeja de incidencias</span>
      </div>

      {/* Bloque de KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        {[
          { label: 'TOTAL TICKETS', value: totalIncidencias, color: '#0f172a' },
          { label: 'PENDIENTES', value: pendientes, color: '#EAB308' },
          { label: 'ASIGNADAS', value: asignadas, color: '#3B82F6' },
          { label: 'EN ESPERA', value: enEspera, color: '#F97316' },
          { label: 'RESUELTAS', value: resueltas, color: '#10B981' }
        ].map((kpi, index) => (
          <div key={index} style={{ 
            padding: '1.2rem', 
            textAlign: 'center', 
            backgroundColor: '#fff',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            borderTop: `4px solid ${kpi.color}`
          }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: kpi.color, marginTop: '0.2rem' }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Grid de Visualizaciones */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', 
        gap: '1.5rem' 
      }}>
        
        {/* Dona - Estados */}
        <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>Distribución por Estado</h3>
          {totalIncidencias > 0 ? (
            <Chart options={donutOptions} series={[pendientes, asignadas, enEspera, resueltas]} type="donut" width="100%" height={300} />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Sin datos para mostrar</div>
          )}
        </div>

        {/* Barras - Equipos */}
        <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>Fallas por Equipo</h3>
          <Chart options={barEquiposOptions} series={[{ name: 'Incidencias', data: equiposData }]} type="bar" width="100%" height={300} />
        </div>

        {/* Barras Horizontales - Productividad de Tecnicos */}
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#fff', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          gridColumn: '1 / -1'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem', color: '#0f172a' }}>Productividad por Técnico</h3>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>
            Distribución y carga de incidencias asignadas en el cuadro de tareas
          </span>
          {tecnicosNombres.length > 0 ? (
            <Chart 
              key={tecnicosNombres.join(',')}
              options={barTecnicosOptions} 
              series={[{
                name: 'Tickets',
                data: tecnicosNombres.map((nombre, index) => ({
                  x: nombre,
                  y: tecnicosValores[index]
                }))
              }]} 
              type="bar" 
              width="100%" 
              height={Math.max(220, tecnicosNombres.length * 50)} 
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              No hay técnicos con incidencias asignadas en el sistema.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;