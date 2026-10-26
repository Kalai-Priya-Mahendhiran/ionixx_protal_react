import type { DepartmentMetric, ForecastPoint } from "./analytics-meta";

export function SvgLineChart({
  points,
  min,
  max,
  color,
  fillId,
}: {
  points: { label: string; value: number }[];
  min: number;
  max: number;
  color: string;
  fillId: string;
}) {
  const W = 800;
  const H = 240;
  const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const stepX = innerW / (points.length - 1 || 1);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + innerH - ((p.value - min) / range) * innerH,
    label: p.label,
    value: p.value,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${path} L ${coords[coords.length - 1].x} ${PAD.top + innerH} L ${coords[0].x} ${PAD.top + innerH} Z`;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = min + (range * i) / yTicks;
    return {
      y: PAD.top + innerH - ((v - min) / range) * innerH,
      value: Math.round(v),
    };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            y1={t.y}
            x2={W - PAD.right}
            y2={t.y}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
          <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
            {t.value}
          </text>
        </g>
      ))}
      <path d={areaPath} fill={`url(#${fillId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="4" fill="white" stroke={color} strokeWidth="2" />
          <text
            x={c.x}
            y={H - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
          >
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function SvgBarChart({
  points,
  max,
  color,
}: {
  points: { label: string; value: number }[];
  max: number;
  color: string;
}) {
  const W = 800;
  const H = 240;
  const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const barW = (innerW / points.length) * 0.6;
  const gap = innerW / points.length;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = (max * i) / yTicks;
    return {
      y: PAD.top + innerH - (v / max) * innerH,
      value: Math.round(v),
    };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            y1={t.y}
            x2={W - PAD.right}
            y2={t.y}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
          <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
            {t.value}
          </text>
        </g>
      ))}
      {points.map((p, i) => {
        const h = (p.value / max) * innerH;
        const x = PAD.left + i * gap + (gap - barW) / 2;
        const y = PAD.top + innerH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="4" fill={color} opacity="0.85" />
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#334155"
            >
              {p.value}
            </text>
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ForecastChart({
  data,
  color,
  suffix,
}: {
  data: ForecastPoint[];
  color: string;
  suffix: string;
}) {
  const W = 600;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allValues = data.flatMap((d) => [d.actual ?? d.forecast, d.forecast]);
  const min = Math.min(...allValues) * 0.9;
  const max = Math.max(...allValues) * 1.05;
  const range = max - min || 1;
  const stepX = innerW / (data.length - 1 || 1);

  const actualCoords = data
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.actual !== null)
    .map(({ d, i }) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + innerH - (((d.actual as number) - min) / range) * innerH,
    }));

  const forecastCoords = data.map((d, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + innerH - ((d.forecast - min) / range) * innerH,
  }));

  const actualPath = actualCoords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");
  const forecastPath = forecastCoords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD.top + innerH * (1 - t);
          const v = min + range * t;
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                {v.toFixed(suffix === "%" ? 1 : 0)}
              </text>
            </g>
          );
        })}
        <path d={actualPath} fill="none" stroke={color} strokeWidth="2.5" />
        <path
          d={forecastPath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray="5 4"
          opacity="0.7"
        />
        {actualCoords.map((c, i) => (
          <circle key={`a-${i}`} cx={c.x} cy={c.y} r="3.5" fill={color} />
        ))}
        {forecastCoords.map((c, i) => {
          const isForecast = data[i].actual === null;
          if (!isForecast) return null;
          return (
            <circle
              key={`f-${i}`}
              cx={c.x}
              cy={c.y}
              r="3.5"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
        {data.map((d, i) => (
          <text
            key={i}
            x={PAD.left + i * stepX}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
          >
            {d.label}
          </text>
        ))}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{ background: color }} />
          <span className="text-gray-600">Actual</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 border-t border-dashed"
            style={{ borderColor: color }}
          />
          <span className="text-gray-600">Forecast</span>
        </span>
      </div>
    </div>
  );
}

export function DistributionChart({ data }: { data: DepartmentMetric[] }) {
  const total = data.reduce((sum, d) => sum + d.headcount, 0);
  let cumulative = 0;
  const radius = 70;
  const cx = 90;
  const cy = 90;

  const segments = data.map((d) => {
    const fraction = d.headcount / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { path, color: d.color, name: d.name, value: d.headcount, pct: (fraction * 100).toFixed(1) };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-44 h-44 flex-shrink-0">
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r="36" fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">
          Total
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill="#1e293b"
        >
          {total}
        </text>
      </svg>
      <ul className="flex-1 grid grid-cols-2 gap-2 text-sm">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-gray-700 truncate flex-1">{s.name}</span>
            <span className="text-gray-500 text-xs">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
