import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Search, 
  Filter, 
  LogIn, 
  LogOut, 
  ShieldAlert, 
  Unlock, 
  RefreshCw,
  Download,
  Printer,
  DollarSign,
  Car,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Activity,
  Camera,
  X
} from 'lucide-react';

const Logs = () => {
  const [activeTab, setActiveTab] = useState('SESSIONS'); // 'SESSIONS' or 'SYSTEM_LOGS'
  const [viewPhoto, setViewPhoto] = useState(null); // Photo modal
  
  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({
    totalCars: 0,
    activeCars: 0,
    completedCars: 0,
    unpaidCars: 0,
    totalRevenue: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    avgDurationMins: 0
  });
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatus, setSessionStatus] = useState('ALL');
  const [dateRangePreset, setDateRangePreset] = useState('TODAY'); // 'TODAY', 'YESTERDAY', 'WEEK', 'ALL', 'CUSTOM'
  const [startDate, setStartDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  // System Logs State
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logFilterType, setLogFilterType] = useState('ALL');

  // Fetch Sessions
  const fetchSessions = async () => {
    setSessionLoading(true);
    try {
      const params = {};
      if (sessionSearch.trim()) params.search = sessionSearch.trim();
      if (sessionStatus !== 'ALL') params.status = sessionStatus;

      if (dateRangePreset !== 'ALL') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      params.withSummary = 'true';
      const res = await axios.get('/api/sessions', { params });
      const sessionList = Array.isArray(res.data) ? res.data : (res.data?.sessions || []);
      setSessions(sessionList);
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  // Fetch System Logs
  const fetchLogs = async () => {
    setLogLoading(true);
    try {
      const params = {};
      if (logSearch.trim()) params.search = logSearch.trim();
      if (logFilterType !== 'ALL') params.type = logFilterType;
      const res = await axios.get('/api/logs', { params });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogLoading(false);
    }
  };

  // Quick Preset handler
  const handleDatePreset = (preset) => {
    setDateRangePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'WEEK') {
      const w = new Date(today);
      w.setDate(w.getDate() - 7);
      setStartDate(w.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  useEffect(() => {
    if (activeTab === 'SESSIONS') {
      fetchSessions();
    } else {
      fetchLogs();
    }
  }, [activeTab, dateRangePreset, startDate, endDate, sessionStatus]);

  // Export to Excel (with photos embedded)
  const exportToExcel = () => {
    if (sessions.length === 0) {
      alert("Eksport qilish uchun ma'lumot yo'q!");
      return;
    }
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (sessionStatus !== 'ALL') params.append('status', sessionStatus);
    window.open(`/api/reports/export-excel?${params.toString()}`, '_blank');
  };

  // Export to CSV
  const exportToCSV = () => {
    if (sessions.length === 0) {
      alert("Eksport qilish uchun ma'lumot yo'q!");
      return;
    }

    const headers = [
      '№',
      'Avto raqam',
      'VIP/Obuna',
      'Kirish vaqti',
      'Chiqish vaqti',
      'Turgan vaqti',
      "To'lov summasi (so'm)",
      "To'lov turi",
      'Holati'
    ];

    const rows = sessions.map((s, idx) => [
      idx + 1,
      s.car?.plateNumber || '-',
      s.car?.isSubscriber ? 'Ha (VIP)' : "Yo'q",
      s.entryTime ? new Date(s.entryTime).toLocaleString('uz-UZ') : '-',
      s.exitTime ? new Date(s.exitTime).toLocaleString('uz-UZ') : 'Hududda',
      s.durationText || '-',
      s.sessionPaidAmount || s.fee || 0,
      s.paidMethod || '-',
      s.status === 'COMPLETED' ? 'Tugallandi' : (s.status === 'ACTIVE' ? 'Hududda' : "To'lanmagan")
    ]);

    // UTF-8 BOM for Excel
    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Avtoturargoh_Hisoboti_${startDate || 'all'}_${endDate || ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  const getLogTypeBadge = (type) => {
    const baseClass = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider";
    switch (type) {
      case 'ENTRY':
        return (
          <span className={`${baseClass} bg-emerald-500/10 text-emerald-600`}>
            <LogIn className="w-3 h-3" />
            Kirish
          </span>
        );
      case 'EXIT':
        return (
          <span className={`${baseClass} bg-blue-500/10 text-blue-600`}>
            <LogOut className="w-3 h-3" />
            Chiqish
          </span>
        );
      case 'BLACKLIST_ATTEMPT':
        return (
          <span className={`${baseClass} bg-red-500/10 text-red-650 animate-pulse`}>
            <ShieldAlert className="w-3 h-3" />
            Taqiq
          </span>
        );
      case 'BARRIER_OPEN':
        return (
          <span className={`${baseClass} bg-yellow-500/10 text-yellow-650`}>
            <Unlock className="w-3 h-3" />
            Qo'lda ochish
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-surface-gray text-muted-slate`}>
            <FileText className="w-3 h-3" />
            {type}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 bg-academic-bg space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-charcoal tracking-tight">Avtoturargoh hisoboti va Loglar</h1>
          <p className="text-xs text-muted-slate font-medium">Barcha kirish-chiqishlar, moliyaviy hisobotlar va tizim harakatlari</p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-surface-gray shadow-sm">
          <button
            onClick={() => setActiveTab('SESSIONS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SESSIONS'
                ? 'bg-ranch-red text-white shadow-sm'
                : 'text-muted-slate hover:text-charcoal'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            Mashinalar va To'lovlar
          </button>
          <button
            onClick={() => setActiveTab('SYSTEM_LOGS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SYSTEM_LOGS'
                ? 'bg-ranch-red text-white shadow-sm'
                : 'text-muted-slate hover:text-charcoal'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Tizim hodisalari
          </button>
        </div>
      </div>

      {activeTab === 'SESSIONS' ? (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-slate uppercase tracking-wider">Jami tushum</p>
                <h3 className="text-xl font-black text-charcoal mt-1">
                  {(summary.totalRevenue || 0).toLocaleString()} <span className="text-xs font-bold text-muted-slate">so'm</span>
                </h3>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold text-muted-slate">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Banknote className="w-3 h-3" /> Naqd: {(summary.cashRevenue || 0).toLocaleString()}
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1 text-[#0084ff]">
                    <CreditCard className="w-3 h-3" /> Karta: {(summary.cardRevenue || 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* Total Cars */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-slate uppercase tracking-wider">Jami mashinalar</p>
                <h3 className="text-xl font-black text-charcoal mt-1">
                  {summary.totalCars || 0} <span className="text-xs font-bold text-muted-slate">ta</span>
                </h3>
                <p className="text-[10px] text-muted-slate mt-2 font-medium">
                  {summary.completedCars || 0} ta chiqib ketgan
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#0084ff]/10 flex items-center justify-center text-[#0084ff]">
                <Car className="w-6 h-6" />
              </div>
            </div>

            {/* Currently Active */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-slate uppercase tracking-wider">Hozir parkovkada (Faol)</p>
                <h3 className="text-xl font-black text-charcoal mt-1">
                  {summary.activeCars || 0} <span className="text-xs font-bold text-muted-slate">ta</span>
                </h3>
                <p className="text-[10px] text-emerald-600 mt-2 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Hududda to'xtab turibdi
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Average Stay Duration */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-slate uppercase tracking-wider">O'rtacha to'xtash vaqti</p>
                <h3 className="text-xl font-black text-charcoal mt-1">
                  {summary.avgDurationMins || 0} <span className="text-xs font-bold text-muted-slate">daqiqa</span>
                </h3>
                <p className="text-[10px] text-muted-slate mt-2 font-medium">
                  {Math.floor((summary.avgDurationMins || 0) / 60)} soat {(summary.avgDurationMins || 0) % 60} daqiqa
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Filter & Action Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
              
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchSessions()}
                  placeholder="Avto raqam bo'yicha..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-surface-gray text-xs focus:outline-none focus:border-ranch-red focus:ring-1 focus:ring-ranch-red font-semibold uppercase"
                />
              </div>

              {/* Date Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'TODAY', label: 'Bugun' },
                  { id: 'YESTERDAY', label: 'Kecha' },
                  { id: 'WEEK', label: 'Oxirgi 7 kun' },
                  { id: 'ALL', label: 'Barchasi' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleDatePreset(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      dateRangePreset === p.id
                        ? 'bg-charcoal text-white shadow-sm'
                        : 'bg-academic-bg text-muted-slate hover:text-charcoal'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRangePreset('CUSTOM');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-surface-gray text-xs font-semibold focus:outline-none focus:border-ranch-red"
                />
                <span className="text-muted-slate font-bold">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRangePreset('CUSTOM');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-surface-gray text-xs font-semibold focus:outline-none focus:border-ranch-red"
                />
              </div>

              {/* Status Select */}
              <select
                value={sessionStatus}
                onChange={(e) => setSessionStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-surface-gray text-xs font-bold focus:outline-none focus:border-ranch-red"
              >
                <option value="ALL">Barcha holatlar</option>
                <option value="COMPLETED">Chiqib ketgan (To'langan)</option>
                <option value="ACTIVE">Hozir parkovkada (Faol)</option>
                <option value="UNPAID">To'lanmagan</option>
              </select>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSessions}
                  className="p-2 border border-surface-gray hover:bg-academic-bg rounded-lg text-muted-slate hover:text-charcoal transition-all"
                  title="Yangilash"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  title="Rasmlar bilan Excel formatida yuklab olish"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel (Rasmli)
                </button>

                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 border border-surface-gray hover:bg-academic-bg text-muted-slate hover:text-charcoal rounded-lg text-xs font-bold transition-all"
                  title="CSV formatida yuklab olish"
                >
                  CSV
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-gray hover:bg-academic-bg text-charcoal rounded-lg text-xs font-bold transition-all"
                  title="Chop etish"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Chop etish
                </button>
              </div>

            </div>

          </div>

          {/* Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-academic-bg/60 border-b border-surface-gray text-[10px] font-bold text-muted-slate uppercase tracking-wider">
                    <th className="py-3 px-4">№</th>
                    <th className="py-3 px-4">Avtomobil raqami</th>
                    <th className="py-3 px-4">Rasmlar</th>
                    <th className="py-3 px-4">Kirish vaqti</th>
                    <th className="py-3 px-4">Chiqish vaqti</th>
                    <th className="py-3 px-4">Turgan vaqti</th>
                    <th className="py-3 px-4">Summa</th>
                    <th className="py-3 px-4">To'lov turi</th>
                    <th className="py-3 px-4">Holati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-gray text-xs font-medium">
                  {sessionLoading ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-muted-slate">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-ranch-red border-t-transparent"></div>
                        <p className="mt-2 text-xs font-semibold">Ma'lumotlar yuklanmoqda...</p>
                      </td>
                    </tr>
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-muted-slate text-xs font-semibold">
                        Ushbu davr uchun hech qanday avtoturargoh qaydi topilmadi
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-academic-bg/40 transition-colors">
                        <td className="py-3 px-4 text-muted-slate font-bold text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-charcoal tracking-wide bg-surface-gray/50 px-2 py-0.5 rounded border border-surface-gray">
                              {s.car?.plateNumber}
                            </span>
                            {s.car?.isSubscriber && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                VIP
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Photos */}
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-1.5">
                            {s.entryPhoto ? (
                              <div 
                                onClick={() => setViewPhoto({ url: s.entryPhoto, plate: s.car?.plateNumber, label: 'Kirish surati', time: s.entryTime })}
                                className="relative group cursor-pointer w-11 h-7 rounded overflow-hidden border border-surface-gray shadow-sm hover:ring-2 hover:ring-ranch-red transition-all"
                                title="Kirish rasmi"
                              >
                                <img src={s.entryPhoto} alt="Kirish" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <span className="absolute bottom-0 right-0 bg-black/70 text-[7px] text-white px-0.5 font-bold">K</span>
                              </div>
                            ) : null}

                            {s.exitPhoto ? (
                              <div 
                                onClick={() => setViewPhoto({ url: s.exitPhoto, plate: s.car?.plateNumber, label: 'Chiqish surati', time: s.exitTime })}
                                className="relative group cursor-pointer w-11 h-7 rounded overflow-hidden border border-surface-gray shadow-sm hover:ring-2 hover:ring-blue-600 transition-all"
                                title="Chiqish rasmi"
                              >
                                <img src={s.exitPhoto} alt="Chiqish" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <span className="absolute bottom-0 right-0 bg-black/70 text-[7px] text-white px-0.5 font-bold">Ch</span>
                              </div>
                            ) : null}

                            {!s.entryPhoto && !s.exitPhoto && (
                              <span className="text-[10px] text-muted-slate italic">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-charcoal font-mono text-[11px]">
                          {s.entryTime ? (
                            <>
                              <span className="font-semibold">{new Date(s.entryTime).toLocaleDateString('uz-UZ')}</span>{' '}
                              <span className="text-muted-slate">{new Date(s.entryTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {s.exitTime ? (
                            <>
                              <span className="font-semibold text-charcoal">{new Date(s.exitTime).toLocaleDateString('uz-UZ')}</span>{' '}
                              <span className="text-muted-slate">{new Date(s.exitTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-sans font-bold text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Hududda
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-charcoal">
                          {s.durationText}
                        </td>
                        <td className="py-3 px-4 font-black text-charcoal">
                          {(s.sessionPaidAmount || s.fee || 0).toLocaleString()} <span className="text-[10px] font-normal text-muted-slate">so'm</span>
                        </td>
                        <td className="py-3 px-4">
                          {s.paidMethod === 'Naqd' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700">
                              <Banknote className="w-3 h-3" /> Naqd
                            </span>
                          ) : s.paidMethod === 'Karta' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700">
                              <CreditCard className="w-3 h-3" /> Karta
                            </span>
                          ) : s.paidMethod === 'VIP' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700">
                              VIP
                            </span>
                          ) : (
                            <span className="text-muted-slate font-medium text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {s.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" /> Chiqqan
                            </span>
                          ) : s.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                              <Clock className="w-3 h-3" /> Faol
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600">
                              <AlertCircle className="w-3 h-3" /> To'lanmagan
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* System Logs Tab */
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-surface-gray shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                placeholder="Avtomobil raqami yoki tavsif..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-surface-gray text-xs font-semibold focus:outline-none focus:border-ranch-red"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={logFilterType}
                onChange={(e) => setLogFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-surface-gray text-xs font-semibold focus:outline-none focus:border-ranch-red"
              >
                <option value="ALL">Barcha hodisalar</option>
                <option value="ENTRY">Kirish loglari</option>
                <option value="EXIT">Chiqish loglari</option>
                <option value="BLACKLIST_ATTEMPT">Taqiq loglari</option>
                <option value="BARRIER_OPEN">Qo'lda ochishlar</option>
              </select>

              <button
                onClick={fetchLogs}
                className="p-2 border border-surface-gray hover:bg-academic-bg rounded-lg text-muted-slate hover:text-charcoal transition-all"
                title="Yangilash"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-academic-bg/60 border-b border-surface-gray text-[10px] font-bold text-muted-slate uppercase tracking-wider">
                    <th className="py-3 px-4">Vaqti</th>
                    <th className="py-3 px-4">Turi</th>
                    <th className="py-3 px-4">Avtomobil raqami</th>
                    <th className="py-3 px-4">Tavsif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-gray text-xs font-medium">
                  {logLoading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-muted-slate">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-ranch-red border-t-transparent"></div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-muted-slate text-xs font-semibold">
                        Hech qanday tizim loglari topilmadi
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-academic-bg/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-charcoal">
                          {new Date(log.createdAt).toLocaleString('uz-UZ')}
                        </td>
                        <td className="py-3 px-4">
                          {getLogTypeBadge(log.type)}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-charcoal tracking-wide">
                          {log.car?.plateNumber || 'Tizim'}
                        </td>
                        <td className="py-3 px-4 text-muted-slate font-medium">
                          {log.description || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 bg-charcoal/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewPhoto(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl border border-surface-gray animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-surface-gray flex items-center justify-between bg-academic-bg">
              <div>
                <h3 className="font-bold text-charcoal text-base flex items-center gap-2">
                  <Camera className="w-5 h-5 text-ranch-red" />
                  <span>{viewPhoto.label || 'Mashina fotosurati'}: <strong className="font-mono text-ranch-red">{viewPhoto.plate}</strong></span>
                </h3>
                <p className="text-xs text-muted-slate mt-0.5">{viewPhoto.time ? new Date(viewPhoto.time).toLocaleString('uz-UZ') : ''}</p>
              </div>
              <button onClick={() => setViewPhoto(null)} className="p-1 rounded-lg text-muted-slate hover:bg-surface-gray hover:text-charcoal transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-charcoal/5 flex items-center justify-center">
              <img src={viewPhoto.url} alt="Mashina fotosurati" className="max-h-[70vh] w-auto object-contain rounded-xl shadow-inner border border-surface-gray" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Logs;
