import React, { useState } from 'react';
import { Volume2, VolumeX, Pause, Wrench, Zap, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { ComboState, VehicleUpgrades, TownSector } from '../types/game';

interface HUDProps {
  speed: number;
  maxSpeed: number;
  coins: number;
  snowClearedPercent: number;
  combo: ComboState;
  upgrades: VehicleUpgrades;
  boostReady: boolean;
  boostProgress: number;
  activeSector: TownSector | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGarage: () => void;
  onPause: () => void;
  onTriggerHorn: () => void;
  onTriggerBoost: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  speed,
  maxSpeed,
  coins,
  snowClearedPercent,
  combo,
  upgrades,
  boostReady,
  boostProgress,
  activeSector,
  isMuted,
  onToggleMute,
  onOpenGarage,
  onPause,
  onTriggerHorn,
  onTriggerBoost,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Status Bar: Perimeter Clusters */}
      <div className="flex justify-between items-start w-full gap-4">
        {/* Left Cluster: Speed & Town Snow Progress */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Speedometer card */}
          <div className="flex items-center gap-3 bg-[#1e293b]/95 border border-slate-700/70 px-4 py-2.5 rounded-2xl shadow-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Plow Speed
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono-numbers text-2xl font-black text-amber-400">
                  {speed}
                </span>
                <span className="text-xs font-semibold text-slate-400">km/h</span>
              </div>
            </div>
            {/* Speed bar meter */}
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, (speed / Math.max(1, maxSpeed)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Town Snow Cleared Progress */}
          <div className="bg-[#1e293b]/95 border border-slate-700/70 px-4 py-2 rounded-2xl shadow-xl min-w-[190px]">
            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
              <span className="text-slate-300">Town Cleared</span>
              <span className="font-mono-numbers text-sky-300">{snowClearedPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${snowClearedPercent}%` }}
              />
            </div>
            {activeSector && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[130px]">{activeSector.name}</span>
                <span className="font-mono-numbers text-amber-300">{activeSector.clearedPercent}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Dynamic Combo Multiplier Gauge (Pops when combo active) */}
        {combo.count > 0 && (
          <div className="pointer-events-auto flex flex-col items-center animate-bounce-short">
            <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-slate-950 px-5 py-2 rounded-2xl shadow-[0_6px_20px_rgba(245,158,11,0.45)] border border-amber-300/60 flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider">{combo.tierName}</span>
              <span className="font-mono-numbers text-xl font-black bg-slate-950/20 px-2 py-0.5 rounded-lg">
                x{combo.multiplier.toFixed(1)}
              </span>
            </div>
            {/* Combo timer countdown bar */}
            <div className="w-28 h-1.5 bg-slate-800/80 rounded-full mt-1 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-75"
                style={{ width: `${Math.min(100, (combo.timer / combo.maxTimer) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Right Cluster: Coins, Lost Items & Menu Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Coins Badge */}
          <div className="flex items-center gap-2 bg-[#1e293b]/95 border border-slate-700/70 px-4 py-2.5 rounded-2xl shadow-xl">
            <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-slate-950 shadow-inner">
              $
            </div>
            <span className="font-mono-numbers font-black text-lg text-amber-300">
              {coins}
            </span>
          </div>

          {/* Audio toggle button */}
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-[#1e293b]/95 border border-slate-700/70 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-xl cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Pause button */}
          <button
            onClick={onPause}
            className="p-2.5 rounded-xl bg-[#1e293b]/95 border border-slate-700/70 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-xl cursor-pointer"
            title="Pause Game (Esc)"
          >
            <Pause size={18} />
          </button>
        </div>
      </div>

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion in Center) */}
      <div className="mx-auto flex flex-col items-center pointer-events-auto transition-transform duration-300">
        {/* Toggle Collapse Pill */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1.5 px-3 py-1 bg-[#1e293b]/90 border border-slate-700/70 rounded-full text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-lg cursor-pointer hover:bg-slate-800"
        >
          <span>{isDockCollapsed ? 'Show Dock' : 'Hide Dock'}</span>
          {isDockCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Dock Container */}
        {!isDockCollapsed && (
          <div className="bg-[#1e293b]/95 border border-slate-700/70 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-full">
            {/* Boost Jet Button */}
            <button
              onClick={onTriggerBoost}
              disabled={!boostReady}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                boostReady
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)] active:scale-95'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <Zap size={16} className={boostReady ? 'text-amber-300' : ''} />
              <span>NITRO JET</span>
              <span className="text-[10px] bg-slate-950/30 px-1.5 py-0.5 rounded font-mono-numbers">
                SPACE
              </span>
            </button>

            {/* Truck Horn Button */}
            <button
              onClick={onTriggerHorn}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Bell size={16} />
              <span>HORN</span>
              <span className="text-[10px] bg-slate-950/30 px-1.5 py-0.5 rounded font-mono-numbers text-slate-400">
                H
              </span>
            </button>

            {/* Quick Upgrade Level Pips */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-300">
              <span className="font-semibold text-slate-400">Plow Tier:</span>
              <span className="font-bold text-amber-400">Blade L{upgrades.bladeLevel}</span>
              <span className="text-slate-600">·</span>
              <span className="font-bold text-sky-400">Eng L{upgrades.engineLevel}</span>
              <span className="text-slate-600">·</span>
              <span className="font-bold text-emerald-400">Treads L{upgrades.treadsLevel}</span>
            </div>

            {/* Open Garage Button */}
            <button
              onClick={onOpenGarage}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all shadow-[0_4px_14px_rgba(245,158,11,0.3)] active:scale-95 cursor-pointer border border-amber-300/40"
            >
              <Wrench size={16} />
              <span>COZY GARAGE</span>
              <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono-numbers text-slate-950">
                B
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
