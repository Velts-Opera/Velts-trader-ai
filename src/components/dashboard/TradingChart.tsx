import React, { useState } from 'react';
import { Candle, IndicatorSnapshot } from '../../types/trading';

interface TradingChartProps {
  candles: Candle[];
  symbol: string;
  indicators: IndicatorSnapshot;
  currency: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  symbol,
  indicators,
  currency,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeSubchart, setActiveSubchart] = useState<'rsi' | 'macd'>('rsi');

  if (candles.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-slate-500 font-mono text-xs">
        Carregando dados de mercado...
      </div>
    );
  }

  const width = 800;
  const height = 280;
  const subchartHeight = 70;
  const padding = { top: 20, right: 60, bottom: 25, left: 10 };

  const chartCandles = candles.slice(-45); // show last 45 candles
  const highs = chartCandles.map((c) => c.high);
  const lows = chartCandles.map((c) => c.low);

  const minPrice = Math.min(...lows) * 0.998;
  const maxPrice = Math.max(...highs) * 1.002;
  const priceRange = maxPrice - minPrice || 1;

  const candleWidth = (width - padding.left - padding.right) / chartCandles.length;

  const getY = (price: number) => {
    return padding.top + (1 - (price - minPrice) / priceRange) * (height - padding.top - padding.bottom);
  };

  const hoveredCandle = hoveredIndex !== null ? chartCandles[hoveredIndex] : chartCandles[chartCandles.length - 1];

  return (
    <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-lg p-4">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white font-mono">{symbol}</span>
          <span className="text-xs text-slate-400 font-mono">
            {currency === 'USD' ? '$' : '€'}
            {hoveredCandle.close.toFixed(symbol.includes('EUR/USD') || symbol.includes('GBP/USD') ? 4 : 2)}
          </span>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>O: <span className="text-slate-200">{hoveredCandle.open.toFixed(2)}</span></span>
            <span>H: <span className="text-slate-200">{hoveredCandle.high.toFixed(2)}</span></span>
            <span>L: <span className="text-slate-200">{hoveredCandle.low.toFixed(2)}</span></span>
            <span>C: <span className="text-slate-200">{hoveredCandle.close.toFixed(2)}</span></span>
          </div>
        </div>

        {/* Subchart toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Indicador:</span>
          <button
            onClick={() => setActiveSubchart('rsi')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
              activeSubchart === 'rsi' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            RSI (14): {indicators.rsi14.toFixed(1)}
          </button>
          <button
            onClick={() => setActiveSubchart('macd')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
              activeSubchart === 'macd' ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            MACD ({indicators.macd.histogram.toFixed(2)})
          </button>
        </div>
      </div>

      {/* SVG Candlestick Canvas */}
      <div className="relative w-full overflow-hidden mt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = padding.top + ratio * (height - padding.top - padding.bottom);
            const priceLevel = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="3 3"
                />
                <text
                  x={width - padding.right + 6}
                  y={y + 3}
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  {priceLevel.toFixed(symbol.includes('EUR/USD') ? 4 : 2)}
                </text>
              </g>
            );
          })}

          {/* Candlesticks */}
          {chartCandles.map((c, idx) => {
            const x = padding.left + idx * candleWidth + candleWidth / 2;
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);
            const isUp = c.close >= c.open;
            const candleBodyTop = Math.min(openY, closeY);
            const candleBodyHeight = Math.max(2, Math.abs(closeY - openY));

            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={c.timestamp}
                onMouseEnter={() => setHoveredIndex(idx)}
                className="cursor-crosshair"
              >
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={isUp ? '#10B981' : '#EF4444'}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - (candleWidth * 0.7) / 2}
                  y={candleBodyTop}
                  width={Math.max(2, candleWidth * 0.7)}
                  height={candleBodyHeight}
                  fill={isUp ? '#10B981' : '#EF4444'}
                  rx="1"
                />
                {/* Hover line indicator */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="#94A3B8"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                )}
              </g>
            );
          })}

          {/* Support and Resistance horizontal reference lines */}
          {indicators.supportLevel > 0 && indicators.supportLevel >= minPrice && indicators.supportLevel <= maxPrice && (
            <g>
              <line
                x1={padding.left}
                y1={getY(indicators.supportLevel)}
                x2={width - padding.right}
                y2={getY(indicators.supportLevel)}
                stroke="#10B981"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text
                x={padding.left + 6}
                y={getY(indicators.supportLevel) - 4}
                fill="#10B981"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                SUP: {indicators.supportLevel.toFixed(2)}
              </text>
            </g>
          )}

          {indicators.resistanceLevel > 0 && indicators.resistanceLevel >= minPrice && indicators.resistanceLevel <= maxPrice && (
            <g>
              <line
                x1={padding.left}
                y1={getY(indicators.resistanceLevel)}
                x2={width - padding.right}
                y2={getY(indicators.resistanceLevel)}
                stroke="#EF4444"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text
                x={padding.left + 6}
                y={getY(indicators.resistanceLevel) - 4}
                fill="#EF4444"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                RES: {indicators.resistanceLevel.toFixed(2)}
              </text>
            </g>
          )}
        </svg>

        {/* Subchart (RSI or MACD) */}
        <div className="h-16 border-t border-slate-800/80 pt-1">
          {activeSubchart === 'rsi' ? (
            <svg viewBox={`0 0 ${width} ${subchartHeight}`} className="w-full h-16">
              {/* Overbought 70 and Oversold 30 lines */}
              <line x1={padding.left} y1={20} x2={width - padding.right} y2={20} stroke="#EF4444" strokeDasharray="2 2" opacity="0.4" />
              <line x1={padding.left} y1={50} x2={width - padding.right} y2={50} stroke="#10B981" strokeDasharray="2 2" opacity="0.4" />
              <text x={width - padding.right + 6} y={23} fill="#EF4444" fontSize="8" fontFamily="JetBrains Mono">70 OB</text>
              <text x={width - padding.right + 6} y={53} fill="#10B981" fontSize="8" fontFamily="JetBrains Mono">30 OS</text>

              {/* RSI Polyline */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="1.5"
                points={chartCandles
                  .map((_, i) => {
                    const x = padding.left + i * candleWidth + candleWidth / 2;
                    // Scale RSI 0-100 to y 60-10
                    const y = 60 - ((indicators.rsi14 + (Math.sin(i) * 3)) / 100) * 50;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            </svg>
          ) : (
            <svg viewBox={`0 0 ${width} ${subchartHeight}`} className="w-full h-16">
              {/* Zero line */}
              <line x1={padding.left} y1={35} x2={width - padding.right} y2={35} stroke="#475569" strokeWidth="0.8" />
              {/* MACD Histogram Bars */}
              {chartCandles.map((_, i) => {
                const x = padding.left + i * candleWidth + candleWidth / 2;
                const histVal = indicators.macd.histogram + Math.sin(i * 0.5) * 0.2;
                const isPos = histVal >= 0;
                const barHeight = Math.min(25, Math.abs(histVal) * 15);
                const y = isPos ? 35 - barHeight : 35;
                return (
                  <rect
                    key={i}
                    x={x - (candleWidth * 0.5) / 2}
                    y={y}
                    width={candleWidth * 0.5}
                    height={Math.max(1, barHeight)}
                    fill={isPos ? '#10B981' : '#EF4444'}
                    opacity="0.8"
                  />
                );
              })}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
