import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/*
 * Small SVG charts for the task reports. Colour carries identity only; values and labels stay
 * in text colours, every chart has a hover layer and a table view, and there is one y-axis.
 */

// Validated categorical pair (CVD-safe on white); Ideal/reference lines use the neutral gray
export const CHART_COLORS = { series1: '#2a78d6', series2: '#eb6834', reference: '#9ca3af' } as const;
const GRID = '#e5e7eb';
const AXIS_TEXT = '#6b7280';

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

// A rounded top for the y-axis plus four evenly spaced ticks
function niceScale(max: number): number[] {
  const top = Math.max(4, max);
  const step = Math.ceil(top / 4 / (top > 20 ? 5 : 1)) * (top > 20 ? 5 : 1);
  return [0, step, step * 2, step * 3, step * 4];
}

// No more than ~7 x labels, always including the last one
function xLabelIndexes(count: number, width: number): Set<number> {
  const every = Math.max(1, Math.ceil(count / Math.max(2, Math.min(7, Math.floor(width / 70)))));
  const shown = new Set<number>();
  for (let index = count - 1; index >= 0; index -= every) shown.add(index);
  return shown;
}

/* ---------- Card with a chart / table toggle ---------- */

export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

export function ChartCard({
  title,
  subtitle,
  table,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  table?: ChartTable;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className={cn('min-w-0', className)}>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {table && (
              <button
                type="button"
                onClick={() => setShowTable(!showTable)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                aria-pressed={showTable}
              >
                {showTable ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
                {showTable ? 'Show chart' : 'Show table'}
              </button>
            )}
          </div>
        </div>
        {showTable && table ? <DataTable table={table} /> : children}
      </CardContent>
    </Card>
  );
}

function DataTable({ table }: { table: ChartTable }) {
  return (
    <div className="app-scrollbar relative max-h-72 overflow-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 text-left text-xs font-semibold text-gray-600">
          <tr>
            {table.columns.map((column, index) => (
              <th key={column} className={cn('px-3 py-2', index > 0 && 'text-right')}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td key={index} className={cn('px-3 py-1.5', index === 0 ? 'text-gray-700' : 'text-right tabular-nums text-gray-900')}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Legend ---------- */

export interface LegendItem {
  name: string;
  color: string;
  dashed?: boolean;
}

export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
      {items.map((item) => (
        <li key={item.name} className="inline-flex items-center gap-1.5">
          <svg width="16" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="16" y2="4" stroke={item.color} strokeWidth="2" strokeDasharray={item.dashed ? '4 3' : undefined} />
          </svg>
          {item.name}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Tooltip ---------- */

function Tooltip({ x, width, title, rows }: { x: number; width: number; title: string; rows: { name: string; color: string; value: string }[] }) {
  // Flip to the left of the crosshair near the right edge
  const flip = x > width - 170;
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-1 z-10 min-w-[140px] rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-md"
      style={flip ? { right: width - x + 10 } : { left: x + 10 }}
    >
      <p className="mb-1 font-semibold text-gray-900">{title}</p>
      {rows.map((row) => (
        <p key={row.name} className="flex items-center justify-between gap-3 text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
            {row.name}
          </span>
          <span className="font-semibold tabular-nums text-gray-900">{row.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ---------- Line chart (crosshair + tooltip, end labels) ---------- */

export interface LineSeries<T> {
  key: keyof T & string;
  name: string;
  color: string;
  dashed?: boolean;
}

export function LineChart<T extends { label: string }>({
  data,
  series,
  height = 220,
  ariaLabel,
  areaKey,
}: {
  data: T[];
  series: LineSeries<T>[];
  height?: number;
  ariaLabel: string;
  // Optional series to shade lightly underneath
  areaKey?: keyof T & string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const valueOf = (row: T, key: keyof T) => row[key] as unknown as number | null;

  const margin = { top: 10, right: 64, bottom: 24, left: 32 };
  const plotWidth = Math.max(0, width - margin.left - margin.right);
  const plotHeight = height - margin.top - margin.bottom;
  const max = Math.max(0, ...data.flatMap((row) => series.map((line) => valueOf(row, line.key) ?? 0)));
  const ticks = niceScale(max);
  const top = ticks[ticks.length - 1];
  const x = (index: number) => margin.left + (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const y = (value: number) => margin.top + plotHeight - (value / top) * plotHeight;
  const labels = xLabelIndexes(data.length, plotWidth);

  const pathFor = (key: keyof T) => {
    let path = '';
    let drawing = false;
    data.forEach((row, index) => {
      const value = valueOf(row, key);
      if (value === null || value === undefined) {
        drawing = false;
        return;
      }
      path += `${drawing ? 'L' : 'M'}${x(index)},${y(value)}`;
      drawing = true;
    });
    return path;
  };
  const lastIndex = (key: keyof T) => data.reduce((last, row, index) => (valueOf(row, key) !== null && valueOf(row, key) !== undefined ? index : last), -1);

  const onMove = (event: React.MouseEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / Math.max(1, box.width);
    setHover(Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1)))));
  };

  return (
    <div className="space-y-2">
      {series.length > 1 && <ChartLegend items={series} />}
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={ariaLabel}>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={margin.left} x2={margin.left + plotWidth} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth="1" />
                <text x={margin.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize="11" fill={AXIS_TEXT}>
                  {tick}
                </text>
              </g>
            ))}
            {data.map((row, index) =>
              labels.has(index) ? (
                <text key={row.label} x={x(index)} y={height - 6} textAnchor="middle" fontSize="11" fill={AXIS_TEXT}>
                  {row.label}
                </text>
              ) : null,
            )}
            {areaKey && lastIndex(areaKey) >= 0 && (
              <path
                d={`${pathFor(areaKey)}L${x(lastIndex(areaKey))},${y(0)}L${x(data.findIndex((row) => valueOf(row, areaKey) !== null))},${y(0)}Z`}
                fill={series.find((line) => line.key === areaKey)?.color}
                opacity="0.1"
              />
            )}
            {series.map((line) => (
              <path
                key={line.key}
                d={pathFor(line.key)}
                fill="none"
                stroke={line.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={line.dashed ? '5 4' : undefined}
              />
            ))}
            {/* Direct labels at each line's last point */}
            {series.map((line) => {
              const index = lastIndex(line.key);
              if (index < 0) return null;
              const value = valueOf(data[index], line.key) as number;
              return (
                <g key={line.key}>
                  <circle cx={x(index)} cy={y(value)} r="4" fill={line.color} stroke="#fff" strokeWidth="2" />
                  <text x={x(index) + 8} y={y(value)} dy="0.32em" fontSize="11" fill="#374151" fontWeight="600">
                    {value}
                    <tspan fontWeight="400" fill={AXIS_TEXT}>
                      {' '}
                      {line.name}
                    </tspan>
                  </text>
                </g>
              );
            })}
            {hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={margin.top} y2={margin.top + plotHeight} stroke="#9ca3af" strokeWidth="1" />
                {series.map((line) => {
                  const value = valueOf(data[hover], line.key);
                  return value === null || value === undefined ? null : (
                    <circle key={line.key} cx={x(hover)} cy={y(value)} r="4" fill={line.color} stroke="#fff" strokeWidth="2" />
                  );
                })}
              </g>
            )}
            <rect
              x={margin.left}
              y={margin.top}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            />
          </svg>
        )}
        {hover !== null && (
          <Tooltip
            x={x(hover)}
            width={width}
            title={data[hover].label}
            rows={series.map((line) => ({ name: line.name, color: line.color, value: String(valueOf(data[hover], line.key) ?? '—') }))}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Column chart (one series, per-bar tooltip) ---------- */

export function ColumnChart({
  data,
  color = CHART_COLORS.series1,
  height = 220,
  ariaLabel,
  valueName,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  ariaLabel: string;
  valueName: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const margin = { top: 18, right: 8, bottom: 24, left: 32 };
  const plotWidth = Math.max(0, width - margin.left - margin.right);
  const plotHeight = height - margin.top - margin.bottom;
  const ticks = niceScale(Math.max(0, ...data.map((row) => row.value)));
  const top = ticks[ticks.length - 1];
  const band = data.length === 0 ? 0 : plotWidth / data.length;
  const barWidth = Math.min(24, Math.max(4, band - 2));
  const y = (value: number) => margin.top + plotHeight - (value / top) * plotHeight;
  const labels = xLabelIndexes(data.length, plotWidth);
  // Label only the highest and the latest bar
  const maxIndex = data.reduce((best, row, index) => (row.value > data[best].value ? index : best), 0);
  const labelled = new Set([maxIndex, data.length - 1]);

  // A bar with a 4px rounded top and a square base on the axis
  const barPath = (left: number, value: number) => {
    const barTop = y(value);
    const bottom = y(0);
    const radius = Math.min(4, (bottom - barTop) / 2, barWidth / 2);
    return `M${left},${bottom}V${barTop + radius}Q${left},${barTop} ${left + radius},${barTop}H${left + barWidth - radius}Q${left + barWidth},${barTop} ${left + barWidth},${barTop + radius}V${bottom}Z`;
  };

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={margin.left} x2={margin.left + plotWidth} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth="1" />
              <text x={margin.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize="11" fill={AXIS_TEXT}>
                {tick}
              </text>
            </g>
          ))}
          {data.map((row, index) => {
            const center = margin.left + band * index + band / 2;
            const active = hover === index;
            return (
              <g key={row.label}>
                {row.value > 0 && <path d={barPath(center - barWidth / 2, row.value)} fill={color} opacity={hover === null || active ? 1 : 0.55} />}
                {labelled.has(index) && row.value > 0 && (
                  <text x={center} y={y(row.value) - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">
                    {row.value}
                  </text>
                )}
                {labels.has(index) && (
                  <text x={center} y={height - 6} textAnchor="middle" fontSize="11" fill={AXIS_TEXT}>
                    {row.label}
                  </text>
                )}
                {/* Hit target: the whole column band, at least 24px wide */}
                <rect
                  x={center - Math.max(12, band / 2)}
                  y={margin.top}
                  width={Math.max(24, band)}
                  height={plotHeight}
                  fill="transparent"
                  onMouseEnter={() => setHover(index)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && (
        <Tooltip
          x={margin.left + band * hover + band / 2}
          width={width}
          title={data[hover].label}
          rows={[{ name: valueName, color, value: String(data[hover].value) }]}
        />
      )}
    </div>
  );
}

/* ---------- Horizontal progress bar ---------- */

export function ProgressBar({ percent, color = CHART_COLORS.series1, label }: { percent: number; color?: string; label: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
    </div>
  );
}
