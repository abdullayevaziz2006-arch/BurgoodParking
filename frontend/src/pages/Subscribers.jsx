import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  RefreshCw, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Form state
  const [plateNumber, setPlateNumber] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState(50000);
  const [tariffMonthlyPrices, setTariffMonthlyPrices] = useState({
    1: 50000,
    3: 140000,
    6: 260000,
    12: 480000,
    24: 900000
  });
  const [formLoading, setFormLoading] = useState(false);

  // Excel file upload
  const [excelFile, setExcelFile] = useState(null);

  const fetchSubscribers = async () => {
    try {
      const response = await axios.get('/api/subscribers');
      setSubscribers(response.data);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTariff = async () => {
    try {
      const res = await axios.get('/api/tariff');
      if (res.data?.monthlyPrices) {
        const parsed = typeof res.data.monthlyPrices === 'string'
          ? JSON.parse(res.data.monthlyPrices)
          : res.data.monthlyPrices;
        setTariffMonthlyPrices(parsed);
        if (parsed[1]) {
          setAmount(parsed[1]);
        }
      }
    } catch (err) {
      console.error('Error fetching tariff prices:', err);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    fetchTariff();
  }, []);

  const handleMonthsChange = (newMonths) => {
    setMonths(newMonths);
    if (tariffMonthlyPrices && tariffMonthlyPrices[newMonths] !== undefined) {
      setAmount(tariffMonthlyPrices[newMonths]);
    }
  };

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    if (!plateNumber) return;

    setFormLoading(true);
    try {
      await axios.post('/api/subscribers', {
        plateNumber: plateNumber.toUpperCase().trim(),
        cardNo: cardNo.trim(),
        months: parseInt(months),
        amount: amount ? parseFloat(amount) : null
      });
      setPlateNumber('');
      setCardNo('');
      setMonths(1);
      setAmount(tariffMonthlyPrices[1] || 50000);
      fetchSubscribers();
      alert("Obunachi muvaffaqiyatli qo'shildi!");
    } catch (err) {
      console.error(err);
      alert('Xatolik yuz berdi: ' + (err.response?.data?.error || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSubscriber = async (id) => {
    if (!confirm("Ushbu obunachini o'chirishni tasdiqlaysizmi?")) return;
    try {
      await axios.delete(`/api/subscribers/${id}`);
      fetchSubscribers();
      alert("Obunachi o'chirildi!");
    } catch (err) {
      console.error(err);
      alert("O'chirishda xatolik yuz berdi");
    }
  };

  const handleSyncToCameras = async () => {
    setSyncing(true);
    try {
      const response = await axios.post('/api/devices/sync-subscribers');
      if (response.data.success) {
        alert("Barcha faol obunachilar kameralarga muvaffaqiyatli sinxronizatsiya qilindi!");
      }
    } catch (err) {
      console.error(err);
      alert('Sinxronlashda xatolik yuz berdi');
    } finally {
      setSyncing(false);
    }
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();
    if (!excelFile) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', excelFile);

    try {
      const response = await axios.post('/api/subscribers/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Muvaffaqiyatli import qilindi: ${response.data.importedCount} ta obunachi.`);
      setExcelFile(null);
      fetchSubscribers();
    } catch (err) {
      console.error(err);
      alert('Excel importda xatolik yuz berdi: ' + (err.response?.data?.error || err.message));
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-academic-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-ranch-red border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-academic-bg space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
      
      {/* Top Sync & Stats bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="font-bold text-charcoal text-base">Jami obunachilar soni</h3>
          <p className="text-2xl font-extrabold text-ranch-red mt-1">{subscribers.length} ta</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleSyncToCameras}
            disabled={syncing}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-ranch-red hover:bg-ranch-red/90 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Kameralarga sinxronlash (VCL)
          </button>
        </div>
      </div>

      {/* Main split grid: Form vs Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Adding & Excel Import Forms */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Form: Add Single Subscriber */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-gray">
              <UserPlus className="w-5 h-5 text-ranch-red" />
              <h3 className="font-bold text-charcoal text-sm">Yangi obunachi qo'shish</h3>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">Davlat raqami</label>
                <input
                  type="text"
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="masalan, 01A123BC"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold font-mono tracking-wide"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">Karta raqami (RFID)</label>
                <input
                  type="text"
                  value={cardNo}
                  onChange={(e) => setCardNo(e.target.value)}
                  placeholder="masalan, 00054321"
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">Muddati (oy)</label>
                  <select
                    value={months}
                    onChange={(e) => handleMonthsChange(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold"
                  >
                    {[1, 3, 6, 12, 24].map((m) => (
                      <option key={m} value={m}>{m} oy</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-1.5">To'lov summasi</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={amount ? `${Number(amount).toLocaleString('uz-UZ')} so'm` : "0 so'm"}
                      className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm font-bold text-charcoal bg-gray-50/80 cursor-default focus:outline-none font-sans"
                    />
                  </div>
                  <span className="text-[10px] text-muted-slate block mt-1">Tarifdan avtomatik</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 bg-ranch-red hover:bg-ranch-red/90 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center"
              >
                {formLoading ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  'Obunani faollashtirish'
                )}
              </button>
            </form>
          </div>

          {/* Form: Excel Import */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-gray">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-charcoal text-sm">Excel'dan import qilish</h3>
            </div>

            <form onSubmit={handleExcelImport} className="space-y-4">
              <div className="border-2 border-dashed border-surface-gray rounded-xl p-4 text-center cursor-pointer hover:bg-academic-bg/30 transition-colors relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-6 h-6 mx-auto text-muted-slate mb-2" />
                <span className="text-xs font-bold text-charcoal block truncate">
                  {excelFile ? excelFile.name : 'Excel faylini yuklang'}
                </span>
                <span className="text-[10px] text-muted-slate block mt-1">.xlsx formatida</span>
              </div>

              <button
                type="submit"
                disabled={importing || !excelFile}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-750 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center"
              >
                {importing ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  'Importni boshlash'
                )}
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Subscribers Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-surface-gray bg-academic-bg/10 flex items-center justify-between">
              <h3 className="font-bold text-charcoal text-sm">Faol obunachilar ro'yxati</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-academic-bg/40 border-b border-surface-gray text-[10px] font-bold text-muted-slate uppercase tracking-wider">
                    <th className="py-3.5 px-6">Davlat raqami</th>
                    <th className="py-3.5 px-6">Karta raqami</th>
                    <th className="py-3.5 px-6">Obuna tugash sanasi</th>
                    <th className="py-3.5 px-6 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-gray text-sm font-medium">
                  {subscribers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-muted-slate text-xs font-semibold">
                        Hozirda hech qanday obunachi yo'q
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-academic-bg/30 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-charcoal tracking-wide">
                          {sub.plateNumber}
                        </td>
                        <td className="py-3.5 px-6 font-mono text-xs text-muted-slate">
                          {sub.cardNo || 'Karta biriktirilmagan'}
                        </td>
                        <td className="py-3.5 px-6 text-xs text-charcoal">
                          {sub.subscriberEnd ? (
                            new Date(sub.subscriberEnd).toLocaleDateString('uz-UZ', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })
                          ) : (
                            'Noma\'lum'
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id)}
                            className="p-1.5 text-muted-slate hover:text-ranch-red hover:bg-ranch-red/10 rounded-lg transition-colors"
                            title="Obunani bekor qilish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Subscribers;
