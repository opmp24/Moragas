import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactions, getMonthlySummary, getCategorySummary } from '../lib/api';
import type { Transaction, MonthlySummary, CategorySummary } from '../types';
import MonthlyChart from '../components/Charts/MonthlyChart';
import CategoryChart from '../components/Charts/CategoryChart';
import { Wallet, TrendingUp, TrendingDown, Receipt, RefreshCw } from 'lucide-react';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthly, setMonthly] = useState<MonthlySummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [txs, mon, cat] = await Promise.all([
        getTransactions(user.token),
        getMonthlySummary(user.token),
        getCategorySummary(user.token),
      ]);
      setTransactions(txs);
      setMonthly(mon);
      setCategories(cat);
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-sm font-medium text-surface-500">Ingresos / Gastos por Mes</h2>
          {monthly.length > 0 ? <MonthlyChart data={monthly} /> : <EmptyChart />}
        </div>
        <div className="card">
          <h2 className="mb-4 text-sm font-medium text-surface-500">Gastos por Categoría</h2>
          {categories.length > 0 ? <CategoryChart data={categories} /> : <EmptyChart />}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-sm font-medium text-surface-500">Historial</h2>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-surface-400">
            <Receipt size={32} />
            <p className="text-sm">No hay transacciones aún</p>
            <p className="text-xs">Envía un mensaje al bot de Telegram para empezar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-surface-500">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Categoría</th>
                  <th className="pb-2 font-medium">Descripción</th>
                  <th className="pb-2 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 border-surface-100 dark:border-surface-800">
                    <td className="py-2.5 text-surface-500">
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
                    <td className="py-2.5 capitalize text-surface-700 dark:text-surface-300">{tx.category}</td>
                    <td className="py-2.5 text-surface-600 dark:text-surface-400">{tx.description}</td>
                    <td className={`py-2.5 text-right font-mono font-medium ${
                      tx.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCLP(tx.amount)}
                    </td>
                  </tr>
                ))}
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
