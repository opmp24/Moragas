import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { UserSummary } from '../../types';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-surface-800 dark:border-surface-700">
      <p className="mb-1 text-sm font-medium text-surface-900 dark:text-surface-100">{d.user_name || 'Sin nombre'}</p>
      <p className="text-sm text-surface-600 dark:text-surface-400">{formatCLP(d.total)}</p>
      <p className="text-xs text-surface-400">{d.count} transacciones</p>
    </div>
  );
};

export default function UserChart({ data, color }: { data: UserSummary[]; color?: string }) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 48)}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 80, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="user_name" tick={{ fontSize: 12 }} tickFormatter={(v) => v || 'Sin nombre'} width={70} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="total" fill={color || '#ef4444'} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
