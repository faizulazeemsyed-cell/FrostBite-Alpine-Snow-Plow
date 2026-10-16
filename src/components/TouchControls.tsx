import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Bell } from 'lucide-react';

interface TouchControlsProps {
  onForward: (pressed: boolean) => void;
  onBackward: (pressed: boolean) => void;
  onLeft: (pressed: boolean) => void;
  onRight: (pressed: boolean) => void;
  onBoost: () => void;
  onHorn: () => void;
  boostReady: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onForward,
  onBackward,
  onLeft,
  onRight,
  onBoost,
  onHorn,
  boostReady,
}) => {
  return (
    <div className="absolute inset-x-0 bottom-16 sm:bottom-20 z-20 pointer-events-none select-none flex justify-between items-end px-6 sm:px-12">
      {/* Left Steering D-Pad */}
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5 w-36 h-36 bg-slate-900/60 p-2 rounded-3xl border border-slate-700/60 backdrop-blur-none">
        <div />
        <button
          onPointerDown={() => onForward(true)}
          onPointerUp={() => onForward(false)}
          onPointerLeave={() => onForward(false)}
          className="bg-slate-800 active:bg-amber-500 active:text-slate-950 text-slate-200 rounded-xl flex items-center justify-center font-bold touch-none select-none"
        >
          <ArrowUp size={20} />
        </button>
        <div />

        <button
          onPointerDown={() => onLeft(true)}
          onPointerUp={() => onLeft(false)}
          onPointerLeave={() => onLeft(false)}
          className="bg-slate-800 active:bg-amber-500 active:text-slate-950 text-slate-200 rounded-xl flex items-center justify-center font-bold touch-none select-none"
        >
          <ArrowLeft size={20} />
        </button>
        <div />
        <button
          onPointerDown={() => onRight(true)}
          onPointerUp={() => onRight(false)}
          onPointerLeave={() => onRight(false)}
          className="bg-slate-800 active:bg-amber-500 active:text-slate-950 text-slate-200 rounded-xl flex items-center justify-center font-bold touch-none select-none"
        >
          <ArrowRight size={20} />
        </button>

        <div />
        <button
          onPointerDown={() => onBackward(true)}
          onPointerUp={() => onBackward(false)}
          onPointerLeave={() => onBackward(false)}
          className="bg-slate-800 active:bg-amber-500 active:text-slate-950 text-slate-200 rounded-xl flex items-center justify-center font-bold touch-none select-none"
        >
          <ArrowDown size={20} />
        </button>
        <div />
      </div>

      {/* Right Action Buttons */}
      <div className="pointer-events-auto flex flex-col gap-3">
        <button
          onClick={onHorn}
          className="w-14 h-14 bg-slate-850 border border-slate-700 active:bg-amber-400 active:text-slate-950 text-amber-300 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all touch-none"
          title="Horn (H)"
        >
          <Bell size={22} />
        </button>

        <button
          onClick={onBoost}
          disabled={!boostReady}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all touch-none border ${
            boostReady
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400 active:scale-95'
              : 'bg-slate-800 text-slate-500 border-slate-700'
          }`}
          title="Nitro Boost (Space)"
        >
          <Zap size={26} className={boostReady ? 'text-amber-300' : ''} />
        </button>
      </div>
    </div>
  );
};
