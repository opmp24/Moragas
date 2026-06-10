import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, Key, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(key.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clave inválida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-surface-100 p-4 dark:from-surface-950 dark:to-surface-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg">
            <Wallet className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Moragas</h1>
          <p className="mt-1 text-sm text-surface-500">Ingresa tu clave de acceso</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="key" className="label mb-1.5">Clave de acceso</label>
            <div className="relative">
              <Key className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={16} />
              <input
                id="key"
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="input pl-10 pr-10"
                placeholder="Ingresa tu clave"
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}
          <button type="submit" disabled={loading || !key.trim()} className="btn-primary w-full">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
