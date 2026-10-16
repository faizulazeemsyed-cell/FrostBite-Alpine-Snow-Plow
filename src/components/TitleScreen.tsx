import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, isMuted, onToggleMute }) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-8 pointer-events-none select-none">
      {/* Top Bar with cozy badge & audio toggle */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2 bg-[#1e293b]/90 border border-slate-700/60 rounded-full px-4 py-1.5 shadow-lg backdrop-blur-none pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="text-xs font-bold tracking-widest text-amber-200 uppercase">
            Pine Valley Alpine District
          </span>
        </div>

        <button
          onClick={onToggleMute}
          className="pointer-events-auto p-2.5 rounded-full bg-[#1e293b]/90 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-lg cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Hero Centerpiece Title Lockup (over 35% negative space) */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="mb-4">
          <svg
            className="w-72 sm:w-96 max-w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            viewBox="0 0 400 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Mountain silhouette backdrop */}
            <path
              d="M30 110 L100 35 L145 75 L200 20 L270 85 L320 45 L370 110 Z"
              fill="#334155"
              fillOpacity="0.4"
            />
            <path
              d="M100 35 L120 52 L105 56 L100 35 Z M200 20 L220 40 L208 45 L200 20 Z"
              fill="#ffffff"
              fillOpacity="0.8"
            />
            {/* FrostBite Text */}
            <text
              x="200"
              y="68"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="48"
              fontWeight="900"
              fontFamily="Outfit, sans-serif"
              letterSpacing="2"
            >
              FROST<tspan fill="#38bdf8">BITE</tspan>
            </text>
            {/* Subtitle Banner */}
            <rect x="85" y="80" width="230" height="24" rx="12" fill="#f97316" />
            <text
              x="200"
              y="96"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="800"
              fontFamily="Outfit, sans-serif"
              letterSpacing="3"
            >
              ALPINE SNOW PLOW
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto mb-8 font-medium drop-shadow-md">
          A fresh blizzard has blanketed the village. Fire up the 4x4 plow truck, clear high street driveways, build huge snow-clearing combos, and upgrade your rig!
        </p>

        {/* Primary Start CTA */}
        <button
          onClick={onStart}
          className="pointer-events-auto group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-lg rounded-2xl shadow-[0_8px_25px_rgba(249,115,22,0.4)] active:scale-95 transition-all cursor-pointer flex items-center gap-3 border border-amber-300/40"
        >
          <Sparkles className="w-5 h-5 text-slate-900 group-hover:rotate-12 transition-transform" />
          <span>START SHIFT</span>
          <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded-md font-mono-numbers text-slate-900">
            SPACE
          </span>
        </button>
      </div>

      {/* Flat Control Hint Line */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-semibold text-slate-400 tracking-wide text-center">
        <span className="bg-[#1e293b]/90 border border-slate-700/60 px-3 py-1 rounded-lg">
          WASD / Arrows to Drive & Steer
        </span>
        <span className="hidden sm:inline text-slate-600">·</span>
        <span className="bg-[#1e293b]/90 border border-slate-700/60 px-3 py-1 rounded-lg">
          Space: Turbo Jet
        </span>
        <span className="hidden sm:inline text-slate-600">·</span>
        <span className="bg-[#1e293b]/90 border border-slate-700/60 px-3 py-1 rounded-lg">
          H: Truck Horn
        </span>
        <span className="hidden sm:inline text-slate-600">·</span>
        <span className="bg-[#1e293b]/90 border border-slate-700/60 px-3 py-1 rounded-lg">
          B: Upgrades Garage
        </span>
        <span className="hidden sm:inline text-slate-600">·</span>
        <span className="bg-[#1e293b]/90 border border-slate-700/60 px-3 py-1 rounded-lg">
          Esc: Pause
        </span>
      </div>
    </div>
  );
};
