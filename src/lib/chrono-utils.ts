
import type { MonthData, DateRange } from '@/components/chrono-select/types';

export function getSelectedRanges(
  selectedMonthIds: Set<string>,
  timelineMonths: MonthData[]
): DateRange[] {
  if (selectedMonthIds.size === 0 || timelineMonths.length === 0) {
    return [];
  }

  const sortedTimelineMonths = [...timelineMonths].sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return a.month - b.month;
  });

  const ranges: DateRange[] = [];
  let currentRangeStart: MonthData | null = null;

  for (let i = 0; i < sortedTimelineMonths.length; i++) {
    const month = sortedTimelineMonths[i];
    const isSelected = selectedMonthIds.has(month.id);

    if (isSelected && !currentRangeStart) {
      currentRangeStart = month;
    } else if (!isSelected && currentRangeStart) {
      const endMonth = sortedTimelineMonths[i - 1];
      ranges.push(formatRange(currentRangeStart, endMonth));
      currentRangeStart = null;
    }
  }

  if (currentRangeStart) {
    // Ensure the end month is the last selected month in the sequence,
    // not necessarily the last month in the timeline.
    let lastSelectedMonthInCurrentRange = currentRangeStart;
    for (let i = sortedTimelineMonths.indexOf(currentRangeStart); i < sortedTimelineMonths.length; i++) {
        if (selectedMonthIds.has(sortedTimelineMonths[i].id)) {
            lastSelectedMonthInCurrentRange = sortedTimelineMonths[i];
        } else {
            break; 
        }
    }
    ranges.push(formatRange(currentRangeStart, lastSelectedMonthInCurrentRange));
  }


  return ranges;
}

function formatMonth(monthData: MonthData): string {
  return `${String(monthData.month).padStart(2, '0')}/${monthData.year}`;
}

function formatRange(startMonth: MonthData, endMonth: MonthData): DateRange {
  const text =
    startMonth.id === endMonth.id
      ? formatMonth(startMonth)
      : `${formatMonth(startMonth)} - ${formatMonth(endMonth)}`;
  return {
    id: `${startMonth.id}_${endMonth.id}`,
    start: startMonth,
    end: endMonth,
    text: text,
  };
}

export function parseDateRangeString(
  input: string,
  timelineMonths: MonthData[]
): { startMonthId?: string; endMonthId?: string } | null {
  if (!input.trim()) return { startMonthId: undefined, endMonthId: undefined }; 

  const singleDateRegex = /^(\d{1,2})\/(\d{4})$/;
  const rangeDateRegex = /^(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{4})$/;

  let match = input.match(rangeDateRegex);
  let startMonth, startYear, endMonth, endYear;

  if (match) {
    startMonth = parseInt(match[1], 10);
    startYear = parseInt(match[2], 10);
    endMonth = parseInt(match[3], 10);
    endYear = parseInt(match[4], 10);
  } else {
    match = input.match(singleDateRegex);
    if (match) {
      startMonth = parseInt(match[1], 10);
      startYear = parseInt(match[2], 10);
      endMonth = startMonth;
      endYear = startYear;
    } else {
      return null; 
    }
  }

  if (
    isNaN(startMonth) || isNaN(startYear) || isNaN(endMonth) || isNaN(endYear) ||
    startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12
  ) {
    return null; 
  }

  const startDateObj = new Date(startYear, startMonth - 1, 1);
  const endDateObj = new Date(endYear, endMonth - 1, 1);


  if (startDateObj > endDateObj) return null; 

  const startMonthId = `${startYear}-${String(startMonth).padStart(2, '0')}`;
  const endMonthId = `${endYear}-${String(endMonth).padStart(2, '0')}`;

  const isValidStart = timelineMonths.some(m => m.id === startMonthId);
  const isValidEnd = timelineMonths.some(m => m.id === endMonthId);

  if (!isValidStart || !isValidEnd) return null; 

  return { startMonthId, endMonthId };
}

export function getMonthIdsInRange(
  startMonthId: string,
  endMonthId: string,
  timelineMonths: MonthData[]
): string[] {
  const startIndex = timelineMonths.findIndex(m => m.id === startMonthId);
  const endIndex = timelineMonths.findIndex(m => m.id === endMonthId);

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    return [];
  }

  return timelineMonths.slice(startIndex, endIndex + 1).map(m => m.id);
}

export function getMonthsDurationInDateRange(range: DateRange, timelineMonths: MonthData[]): number {
    const monthIds = getMonthIdsInRange(range.start.id, range.end.id, timelineMonths);
    return monthIds.length;
}

    