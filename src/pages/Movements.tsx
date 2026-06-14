import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactions, getCategories, adminListKeys, adminUpdateTransaction, adminDeleteTransaction } from '../lib/api';
import type { Transaction, Category } from '../types';
import { getIcon } from '../lib/categoryIcons';
import { Receipt, ArrowUpDown, X, RefreshCw, Pencil, Trash2, Check, AlertCircle } from 'lucide-react';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

type SortCol = 'fecha' | 'tipo' | 'categoria' | 'usuario' | 'monto' | null;

interface SortConfig {
  col: SortCol;
  dir: 'asc' | 'desc';
}

export default function Movements() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryDefs, setCategoryDefs] = useState<Category[]>([]);
  const [userColorMap, setUserColorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sort, setSort] = useState<SortConfig>({ col: 'fecha', dir: 'desc' });

  const [filterCat, setFilterCat] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<'ingreso' | 'egreso'>('egreso');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [txs, catDefs, keys] = await Promise.all([
        getTransactions(user.token),
        getCategories(user.token),
        adminListKeys(user.token),
      ]);
      setTransactions(txs);
      setCategoryDefs(catDefs);
      const cmap: Record<string, string> = {};
      for (const k of keys) {
        if (k.user_color) cmap[k.display_name] = k.user_color;
      }
      setUserColorMap(cmap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const catLookup = new Map(categoryDefs.map(c => [c.name, c]));

  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const t of transactions) {
      const key = `${t.type}::${t.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(t.category);
      }
    }
    return result.sort();
  }, [transactions]);

  const filteredCatDefs = useMemo(() => {
    return categoryDefs.filter(c => c.type === editType);
  }, [categoryDefs, editType]);

  const filteredTx = useMemo(() => {
    let result = [...transactions];

    if (filterCat) {
      result = result.filter(t => t.category === filterCat);
    }
    if (filterUser) {
      const q = filterUser.toLowerCase();
      result = result.filter(t => t.user_name?.toLowerCase().includes(q));
    }
    if (filterFrom) {
      const from = new Date(filterFrom);
      result = result.filter(t => new Date(t.created_at) >= from);
    }
    if (filterTo) {
      const to = new Date(filterTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.created_at) <= to);
    }

    if (sort.col) {
      result.sort((a, b) => {
        let cmp = 0;
        switch (sort.col) {
          case 'fecha':
            cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case 'tipo':
            cmp = a.type.localeCompare(b.type);
            break;
          case 'categoria':
            cmp = a.category.localeCompare(b.category);
            break;
          case 'usuario':
            cmp = (a.user_name || '').localeCompare(b.user_name || '');
            break;
          case 'monto':
            cmp = a.amount - b.amount;
            break;
        }
        return sort.dir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [transactions, filterCat, filterUser, filterFrom, filterTo, sort]);

  const handleSort = (col: SortCol) => {
    setSort(prev => {
      if (prev.col === col) {
        if (prev.dir === 'desc') return { col, dir: 'asc' };
        return { col: null, dir: 'desc' };
      }
      return { col, dir: 'desc' };
    });
  };

  const clearFilters = () => {
    setFilterCat('');
    setFilterUser('');
    setFilterFrom('');
    setFilterTo('');
  };

  const hasFilters = filterCat || filterUser || filterFrom || filterTo;

  const startEdit = (tx: Transaction) => {
    if (editSaving) return;
    setEditId(tx.id);
    setEditType(tx.type);
    setEditCategory(tx.category);
    setEditDescription(tx.description || '');
  };

  const cancelEdit = () => {
    if (editSaving) return;
    setEditId(null);
  };

  const saveEdit = async () => {
    if (!user || !editId || editSaving) return;
    const tx = transactions.find(t => t.id === editId);
    if (!tx) return;

    if (editType === tx.type && editCategory === tx.category && editDescription === (tx.description || '')) {
      setEditId(null);
      return;
    }

    setEditSaving(true);
    setError(null);
    try {
      const updated = await adminUpdateTransaction(user.token, editId, {
        type: editType !== tx.type ? editType : undefined,
        category: editCategory !== tx.category ? editCategory : undefined,
        description: editDescription !== (tx.description || '') ? editDescription : undefined,
      });
      setTransactions(prev => prev.map(t => t.id === editId ? updated : t));
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (txId: string) => {
    if (!user || deletingId) return;
    setDeletingId(txId);
    setError(null);
    try {
      await adminDeleteTransaction(user.token, txId);
      setTransactions(prev => prev.filter(t => t.id !== txId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sort.col !== col) return <ArrowUpDown size={12} className="ml-1 inline opacity-30" />;
    return <span className="ml-1">{sort.dir === 'desc' ? '▼' : '▲'}</span>;
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Movimientos</h1>
        <button onClick={fetchData} className="btn-ghost p-2" title="Actualizar">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1 block text-xs text-surface-400">Categoría</label>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input w-full">
              <option value="">Todas</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1 block text-xs text-surface-400">Usuario</label>
            <input type="text" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="input w-full" placeholder="Filtrar usuario…" />
          </div>
          <div className="w-[140px]">
            <label className="mb-1 block text-xs text-surface-400">Desde</label>
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="input w-full" />
          </div>
          <div className="w-[140px]">
            <label className="mb-1 block text-xs text-surface-400">Hasta</label>
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="input w-full" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost p-2 text-surface-400" title="Limpiar filtros">
              <X size={16} />
            </button>
          )}
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto btn-ghost p-1"><X size={14} /></button>
          </div>
        )}

        {filteredTx.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-surface-400">
            <Receipt size={32} />
            <p className="text-sm">No hay transacciones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-surface-500">
                  <th className="cursor-pointer pb-2 font-medium select-none hover:text-surface-700 dark:hover:text-surface-300" onClick={() => handleSort('fecha')}>Fecha<SortIcon col="fecha" /></th>
                  <th className="cursor-pointer pb-2 font-medium select-none hover:text-surface-700 dark:hover:text-surface-300" onClick={() => handleSort('tipo')}>Tipo<SortIcon col="tipo" /></th>
                  <th className="cursor-pointer pb-2 font-medium select-none hover:text-surface-700 dark:hover:text-surface-300" onClick={() => handleSort('categoria')}>Categoría<SortIcon col="categoria" /></th>
                  <th className="pb-2 font-medium">Usuario</th>
                  <th className="pb-2 font-medium">Descripción</th>
                  <th className="cursor-pointer pb-2 font-medium text-right select-none hover:text-surface-700 dark:hover:text-surface-300" onClick={() => handleSort('monto')}>Monto<SortIcon col="monto" /></th>
                  <th className="w-20 pb-2 font-medium text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx) => {
                  const cat = catLookup.get(tx.category);
                  const Icon = cat ? getIcon(cat.icon) : null;
                  const isEditing = editId === tx.id;
                  const isDeleting = deletingId === tx.id;

                  if (isEditing) {
                    return (
                      <tr key={tx.id} className="border-b last:border-0 border-surface-100 dark:border-surface-800 bg-primary-50 dark:bg-primary-950/30">
                        <td className="py-2 text-surface-500 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString('es-CL')}
                        </td>
                        <td className="py-2">
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as 'ingreso' | 'egreso')}
                            className="input w-24 text-xs"
                            disabled={editSaving}
                          >
                            <option value="egreso">Gasto</option>
                            <option value="ingreso">Ingreso</option>
                          </select>
                        </td>
                        <td className="py-2">
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="input w-32 text-xs"
                            disabled={editSaving}
                          >
                            {filteredCatDefs.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 whitespace-nowrap">
                          {tx.user_name ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                              style={{ backgroundColor: (userColorMap[tx.user_name] || '#6b7280') + '20', color: userColorMap[tx.user_name] || '#6b7280' }}>
                              {tx.user_name}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="input w-full text-xs"
                            disabled={editSaving}
                            placeholder="Descripción"
                          />
                        </td>
                        <td className={`py-2 text-right font-mono font-medium whitespace-nowrap ${
                          tx.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCLP(tx.amount)}
                        </td>
                        <td className="py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={saveEdit} disabled={editSaving} className="btn-ghost p-1.5 text-green-600 hover:text-green-700" title="Guardar">
                              {editSaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" /> : <Check size={16} />}
                            </button>
                            <button onClick={cancelEdit} disabled={editSaving} className="btn-ghost p-1.5 text-surface-400 hover:text-red-600" title="Cancelar">
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={tx.id} className={`border-b last:border-0 border-surface-100 dark:border-surface-800 ${isDeleting ? 'opacity-50' : ''}`}>
                      <td className="py-2.5 text-surface-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('es-CL')}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.type === 'ingreso'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        }`}>
                          {tx.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap"
                          style={{ backgroundColor: (cat?.color || '#6b7280') + '20', color: cat?.color || '#6b7280' }}>
                          {Icon && <Icon size={12} />}
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        {tx.user_name ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: (userColorMap[tx.user_name] || '#6b7280') + '20', color: userColorMap[tx.user_name] || '#6b7280' }}>
                            {tx.user_name}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2.5 text-surface-600 dark:text-surface-400 max-w-[200px] truncate">{tx.description}</td>
                      <td className={`py-2.5 text-right font-mono font-medium whitespace-nowrap ${
                        tx.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCLP(tx.amount)}
                      </td>
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEdit(tx)} disabled={editSaving} className="btn-ghost p-1.5 text-surface-400 hover:text-primary-600" title="Editar">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(tx.id)} disabled={!!deletingId} className="btn-ghost p-1.5 text-red-400 hover:text-red-600" title="Eliminar">
                            {isDeleting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
