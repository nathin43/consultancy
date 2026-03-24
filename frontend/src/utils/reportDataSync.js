import { getRangeDates } from './reportRange';

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolveItemDate = (item, dateField) => {
  if (typeof dateField === 'function') {
    return toDate(dateField(item));
  }

  if (Array.isArray(dateField)) {
    for (let i = 0; i < dateField.length; i += 1) {
      const field = dateField[i];
      const date = toDate(item?.[field]);
      if (date) return date;
    }
    return null;
  }

  return toDate(item?.[dateField]);
};

export const filterByDateRange = (
  allData = [],
  selectedRange = 'monthly',
  dateField = 'createdAt',
  dateFrom,
  dateTo
) => {
  const fallbackRange = getRangeDates(selectedRange);
  const fromDate = toDate(dateFrom) || fallbackRange.from;
  const toDateValue = toDate(dateTo) || fallbackRange.to;

  return allData.filter((item) => {
    const itemDate = resolveItemDate(item, dateField);
    if (!itemDate) return false;
    return itemDate >= fromDate && itemDate <= toDateValue;
  });
};

export const emitReportDataChanged = (detail = {}) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('report:data-changed', {
      detail: {
        ...detail,
        updatedAt: Date.now(),
      },
    })
  );
};
