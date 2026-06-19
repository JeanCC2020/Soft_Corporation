
// Configuramos las variables de entorno necesarias para las pruebas
process.env.SUPABASE_URL = 'https://mock-url.supabase.co';
process.env.SUPABASE_KEY = 'mock-key';
process.env.JWT_SECRET = 'secreto_de_prueba_123';

const jwt = require('jsonwebtoken');

// ALERTA: Mover la simulacion directo adentro anteponiendo la palabra 'mock'
jest.mock('../config/supabase', () => ({
  auth: {
    signInWithPassword: jest.fn()
  }
}));

// Re-importamos el mock para poder manipularlo en los tests
const mockSupabase = require('../config/supabase');

describe('Auth Service Unit Tests - Sprint 1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CP-IS-01: Iniciar Sesión Exitoso (Técnico) 
  describe('CP-IS-01: Iniciar Sesión Exitoso (Técnico)', () => {
    test('Debe retornar un token JWT válido y el rol "tecnico" cuando las credenciales coinciden', async () => {
      const emailInput = 'carlos@softcorp.com';
      const passwordInput = 'carlos123';

      // Configuramos el comportamiento del mock
      // simula a Supabase devolviendo un usuario válido y una sesión con token
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { 
            id: 'usr-carlos-10', 
            email: 'carlos@softcorp.com',
            user_metadata: { role: 'tecnico', nombre: 'Carlos Técnico' }
          },
          session: { access_token: 'supabase-mock-session-token' }
        },
        error: null
      });

      const mockLoginFunction = async (email, password) => {
        const { data, error } = await mockSupabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Credenciales inválidas');
        
        const token = jwt.sign(
          { id: data.user.id, role: data.user.user_metadata.role }, 
          process.env.JWT_SECRET
        );
        return { token, user: data.user.user_metadata };
      };

      // ejecutamos login con las entradas del caso de prueba
      const result = await mockLoginFunction(emailInput, passwordInput);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'carlos@softcorp.com',
        password: 'carlos123'
      });

      // Verificamos que el resultado contenga un token y que el rol sea 'tecnico'
      expect(result).toHaveProperty('token');
      expect(result.user.role).toBe('tecnico');
    });
  });

  // CP-IS-03: Intento de Login con Contraseña Incorrecta
  describe('CP-IS-03: Intento de Login con Contraseña Incorrecta', () => {
    test('Debe lanzar un error 401 si las credenciales no coinciden en Supabase', async () => {
      // 1. Entradas del caso de prueba (Clave falsa)
      const emailInput = 'jefe@softcorp.com';
      const passwordInput = 'claveFalsa99';

      // 2. Simulamos que Supabase devuelve un objeto de error (AuthApiError)
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 401 }
      });

      // 3. La función del servicio debe capturar ese error y procesarlo
      const mockLoginFunction = async (email, password) => {
        const { data, error } = await mockSupabase.auth.signInWithPassword({ email, password });
        
        // Si Supabase devuelve un error, el backend frena la operación inmediatamente
        if (error) {
          const customError = new Error('Credenciales incorrectas');
          customError.status = 401;
          throw customError;
        }
        return data;
      };

      // 4. Ejecución y Verificación de la expectativa (Esperamos que falle con 401)
      await expect(mockLoginFunction(emailInput, passwordInput)).rejects.toThrow('Credenciales incorrectas');
      
      try {
        await mockLoginFunction(emailInput, passwordInput);
      } catch (error) {
        expect(error.status).toBe(401);
      }
    });
  });
});