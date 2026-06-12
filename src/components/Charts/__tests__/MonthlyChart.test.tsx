import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MonthlyChart from '../MonthlyChart';
import type { MonthlySummary } from '../../../types';

const mockData: MonthlySummary[] = [
  { month: '2026-05', ingresos: 20000, egresos: 5000 },
  { month: '2026-06', ingresos: 50000, egresos: 8000 },
];

describe('MonthlyChart', () => {
  it('renderiza sin errores con datos', () => {
    const { container } = render(<MonthlyChart data={mockData} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('renderiza sin errores con type="egreso"', () => {
    const { container } = render(<MonthlyChart data={mockData} type="egreso" />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('renderiza sin errores con type="ingreso"', () => {
    const { container } = render(<MonthlyChart data={mockData} type="ingreso" />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('renderiza con data vacia sin errores', () => {
    const { container } = render(<MonthlyChart data={[]} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
