import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../Login';

const mockLogin = vi.fn();
vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ user: null, loading: false, login: mockLogin, logout: vi.fn() }),
  };
});

function renderLogin() {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>,
  );
}

describe('Login page', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it('renderiza el formulario de login', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Ingresa tu clave')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('muestra el nombre Moragas', () => {
    renderLogin();
    expect(screen.getAllByText(/Moragas/).length).toBeGreaterThan(0);
  });

  it('deshabilita el botón si no hay clave', () => {
    renderLogin();
    const btn = screen.getByRole('button', { name: /ingresar/i });
    expect(btn).toBeDisabled();
  });

  it('llama a login con la clave al enviar el formulario', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    const input = screen.getByPlaceholderText('Ingresa tu clave');
    const btn = screen.getByRole('button', { name: /ingresar/i });

    await userEvent.type(input, 'mi-clave');
    expect(btn).not.toBeDisabled();

    await userEvent.click(btn);
    expect(mockLogin).toHaveBeenCalledWith('mi-clave');
  });

  it('muestra error si login falla', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Clave inválida'));
    renderLogin();

    const input = screen.getByPlaceholderText('Ingresa tu clave');
    const btn = screen.getByRole('button', { name: /ingresar/i });

    await userEvent.type(input, 'mala');
    await userEvent.click(btn);

    expect(await screen.findByText('Clave inválida')).toBeInTheDocument();
  });
});
