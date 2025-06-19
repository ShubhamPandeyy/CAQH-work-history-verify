
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import type { MonthData, RowType, YearGroup, DateRange } from './types';
import TimelineRow from './TimelineRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw, Settings, HelpCircle, PlusCircle, Info, X } from 'lucide-react';
import { getSelectedRanges, parseDateRangeString, getMonthIdsInRange, getMonthsDurationInDateRange } from '@/lib/chrono-utils';
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [pendingWorkInputs, setPendingWorkInputs] = useState<string[]>([]);


  const [gapSelectedMonths, setGapSelectedMonths] = useState<Set<string>>(new Set());
  const [gapFirstClick, setGapFirstClick] = useState<string | null>(null);
  const [gapDateRanges, setGapDateRanges] = useState<DateRange[]>([]);
  const [gapRangeInputValues, setGapRangeInputValues] = useState<Record<string, string>>({});
  const [pendingGapInputs, setPendingGapInputs] = useState<string[]>([]);

  const [inputValidationStatus, setInputValidationStatus] = useState<Record<string, 'valid' | 'invalid' | 'neutral'>>({});

  const [tileWidthPx, setTileWidthPx] = useState(MIN_TILE_WIDTH_PX);
  const timelineContentAreaRef = useRef<HTMLDivElement>(null);
  const [gapStatusMessage, setGapStatusMessage] = useState<string>('No employment gap found. There is continuous employment from first working date.');
  const [significantGapThresholdMonths, setSignificantGapThresholdMonths] = useState<number>(6);

  useEffect(() => {
    const storedThreshold = localStorage.getItem(SIGNIFICANT_GAP_THRESHOLD_STORAGE_KEY);
    if (storedThreshold) {
      const numThreshold = parseInt(storedThreshold, 10);
      if (!isNaN(numThreshold) && numThreshold > 0 && numThreshold <= 60) {
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
      setWorkRangeInputValues({});
      setPendingWorkInputs([]);
      const newValidationStatus = { ...inputValidationStatus };
      workDateRanges.forEach(r => delete newValidationStatus[r.id]);
      pendingWorkInputs.forEach(id => delete newValidationStatus[id]);
      delete newValidationStatus['default-work-input'];
      setInputValidationStatus(newValidationStatus);
    } else {
      setGapSelectedMonths(new Set());
      setGapFirstClick(null);
      setGapRangeInputValues({});
      setPendingGapInputs([]);
      const newValidationStatus = { ...inputValidationStatus };
      gapDateRanges.forEach(r => delete newValidationStatus[r.id]);
      pendingGapInputs.forEach(id => delete newValidationStatus[id]);
      delete newValidationStatus['default-gap-input'];
      setInputValidationStatus(newValidationStatus);
    }
  };

  useEffect(() => {
    const newRanges = getSelectedRanges(workSelectedMonths, timelineMonths);
    setWorkDateRanges(newRanges);
    setWorkRangeInputValues(prev => {
      const newInputsState: Record<string, string> = {};
      newRanges.forEach(r => {
        if (prev[r.id] !== undefined && inputValidationStatus[r.id] === 'invalid') {
            newInputsState[r.id] = prev[r.id];
        } else {
            newInputsState[r.id] = prev[r.id] !== undefined && prev[r.id].trim() !== '' ? prev[r.id] : r.text;
        }
      });
      pendingWorkInputs.forEach(pid => {
        newInputsState[pid] = prev[pid] !== undefined ? prev[pid] : '';
      });
      const defaultWorkInputId = 'default-work-input';
      if (prev[defaultWorkInputId] !== undefined) {
        newInputsState[defaultWorkInputId] = prev[defaultWorkInputId];
      }
      return newInputsState;
    });
  }, [workSelectedMonths, timelineMonths, pendingWorkInputs, inputValidationStatus]);

  useEffect(() => {
    const newRanges = getSelectedRanges(gapSelectedMonths, timelineMonths);
    setGapDateRanges(newRanges);
    setGapRangeInputValues(prev => {
      const newInputsState: Record<string, string> = {};
      newRanges.forEach(r => {
         if (prev[r.id] !== undefined && inputValidationStatus[r.id] === 'invalid') {
            newInputsState[r.id] = prev[r.id];
        } else {
            newInputsState[r.id] = prev[r.id] !== undefined && prev[r.id].trim() !== '' ? prev[r.id] : r.text;
        }
      });
      pendingGapInputs.forEach(pid => {
        newInputsState[pid] = prev[pid] !== undefined ? prev[pid] : '';
      });
      const defaultGapInputId = 'default-gap-input';
      if (prev[defaultGapInputId] !== undefined) {
        newInputsState[defaultGapInputId] = prev[defaultGapInputId];
      }
      return newInputsState;
    });
  }, [gapSelectedMonths, timelineMonths, pendingGapInputs, inputValidationStatus]);


  const handleRangeInputChange = (rangeId: string, newValue: string, type: RowType) => {
    const setInputValues = type === 'work' ? setWorkRangeInputValues : setGapRangeInputValues;
    const previousValue = (type === 'work' ? workRangeInputValues : gapRangeInputValues)[rangeId] || "";

    let currentFilteredValue = newValue.replace(/[^0-9/\- ]/g, '');

    if (currentFilteredValue.length === 1 && previousValue.length === 0 && /[2-9]/.test(currentFilteredValue)) {
        currentFilteredValue = '0' + currentFilteredValue;
    }
    if (currentFilteredValue.length === 2 && previousValue.length === 1 && /^\d{2}$/.test(currentFilteredValue) && !newValue.endsWith('/')) {
        currentFilteredValue += '/';
    }
    if (currentFilteredValue.length === 7 && previousValue.length === 6 && /^\d{2}\/\d{4}$/.test(currentFilteredValue) && !newValue.endsWith(' - ')) {
        currentFilteredValue += ' - ';
    }
    const separatorIdx = currentFilteredValue.indexOf(' - ');
    if (separatorIdx !== -1 && currentFilteredValue.length === separatorIdx + 4 && previousValue.length === separatorIdx + 3 && /[2-9]/.test(currentFilteredValue.slice(-1))) {
        currentFilteredValue = currentFilteredValue.slice(0, -1) + '0' + currentFilteredValue.slice(-1);
    }
    if (currentFilteredValue.length === separatorIdx + 5 && previousValue.length === separatorIdx + 4 && /^\d{2}\/\d{4}\s-\s\d{2}$/.test(currentFilteredValue) && !newValue.endsWith('/')) {
      currentFilteredValue += '/';
    }

    if (currentFilteredValue.length > 17) {
      currentFilteredValue = currentFilteredValue.substring(0, 17);
    }
    
    setInputValues(prev => ({ ...prev, [rangeId]: currentFilteredValue }));
    setInputValidationStatus(prev => ({...prev, [rangeId]: 'neutral'}));
  };

  const handleRangeInputBlur = (rangeId: string, currentValue: string, type: RowType) => {
    const isPending = (type === 'work' ? pendingWorkInputs : pendingGapInputs).includes(rangeId);
    const isDefaultInput = rangeId.startsWith('default-');
    const parsed = parseDateRangeString(currentValue, timelineMonths);
    
    const setSelectedMonths = type === 'work' ? setWorkSelectedMonths : setGapSelectedMonths;
    const dateRanges = type === 'work' ? workDateRanges : gapDateRanges;
    const setPendingInputs = type === 'work' ? setPendingWorkInputs : setGapPendingInputs;
    const setRangeInputValues = type === 'work' ? setWorkRangeInputValues : setGapRangeInputValues;

    const originalRange = dateRanges.find(r => r.id === rangeId);

    if (currentValue.trim() === '') {
      setInputValidationStatus(prev => ({ ...prev, [rangeId]: 'neutral' }));
      if (isPending) { // A pending input that's cleared on blur is removed
        setPendingInputs(prev => prev.filter(id => id !== rangeId));
        setRangeInputValues(prev => {
          const newState = {...prev};
          delete newState[rangeId];
          return newState;
        });
        setInputValidationStatus(prev => {
            const newState = {...prev};
            delete newState[rangeId];
            return newState;
        });
      } else if (originalRange && !isDefaultInput) { // An existing range, if cleared, removes its selection
        setSelectedMonths(prevSelected => {
          const newSelected = new Set(prevSelected);
          const oldMonthsToRemove = getMonthIdsInRange(originalRange.start.id, originalRange.end.id, timelineMonths);
          oldMonthsToRemove.forEach(id => newSelected.delete(id));
          return newSelected;
        });
      } else if (isDefaultInput) { // If default input is cleared, just ensure its value is empty in state
         setRangeInputValues(prev => {
            const newState = { ...prev };
            delete newState[rangeId]; // Or set to '', which might be handled by the component structure
            return newState;
        });
      }
      return;
    }

    if (parsed && parsed.startMonthId && parsed.endMonthId) {
      setInputValidationStatus(prev => ({ ...prev, [rangeId]: 'valid' }));
      setSelectedMonths(prevSelected => {
        const newSelected = new Set(prevSelected);
        if (!isPending && !isDefaultInput && originalRange) {
          const oldMonthsToRemove = getMonthIdsInRange(originalRange.start.id, originalRange.end.id, timelineMonths);
          oldMonthsToRemove.forEach(id => newSelected.delete(id));
        }
        const newMonthsToAdd = getMonthIdsInRange(parsed.startMonthId as string, parsed.endMonthId as string, timelineMonths);
        newMonthsToAdd.forEach(id => newSelected.add(id));
        return newSelected;
      });
      if (isPending) {
        setPendingInputs(prev => prev.filter(id => id !== rangeId));
      }
      if (isDefaultInput) { 
         setRangeInputValues(prev => {
            const newState = { ...prev };
            delete newState[rangeId];
            return newState;
        });
      }
    } else {
      setInputValidationStatus(prev => ({ ...prev, [rangeId]: 'invalid' }));
      if (!isPending && !isDefaultInput && originalRange) { 
        setSelectedMonths(prevSelected => {
            const newSelected = new Set(prevSelected);
            const oldMonthsToRemove = getMonthIdsInRange(originalRange.start.id, originalRange.end.id, timelineMonths);
            oldMonthsToRemove.forEach(id => newSelected.delete(id));
            return newSelected;
        });
      }
    }
  };

  const handleAddPendingInput = (type: RowType) => {
    const tempId = `temp-${type}-${Date.now()}`;
    if (type === 'work') {
      setPendingWorkInputs(prev => [...prev, tempId]);
      setWorkRangeInputValues(prev => ({...prev, [tempId]: ''}));
    } else {
      setPendingGapInputs(prev => [...prev, tempId]);
      setGapRangeInputValues(prev => ({...prev, [tempId]: ''}));
    }
    setInputValidationStatus(prev => ({...prev, [tempId]: 'neutral'}));
  };

  const handleClearInput = (rangeId: string, type: RowType) => {
    const isWork = type === 'work';
    const setInputValues = isWork ? setWorkRangeInputValues : setGapRangeInputValues;
    const dateRanges = isWork ? workDateRanges : gapDateRanges;
    const setSelectedMonths = isWork ? setWorkSelectedMonths : setGapSelectedMonths;
    const pendingInputs = isWork ? pendingWorkInputs : pendingGapInputs;
    const setPendingInputs = isWork ? setPendingWorkInputs : setGapPendingInputs;
  
    setInputValues(prev => ({ ...prev, [rangeId]: '' }));
    setInputValidationStatus(prev => ({ ...prev, [rangeId]: 'neutral' }));
  
    const existingRange = dateRanges.find(r => r.id === rangeId);
    if (existingRange) {
      setSelectedMonths(prevSelected => {
        const newSelected = new Set(prevSelected);
        const monthsToRemove = getMonthIdsInRange(existingRange.start.id, existingRange.end.id, timelineMonths);
        monthsToRemove.forEach(id => newSelected.delete(id));
        return newSelected;
      });
    } else if (pendingInputs.includes(rangeId)) {
      setPendingInputs(prev => prev.filter(id => id !== rangeId));
      setInputValues(prev => {
        const newState = { ...prev };
        delete newState[rangeId];
        return newState;
      });
      setInputValidationStatus(prev => {
        const newState = { ...prev };
        delete newState[rangeId];
        return newState;
      });
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

    let hasExplicitLongExplainedGapRelevantToWork = false;
    let hasAtLeastOneSignificantUnexplainedGap = false;
    let hadAnySignificantPotentialGapsAtAllRelevantToWork = false;

    let firstSelectedWorkMonthIndex = -1;
    if (workSelectedMonths.size > 0) {
        const sortedWorkMonths = timelineMonths
            .filter(m => workSelectedMonths.has(m.id))
            .sort((a,b) => timelineMonths.findIndex(tm => tm.id === a.id) - timelineMonths.findIndex(tm => tm.id === b.id));
        if (sortedWorkMonths.length > 0) {
            firstSelectedWorkMonthIndex = timelineMonths.findIndex(m => m.id === sortedWorkMonths[0].id);
        }
    }

    for (const gapRange of gapDateRanges) {
        const gapDuration = getMonthsDurationInDateRange(gapRange, timelineMonths);
        if (gapDuration >= significantGapThresholdMonths) {
            const gapStartIndex = timelineMonths.findIndex(m => m.id === gapRange.start.id);
            if (firstSelectedWorkMonthIndex === -1 || gapStartIndex >= firstSelectedWorkMonthIndex || timelineMonths.findIndex(m => m.id === gapRange.end.id) >= firstSelectedWorkMonthIndex) {
                 hasExplicitLongExplainedGapRelevantToWork = true;
                 break;
            }
        }
    }

    if (firstSelectedWorkMonthIndex === -1) {
      if (hasExplicitLongExplainedGapRelevantToWork) {
        currentStatusMessage = 'Employment gap found with an explanation.';
      } else {
        currentStatusMessage = 'No employment gap found. There is continuous employment from first working date.';
      }
      setWorkInternalGapMonths(new Set());
      setGapStatusMessage(currentStatusMessage);
      return;
    }

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

      const gapEndIndexInTimeline = timelineMonths.findIndex(m => m.id === potentialGapMonthData[potentialGapMonthData.length - 1].id);

      if (gapEndIndexInTimeline < firstSelectedWorkMonthIndex) {
        continue;
      }

      if (potentialGapMonthData.length >= significantGapThresholdMonths) {
        hadAnySignificantPotentialGapsAtAllRelevantToWork = true;

        const unexplainedPortionOfThisGap = potentialGapMonthData.filter(
          m => !gapSelectedMonths.has(m.id)
        );

        if (unexplainedPortionOfThisGap.length >= significantGapThresholdMonths) {
          hasAtLeastOneSignificantUnexplainedGap = true;
          unexplainedPortionOfThisGap.forEach(m => newInternalGapMonthsForOutline.add(m.id));
        }
      }
    }

    if (hasAtLeastOneSignificantUnexplainedGap) {
      currentStatusMessage = 'Employment gap found without any explanation > Consider making outreach to the provider for explanation.';
    } else if (hasExplicitLongExplainedGapRelevantToWork || hadAnySignificantPotentialGapsAtAllRelevantToWork) {
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

  const helpArticleHtml = `
    <h3 class="text-lg font-semibold mb-3 text-primary">Quick Guide: Pandey's Work History Visualizer</h3>
    <p class="mb-2 text-sm">
        Welcome! This tool helps you visually track your work and gap history over the last 5 years.
    </p>

    <h4 class="text-md font-semibold mt-4 mb-1 text-foreground">1. Understanding the Timeline:</h4>
    <ul class="list-disc list-inside text-sm space-y-1 pl-2 text-muted-foreground">
        <li>The main grid shows months for the past 5 years, plus the current month.</li>
        <li>Year labels appear above their respective 12-month segments.</li>
    </ul>

    <h4 class="text-md font-semibold mt-4 mb-1 text-foreground">2. Selecting Periods:</h4>
    <ul class="list-disc list-inside text-sm space-y-1 pl-2 text-muted-foreground">
        <li><strong>Work History Row:</strong> Click a start month, then an end month to mark a work period. Selected work periods are green.</li>
        <li><strong>Gap History Row:</strong> Similarly, click to mark periods when you were not working. Selected gap periods are brown.</li>
        <li>You can define multiple, separate ranges in both rows.</li>
    </ul>

    <h4 class="text-md font-semibold mt-4 mb-1 text-foreground">3. Date Inputs:</h4>
    <ul class="list-disc list-inside text-sm space-y-1 pl-2 text-muted-foreground">
        <li>Selections on the timeline automatically create date range inputs (e.g., "MM/YYYY - MM/YYYY") below.</li>
        <li>You can also manually type or edit these date inputs. Changes here will reflect back on the timeline.</li>
        <li>Use the "+" button to add a new date range input.</li>
        <li>Inputs show a green border for valid dates, red for invalid after you edit them.</li>
    </ul>

    <h4 class="text-md font-semibold mt-4 mb-1 text-foreground">4. Resetting:</h4>
    <ul class="list-disc list-inside text-sm space-y-1 pl-2 text-muted-foreground">
        <li>Use the "Reset" icon (circular arrow) at the end of each row to clear all selections for that specific row.</li>
    </ul>

    <h4 class="text-md font-semibold mt-4 mb-1 text-foreground">5. Gap Analysis:</h4>
    <ul class="list-disc list-inside text-sm space-y-1 pl-2 text-muted-foreground">
        <li>The tool automatically analyzes your entries to identify significant employment gaps.</li>
        <li>A "significant gap" is a period not covered by "Work History" that meets a minimum length (configurable in Settings, defaults to 6 months).</li>
        <li><strong>Red Outlines:</strong> Significant unexplained gaps <em>within or after</em> your declared "Work History" are highlighted with a red outline on the "Work History" timeline.</li>
        <li><strong>Status Messages:</strong> A message at the bottom provides an overall status.</li>
    </ul>

    <h4 class="text-md font-semibold mt-4 mb-1 text-foreground">6. Settings (Cog Icon <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings inline align-baseline"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>):</h4>
    <ul class="list-disc list-inside text-sm space-y-1 pl-2 text-muted-foreground">
        <li>Adjust the "Minimum Significant Gap (Months)" to define what constitutes a significant gap. This setting is saved for your next visit.</li>
    </ul>

    <p class="mt-4 text-xs text-muted-foreground opacity-80">
        <strong>Important Note:</strong> This visualizer is an aid. Always review your entries and the timeline carefully to ensure accuracy.
    </p>
  `;

  const workInfoTooltipContent = (
    <div className="space-y-1.5 p-2 max-w-xs">
      <p className="text-sm font-semibold text-foreground">Work Period Input Guide</p>
      <p className="text-xs text-muted-foreground">
        Enter dates for your work periods. Use the format <code className="bg-muted px-1 py-0.5 rounded text-xs">MM/YYYY</code>.
      </p>
      <div className="mt-1">
        <p className="text-xs text-muted-foreground font-medium">For a single month (e.g., March 2023):</p>
        <code className="block bg-muted px-1.5 py-0.5 rounded text-xs mt-0.5">03/2023</code>
      </div>
      <div className="mt-1.5">
        <p className="text-xs text-muted-foreground font-medium">For a date range (e.g., Jan 2023 to May 2023):</p>
        <code className="block bg-muted px-1.5 py-0.5 rounded text-xs mt-0.5">01/2023 - 05/2023</code>
      </div>
      <p className="text-xs text-muted-foreground pt-1.5">
        Allowed characters: numbers, <code className="bg-muted px-1 py-0.5 rounded text-xs">/</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">-</code>, and space.
        The tool will assist with <code className="bg-muted px-1 py-0.5 rounded text-xs">/</code> and <code className="bg-muted px-1 py-0.5 rounded text-xs">-</code> as you type.
      </p>
      <p className="text-xs text-muted-foreground pt-1">Dates must be within the displayed 5-year timeline.</p>
    </div>
  );
  
  const gapInfoTooltipContent = (
     <div className="space-y-1.5 p-2 max-w-xs">
      <p className="text-sm font-semibold text-foreground">Gap Period Input Guide</p>
      <p className="text-xs text-muted-foreground">
        Enter dates for non-working periods. Use format <code className="bg-muted px-1 py-0.5 rounded text-xs">MM/YYYY</code>.
      </p>
      <div className="mt-1">
        <p className="text-xs text-muted-foreground font-medium">For a one-month gap (e.g., July 2022):</p>
        <code className="block bg-muted px-1.5 py-0.5 rounded text-xs mt-0.5">07/2022</code>
      </div>
      <div className="mt-1.5">
        <p className="text-xs text-muted-foreground font-medium">For a multi-month gap (e.g., Nov 2023 to Feb 2024):</p>
        <code className="block bg-muted px-1.5 py-0.5 rounded text-xs mt-0.5">11/2023 - 02/2024</code>
      </div>
      <p className="text-xs text-muted-foreground pt-1.5">
        You can use: numbers, <code className="bg-muted px-1 py-0.5 rounded text-xs">/</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">-</code>, space.
        Separators <code className="bg-muted px-1 py-0.5 rounded text-xs">/</code> and <code className="bg-muted px-1 py-0.5 rounded text-xs">-</code> may be auto-inserted.
      </p>
      <p className="text-xs text-muted-foreground pt-1">Ensure dates fall within the displayed timeline.</p>
    </div>
  );


  const renderDateInputs = (type: RowType): JSX.Element[] => {
    const ranges = type === 'work' ? workDateRanges : gapDateRanges;
    const inputValues = type === 'work' ? workRangeInputValues : gapRangeInputValues;
    const pendingInputs = type === 'work' ? pendingWorkInputs : pendingGapInputs;
    const defaultInputId = `default-${type}-input`;

    const allInputElements: JSX.Element[] = [];

    const createInputJsx = (id: string, value: string, isDefault: boolean, index: number) => {
        const status = inputValidationStatus[id] || 'neutral';
        let inputClassName = "text-sm w-48 pr-8"; // Added pr-8 for clear button
        if (status === 'valid') {
            inputClassName = cn(inputClassName, "border-green-500 ring-1 ring-green-500 focus-visible:ring-green-500");
        } else if (status === 'invalid') {
            inputClassName = cn(inputClassName, "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500");
        }
        return (
            <div key={id} className="relative flex items-center">
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => handleRangeInputChange(id, e.target.value, type)}
                  onBlur={(e) => handleRangeInputBlur(id, e.target.value, type)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRangeInputBlur(id, (e.target as HTMLInputElement).value, type);
                    }
                  }}
                  placeholder="MM/YYYY - MM/YYYY"
                  className={inputClassName}
                  aria-label={`${type} date range input ${isDefault ? 'new' : index + 1}`}
                />
                {value && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleClearInput(id, type)}
                    aria-label={`Clear ${type} date range ${id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
            </div>
        );
    };
    
    ranges.forEach((range, index) => {
        const id = range.id;
        const value = inputValues[id] || range.text || '';
        allInputElements.push(createInputJsx(id, value, false, index));
    });

    pendingInputs.forEach((id, index) => {
        const value = inputValues[id] || '';
        allInputElements.push(createInputJsx(id, value, false, ranges.length + index));
    });
    
    if (allInputElements.length === 0) {
        const value = inputValues[defaultInputId] || '';
        allInputElements.push(createInputJsx(defaultInputId, value, true, 0));
    }

    return allInputElements;
  };


  return (
    <div className="space-y-1 w-full" style={{
        ['--row-label-width-px' as string]: `${ROW_LABEL_WIDTH_PX}px`,
        ['--reset-button-width-px' as string]: `${RESET_BUTTON_WIDTH_PX}px`,
        ['--reset-button-margin-px' as string]: `${RESET_BUTTON_MARGIN_PX}px`,
    }}>
      <div className="flex justify-end items-center mb-4 mr-1 space-x-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Help & Usage Guide">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>Help & Usage Guide</SheetTitle>
            </SheetHeader>
            <div className="p-4 space-y-2" dangerouslySetInnerHTML={{ __html: helpArticleHtml }} />
          </SheetContent>
        </Sheet>

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
                      if (!isNaN(val)) {
                        if (val < 1) val = 1;
                        if (val > 60) val = 60;
                        setSignificantGapThresholdMonths(val);
                      } else {
                         setSignificantGapThresholdMonths(1); 
                      }
                  }}
                  className="text-sm w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Defines the minimum number of consecutive unselected months to be considered a significant gap. Defaults to 6. Accepts values between 1 and 60.
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
        {[
          { type: 'work', label: 'Work History Dates', tooltipContent: workInfoTooltipContent },
          { type: 'gap', label: 'Gap History Dates', tooltipContent: gapInfoTooltipContent }
        ].map(({ type, label, tooltipContent }) => (
          <div key={type} className="flex items-start">
            <div style={{ width: `var(--row-label-width-px)` }} className="flex-shrink-0 pr-1 pt-2 text-xs font-medium text-primary text-right flex items-center justify-end">
                <span>{label}</span>
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0 ml-1 flex-shrink-0" aria-label={`${type} date format help`}>
                                <Info size={14} className="text-muted-foreground" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background text-foreground border shadow-lg p-0 rounded-md max-w-xs" side="top" align="start">
                           {tooltipContent}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="flex items-center gap-2 pl-2">
                <div className="flex flex-wrap gap-2 items-center">
                    {renderDateInputs(type as RowType)}
                </div>
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleAddPendingInput(type as RowType)} className="h-9 w-9 flex-shrink-0" aria-label={`Add ${type} period`}>
                                <PlusCircle size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Add new {type} period</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-[100px] text-center">
        <p className="text-muted-foreground text-sm">{gapStatusMessage}</p>
        <p className="mt-4 text-xs text-muted-foreground opacity-70">
          Note: This visualizer is a tool to aid in tracking history. Please review all entries and the timeline carefully to ensure accuracy.
        </p>
      </div>
    </div>
  );
};

export default ChronoSelectClient;
    
