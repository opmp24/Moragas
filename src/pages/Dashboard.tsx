import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactions, getMonthlySummary, getCategorySummary, getCategories } from '../lib/api';
import type { Transaction, MonthlySummary, CategorySummary, Category, UserSummary } from '../types';
import { getIcon } from '../lib/categoryIcons';
import MonthlyChart from '../components/Charts/MonthlyChart';
import CategoryChart from '../components/Charts/CategoryChart';
import UserChart from '../components/Charts/UserChart';
import UserMonthlyChart from '../components/Charts/UserMonthlyChart';
import { Wallet, TrendingUp, TrendingDown, Receipt, RefreshCw, ArrowUpDown, X } from 'lucide-react';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function buildUserSummary(transactions: Transaction[], type?: 'ingreso' | 'egreso'): UserSummary[] {
  const byUser: Record<string, { total: number; count: number }> = {};
  for (const t of transactions) {
    if (type && t.type !== type) continue;
    const u = t.user_name || 'Sin nombre';
    if (!byUser[u]) byUser[u] = { total: 0, count: 0 };
    byUser[u].total += t.amount;
    byUser[u].count += 1;
  }
  return Object.entries(byUser).map(([user_name, v]) => ({ user_name, ...v }));
}

type SortCol = 'fecha' | 'tipo' | 'categoria' | 'usuario' | 'monto' | null;

interface SortConfig {
  col: SortCol;
  dir: 'asc' | 'desc';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [categoryDefs, setCategoryDefs] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'gasto' | 'ingreso'>('gasto');

  const [sort, setSort] = useState<SortConfig>({ col: 'fecha', dir: 'desc' });

  const [filterCat, setFilterCat] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [txs, mon, cat, catDefs] = await Promise.all([
        getTransactions(user.token),
        getMonthlySummary(user.token),
        getCategorySummary(user.token),
        getCategories(user.token),
      ]);
      setTransactions(txs);
      setMonthly(mon);
      setCategories(cat);
      setCategoryDefs(catDefs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const totalIngresos = transactions.filter((t) => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0);
  const totalEgresos = transactions.filter((t) => t.type === 'egreso').reduce((s, t) => s + t.amount, 0);
  const balance = totalIngresos - totalEgresos;

  const catColorMap: Record<string, string> = {};
  for (const c of categoryDefs) {
    catColorMap[c.name] = c.color;
  }

  const egresoSummary = buildUserSummary(transactions, 'egreso');
  const ingresoSummary = buildUserSummary(transactions, 'ingreso');

  const catLookup = new Map(categoryDefs.map(c => [c.name, c]));

  const categoryBarData = categories.map(c => ({ user_name: c.category, total: c.total, count: c.count }));

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
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button onClick={fetchData} className="btn-ghost p-2" title="Actualizar">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-sm text-surface-500">Ingresos</p>
            <p className="text-lg font-semibold text-surface-900 dark:text-surface-100">{formatCLP(totalIngresos)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
            <TrendingDown size={22} />
          </div>
          <div>
            <p className="text-sm text-surface-500">Gastos</p>
            <p className="text-lg font-semibold text-surface-900 dark:text-surface-100">{formatCLP(totalEgresos)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            balance >= 0
              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
          }`}>
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-sm text-surface-500">Balance</p>
            <p className={`text-lg font-semibold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCLP(balance)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full overflow-hidden rounded-lg border border-surface-300 dark:border-surface-600">
        <button onClick={() => setActiveTab('gasto')} className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'gasto' ? 'bg-red-500 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'}`}>Gasto</button>
        <button onClick={() => setActiveTab('ingreso')} className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'ingreso' ? 'bg-green-500 text-white' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'}`}>Ingreso</button>
      </div>

      {activeTab === 'gasto' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-4 text-sm font-medium text-surface-500">Gastos por Mes</h2>
            {monthly.length > 0 ? <MonthlyChart data={monthly} type="egreso" /> : <EmptyChart />}
          </div>
          <div className="card">
            <h2 className="mb-4 text-sm font-medium text-surface-500">Gastos por Categoría</h2>
            {categories.length > 0 ? <CategoryChart data={categories} colors={catColorMap} /> : <EmptyChart />}
          </div>
          {categoryBarData.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-sm font-medium text-surface-500">Gastos por Categoría (Total)</h2>
              <UserChart data={categoryBarData} color="#ef4444" />
            </div>
          )}
          {egresoSummary.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-sm font-medium text-surface-500">Gastos por Usuario por Mes</h2>
              <UserMonthlyChart data={transactions} type="egreso" />
            </div>
          )}
        </div>
      )}

      {activeTab === 'ingreso' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-4 text-sm font-medium text-surface-500">Ingresos por Mes</h2>
            {monthly.length > 0 ? <MonthlyChart data={monthly} type="ingreso" /> : <EmptyChart />}
          </div>
          {ingresoSummary.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-sm font-medium text-surface-500">Ingresos por Usuario (Total)</h2>
              <UserChart data={ingresoSummary} color="#10b981" />
            </div>
          )}
          {ingresoSummary.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-sm font-medium text-surface-500">Ingresos por Usuario por Mes</h2>
              <UserMonthlyChart data={transactions} type="ingreso" />
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-surface-500">Historial</h2>
        </div>

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
                  <th className="cursor-pointer pb-2 font-medium select-none hover:text-surface-700 dark:hover:text-surface-300" onClick={() => handleSort('usuario')}>Usuario<SortIcon col="usuario" /></th>
                  <th className="pb-2 font-medium">Descripción</th>
                  <th className="cursor-pointer pb-2 font-medium text-right select-none hover:text-surface-700 dark:hover:text-surface-300" onClick={() => handleSort('monto')}>Monto<SortIcon col="monto" /></th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx) => {
                  const cat = catLookup.get(tx.category);
                  const Icon = cat ? getIcon(cat.icon) : null;
                  return (
                    <tr key={tx.id} className="border-b last:border-0 border-surface-100 dark:border-surface-800">
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
                      <td className="py-2.5 text-surface-500 whitespace-nowrap">{tx.user_name || '-'}</td>
                      <td className="py-2.5 text-surface-600 dark:text-surface-400">{tx.description}</td>
                      <td className={`py-2.5 text-right font-mono font-medium whitespace-nowrap ${
                        tx.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCLP(tx.amount)}
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

function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-surface-400">
      Sin datos disponibles
    </div>
  );
}
