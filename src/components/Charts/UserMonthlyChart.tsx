import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import type { Transaction } from '../../types';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

interface GroupedData {
  month: string;
  [user: string]: string | number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-surface-800 dark:border-surface-700">
      <p className="mb-1 text-xs font-medium text-surface-500">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-sm" style={{ color: p.color }}>
          {p.name || 'Sin nombre'}: {formatCLP(p.value)}
        </p>
      ))}
    </div>
  );
};

const USER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export default function UserMonthlyChart({ data }: { data: Transaction[] }) {
  const egresos = data.filter(t => t.type === 'egreso');

  // Group by month + user_name
  const byMonth: Record<string, Record<string, number>> = {};
  const allUsers = new Set<string>();

  for (const t of egresos) {
    const month = t.created_at.slice(0, 7);
    const user = t.user_name || 'Sin nombre';
    allUsers.add(user);
    if (!byMonth[month]) byMonth[month] = {};
    byMonth[month][user] = (byMonth[month][user] || 0) + t.amount;
  }

  const months = Object.keys(byMonth).sort();
  if (months.length === 0) return null;

  const users = Array.from(allUsers).sort();
  const chartData: GroupedData[] = months.map(m => ({
    month: m,
    ...byMonth[m],
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" fontSize={12} />
        {users.map((u, i) => (
          <Bar key={u} dataKey={u} name={u} fill={USER_COLORS[i % USER_COLORS.length]} radius={[4, 4, 0, 0]} stackId="a" />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
