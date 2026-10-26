export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 70;
  const H = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = W / (values.length - 1 || 1);
  const path = values
    .map((v, i) => {
      const x = i * stepX;
      const y = H - ((v - min) / range) * H;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function SparklineLarge({ values, color }: { values: number[]; color: string }) {
  const W = 460;
  const H = 90;
  const PAD = 8;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = innerW / (values.length - 1 || 1);
  const coords = values.map((v, i) => ({
    x: PAD + i * stepX,
    y: PAD + innerH - ((v - min) / range) * innerH,
    value: v,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const area = `${path} L ${coords[coords.length - 1].x} ${PAD + innerH} L ${coords[0].x} ${PAD + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
          <text x={c.x} y={c.y - 8} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">
            {c.value}
          </text>
        </g>
      ))}
    </svg>
  );
}
