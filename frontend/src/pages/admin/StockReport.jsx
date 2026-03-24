import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import useAdminLoader from '../../hooks/useAdminLoader';
import useToast from '../../hooks/useToast';
import api from '../../services/api';
import './ReportStyles.css';
import { addShopHeader, addPageNumbers, loadUnicodeFonts, pdfRupee } from '../../utils/pdfUtils';
import {
  REPORT_RANGE_OPTIONS,
  getRangeTitle,
  getRangeDates,
  shiftRangeAnchor,
  getRangePeriodLabel,
  formatDateInput,
  formatDateLabel,
} from '../../utils/reportRange';
import {
  getTimelinePoints,
  mapSeriesToTimeline,
  bucketKeyForDate,
  buildZeroSeriesForRange,
} from '../../utils/reportChartTimeline';
import ModernReportChart from '../../components/admin/ModernReportChart';
import useReportAutoRefresh from '../../hooks/useReportAutoRefresh';
import { filterByDateRange } from '../../utils/reportDataSync';

const StockReport = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const { loading, run } = useAdminLoader();
  const [exporting, setExporting] = useState(false);
  const [allStockData, setAllStockData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('monthly');
  const [periodAnchor, setPeriodAnchor] = useState(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [comparison, setComparison] = useState(null);
  const [dateRangeLabel, setDateRangeLabel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const initialRange = getRangeDates('monthly');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    stockStatus: '',
    dateFrom: formatDateInput(initialRange.from),
    dateTo: formatDateInput(initialRange.to),
  });
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const chartRef = useRef(null);
  const stockMovementData = useMemo(() => {
    const timeline = getTimelinePoints(selectedRange, filters.dateFrom, filters.dateTo);
    const closingSeries = mapSeriesToTimeline(timeline, stockData, {
      getBucketKey: (item) => bucketKeyForDate(item.updatedAt || item.createdAt, selectedRange),
      getValue: (item) => Number(item.stock || 0),
    });

    if (closingSeries.length > 0) {
      return closingSeries.map((point, index) => {
        const previous = index === 0 ? 0 : Number(closingSeries[index - 1].value || 0);
        const current = Number(point.value || 0);
        const delta = current - previous;

        return {
          name: point.label,
          openingStock: previous,
          addedStock: delta > 0 ? delta : 0,
          soldStock: delta < 0 ? Math.abs(delta) : 0,
          closingStock: current,
        };
      });
    }

    return buildZeroSeriesForRange(selectedRange, filters.dateFrom, filters.dateTo, 7).map((point) => ({
      name: point.label,
      openingStock: 0,
      addedStock: 0,
      soldStock: 0,
      closingStock: 0,
    }));
  }, [stockData, selectedRange, filters.dateFrom, filters.dateTo]);

  const stockStatusChartData = useMemo(
    () => [
      { name: 'In Stock', value: analytics.inStock },
      { name: 'Low Stock', value: analytics.lowStock },
      { name: 'Out of Stock', value: analytics.outOfStock },
    ],
    [analytics]
  );

  const productWiseStockData = useMemo(
    () => {
      const ranked = [...stockData]
        .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
        .slice(0, 8)
        .map((item) => ({
          name: item.name || 'Product',
          stock: Number(item.stock || 0),
        }));

      if (ranked.length > 0) return ranked;

      return Array.from({ length: 5 }, (_, index) => ({
        name: `P${index + 1}`,
        stock: 0,
      }));
    },
    [stockData]
  );

  const lowStockAlertData = useMemo(() => {
    const alerts = [...stockData]
      .filter((item) => Number(item.stock || 0) <= 10)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
      .slice(0, 8)
      .map((item) => ({
        name: item.name || 'Product',
        stock: Number(item.stock || 0),
      }));

    if (alerts.length > 0) return alerts;

    return Array.from({ length: 5 }, (_, index) => ({
      name: `L${index + 1}`,
      stock: 0,
    }));
  }, [stockData]);

  useEffect(() => {
    let mounted = true;
    run(async () => {
      await fetchStockData(selectedRange, filters);
    }).finally(() => {
      if (mounted) setIsInitialLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const fetchStockData = async (rangeOverride = selectedRange, filtersOverride = null) => {
    const activeFilters = filtersOverride || filters;
    // loading managed by useAdminLoader's run()
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams();
      if (activeFilters.search) params.append('search', activeFilters.search);
      if (activeFilters.category) params.append('category', activeFilters.category);
      if (activeFilters.brand) params.append('brand', activeFilters.brand);
      if (activeFilters.stockStatus) params.append('stockStatus', activeFilters.stockStatus);
      if (activeFilters.dateFrom) params.append('dateFrom', activeFilters.dateFrom);
      if (activeFilters.dateTo) params.append('dateTo', activeFilters.dateTo);
      params.append('range', rangeOverride);

      const queryString = params.toString();
      const endpoint = queryString ? `/admin/reports/stock?${queryString}` : '/admin/reports/stock';

      console.log('📦 Fetching stock report from:', endpoint);
      const response = await api.get(endpoint);
      
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      if (response.data.success) {
        const reportData = response.data.data || [];
        const summary = response.data.summary || {};

        setAllStockData(reportData);
        setComparison(summary.comparison || null);
        if (summary.dateRange?.from && summary.dateRange?.to) {
          setDateRangeLabel(`${formatDateLabel(summary.dateRange.from)} - ${formatDateLabel(summary.dateRange.to)}`);
        } else {
          setDateRangeLabel('');
        }
        
        console.log(`✅ Successfully fetched ${reportData.length} products`);
        console.log('📈 Summary:', summary);
      }
    } catch (err) {
      console.error('❌ Stock Report Error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        endpoint: '/admin/reports/stock'
      });
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        error('Authentication failed. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin/login');
      } else if (err.response?.status === 500) {
        error('Server error. Please try again later.');
      } else {
        error(err.response?.data?.message || 'Failed to fetch stock data');
      }
    } finally {
      // loading managed by run()
    }
  };

  useEffect(() => {
    const hasDateMeta = allStockData.some((item) => item?.createdAt || item?.updatedAt);
    const filtered = hasDateMeta
      ? filterByDateRange(
          allStockData,
          selectedRange,
          ['updatedAt', 'createdAt'],
          filters.dateFrom,
          filters.dateTo
        )
      : allStockData;

    setStockData(filtered);

    const totals = filtered.reduce(
      (acc, item) => {
        const stock = Number(item.stock || 0);
        acc.totalProducts += 1;
        if (stock <= 0) {
          acc.outOfStock += 1;
        } else if (stock <= 10) {
          acc.lowStock += 1;
        } else {
          acc.inStock += 1;
        }
        return acc;
      },
      {
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
      }
    );

    setAnalytics({
      totalProducts: totals.totalProducts,
      inStock: totals.inStock,
      lowStock: totals.lowStock,
      outOfStock: totals.outOfStock,
    });

  }, [allStockData, selectedRange, filters.dateFrom, filters.dateTo]);

  useReportAutoRefresh(
    () => fetchStockData(selectedRange, filters),
    { intervalMs: 10000 }
  );

  const handleRangeChange = async (range) => {
    if (range === selectedRange) return;
    const nextAnchor = new Date();
    const next = getRangeDates(range, nextAnchor);
    const nextFilters = {
      ...filters,
      dateFrom: formatDateInput(next.from),
      dateTo: formatDateInput(next.to),
    };
    setPeriodAnchor(nextAnchor);
    setSelectedRange(range);
    setFilters(nextFilters);
    await fetchStockData(range, nextFilters);
  };

  const handleShiftPeriod = async (direction) => {
    const nextAnchor = shiftRangeAnchor(selectedRange, periodAnchor, direction);
    const next = getRangeDates(selectedRange, nextAnchor);
    const nextFilters = {
      ...filters,
      dateFrom: formatDateInput(next.from),
      dateTo: formatDateInput(next.to),
    };

    setPeriodAnchor(nextAnchor);
    setFilters(nextFilters);
    await fetchStockData(selectedRange, nextFilters);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = async () => {
    await fetchStockData(selectedRange, filters);
  };

  const handleClearFilters = () => {
    const currentRange = getRangeDates(selectedRange);
    setFilters({
      search: '',
      category: '',
      brand: '',
      stockStatus: '',
      dateFrom: formatDateInput(currentRange.from),
      dateTo: formatDateInput(currentRange.to),
    });
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Load Unicode font for ₹ symbol
      const PDF_FONT = await loadUnicodeFonts(doc);
      const exportTitle = `${getRangeTitle(selectedRange)} Stock Report`;
      const exportRangeLabel =
        dateRangeLabel || `${formatDateLabel(filters.dateFrom)} - ${formatDateLabel(filters.dateTo)}`;

      let yPos = addShopHeader(doc, 'STOCK REPORT', [16, 185, 129]);

      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(exportTitle, 14, yPos);
      yPos += 5;
      if (exportRangeLabel) {
        doc.setFont(PDF_FONT, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Range: ${exportRangeLabel}`, 14, yPos);
        yPos += 5;
      }

      // Reset text style for content
      doc.setFont(PDF_FONT, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      
      if (filters.search || filters.category || filters.brand || filters.stockStatus) {
        doc.text('Filters Applied:', 14, yPos);
        yPos += 5;
        if (filters.search) doc.text(`  • Search: ${filters.search}`, 14, yPos), yPos += 5;
        if (filters.category) doc.text(`  • Category: ${filters.category}`, 14, yPos), yPos += 5;
        if (filters.brand) doc.text(`  • Brand: ${filters.brand}`, 14, yPos), yPos += 5;
        if (filters.stockStatus) doc.text(`  • Status: ${filters.stockStatus}`, 14, yPos), yPos += 5;
        yPos += 5;
      }

      doc.text(`Selected Range: ${getRangeTitle(selectedRange)}`, 14, yPos);
      yPos += 6;
      
      // Analytics Summary
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text('Inventory Summary', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      doc.setFontSize(10);
      const summaryData = [
        ['Total Products', analytics.totalProducts.toString()],
        ['In Stock', analytics.inStock.toString()],
        ['Low Stock', analytics.lowStock.toString()],
        ['Out of Stock', analytics.outOfStock.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { font: PDF_FONT },
        margin: { left: 14, right: 14 }
      });
      
      yPos = doc.lastAutoTable.finalY + 10;

      if (chartRef.current) {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');
        const chartWidth = pageWidth - 28;
        const chartHeight = Math.min((canvas.height * chartWidth) / canvas.width, 80);

        if (yPos + chartHeight + 14 > doc.internal.pageSize.getHeight()) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont(PDF_FONT, 'bold');
        doc.setFontSize(12);
        doc.setTextColor(16, 185, 129);
        doc.text('Stock Charts', 14, yPos);
        yPos += 6;

        doc.addImage(imgData, 'PNG', 14, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 8;
      }
      
      // Detailed Stock Data
      doc.setFont(PDF_FONT, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text('Detailed Stock Data', 14, yPos);
      doc.setFont(PDF_FONT, 'normal');
      doc.setTextColor(60, 60, 60);
      yPos += 8;
      
      const tableData = stockData.map(product => [
        product.name,
        product.category || 'N/A',
        pdfRupee(product.price),
        product.stock.toString(),
        pdfRupee(product.stockValue || (product.price * product.stock) || 0),
        product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock',
        product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'
      ]);

      if (tableData.length === 0) {
        tableData.push(['No records for selected filter', '—', pdfRupee(0), '0', pdfRupee(0), '—', '—']);
      }
      
      autoTable(doc, {
        startY: yPos,
        head: [['Product Name', 'Category', 'Price', 'Stock Qty', 'Stock Value', 'Status', 'Date Added']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { font: PDF_FONT, fontSize: 9 },
        margin: { left: 14, right: 14 }
      });
      
      // Save PDF
      addPageNumbers(doc, [16, 185, 129]);
      const fileName = `stock-report-${selectedRange}.pdf`;
      doc.save(fileName);
      
      success('Stock report exported as PDF successfully');
    } catch (err) {
      error('Failed to export PDF');
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const getStockStatus = (stock) => {
    if (stock > 10) return { status: 'In Stock', class: 'in-stock' };
    if (stock > 0) return { status: 'Low Stock', class: 'low-stock' };
    return { status: 'Out of Stock', class: 'out-of-stock' };
  };

  if (loading && isInitialLoading) {
    return (
      <AdminLayout>
        <DashboardSkeleton title="Loading Stock Report" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-report-page">
        {/* Header */}
        <div className="report-page-header">
          <button className="btn-back" onClick={() => navigate('/admin/reports')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Reports
          </button>
          <div className="header-content">
            <div className="header-left">
              <div className="header-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                📦
              </div>
              <div>
                <h1>Stock Report</h1>
                <p className="subtitle">Monitor inventory levels and stock movements</p>
                {comparison && (
                  <span className={`report-comparison-chip ${comparison.isUp ? 'up' : 'down'}`}>
                    {comparison.isUp ? '↑' : '↓'} {Math.abs(comparison.growthPercent || 0).toFixed(1)}% vs previous period
                  </span>
                )}
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-toggle-filters" onClick={() => setShowFilters(!showFilters)}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4h14M5 9h8M7 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button className="btn-export" onClick={handleExportPDF} disabled={exporting}>
                {exporting ? 'Generating PDF...' : 'Export PDF'}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 9v2a2 2 0 01-2 2H3a2 2 0 01-2-2V9M7 10V2M4 5l3-3 3 3"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="report-controls">
            <div className="report-period-nav">
              <button type="button" className="period-nav-btn" onClick={() => handleShiftPeriod(-1)}>
                ← Prev
              </button>
              <span className="period-nav-current">{getRangePeriodLabel(selectedRange, periodAnchor)}</span>
              <button type="button" className="period-nav-btn" onClick={() => handleShiftPeriod(1)}>
                Next →
              </button>
            </div>
            <div className="report-range-group">
              {REPORT_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`report-range-btn ${selectedRange === opt.value ? 'is-active' : ''}`}
                  onClick={() => handleRangeChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="report-chart-panel" ref={chartRef}>
          <div className="report-chart-header">
            <h3 className="report-chart-title">Stock Dashboard</h3>
            {comparison && (
              <span className={`report-comparison-chip ${comparison.isUp ? 'up' : 'down'}`}>
                {comparison.isUp ? '↑' : '↓'} {Math.abs(comparison.growthPercent || 0).toFixed(1)}%
              </span>
            )}
          </div>

          <div className="report-chart-grid two-col">
            <ModernReportChart
              type="bar"
              data={stockMovementData}
              xKey="name"
              valueKey="closingStock"
              title="Stock Movement"
              description="Opening, added, sold and closing stock over selected period"
              colors={['#16a34a', '#4ade80', '#f59e0b', '#2563eb']}
              seriesLabel="Stock"
              valueSuffix=" units"
              animationDuration={900}
              showPeakLow={false}
              barSeries={[
                { key: 'openingStock', label: 'Opening', color: '#16a34a' },
                { key: 'addedStock', label: 'Added', color: '#4ade80' },
                { key: 'soldStock', label: 'Sold', color: '#f59e0b' },
                { key: 'closingStock', label: 'Closing', color: '#2563eb' },
              ]}
            />
            <ModernReportChart
              type="pie"
              data={stockStatusChartData}
              xKey="name"
              valueKey="value"
              title="Stock Status"
              description="Current product distribution by stock level"
              colors={['#16a34a', '#f59e0b', '#ef4444']}
              seriesLabel="Products"
              animationDuration={900}
            />
            <ModernReportChart
              type="bar"
              data={productWiseStockData}
              xKey="name"
              valueKey="stock"
              title="Product-wise Stock"
              description="Top products by available stock"
              colors={['#16a34a', '#22c55e']}
              seriesLabel="Stock"
              valueSuffix=" units"
              showPeakLow={false}
              animationDuration={900}
            />
            <ModernReportChart
              type="bar"
              data={lowStockAlertData}
              xKey="name"
              valueKey="stock"
              title="Low Stock Alerts"
              description="Products at or below alert threshold"
              colors={['#ef4444', '#f87171']}
              seriesLabel="Stock"
              valueSuffix=" units"
              showPeakLow={false}
              animationDuration={900}
            />
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="analytics-summary">
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              📦
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Total Products</p>
              <h3 className="analytics-value">{analytics.totalProducts}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              ✅
            </div>
            <div className="analytics-content">
              <p className="analytics-label">In Stock</p>
              <h3 className="analytics-value">{analytics.inStock}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              ⚠️
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Low Stock</p>
              <h3 className="analytics-value">{analytics.lowStock}</h3>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-icon" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
              ⛔
            </div>
            <div className="analytics-content">
              <p className="analytics-label">Out of Stock</p>
              <h3 className="analytics-value">{analytics.outOfStock}</h3>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-item">
                <label>Search Product</label>
                <input 
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Product name..."
                />
              </div>
              <div className="filter-item">
                <label>Category</label>
                <input 
                  type="text"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  placeholder="Category..."
                />
              </div>
              <div className="filter-item">
                <label>Brand</label>
                <input 
                  type="text"
                  name="brand"
                  value={filters.brand}
                  onChange={handleFilterChange}
                  placeholder="Brand..."
                />
              </div>
              <div className="filter-item">
                <label>Date From</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-item">
                <label>Date To</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="filter-actions">
              <button className="btn-apply" onClick={handleApplyFilters}>Apply Filters</button>
              <button className="btn-clear" onClick={handleClearFilters}>Clear All</button>
            </div>
          </div>
        )}

        {/* Stock Data Table */}
        <div className="report-table-container">
          <div className="table-info">
            <p>Showing {stockData.length} products</p>
          </div>

          {stockData.length > 0 ? (
            <div className="table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{product.brand}</td>
                        <td className="amount">{formatCurrency(product.price)}</td>
                        <td className="text-center" style={{ fontWeight: 600 }}>{product.stock}</td>
                        <td>
                          <span className={`status-badge ${stockStatus.class}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" fill="#f3f4f6"/>
                <path d="M32 20v16M32 44h.01" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <h3>No stock data found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default StockReport;
