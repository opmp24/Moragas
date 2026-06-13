import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactions, getMonthlySummary, getCategorySummary, getCategories } from '../lib/api';
import type { Transaction, MonthlySummary, CategorySummary, Category } from '../types';
import { getIcon } from '../lib/categoryIcons';
import MonthlyChart from '../components/Charts/MonthlyChart';
import CategoryChart from '../components/Charts/CategoryChart';
import UserChart from '../components/Charts/UserChart';
import UserMonthlyChart from '../components/Charts/UserMonthlyChart';
import { Wallet, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function buildUserSummary(transactions: Transaction[], type?: 'ingreso' | 'egreso') {
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

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [categoryDefs, setCategoryDefs] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'gasto' | 'ingreso'>('ingreso');

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

  const categoryBarData = categories.map(c => ({ user_name: c.category, total: c.total, count: c.count }));

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
            {monthly.length > 0 ? <MonthlyChart data={monthly} type="egreso" showYearTabs /> : <EmptyChart />}
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
            {monthly.length > 0 ? <MonthlyChart data={monthly} type="ingreso" showYearTabs /> : <EmptyChart />}
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
