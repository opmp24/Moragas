import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminListKeys, adminCreateKey, adminRevokeKey } from '../lib/api';
import type { AccessKey } from '../types';
import { Key, Plus, X, Copy, Check, RefreshCw, UserCheck, UserX } from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await adminListKeys(user.token);
      setKeys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const result = await adminCreateKey(user.token, newName.trim());
      setNewKey(result.key);
      setNewName('');
      await fetchKeys();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!user) return;
    try {
      await adminRevokeKey(user.token, keyId);
      await fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Panel de Administración</h1>

      <div className="card">
        <h2 className="mb-4 text-sm font-medium text-surface-500">Crear nueva clave</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input flex-1"
            placeholder="Nombre del usuario"
            disabled={creating}
          />
          <button type="submit" disabled={creating || !newName.trim()} className="btn-primary">
            {creating ? 'Creando...' : <><Plus size={16} /> Crear</>}
          </button>
        </form>
        {newKey && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary-50 p-4 dark:bg-primary-950">
            <Key size={18} className="shrink-0 text-primary-600" />
            <div className="flex-1">
              <p className="text-xs text-primary-600 dark:text-primary-400">Clave generada — cópiala y envíala al usuario</p>
              <p className="font-mono text-sm font-medium text-primary-800 dark:text-primary-200">{newKey}</p>
            </div>
            <button onClick={() => copyKey(newKey)} className="btn-ghost p-2" title="Copiar">
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
            <button onClick={() => setNewKey(null)} className="btn-ghost p-2" title="Cerrar">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-surface-500">Usuarios y claves</h2>
          <button onClick={fetchKeys} className="btn-ghost p-2" title="Actualizar">
            <RefreshCw size={16} />
          </button>
        </div>
        {keys.length === 0 ? (
          <p className="py-4 text-center text-sm text-surface-400">No hay usuarios registrados</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                    k.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                      : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                  }`}>
                    {k.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{k.display_name}</p>
                    <p className="text-xs text-surface-400">
                      {k.role === 'admin' ? 'Admin' : 'Usuario'} · {k.is_active ? 'Activo' : 'Inactivo'} · Creado {new Date(k.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {k.is_active ? (
                    <button
                      onClick={() => handleRevoke(k.id)}
                      className="btn-ghost p-2 text-red-500 hover:text-red-700"
                      title="Revocar acceso"
                    >
                      <UserX size={16} />
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-surface-400">
                      <UserCheck size={14} /> Revocado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
