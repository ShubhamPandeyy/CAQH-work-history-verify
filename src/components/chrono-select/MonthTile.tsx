
import React from 'react';
import { cn } from '@/lib/utils';
import type { MonthData, RowType } from './types';

interface MonthTileProps {
  monthData: MonthData;
  type: RowType;
  isSelected: boolean;
  isRangeStart: boolean;
  onClick: () => void;
  tileWidthPx: number;
  isInternalGap?: boolean;
}

const MonthTile: React.FC<MonthTileProps> = ({ 
  monthData, 
  type, 
  isSelected, 
  isRangeStart, 
  onClick, 
  tileWidthPx,
  isInternalGap
}) => {
  const tileStyles = cn(
    "flex items-center justify-center rounded-sm font-body cursor-pointer transition-all duration-200 ease-in-out",
    "shadow hover:shadow-md transform hover:-translate-y-px hover:scale-110",
    "border",
    isSelected
      ? type === 'work'
        ? 'bg-material-green text-material-green-foreground border-material-green'
        : 'bg-material-brown text-material-brown-foreground border-material-brown'
      : 'bg-card hover:bg-accent/20 text-card-foreground border-border',
    isRangeStart && !isSelected && 'ring-1 ring-offset-0 ring-accent', 
    isRangeStart && isSelected && 'ring-1 ring-offset-0 ring-background',
    isInternalGap && !isSelected && type === 'work' && 'ring-2 ring-destructive ring-offset-1 ring-offset-background'
  );

  const fontSize = Math.min(12, Math.max(7, Math.floor(tileWidthPx * 0.5)));

  return (
    <button
      type="button"
      className={tileStyles}
      style={{ 
        width: `${tileWidthPx}px`, 
        height: `${tileWidthPx}px`,
        fontSize: `${fontSize}px`,
       }}
      onClick={onClick}
      aria-label={`${type === 'work' ? 'Work' : 'Gap'} month ${monthData.month} ${monthData.year} ${isSelected ? 'selected' : isInternalGap && type === 'work' ? 'internal gap' : 'not selected'}`}
      aria-pressed={isSelected}
      data-testid={`tile-${monthData.id}-${type}`}
    >
      {monthData.month}
    </button>
  );
};

export default MonthTile;
