import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../api';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('login', () => {
  it('envía POST a /login con la clave', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'abc', displayName: 'Test', role: 'user', keyId: '1' }),
    });

    const result = await api.login('mi-clave');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://moragas.netlify.app/.netlify/functions/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ key: 'mi-clave' }),
      }),
    );
    expect(result.token).toBe('abc');
  });

  it('lanza error si la respuesta no es ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Clave inválida' }),
    });

    await expect(api.login('mala')).rejects.toThrow('Clave inválida');
  });
});

describe('me', () => {
  it('pasa el token como query param', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ displayName: 'Admin', role: 'admin' }),
    });

    await api.me('token123');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://moragas.netlify.app/.netlify/functions/me?token=token123',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('getTransactions', () => {
  it('retorna lista de transacciones', async () => {
    const txs = [{ id: '1', type: 'egreso', amount: 5000, category: 'comida' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: txs }),
    });

    const result = await api.getTransactions('t');
    expect(result).toEqual(txs);
  });
});
