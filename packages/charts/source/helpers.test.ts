import { describe, it, expect } from "vitest";
import {
  transformToBarData,
  transformToLineData,
  formatTimeSeries,
} from "./helpers";

describe("Data Transformation Helpers", () => {
  describe("transformToBarData", () => {
    it("should transform simple data to bar chart format", () => {
      const data = [
        { category: "A", value1: 10, value2: 20 },
        { category: "B", value1: 15, value2: 25 },
      ];

      const result = transformToBarData(data, {
        indexBy: "category",
        keys: ["value1", "value2"],
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        category: "A",
        value1: 10,
        value2: 20,
      });
      expect(result[1]).toEqual({
        category: "B",
        value1: 15,
        value2: 25,
      });
    });

    it("should handle missing values with default 0", () => {
      const data = [
        { category: "A", value1: 10 },
        { category: "B", value2: 25 },
      ];

      const result = transformToBarData(data, {
        indexBy: "category",
        keys: ["value1", "value2"],
      });

      expect(result[0].value2).toBe(0);
      expect(result[1].value1).toBe(0);
    });

    it("should apply transform function when provided", () => {
      const data = [
        { category: "A", value: 10 },
        { category: "B", value: 15 },
      ];

      const result = transformToBarData(data, {
        indexBy: "category",
        keys: ["value"],
        transform: (item) => ({ ...item, value: item.value * 2 }),
      });

      expect(result[0].value).toBe(20);
      expect(result[1].value).toBe(30);
    });
  });

  describe("transformToLineData", () => {
    it("should transform data to line chart format with single series", () => {
      const data = [
        { date: "2024-01-01", sales: 100 },
        { date: "2024-01-02", sales: 150 },
      ];

      const result = transformToLineData(data, {
        xField: "date",
        yFields: "sales",
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("sales");
      expect(result[0].data).toHaveLength(2);
      expect(result[0].data[0]).toEqual({ x: "2024-01-01", y: 100 });
    });

    it("should transform data to line chart format with multiple series", () => {
      const data = [
        { date: "2024-01-01", sales: 100, revenue: 1000 },
        { date: "2024-01-02", sales: 150, revenue: 1500 },
      ];

      const result = transformToLineData(data, {
        xField: "date",
        yFields: ["sales", "revenue"],
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("sales");
      expect(result[1].id).toBe("revenue");
    });

    it("should apply format functions when provided", () => {
      const data = [
        { date: "2024-01-01", value: "10.5" },
        { date: "2024-01-02", value: "15.7" },
      ];

      const result = transformToLineData(data, {
        xField: "date",
        yFields: "value",
        formatY: (val) => Math.floor(Number(val)),
      });

      expect(result[0].data[0].y).toBe(10);
      expect(result[0].data[1].y).toBe(15);
    });

    it("should use custom series IDs when provided", () => {
      const data = [{ date: "2024-01-01", sales: 100, revenue: 1000 }];

      const result = transformToLineData(data, {
        xField: "date",
        yFields: ["sales", "revenue"],
        seriesIds: ["Sales Data", "Revenue Data"],
      });

      expect(result[0].id).toBe("Sales Data");
      expect(result[1].id).toBe("Revenue Data");
    });
  });

  describe("formatTimeSeries", () => {
    it("should format time series data with default date parsing", () => {
      const data = [
        { timestamp: "2024-01-01T00:00:00Z", temperature: 20 },
        { timestamp: "2024-01-02T00:00:00Z", temperature: 22 },
      ];

      const result = formatTimeSeries(data, {
        dateField: "timestamp",
        valueFields: "temperature",
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("temperature");
      expect(result[0].data[0].x).toContain("2024-01-01");
    });

    it("should format time series with custom date parsing", () => {
      const data = [
        { date: "01/01/2024", value: 100 },
        { date: "01/02/2024", value: 150 },
      ];

      const result = formatTimeSeries(data, {
        dateField: "date",
        valueFields: "value",
        parseDate: (val) => {
          const [month, day, year] = val.split("/");
          return new Date(`${year}-${month}-${day}`);
        },
        formatDate: (date) => date.toISOString().split("T")[0],
      });

      expect(result[0].data[0].x).toContain("2024");
    });

    it("should handle multiple value fields", () => {
      const data = [
        { timestamp: "2024-01-01T00:00:00Z", temp: 20, humidity: 60 },
        { timestamp: "2024-01-02T00:00:00Z", temp: 22, humidity: 65 },
      ];

      const result = formatTimeSeries(data, {
        dateField: "timestamp",
        valueFields: ["temp", "humidity"],
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("temp");
      expect(result[1].id).toBe("humidity");
    });
  });
});
