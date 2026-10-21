import React from 'react';
import burgoodLogo from '../assets/burgood-logo.png';
import burgoodSquare from '../assets/burgood-square.png';

export const BurgoodIcon = ({ className = "w-7 h-7" }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <img 
      src={burgoodLogo} 
      alt="Burgood Logo" 
      className="w-full h-full object-contain filter drop-shadow-[0_2px_10px_rgba(0,132,255,0.45)]"
    />
  </div>
);

export const BurgoodBrand = ({ subtitle = "ACCESS CONTROL" }) => (
  <div className="flex items-center gap-3">
    <div className="w-11 h-11 rounded-xl bg-[#0e1b38] border border-cyan-500/30 p-2 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
      <img 
        src={burgoodLogo} 
        alt="Burgood" 
        className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,132,255,0.5)]" 
      />
    </div>
    <div className="flex flex-col">
      <span className="font-extrabold text-white tracking-wider text-lg leading-none font-sans">
        BURGOOD
      </span>
      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest leading-none mt-1.5 font-mono">
        {subtitle}
      </span>
    </div>
  </div>
);

export default BurgoodBrand;
