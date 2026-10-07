import React, { useState } from "react";
import { cx } from "./ui";

// Minimal single-series charts for the Form Builder dashboards. One series
// per chart = one hue (Edeco navy), so no legend; the title names the series.
// Every chart has a hover tooltip and a table view.

const SERIES = "#1F2853";

export const ColumnChart = ({ title, data, valueLabel = "count", formatLabel = (label) => label, height = 160 }) => {
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...data.map((point) => point.value));
  const total = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{total.toLocaleString("en-IN")} total</p>
        </div>
        <button type="button" onClick={() => setAsTable(!asTable)} className="text-xs font-medium text-slate-500 hover:text-slate-800">
          {asTable ? "Show chart" : "Show table"}
        </button>
      </div>
      {asTable ? (
        <div className="max-h-64 overflow-y-auto rounded-sm border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
              <tr><th className="px-3 py-1.5 font-medium">Date</th><th className="px-3 py-1.5 text-right font-medium">{valueLabel}</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((point) => (
                <tr key={point.label}><td className="px-3 py-1.5 text-slate-700">{formatLabel(point.label)}</td><td className="px-3 py-1.5 text-right tabular-nums text-slate-900">{point.value}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative" role="img" aria-label={`${title}: ${total} ${valueLabel} over ${data.length} days`}>
          <div className="flex items-end gap-[2px] border-b border-slate-200" style={{ height }} onMouseLeave={() => setHover(null)}>
            {data.map((point, index) => (
              <div
                key={point.label}
                className="group relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(index)}
              >
                <div
                  className="w-full rounded-t-sm transition-opacity"
                  style={{ height: `${(point.value / max) * 100}%`, minHeight: point.value ? 2 : 0, background: SERIES, opacity: hover === null || hover === index ? 1 : 0.45 }}
                />
              </div>
            ))}
          </div>
          {hover !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm bg-slate-900 px-2 py-1 text-xs text-white "
              style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
            >
              {formatLabel(data[hover].label)} · <span className="font-semibold">{data[hover].value}</span> {valueLabel}
            </div>
          )}
          <div className="mt-1 flex justify-between text-[11px] text-slate-400">
            <span>{formatLabel(data[0]?.label)}</span>
            <span>{formatLabel(data[data.length - 1]?.label)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const BarList = ({ title, data, emptyText = "No data yet." }) => {
  const max = Math.max(1, ...data.map((row) => row.value));
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-900">{title}</p>
      {!data.length ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {data.map((row) => (
            <li key={row.label} title={`${row.label}: ${row.value}${row.detail ? ` (${row.detail})` : ""}`}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate text-slate-700">{row.label}</span>
                <span className="shrink-0 tabular-nums text-slate-900">
                  {row.value.toLocaleString("en-IN")}
                  {row.detail && <span className="ml-1 text-xs text-slate-500">{row.detail}</span>}
                </span>
              </div>
              <div className="h-2 rounded-sm bg-slate-100">
                <div className={cx("h-2 rounded-sm")} style={{ width: `${(row.value / max) * 100}%`, background: SERIES }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const StatTile = ({ label, value, hint, to }) => {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{typeof value === "number" ? value.toLocaleString("en-IN") : value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </>
  );
  return <div className="rounded-sm border border-slate-200 bg-white p-4">{to ? to(body) : body}</div>;
};
