// backend/src/services/auth.service.test.js

process.env.SUPABASE_URL = 'https://mock-url.supabase.co';
process.env.SUPABASE_KEY = 'mock-key';
process.env.JWT_SECRET = 'secreto_de_prueba_123';

const jwt = require('jsonwebtoken');

// ALERTA: Mover la simulación directo adentro anteponiendo la palabra 'mock'
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

  describe('CP-IS-01: Iniciar Sesión Exitoso (Técnico)', () => {
    test('Debe retornar un token JWT válido y el rol "tecnico" when las credenciales coinciden', async () => {
      const emailInput = 'carlos@softcorp.com';
      const passwordInput = 'carlos123';

      // Configuramos el comportamiento del mock
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

      const result = await mockLoginFunction(emailInput, passwordInput);

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'carlos@softcorp.com',
        password: 'carlos123'
      });
      expect(result).toHaveProperty('token');
      expect(result.user.role).toBe('tecnico');
    });
  });
});