import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import LiveCameraFeed from '../components/LiveCameraFeed';
import { 
  DollarSign, 
  Car, 
  Activity, 
  TrendingUp, 
  LogIn, 
  LogOut, 
  ShieldAlert, 
  X,
  CreditCard
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, activeSessions: 0, cashiersCount: 0 });
  const [activeSessions, setActiveSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout modal state
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutDetails, setCheckoutDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await axios.get('/api/admin/dashboard-stats');
      setStats(statsRes.data);

      // Fetch sessions
      const sessionsRes = await axios.get('/api/sessions');
      const active = sessionsRes.data.filter(s => s.status === 'ACTIVE');
      setActiveSessions(active);

      // Fetch recent logs
      const logsRes = await axios.get('/api/logs');
      setLogs(logsRes.data.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up Socket.io for live updates
    const socket = io(window.location.origin);
    
    socket.on('car_entry', (data) => {
      console.log('Live update: Car entry', data);
      fetchData();
    });

    socket.on('car_exit', (data) => {
      console.log('Live update: Car exit', data);
      fetchData();
    });

    socket.on('alert', (data) => {
      alert(`⚠️ HUShYORLIK: ${data.message}`);
      fetchData();
    });

    socket.on('checkout_request', (data) => {
      console.log('Automated checkout request received:', data);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {}

      setCheckoutAmount(data.fee);
      setCheckoutSession(data.session);
      setCheckoutDetails(data);
      setPaymentMethod('CASH');
      setCashReceived('');
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Calculate duration in minutes and hours
  const formatDuration = (entryTime) => {
    const diffMs = new Date() - new Date(entryTime);
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const handleCheckoutOpen = async (session) => {
    try {
      const exitTime = new Date().toISOString();
      const entryDate = new Date(session.entryTime);
      const diffMins = Math.ceil((new Date() - entryDate) / 60000);
      
      const tariffRes = await axios.get('/api/tariff');
      const tariff = tariffRes.data;
      
      let fee = 0;
      const isSub = session.car.isSubscriber && session.car.subscriberEnd && new Date(session.car.subscriberEnd) > new Date();

      const freeMinutes = (isSub || !tariff) ? 0 : tariff.freeMinutes;
      if (!isSub && tariff) {
        let billableMins = diffMins - tariff.freeMinutes;
        if (billableMins > 0) {
          fee = billableMins * tariff.pricePerMin;
          if (tariff.maxDaily && fee > tariff.maxDaily) fee = tariff.maxDaily;
        }
      }
      
      setCheckoutAmount(fee);
      setCheckoutSession(session);
      setCheckoutDetails({
        plateNumber: session.car.plateNumber,
        entryTime: session.entryTime,
        durationMins: diffMins,
        freeMinutes: freeMinutes,
        overtimeMins: Math.max(0, diffMins - freeMinutes),
        fee
      });
      setPaymentMethod('CASH');
      setCashReceived('');
    } catch (err) {
      console.error('Error calculating manual fee:', err);
      setCheckoutAmount(0);
      setCheckoutSession(session);
      setCheckoutDetails(null);
    }
  };

  const handleManualCheckout = async () => {
    if (!checkoutSession) return;
    setCheckoutLoading(true);
    try {
      if (paymentMethod === 'CASH') {
        const received = parseFloat(cashReceived || 0);
        if (received < checkoutAmount) {
          alert("Qabul qilingan mablag' to'lov miqdoridan kam bo'lishi mumkin emas!");
          setCheckoutLoading(false);
          return;
        }
        
        await axios.post('/api/payment/cash', {
          sessionId: checkoutSession.id,
          fee: checkoutAmount,
          insertedAmount: received
        });
      } else {
        // Card payment
        await axios.post('/api/payment/terminal', {
          sessionId: checkoutSession.id,
          amount: checkoutAmount
        });
      }
      
      // Auto open barrier for manual checkout
      await axios.post('/api/barrier/open');
      
      setCheckoutSession(null);
      fetchData();
    } catch (err) {
      console.error('Checkout error:', err);
      alert('To\'lovni amalga oshirishda xatolik yuz berdi: ' + (err.response?.data?.error || err.message));
    } finally {
      setCheckoutLoading(false);
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
      
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl border border-surface-gray flex flex-col justify-center min-h-[110px]">
          <span className="text-[11px] font-extrabold text-muted-slate uppercase tracking-wider">TOTAL REVENUE</span>
          <p className="text-3xl font-extrabold text-ranch-red font-sans mt-3">
            {(stats.totalRevenue || 0).toLocaleString('uz-UZ')} UZS
          </p>
        </div>

        {/* Active Occupancy Card */}
        <div className="bg-white p-6 rounded-xl border border-surface-gray flex flex-col justify-center min-h-[110px]">
          <span className="text-[11px] font-extrabold text-muted-slate uppercase tracking-wider">ACTIVE CARS</span>
          <p className="text-3xl font-extrabold text-charcoal mt-3">
            {stats.activeSessions || 0} <span className="text-base text-muted-slate font-medium">/ 100</span>
          </p>
          {/* Occupancy Indicator Bar */}
          <div className="w-full bg-surface-gray h-2 rounded-full overflow-hidden mt-4">
            <div 
              className="bg-ranch-red h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(((stats.activeSessions || 0) / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Cashiers/Devices heartbeat card */}
        <div className="bg-white p-6 rounded-xl border border-surface-gray flex flex-col justify-center min-h-[110px]">
          <span className="text-[11px] font-extrabold text-muted-slate uppercase tracking-wider">CASHIER STATUS</span>
          <div className="flex items-center gap-1.5 mt-4">
            <div className="flex gap-1 items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-sm font-bold text-charcoal ml-2">
              {stats.cashiersCount || 3} Cashiers Active
            </p>
          </div>
        </div>

      </div>

      {/* Main Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Live Video Streams */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LiveCameraFeed ip="10.70.5.8" name="Kirish" />
            <LiveCameraFeed ip="10.70.5.7" name="Chiqish" />
          </div>
        </div>

        {/* Right Side: Active Parked Cars Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-charcoal">Active Vehicles in Parking</h3>
          <div className="bg-white rounded-xl border border-surface-gray overflow-hidden">
            <div className="overflow-x-auto max-h-[360px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-academic-bg/40 border-b border-surface-gray text-[10px] font-bold text-muted-slate uppercase tracking-wider">
                    <th className="py-4 px-6">LICENSE PLATE</th>
                    <th className="py-4 px-6">ENTRY TIME</th>
                    <th className="py-4 px-6">DURATION</th>
                    <th className="py-4 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-gray text-sm font-medium">
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-muted-slate text-xs font-semibold">
                        No vehicles currently in parking
                      </td>
                    </tr>
                  ) : (
                    activeSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-academic-bg/30 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-charcoal tracking-wide">
                          {session.car.plateNumber}
                          {session.car.isSubscriber && (
                            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold uppercase">
                              Sub
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-muted-slate text-xs">
                          {new Date(session.entryTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </td>
                        <td className="py-3.5 px-6 text-muted-slate text-xs">
                          {formatDuration(session.entryTime)}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => handleCheckoutOpen(session)}
                            className="text-ranch-red hover:underline text-xs font-bold font-sans"
                          >
                            Checkout
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

      {/* Bottom Section: Recent Log entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-charcoal">Recent Activity Logs</h3>
          <button 
            onClick={fetchData} 
            className="flex items-center gap-1.5 text-xs text-muted-slate hover:text-charcoal transition-colors font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
        <div className="bg-white rounded-xl border border-surface-gray overflow-hidden p-6 font-mono text-[11px] text-muted-slate space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-2">No system logs available</div>
          ) : (
            logs.map((log) => {
              const formattedTime = new Date(log.createdAt).toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              });
              let logTypeClass = "text-blue-600 font-bold";
              if (log.type === 'ENTRY') logTypeClass = "text-emerald-600 font-bold";
              else if (log.type === 'EXIT') logTypeClass = "text-amber-600 font-bold";
              else if (log.type === 'BLACKLIST_ATTEMPT') logTypeClass = "text-red-600 font-bold";

              return (
                <div key={log.id} className="flex items-start gap-2 border-b border-surface-gray/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-slate shrink-0">
                    [{formattedTime}]
                  </span>
                  <span className={logTypeClass}>
                    {log.type}
                  </span>
                  <span className="flex-1 text-charcoal font-medium">
                    Vehicle <strong className="font-bold font-mono">{log.car?.plateNumber || ''}</strong> {log.description || ''}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Checkout Payment Modal */}
      {checkoutSession && (
        <div className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-sm flex items-start justify-center p-4 pt-12 sm:pt-20">
          <div className="bg-white w-full max-w-md rounded-2xl border border-surface-gray overflow-hidden shadow-2xl animate-modal-dropdown">
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-gray flex items-center justify-between bg-academic-bg/20">
              <h3 className="font-bold text-charcoal text-base">To'lovni tasdiqlash</h3>
              <button 
                onClick={() => setCheckoutSession(null)}
                className="p-1 rounded-lg text-muted-slate hover:bg-surface-gray/50 hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              <div className="p-4 bg-academic-bg border border-surface-gray rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-surface-gray/50 pb-2">
                  <span className="text-[10px] font-bold text-muted-slate uppercase tracking-wider">Avtomobil raqami</span>
                  <p className="text-lg font-bold font-mono text-ranch-red tracking-wide">{checkoutSession.car.plateNumber}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                  <div className="text-muted-slate">Kirgan vaqti:</div>
                  <div className="font-bold text-charcoal text-right">
                    {new Date(checkoutSession.entryTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {checkoutDetails && (
                    <>
                      <div className="text-muted-slate">Bepul kutish vaqti:</div>
                      <div className="font-bold text-charcoal text-right">
                        {checkoutDetails.freeMinutes} daqiqa
                      </div>
                      
                      <div className="text-muted-slate">Ortiqcha turgan vaqti:</div>
                      <div className="font-bold text-ranch-red text-right">
                        {checkoutDetails.overtimeMins} daqiqa
                      </div>
                      
                      <div className="text-muted-slate">Umumiy vaqt:</div>
                      <div className="font-bold text-charcoal text-right">
                        {checkoutDetails.durationMins} daqiqa
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Total Due */}
              <div className="text-center p-4 border border-ranch-red/20 bg-ranch-red/5 rounded-xl">
                <span className="text-xs font-semibold text-muted-slate uppercase tracking-wider">To'lov miqdori</span>
                <p className="text-3xl font-extrabold text-ranch-red mt-1 font-sans">
                  {checkoutAmount.toLocaleString('uz-UZ')} UZS
                </p>
              </div>

              {/* Payment Method Selector */}
              {checkoutAmount > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider">To'lov turi</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`py-3 rounded-lg border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === 'CASH'
                          ? 'border-ranch-red bg-ranch-red/5 text-ranch-red'
                          : 'border-surface-gray hover:bg-academic-bg text-charcoal'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Naqd pul
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`py-3 rounded-lg border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === 'CARD'
                          ? 'border-ranch-red bg-ranch-red/5 text-ranch-red'
                          : 'border-surface-gray hover:bg-academic-bg text-charcoal'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Plastik karta
                    </button>
                  </div>
                </div>
              )}

              {/* Cash Input */}
              {checkoutAmount > 0 && paymentMethod === 'CASH' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted-slate uppercase tracking-wider">Olingan naqd pul miqdori (UZS)</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="masalan, 20000"
                    className="w-full px-4 py-2.5 rounded-lg border border-surface-gray text-sm focus:outline-none focus:border-ranch-red focus:ring-2 focus:ring-ranch-red/20 transition-all font-semibold font-sans"
                  />
                  {parseFloat(cashReceived || 0) > checkoutAmount && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                      Qaytim: {(parseFloat(cashReceived) - checkoutAmount).toLocaleString('uz-UZ')} UZS
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-surface-gray bg-academic-bg/10 flex gap-4">
              <button
                onClick={() => setCheckoutSession(null)}
                className="flex-1 py-3 border border-surface-gray rounded-lg text-sm font-bold hover:bg-academic-bg text-charcoal transition-all"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleManualCheckout}
                disabled={checkoutLoading || (checkoutAmount > 0 && paymentMethod === 'CASH' && parseFloat(cashReceived || 0) < checkoutAmount)}
                className="flex-1 py-3 bg-ranch-red hover:bg-ranch-red/90 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center"
              >
                {checkoutLoading ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  'To\'landi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
