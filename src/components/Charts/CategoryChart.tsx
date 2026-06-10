import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { CategorySummary } from '../../types';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-surface-800 dark:border-surface-700">
      <p className="mb-1 text-sm font-medium capitalize">{d.category}</p>
      <p className="text-sm text-surface-600 dark:text-surface-400">{formatCLP(d.total)}</p>
      <p className="text-xs text-surface-400">{d.count} transacciones</p>
    </div>
  );
};

export default function CategoryChart({ data }: { data: CategorySummary[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          fontSize={12}
          formatter={(value: string) => (
            <span className="text-xs capitalize text-surface-600 dark:text-surface-400">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
