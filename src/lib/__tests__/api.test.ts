import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../api';

const mockRpc = vi.fn();

vi.mock('../supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

beforeEach(() => {
  mockRpc.mockReset();
});

describe('login', () => {
  it('envía clave a login_with_key y devuelve sesión', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { token: 'abc', displayName: 'Test', role: 'user', keyId: '1' },
      error: null,
    });

    const result = await api.login('mi-clave');
    expect(mockRpc).toHaveBeenCalledWith('login_with_key', { p_key: 'mi-clave' });
    expect(result.token).toBe('abc');
  });

  it('lanza error si login falla', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Clave inválida o desactivada' },
    });

    await expect(api.login('mala')).rejects.toThrow('Clave inválida o desactivada');
  });
});

describe('me', () => {
  it('pasa el token a get_me', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { displayName: 'Admin', role: 'admin' },
      error: null,
    });

    const result = await api.me('token123');
    expect(mockRpc).toHaveBeenCalledWith('get_me', { p_token: 'token123' });
    expect(result.displayName).toBe('Admin');
  });
});

describe('getTransactions', () => {
  it('retorna lista de transacciones', async () => {
    const txs = [{ id: '1', type: 'egreso', amount: 5000, category: 'comida' }];
    mockRpc.mockResolvedValueOnce({
      data: txs,
      error: null,
    });

    const result = await api.getTransactions('t');
    expect(result).toEqual(txs);
  });
});

describe('adminCreateKey', () => {
  it('retorna clave generada de 8 digitos', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { key: '48291637', id: 'uuid-1' },
      error: null,
    });

    const result = await api.adminCreateKey('tok', 'Juan');
    expect(mockRpc).toHaveBeenCalledWith('admin_create_key', {
      p_token: 'tok',
      p_display_name: 'Juan',
    });
    expect(result.key).toBe('48291637');
  });
});
