import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Car, 
  Search, 
  Filter, 
  DollarSign, 
  CreditCard, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Clock
} from 'lucide-react';

const ActiveCars = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, SUBSCRIBERS, REGULAR
  
  // Checkout modal state
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutDetails, setCheckoutDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch active sessions
  const fetchSessions = async () => {
    try {
      const response = await axios.get('/api/sessions');
      // Filter for active sessions only
      const active = response.data.filter(s => s.status === 'ACTIVE');
      setSessions(active);
    } catch (err) {
      console.error('Error fetching active sessions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Set up Socket.io for live updates
    const socket = io(window.location.origin);
    
    socket.on('car_entry', () => {
      fetchSessions();
    });

    socket.on('car_exit', () => {
      fetchSessions();
    });

    socket.on('checkout_request', (data) => {
      console.log('ActiveCars page: Automated checkout request received:', data);
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
      fetchSessions();
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

  // Estimate fee locally
  const estimateFee = (entryTime, isSubscriber, tariff) => {
    if (isSubscriber) return 0;
    if (!tariff) return 0;
    
    const diffMs = new Date() - new Date(entryTime);
    const diffMins = Math.ceil(diffMs / 60000);
    
    let billableMins = diffMins - tariff.freeMinutes;
    if (billableMins <= 0) return 0;
    
    let fee = billableMins * tariff.pricePerMin;
    if (tariff.maxDaily && fee > tariff.maxDaily) fee = tariff.maxDaily;
    
    return fee;
  };

  const [currentTariff, setCurrentTariff] = useState(null);

  useEffect(() => {
    // Fetch tariff details for real-time local calculations
    axios.get('/api/tariff')
      .then(res => setCurrentTariff(res.data))
      .catch(err => console.error('Error fetching tariff info:', err));
  }, []);

  const handleCheckoutOpen = async (session) => {
    try {
      const isSub = session.car.isSubscriber && session.car.subscriberEnd && new Date(session.car.subscriberEnd) > new Date();
      const fee = estimateFee(session.entryTime, isSub, currentTariff);
      
      const freeMinutes = (isSub || !currentTariff) ? 0 : currentTariff.freeMinutes;
      const diffMs = new Date() - new Date(session.entryTime);
      const diffMins = Math.ceil(diffMs / 60000);

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
      console.error('Error setting checkout session:', err);
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
          alert("Received cash amount cannot be less than the total amount!");
          setCheckoutLoading(false);
          return;
        }
        
        await axios.post('/api/payment/cash', {
          sessionId: checkoutSession.id,
          fee: checkoutAmount,
          insertedAmount: received
        });
      } else {
        await axios.post('/api/payment/terminal', {
          sessionId: checkoutSession.id,
          amount: checkoutAmount
        });
      }
      
      // Auto open barrier for manual checkout
      await axios.post('/api/barrier/open');
      
      setCheckoutSession(null);
      fetchSessions();
    } catch (err) {
      console.error('Checkout error:', err);
      alert('An error occurred during checkout: ' + (err.response?.data?.error || err.message));
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Filtered and searched sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.car.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isSub = session.car.isSubscriber && session.car.subscriberEnd && new Date(session.car.subscriberEnd) > new Date();
    const matchesFilter = 
      filterType === 'ALL' || 
      (filterType === 'SUBSCRIBERS' && isSub) || 
      (filterType === 'REGULAR' && !isSub);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-academic-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-ranch-red border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-academic-bg space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-charcoal flex items-center gap-2">
            <Car className="w-6 h-6 text-ranch-red" />
            Active Parking Sessions
          </h2>
          <p className="text-xs text-muted-slate mt-1">
            Currently monitoring {sessions.length} vehicles inside the parking lot.
          </p>
        </div>

        {/* Action controls (Filters & Search) */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by license plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 pl-9 pr-4 py-2 border border-surface-gray rounded-lg bg-white text-xs font-semibold focus:outline-none focus:border-ranch-red transition-all"
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative flex items-center">
            <Filter className="w-4 h-4 text-muted-slate absolute left-3 pointer-events-none" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-9 pr-8 py-2 border border-surface-gray rounded-lg bg-white text-xs font-bold text-charcoal appearance-none focus:outline-none focus:border-ranch-red cursor-pointer transition-all"
            >
              <option value="ALL">All Vehicles</option>
              <option value="SUBSCRIBERS">Subscribers</option>
              <option value="REGULAR">Regular Visitors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-surface-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-academic-bg/40 border-b border-surface-gray text-[10px] font-bold text-muted-slate uppercase tracking-wider">
                <th className="py-4 px-6">License Plate</th>
                <th className="py-4 px-6">Entry Time</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Accumulated Fee</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-gray text-sm font-medium">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted-slate text-xs font-semibold">
                    No active sessions match the search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const isSub = session.car.isSubscriber && session.car.subscriberEnd && new Date(session.car.subscriberEnd) > new Date();
                  const fee = estimateFee(session.entryTime, isSub, currentTariff);

                  return (
                    <tr key={session.id} className="hover:bg-academic-bg/30 transition-colors">
                      {/* Plate Number */}
                      <td className="py-4 px-6 font-mono font-bold text-charcoal tracking-wide flex items-center gap-2">
                        {session.car.plateNumber}
                        {isSub ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold uppercase">
                            Subscriber
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-semibold uppercase">
                            Regular
                          </span>
                        )}
                      </td>

                      {/* Entry Time */}
                      <td className="py-4 px-6 text-muted-slate text-xs">
                        <span className="block font-semibold text-charcoal">
                          {new Date(session.entryTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                        <span className="block text-[10px] text-muted-slate mt-0.5">
                          {new Date(session.entryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-6 text-muted-slate text-xs flex items-center gap-1.5 mt-2">
                        <Clock className="w-3.5 h-3.5 text-muted-slate" />
                        <span>{formatDuration(session.entryTime)}</span>
                      </td>

                      {/* Accumulated Fee */}
                      <td className="py-4 px-6 font-sans text-xs">
                        {isSub ? (
                          <span className="text-emerald-600 font-bold">Free (Sub)</span>
                        ) : (
                          <span className="text-charcoal font-bold font-sans">
                            {fee.toLocaleString('uz-UZ')} UZS
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleCheckoutOpen(session)}
                          className="px-3.5 py-1.5 bg-ranch-red text-white hover:bg-ranch-red/90 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Checkout / Release
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

export default ActiveCars;
