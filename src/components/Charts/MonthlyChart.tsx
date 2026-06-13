import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MonthlySummary } from '../../types';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function monthLabel(month: string): string {
  const parts = month.split('-');
  if (parts.length !== 2) return month;
  const m = parseInt(parts[1], 10);
  return MONTHS[m - 1] || month;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-surface-800 dark:border-surface-700">
      <p className="mb-1 text-xs font-medium text-surface-500">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-sm" style={{ color: p.color }}>
          {p.name}: {formatCLP(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function MonthlyChart({ data, type, showYearTabs }: { data: MonthlySummary[]; type?: 'ingreso' | 'egreso'; showYearTabs?: boolean }) {
  const years = useMemo(() => {
    const s = new Set<string>();
    for (const d of data) {
      const y = d.month.split('-')[0];
      if (y) s.add(y);
    }
    return Array.from(s).sort();
  }, [data]);

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const y = years;
    return y.length > 0 ? y[y.length - 1] : '';
  });

  const filteredData = useMemo(() => {
    if (!showYearTabs || !selectedYear) return data;
    return data.filter(d => d.month.startsWith(selectedYear + '-'));
  }, [data, showYearTabs, selectedYear]);

  return (
    <div>
      {showYearTabs && years.length > 1 && (
        <div className="mb-3 flex gap-1">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                selectedYear === y
                  ? 'bg-surface-900 text-white dark:bg-white dark:text-surface-900'
                  : 'bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={filteredData} barGap={4}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={showYearTabs ? monthLabel : undefined}
          />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" fontSize={12} />
          {(!type || type === 'ingreso') && <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />}
          {(!type || type === 'egreso') && <Bar dataKey="egresos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
