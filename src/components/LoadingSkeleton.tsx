import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';

function Pulse({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <motion.div
      className={`animate-pulse rounded-md bg-surface-200 dark:bg-surface-800 ${className}`}
      style={style}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card flex items-center gap-4">
      <Pulse className="h-12 w-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Pulse className="h-3 w-16" />
        <Pulse className="h-5 w-28" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="card">
      <Pulse className="mb-4 h-3 w-40" />
      <div className="flex h-[280px] items-end gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Pulse
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card space-y-3">
      <Pulse className="h-3 w-24" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Pulse className="h-3 flex-1" />
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-32" />
          <Pulse className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <Pulse className="h-6 w-56" />
      <div className="card space-y-3">
        <Pulse className="h-3 w-32" />
        <div className="flex gap-3">
          <Pulse className="h-10 flex-1" />
          <Pulse className="h-10 w-20" />
        </div>
      </div>
      <div className="card space-y-3">
        <Pulse className="h-3 w-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Pulse className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Pulse className="h-3 w-32" />
              <Pulse className="h-2 w-48" />
            </div>
            <Pulse className="h-6 w-6 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
