import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppConfigContext';
import { adminListKeys, adminCreateKey, adminRevokeKey, adminResetKey, adminUpdateAppConfig, adminCreateTransaction, getCategories, adminCreateCategory, adminDeleteCategory, adminUpdateCategory } from '../lib/api';
import type { AccessKey, Category } from '../types';
import { getIcon, AVAILABLE_ICONS } from '../lib/categoryIcons';
import { Key, Plus, X, Copy, Check, RefreshCw, UserCheck, UserX, DollarSign, Trash2, AlertCircle, Pencil, Palette } from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();

  // Keys state
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [plainKeys, setPlainKeys] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('moragas-plain-keys') || '{}'); } catch { return {}; }
  });
  const [resettingKey, setResettingKey] = useState<string | null>(null);

  // Branding state
  const { config: appConfig, updateConfig } = useAppConfig();
  const [brandName, setBrandName] = useState('');
  const [brandColor, setBrandColor] = useState('');
  const [brandIcon, setBrandIcon] = useState('wallet');
  const [brandIconOpen, setBrandIconOpen] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandMsg, setBrandMsg] = useState<string | null>(null);
  const brandPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (appConfig) {
      setBrandName(appConfig.app_name);
      setBrandColor(appConfig.primary_color);
      setBrandIcon(appConfig.app_icon);
    }
  }, [appConfig]);

  useEffect(() => {
    if (!brandIconOpen) return;
    const handler = (e: MouseEvent) => {
      if (brandPickerRef.current && !brandPickerRef.current.contains(e.target as Node)) setBrandIconOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [brandIconOpen]);

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !brandName.trim()) return;
    setBrandSaving(true);
    setBrandMsg(null);
    try {
      await updateConfig(user.token, { app_name: brandName.trim(), primary_color: brandColor, app_icon: brandIcon });
      setBrandMsg('Guardado');
      setTimeout(() => setBrandMsg(null), 2000);
    } catch (err) {
      setBrandMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setBrandSaving(false);
    }
  };

  // Transaction state
  const [txType, setTxType] = useState<'ingreso' | 'egreso'>('egreso');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txUserName, setTxUserName] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'ingreso' | 'egreso'>('egreso');
  const [catColor, setCatColor] = useState('#6b7280');
  const [catIcon, setCatIcon] = useState('circle');
  const [catCreating, setCatCreating] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catIconOpen, setCatIconOpen] = useState(false);
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catDeleteId, setCatDeleteId] = useState<string | null>(null);
  const [catDeleting, setCatDeleting] = useState(false);
  const [catDeleteError, setCatDeleteError] = useState<string | null>(null);
  const catPickerRef = useRef<HTMLDivElement>(null);

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

  const fetchCategories = async () => {
    if (!user) return;
    setCatLoading(true);
    try {
      const data = await getCategories(user.token);
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('moragas-plain-keys', JSON.stringify(plainKeys));
  }, [plainKeys]);

  useEffect(() => {
    fetchKeys();
    fetchCategories();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const result = await adminCreateKey(user.token, newName.trim());
      setNewKey(result.key);
      setPlainKeys(prev => ({ ...prev, [result.id]: result.key }));
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

  const handleResetKey = async (keyId: string) => {
    if (!user) return;
    setResettingKey(keyId);
    try {
      const result = await adminResetKey(user.token, keyId);
      setPlainKeys(prev => ({ ...prev, [result.id]: result.key }));
      await fetchKeys();
    } catch (err) {
      console.error(err);
    } finally {
      setResettingKey(null);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) { setTxError('Monto inválido'); return; }
    if (!txCategory) { setTxError('Selecciona una categoría'); return; }
    setTxSubmitting(true);
    setTxError(null);
    setTxSuccess(null);
    try {
      const cat = categories.find(c => c.id === txCategory);
      await adminCreateTransaction(user.token, {
        type: txType,
        amount,
        category: cat?.name || txCategory,
        description: txDescription.trim() || undefined,
        user_name: txUserName.trim() || undefined,
        date: txDate || undefined,
      });
      setTxSuccess(`Transacción creada: $${amount.toLocaleString('es-CL')} · ${txType} · ${cat?.name || txCategory}`);
      setTxAmount('');
      setTxCategory('');
      setTxDescription('');
      setTxUserName('');
      setTxDate(new Date().toISOString().slice(0, 10));
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Error al crear transacción');
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setCatEditId(cat.id);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatColor(cat.color);
    setCatIcon(cat.icon);
    setCatError(null);
    setCatDeleteError(null);
  };

  const cancelEditCategory = () => {
    setCatEditId(null);
    setCatName('');
    setCatColor('#6b7280');
    setCatIcon('circle');
    setCatType('egreso');
    setCatError(null);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !catName.trim()) return;
    setCatCreating(true);
    setCatError(null);
    try {
      if (catEditId) {
        await adminUpdateCategory(user.token, catEditId, {
          name: catName.trim(),
          type: catType,
          color: catColor,
          icon: catIcon,
        });
        setCatEditId(null);
      } else {
        await adminCreateCategory(user.token, {
          name: catName.trim(),
          type: catType,
          color: catColor,
          icon: catIcon,
        });
      }
      setCatName('');
      setCatColor('#6b7280');
      setCatIcon('circle');
      setCatType('egreso');
      await fetchCategories();
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Error al guardar categoría');
    } finally {
      setCatCreating(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!user || !catDeleteId) return;
    setCatDeleting(true);
    setCatDeleteError(null);
    try {
      await adminDeleteCategory(user.token, catDeleteId);
      setCatDeleteId(null);
      await fetchCategories();
    } catch (err) {
      setCatDeleteError(err instanceof Error ? err.message : 'Error al eliminar categoría');
    } finally {
      setCatDeleting(false);
    }
  };

  const confirmDeleteCategory = (cat: Category) => {
    setCatDeleteError(null);
    setCatDeleteId(cat.id);
  };

  // Close icon picker on outside click
  useEffect(() => {
    if (!catIconOpen) return;
    const handler = (e: MouseEvent) => {
      if (catPickerRef.current && !catPickerRef.current.contains(e.target as Node)) {
        setCatIconOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [catIconOpen]);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredCategories = categories.filter(c => c.type === txType);

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

      {/* Personalizar */}
      <div className="card">
        <h2 className="mb-4 text-sm font-medium text-surface-500">Personalizar</h2>
        <form onSubmit={handleSaveBrand} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: brandColor + '30' }}>
              <span className="text-lg font-bold" style={{ color: brandColor }}>{brandName.charAt(0).toUpperCase() || 'M'}</span>
            </div>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="input"
                placeholder="Nombre de la app"
                disabled={brandSaving}
              />
              <div className="flex items-center gap-2">
                <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-7 w-7 cursor-pointer rounded border border-surface-300 bg-transparent p-0.5 dark:border-surface-600" />
                <span className="text-xs text-surface-400 font-mono">{brandColor}</span>
                <div className="relative" ref={brandPickerRef}>
                  <button type="button" onClick={() => setBrandIconOpen(!brandIconOpen)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-surface-300 bg-transparent transition-colors hover:bg-surface-100 dark:border-surface-600 dark:hover:bg-surface-800"
                    title="Ícono de la app" disabled={brandSaving}>
                    {(() => {
                      const Icon = getIcon(brandIcon);
                      return <Icon size={16} style={{ color: brandColor }} />;
                    })()}
                  </button>
                  {brandIconOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 grid max-h-72 w-[312px] grid-cols-6 gap-0 overflow-y-auto rounded-xl border border-surface-200 bg-white p-2 shadow-xl dark:border-surface-700 dark:bg-surface-900">
                      {AVAILABLE_ICONS.map(name => {
                        const Icon = getIcon(name);
                        return (
                          <button key={name} type="button" onClick={() => { setBrandIcon(name); setBrandIconOpen(false); }}
                            className={`flex aspect-square items-center justify-center rounded-lg transition-colors hover:bg-surface-100 dark:hover:bg-surface-700 ${
                              brandIcon === name ? 'ring-2 ring-primary-500 bg-surface-100 dark:bg-surface-700' : ''
                            }`}>
                            <Icon size={22} style={{ color: brandColor }} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button type="submit" disabled={brandSaving || !brandName.trim()} className="btn-primary">
              {brandSaving ? '...' : <><Check size={16} /> Guardar</>}
            </button>
          </div>
          {brandMsg && (
            <p className={`text-xs ${brandMsg === 'Guardado' ? 'text-green-600' : 'text-red-500'}`}>
              {brandMsg === 'Guardado' ? <><Check size={14} className="inline" /> Cambios aplicados al instante</> : brandMsg}
            </p>
          )}
        </form>
      </div>

      {/* Create key */}
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

      {/* Create transaction */}
      <div className="card">
        <h2 className="mb-4 text-sm font-medium text-surface-500">Crear transacción manual</h2>
        <form onSubmit={handleCreateTransaction} className="space-y-3">
          <div className="flex w-full overflow-hidden rounded-lg border border-surface-300 dark:border-surface-600">
            <button type="button" onClick={() => { setTxType('egreso'); setTxCategory(''); }} className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${txType === 'egreso' ? 'bg-red-500 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'}`}>Gasto</button>
            <button type="button" onClick={() => { setTxType('ingreso'); setTxCategory(''); }} className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${txType === 'ingreso' ? 'bg-green-500 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'}`}>Ingreso</button>
          </div>
          <div className="flex gap-3">
            <input type="number" step="1" min="1" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="input flex-1" placeholder="Monto (CLP)" disabled={txSubmitting} />
            <div className="relative flex-1">
              <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)} className="input w-full appearance-none" disabled={txSubmitting}>
                <option value="">Seleccionar categoría</option>
                {filteredCategories.map(c => {
                  const Icon = getIcon(c.icon);
                  return (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  );
                })}
              </select>
              {txCategory && (() => {
                const cat = categories.find(c => c.id === txCategory);
                if (!cat) return null;
                const Icon = getIcon(cat.icon);
                return (
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1 text-xs text-surface-400">
                    <Icon size={14} style={{ color: cat.color }} />
                  </span>
                );
              })()}
            </div>
          </div>
          <input type="text" value={txUserName} onChange={(e) => setTxUserName(e.target.value)} className="input w-full" placeholder="Nombre usuario (opcional)" disabled={txSubmitting} />
          <input type="text" value={txDescription} onChange={(e) => setTxDescription(e.target.value)} className="input w-full" placeholder="Descripción (opcional)" disabled={txSubmitting} />
          <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="input w-full" disabled={txSubmitting} />
          {txError && <p className="text-sm text-red-500">{txError}</p>}
          {txSuccess && <p className="text-sm text-green-600">{txSuccess}</p>}
          <button type="submit" disabled={txSubmitting} className="btn-primary w-full">
            {txSubmitting ? 'Creando...' : <><DollarSign size={16} /> Crear transacción</>}
          </button>
        </form>
      </div>

      {/* Categories */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-surface-500">Categorías.</h2>
          <button onClick={fetchCategories} className="btn-ghost p-2" title="Actualizar">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Create category form */}
        <form onSubmit={handleCreateCategory} className="mb-4 space-y-2">
          
          <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} className="input w-full" placeholder="Nombre" disabled={catCreating} />
           
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex overflow-hidden rounded-lg border border-surface-300 dark:border-surface-600">
              <button type="button" onClick={() => setCatType('egreso')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors ${catType === 'egreso' ? 'bg-red-500 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'}`}>
                Gasto
              </button>
              <button type="button" onClick={() => setCatType('ingreso')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors ${catType === 'ingreso' ? 'bg-green-500 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'}`}>
                Ingreso
              </button>
            </div>
            <div className="relative">
              <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded border border-surface-300 bg-transparent p-0.5 dark:border-surface-600" title="Color" />
            </div>
            <div className="relative" ref={catPickerRef}>
              <button type="button" onClick={() => setCatIconOpen(!catIconOpen)}
                className="flex h-9 w-9 items-center justify-center rounded border border-surface-300 bg-transparent transition-colors hover:bg-surface-100 dark:border-surface-600 dark:hover:bg-surface-800"
                title="Ícono" disabled={catCreating}>
                {(() => {
                  const Icon = getIcon(catIcon);
                  return <Icon size={18} style={{ color: catColor }} />;
                })()}
              </button>
              {catIconOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 grid max-h-72 w-[312px] grid-cols-6 gap-0 overflow-y-auto rounded-xl border border-surface-200 bg-white p-2 shadow-xl dark:border-surface-700 dark:bg-surface-900">
                  {AVAILABLE_ICONS.map(name => {
                    const Icon = getIcon(name);
                    return (
                      <button key={name} type="button" onClick={() => { setCatIcon(name); setCatIconOpen(false); }}
                        className={`flex aspect-square items-center justify-center rounded-lg transition-colors hover:bg-surface-100 dark:hover:bg-surface-700 ${
                          catIcon === name ? 'ring-2 ring-primary-500 bg-surface-100 dark:bg-surface-700' : ''
                        }`}>
                        <Icon size={22} style={{ color: catColor }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            {catEditId && (
              <button type="button" onClick={cancelEditCategory} className="btn-ghost px-3">
                <X size={16} /> Cancelar
              </button>
            )}
            <button type="submit" disabled={catCreating || !catName.trim()} className="btn-primary w-full">
              {catCreating ? '...' : catEditId ? <><Check size={16} /> Guardar</> : <><Plus size={16} /> Agregar</>}
            </button>
          </div>
        </form>

        {catError && <p className="mb-3 text-sm text-red-500">{catError}</p>}

        {catDeleteError && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            {catDeleteError}
            <button onClick={() => setCatDeleteError(null)} className="ml-auto btn-ghost p-1"><X size={14} /></button>
          </div>
        )}

        {catDeleteId && !catDeleteError && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400">
            <span>¿Eliminar esta categoría?</span>
            <button onClick={handleDeleteCategory} disabled={catDeleting} className="btn-sm bg-red-500 text-white hover:bg-red-600">
              {catDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button onClick={() => setCatDeleteId(null)} className="btn-ghost text-surface-500">Cancelar</button>
          </div>
        )}

        {catLoading ? (
          <div className="flex h-16 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-surface-400">No hay categorías</p>
        ) : (
          <div className="space-y-2">
            {categories.map(c => {
              const Icon = getIcon(c.icon);
              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: c.color + '20' }}>
                      <Icon size={16} style={{ color: c.color }} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{c.name}</p>
                      <p className="text-xs capitalize text-surface-400">{c.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditCategory(c)} className="btn-ghost p-2 text-surface-400 hover:text-primary-600" title="Editar categoría">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => confirmDeleteCategory(c)} className="btn-ghost p-2 text-red-400 hover:text-red-600" title="Eliminar categoría">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Users and keys */}
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
                      {plainKeys[k.id] && (
                        <span className="ml-2 font-mono font-bold text-primary-600 dark:text-primary-400">{plainKeys[k.id]}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {k.is_active ? (
                    <>
                      {k.role !== 'admin' && (
                        <button
                          onClick={() => handleResetKey(k.id)}
                          disabled={resettingKey === k.id}
                          className="btn-ghost p-2 text-surface-400 hover:text-amber-600"
                          title="Resetear clave"
                        >
                          <RefreshCw size={16} className={resettingKey === k.id ? 'animate-spin' : ''} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="btn-ghost p-2 text-red-500 hover:text-red-700"
                        title="Revocar acceso"
                      >
                        <UserX size={16} />
                      </button>
                    </>
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
