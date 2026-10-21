import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User, ShieldCheck } from 'lucide-react';
import { BurgoodIcon } from './BurgoodLogo';

const Header = () => {
  const location = useLocation();

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Dashboard', desc: 'Real vaqtdagi monitoring va statistika' };
      case '/sessions':
        return { title: 'Faol Avtomobillar', desc: 'Avtoturargohdagi joriy mashinalar nazorati' };
      case '/subscribers':
        return { title: 'Obunachilar (VIP)', desc: 'Doimiy ruxsatnomaga ega foydalanuvchilar' };
      case '/devices':
        return { title: 'Kameralar va Uskunalar', desc: 'Hikvision ANPR kameralari va rele holati' };
      case '/tariffs':
        return { title: 'Tarif Sozlamalari', desc: 'Soatbay, minutbay va bir martalik to\'lov qoidalari' };
      case '/logs':
        return { title: 'Tizim Hisobotlari', desc: 'Kirish-chiqish seanslari va moliyaviy hisobotlar' };
      default:
        return { title: 'Burgood Boshqaruv Markazi', desc: 'Access Control & Parking Management' };
    }
  };

  const { title, desc } = getPageInfo();

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">{title}</h2>
          
          {/* System Online Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            <span className="text-[11px] font-mono">TIZIM FAOL</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{desc}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Security badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-[#0084ff]" />
          <span>Burgood Guard Active</span>
        </div>

        {/* User profile pill */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-10 h-10 rounded-xl bg-[#0a1122] border border-[#15233e] p-2 flex items-center justify-center shadow-sm">
            <BurgoodIcon className="w-full h-full" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
