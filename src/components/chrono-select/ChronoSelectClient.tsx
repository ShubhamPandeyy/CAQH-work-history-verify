
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import type { MonthData, RowType, YearGroup, DateRange } from './types';
import TimelineRow from './TimelineRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw, Settings } from 'lucide-react';
import { getSelectedRanges, parseDateRangeString, getMonthIdsInRange, getMonthsDurationInDateRange } from '@/lib/chrono-utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const TOTAL_MONTHS = 61; // 5 years + 1 current month
const ROW_LABEL_WIDTH_PX = 112; 
const RESET_BUTTON_WIDTH_PX = 40; 
const RESET_BUTTON_MARGIN_PX = 8; // ml-2
const SPACE_PX = 1; // Space between tiles
const MIN_TILE_WIDTH_PX = 14; 
const SIGNIFICANT_GAP_THRESHOLD_STORAGE_KEY = 'chronoSelectSignificantGapThreshold';


const ChronoSelectClient: React.FC = () => {
  const [timelineMonths, setTimelineMonths] = useState<MonthData[]>([]);

  const [workSelectedMonths, setWorkSelectedMonths] = useState<Set<string>>(new Set());
  const [workFirstClick, setWorkFirstClick] = useState<string | null>(null);
  const [workDateRanges, setWorkDateRanges] = useState<DateRange[]>([]);
  const [workRangeInputValues, setWorkRangeInputValues] = useState<Record<string, string>>({});
  const [workInternalGapMonths, setWorkInternalGapMonths] = useState<Set<string>>(new Set());

  const [gapSelectedMonths, setGapSelectedMonths] = useState<Set<string>>(new Set());
  const [gapFirstClick, setGapFirstClick] = useState<string | null>(null);
  const [gapDateRanges, setGapDateRanges] = useState<DateRange[]>([]);
  const [gapRangeInputValues, setGapRangeInputValues] = useState<Record<string, string>>({});

  const [tileWidthPx, setTileWidthPx] = useState(MIN_TILE_WIDTH_PX);
  const timelineContentAreaRef = useRef<HTMLDivElement>(null);
  const [gapStatusMessage, setGapStatusMessage] = useState<string>('No employment gap found. There is continuous employment from first working date.');
  const [significantGapThresholdMonths, setSignificantGapThresholdMonths] = useState<number>(6);

  useEffect(() => {
    const storedThreshold = localStorage.getItem(SIGNIFICANT_GAP_THRESHOLD_STORAGE_KEY);
    if (storedThreshold) {
      const numThreshold = parseInt(storedThreshold, 10);
      if (!isNaN(numThreshold) && numThreshold > 0 && numThreshold <=60) {
        setSignificantGapThresholdMonths(numThreshold);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SIGNIFICANT_GAP_THRESHOLD_STORAGE_KEY, String(significantGapThresholdMonths));
  }, [significantGapThresholdMonths]);


  useEffect(() => {
    const generateTimelineMonths = () => {
      const months: MonthData[] = [];
      const today = new Date();
      let currentDate = new Date(today.getFullYear(), today.getMonth() - (TOTAL_MONTHS - 1), 1);

      for (let i = 0; i < TOTAL_MONTHS; i++) {
        months.push({
          id: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1, 
          day: currentDate.getDate(), 
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      setTimelineMonths(months);
    };
    generateTimelineMonths();
  }, []);

  const yearGroups = useMemo<YearGroup[]>(() => {
    if (!timelineMonths.length) return [];
    return timelineMonths.reduce<YearGroup[]>((acc, month) => {
      let yearGroup = acc.find(group => group.year === month.year);
      if (!yearGroup) {
        yearGroup = { year: month.year, months: [] };
        acc.push(yearGroup);
      }
      yearGroup.months.push(month);
      return acc;
    }, []).sort((a, b) => a.year - b.year); 
  }, [timelineMonths]);

  useLayoutEffect(() => {
    const calculateDynamicTileWidth = () => {
      if (timelineContentAreaRef.current && yearGroups.length > 0) {
        const availableWidth = timelineContentAreaRef.current.offsetWidth;
        if (availableWidth <= 0) {
          setTileWidthPx(MIN_TILE_WIDTH_PX);
          return;
        }
        const totalSpacingWidth = (TOTAL_MONTHS - 1) * SPACE_PX;
        const widthForTiles = availableWidth - totalSpacingWidth;
        const calculatedWidth = widthForTiles / TOTAL_MONTHS;
        setTileWidthPx(Math.max(MIN_TILE_WIDTH_PX, Math.floor(calculatedWidth)));
      } else {
        setTileWidthPx(MIN_TILE_WIDTH_PX);
      }
    };

    calculateDynamicTileWidth();
    const observer = new ResizeObserver(calculateDynamicTileWidth);
    if (timelineContentAreaRef.current) {
      observer.observe(timelineContentAreaRef.current);
    }
    window.addEventListener('resize', calculateDynamicTileWidth);

    return () => {
      if (timelineContentAreaRef.current) {
        observer.unobserve(timelineContentAreaRef.current);
      }
      window.removeEventListener('resize', calculateDynamicTileWidth);
      observer.disconnect(); 
    };
  }, [yearGroups, timelineMonths]); 

  const handleTileClick = useCallback((monthId: string, type: RowType) => {
    const setSelectedMonths = type === 'work' ? setWorkSelectedMonths : setGapSelectedMonths;
    const setFirstClick = type === 'work' ? setWorkFirstClick : setGapFirstClick;
    const firstClick = type === 'work' ? workFirstClick : gapFirstClick;
    const currentSelectedMonths = type === 'work' ? workSelectedMonths : gapSelectedMonths;

    if (!firstClick) {
      setFirstClick(monthId);
    } else {
      const firstIndex = timelineMonths.findIndex(m => m.id === firstClick);
      const secondIndex = timelineMonths.findIndex(m => m.id === monthId);
      if (firstIndex === -1 || secondIndex === -1) return; 

      const newSelected = new Set(currentSelectedMonths);
      const start = Math.min(firstIndex, secondIndex);
      const end = Math.max(firstIndex, secondIndex);
      for (let i = start; i <= end; i++) newSelected.add(timelineMonths[i].id);

      setSelectedMonths(newSelected);
      setFirstClick(null);
    }
  }, [timelineMonths, workFirstClick, gapFirstClick, workSelectedMonths, gapSelectedMonths]);

  const calculateYearSegmentWidth = useCallback((numMonthsInGroup: number): string => {
    if (numMonthsInGroup === 0 || tileWidthPx <= 0) return '0px';
    const width = numMonthsInGroup * tileWidthPx + Math.max(0, numMonthsInGroup - 1) * SPACE_PX;
    return `${width}px`;
  }, [tileWidthPx]);

  const handleResetSelection = (type: RowType) => {
    if (type === 'work') {
      setWorkSelectedMonths(new Set());
      setWorkFirstClick(null);
      setWorkDateRanges([]);
      setWorkRangeInputValues({});
    } else {
      setGapSelectedMonths(new Set());
      setGapFirstClick(null);
      setGapDateRanges([]);
      setGapRangeInputValues({});
    }
  };

  useEffect(() => {
    const newRanges = getSelectedRanges(workSelectedMonths, timelineMonths);
    setWorkDateRanges(newRanges);
    setWorkRangeInputValues(prev => {
      const newInputs: Record<string, string> = {};
      newRanges.forEach(r => {
        newInputs[r.id] = prev[r.id] !== undefined ? prev[r.id] : r.text;
      });
      return newInputs;
    });
  }, [workSelectedMonths, timelineMonths]);

  useEffect(() => {
    const newRanges = getSelectedRanges(gapSelectedMonths, timelineMonths);
    setGapDateRanges(newRanges);
    setGapRangeInputValues(prev => {
      const newInputs: Record<string, string> = {};
      newRanges.forEach(r => {
        newInputs[r.id] = prev[r.id] !== undefined ? prev[r.id] : r.text;
      });
      return newInputs;
    });
  }, [gapSelectedMonths, timelineMonths]);

  const handleRangeInputChange = (rangeId: string, newValue: string, type: RowType) => {
    const setInputValues = type === 'work' ? setWorkRangeInputValues : setGapRangeInputValues;
    setInputValues(prev => ({ ...prev, [rangeId]: newValue }));
  };

  const handleRangeInputBlur = (rangeId: string, currentValue: string, type: RowType) => {
    const parsed = parseDateRangeString(currentValue, timelineMonths);
    const setSelectedMonths = type === 'work' ? setWorkSelectedMonths : setGapSelectedMonths;
    const dateRanges = type === 'work' ? workDateRanges : gapDateRanges;
    const originalRange = dateRanges.find(r => r.id === rangeId);

    if (parsed && originalRange) { 
      setSelectedMonths(prevSelected => {
        const newSelected = new Set(prevSelected);
        const oldMonthsToRemove = getMonthIdsInRange(originalRange.start.id, originalRange.end.id, timelineMonths);
        oldMonthsToRemove.forEach(id => newSelected.delete(id));

        if (parsed.startMonthId && parsed.endMonthId) {
           const newMonthsToAdd = getMonthIdsInRange(parsed.startMonthId, parsed.endMonthId, timelineMonths);
           newMonthsToAdd.forEach(id => newSelected.add(id));
        } 
        return newSelected;
      });
    } else if (originalRange) { 
        handleRangeInputChange(rangeId, originalRange.text, type);
    } else if (!parsed && !originalRange && currentValue.trim() === '') {
    } else if (originalRange){ 
        handleRangeInputChange(rangeId, originalRange.text, type);
    }
  };
  
  useEffect(() => {
    if (timelineMonths.length === 0 || significantGapThresholdMonths <= 0) {
      setWorkInternalGapMonths(new Set());
      setGapStatusMessage('No employment gap found. There is continuous employment from first working date.');
      return;
    }

    let currentStatusMessage = 'No employment gap found. There is continuous employment from first working date.';
    const newInternalGapMonthsForOutline = new Set<string>();
    
    let hasExplicitLongExplainedGap = false; 
    let hasAtLeastOneSignificantUnexplainedGap = false;
    let hadAnySignificantPotentialGapsAtAll = false;
    
    let firstSelectedWorkMonthIndex = -1;
    if (workSelectedMonths.size > 0) {
        for (let i = 0; i < timelineMonths.length; i++) {
            if (workSelectedMonths.has(timelineMonths[i].id)) {
            firstSelectedWorkMonthIndex = i;
            break;
            }
        }
    }

    for (const gapRange of gapDateRanges) {
        const gapDuration = getMonthsDurationInDateRange(gapRange, timelineMonths);
        if (gapDuration >= significantGapThresholdMonths) {
            // A long gap in Gap History is relevant if no work is selected, or if it's concurrent with/after first work month
            if (firstSelectedWorkMonthIndex === -1 || timelineMonths.findIndex(m => m.id === gapRange.end.id) >= firstSelectedWorkMonthIndex) {
                 hasExplicitLongExplainedGap = true;
                 break; 
            }
        }
    }
    
    if (firstSelectedWorkMonthIndex === -1) { // No work selected
      if (hasExplicitLongExplainedGap) {
        currentStatusMessage = 'Employment gap found with an explanation.';
      } else {
        currentStatusMessage = 'No employment gap found. There is continuous employment from first working date.';
      }
      setWorkInternalGapMonths(new Set()); 
      setGapStatusMessage(currentStatusMessage);
      return;
    }
    
    // Work IS selected, proceed to analyze potential work gaps
    const unselectedWorkMonthIds = new Set(timelineMonths.map(m => m.id));
    workSelectedMonths.forEach(id => unselectedWorkMonthIds.delete(id));

    const potentialWorkGapRangesData: MonthData[][] = [];
    let currentPotentialRange: MonthData[] = [];

    for (const month of timelineMonths) { 
      if (unselectedWorkMonthIds.has(month.id)) {
        currentPotentialRange.push(month);
      } else {
        if (currentPotentialRange.length > 0) {
          potentialWorkGapRangesData.push(currentPotentialRange);
          currentPotentialRange = [];
        }
      }
    }
    if (currentPotentialRange.length > 0) {
      potentialWorkGapRangesData.push(currentPotentialRange);
    }
    
    for (const potentialGapMonthData of potentialWorkGapRangesData) {
      if (potentialGapMonthData.length === 0) continue;

      const gapStartIndexInTimeline = timelineMonths.findIndex(m => m.id === potentialGapMonthData[0].id);
      const gapEndIndexInTimeline = timelineMonths.findIndex(m => m.id === potentialGapMonthData[potentialGapMonthData.length - 1].id);
      
      // CRUCIAL: Ignore any potential gap that occurs entirely BEFORE the first selected work month
      if (firstSelectedWorkMonthIndex !== -1 && gapEndIndexInTimeline < firstSelectedWorkMonthIndex) {
        continue; 
      }
      
      if (potentialGapMonthData.length >= significantGapThresholdMonths) {
        hadAnySignificantPotentialGapsAtAll = true; 
        
        const unexplainedPortionOfThisGap = potentialGapMonthData.filter(
          m => !gapSelectedMonths.has(m.id) 
        );

        if (unexplainedPortionOfThisGap.length >= significantGapThresholdMonths) {
          hasAtLeastOneSignificantUnexplainedGap = true;
          // Add to outline only if it's at/after first work selection (or if no work selected, which is handled above)
          if (firstSelectedWorkMonthIndex === -1 || gapStartIndexInTimeline >= firstSelectedWorkMonthIndex) {
             unexplainedPortionOfThisGap.forEach(m => newInternalGapMonthsForOutline.add(m.id));
          }
        }
      }
    }

    if (hasAtLeastOneSignificantUnexplainedGap) {
      currentStatusMessage = 'Employment gap found without any explanation > Consider making outreach to the provider for explanation.';
    } else if (hasExplicitLongExplainedGap || hadAnySignificantPotentialGapsAtAll) { 
      currentStatusMessage = 'Employment gap found with an explanation.';
    } else { 
      currentStatusMessage = 'No employment gap found. There is continuous employment from first working date.';
    }
    
    setWorkInternalGapMonths(newInternalGapMonthsForOutline);
    setGapStatusMessage(currentStatusMessage);

  }, [workSelectedMonths, gapSelectedMonths, gapDateRanges, timelineMonths, significantGapThresholdMonths]);


  if (timelineMonths.length === 0 || yearGroups.length === 0) {
    return <div className="flex justify-center items-center h-64"><p>Loading timeline...</p></div>;
  }

  return (
    <div className="space-y-1 w-full" style={{
        ['--row-label-width-px' as string]: `${ROW_LABEL_WIDTH_PX}px`,
        ['--reset-button-width-px' as string]: `${RESET_BUTTON_WIDTH_PX}px`,
        ['--reset-button-margin-px' as string]: `${RESET_BUTTON_MARGIN_PX}px`,
    }}>
      <div className="flex justify-end mb-4 mr-1"> {/* Adjusted margin for alignment */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Timeline Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Timeline Settings</SheetTitle>
              <SheetDescription>
                Adjust parameters for the timeline display and gap calculation.
              </SheetDescription>
            </SheetHeader>
            <div className="p-4 space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="gap-threshold-input-sheet" className="text-sm font-medium">
                  Minimum Significant Gap (Months)
                </Label>
                <Input
                  id="gap-threshold-input-sheet"
                  type="number"
                  min="1"
                  max="60"
                  value={significantGapThresholdMonths}
                  onChange={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (e.target.value === '') {
                          val = 1; 
                      }
                      if (!isNaN(val) && val > 0 && val <= 60) {
                          setSignificantGapThresholdMonths(val);
                      } else if (!isNaN(val) && val > 60) {
                          setSignificantGapThresholdMonths(60); 
                      } else {
                          setSignificantGapThresholdMonths(1); 
                      }
                  }}
                  className="text-sm w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Defines the minimum number of consecutive unselected months to be considered a significant gap. Defaults to 6.
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex w-full items-end">
        <div style={{ width: `var(--row-label-width-px)` }} className="flex-shrink-0" /> 
        <div ref={timelineContentAreaRef} className="flex flex-grow"> 
          <div className="flex" style={{ columnGap: `${SPACE_PX}px` }}>
            {yearGroups.map((group) => (
              <div
                key={group.year}
                className="year-label text-xs font-headline text-muted-foreground text-center"
                style={{ minWidth: calculateYearSegmentWidth(group.months.length) }}
              >
                {group.year}
              </div>
            ))}
          </div>
        </div>
        <div style={{ width: `calc(var(--reset-button-width-px) + var(--reset-button-margin-px))` }} className="flex-shrink-0" /> 
      </div>

      <div className="flex items-center w-full">
        <div style={{ width: `var(--row-label-width-px)`}} className="flex-shrink-0 pr-2 text-xs font-medium text-primary text-right">Work History</div>
        <div className="flex-grow"> 
            <TimelineRow
            type="work"
            yearGroups={yearGroups}
            selectedMonths={workSelectedMonths}
            firstClickId={workFirstClick}
            onTileClick={handleTileClick}
            calculateYearSegmentWidth={calculateYearSegmentWidth}
            tileWidthPx={tileWidthPx}
            spacePx={SPACE_PX}
            internalGapMonths={workInternalGapMonths}
            />
        </div>
        <Button variant="outline" size="icon" className="ml-2 flex-shrink-0 transition-all duration-200 ease-in-out hover:scale-110" style={{width: 'var(--reset-button-width-px)', height: 'var(--reset-button-width-px)'}} onClick={() => handleResetSelection('work')} aria-label="Reset work history">
            <RotateCcw size={16} />
        </Button>
      </div>

      <div className="flex items-center w-full mt-1">
        <div style={{ width: `var(--row-label-width-px)`}} className="flex-shrink-0 pr-2 text-xs font-medium text-primary text-right">Gap History</div>
        <div className="flex-grow">
            <TimelineRow
            type="gap"
            yearGroups={yearGroups}
            selectedMonths={gapSelectedMonths}
            firstClickId={gapFirstClick}
            onTileClick={handleTileClick}
            calculateYearSegmentWidth={calculateYearSegmentWidth}
            tileWidthPx={tileWidthPx}
            spacePx={SPACE_PX}
            />
        </div>
        <Button variant="outline" size="icon" className="ml-2 flex-shrink-0 transition-all duration-200 ease-in-out hover:scale-110" style={{width: 'var(--reset-button-width-px)', height: 'var(--reset-button-width-px)'}} onClick={() => handleResetSelection('gap')} aria-label="Reset gap history">
            <RotateCcw size={16} />
        </Button>
      </div>
      
      <div
          className="space-y-4 mt-[100px]" 
          style={{
              paddingRight: `calc(var(--reset-button-width-px) + var(--reset-button-margin-px))`
          }}
      >
        <div className="flex items-center">
          <p style={{ width: `var(--row-label-width-px)` }} className="flex-shrink-0 pr-2 text-xs font-medium text-primary text-right">Work History Dates</p>
          <div className="flex flex-grow flex-wrap gap-2">
            {workDateRanges.length > 0 ? (
              workDateRanges.map((range) => (
                <Input
                  key={range.id}
                  type="text"
                  value={workRangeInputValues[range.id] || ''}
                  onChange={(e) => handleRangeInputChange(range.id, e.target.value, 'work')}
                  onBlur={(e) => handleRangeInputBlur(range.id, e.target.value, 'work')}
                  placeholder="MM/YYYY - MM/YYYY"
                  className="text-sm w-48" 
                />
              ))
            ) : (
              <Input
                disabled
                value="Select a work period on the timeline."
                className="text-sm w-48 text-muted-foreground italic"
              />
            )}
          </div>
        </div>

        <div className="flex items-center">
          <p style={{ width: `var(--row-label-width-px)` }} className="flex-shrink-0 pr-2 text-xs font-medium text-primary text-right">Gap History Dates</p>
          <div className="flex flex-grow flex-wrap gap-2">
            {gapDateRanges.length > 0 ? (
              gapDateRanges.map((range) => (
                <Input
                  key={range.id}
                  type="text"
                  value={gapRangeInputValues[range.id] || ''}
                  onChange={(e) => handleRangeInputChange(range.id, e.target.value, 'gap')}
                  onBlur={(e) => handleRangeInputBlur(range.id, e.target.value, 'gap')}
                  placeholder="MM/YYYY - MM/YYYY"
                  className="text-sm w-48"
                />
              ))
            ) : (
              <Input
                disabled
                value="Select a gap period on the timeline."
                className="text-sm w-48 text-muted-foreground italic"
              />
            )}
          </div>
        </div>
      </div>
      <div className="pt-[100px] text-center text-muted-foreground text-sm">
        <p>{gapStatusMessage}</p>
        <p className="mt-4 text-xs text-muted-foreground opacity-70">
          Note: This visualizer is a tool to aid in tracking history. Please review all entries and the timeline carefully to ensure accuracy.
        </p>
      </div>
    </div>
  );
};

export default ChronoSelectClient;
    

    

    

    


