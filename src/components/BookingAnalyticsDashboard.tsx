import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { 
  BarChart3, Clock, TrendingUp, Calendar, Zap, 
  Flame, Award, Layers, DollarSign, Activity, Filter
} from 'lucide-react';
import { BookingRecord } from '../types/cms';

interface BookingAnalyticsDashboardProps {
  bookings: BookingRecord[];
}

// 171 Studio luxury dark color palette for charts
const PALETTE = {
  amber: '#f59e0b',
  amberLight: '#fbbf24',
  amberDark: '#b45309',
  emerald: '#10b981',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  rose: '#f43f5e',
  darkBg: '#0a0a0a',
  cardBg: '#121212',
  borderColor: '#262626',
  mutedText: '#737373',
};

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'];

const TIME_SLOT_LABELS = [
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00',
  '21:30 - 23:30',
];

const DAYS_OF_WEEK = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

import { 
  calculatePeakHours, 
  calculateMonthlyTrends, 
  calculateDayOfWeekFrequency, 
  calculateServiceDistribution,
  filterBookings 
} from '../utils/bookingAnalytics';

export const BookingAnalyticsDashboard: React.FC<BookingAnalyticsDashboardProps> = ({ bookings }) => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'tutte' | 'attive_confermate'>('tutte');

  // Filter bookings based on selected controls
  const filteredBookings = useMemo(() => {
    return filterBookings(bookings, timeRange, statusFilter);
  }, [bookings, timeRange, statusFilter]);

  // 1. Peak Recording Hours Analysis
  const peakHoursData = useMemo(() => {
    return calculatePeakHours(filteredBookings);
  }, [filteredBookings]);

  // Peak slot detection
  const topSlot = useMemo(() => {
    if (peakHoursData.length === 0) return null;
    return [...peakHoursData].sort((a, b) => b.sessioni - a.sessioni)[0];
  }, [peakHoursData]);

  // 2. Monthly Trend & Session Frequency (Month-by-Month)
  const monthlyTrendsData = useMemo(() => {
    return calculateMonthlyTrends(filteredBookings);
  }, [filteredBookings]);

  // 3. Day of the Week Frequency
  const dayOfWeekData = useMemo(() => {
    return calculateDayOfWeekFrequency(filteredBookings);
  }, [filteredBookings]);

  // Peak day detection
  const topDay = useMemo(() => {
    return [...dayOfWeekData].sort((a, b) => b.sessioni - a.sessioni)[0];
  }, [dayOfWeekData]);

  // 4. Service Type Distribution
  const serviceDistributionData = useMemo(() => {
    return calculateServiceDistribution(filteredBookings);
  }, [filteredBookings]);

  // KPI calculations
  const totalRecordedHours = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + (b.hours || 2), 0);
  }, [filteredBookings]);

  const totalRevenue = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + (b.estimatedPrice || 0), 0);
  }, [filteredBookings]);

  const confirmationRate = useMemo(() => {
    if (filteredBookings.length === 0) return 0;
    const confirmedCount = filteredBookings.filter(b => b.status === 'confermata' || b.status === 'completata').length;
    return Math.round((confirmedCount / filteredBookings.length) * 100);
  }, [filteredBookings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Analytics Header & Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-neutral-900/80 border border-amber-500/30 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
              Studio Analytics & Trend Prenotazioni
            </h3>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Visualizzazione in tempo reale di ore di punta, frequenza sessioni, giorni più richiesti e andamento economico di 171 Studio.
          </p>
        </div>

        {/* Timeframe & Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setStatusFilter('tutte')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'tutte'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tutte
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('attive_confermate')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'attive_confermate'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Confermate
            </button>
          </div>

          {/* Time range filter */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
            {(['30d', '90d', 'all'] as const).map(tr => (
              <button
                key={tr}
                type="button"
                onClick={() => setTimeRange(tr)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeRange === tr
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tr === '30d' ? '30G' : tr === '90d' ? '90G' : 'Tutto'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sessions */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Sessioni Totali</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-3xl font-heading font-black text-white block">
            {filteredBookings.length}
          </span>
          <span className="text-[11px] font-mono text-emerald-400 mt-1 block">
            {filteredBookings.filter(b => b.status === 'confermata').length} confermate
          </span>
        </div>

        {/* Peak Hours Slot */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Ora di Punta Studio</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-heading font-black text-amber-400 block truncate">
            {topSlot && topSlot.sessioni > 0 ? topSlot.slotLabel : '16:00 - 18:00'}
          </span>
          <span className="text-[11px] font-mono text-neutral-400 mt-1 block">
            Fascia più richiesta dagli artisti
          </span>
        </div>

        {/* Peak Day of Week */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Giorno di Picco</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-heading font-black text-white block">
            {topDay && topDay.sessioni > 0 ? topDay.fullName : 'Venerdì / Sabato'}
          </span>
          <span className="text-[11px] font-mono text-neutral-400 mt-1 block">
            Massima affluenza in studio
          </span>
        </div>

        {/* Total Hours */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Ore Registrazione</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-heading font-black text-emerald-400 block">
            {totalRecordedHours}h
          </span>
          <span className="text-[11px] font-mono text-neutral-400 mt-1 block">
            Tracciate in console analogica
          </span>
        </div>

        {/* Revenue Volume */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Volume Tariffe</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-3xl font-heading font-black text-amber-400 block">
            {totalRevenue} €
          </span>
          <span className="text-[11px] font-mono text-neutral-400 mt-1 block">
            Tasso conferma: {confirmationRate}%
          </span>
        </div>
      </div>

      {/* Row 1: Monthly Trends (Session Frequency) & Peak Recording Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: Monthly Booking Frequency & Volume (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                ANDAMENTO MENSILE & FREQUENZA
              </span>
              <h4 className="text-base sm:text-lg font-heading font-bold text-white">
                Frequenza Sessioni & Ore Studio nel Tempo
              </h4>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Sessioni</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Ore Registrate</span>
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE.amber} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={PALETTE.amber} stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE.emerald} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={PALETTE.emerald} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis 
                  dataKey="monthLabel" 
                  stroke="#737373" 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }} 
                />
                <YAxis 
                  stroke="#737373" 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }} 
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="totaleSessioni" 
                  name="Sessioni" 
                  stroke={PALETTE.amber} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#sessionGradient)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="oreTotali" 
                  name="Ore Studio" 
                  stroke={PALETTE.emerald} 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#hoursGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>Andamento temporale delle prenotazioni per identificare periodi di crescita.</span>
            <span className="text-amber-400 font-semibold">{filteredBookings.length} prenotazioni registrate</span>
          </div>
        </div>

        {/* CHART 2: Peak Recording Hours Distribution (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                ANALISI ORARI DI PUNTA
              </span>
              <h4 className="text-base sm:text-lg font-heading font-bold text-white">
                Fasce Orarie Più Richieste
              </h4>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400 font-bold">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Picco: {topSlot?.slotLabel.split(' - ')[0] || '16:00'}</span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} layout="vertical" margin={{ top: 5, right: 20, left: 25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#737373" 
                  tick={{ fontSize: 10, fontFamily: 'monospace' }} 
                  allowDecimals={false}
                />
                <YAxis 
                  dataKey="time" 
                  type="category" 
                  stroke="#737373" 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }} 
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar 
                  dataKey="sessioni" 
                  name="Sessioni" 
                  radius={[0, 8, 8, 0]}
                >
                  {peakHoursData.map((entry, index) => (
                    <Cell 
                      key={`slot-${index}`} 
                      fill={entry.time === topSlot?.time && entry.sessioni > 0 ? PALETTE.amber : '#404040'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>Orari Studio: Lun-Sab 10:00 - 23:30</span>
            <span className="text-emerald-400">30 min buffer acustico</span>
          </div>
        </div>

      </div>

      {/* Row 2: Day of Week Distribution & Services Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CHART 3: Day of the Week Frequency (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                DISTRIBUZIONE SETTIMANALE
              </span>
              <h4 className="text-base sm:text-lg font-heading font-bold text-white">
                Frequenza per Giorno della Settimana
              </h4>
            </div>
            <div className="text-[11px] font-mono text-amber-400">
              Weekend vs Feriali
            </div>
          </div>

          <div className="h-60 sm:h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#737373" 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }} 
                />
                <YAxis 
                  stroke="#737373" 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }} 
                  allowDecimals={false}
                />
                <Tooltip content={<CustomDayTooltip />} />
                <Bar 
                  dataKey="sessioni" 
                  name="Sessioni" 
                  fill={PALETTE.blue} 
                  radius={[6, 6, 0, 0]}
                >
                  {dayOfWeekData.map((entry, index) => (
                    <Cell 
                      key={`day-${index}`} 
                      fill={index >= 4 ? PALETTE.amber : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>Le sessioni nel fine settimana (Ven-Sab) registrano solitamente la massima richiesta.</span>
          </div>
        </div>

        {/* CHART 4: Service Distribution Breakdown (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                RIPARTIZIONE SERVIZI
              </span>
              <h4 className="text-base sm:text-lg font-heading font-bold text-white">
                Tipologia di Sessioni & Richieste Artisti
              </h4>
            </div>
            <div className="text-[11px] font-mono text-emerald-400">
              Quote di Mercato Studio
            </div>
          </div>

          <div className="h-60 sm:h-64 w-full flex items-center justify-center">
            {serviceDistributionData.length === 0 ? (
              <div className="text-xs text-neutral-500 font-mono">Nessun servizio registrato.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {serviceDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Service Legend breakdown */}
          <div className="mt-2 pt-3 border-t border-neutral-800/80 flex flex-wrap gap-2 text-[11px] font-mono">
            {serviceDistributionData.slice(0, 4).map((s, idx) => (
              <div key={s.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span className="truncate max-w-[120px]">{s.name}</span>
                <span className="text-amber-400 font-bold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

// Custom dark styled Tooltip for AreaChart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-neutral-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
        <p className="font-bold text-white border-b border-neutral-800 pb-1 mb-1">{label}</p>
        {payload.map((item: any, idx: number) => (
          <p key={idx} style={{ color: item.color }} className="flex items-center justify-between gap-4">
            <span>{item.name}:</span>
            <strong className="font-bold">{item.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Peak Hours BarChart
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 rounded-xl bg-neutral-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
        <p className="font-bold text-white border-b border-neutral-800 pb-1 mb-1">
          Fascia: {data.slotLabel}
        </p>
        <p className="text-amber-400 flex items-center justify-between gap-4">
          <span>Sessioni Prenotate:</span>
          <strong>{data.sessioni}</strong>
        </p>
        <p className="text-emerald-400 flex items-center justify-between gap-4">
          <span>Ore Complessive:</span>
          <strong>{data.oreRegistrate}h</strong>
        </p>
        {data.incasso > 0 && (
          <p className="text-neutral-300 flex items-center justify-between gap-4">
            <span>Totale Tariffe:</span>
            <strong>{data.incasso} €</strong>
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Day of Week BarChart
const CustomDayTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 rounded-xl bg-neutral-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
        <p className="font-bold text-white border-b border-neutral-800 pb-1 mb-1">{data.fullName}</p>
        <p className="text-amber-400 flex items-center justify-between gap-4">
          <span>Sessioni Registrate:</span>
          <strong>{data.sessioni}</strong>
        </p>
        <p className="text-emerald-400 flex items-center justify-between gap-4">
          <span>Ore Totali:</span>
          <strong>{data.ore}h</strong>
        </p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Services PieChart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 rounded-xl bg-neutral-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-md text-xs font-mono space-y-1">
        <p className="font-bold text-white border-b border-neutral-800 pb-1 mb-1">{data.name}</p>
        <p className="text-amber-400 flex items-center justify-between gap-4">
          <span>Richieste:</span>
          <strong>{data.count}</strong>
        </p>
        {data.revenue > 0 && (
          <p className="text-emerald-400 flex items-center justify-between gap-4">
            <span>Incasso:</span>
            <strong>{data.revenue} €</strong>
          </p>
        )}
      </div>
    );
  }
  return null;
};
