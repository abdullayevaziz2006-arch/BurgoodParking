import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Unlock, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const LiveCameraFeed = ({ ip, name, deviceType }) => {
  const [openStatus, setOpenStatus] = useState('idle'); // idle, opening, success, error
  const [closeStatus, setCloseStatus] = useState('idle'); // idle, closing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [streamError, setStreamError] = useState(false);

  const triggerOpen = async () => {
    setOpenStatus('opening');
    setErrorMsg('');
    try {
      const response = await axios.post('/api/manual-open-camera', { ip });
      if (response.data.success) {
        setOpenStatus('success');
      } else {
        throw new Error(response.data.error || 'Qurilma buyruqni qabul qilmadi');
      }
    } catch (err) {
      console.error('Barrier open error:', err);
      setOpenStatus('error');
      setErrorMsg(err.response?.data?.error || err.message || 'Xatolik yuz berdi');
    } finally {
      setTimeout(() => {
        setOpenStatus('idle');
      }, 3000);
    }
  };

  const triggerClose = async () => {
    setCloseStatus('closing');
    setErrorMsg('');
    try {
      const response = await axios.post('/api/manual-close-camera', { ip });
      if (response.data.success) {
        setCloseStatus('success');
      } else {
        throw new Error(response.data.error || 'Qurilma buyruqni qabul qilmadi');
      }
    } catch (err) {
      console.error('Barrier close error:', err);
      setCloseStatus('error');
      setErrorMsg(err.response?.data?.error || err.message || 'Xatolik yuz berdi');
    } finally {
      setTimeout(() => {
        setCloseStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col shadow-sm">
      {/* Camera Viewport Canvas */}
      <div className="relative aspect-[16/9] bg-black flex items-center justify-center group overflow-hidden">
        {/* Blinking LIVE badge in top-left */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span>LIVE</span>
        </div>

        {/* Video feed or fallback placeholder via React state */}
        {streamError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 gap-2">
            <Camera className="w-8 h-8 opacity-40" />
            <p className="text-xs">Camera connection offline</p>
          </div>
        ) : (
          <img
            src={`/api/camera/stream/${ip}`}
            alt={`${name} Stream`}
            className="w-full h-full object-cover"
            onError={() => setStreamError(true)}
          />
        )}
      </div>

      {/* Manual Open / Close Actions Footer */}
      <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-surface-gray">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-charcoal text-sm leading-tight">{name}</h4>
            {deviceType && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                deviceType === 'ENTRY'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-amber-500/10 text-amber-600'
              }`}>
                {deviceType === 'ENTRY' ? 'Kirish' : 'Chiqish'}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-slate font-mono font-medium block mt-0.5">
            {ip}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Open Barrier Button */}
          <button
            onClick={triggerOpen}
            disabled={openStatus !== 'idle'}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center transition-all duration-300 border ${
              openStatus === 'opening'
                ? 'bg-amber-500 border-amber-500 text-white'
                : openStatus === 'success'
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : openStatus === 'error'
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-emerald-50 border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white'
            }`}
            title="Shlagbaumni ochish (35s taymer)"
          >
            {openStatus === 'opening' ? (
              <span className="inline-flex items-center gap-1">
                <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-1"></span>
                <span>Ochilmoqda...</span>
              </span>
            ) : openStatus === 'success' ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                <span>Ochildi</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5 mr-1" />
                <span>Ochish</span>
              </span>
            )}
          </button>

          {/* Close Barrier Button (Emergency / Ehtiyot shart) */}
          <button
            onClick={triggerClose}
            disabled={closeStatus !== 'idle'}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center transition-all duration-300 border ${
              closeStatus === 'closing'
                ? 'bg-amber-500 border-amber-500 text-white'
                : closeStatus === 'success'
                ? 'bg-charcoal border-charcoal text-white'
                : closeStatus === 'error'
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-white border-charcoal text-charcoal hover:bg-charcoal hover:text-white'
            }`}
            title="Ehtiyot shart shlagbaumni yopish"
          >
            {closeStatus === 'closing' ? (
              <span className="inline-flex items-center gap-1">
                <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-1"></span>
                <span>Yopilmoqda...</span>
              </span>
            ) : closeStatus === 'success' ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                <span>Yopildi</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 mr-1" />
                <span>Yopish</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="px-4 pb-3 bg-white text-[10px] text-red-500 text-right font-medium truncate" title={errorMsg}>
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default LiveCameraFeed;
