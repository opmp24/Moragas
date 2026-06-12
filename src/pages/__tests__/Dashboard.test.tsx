import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Dashboard from '../Dashboard';

const mockLogin = vi.fn();
vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { keyId: '1', displayName: 'Admin', role: 'admin', token: 'test-token' },
      loading: false,
      login: mockLogin,
      logout: vi.fn(),
    }),
  };
});

vi.mock('../../lib/api', () => {
  const tx = [
    { id: '1', type: 'egreso' as const, amount: 5000, category: 'comida', description: 'Almuerzo', user_name: 'Juan', raw_message: '', telegram_message_id: 0, created_at: '2026-06-10T12:00:00Z' },
    { id: '2', type: 'egreso' as const, amount: 3000, category: 'transporte', description: 'Uber', user_name: 'María', raw_message: '', telegram_message_id: 0, created_at: '2026-06-09T12:00:00Z' },
    { id: '3', type: 'ingreso' as const, amount: 50000, category: 'sueldo', description: 'Sueldo junio', user_name: 'Juan', raw_message: '', telegram_message_id: 0, created_at: '2026-06-01T12:00:00Z' },
    { id: '4', type: 'ingreso' as const, amount: 20000, category: 'freelance', description: 'Proyecto web', user_name: null, raw_message: '', telegram_message_id: 0, created_at: '2026-05-15T12:00:00Z' },
  ];
  return {
    getTransactions: vi.fn().mockResolvedValue(tx),
    getMonthlySummary: vi.fn().mockResolvedValue([
      { month: '2026-05', ingresos: 20000, egresos: 0 },
      { month: '2026-06', ingresos: 50000, egresos: 8000 },
    ]),
    getCategorySummary: vi.fn().mockResolvedValue([
      { category: 'comida', total: 5000, count: 1 },
      { category: 'transporte', total: 3000, count: 1 },
    ]),
    getCategories: vi.fn().mockResolvedValue([
      { id: 'c1', name: 'comida', type: 'egreso', color: '#ef4444', icon: 'coffee', created_at: '' },
      { id: 'c2', name: 'transporte', type: 'egreso', color: '#f59e0b', icon: 'car', created_at: '' },
      { id: 'c3', name: 'sueldo', type: 'ingreso', color: '#10b981', icon: 'briefcase', created_at: '' },
      { id: 'c4', name: 'freelance', type: 'ingreso', color: '#3b82f6', icon: 'laptop', created_at: '' },
    ]),
  };
});

async function renderDashboard() {
  const result = render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>,
  );
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument());
  return result;
}

function getTableRowCount() {
  return screen.getAllByRole('row').length;
}

describe('Dashboard layout', () => {
  it('renderiza las tarjetas de resumen', async () => {
    await renderDashboard();
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Gastos')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('renderiza los tabs Gasto e Ingreso', async () => {
    await renderDashboard();
    expect(screen.getByRole('button', { name: 'Gasto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingreso' })).toBeInTheDocument();
  });

  it('renderiza el historial', async () => {
    await renderDashboard();
    expect(screen.getByText('Historial')).toBeInTheDocument();
  });
});

describe('Dashboard tabs', () => {
  it('muestra graficos de gasto por defecto', async () => {
    await renderDashboard();
    expect(screen.getByText('Gastos por Mes')).toBeInTheDocument();
    expect(screen.getByText('Gastos por Categoría')).toBeInTheDocument();
    expect(screen.getByText('Gastos por Categoría (Total)')).toBeInTheDocument();
    expect(screen.getByText('Gastos por Usuario por Mes')).toBeInTheDocument();
  });

  it('cambia a pestaña ingreso y muestra sus graficos', async () => {
    await renderDashboard();
    await userEvent.click(screen.getByRole('button', { name: 'Ingreso' }));
    expect(screen.getByText('Ingresos por Mes')).toBeInTheDocument();
    expect(screen.getByText('Ingresos por Usuario (Total)')).toBeInTheDocument();
    expect(screen.getByText('Ingresos por Usuario por Mes')).toBeInTheDocument();
    expect(screen.queryByText('Gastos por Mes')).not.toBeInTheDocument();
  });
});

describe('Dashboard historial filters', () => {
  it('filtra por categoria', async () => {
    await renderDashboard();
    expect(getTableRowCount()).toBe(5);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'comida' } });
    await waitFor(() => expect(getTableRowCount()).toBe(2));
  });

  it('filtra por usuario', async () => {
    await renderDashboard();
    expect(getTableRowCount()).toBe(5);
    const input = screen.getByPlaceholderText('Filtrar usuario…');
    await userEvent.type(input, 'María');
    await waitFor(() => expect(getTableRowCount()).toBe(2));
  });

  it('filtra por rango de fechas', async () => {
    const { container } = await renderDashboard();
    expect(getTableRowCount()).toBe(5);

    const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-01' } });
    await waitFor(() => expect(getTableRowCount()).toBe(4));
  });
});

describe('Dashboard historial sort', () => {
  it('ordena al hacer click en header', async () => {
    await renderDashboard();
    await userEvent.click(screen.getByText('Monto'));
    expect(getTableRowCount()).toBe(5);
  });
});
