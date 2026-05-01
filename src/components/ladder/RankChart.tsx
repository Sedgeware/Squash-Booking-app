"use client";

import { useMemo } from "react";
import type { ChartPoint } from "@/app/(public)/ladder/player/[id]/page";

interface Props {
  data: ChartPoint[];
}

const VIEWBOX_W = 600;
const VIEWBOX_H = 220;
const PAD_LEFT = 36; // room for Y-axis labels
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 32; // room for X-axis labels
const CHART_W = VIEWBOX_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = VIEWBOX_H - PAD_TOP - PAD_BOTTOM;

export function RankChart({ data }: Props) {
  const { points, xLabels, yTicks } = useMemo(() => {
    if (data.length < 2) return { points: [], xLabels: [], yTicks: [] };

    const dates = data.map((d) => new Date(d.date).getTime());
    const ranks = data.map((d) => d.rank);

    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const dateRange = maxDate - minDate || 1;

    // Y-axis: rank 1 is best → visually at the TOP (inverted)
    // We add a small buffer so the line doesn't hug the edges
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);
    const rankPad = Math.max(1, Math.round((maxRank - minRank) * 0.15));
    const yMin = Math.max(1, minRank - rankPad); // best (visually top)
    const yMax = maxRank + rankPad; // worst (visually bottom)
    const yRange = yMax - yMin || 1;

    function toX(ts: number) {
      return PAD_LEFT + ((ts - minDate) / dateRange) * CHART_W;
    }

    // Inverted: rank yMin (best) → PAD_TOP, rank yMax (worst) → PAD_TOP + CHART_H
    function toY(rank: number) {
      return PAD_TOP + ((rank - yMin) / yRange) * CHART_H;
    }

    const points = data.map((d) => ({
      x: toX(new Date(d.date).getTime()),
      y: toY(d.rank),
      rank: d.rank,
      date: d.date,
    }));

    // X-axis labels: up to 5 evenly spaced ticks
    const tickCount = Math.min(data.length, 5);
    const step = Math.floor((data.length - 1) / (tickCount - 1));
    const xLabels = Array.from({ length: tickCount }, (_, i) => {
      const idx = Math.min(i * step, data.length - 1);
      const d = data[idx];
      return {
        x: toX(new Date(d.date).getTime()),
        label: new Date(d.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
      };
    });

    // Y-axis ticks: spread across rank range, 4-5 ticks
    const yTickCount = Math.min(yMax - yMin + 1, 5);
    const yStep = Math.max(1, Math.round(yRange / (yTickCount - 1)));
    const yTickValues: number[] = [];
    for (let r = yMin; r <= yMax; r += yStep) {
      yTickValues.push(r);
    }
    if (yTickValues[yTickValues.length - 1] !== yMax) yTickValues.push(yMax);

    const yTicks = yTickValues.map((r) => ({ y: toY(r), label: `#${r}` }));

    return { points, xLabels, yTicks };
  }, [data]);

  if (points.length < 2) return null;

  // Build SVG polyline path
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Build area fill path (line → bottom-right → bottom-left → close)
  const first = points[0];
  const last = points[points.length - 1];

  // Best rank = lowest rank number; used for gold highlight
  const bestRankValue = Math.min(...points.map((p) => p.rank));
  const bestIdx = points.findIndex((p) => p.rank === bestRankValue);
  const areaPath =
    `M ${first.x},${first.y} ` +
    points
      .slice(1)
      .map((p) => `L ${p.x},${p.y}`)
      .join(" ") +
    ` L ${last.x},${PAD_TOP + CHART_H} L ${first.x},${PAD_TOP + CHART_H} Z`;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      className="w-full h-auto"
      aria-label="Rank progression chart"
      role="img"
    >
      <defs>
        <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Y-axis grid lines + labels */}
      {yTicks.map((t) => (
        <g key={t.label}>
          <line
            x1={PAD_LEFT}
            y1={t.y}
            x2={PAD_LEFT + CHART_W}
            y2={t.y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <text
            x={PAD_LEFT - 6}
            y={t.y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="10"
            fill="#9ca3af"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* X-axis baseline */}
      <line
        x1={PAD_LEFT}
        y1={PAD_TOP + CHART_H}
        x2={PAD_LEFT + CHART_W}
        y2={PAD_TOP + CHART_H}
        stroke="#e5e7eb"
        strokeWidth="1"
      />

      {/* X-axis labels */}
      {xLabels.map((t, i) => (
        <text
          key={i}
          x={t.x}
          y={PAD_TOP + CHART_H + 16}
          textAnchor="middle"
          fontSize="10"
          fill="#9ca3af"
        >
          {t.label}
        </text>
      ))}

      {/* Area fill under the line */}
      <path d={areaPath} fill="url(#rankGrad)" />

      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#22c55e"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points — white rings with tooltip */}
      {points.map((p, i) => {
        const dateLabel = new Date(p.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        });
        return (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#22c55e" strokeWidth="2">
            <title>{dateLabel} — Rank #{p.rank}</title>
          </circle>
        );
      })}

      {/* Gold ring on best-rank point */}
      {bestIdx >= 0 && (
        <circle
          cx={points[bestIdx].x}
          cy={points[bestIdx].y}
          r="7"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
        >
          <title>
            {new Date(points[bestIdx].date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}{" "}
            — Rank #{points[bestIdx].rank} (best)
          </title>
        </circle>
      )}

      {/* Highlight the last (current) point */}
      {points.length > 0 && (
        <circle cx={last.x} cy={last.y} r="5" fill="#22c55e" stroke="white" strokeWidth="2">
          <title>
            {new Date(last.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}{" "}
            — Rank #{last.rank} (current)
          </title>
        </circle>
      )}
    </svg>
  );
}
