import React from 'react';
import { X, Wrench, Check, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import { UPGRADES_LIST } from '../game/upgradesConfig';
import { VehicleUpgrades } from '../types/game';
import { synthAudio } from '../audio/SynthAudio';

interface UpgradesModalProps {
  coins: number;
  upgrades: VehicleUpgrades;
  onUpgrade: (id: keyof VehicleUpgrades, cost: number) => void;
  onClose: () => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  coins,
  upgrades,
  onUpgrade,
  onClose,
}) => {
  const handleUpgrade = (id: keyof VehicleUpgrades, cost: number) => {
    if (coins >= cost) {
      synthAudio.playSectorCompletedSound();
      onUpgrade(id, cost);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 pointer-events-auto">
      <div className="bg-[#131b26] border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-[#1e293b]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wrench size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                ALPINE WORKSHOP & GARAGE
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Tune and outfit your plow truck with winter hydraulics and salt spreaders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Coins badge */}
            <div className="flex items-center gap-2 bg-[#0f172a] border border-slate-700 px-3.5 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate-400">Funds:</span>
              <span className="font-mono-numbers font-black text-amber-300">${coins}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Upgrade Cards List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {UPGRADES_LIST.map((item) => {
            const currentLevel = upgrades[item.id];
            const isMax = currentLevel >= item.maxLevel;
            const nextLevel = currentLevel + 1;
            // Cost index: if current level is 1, next level is 2, index is 0
            const costIndex = currentLevel - (item.id === 'spreaderLevel' || item.id === 'magnetLevel' ? 0 : 1);
            const cost = !isMax && item.costs[costIndex] !== undefined ? item.costs[costIndex] : 0;
            const canAfford = coins >= cost;

            const currentStat = item.levels.find((l) => l.level === currentLevel);
            const nextStat = item.levels.find((l) => l.level === nextLevel);

            return (
              <div
                key={item.id}
                className="bg-[#1a2332] border border-slate-800 hover:border-slate-750 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="font-bold text-white text-base">{item.name}</h3>
                    {/* Level pips */}
                    <div className="flex gap-1 items-center">
                      {Array.from({ length: item.maxLevel }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < currentLevel ? 'bg-amber-400' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-2">{item.description}</p>

                  {/* Current -> Next Stat preview */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-300 font-medium">
                      {currentStat?.title || 'Base'}
                    </span>
                    {!isMax && nextStat && (
                      <>
                        <ArrowRight size={13} className="text-slate-500" />
                        <span className="text-amber-400 font-bold">{nextStat.title}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Upgrade Action Button */}
                <div>
                  {isMax ? (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-xs">
                      <Check size={16} />
                      <span>MAXED</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(item.id, cost)}
                      disabled={!canAfford}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 border-amber-300/40 shadow-lg active:scale-95'
                          : 'bg-slate-800/80 text-slate-500 border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles size={14} />
                      <span>UPGRADE</span>
                      <span className="font-mono-numbers bg-slate-950/20 px-1.5 py-0.5 rounded">
                        ${cost}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#1e293b]/30 flex justify-between items-center text-xs text-slate-400">
          <span>Snow plowed builds combos that reward extra coins!</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Back to Plowing
          </button>
        </div>
      </div>
    </div>
  );
};
