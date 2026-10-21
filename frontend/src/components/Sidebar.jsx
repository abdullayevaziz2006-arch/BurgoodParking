import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BurgoodBrand } from './BurgoodLogo';
import { 
  LayoutDashboard, 
  Car, 
  UserCheck, 
  Camera, 
  DollarSign, 
  FileText, 
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const links = [
    { to: '/', name: 'Dashboard', icon: LayoutDashboard },
    { to: '/sessions', name: 'Faol Avtomobillar', icon: Car },
    { to: '/subscribers', name: 'Obunachilar (VIP)', icon: UserCheck },
    { to: '/tariffs', name: 'Tarif Sozlamalari', icon: DollarSign },
    { to: '/devices', name: 'Kameralar & Uskunalar', icon: Camera },
    { to: '/logs', name: 'Tizim Hisobotlari', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-[#0a1122] border-r border-[#15233e] flex flex-col h-screen sticky top-0 shrink-0 text-slate-300 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#15233e]">
        <BurgoodBrand subtitle="ACCESS CONTROL" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
          Boshqaruv menyusi
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive 
                  ? 'bg-[#0084ff] text-white shadow-lg shadow-[#0084ff]/30 font-bold' 
                  : 'text-slate-400 hover:bg-[#121f3a] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                }`} />
                <span className="truncate">{link.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-sm shadow-cyan-300"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Status & User Session Footer */}
      <div className="p-4 border-t border-[#15233e] bg-[#070c18]/60 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
            </div>
            <p className="text-[10px] text-cyan-400/80 truncate uppercase font-mono mt-0.5">
              {user?.role || 'SYSTEM ADMIN'}
            </p>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
            title="Tizimdan chiqish"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
