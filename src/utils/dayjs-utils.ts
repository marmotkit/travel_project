import dayjs, { Dayjs } from 'dayjs';

/**
 * 找出一組日期中的最早日期
 * @param dates Dayjs 日期陣列
 * @returns 最早的日期
 */
export function findMinDate(dates: Dayjs[]): Dayjs | null {
  if (!dates || dates.length === 0) return null;
  
  let minDate = dates[0];
  for (let i = 1; i < dates.length; i++) {
    if (dates[i].isBefore(minDate)) {
      minDate = dates[i];
    }
  }
  return minDate;
}

/**
 * 找出一組日期中的最晚日期
 * @param dates Dayjs 日期陣列
 * @returns 最晚的日期
 */
export function findMaxDate(dates: Dayjs[]): Dayjs | null {
  if (!dates || dates.length === 0) return null;
  
  let maxDate = dates[0];
  for (let i = 1; i < dates.length; i++) {
    if (dates[i].isAfter(maxDate)) {
      maxDate = dates[i];
    }
  }
  return maxDate;
}

/**
 * 格式化金額顯示，加上千分位逗號
 * @param value 金額
 * @returns 格式化後的金額字串
 */
export function formatCurrency(value: number | string | undefined): string {
  if (value === undefined || value === null) return '';
  return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 解析金額字串，移除千分位逗號
 * @param value 格式化的金額字串
 * @returns 數字格式的金額
 */
export function parseCurrency(value: string | undefined): any {
  if (value === undefined || value === null) return 0;
  const parsedValue = value.replace(/\$\s?|(,*)/g, '');
  return parsedValue === '' ? 0 : Number(parsedValue);
}

/**
 * 取得當前日期時間
 * @returns 當前的 dayjs 日期時間
 */
export function getCurrentDateTime(): Dayjs {
  return dayjs();
} 