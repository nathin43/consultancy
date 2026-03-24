import React, { useId, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts';
import ReportChartTooltip from './ReportChartTooltip';

const baseGridProps = {
  strokeDasharray: '3 3',
  stroke: '#eeeeee',
  vertical: false,
};

const chartTheme = {
  axisTick: { fontSize: 12, fill: '#64748b' },
  axisTickMuted: { fontSize: 11, fill: '#64748b' },
  axisPadding: { left: 8, right: 8 },
  barRadius: 8,
};

const toValue = (value) => Number(value || 0);

const getPeakAndLow = (data, valueKey) => {
  if (!data || data.length === 0) {
    return { peak: null, low: null };
  }

  return data.reduce(
    (acc, item) => {
      const value = toValue(item[valueKey]);
      if (!acc.peak || value > toValue(acc.peak[valueKey])) {
        acc.peak = item;
      }
      if (!acc.low || value < toValue(acc.low[valueKey])) {
        acc.low = item;
      }
      return acc;
    },
    { peak: null, low: null }
  );
};

const formatPieLabel = ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`;

const getXAxisConfig = (length) => {
  if (length <= 12) {
    return { interval: 0, minTickGap: 0 };
  }
  return { interval: 'preserveStartEnd', minTickGap: 16 };
};

const hasMeaningfulValue = (data, valueKey, barSeries) => {
  if (!Array.isArray(data) || data.length === 0) return false;

  if (Array.isArray(barSeries) && barSeries.length > 0) {
    return data.some((point) =>
      barSeries.some((series) => Number(point?.[series.key] || 0) > 0)
    );
  }

  return data.some((point) => Number(point?.[valueKey] || 0) > 0);
};

const ModernReportChart = ({
  type = 'line',
  data = [],
  xKey = 'label',
  valueKey = 'value',
  title,
  description,
  colors = ['#2563eb', '#1d4ed8'],
  seriesLabel,
  valuePrefix = '',
  valueSuffix = '',
  animationDuration = 800,
  showArea = false,
  horizontal = false,
  showPeakLow = true,
  pulseLow = false,
  barSeries = null,
  noActivityText = 'No activity in this period',
  showNoActivityOverlay = true,
  className = '',
}) => {
  const gradientId = useId().replace(/:/g, '');
  const { peak, low } = useMemo(() => getPeakAndLow(data, valueKey), [data, valueKey]);
  const xAxisConfig = useMemo(() => getXAxisConfig(data.length), [data.length]);
  const hasDataActivity = useMemo(
    () => hasMeaningfulValue(data, valueKey, barSeries),
    [data, valueKey, barSeries]
  );
  const legendItems = useMemo(() => {
    if (type === 'pie') {
      return [];
    }

    if (Array.isArray(barSeries) && barSeries.length > 0) {
      return barSeries.map((series, index) => ({
        label: series.label || series.key,
        color: series.color || colors[index % colors.length],
      }));
    }

    return [
      {
        label: seriesLabel || 'Value',
        color: colors[0],
      },
    ];
  }, [type, barSeries, colors, seriesLabel]);

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 16, right: 18, left: 6, bottom: 24 }}>
        <defs>
          <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[0]} stopOpacity={0.28} />
            <stop offset="100%" stopColor={colors[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...baseGridProps} />
        <XAxis
          dataKey={xKey}
          tick={chartTheme.axisTick}
          tickMargin={10}
          interval={xAxisConfig.interval}
          axisLine={false}
          tickLine={false}
          minTickGap={xAxisConfig.minTickGap}
          padding={chartTheme.axisPadding}
        />
        <YAxis
          width={64}
          tick={chartTheme.axisTick}
          tickMargin={10}
          axisLine={false}
          tickLine={false}
          domain={[0, (max) => (max > 0 ? max : 1)]}
          allowDecimals={false}
        />
        <Tooltip content={<ReportChartTooltip seriesLabel={seriesLabel} valuePrefix={valuePrefix} />} />
        {showArea && <Area type="monotone" dataKey={valueKey} stroke="none" fill={`url(#${gradientId}-line)`} animationDuration={animationDuration} />}
        <Line
          type="monotone"
          dataKey={valueKey}
          stroke={colors[0]}
          strokeWidth={3.5}
          dot={{ r: 4, fill: colors[0], stroke: '#ffffff', strokeWidth: 1.5 }}
          activeDot={{ r: 7, fill: colors[0], stroke: '#ffffff', strokeWidth: 2.5 }}
          animationDuration={animationDuration}
          animationEasing="easeInOutQuart"
        />
        {showPeakLow && peak && (
          <ReferenceDot
            x={peak[xKey]}
            y={toValue(peak[valueKey])}
            r={6}
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth={2}
            label={{ value: 'Peak', position: 'top', fontSize: 11, fill: '#0f172a' }}
          />
        )}
        {showPeakLow && low && (
          <ReferenceDot
            x={low[xKey]}
            y={toValue(low[valueKey])}
            r={5}
            fill="#64748b"
            stroke="#ffffff"
            strokeWidth={2}
            label={{ value: 'Low', position: 'bottom', fontSize: 11, fill: '#475569' }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => {
    const isHorizontal = horizontal;
    const hasGroupedBars = Array.isArray(barSeries) && barSeries.length > 0;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 16, right: 18, left: isHorizontal ? 10 : 6, bottom: 24 }}
          barCategoryGap={data.length > 12 ? '18%' : '26%'}
        >
          <defs>
            <linearGradient id={`${gradientId}-bar`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[0]} stopOpacity={0.95} />
              <stop offset="100%" stopColor={colors[1] || colors[0]} stopOpacity={0.72} />
            </linearGradient>
          </defs>
          <CartesianGrid {...baseGridProps} />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tick={chartTheme.axisTick}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
                domain={[0, (max) => (max > 0 ? max : 1)]}
                allowDecimals={false}
              />
              <YAxis type="category" dataKey={xKey} tick={chartTheme.axisTickMuted} axisLine={false} tickLine={false} width={90} />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                tick={chartTheme.axisTick}
                tickMargin={10}
                interval={xAxisConfig.interval}
                axisLine={false}
                tickLine={false}
                minTickGap={xAxisConfig.minTickGap}
                padding={chartTheme.axisPadding}
              />
              <YAxis
                width={64}
                tick={chartTheme.axisTick}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
                domain={[0, (max) => (max > 0 ? max : 1)]}
                allowDecimals={false}
              />
            </>
          )}
          <Tooltip content={<ReportChartTooltip seriesLabel={seriesLabel} valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
          {hasGroupedBars ? (
            barSeries.map((series, index) => (
              <Bar
                key={series.key || index}
                dataKey={series.key}
                name={series.label || series.key}
                fill={series.color || colors[index % colors.length]}
                radius={isHorizontal ? [0, chartTheme.barRadius, chartTheme.barRadius, 0] : [chartTheme.barRadius, chartTheme.barRadius, 0, 0]}
                animationDuration={animationDuration}
                animationEasing="ease-out"
                className="modern-chart-bar"
              />
            ))
          ) : (
            <Bar
              dataKey={valueKey}
              fill={`url(#${gradientId}-bar)`}
              radius={isHorizontal ? [0, chartTheme.barRadius, chartTheme.barRadius, 0] : [chartTheme.barRadius, chartTheme.barRadius, 0, 0]}
              animationDuration={animationDuration}
              animationEasing="ease-out"
              activeBar={{ stroke: colors[0], strokeWidth: 2 }}
              className="modern-chart-bar"
            >
              {pulseLow &&
                data.map((entry, index) => {
                  const value = toValue(entry[valueKey]);
                  const fill = value <= 0 ? '#ef4444' : value <= 10 ? '#f59e0b' : '#22c55e';
                  const className = value > 0 && value <= 10 ? 'chart-cell-pulse' : '';
                  return <Cell key={`cell-${index}`} fill={fill} className={className} />;
                })}
            </Bar>
          )}
          {!hasGroupedBars && showPeakLow && peak && (
            <ReferenceDot
              x={isHorizontal ? toValue(peak[valueKey]) : peak[xKey]}
              y={isHorizontal ? peak[xKey] : toValue(peak[valueKey])}
              r={5}
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth={2}
              label={{ value: 'Peak', position: 'top', fontSize: 11, fill: '#0f172a' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip content={<ReportChartTooltip seriesLabel={seriesLabel} valuePrefix={valuePrefix} />} />
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={xKey}
          cx="50%"
          cy="50%"
          outerRadius={95}
          innerRadius={42}
          paddingAngle={4}
          label={formatPieLabel}
          labelLine={false}
          animationDuration={animationDuration}
          animationBegin={120}
        >
          {data.map((entry, index) => (
            <Cell key={`${entry[xKey]}-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className={`report-chart-item modern-chart-card ${className}`}>
      <h4 className="report-chart-subtitle">{title}</h4>
      {description && <p className="report-chart-description">{description}</p>}
      <div className="report-chart-wrap chart-wrapper compact">
        {type === 'bar' && renderBarChart()}
        {type === 'pie' && renderPieChart()}
        {type === 'line' && renderLineChart()}

        {showNoActivityOverlay && (type === 'line' || type === 'bar') && !hasDataActivity && (
          <div className="report-chart-overlay">
            <span className="report-chart-overlay__text">{noActivityText}</span>
          </div>
        )}
      </div>

      {legendItems.length > 0 && (
        <div className="report-legend-row" aria-hidden="true">
          {legendItems.map((item, index) => (
            <span key={`${item.label}-${index}`} className="report-legend-item">
              <span className="report-legend-dot" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(ModernReportChart);
