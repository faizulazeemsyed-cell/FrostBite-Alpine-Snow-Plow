import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home, Sparkles } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitToTitle,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 pointer-events-auto select-none">
      <div className="bg-[#131b26] border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3">
          <Sparkles size={24} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-wide mb-1">SHIFT PAUSED</h2>
        <p className="text-xs text-slate-400 mb-6">Take a hot cocoa break or adjust settings</p>

        {/* Buttons List */}
        <div className="w-full space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
          >
            <Play size={18} fill="currentColor" />
            <span>RESUME SHIFT</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
          >
            <RotateCcw size={18} />
            <span>RESTART SHIFT</span>
          </button>

          <button
            onClick={onExitToTitle}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
          >
            <Home size={18} />
            <span>TITLE SCREEN</span>
          </button>
        </div>

        {/* Keymap reminder */}
        <div className="mt-6 pt-4 border-t border-slate-800 w-full text-[11px] text-slate-500 space-y-1 text-left">
          <div className="flex justify-between">
            <span>Steer / Drive:</span>
            <span className="text-slate-300 font-mono-numbers">WASD / Arrow Keys</span>
          </div>
          <div className="flex justify-between">
            <span>Nitro Turbo Jet:</span>
            <span className="text-slate-300 font-mono-numbers">Spacebar</span>
          </div>
          <div className="flex justify-between">
            <span>Truck Horn:</span>
            <span className="text-slate-300 font-mono-numbers">H Key</span>
          </div>
          <div className="flex justify-between">
            <span>Workshop / Upgrades:</span>
            <span className="text-slate-300 font-mono-numbers">B Key</span>
          </div>
        </div>
      </div>
    </div>
  );
};
