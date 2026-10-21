import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BurgoodBrand, BurgoodIcon } from '../components/BurgoodLogo';
import { Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }

    setError('');
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, #0f1f3d 0%, #070c18 75%)'
      }}
    >
      {/* Background ambient glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#0084ff]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Top watermark */}
      <div className="absolute top-8 left-8 hidden md:flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0e1b38] border border-cyan-500/30 p-1.5 flex items-center justify-center text-white">
          <BurgoodIcon className="w-full h-full" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-white text-sm tracking-wider">BURGOOD</span>
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest font-mono">ACCESS CONTROL</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0a1122]/90 backdrop-blur-xl border border-[#15233e] rounded-2xl p-8 shadow-2xl relative z-10 text-white">
        {/* Title & Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#0e1b38] border border-cyan-500/30 p-3 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10 mb-4">
            <BurgoodIcon className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">BURGOOD</h2>
          <p className="text-xs text-cyan-400 font-mono font-semibold uppercase tracking-widest mt-1">
            Access Control System
          </p>
          <p className="text-xs text-slate-400 font-normal mt-2">
            Avtoturargoh va shlagbaum boshqaruv tizimiga kirish
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Foydalanuvchi nomi / Telefon
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masalan, admin"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#070c18] border border-[#15233e] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Maxfiy parol
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#070c18] border border-[#15233e] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#0084ff] focus:ring-2 focus:ring-[#0084ff]/20 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#0084ff] hover:bg-[#0073e6] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#0084ff]/30 flex items-center justify-center disabled:opacity-60 mt-3"
          >
            {submitting ? (
              <>
                <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                Tizimga kirilmoqda...
              </>
            ) : (
              'Tizimga kirish'
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#15233e] flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Xavfsiz ulanish va shifrlangan boshqaruv</span>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500 font-medium">
        © {new Date().getFullYear()} BURGOOD Access Control. Barcha huquqlar himoyalangan.
      </div>
    </div>
  );
};

export default Login;
