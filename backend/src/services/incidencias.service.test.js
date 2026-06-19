// Pruebas de unidad para el servicio de incidencias

process.env.SUPABASE_URL = 'https://mock-url.supabase.co';
process.env.SUPABASE_KEY = 'mock-key';

const incidenciasService = require('./incidencias.service');
const incidenciasRepository = require('../repositories/incidencias.repository');
const tecnicosRepository = require('../repositories/tecnicos.repository');

//simulacion de repositorios para evitar llamadas reales a la base de datos durante las pruebas
jest.mock('../repositories/incidencias.repository');
jest.mock('../repositories/tecnicos.repository');

describe('Incidencias Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // simula registro de incidencia con equipo existente y no existente, asignación de técnico con capacidad y sin capacidad, cambio de estado y persistencia de informe técnico
  describe('S037: registrarIncidencia', () => {
    // escenario exitoso: el equipo existe 
    test('Debe registrar una incidencia correctamente si el equipo existe', async () => {
      const payload = {
        codigoEquipo: 'SOP-L01',
        problema: 'Pantalla azul recurrente',
        usuarioResponsable: 'Juan Perez',
        registradoPor: 'jefe@softcorp.com',
      };

      // Mock de verificación de equipo
      // Simula que el equipo existe en el inventario real  
      incidenciasRepository.findEquipoByCodigo.mockResolvedValue({
        data: { codigo: 'SOP-L01', descripcion: 'Laptop de prueba' },
        error: null,
      });

      // Mock de creación de incidencia
      // simula la creación exitosa de una incidencia en la base de datos y devuelve el nuevo registro con un ID generado
      incidenciasRepository.createIncidencia.mockResolvedValue({
        data: {
          id: 'INC-1234',
          codigo_equipo: 'SOP-L01',
          problema: 'Pantalla azul recurrente',
          usuario_responsable: 'Juan Perez',
          registrado_por: 'jefe@softcorp.com',
          estado: 'Pendiente',
        },
        error: null,
      });

      incidenciasRepository.createHistorialEvento.mockResolvedValue({ error: null });

      const result = await incidenciasService.registrarIncidencia(payload);

      expect(incidenciasRepository.findEquipoByCodigo).toHaveBeenCalledWith('SOP-L01');
      expect(incidenciasRepository.createIncidencia).toHaveBeenCalled();
      expect(incidenciasRepository.createHistorialEvento).toHaveBeenCalledWith({
        incidencia_id: expect.any(String),
        evento: 'Incidencia registrada por jefe@softcorp.com',
      });
      expect(result).toHaveProperty('id');
      expect(result.problema).toBe('Pantalla azul recurrente');
      expect(result.estado).toBe('Pendiente');
    });
    
    // escenario de error: el equipo no existe en el inventario
    test('Debe lanzar un error 400 si el equipo no existe en el inventario', async () => {
      const payload = {
        codigoEquipo: 'SOP-INVENTADO',
        problema: 'Error 404',
        usuarioResponsable: 'Juan Perez',
        registradoPor: 'jefe@softcorp.com',
      };

      incidenciasRepository.findEquipoByCodigo.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(incidenciasService.registrarIncidencia(payload)).rejects.toThrow(
        'El equipo SOP-INVENTADO no existe en el inventario real.'
      );
      expect(incidenciasRepository.createIncidencia).not.toHaveBeenCalled();
    });
  });

  // simula asignación de técnico con capacidad y sin capacidad 
  describe('S038: regla de asignación por capacidad', () => {
    test('Debe asignar el técnico y aumentar sus tareas si tiene capacidad disponible', async () => {
      const idIncidencia = 'INC-DEMO';
      const payload = { tecnicoId: 'T-CARLOS' };

      // Incidencia actual pendiente sin técnico asignado
      incidenciasRepository.findBaseById.mockResolvedValue({
        data: { id: idIncidencia, estado: 'Pendiente', tecnico_asignado: null },
        error: null,
      });

      // Técnico con capacidad (tareas actual = 2, max = 5)
      tecnicosRepository.findById.mockResolvedValue({
        data: { id: 'T-CARLOS', nombre: 'Carlos Tecnico', tareas_actuales: 2, capacidad_maxima: 5 },
        error: null,
      });

      tecnicosRepository.updateTareasActuales.mockResolvedValue({ error: null });
      incidenciasRepository.updateIncidencia.mockResolvedValue({ error: null });
      incidenciasRepository.createHistorialEventos.mockResolvedValue({ error: null });

      // Mock para la respuesta final mapeada
      incidenciasRepository.findById.mockResolvedValue({
        data: {
          id: idIncidencia,
          codigo_equipo: 'SOP-L01',
          problema: 'Problema',
          tecnico_asignado: 'Carlos Tecnico',
          estado: 'Asignada',
        },
        error: null,
      });

      const result = await incidenciasService.actualizarIncidencia(idIncidencia, payload);

      expect(tecnicosRepository.findById).toHaveBeenCalledWith('T-CARLOS');
      expect(tecnicosRepository.updateTareasActuales).toHaveBeenCalledWith('T-CARLOS', 3);
      expect(incidenciasRepository.updateIncidencia).toHaveBeenCalledWith(idIncidencia, {
        tecnico_asignado: 'Carlos Tecnico',
        estado: 'Asignada',
      });
      expect(result.tecnicoAsignado).toBe('Carlos Tecnico');
      expect(result.estado).toBe('Asignada');
    });

    test('Debe lanzar error 400 si el técnico ha alcanzado su capacidad máxima', async () => {
      const idIncidencia = 'INC-DEMO';
      const payload = { tecnicoId: 'T-ANA' };

      incidenciasRepository.findBaseById.mockResolvedValue({
        data: { id: idIncidencia, estado: 'Pendiente', tecnico_asignado: null },
        error: null,
      });

      // Técnico Ana con capacidad al límite (tareas actuales = 3, max = 3)
      tecnicosRepository.findById.mockResolvedValue({
        data: { id: 'T-ANA', nombre: 'Ana Especialista', tareas_actuales: 3, capacidad_maxima: 3 },
        error: null,
      });

      await expect(incidenciasService.actualizarIncidencia(idIncidencia, payload)).rejects.toThrow(
        'Capacidad máxima alcanzada'
      );
      expect(tecnicosRepository.updateTareasActuales).not.toHaveBeenCalled();
      expect(incidenciasRepository.updateIncidencia).not.toHaveBeenCalled();
    });
  });

  describe('S039 y S040: cambio de estado y persistencia de informe técnico', () => {
    test('Debe cambiar el estado a un nuevo valor y registrar en el historial', async () => {
      const idIncidencia = 'INC-DEMO';
      const payload = { nuevoEstado: 'En proceso' };

      incidenciasRepository.findBaseById.mockResolvedValue({
        data: { id: idIncidencia, estado: 'Asignada', tecnico_asignado: 'Carlos Tecnico' },
        error: null,
      });

      incidenciasRepository.updateIncidencia.mockResolvedValue({ error: null });
      incidenciasRepository.createHistorialEventos.mockResolvedValue({ error: null });

      incidenciasRepository.findById.mockResolvedValue({
        data: {
          id: idIncidencia,
          codigo_equipo: 'SOP-L01',
          problema: 'Problema',
          tecnico_asignado: 'Carlos Tecnico',
          estado: 'En proceso',
        },
        error: null,
      });

      const result = await incidenciasService.actualizarIncidencia(idIncidencia, payload);

      expect(incidenciasRepository.updateIncidencia).toHaveBeenCalledWith(idIncidencia, {
        estado: 'En proceso',
      });
      expect(incidenciasRepository.createHistorialEventos).toHaveBeenCalledWith([
        { incidencia_id: idIncidencia, evento: 'Estado cambiado a En proceso por Sistema' },
      ]);
      expect(result.estado).toBe('En proceso');
    });

    test('Debe persistir el informe técnico, cambiar el estado a Resuelta y liberar la carga del técnico', async () => {
      const idIncidencia = 'INC-DEMO';
      const payload = { informe: 'Se reemplazó el disco duro dañado.', nuevoEstado: 'Resuelta' };

      incidenciasRepository.findBaseById.mockResolvedValue({
        data: { id: idIncidencia, estado: 'Asignada', tecnico_asignado: 'Carlos Tecnico' },
        error: null,
      });

      // Simular técnico para decrementarle la carga
      tecnicosRepository.findByNombre.mockResolvedValue({
        data: { id: 'T-CARLOS', nombre: 'Carlos Tecnico', tareas_actuales: 2 },
        error: null,
      });

      tecnicosRepository.updateTareasActuales.mockResolvedValue({ error: null });
      incidenciasRepository.updateIncidencia.mockResolvedValue({ error: null });
      incidenciasRepository.createHistorialEventos.mockResolvedValue({ error: null });

      incidenciasRepository.findById.mockResolvedValue({
        data: {
          id: idIncidencia,
          codigo_equipo: 'SOP-L01',
          problema: 'Problema',
          tecnico_asignado: 'Carlos Tecnico',
          estado: 'Resuelta',
          informe_tecnico: 'Se reemplazó el disco duro dañado.',
        },
        error: null,
      });

      const result = await incidenciasService.actualizarIncidencia(idIncidencia, payload);

      expect(incidenciasRepository.updateIncidencia).toHaveBeenCalledWith(idIncidencia, {
        estado: 'Resuelta',
        informe_tecnico: 'Se reemplazó el disco duro dañado.',
      });
      expect(tecnicosRepository.findByNombre).toHaveBeenCalledWith('Carlos Tecnico');
      expect(tecnicosRepository.updateTareasActuales).toHaveBeenCalledWith('T-CARLOS', 1); // tareas_actuales - 1
      expect(result.estado).toBe('Resuelta');
      expect(result.informeTecnico).toBe('Se reemplazó el disco duro dañado.');
    });
  });
});
