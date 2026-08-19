interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxBars?: number;
}

export function BarChart({ data, maxBars = 12 }: BarChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, maxBars);
  const max = Math.max(...sorted.map((d) => d.value), 1);

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No data to display</p>;
  }

  return (
    <div className="space-y-2.5">
      {sorted.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600 w-20 text-right shrink-0 truncate">
            {d.label}
          </span>
          <div className="flex-1 h-6 bg-slate-50 rounded-md overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-500"
              style={{
                width: `${(d.value / max) * 100}%`,
                backgroundColor: d.color ?? '#0d9488',
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 w-8 shrink-0">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
}

export function DonutChart({ data }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <p className="text-sm text-slate-400 text-center py-8">No data to display</p>;
  }

  let offset = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="20" />
        {data.map((d) => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const seg = (
            <circle
              key={d.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="20"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 80 80)"
              className="transition-all duration-500"
            />
          );
          offset += dash;
          return seg;
        })}
        <text x="80" y="76" textAnchor="middle" className="text-2xl font-bold fill-slate-900">
          {total}
        </text>
        <text x="80" y="94" textAnchor="middle" className="text-xs fill-slate-400">
          Total
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-xs font-medium text-slate-600">{d.label}</span>
            <span className="text-xs font-semibold text-slate-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
