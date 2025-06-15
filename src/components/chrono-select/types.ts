
export interface MonthData {
  id: string; // YYYY-MM format
  year: number;
  month: number; // 1-12
  day: number; // Day of the month, typically 1 for these month representations
}

export type RowType = 'work' | 'gap';

export interface YearGroup {
  year: number;
  months: MonthData[];
}

export interface DateRange {
  id: string; // Unique ID for the range, e.g., startMonthId_endMonthId
  start: MonthData;
  end: MonthData;
  text: string; // Formatted text like "MM/YYYY - MM/YYYY"
}

// This interface is now less used as props are explicitly defined in TimelineRow.tsx
// It can be kept for reference or removed if no longer imported elsewhere.
export interface TimelineRowProps {
  type: RowType;
  yearGroups: YearGroup[]; 
  selectedMonths: Set<string>;
  firstClickId: string | null;
  onTileClick: (monthId: string, type: RowType) => void;
  calculateYearSegmentWidth: (numMonthsInGroup: number) => string; 
  tileWidthPx: number; 
  spacePx: number; 
}
