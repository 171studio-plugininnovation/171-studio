import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Lock, Unlock, Ban, AlertTriangle, 
  CheckCircle2, Trash2, Plus, Sparkles, Info, CalendarOff, Save, Check
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { BlockedCalendarSlot, CalendarSlotDef, DEFAULT_WEEKLY_TIME_SLOTS } from '../types/cms';

export const MasterCalendarControl: React.FC = () => {
  const { 
    siteContent, addBlockedCommitment, removeBlockedCommitment, updateCalendarSettings, activities
  } = useStudio();

  const calendarSettings = siteContent.calendarSettings;
  const availableSlots = calendarSettings?.availableSlots || DEFAULT_WEEKLY_TIME_SLOTS;
  const blockedCommitments = calendarSettings?.blockedCommitments || [];

  // Form state to block dates/hours
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [blockDate, setBlockDate] = useState<string>(todayStr);
  const [blockType, setBlockType] = useState<'all_day' | 'specific_slots'>('all_day');
  const [selectedSlotTimes, setSelectedSlotTimes] = useState<string[]>(['15:00']);
  const [blockReason, setBlockReason] = useState<string>('Impegno personale');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // General settings state
  const [defaultStartHour, setDefaultStartHour] = useState<string>(calendarSettings?.defaultStartHour || '15:00');
  const [defaultEndHour, setDefaultEndHour] = useState<string>(calendarSettings?.defaultEndHour || '20:00');
  const [calendarNotice, setCalendarNotice] = useState<string>(
    calendarSettings?.calendarNotice || 'Orario di disponibilità studio: tutti i giorni dalle 15:00 alle 20:00. Prenotazione in tempo reale.'
  );
  const [editableSlots, setEditableSlots] = useState<CalendarSlotDef[]>(availableSlots);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);

  // Quick preset reasons
  const presetReasons = [
    'Impegno personale',
    'Sessione privata master',
    'Manutenzione acustica studio',
    'Fuori sede / Trasferta',
    'Chiusura straordinaria',
  ];

  const handleToggleSlotTime = (time: string) => {
    setSelectedSlotTimes(prev => 
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) {
      setActionNotice('Seleziona una data per registrare l\'impegno.');
      return;
    }

    if (blockType === 'specific_slots' && selectedSlotTimes.length === 0) {
      setActionNotice('Seleziona almeno una fascia oraria da bloccare.');
      return;
    }

    addBlockedCommitment({
      date: blockDate,
      allDay: blockType === 'all_day',
      timeSlots: blockType === 'specific_slots' ? selectedSlotTimes : undefined,
      reason: blockReason.trim() || 'Impegno personale master',
    });

    setActionNotice(`Impegno registrato per il giorno ${blockDate}: ${blockType === 'all_day' ? 'Intera giornata bloccata' : selectedSlotTimes.join(', ')}.`);
    setTimeout(() => setActionNotice(null), 5000);

    // Reset some form parts
    setBlockReason('Impegno personale');
    setSelectedSlotTimes(['15:00']);
  };

  const handleRemoveBlock = (id: string, date: string) => {
    removeBlockedCommitment(id);
    setActionNotice(`Blocco del ${date} rimosso con successo. Gli orari sono di nuovo disponibili per le prenotazioni!`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCalendarSettings({
      defaultStartHour,
      defaultEndHour,
      calendarNotice,
      availableSlots: editableSlots,
    });
    setSettingsSavedNotice(true);
    setTimeout(() => setSettingsSavedNotice(false), 3500);
  };

  const handleToggleSlotEnabled = (slotId: string) => {
    setEditableSlots(prev => prev.map(s => 
      s.id === slotId ? { ...s, enabled: s.enabled === false ? true : false } : s
    ));
  };

  // Sort blocked commitments by date ascending
  const sortedBlocks = useMemo(() => {
    return [...blockedCommitments].sort((a, b) => a.date.localeCompare(b.date));
  }, [blockedCommitments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Alert Notice */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionNotice(null)}
            className="text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats / Calendar Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Orari Studio Ogni Giorno
            </span>
            <span className="text-2xl font-heading font-black text-white">
              {defaultStartHour} - {defaultEndHour}
            </span>
            <span className="text-[10px] text-amber-400 font-mono block">
              Disponibilità ordinaria attiva tutti i giorni
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Impegni & Blocchi Attivi
            </span>
            <span className="text-2xl font-heading font-black text-amber-400">
              {blockedCommitments.length}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono block">
              Date o slot riservati dal Master
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Slot Disponibili al Giorno
            </span>
            <span className="text-2xl font-heading font-black text-emerald-400">
              {editableSlots.filter(s => s.enabled !== false).length} Fasce
            </span>
            <span className="text-[10px] text-emerald-300 font-mono block">
              Pomeriggio & Sera (2 ore ciascuna)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Block Commitment Form + Active Blocks List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Add Commitment / Block Hours Form (6 cols) */}
        <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-neutral-900/70 border border-amber-500/30 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <CalendarOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-heading font-bold text-white flex items-center gap-2">
                  <span>Registra Impegno o Chiusura</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 uppercase font-semibold">
                    BLOCCA CALENDARIO
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 font-light">
                  Se hai impegni personali o lo studio è occupato, blocca la giornata o specifici orari per evitare che gli artisti prenotino.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateBlock} className="space-y-4">
              
              {/* Date selection */}
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Data dell'Impegno / Chiusura *</span>
                </label>
                <input
                  type="date"
                  value={blockDate}
                  min={todayStr}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-white focus:border-amber-400 outline-none"
                  required
                />
              </div>

              {/* Mode Selection: All Day vs Specific Slots */}
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                  Tipo di Blocco
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBlockType('all_day')}
                    className={`p-3 rounded-xl border text-xs font-mono text-center transition-all cursor-pointer ${
                      blockType === 'all_day'
                        ? 'bg-red-500/20 border-red-500 text-white font-bold ring-1 ring-red-400'
                        : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Ban className="w-4 h-4 mx-auto mb-1 text-red-400" />
                    <span>Intera Giornata</span>
                    <span className="block text-[10px] text-neutral-500 font-normal">Tutti gli orari chiusi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBlockType('specific_slots')}
                    className={`p-3 rounded-xl border text-xs font-mono text-center transition-all cursor-pointer ${
                      blockType === 'specific_slots'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-bold ring-1 ring-amber-400'
                        : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <span>Slot Specifici</span>
                    <span className="block text-[10px] text-neutral-500 font-normal">Blocca solo alcune ore</span>
                  </button>
                </div>
              </div>

              {/* Specific Slots Picker if selected */}
              {blockType === 'specific_slots' && (
                <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                  <span className="text-xs font-mono text-neutral-300 block">
                    Seleziona gli orari da riservare / bloccare:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map(slot => {
                      const isChecked = selectedSlotTimes.includes(slot.time);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleToggleSlotTime(slot.time)}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-red-500/20 border-red-500/70 text-red-200 font-semibold'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <span>{slot.label}</span>
                          {isChecked ? (
                            <Lock className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-neutral-700" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reason input */}
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5 flex items-center justify-between">
                  <span>Motivo dell'Impegno *</span>
                  <span className="text-[10px] text-neutral-500">Visibile nel calendario come nota</span>
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="es. Impegno personale, manutenzione mixer, fuori sede..."
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  required
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {presetReasons.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBlockReason(preset)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        blockReason === preset
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:brightness-110 text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>Salva Blocco nel Calendario</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Active Blocks Registry & Unlock Actions (6 cols) */}
        <div className="lg:col-span-6 p-6 sm:p-7 rounded-3xl bg-neutral-900/70 border border-neutral-800 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
                  <CalendarIcon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-white flex items-center gap-2">
                    <span>Registro Impegni & Chiusure</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400 border border-neutral-700">
                      {blockedCommitments.length} Registrati
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 font-light">
                    Visualizza o sblocca gli orari riservati in qualsiasi momento con un clic.
                  </p>
                </div>
              </div>
            </div>

            {/* List of blocked commitments */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {sortedBlocks.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-neutral-950/60 border border-dashed border-neutral-800 text-neutral-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <span className="text-xs font-mono block text-white font-semibold">
                    Nessun impegno o blocco attivo
                  </span>
                  <span className="text-[11px] text-neutral-500 font-light block mt-1">
                    Tutti gli orari settimanali a partire dalle 15:00 sono regolarmente aperti alle prenotazioni degli artisti.
                  </span>
                </div>
              ) : (
                sortedBlocks.map(item => {
                  const [y, m, d] = item.date.split('-').map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const formattedDate = dateObj.toLocaleDateString('it-IT', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-white capitalize">
                              {formattedDate}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                              item.allDay
                                ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold uppercase'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {item.allDay ? 'Intera Giornata' : `Slot: ${item.timeSlots?.join(', ')}`}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 mt-0.5">
                            Motivo: <strong className="text-amber-400 font-normal">{item.reason}</strong>
                          </p>
                          <span className="text-[10px] font-mono text-neutral-500 block">
                            Registrato il {new Date(item.createdAt).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(item.id, item.date)}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-emerald-500/50 text-neutral-300 hover:text-emerald-400 text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                        title="Sblocca e rendi di nuovo disponibile"
                      >
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sblocca</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* LOWER SECTION: Weekly Standard Hours & Notice Configuration */}
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-white flex items-center gap-2">
                <span>Configurazione Orari Settimanali & Avvisi al Pubblico</span>
              </h3>
              <p className="text-xs text-neutral-400 font-light">
                Imposta l'orario di partenza standard (default: 15:00) e personalizza il messaggio visualizzato dagli artisti sul calendario.
              </p>
            </div>
          </div>

          {settingsSavedNotice && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Impostazioni orari salvate!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            {/* Start hour input */}
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                Orario di Inizio (Default)
              </label>
              <input
                type="text"
                value={defaultStartHour}
                onChange={(e) => setDefaultStartHour(e.target.value)}
                placeholder="15:00"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-white focus:border-amber-400 outline-none"
              />
              <span className="text-[11px] font-mono text-neutral-500 mt-1 block">
                Inizio sessioni ogni giorno (15:00)
              </span>
            </div>

            {/* End hour input */}
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                Orario di Chiusura (Default)
              </label>
              <input
                type="text"
                value={defaultEndHour}
                onChange={(e) => setDefaultEndHour(e.target.value)}
                placeholder="20:00"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-white focus:border-amber-400 outline-none"
              />
              <span className="text-[11px] font-mono text-neutral-500 mt-1 block">
                Chiusura disponibilità ogni giorno (20:00)
              </span>
            </div>

            {/* Custom notice for artists */}
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                Avviso / Banner Calendario Artisti
              </label>
              <input
                type="text"
                value={calendarNotice}
                onChange={(e) => setCalendarNotice(e.target.value)}
                placeholder="Orari studio 15:00 - 20:00..."
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
              />
              <span className="text-[11px] font-mono text-neutral-500 mt-1 block">
                Banner mostrato sopra il calendario pubblico
              </span>
            </div>

          </div>

          {/* Slot Toggle Grid */}
          <div>
            <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
              Fasce Orarie Settimanali Attive
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {editableSlots.map(slot => {
                const isEnabled = slot.enabled !== false;
                return (
                  <div
                    key={slot.id}
                    onClick={() => handleToggleSlotEnabled(slot.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isEnabled
                        ? 'bg-neutral-950/90 border-amber-500/40 hover:border-amber-400'
                        : 'bg-neutral-950/40 border-neutral-800 opacity-50'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-white block">
                      {slot.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 capitalize block mt-0.5">
                      {slot.durationLabel || slot.period}
                    </span>
                    <span className={`inline-block mt-2 text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                      isEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                    }`}>
                      {isEnabled ? 'Attivo' : 'Disattivato'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Salva Impostazioni Orari & Avvisi</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
