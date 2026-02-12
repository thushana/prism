import type { BarDatum } from "@nivo/bar";
import type { LineSeries } from "@nivo/line";

/**
 * Options for transforming data to bar chart format.
 */
export interface TransformToBarDataOptions {
  /**
   * Field name to use as the index/category.
   */
  indexBy: string;
  /**
   * Field names to use as values (keys).
   */
  keys: string[];
  /**
   * Optional function to transform each data item before conversion.
   */
  transform?: (item: any) => any;
}

/**
 * Transform app data to Nivo bar chart format.
 *
 * Converts application data structures to Nivo's BarDatum format, eliminating
 * the need to manually reshape data arrays.
 */
export function transformToBarData<T extends Record<string, any>>(
  data: T[],
  options: TransformToBarDataOptions
): BarDatum[] {
  const { indexBy, keys, transform } = options;

  return data.map((item) => {
    const transformed = transform ? transform(item) : item;
    const result: BarDatum = {
      [indexBy]: transformed[indexBy],
    };

    keys.forEach((key) => {
      result[key] = transformed[key] ?? 0;
    });

    return result;
  });
}

/**
 * Options for transforming data to line chart format.
 */
export interface TransformToLineDataOptions {
  /**
   * Field name to use as the x-axis value.
   */
  xField: string;
  /**
   * Field name(s) to use as the y-axis value(s).
   * If multiple, creates multiple series.
   */
  yFields: string | string[];
  /**
   * Optional function to format x values.
   */
  formatX?: (value: any) => string | number;
  /**
   * Optional function to format y values.
   */
  formatY?: (value: any) => number;
  /**
   * Optional function to transform each data item before conversion.
   */
  transform?: (item: any) => any;
  /**
   * Optional series IDs (if not provided, uses yField names).
   */
  seriesIds?: string[];
}

/**
 * Transform app data to Nivo line chart format.
 *
 * Converts application data structures to Nivo's LineSeries format. Supports
 * multiple series by providing multiple yFields.
 */
export function transformToLineData<T extends Record<string, any>>(
  data: T[],
  options: TransformToLineDataOptions
): LineSeries[] {
  const { xField, yFields, formatX, formatY, transform, seriesIds } = options;

  const yFieldArray = Array.isArray(yFields) ? yFields : [yFields];
  const ids = seriesIds || yFieldArray;

  return ids.map((id, index) => {
    const yField = yFieldArray[index];
    const points = data.map((item) => {
      const transformed = transform ? transform(item) : item;
      const x = formatX ? formatX(transformed[xField]) : transformed[xField];
      const y = formatY
        ? formatY(transformed[yField])
        : Number(transformed[yField]) || 0;

      return {
        x,
        y,
      };
    });

    return {
      id,
      data: points,
    };
  });
}

/**
 * Options for formatting time series data.
 */
export interface FormatTimeSeriesOptions {
  /**
   * Field name containing the date/timestamp.
   */
  dateField: string;
  /**
   * Field name(s) containing the value(s).
   */
  valueFields: string | string[];
  /**
   * Optional function to parse the date.
   * Defaults to `new Date(value)`.
   */
  parseDate?: (value: any) => Date;
  /**
   * Optional function to format the date for display.
   * Defaults to ISO date string (YYYY-MM-DD).
   */
  formatDate?: (date: Date) => string | number;
  /**
   * Optional function to format values.
   * Defaults to `Number(value) || 0`.
   */
  formatValue?: (value: any) => number;
  /**
   * Optional series IDs (if not provided, uses valueField names).
   */
  seriesIds?: string[];
}

/**
 * Format time series data for line charts.
 *
 * Convenience wrapper around transformToLineData with date parsing and
 * formatting. Handles common time series data structures automatically.
 */
export function formatTimeSeries<T extends Record<string, any>>(
  data: T[],
  options: FormatTimeSeriesOptions
): LineSeries[] {
  const {
    dateField,
    valueFields,
    parseDate,
    formatDate,
    formatValue,
    seriesIds,
  } = options;

  const parseDateFn = parseDate || ((val) => new Date(val));
  const formatDateFn =
    formatDate || ((date) => date.toISOString().split("T")[0]);
  const formatValueFn = formatValue || ((val) => Number(val) || 0);

  return transformToLineData(data, {
    xField: dateField,
    yFields: valueFields,
    formatX: (value) => {
      const date = parseDateFn(value);
      return formatDateFn(date);
    },
    formatY: formatValueFn,
    seriesIds,
  });
}
