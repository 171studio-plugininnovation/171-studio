import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  ShieldCheck, User, Check, Info, CalendarOff, Ban, Sparkles, AlertCircle
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { BookingRecord, CalendarSlotDef, DEFAULT_WEEKLY_TIME_SLOTS } from '../types/cms';
import { generateDynamicSlots, DynamicSlot, STUDIO_OPEN_TIME, STUDIO_CLOSE_TIME } from '../utils/calendarSlots';
import { formatDurationLabel } from '../utils/pricing';

export type TimeSlotDef = CalendarSlotDef;
export const STUDIO_TIME_SLOTS = DEFAULT_WEEKLY_TIME_SLOTS;

interface BookingCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  selectedTime: string; // HH:MM
  onSelectTime: (timeStr: string) => void;
  estimatedHours: number;
  preferredFascia?: 'tutti' | 'pomeriggio' | 'sera';
  onSelectFascia?: (fascia: 'tutti' | 'pomeriggio' | 'sera') => void;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  estimatedHours,
  preferredFascia = 'tutti',
  onSelectFascia,
}) => {
  const { currentUser, openAuthModal, bookings, siteContent } = useStudio();

  // Internal state for calendar month navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date();
  });

  const [internalPeriodFilter, setInternalPeriodFilter] = useState<'tutti' | 'pomeriggio' | 'sera'>(preferredFascia);

  const activePeriodFilter = onSelectFascia ? preferredFascia : internalPeriodFilter;
  const setPeriodFilter = (f: 'tutti' | 'pomeriggio' | 'sera') => {
    if (onSelectFascia) {
      onSelectFascia(f);
    } else {
      setInternalPeriodFilter(f);
    }
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [today]);

  // Master blocked commitments (dates or specific slots)
  const blockedCommitments = useMemo(() => {
    return siteContent.calendarSettings?.blockedCommitments || [];
  }, [siteContent.calendarSettings?.blockedCommitments]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(todayStr);
  };

  // Month name formatting (Italian)
  const monthName = useMemo(() => {
    return currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  // Generate calendar days for the current month grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const totalDays = lastDayOfMonth.getDate();

    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevPaddingDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean; isPast: boolean; isSunday: boolean }> = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      prevDate.setHours(0, 0, 0, 0);
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayNum).padStart(2, '0');
      prevPaddingDays.push({
        dateStr: `${prevDate.getFullYear()}-${m}-${d}`,
        dayNum,
        isCurrentMonth: false,
        isPast: prevDate < today,
        isSunday: prevDate.getDay() === 0,
      });
    }

    const currentMonthDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean; isPast: boolean; isSunday: boolean }> = [];
    for (let d = 1; d <= totalDays; d++) {
      const thisDate = new Date(year, month, d);
      thisDate.setHours(0, 0, 0, 0);
      const m = String(month + 1).padStart(2, '0');
      const dayFormatted = String(d).padStart(2, '0');
      currentMonthDays.push({
        dateStr: `${year}-${m}-${dayFormatted}`,
        dayNum: d,
        isCurrentMonth: true,
        isPast: thisDate < today,
        isSunday: thisDate.getDay() === 0,
      });
    }

    const totalCells = prevPaddingDays.length + currentMonthDays.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    const nextPaddingDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean; isPast: boolean; isSunday: boolean }> = [];
    for (let d = 1; d <= remainingCells; d++) {
      const nextDate = new Date(year, month + 1, d);
      nextDate.setHours(0, 0, 0, 0);
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dayFormatted = String(d).padStart(2, '0');
      nextPaddingDays.push({
        dateStr: `${nextDate.getFullYear()}-${m}-${dayFormatted}`,
        dayNum: d,
        isCurrentMonth: false,
        isPast: false,
        isSunday: nextDate.getDay() === 0,
      });
    }

    return [...prevPaddingDays, ...currentMonthDays, ...nextPaddingDays];
  }, [currentMonth, today]);

  // Calculate day availability dynamically based on selected duration and existing bookings
  const getDayAvailability = (dateStr: string) => {
    const fullDayBlock = blockedCommitments.find(b => b.date === dateStr && b.allDay);
    if (fullDayBlock) {
      return { 
        status: 'impegno', 
        label: 'Impegno Master', 
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40', 
        count: 0,
        isBlocked: true,
        blockReason: fullDayBlock.reason || 'Impegno riservato'
      };
    }

    const slots = generateDynamicSlots({
      date: dateStr,
      durationHours: estimatedHours,
      preferredFascia: 'tutti',
      existingBookings: bookings,
      blockedCommitments,
    });

    const freeSlots = slots.filter(s => s.isAvailable);
    const count = freeSlots.length;

    if (count === 0) {
      return { 
        status: 'pieno', 
        label: 'Al completo', 
        badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40', 
        count: 0,
        isBlocked: false
      };
    }
    if (count <= 2) {
      return { 
        status: 'quasi_pieno', 
        label: `${count} slot`, 
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40', 
        count,
        isBlocked: false
      };
    }
    return { 
      status: 'libero', 
      label: `${count} liberi`, 
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', 
      count,
      isBlocked: false
    };
  };

  // Check if current selected date is all-day blocked
  const selectedDateAllDayBlock = useMemo(() => {
    if (!selectedDate) return null;
    return blockedCommitments.find(b => b.date === selectedDate && b.allDay) || null;
  }, [blockedCommitments, selectedDate]);

  // Dynamic slots generated for the currently selected date and duration!
  // This automatically adapts subsequent slots when a 1-hour or multi-hour session is booked!
  const dynamicSlotsForSelectedDate: DynamicSlot[] = useMemo(() => {
    if (!selectedDate) return [];
    return generateDynamicSlots({
      date: selectedDate,
      durationHours: estimatedHours,
      preferredFascia: activePeriodFilter,
      existingBookings: bookings,
      blockedCommitments,
    });
  }, [selectedDate, estimatedHours, activePeriodFilter, bookings, blockedCommitments]);

  // Auto-adapt selectedTime if it becomes invalid or blocked
  useEffect(() => {
    if (!selectedDate || dynamicSlotsForSelectedDate.length === 0) return;
    const currentSlot = dynamicSlotsForSelectedDate.find(s => s.startTime === selectedTime);
    if (!currentSlot || !currentSlot.isAvailable) {
      const firstAvailable = dynamicSlotsForSelectedDate.find(s => s.isAvailable);
      if (firstAvailable) {
        onSelectTime(firstAvailable.startTime);
      }
    }
  }, [selectedDate, estimatedHours, dynamicSlotsForSelectedDate, selectedTime, onSelectTime]);

  // Italian date label for the selected date
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return 'Nessuna data selezionata';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Handle day click
  const handleDayClick = (dateStr: string, isPast: boolean) => {
    if (isPast) return;
    onSelectDate(dateStr);

    const fullDayBlock = blockedCommitments.find(b => b.date === dateStr && b.allDay);
    if (!fullDayBlock) {
      const candidateSlots = generateDynamicSlots({
        date: dateStr,
        durationHours: estimatedHours,
        preferredFascia: activePeriodFilter,
        existingBookings: bookings,
        blockedCommitments,
      });
      const firstFree = candidateSlots.find(s => s.isAvailable);
      if (firstFree) {
        onSelectTime(firstFree.startTime);
      }
    }
  };

  const customNotice = siteContent.calendarSettings?.calendarNotice;

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Calendar Header Card with Live Dynamic Adjustment Notice */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-heading font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Disponibilità Orari Dinamici in Tempo Reale</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-semibold">
                ORARI 15:00 - 20:00
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                CALCOLO ADATTIVO
              </span>
            </h3>
            <p className="text-xs text-neutral-300 font-light mt-0.5">
              Se un artista prenota un'ora nel pomeriggio, gli orari delle sessioni successive si ricalcolano automaticamente per garantire la massima continuità.
            </p>
          </div>
        </div>

        {/* User state indicator */}
        {currentUser ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Account: {currentUser.name.split(' ')[0]}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('Accedi per gestire le tue prenotazioni o registrarti')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>Accedi / Registrati</span>
          </button>
        )}
      </div>

      {/* Optional Custom Studio Notice Banner */}
      {customNotice && (
        <div className="p-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 flex items-center gap-3 text-xs text-neutral-200 font-mono">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-400">Nota Master Studio:</strong> {customNotice}
          </span>
        </div>
      )}

      {/* Main Grid: Calendar on Left, Slot Selector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Interactive Monthly Calendar (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-neutral-950/90 border border-neutral-800/80 backdrop-blur-xl flex flex-col justify-between shadow-xl">
          
          {/* Month Navigation Toolbar */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                MESE CORRENTE
              </span>
              <h4 className="text-lg sm:text-xl font-heading font-bold text-white capitalize">
                {monthName}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Torna a oggi"
              >
                Oggi
              </button>

              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Mese precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  aria-label="Mese successivo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, idx) => (
              <span
                key={day}
                className={`text-[11px] font-mono font-semibold uppercase tracking-wider py-1 ${
                  idx >= 5 ? 'text-amber-400/80' : 'text-neutral-400'
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((item, index) => {
              const isSelected = selectedDate === item.dateStr;
              const isToday = item.dateStr === todayStr;
              const availability = item.isCurrentMonth && !item.isPast 
                ? getDayAvailability(item.dateStr) 
                : null;

              const isDayBlockedByMaster = availability?.isBlocked;

              return (
                <button
                  key={`${item.dateStr}-${index}`}
                  type="button"
                  disabled={item.isPast || !item.isCurrentMonth}
                  onClick={() => handleDayClick(item.dateStr, item.isPast)}
                  className={`relative flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl text-center min-h-[64px] sm:min-h-[72px] transition-all border ${
                    !item.isCurrentMonth
                      ? 'opacity-20 border-transparent text-neutral-600 cursor-not-allowed'
                      : item.isPast
                      ? 'opacity-30 border-neutral-900 bg-neutral-950/40 text-neutral-500 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-gradient-to-b from-amber-500/25 to-amber-600/10 border-amber-400 shadow-lg shadow-amber-500/20 text-white font-bold ring-2 ring-amber-400/50'
                      : isDayBlockedByMaster
                      ? 'bg-red-950/20 border-red-900/60 hover:border-red-500/60 text-neutral-300 cursor-pointer'
                      : 'bg-neutral-900/60 border-neutral-800/80 hover:border-amber-500/50 hover:bg-neutral-900 text-neutral-200 cursor-pointer'
                  }`}
                  title={isDayBlockedByMaster ? `Impegno Master: ${availability?.blockReason}` : undefined}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs sm:text-sm font-mono ${isSelected ? 'text-amber-300 font-bold' : ''}`}>
                      {item.dayNum}
                    </span>
                    <div className="flex items-center gap-1">
                      {isDayBlockedByMaster && (
                        <span title="Impegno Master / Riservato">
                          <Ban className="w-3 h-3 text-red-400" />
                        </span>
                      )}
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Oggi" />
                      )}
                    </div>
                  </div>

                  {availability && (
                    <div className="w-full flex flex-col items-center gap-0.5 mt-auto pt-1">
                      <span className={`text-[9px] font-mono leading-none px-1 py-0.5 rounded border ${availability.badgeColor} max-w-full truncate`}>
                        {isDayBlockedByMaster ? 'Impegno' : availability.count === 0 ? 'Pieno' : `${availability.count} slot`}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-neutral-900 text-[11px] font-mono text-neutral-400">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Slot Liberi</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Pochi slot</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Completo / Impegno</span>
              </span>
            </div>

            <span className="text-[10px] text-amber-400/90 font-semibold">
              Orari: 15:00 - 20:00 (Durata: {formatDurationLabel(estimatedHours)})
            </span>
          </div>

        </div>

        {/* RIGHT: Slot Time Availability & Dynamic Adaptation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/90 border border-neutral-800/80 backdrop-blur-xl flex flex-col justify-between shadow-xl flex-1">
            
            {/* Header: Selected Date & Fascia Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>ORARIO DI INIZIO (15:00 - 20:00)</span>
                </span>
                {selectedDate && (
                  <span className="text-xs font-mono text-amber-400 font-semibold">
                    {selectedDate}
                  </span>
                )}
              </div>

              <h4 className="text-sm sm:text-base font-heading font-bold text-white capitalize mb-3">
                {formattedSelectedDate}
              </h4>

              {/* Master Full-Day Commitment Warning */}
              {selectedDateAllDayBlock ? (
                <div className="mb-4 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase mb-1">
                    <CalendarOff className="w-4 h-4 text-red-400" />
                    <span>Data Riservata / Impegno Master</span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    {selectedDateAllDayBlock.reason || 'Il Master ha registrato un impegno per l\'intera giornata.'}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-400 mt-2">
                    Si prega di selezionare un'altra data disponibile nel calendario a fianco.
                  </p>
                </div>
              ) : null}

              {/* Fascia Oraria Preferita Tabs */}
              <div className="mb-3">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Fascia Oraria Preferita:
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[10px] font-mono uppercase">
                  {(['tutti', 'pomeriggio', 'sera'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPeriodFilter(tab)}
                      className={`py-1 rounded-lg text-center font-medium transition-colors cursor-pointer ${
                        activePeriodFilter === tab
                          ? 'bg-amber-500 text-black font-bold shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {tab === 'tutti' ? 'Tutte' : tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic slot count indicator */}
            {!selectedDateAllDayBlock && (
              <div className="mb-3 px-3 py-1.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-[11px] font-mono flex items-center justify-between">
                <span className="text-neutral-400">
                  Sessioni ({formatDurationLabel(estimatedHours)}):
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {dynamicSlotsForSelectedDate.filter(s => s.isAvailable).length} opzioni disponibili
                </span>
              </div>
            )}

            {/* Dynamic Slot List */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {selectedDateAllDayBlock ? (
                <div className="p-8 text-center text-neutral-500 text-xs font-mono border border-dashed border-neutral-800 rounded-xl">
                  Nessun orario prenotabile per questa data riservata.
                </div>
              ) : dynamicSlotsForSelectedDate.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 text-xs font-mono">
                  Nessun orario per la fascia selezionata.
                </div>
              ) : (
                dynamicSlotsForSelectedDate.map(slot => {
                  const isAvailable = slot.isAvailable;
                  const isCurrent = selectedTime === slot.startTime;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => {
                        if (isAvailable) onSelectTime(slot.startTime);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                        isCurrent
                          ? 'bg-gradient-to-r from-amber-500/30 via-amber-500/15 to-transparent border-amber-400 text-white shadow-md shadow-amber-500/20 ring-1 ring-amber-400 cursor-pointer'
                          : !isAvailable
                          ? 'bg-neutral-950/60 border-neutral-900 text-neutral-500 opacity-60 cursor-not-allowed'
                          : 'bg-neutral-900/80 border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/80 text-neutral-200 cursor-pointer'
                      }`}
                      title={slot.conflictReason}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs ${
                          isCurrent
                            ? 'bg-amber-500 text-black font-bold'
                            : !isAvailable
                            ? 'bg-neutral-900 text-neutral-600'
                            : 'bg-neutral-800 group-hover:bg-amber-500/20 text-neutral-300 group-hover:text-amber-300'
                        }`}>
                          <Clock className="w-4 h-4" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold font-mono text-white">
                              {slot.startTime} ➔ {slot.endTime}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {formatDurationLabel(estimatedHours)}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-400 capitalize block mt-0.5">
                            {slot.conflictReason ? slot.conflictReason : `Fascia ${slot.period}`}
                          </span>
                        </div>
                      </div>

                      {/* Right Slot Status Badge */}
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-black text-[10px] font-mono font-bold uppercase tracking-wider">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Scelto</span>
                          </span>
                        ) : !isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono uppercase tracking-wider">
                            <span>Occupato</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-wider group-hover:bg-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Libero</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Info Note */}
            <div className="mt-4 pt-3 border-t border-neutral-900 flex items-start gap-2 text-[11px] font-light text-neutral-400">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {selectedTime ? (
                  <span>
                    Orario impostato: <strong className="text-amber-400 font-mono font-semibold">{selectedTime}</strong> per {formatDurationLabel(estimatedHours)}. 
                    Gli orari si adeguano automaticamente in base alle altre sessioni già confermate.
                  </span>
                ) : (
                  <span>Seleziona un orario libero a partire dalle 15:00 per proseguire.</span>
                )}
              </span>
            </div>

          </div>

          {/* User Active Bookings Preview */}
          {currentUser && (
            <UserActiveBookingsPanel 
              userEmail={currentUser.email} 
              onSelectBookingDate={(d, t) => {
                onSelectDate(d);
                onSelectTime(t);
              }}
            />
          )}

        </div>

      </div>

    </div>
  );
};

interface UserActiveBookingsPanelProps {
  userEmail: string;
  onSelectBookingDate: (date: string, time: string) => void;
}

const UserActiveBookingsPanel: React.FC<UserActiveBookingsPanelProps> = ({
  userEmail,
  onSelectBookingDate,
}) => {
  const { bookings } = useStudio();

  const userBookings = useMemo(() => {
    return bookings.filter(b => b.userEmail.toLowerCase() === userEmail.toLowerCase());
  }, [bookings, userEmail]);

  if (userBookings.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Le Tue Sessioni in Corso ({userBookings.length})</span>
        </span>
      </div>

      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
        {userBookings.map(bk => (
          <div
            key={bk.id}
            onClick={() => onSelectBookingDate(bk.date, bk.time)}
            className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-amber-500/40 transition-colors flex items-center justify-between cursor-pointer"
            title="Visualizza questa data nel calendario"
          >
            <div>
              <span className="font-semibold text-white block">{bk.serviceTitle}</span>
              <span className="text-[11px] font-mono text-neutral-400">
                {bk.date} alle {bk.time} ({formatDurationLabel(bk.hours || 1)})
              </span>
            </div>

            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
              bk.status === 'confermata'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : bk.status === 'completata'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}>
              {bk.status === 'confermata' ? 'Confermata' : bk.status === 'in_attesa' ? 'In Attesa' : bk.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
