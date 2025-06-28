
import React from 'react';
import type { YearGroup, RowType } from './types';
import MonthTile from './MonthTile';

interface ExtendedTimelineRowProps {
  type: RowType;
  yearGroups: YearGroup[];
  selectedMonths: Set<string>;
  firstClickId: string | null;
  onTileClick: (monthId: string, type: RowType) => void;
  calculateYearSegmentWidth: (numMonthsInGroup: number) => string;
  tileWidthPx: number;
  spacePx: number;
  internalGapMonths?: Set<string>; // Optional: only for 'work' row
  showMonthTooltip: boolean;
}

const TimelineRow: React.FC<ExtendedTimelineRowProps> = ({ 
  type, 
  yearGroups,
  selectedMonths, 
  firstClickId, 
  onTileClick,
  calculateYearSegmentWidth,
  tileWidthPx,
  spacePx,
  internalGapMonths,
  showMonthTooltip
}) => {
  if (!yearGroups || yearGroups.length === 0 || tileWidthPx <= 0) {
    return null; 
  }

  return (
    <div className="flex" style={{ columnGap: `${spacePx}px` }}>
      {yearGroups.map((group) => (
        <div 
          key={`${type}-${group.year}`}
          className="year-segment-data flex" 
          style={{ minWidth: calculateYearSegmentWidth(group.months.length) }}
        >
          <div className="months-container flex" style={{ columnGap: `${spacePx}px` }}> 
            {group.months.map(month => (
              <MonthTile
                key={month.id}
                monthData={month}
                type={type}
                isSelected={selectedMonths.has(month.id)}
                isRangeStart={firstClickId === month.id}
                onClick={() => onTileClick(month.id, type)}
                tileWidthPx={tileWidthPx}
                isInternalGap={type === 'work' && internalGapMonths?.has(month.id)}
                showMonthTooltip={showMonthTooltip}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineRow;

    