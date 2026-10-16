import React from 'react';
import { Trophy, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import { GameStats } from '../types/game';

interface VictoryModalProps {
  stats: GameStats;
  snowClearedPercent: number;
  onContinueFreePlow: () => void;
  onPlayNewShift: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  snowClearedPercent,
  onContinueFreePlow,
  onPlayNewShift,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto select-none">
      <div className="bg-[#131b26] border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-[0_10px_35px_rgba(245,158,11,0.25)] flex flex-col items-center text-center">
        {/* Trophy icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg mb-4 border border-amber-300">
          <Trophy size={32} />
        </div>

        <h2 className="text-3xl font-black text-white tracking-wide mb-1">
          ALPINE ROADS CLEARED!
        </h2>
        <p className="text-sm text-slate-300 max-w-sm mb-6">
          The villagers can safely drive, the school bus can pass, and the bakery is open! Outstanding work, plow master!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 text-left">
          <div className="bg-[#1a2332] border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[11px] font-bold uppercase text-slate-400">Town Cleared</span>
            <div className="font-mono-numbers text-xl font-black text-sky-400 mt-0.5">
              {snowClearedPercent}%
            </div>
          </div>

          <div className="bg-[#1a2332] border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[11px] font-bold uppercase text-slate-400">Coins Collected</span>
            <div className="font-mono-numbers text-xl font-black text-amber-300 mt-0.5">
              ${stats.totalCoinsEarned}
            </div>
          </div>

          <div className="bg-[#1a2332] border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[11px] font-bold uppercase text-slate-400">Max Combo</span>
            <div className="font-mono-numbers text-xl font-black text-orange-400 mt-0.5">
              x{stats.maxCombo.toFixed(1)}
            </div>
          </div>

          <div className="bg-[#1a2332] border border-slate-800 p-3.5 rounded-2xl">
            <span className="text-[11px] font-bold uppercase text-slate-400">Time Taken</span>
            <div className="font-mono-numbers text-xl font-black text-slate-200 mt-0.5">
              {formatTime(stats.timePlayedSeconds)}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onContinueFreePlow}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
          >
            <Sparkles size={18} />
            <span>FREE-PLOW MODE</span>
          </button>

          <button
            onClick={onPlayNewShift}
            className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <RotateCcw size={18} />
            <span>NEW SHIFT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
