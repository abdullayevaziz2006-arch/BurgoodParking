import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  Clock, 
  Save, 
  CheckCircle, 
  Calendar, 
  CreditCard,
  Timer,
  Tag,
  ShieldCheck,
  Info
} from 'lucide-react';

const MONTH_OPTIONS = [
  { months: 1, label: '1 oylik obuna' },
  { months: 3, label: '3 oylik obuna' },
  { months: 6, label: '6 oylik obuna' },
  { months: 12, label: '12 oylik obuna (1 yil)' },
  { months: 24, label: '24 oylik obuna (2 yil)' }
];

const DEFAULT_MONTHLY_PRICES = {
  1: 50000,
  3: 140000,
  6: 260000,
  12: 480000,
  24: 900000
};

const Tariffs = () => {
  // Billing calculation mode: 'HOURLY', 'MINUTE', 'FIXED'
  const [billingType, setBillingType] = useState('HOURLY');
  const [pricePerHour, setPricePerHour] = useState(5000);
  const [pricePerMin, setPricePerMin] = useState(100);
  const [fixedFee, setFixedFee] = useState(5000);
  const [maxHours, setMaxHours] = useState(4);
  const [freeMinutes, setFreeMinutes] = useState(10);
  const [monthlyPrices, setMonthlyPrices] = useState(DEFAULT_MONTHLY_PRICES);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchTariff = async () => {
      try {
        const response = await axios.get('/api/tariff');
        const data = response.data || {};
        setBillingType(data.billingType || 'HOURLY');
        setPricePerHour(data.pricePerHour ?? data.pricePerMin ?? 5000);
        setPricePerMin(data.pricePerMin ?? 100);
        setFixedFee(data.fixedFee ?? 5000);
        setMaxHours(data.maxHours !== undefined && data.maxHours !== null ? data.maxHours : 4);
        setFreeMinutes(data.freeMinutes ?? 10);
        
        if (data.monthlyPrices) {
          try {
            const parsed = typeof data.monthlyPrices === 'string'
              ? JSON.parse(data.monthlyPrices)
              : data.monthlyPrices;
            setMonthlyPrices(prev => ({ ...DEFAULT_MONTHLY_PRICES, ...parsed }));
          } catch (e) {
            console.error('Error parsing monthlyPrices:', e);
          }
        }
      } catch (err) {
        console.error('Error fetching tariff:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTariff();
  }, []);

  const handlePriceChange = (month, value) => {
    setMonthlyPrices(prev => ({
      ...prev,
      [month]: value === '' ? '' : parseFloat(value) || 0
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await axios.post('/api/tariff', {
        billingType,
        pricePerHour: parseFloat(pricePerHour) || 0,
        pricePerMin: parseFloat(pricePerMin) || 0,
        fixedFee: parseFloat(fixedFee) || 0,
        maxHours: maxHours === '' || maxHours === null ? 0 : parseInt(maxHours),
        freeMinutes: parseInt(freeMinutes) || 0,
        monthlyPrices
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Tarifni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
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
    <div className="flex-1 p-6 md:p-8 bg-academic-bg overflow-y-auto max-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-surface-gray rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-ranch-red/10 text-ranch-red rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-charcoal text-lg">Tarif va To'lov Sozlamalari</h3>
            <p className="text-xs text-muted-slate font-medium mt-0.5">
              Avtoturargohda to'lov hisoblash usulini (soatbay, minutbay yoki bir martalik) va obuna narxlarini sozlang
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* 1. Hisob-kitob usuli tanlash kartalari */}
          <div className="bg-white border border-surface-gray rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-bold text-charcoal flex items-center gap-2">
                <Tag className="w-4 h-4 text-ranch-red" />
                <span>To'lov Hisoblash Tizimi (Rejim)</span>
              </h4>
              <p className="text-xs text-muted-slate mt-1">
                Mijozlar avtoturargohda turgani uchun pul qanday hisoblanishini tanlang:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              
              {/* Option 1: SOATBAY */}
              <div 
                onClick={() => setBillingType('HOURLY')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  billingType === 'HOURLY' 
                    ? 'border-ranch-red bg-ranch-red/5 ring-2 ring-ranch-red/10' 
                    : 'border-surface-gray hover:border-muted-slate/40 bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      billingType === 'HOURLY' ? 'border-ranch-red' : 'border-surface-gray'
                    }`}>
                      {billingType === 'HOURLY' && <span className="w-2 h-2 rounded-full bg-ranch-red"></span>}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-bold text-charcoal text-sm">Soatbay (Soatlik)</h5>
                    <p className="text-[11px] text-muted-slate mt-0.5 leading-snug">
                      Har bir soat uchun to'lov olinadi (1s dan oshsa 2s, 2s dan oshsa 3s...)
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-surface-gray/50 text-[10px] font-bold text-muted-slate uppercase">
                  Eng ommabop usul
                </div>
              </div>

              {/* Option 2: MINUTBAY */}
              <div 
                onClick={() => setBillingType('MINUTE')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  billingType === 'MINUTE' 
                    ? 'border-ranch-red bg-ranch-red/5 ring-2 ring-ranch-red/10' 
                    : 'border-surface-gray hover:border-muted-slate/40 bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <Timer className="w-4 h-4" />
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      billingType === 'MINUTE' ? 'border-ranch-red' : 'border-surface-gray'
                    }`}>
                      {billingType === 'MINUTE' && <span className="w-2 h-2 rounded-full bg-ranch-red"></span>}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-bold text-charcoal text-sm">Minutbay (Daqiqalik)</h5>
                    <p className="text-[11px] text-muted-slate mt-0.5 leading-snug">
                      Har bir daqiqa uchun aniq hisoblanadi (masalan, 35 daqiqa × 100 so'm)
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-surface-gray/50 text-[10px] font-bold text-muted-slate uppercase">
                  Aniq daqiqasiga qarab
                </div>
              </div>

              {/* Option 3: BIR MARTALIK FIKSIRLANGAN */}
              <div 
                onClick={() => setBillingType('FIXED')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  billingType === 'FIXED' 
                    ? 'border-ranch-red bg-ranch-red/5 ring-2 ring-ranch-red/10' 
                    : 'border-surface-gray hover:border-muted-slate/40 bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      billingType === 'FIXED' ? 'border-ranch-red' : 'border-surface-gray'
                    }`}>
                      {billingType === 'FIXED' && <span className="w-2 h-2 rounded-full bg-ranch-red"></span>}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-bold text-charcoal text-sm">Bir Martalik (Fikslangan)</h5>
                    <p className="text-[11px] text-muted-slate mt-0.5 leading-snug">
                      Kirib-chiqqani uchun 1 ta qat'iy summa (qancha soat turishidan qat'i nazar)
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-surface-gray/50 text-[10px] font-bold text-muted-slate uppercase">
                  Bozor va to'ylar uchun
                </div>
              </div>

            </div>
          </div>

          {/* 2. Tanlangan rejim parametrlari */}
          <div className="bg-white border border-surface-gray rounded-2xl p-6 shadow-sm space-y-5">
            <h4 className="text-sm font-bold text-charcoal flex items-center gap-2 pb-2 border-b border-surface-gray">
              <DollarSign className="w-4 h-4 text-ranch-red" />
              <span>Narx va Cheklov Maydonlari</span>
            </h4>

            {/* Mode-specific Fields */}
            {billingType === 'HOURLY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-2">
                    1 soat uchun to'lov (UZS)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate font-bold text-xs">
                      so'm
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 font-semibold font-sans"
                    />
                  </div>
                  <span className="text-[11px] text-muted-slate mt-1 block">
                    Har soat to'lmasa ham yaxlitlanadi (masalan, 1s 10 daqiqa = 2 soat).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-2">
                    Maksimal soat chegarasi (Soat)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate font-bold text-xs">
                      soat
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={maxHours}
                      onChange={(e) => setMaxHours(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 font-semibold font-sans"
                    />
                  </div>
                  <span className="text-[11px] text-muted-slate mt-1 block">
                    0 qo'yilsa chegarasiz. 4 qo'yilsa, 4 soatdan oshsa ortiqcha pul yozilmaydi.
                  </span>
                </div>
              </div>
            )}

            {billingType === 'MINUTE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-2">
                    1 daqiqa uchun to'lov (UZS)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate font-bold text-xs">
                      so'm
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={pricePerMin}
                      onChange={(e) => setPricePerMin(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 font-semibold font-sans"
                    />
                  </div>
                  <span className="text-[11px] text-muted-slate mt-1 block">
                    Masalan: 100 so'm/daq (1 soati 6 000 so'mga to'g'ri keladi).
                  </span>
                </div>
              </div>
            )}

            {billingType === 'FIXED' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-2">
                    Kirib-chiqish uchun qat'iy to'lov (UZS)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate font-bold text-xs">
                      so'm
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={fixedFee}
                      onChange={(e) => setFixedFee(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 font-semibold font-sans"
                    />
                  </div>
                  <span className="text-[11px] text-muted-slate mt-1 block">
                    Mashina qancha vaqt turishidan qat'i nazar bitta summa olinadi.
                  </span>
                </div>
              </div>
            )}

            {/* Umumiy: Bepul kutish vaqti */}
            <div className="pt-2 border-t border-surface-gray/60">
              <div className="max-w-xs">
                <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider mb-2">
                  🆓 Bepul kutish vaqti (Daqiqa)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate font-bold text-xs">
                    daq
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={freeMinutes}
                    onChange={(e) => setFreeMinutes(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 font-semibold font-sans"
                  />
                </div>
                <span className="text-[11px] text-muted-slate mt-1 block">
                  Mashina {freeMinutes} daqiqa ichida chiqsa to'lov 0 so'm bo'lib avtomatik ochiladi.
                </span>
              </div>
            </div>

            {/* Live Explanation Box */}
            <div className="p-4 bg-academic-bg border border-surface-gray rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-ranch-red shrink-0 mt-0.5" />
              <div className="text-xs text-charcoal space-y-1">
                <p className="font-bold">Amaldagi hisob-kitob namunasi:</p>
                {billingType === 'HOURLY' && (
                  <p className="text-muted-slate">
                    Mashina <strong>2 soat 15 daqiqa</strong> tursa: dastlabki {freeMinutes} daqiqadan oshgani uchun 3 soat yaxlitlanadi → <strong>3 × {Number(pricePerHour).toLocaleString()} = {(3 * Number(pricePerHour)).toLocaleString()} so'm</strong> olinadi (maksimal {maxHours > 0 ? `${maxHours} soat` : 'cheksiz'}).
                  </p>
                )}
                {billingType === 'MINUTE' && (
                  <p className="text-muted-slate">
                    Mashina <strong>45 daqiqa</strong> tursa: ({freeMinutes} daqiqasi bepul) qolgan 35 daqiqa uchun → <strong>35 × {Number(pricePerMin).toLocaleString()} = {(35 * Number(pricePerMin)).toLocaleString()} so'm</strong> olinadi.
                  </p>
                )}
                {billingType === 'FIXED' && (
                  <p className="text-muted-slate">
                    Mashina <strong>xoh 15 daqiqa, xoh 6 soat</strong> tursa ham: qat'iy <strong>{Number(fixedFee).toLocaleString()} so'm</strong> to'laydi ({freeMinutes} daqiqa ichida chiqsa bepul).
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* 3. Oylik obuna to'lovlari sozlamalari */}
          <div className="bg-white border border-surface-gray rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h4 className="text-sm font-bold text-charcoal flex items-center gap-2">
                <Calendar className="w-4 h-4 text-ranch-red" />
                <span>Oylik Obuna (Abonent) Narxlari</span>
              </h4>
              <p className="text-xs text-muted-slate mt-1">
                Doimiy mijozlar va obunachilar (Subscribers) uchun muddatlar bo'yicha belgilangan narxlar:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {MONTH_OPTIONS.map((item) => (
                <div key={item.months} className="p-3 bg-academic-bg/40 border border-surface-gray rounded-xl">
                  <label className="block text-xs font-bold text-charcoal mb-1.5">
                    {item.label}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-slate font-bold text-xs">
                      so'm
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={monthlyPrices[item.months] ?? ''}
                      onChange={(e) => handlePriceChange(item.months, e.target.value)}
                      placeholder="0"
                      className="w-full pl-12 pr-3 py-2 rounded-lg border border-surface-gray text-xs focus:outline-none focus:border-ranch-red focus:ring-1 focus:ring-ranch-red bg-white font-semibold font-sans"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-ranch-red hover:bg-ranch-red/90 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              ) : saved ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                  <span>Tarif Sozlamalari Muvaffaqiyatli Saqlandi!</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Tarif va Narx Sozlamalarini Saqlash</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default Tariffs;
