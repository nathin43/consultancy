import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import './RevenueChart.css';

/**
 * Custom Tooltip Component
 * Displays interactive data when hovering over the chart with smooth animations
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  // Use the same `day` field the X-axis uses — no re-parsing, no drift
  const dayLabel = data.day || label;

  // Parse date as local time (append T00:00:00 to avoid UTC midnight → previous-day shift in IST)
  const dateStr = data.date || '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(dateStr + 'T00:00:00')
    : new Date(dateStr);

  // Readable date (e.g. "04 Mar 2026")
  const formattedDate = dateStr
    ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="revenue-chart-tooltip">
      <div className="revenue-tooltip-header">
        <strong>{dayLabel}</strong>
      </div>
      <div className="revenue-tooltip-row">
        <span className="revenue-tooltip-label">Date:</span>
        <span className="revenue-tooltip-value">{formattedDate}</span>
      </div>
      <div className="revenue-tooltip-row">
        <span className="revenue-tooltip-label">Sales:</span>
        <span className="revenue-tooltip-value">₹{(data.revenue || 0).toLocaleString('en-IN')}</span>
      </div>
      <div className="revenue-tooltip-row">
        <span className="revenue-tooltip-label">Orders:</span>
        <span className="revenue-tooltip-value">{data.orders || 0}</span>
      </div>
    </div>
  );
};

/**
 * Custom Dot Component
 * Renders animated circular markers on data points
 */
const CustomDot = (props) => {
  const { cx, cy, fill, payload, r = 5 } = props;

  // Don't show dot for zero revenue days
  if (payload.revenue === 0 || payload.revenue === null) {
    return null;
  }

  return (
    <g>
      {/* Outer glow */}
      <circle
        cx={cx}
        cy={cy}
        r={r + 4}
        fill={fill}
        fillOpacity="0.1"
        className="revenue-chart-dot-glow"
      />
      
      {/* Main dot */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke="white"
        strokeWidth={2.5}
        className="revenue-chart-dot"
        style={{
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.15))',
        }}
      />
    </g>
  );
};

/**
 * Interactive Revenue Trend Chart
 * Modern analytics visualization with hover interactions
 * Displays sales performance over the last 7 days
 */
const RevenueChart = ({ data = [], loading = false }) => {
  const [hoveredDataIndex, setHoveredDataIndex] = useState(null);

  // Prepare and validate data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item, index) => {
      // Parse as local time to avoid UTC midnight → previous-day shift (e.g. IST = UTC+5:30)
      const itemDate = item.date
        ? (/^\d{4}-\d{2}-\d{2}$/.test(item.date)
            ? new Date(item.date + 'T00:00:00')
            : new Date(item.date))
        : new Date(Date.now() - (data.length - 1 - index) * 24 * 60 * 60 * 1000);

      // Format short weekday (Sat, Sun, Mon …)
      const dayName = itemDate.toLocaleDateString('en-IN', { weekday: 'short' });

      // Keep date as YYYY-MM-DD string so the tooltip can re-parse it as local time
      const dateOnly = item.date
        ? item.date.split('T')[0]
        : itemDate.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD

      return {
        ...item,
        day: item.day || dayName,
        date: dateOnly,
        revenue: parseFloat(item.revenue || item.sales || 0),
        orders: parseInt(item.orders || 0, 10),
      };
    });
  }, [data]);

  // Check if any revenue exists
  const hasRevenue = chartData.some((d) => d.revenue > 0);

  // Calculate Y-axis maximum (round up to nearest 5000)
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue || 0), 5000);
  const yAxisMax = Math.ceil(maxRevenue / 5000) * 5000;

  // Loading state
  if (loading) {
    return (
      <div className="revenue-chart-skeleton">
        <div className="revenue-chart-skeleton-bar" style={{ height: '260px' }} />
      </div>
    );
  }

  // Empty state
  if (!hasRevenue || chartData.length === 0) {
    return (
      <div className="revenue-chart-empty">
        <svg
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          width="48"
          height="48"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <p>No revenue data available</p>
        <small>Complete delivered orders to see the sales trend</small>
      </div>
    );
  }

  return (
    <div className="revenue-chart-container">
      {/* Responsive Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          onMouseMove={(state) => {
            if (state && state.activeTooltipIndex !== undefined) {
              setHoveredDataIndex(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setHoveredDataIndex(null)}
        >
          {/* Gradients and Filters */}
          <defs>
            {/* Main gradient fill */}
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#2563eb" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>

            {/* Hover gradient - more opaque */}
            <linearGradient id="revenueGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} />
              <stop offset="50%" stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
            </linearGradient>

            {/* Shadow filter */}
            <filter id="revenueLineShadow">
              <feDropShadow
                dx="0"
                dy="3"
                stdDeviation="4"
                floodOpacity="0.2"
              />
            </filter>
          </defs>

          {/* Grid */}
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb" 
            vertical={false}
            opacity={0.6}
          />

          {/* X Axis - Day labels */}
          <XAxis
            dataKey="day"
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            style={{ textAnchor: 'middle' }}
          />

          {/* Y Axis - Revenue in thousands */}
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            domain={[0, yAxisMax]}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            width={50}
          />

          {/* Interactive Tooltip */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              fill: 'rgba(37, 99, 235, 0.08)',
              radius: 8,
            }}
            contentStyle={{ outline: 'none' }}
          />

          {/* Area with gradient */}
          <Area
            type="monotone"
            dataKey="revenue"
            fill="url(#revenueGradient)"
            stroke="none"
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-in-out"
          />

          {/* Line with animation */}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            strokeWidth={3.5}
            dot={<CustomDot fill="#2563eb" r={5} />}
            activeDot={{
              r: 8,
              fill: '#1d4ed8',
              stroke: 'white',
              strokeWidth: 3,
              filter: 'drop-shadow(0 4px 12px rgba(37, 99, 235, 0.4))',
            }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-in-out"
            filter="url(#revenueLineShadow)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Info Badge */}
      <div className="revenue-chart-info">
        <div className="revenue-info-badge">
          <span className="revenue-info-dot" />
          Last 7 days performance
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
