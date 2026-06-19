// frontend/src/pages/__tests__/Login.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import Login from '../Login'; // Ajusta si tu archivo se llama Login.jsx o login.jsx

// Mock de la función navigate para verificar que el formulario redireccione
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CP-IS-01: Login Frontend Form Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test('Debe procesar el login, guardar token en localStorage y redireccionar a /mis-tareas', async () => {
    // 1. Simular la respuesta del Servidor (Backend)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'jwt-generado-de-prueba-carlos',
        user: { nombre: 'Carlos Tecnico', role: 'tecnico' }
      }),
    });

    // 2. Renderizar el componente Login en el navegador virtual de pruebas
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // 3. Pasos del caso de prueba: Digitar entradas usando los placeholders exactos de tu HTML
    const inputEmail = screen.getByPlaceholderText('ejemplo@softcorp.com');
    const inputPass = screen.getByPlaceholderText('••••••••');
    const btnSubmit = screen.getByRole('button', { name: /Iniciar Sesión/i });

    // Simulamos que el usuario escribe sus credenciales válidas
    fireEvent.change(inputEmail, { target: { value: 'carlos@softcorp.com' } });
    fireEvent.change(inputPass, { target: { value: 'carlos123' } });

    // 4. Paso del caso de prueba: Hacer clic en el botón de submit
    fireEvent.click(btnSubmit);

    // 5. Resultados Esperados: Validar poscondición de persistencia y redirección
    await waitFor(() => {
      // Verifica que se haya guardado el token de sesión de forma persistente
      expect(localStorage.getItem('token')).toBe('jwt-generado-de-prueba-carlos');
      
      // Verifica la redirección automática del router hacia la bandeja del técnico
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
  test('CP-IS-03: Debe mostrar mensaje "Credenciales incorrectas" en pantalla si la clave es errónea', async () => {
    // 1. Simular la respuesta de error del Servidor (401 Unauthorized)
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Credenciales incorrectas' }),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // 2. Pasos: Digitar las entradas del Excel
    const inputEmail = screen.getByPlaceholderText('ejemplo@softcorp.com');
    const inputPass = screen.getByPlaceholderText('••••••••');
    const btnSubmit = screen.getByRole('button', { name: /Iniciar Sesión/i });

    fireEvent.change(inputEmail, { target: { value: 'jefe@softcorp.com' } });
    fireEvent.change(inputPass, { target: { value: 'claveFalsa99' } });

    // 3. Paso: Hacer clic en el botón
    fireEvent.click(btnSubmit);

    // 4. Resultados Esperados (Validar que el cartel de error aparezca en la pantalla)
    await waitFor(() => {
      // El backend no debe guardar ningún token en el navegador
      expect(localStorage.getItem('token')).toBeNull();

      // Buscamos el texto exacto de la alerta en el HTML renderizado
      const alertMessage = screen.getByText(/Credenciales incorrectas/i);
      expect(alertMessage).toBeInTheDocument();
    });
  });
});